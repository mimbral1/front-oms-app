// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/CalculadoraMargenModal.tsx
//
// Modal de calculadora de margen para usar inline en el wizard de Publicar.
//
// Reemplaza la página standalone `CalculadoraMargenView` cuando el usuario está
// publicando — abre desde el botón con ícono <Calculator> al lado del input
// "Precio venta" en Step1.
//
// Datos:
//   - SKU + categoría + dimensiones + peso: del state del wizard (autocompletado)
//   - Costo: lo resuelve el backend desde SAP (vista-previa AvgPrice)
//   - Margen / Precio: ambos editables (bidireccional)
//
// Flujo bidireccional:
//   - Editar MARGEN % → call backend con margen_objetivo → setea precio + desglose
//   - Editar PRECIO   → cálculo client-side usando el desglose cacheado:
//                       utilidad = precio − comisión − iva − envío − costo − fixedFee
//                       margenEf = utilidad / costo
//
// Al confirmar: aplica el precio actual al state.ml.price y cierra el modal.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator as CalculatorIcon, Loader2, X } from "lucide-react";

import { useAuth } from "@/app/context/auth/AuthContext";
import {
    calcularPrecioSugerido,
    calcularPrecioSugeridoFala,
    CalculadoraError,
    type CalculadoraPrecioResponse,
    type CalculadoraShippingConfig,
} from "@/features/catalogo/services/calculadoraMargen";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Formatea un número como CLP. "−" si no hay dato. */
function clp(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(Number(n));
}

/** Lee inputs humanos tipo "1,8", "1.800,5" o "30" como número positivo. */
export function parseDecimalInput(raw: unknown): number | null {
    if (raw == null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) && raw > 0 ? raw : null;
    }
    const value = String(raw).trim().replace(/\s/g, "");
    if (!value) return null;
    const normalized = value.includes(",")
        ? value.replace(/\./g, "").replace(",", ".")
        : value;
    const num = Number(normalized);
    return Number.isFinite(num) && num > 0 ? num : null;
}

/** Lee inputs de margen: permite negativos para simular ventas bajo costo. */
function parseSignedDecimalInput(raw: unknown): number | null {
    if (raw == null) return null;
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? raw : null;
    }
    const value = String(raw).trim().replace(/\s/g, "");
    if (!value) return null;
    const normalized = value.includes(",")
        ? value.replace(/\./g, "").replace(",", ".")
        : value;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
}

/** Convierte "1.5 kg" / "30 cm" → número en unidad base (kg | cm).
 *  Si el shape es `{ number, unit }`, lee ahí. Si es string suelto, parsea. */
function valueToNumber(
    raw: unknown,
    kind: "length" | "weight",
): number | null {
    if (raw == null) return null;

    // shape number_unit { number, unit }
    if (typeof raw === "object" && raw !== null && "number" in (raw as object)) {
        const { number, unit } = raw as { number?: number | string | null; unit?: string };
        const n = parseDecimalInput(number);
        if (n == null) return null;
        const u = String(unit ?? "").toLowerCase();
        if (kind === "length") {
            if (u === "mm") return n / 10;
            if (u === "m") return n * 100;
            if (u === "in") return n * 2.54;
            return n; // cm o sin unidad
        }
        // weight
        if (u === "g") return n / 1000;
        if (u === "lb") return n * 0.4536;
        if (u === "oz") return n * 0.02835;
        return n; // kg
    }

    // string o número suelto
    const s = String(raw).trim();
    if (!s) return null;
    const m = s.match(/^([\d.,]+)\s*([a-zA-Z]+)?/);
    if (!m) return null;
    const num = parseDecimalInput(m[1]);
    if (num == null) return null;
    const unit = (m[2] || "").toLowerCase();
    if (kind === "length") {
        if (unit === "mm") return num / 10;
        if (unit === "m") return num * 100;
        if (unit === "in") return num * 2.54;
        return num;
    }
    if (unit === "g") return num / 1000;
    if (unit === "lb") return num * 0.4536;
    if (unit === "oz") return num * 0.02835;
    return num;
}

const TH_LOW_CLP = 9990;
const TH_HIGH_CLP = 19990;

function selectShippingBand(
    precio: number,
    bands: CalculadoraShippingConfig["envios_free_bandas"],
    fallback: number,
): number {
    if (!bands) return fallback;
    if (precio < TH_LOW_CLP) return Number(bands.low ?? fallback ?? 0);
    if (precio < TH_HIGH_CLP) {
        return Number(bands.mid ?? bands.low ?? fallback ?? 0);
    }
    return Number(bands.high ?? bands.mid ?? fallback ?? 0);
}

/**
 * Elige el envío (CLP) a usar para un precio dado.
 *
 * El backend ML deriva free_shipping de un umbral de 19.990 CLP y expone
 * AMBOS escenarios, con bandas LOW/MID/HIGH cuando puede cotizar por item_id.
 * Cuando el usuario edita el precio, el envío debe moverse por escenario y
 * por banda: < 9.990, 9.990-19.989 y >= 19.990.
 *
 * Si el backend NO expone ambos escenarios + umbral (path de dimensiones, o
 * Falabella), caemos al `fallbackEnvio` (el `envio_clp` del desglose, que es el
 * comportamiento previo).
 */
function envioParaPrecio(
    precio: number,
    ship?: CalculadoraShippingConfig | null,
    fallbackEnvio?: number,
): number {
    const min = ship?.free_shipping_min_clp;
    const free = ship?.envio_free_clp;
    const noFree = ship?.envio_no_free_clp;
    const freeBands = ship?.envios_free_bandas;
    const noFreeBands = ship?.envios_no_free_bandas;
    // Si el backend expone ambos escenarios + umbral, elige por umbral.
    if (min != null && free != null && noFree != null) {
        return precio >= min
            ? selectShippingBand(precio, freeBands, Number(free))
            : selectShippingBand(precio, noFreeBands, Number(noFree));
    }
    // Fallback: el envío del desglose (comportamiento previo / path dims sin ambos escenarios).
    return fallbackEnvio ?? 0;
}

/**
 * Calcula el margen efectivo CLIENT-SIDE dado un precio y el desglose cacheado
 * (que vino del backend con tasa_comision_pct / iva_pct / envio_clp / costo).
 *
 * Fórmula EXACTA del backend (`meli-catalog-service/.../use-case.js` línea 163):
 *
 *   comisión = precio × tasa_comision + fixed_fee
 *   utilidad = (precio − comisión − envío) / IVA_MULT − costo
 *   margen   = utilidad / costo
 *
 *   donde IVA_MULT = 1 + iva_pct/100 = 1.19 para Chile
 *
 * La división por 1.19 representa el IVA débito que el seller paga al SII:
 * todo lo que entra "con IVA del precio" (comisión, envío, lo que queda al
 * seller) se normaliza a "sin IVA" antes de comparar con el costo SAP (que
 * es sin IVA).
 *
 * Bug histórico (Mayo 2026): la versión inicial restaba comisión/envío SIN
 * dividir por 1.19, lo que subestimaba la utilidad ~16%.
 */
export function calcMargenLocal(
    precio: number,
    desglose: CalculadoraPrecioResponse["desglose"],
    ship?: CalculadoraShippingConfig | null,
): { utilidad: number; margenPct: number; comision: number; ivaDebito: number } | null {
    if (!desglose) return null;
    const costo = Number(desglose.costo_avgprice);
    // Elige el envío por umbral (19.990) si el backend expone ambos escenarios;
    // sino cae al envio_clp del desglose (comportamiento previo).
    const envio = Number(
        envioParaPrecio(precio, ship, Number(desglose.envio_clp ?? 0)),
    );
    const fixed = Number(desglose.fixed_fee ?? 0);
    // tasa_comision_pct viene como PORCENTAJE 0-100 (ej. 13 = 13%).
    const comisionFrac = Number(desglose.tasa_comision_pct ?? 0) / 100;
    const ivaPct = Number(desglose.iva_pct ?? 19);
    if (!Number.isFinite(costo) || costo <= 0) return null;
    if (!Number.isFinite(precio) || precio <= 0) return null;

    const IVA_MULT = 1 + ivaPct / 100; // 1.19 en CL
    const comision = precio * comisionFrac + fixed;
    // (precio − comisión − envío) está "con IVA"; ÷ 1.19 lo normaliza a "sin IVA"
    const ingresoNetoSinIva = (precio - comision - envio) / IVA_MULT;
    const utilidad = ingresoNetoSinIva - costo;
    const margenPct = (utilidad / costo) * 100;
    // IVA débito ≈ diferencia entre "ingreso con IVA" e "ingreso sin IVA"
    const ivaDebito = (precio - comision - envio) - ingresoNetoSinIva;
    return { utilidad, margenPct, comision, ivaDebito };
}

// ── tipo del state del wizard que el modal lee (subset) ──────────────────────

export interface CalculadoraModalSnapshot {
    sku: string;
    /** ID de categoría ML (MLC...). El backend lo prioriza sobre cascade. */
    categoryId?: string | null;
    /** item_id ML (MLC...) de la publicación existente. Si viene, el envío sale
     *  del item_id (sin dims) y se oculta el bloque de dimensiones. */
    itemId?: string | null;
    /** Precio actual del state, para calcular el margen inicial. */
    currentPrice: number;
    /** Precio publicado/oferta de la publicación existente (item_id), para que el
     *  backend cotice el envío FULL al precio real. Solo ML. */
    itemPrice?: number;
    /** Shape number_unit del state.ml.attrs (SELLER_PACKAGE_*). */
    largoRaw: unknown;
    anchoRaw: unknown;
    altoRaw: unknown;
    pesoRaw: unknown;
}

export interface CalculadoraMargenModalProps {
    open: boolean;
    snapshot: CalculadoraModalSnapshot;
    /**
     * Canal del producto. "ml" (default) usa la calculadora ML (API de envíos
     * ML); "fala" usa la Falabella (comisión por categoría + cofinanciamiento
     * con peso volumétrico). Cambia el endpoint y los labels del desglose.
     */
    marketplace?: "ml" | "fala";
    /**
     * Si true, dims/categoría dejan de ser obligatorias: el backend las resuelve
     * (ML: dims desde SELLER_PACKAGE_*; categoría desde cascade). Lo usa la lista
     * de la calculadora, donde abrimos con solo el SKU + precio publicado.
     * Default false → wizard/editor conservan la validación estricta de siempre.
     */
    allowBackendDims?: boolean;
    /** Margen % inicial (ej. 30 para 0.30). Precarga desde carga-masiva
     *  (mapped_json.margen × 100). Default DEFAULT_MARGEN_PCT. */
    initialMargenPct?: number;
    onClose: () => void;
    /** Callback al confirmar — recibe el precio final (con .990 si aplica). */
    onConfirm: (precio: number) => void;
}

const DEFAULT_MARGEN_PCT = 6;

// ── CalculadoraMargenPanel ────────────────────────────────────────────────────
//
// Renderiza el BODY de la calculadora (todo excepto el overlay del modal y el
// header con título/X). Reutilizable inline en la vista standalone.

export interface CalculadoraMargenPanelProps {
    snapshot: CalculadoraModalSnapshot;
    marketplace?: "ml" | "fala";
    allowBackendDims?: boolean;
    initialMargenPct?: number;
    onConfirm?: (
        precio: number,
        meta?: { margenPct: number | null; utilidad: number | null },
    ) => void;
    showConfirm?: boolean;
    confirmLabel?: string;
}

export function CalculadoraMargenPanel({
    snapshot,
    marketplace = "ml",
    allowBackendDims = false,
    initialMargenPct,
    onConfirm,
    showConfirm = true,
    confirmLabel,
}: CalculadoraMargenPanelProps) {
    const mpLabel = marketplace === "fala" ? "Falabella" : "ML";
    const { token } = useAuth();

    // ── State ─────────────────────────────────────────────────────────────
    const [margenInput, setMargenInput] = useState<string>(
        String(initialMargenPct ?? DEFAULT_MARGEN_PCT),
    );
    const [precioInput, setPrecioInput] = useState<string>("");
    /**
     * Dimensiones EDITABLES del paquete. Vienen pre-llenadas desde el
     * snapshot (item ML con shipping.dimensions configurado) o vacías si
     * el item no las tiene declaradas. El user puede editarlas siempre.
     *
     * Bug histórico (corregido 2026-05-20): antes la validación leía
     * directamente snapshot.xxxRaw, lo que significaba que si el item no
     * tenía dims (ej. Editor con SKU 002008146), no había forma de
     * calcular en absoluto. Ahora el user las puede completar manualmente.
     */
    const [dimsInput, setDimsInput] = useState<{
        largo: string;
        ancho: string;
        alto: string;
        peso: string;
    }>({ largo: "", ancho: "", alto: "", peso: "" });
    /** Última call al backend — con esto calculamos margen local cuando el user edita el precio. */
    const [lastResp, setLastResp] = useState<CalculadoraPrecioResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Guard anti-loop: el auto-cálculo corre UNA sola vez por apertura. Sin esto,
    // si el backend devuelve error/429 (lastResp queda null), el effect —que
    // depende de `loading`— se re-dispara en bucle → tormenta de requests → 429
    // en cascada. El recálculo manual (margen/dims onBlur) NO usa este guard.
    const [autoCalcTried, setAutoCalcTried] = useState(false);

    /**
     * Pre-validación: necesitamos los 3 dims + peso + categoría + sku.
     * Los dims vienen de dimsInput (editable) — el snapshot solo se usa
     * para pre-llenarlos al abrir.
     */
    const validation = useMemo(() => {
        const issues: string[] = [];
        if (!snapshot.sku) issues.push("Falta SKU del producto.");
        const largo = parseDecimalInput(dimsInput.largo);
        const ancho = parseDecimalInput(dimsInput.ancho);
        const alto = parseDecimalInput(dimsInput.alto);
        const peso = parseDecimalInput(dimsInput.peso);
        // En modo backend-dims (lista) NO bloqueamos por categoría/dims: el backend
        // los resuelve (cascade + SELLER_PACKAGE_*). Wizard/editor siguen estrictos.
        // La relajación por item_id es SOLO ML: ahí el backend resuelve el envío
        // por item_id (shipping_options) sin dims. Falabella NO tiene API de envío
        // (usa peso volumétrico de planilla local) → SIEMPRE exige dims aunque el
        // producto tenga item_id. Sin este gate, el auto-cálculo Falabella dispara
        // sin dims y el backend responde 'dimensiones/peso_kg required'.
        // CATEGORÍA: el backend la resuelve por cascade (P0-P5) cuando hay una
        // publicación existente (itemId) o en modo lista (allowBackendDims) —
        // tanto ML (resolveMlCategoria) como Falabella (resolveFalaCategoria).
        // Solo se exige en el wizard (producto nuevo, sin itemId), donde el
        // usuario la elige en el paso de categoría.
        const categoriaResuelta = allowBackendDims || !!snapshot.itemId;
        // DIMS: ML+itemId resuelve el envío por item_id (sin dims). Falabella
        // SIEMPRE necesita dims (no tiene API de envío; usa peso volumétrico de
        // planilla local), aunque el producto tenga itemId.
        const dimsResueltas = allowBackendDims || (marketplace === "ml" && snapshot.itemId);
        if (!categoriaResuelta && !snapshot.categoryId)
            issues.push("Elige una categoría antes de calcular.");
        if (!dimsResueltas) {
            if (!largo || !ancho || !alto)
                issues.push("Completa Largo / Ancho / Alto del paquete.");
            if (!peso) issues.push("Completa el Peso del paquete.");
        }
        return { issues, largo, ancho, alto, peso };
    }, [snapshot.sku, snapshot.categoryId, snapshot.itemId, dimsInput, allowBackendDims, marketplace]);

    // ── Lógica de cálculo ────────────────────────────────────────────────

    async function callBackend(
        margenPctValue: number,
        opts?: { preserveCurrentPrice?: boolean },
    ) {
        if (validation.issues.length > 0) return;
        setLoading(true);
        setError(null);
        try {
            // dims/peso: solo se incluyen si el user los completó. Si faltan y
            // allowBackendDims está activo (o hay item_id), se omiten y el backend
            // los resuelve del ítem (SELLER_PACKAGE_* o por item_id).
            // JSON.stringify descarta los undefined.
            const hasAllDims = !!(validation.largo && validation.ancho && validation.alto);
            const dimsPart =
                hasAllDims
                    ? {
                          dimensiones: {
                              largo: validation.largo!,
                              ancho: validation.ancho!,
                              alto: validation.alto!,
                          },
                      }
                    : {};
            const pesoPart = validation.peso != null ? { peso_kg: validation.peso } : {};
            const resp =
                marketplace === "fala"
                    ? await calcularPrecioSugeridoFala(
                          {
                              sku: snapshot.sku,
                              margen_objetivo: margenPctValue / 100,
                              ...dimsPart,
                              ...pesoPart,
                              ...(snapshot.categoryId
                                  ? { fala_category_id: snapshot.categoryId }
                                  : {}),
                          },
                          token,
                      )
                    : await calcularPrecioSugerido(
                          {
                              sku: snapshot.sku,
                              margen_objetivo: margenPctValue / 100,
                              ...dimsPart,
                              ...pesoPart,
                              ...(snapshot.categoryId
                                  ? { categoria_override: snapshot.categoryId }
                                  : {}),
                              ...(snapshot.itemId ? { item_id: snapshot.itemId } : {}),
                              ...(snapshot.itemPrice != null && snapshot.itemPrice > 0
                                  ? { item_price: snapshot.itemPrice }
                                  : {}),
                          },
                          token,
                      );
            setLastResp(resp);
            // Si las dims las resolvió el backend (no las teníamos en el form),
            // las pintamos en los inputs para que el user las vea / edite. El
            // use-case ML las devuelve en `inputs_resueltos.{dimensiones,peso_kg}`.
            if (!hasAllDims) {
                const ir = (resp as { inputs_resueltos?: Record<string, unknown> })
                    .inputs_resueltos;
                const d = ir?.dimensiones as
                    | { largo?: number; ancho?: number; alto?: number }
                    | undefined;
                const pesoResuelto = ir?.peso_kg as number | undefined;
                if (d) {
                    setDimsInput({
                        largo: d.largo != null ? String(d.largo) : "",
                        ancho: d.ancho != null ? String(d.ancho) : "",
                        alto: d.alto != null ? String(d.alto) : "",
                        peso: pesoResuelto != null ? String(pesoResuelto) : "",
                    });
                }
            }
            if (opts?.preserveCurrentPrice && snapshot.currentPrice > 0) {
                // Apertura desde el editor: mantenemos el PRECIO PUBLICADO actual y
                // mostramos el margen que ESE precio da — NO pisamos con la sugerencia
                // del margen default (ese era el bug: 13.990 publicado → 6.990 sugerido).
                const cp = Math.round(snapshot.currentPrice);
                setPrecioInput(String(cp));
                const local = calcMargenLocal(cp, resp.desglose, resp.shipping_config);
                if (local && Number.isFinite(local.margenPct)) {
                    setMargenInput(local.margenPct.toFixed(2));
                }
            } else {
                const precioFinal = resp.precio_redondeado_990 ?? resp.precio_sugerido;
                setPrecioInput(String(Math.round(precioFinal)));
            }
        } catch (err) {
            if (err instanceof CalculadoraError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error desconocido al calcular");
            }
        } finally {
            setLoading(false);
        }
    }

    // ── Hidratación inicial ───────────────────────────────────────────────
    //
    // (1) Pre-llenar dimsInput desde el snapshot. Si el item ML tiene
    //     shipping.dimensions configuradas (`snapshot.xxxRaw != null`),
    //     se ven los valores. Si no, queda vacío para que el user complete.
    // (2) Pre-llenar precioInput SIEMPRE con currentPrice (independiente
    //     de si hay issues de validación). El user ve el precio actual del
    //     wizard/editor aunque falten dims — bug histórico corregido.
    // (3) Limpiar resultado anterior + error.
    useEffect(() => {
        const fromSnap = (raw: unknown, kind: "length" | "weight"): string => {
            const n = valueToNumber(raw, kind);
            return n != null && n > 0 ? String(n) : "";
        };
        setDimsInput({
            largo: fromSnap(snapshot.largoRaw, "length"),
            ancho: fromSnap(snapshot.anchoRaw, "length"),
            alto: fromSnap(snapshot.altoRaw, "length"),
            peso: fromSnap(snapshot.pesoRaw, "weight"),
        });

        setPrecioInput(
            snapshot.currentPrice > 0
                ? String(Math.round(snapshot.currentPrice))
                : "",
        );

        setMargenInput(String(initialMargenPct ?? DEFAULT_MARGEN_PCT));
        setLastResp(null);
        setError(null);
        setAutoCalcTried(false);
         
    }, [
        snapshot.largoRaw,
        snapshot.anchoRaw,
        snapshot.altoRaw,
        snapshot.pesoRaw,
        snapshot.currentPrice,
        initialMargenPct,
    ]);

    // ── Auto-cálculo cuando dims/categoría están completos ────────────────
    //
    // Dispara `callBackend` cuando la validación pasa (todos los datos OK)
    // y todavía no tenemos `lastResp`. Esto cubre 2 casos:
    //   (a) El item llega con dims pre-llenadas → calcula al abrir.
    //   (b) El user completa las dims manualmente → calcula al terminar.
    //
    // El guard `!lastResp` evita loops: una vez que tenemos resultado, el
    // user puede ajustar margen vía onBlur del input (handleMargenBlur).
    useEffect(() => {
        if (validation.issues.length > 0) return;
        if (loading) return;
        if (lastResp != null) return;
        if (autoCalcTried) return; // ya intentamos auto-calcular → no reintentar (evita el loop ante error/429)
        setAutoCalcTried(true);
        const margenNum = parseSignedDecimalInput(margenInput) ?? DEFAULT_MARGEN_PCT;
        // Si el producto ya tiene precio publicado, lo PRESERVAMOS y mostramos su
        // margen real (no saltamos a la sugerencia del margen default).
        void callBackend(margenNum, { preserveCurrentPrice: snapshot.currentPrice > 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validation.issues.length, lastResp, loading, autoCalcTried]);

    // ── Cálculo de margen local cuando el user edita el precio ───────────
    const margenLocal = useMemo(() => {
        const precioNum = Number(precioInput);
        if (!Number.isFinite(precioNum) || precioNum <= 0) return null;
        return calcMargenLocal(precioNum, lastResp?.desglose, lastResp?.shipping_config);
    }, [precioInput, lastResp]);

    // Si el user cambia el precio, sincronizamos el margen input visual con el
    // margen efectivo calculado local (NO re-llamamos al backend).
    function handlePrecioChange(v: string) {
        setPrecioInput(v);
        const local = calcMargenLocal(Number(v), lastResp?.desglose, lastResp?.shipping_config);
        if (local && Number.isFinite(local.margenPct)) {
            setMargenInput(local.margenPct.toFixed(2));
        }
    }

    // Si el user cambia el margen, llamamos al backend.
    function handleMargenChange(v: string) {
        setMargenInput(v);
    }

    function handleMargenBlur() {
        const num = parseSignedDecimalInput(margenInput);
        if (num == null) return;
        void callBackend(num);
    }

    function handleConfirm() {
        const precioNum = Number(precioInput);
        if (!Number.isFinite(precioNum) || precioNum <= 0) return;
        const precioFinal = Math.round(precioNum);
        const localM = calcMargenLocal(
            Number(precioInput),
            lastResp?.desglose ?? undefined,
            lastResp?.shipping_config,
        );
        onConfirm?.(precioFinal, {
            margenPct: localM?.margenPct ?? null,
            utilidad: localM?.utilidad ?? null,
        });
    }

    // ── Render ────────────────────────────────────────────────────────────

    const desglose = lastResp?.desglose;
    const ship = lastResp?.shipping_config;
    // Extra Falabella (peso volumétrico) — solo presente en respuestas Fala.
    const falaExtra = (
        lastResp as unknown as {
            fala?: { peso_facturable_kg?: number; peso_facturado?: string };
        } | null
    )?.fala;
    const precioNum = Number(precioInput) || 0;
    const utilidad = margenLocal?.utilidad ?? desglose?.utilidad_neta ?? null;
    const margenEf =
        margenLocal?.margenPct ??
        (desglose?.margen_efectivo_pct != null
            ? Number(desglose.margen_efectivo_pct)
            : null);
    const margenNegativo = margenEf != null && margenEf < 0;

    // Componentes desglosados — usamos los del helper si tenemos cálculo local,
    // sino fallback a cálculo simple. Coincide con la fórmula del backend:
    //   utilidad = (precio − comisión − envío) / 1.19 − costo
    const comisionTotal =
        margenLocal?.comision != null
            ? Math.round(margenLocal.comision)
            : precioNum > 0 && desglose?.tasa_comision_pct != null
              ? Math.round(precioNum * (Number(desglose.tasa_comision_pct) / 100))
              : null;
    const ivaTotal =
        margenLocal?.ivaDebito != null
            ? Math.round(margenLocal.ivaDebito)
            : null;
    // Envío mostrado: elige por umbral (19.990) si el backend expone ambos
    // escenarios, para que coincida con el envío que usó el cálculo de margen
    // cuando el precio editado cruza el umbral. Sino cae al envio_clp del desglose.
    const envio =
        precioNum > 0
            ? envioParaPrecio(precioNum, ship, desglose?.envio_clp ?? 0)
            : desglose?.envio_clp ?? 0;
    const fixed = desglose?.fixed_fee ?? 0;
    const costo = desglose?.costo_avgprice ?? null;

    return (
        <div className="px-5 py-4 space-y-4">
            {/* Pre-validation */}
            {validation.issues.length > 0 && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <strong>Para calcular faltan datos:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {validation.issues.map((i, idx) => (
                            <li key={idx}>{i}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Datos contextuales (categoría + costo SAP) — siempre visibles. */}
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-gray-600">
                <div>
                    <span className="text-gray-400">Categoría:</span>{" "}
                    <span className="font-medium tabular-nums">
                        {snapshot.categoryId ?? "—"}
                    </span>
                </div>
                <div>
                    <span className="text-gray-400">Costo SAP:</span>{" "}
                    <span className="font-medium tabular-nums">
                        {costo != null
                            ? clp(costo)
                            : validation.issues.length === 0
                              ? "(resolviendo…)"
                              : "—"}
                    </span>
                </div>
            </div>

            {/* Dimensiones del paquete — editables siempre. Pre-llenadas
                si el item ML tiene shipping.dimensions; vacías si no.
                Si hay item_id en ML, el backend resuelve el envío por item_id
                y no se necesitan dimensiones → se oculta el bloque. */}
            {!(marketplace === "ml" && snapshot.itemId) ? (
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2.5">
                    <div className="flex items-baseline justify-between mb-2">
                        <div className="text-[10.5px] uppercase tracking-wider font-semibold text-gray-500">
                            Dimensiones del paquete
                        </div>
                        <div className="text-[10.5px] text-gray-400">
                            cm / kg
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {([
                            { key: "largo", label: "Largo" },
                            { key: "ancho", label: "Ancho" },
                            { key: "alto", label: "Alto" },
                            { key: "peso", label: "Peso" },
                        ] as const).map(({ key, label }) => (
                            <div key={key}>
                                <label className="block text-[10.5px] font-medium text-gray-600 mb-1">
                                    {label}
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={dimsInput[key]}
                                    onChange={(e) =>
                                        setDimsInput((prev) => ({
                                            ...prev,
                                            [key]: e.target.value,
                                        }))
                                    }
                                    onBlur={() => {
                                        // Si todas las dims están completas y no tenemos resultado,
                                        // disparar el cálculo. El useEffect ya lo hace cuando
                                        // validation.issues llega a 0, pero forzamos onBlur
                                        // por si el user pega Tab desde el último input.
                                        if (
                                            validation.issues.length === 0 &&
                                            !lastResp &&
                                            !loading
                                        ) {
                                            const margenNum =
                                                parseSignedDecimalInput(margenInput) ?? DEFAULT_MARGEN_PCT;
                                            void callBackend(margenNum, {
                                                preserveCurrentPrice: snapshot.currentPrice > 0,
                                            });
                                        }
                                    }}
                                    placeholder="0"
                                    disabled={loading}
                                    className="w-full h-9 rounded-md border border-gray-300 px-2.5 text-sm tabular-nums text-right outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11.5px] text-gray-500">
                    ML calcula el envío real de esta publicación.
                </div>
            )}

            {/* Inputs bidireccionales */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[11.5px] font-medium text-gray-700 mb-1">
                        Margen objetivo
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 px-2.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                        <input
                            type="number"
                            value={margenInput}
                            onChange={(e) => handleMargenChange(e.target.value)}
                            onBlur={handleMargenBlur}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleMargenBlur();
                                }
                            }}
                            className="h-10 flex-1 bg-transparent outline-none text-sm text-right tabular-nums"
                            step={0.5}
                            min={-100}
                            max={500}
                            disabled={loading || validation.issues.length > 0}
                        />
                        <span className="text-sm text-gray-500 pl-1">%</span>
                    </div>
                    <div className="text-[10.5px] text-gray-400 mt-1">
                        Edita y Enter o Tab → recalcula precio
                    </div>
                </div>

                <div>
                    <label className="block text-[11.5px] font-medium text-gray-700 mb-1">
                        Precio sugerido
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 px-2.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                        <span className="text-sm text-gray-500 pr-1">CLP</span>
                        <input
                            type="number"
                            value={precioInput}
                            onChange={(e) => handlePrecioChange(e.target.value)}
                            className="h-10 flex-1 bg-transparent outline-none text-sm text-right tabular-nums"
                            disabled={loading || validation.issues.length > 0}
                            placeholder="0"
                        />
                    </div>
                    <div className="text-[10.5px] text-gray-400 mt-1">
                        Edita → recalcula margen
                    </div>
                </div>
            </div>

            {/* Loader */}
            {loading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Calculando con {mpLabel}…
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Desglose económico — formato "a dónde va tu plata".
                Sin signos "−" (que sugieren pérdida); las flechas → indican
                a qué destino se va cada porción del precio:
                  ML (comisión + envío)
                  SII (IVA débito)
                  Proveedor (costo SAP)
                  Utilidad (lo que sobra) */}
            {!loading && !error && desglose && precioNum > 0 && (
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2.5">
                    <div className="text-[10.5px] uppercase tracking-wider font-semibold text-gray-500 mb-2">
                        Desglose
                    </div>
                    <dl className="grid grid-cols-2 gap-y-1.5 text-[12.5px]">
                        <dt className="text-gray-500">Precio publicación</dt>
                        <dd className="text-gray-900 font-semibold tabular-nums text-right">
                            {clp(precioNum)}
                        </dd>

                        <dt className="text-gray-500">
                            <span className="text-gray-400 mr-1">→</span>
                            Comisión {mpLabel}{" "}
                            {desglose.tasa_comision_pct != null && (
                                <span className="text-gray-400">
                                    ({Number(desglose.tasa_comision_pct).toFixed(1)}%)
                                </span>
                            )}
                        </dt>
                        <dd className="text-gray-700 tabular-nums text-right">
                            {comisionTotal != null ? clp(comisionTotal) : "—"}
                        </dd>

                        <dt className="text-gray-500">
                            <span className="text-gray-400 mr-1">→</span>
                            Envío{" "}
                            {ship?.mode ? (
                                <span className="text-gray-400">
                                    ({ship.mode}{ship.free_shipping ? " · free" : ""})
                                </span>
                            ) : falaExtra?.peso_facturable_kg != null ? (
                                <span className="text-gray-400">
                                    ({falaExtra.peso_facturado === "volumetrico" ? "vol " : ""}
                                    {falaExtra.peso_facturable_kg} kg)
                                </span>
                            ) : null}
                        </dt>
                        <dd className="text-gray-700 tabular-nums text-right">
                            {envio > 0 ? clp(envio) : clp(0)}
                        </dd>

                        {fixed > 0 && (
                            <>
                                <dt className="text-gray-500">
                                    <span className="text-gray-400 mr-1">→</span>
                                    Fee fijo
                                </dt>
                                <dd className="text-gray-700 tabular-nums text-right">
                                    {clp(fixed)}
                                </dd>
                            </>
                        )}

                        <dt
                            className="text-gray-500"
                            title="IVA débito que recaudas del comprador y entregas al SII. Se compensa con IVA crédito de tus compras (no incluido en este cálculo)."
                        >
                            <span className="text-gray-400 mr-1">→</span>
                            IVA al SII{" "}
                            {desglose.iva_pct != null && (
                                <span className="text-gray-400">
                                    ({desglose.iva_pct}%)
                                </span>
                            )}
                        </dt>
                        <dd className="text-gray-700 tabular-nums text-right">
                            {ivaTotal != null ? clp(ivaTotal) : "—"}
                        </dd>

                        <dt className="text-gray-500">
                            <span className="text-gray-400 mr-1">→</span>
                            Costo SAP
                        </dt>
                        <dd className="text-gray-700 tabular-nums text-right">
                            {costo != null ? clp(costo) : "—"}
                        </dd>

                        <dt
                            className={
                                "border-t border-gray-200 pt-1.5 font-bold " +
                                (margenNegativo ? "text-rose-700" : "text-emerald-700")
                            }
                        >
                            Utilidad neta
                        </dt>
                        <dd
                            className={
                                "border-t border-gray-200 pt-1.5 tabular-nums text-right font-bold " +
                                (margenNegativo ? "text-rose-700" : "text-emerald-700")
                            }
                        >
                            {utilidad != null ? clp(utilidad) : "—"}
                            {margenEf != null && (
                                <span className="ml-2 text-[11px] font-medium">
                                    ({margenEf.toFixed(2)}%)
                                </span>
                            )}
                        </dd>
                    </dl>

                    {/* Guardrail margen negativo — OMS style, sin pill. */}
                    {(() => {
                        const localM = calcMargenLocal(
                            Number(precioInput),
                            lastResp?.desglose ?? undefined,
                            lastResp?.shipping_config,
                        );
                        if (localM && localM.utilidad < 0) {
                            return (
                                <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11.5px] text-amber-800">
                                    Este precio deja <strong>margen negativo</strong> (utilidad ${Math.round(localM.utilidad).toLocaleString("es-CL")}).
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            )}

            {/* Footer — botón Confirmar precio (solo si showConfirm && onConfirm) */}
            {showConfirm && onConfirm && (
                <div className="pt-1 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={
                            loading ||
                            !precioInput ||
                            !Number.isFinite(Number(precioInput)) ||
                            Number(precioInput) <= 0 ||
                            validation.issues.length > 0
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {confirmLabel ?? `Confirmar precio ${clp(Number(precioInput) || 0)}`}
                    </button>
                </div>
            )}
        </div>
    );
}

// ── CalculadoraMargenModal ────────────────────────────────────────────────────
//
// Thin wrapper: overlay + header + CalculadoraMargenPanel.

export function CalculadoraMargenModal({
    open,
    snapshot,
    marketplace = "ml",
    allowBackendDims = false,
    initialMargenPct,
    onClose,
    onConfirm,
}: CalculadoraMargenModalProps) {
    // Escape para cerrar
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-gray-900/40 grid place-items-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-[560px] w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-widest text-indigo-600 font-semibold flex items-center gap-1.5">
                            <CalculatorIcon className="w-3.5 h-3.5" />
                            Calculadora de margen
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">
                            Precio sugerido para SKU {snapshot.sku || "—"}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body — delegado al Panel */}
                <CalculadoraMargenPanel
                    snapshot={snapshot}
                    marketplace={marketplace}
                    allowBackendDims={allowBackendDims}
                    initialMargenPct={initialMargenPct}
                    onConfirm={(precio) => {
                        onConfirm(precio);
                        onClose();
                    }}
                    showConfirm
                />
            </div>
        </div>
    );
}
