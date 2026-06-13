// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorResumenTab.tsx
//
// Tab RESUMEN del Editor — renderiza los datos REALES del backend
// (`/api/pim/productos/:sku/detalle`).
//
// Estrategia: muestra meta (sku, item_id, seller_sku, url, etc) en una columna
// + `campos_basicos` dinámicos en la otra (cada uno se renderiza según su `tipo`:
// text, number, textarea, boolean, badge).
//
// NOTA: el shape exacto depende del marketplace + lo que el backend exponga.
// Esto NO es mock — los campos vienen de `S.orig.campos_basicos` del legacy.

"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    Box,
    Calculator as CalculatorIcon,
    ExternalLink,
    Hash,
    Info,
    Tag,
} from "lucide-react";
import { Card, Input } from "@/components/ui";
import {
    FieldRow,
    SectionDivider,
} from "../../../../_shared/ui";
import {
    CalculadoraMargenModal,
    type CalculadoraModalSnapshot,
} from "../../../publicar/base/components/CalculadoraMargenModal";
import type {
    EditorCampoBasico,
    EditorProduct,
} from "../types/editor-types";
import type { EditFieldValue } from "../hooks/useEditorState";

export interface EditorResumenTabProps {
    product: EditorProduct;
    editFields: Record<string, EditFieldValue>;
    onUpdateField: (key: string, value: EditFieldValue) => void;
    /** Canal del producto (lo pasa EditorView). Decide endpoint + dims de la calculadora. */
    marketplace?: "ml" | "fala";
}

const SELECT_CLASSES = [
    "block w-full rounded-md border border-gray-300 px-3 py-2",
    "text-sm text-gray-900 bg-white shadow-sm",
    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
    "cursor-pointer",
].join(" ");

/** Convierte snake_case → "Title Case" para labels que no vienen con nombre. */
function formatFieldLabel(key: string): string {
    const map: Record<string, string> = {
        titulo: "Título",
        precio: "Precio",
        stock: "Stock",
        estado: "Estado",
        descripcion: "Descripción",
        marca: "Marca",
        modelo: "Modelo",
        condicion: "Condición",
        garantia: "Garantía",
        ean: "EAN",
        sku_proveedor: "SKU proveedor",
    };
    return (
        map[key] ||
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

/** Render de un campo básico según su `tipo`. */
function FieldControl({
    fieldKey,
    field,
    value,
    onChange,
}: {
    fieldKey: string;
    field: EditorCampoBasico;
    value: EditFieldValue;
    onChange: (v: EditFieldValue) => void;
}) {
    const isEditable = field.editable !== false;

    // Read-only / badge / non-editable → texto plano
    if (!isEditable || field.tipo === "badge") {
        const text =
            value === null || value === undefined || value === ""
                ? "—"
                : String(value);
        if (field.tipo === "badge" || fieldKey === "estado") {
            const isActive = String(text).toLowerCase().includes("activ");
            return (
                <span
                    className={[
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        isActive
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200",
                    ].join(" ")}
                >
                    {text}
                </span>
            );
        }
        return <span className="text-sm text-gray-700">{text}</span>;
    }

    // Textarea (descripción)
    if (field.tipo === "textarea") {
        return (
            <textarea
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[120px] resize-y"
                value={String(value ?? "")}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    // Number (precio, stock)
    if (field.tipo === "number") {
        return (
            <Input
                type="number"
                value={value === null || value === undefined ? "" : String(value)}
                onChange={(e) =>
                    onChange(e.target.value === "" ? null : Number(e.target.value))
                }
                className="tabular-nums"
            />
        );
    }

    // Boolean (Sí/No)
    if (field.tipo === "boolean") {
        return (
            <select
                className={SELECT_CLASSES}
                value={String(Boolean(value))}
                onChange={(e) => onChange(e.target.value === "true")}
            >
                <option value="true">Sí</option>
                <option value="false">No</option>
            </select>
        );
    }

    // Default: text input
    return (
        <Input
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

/**
 * Banner con la última moderación oficial de Mercado Libre.
 *
 * El backend trae `reason` y `remedy` ya traducidos por ML al idioma del seller
 * desde el endpoint `/moderations/last_moderation/{itemId}-ITM`. Mostramos
 * ambos textos para que el vendedor entienda qué pasó y qué tiene que corregir.
 *
 * Niveles de severidad:
 *   - rose:  el ítem está inhabilitado / cerrado / suspendido → acción urgente
 *   - amber: pendiente de corrección del vendedor (waiting_for_patch, etc.)
 *
 * Si el `name` corresponde a una regla "terminal" (DENYLIST, BRAND_PROTECTION),
 * la moderación no tiene `remedy` recuperable — solo se muestra el motivo.
 */
function ModerationPanel({
    moderation,
}: {
    moderation?: EditorProduct["moderation"];
}) {
    if (!moderation || (!moderation.reason && !moderation.remedy)) {
        return null;
    }

    // Reglas terminales (sin recuperación posible). Hardcoded a la lista
    // documentada por ML: DENYLIST, BRAND_PROTECTION y derivados.
    const name = (moderation.name ?? "").toUpperCase();
    const isTerminal = /DENY|BRAND_?PROTECTION|FORBIDDEN/.test(name);

    const tone = isTerminal
        ? {
            border: "border-rose-300",
            bg: "bg-rose-50",
            ring: "ring-rose-200",
            title: "text-rose-800",
            body: "text-rose-900",
            hint: "text-rose-700",
            iconBg: "bg-rose-100 text-rose-700",
        }
        : {
            border: "border-amber-300",
            bg: "bg-amber-50",
            ring: "ring-amber-200",
            title: "text-amber-900",
            body: "text-amber-900",
            hint: "text-amber-800",
            iconBg: "bg-amber-100 text-amber-700",
        };

    const headline = isTerminal
        ? "Publicación inhabilitada por Mercado Libre"
        : "Esta publicación está moderada por Mercado Libre";

    let dateLabel: string | null = null;
    if (moderation.date_created) {
        const d = new Date(moderation.date_created.replace(" ", "T"));
        if (!Number.isNaN(d.getTime())) {
            dateLabel = d.toLocaleString("es-CL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    }

    return (
        <div
            className={`rounded-xl border ${tone.border} ${tone.bg} ring-1 ${tone.ring} p-4`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <div className={`shrink-0 grid place-items-center w-9 h-9 rounded-full ${tone.iconBg}`}>
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h3 className={`text-sm font-semibold ${tone.title}`}>{headline}</h3>
                        {moderation.name && (
                            <code className={`text-[10px] font-mono ${tone.hint}`}>
                                {moderation.name}
                            </code>
                        )}
                        {dateLabel && (
                            <span className={`text-[11px] ${tone.hint}`}>
                                · {dateLabel}
                            </span>
                        )}
                    </div>

                    {moderation.reason && (
                        <div>
                            <p className={`text-[11px] uppercase tracking-wider font-semibold ${tone.hint}`}>
                                Motivo
                            </p>
                            <p className={`text-sm leading-relaxed ${tone.body}`}>
                                {moderation.reason}
                            </p>
                        </div>
                    )}

                    {moderation.remedy && !isTerminal && (
                        <div>
                            <p className={`text-[11px] uppercase tracking-wider font-semibold ${tone.hint}`}>
                                Cómo solucionarlo
                            </p>
                            <p className={`text-sm leading-relaxed ${tone.body}`}>
                                {moderation.remedy}
                            </p>
                        </div>
                    )}

                    {moderation.evidences && moderation.evidences.length > 0 && (
                        <div>
                            <p className={`text-[11px] uppercase tracking-wider font-semibold ${tone.hint}`}>
                                Evidencias detectadas
                            </p>
                            <ul className={`mt-1 text-xs space-y-0.5 ${tone.body}`}>
                                {moderation.evidences.map((ev, i) => (
                                    <li key={i} className="flex items-baseline gap-2">
                                        {ev.section_name && (
                                            <code className={`text-[10px] px-1 py-0.5 rounded ${tone.iconBg}`}>
                                                {ev.section_name}
                                            </code>
                                        )}
                                        <span className="break-all">{ev.text_matched}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function EditorResumenTab({
    product,
    editFields,
    onUpdateField,
    marketplace = "ml",
}: EditorResumenTabProps) {
    // Filtrar `descripcion` — tiene su propia card (`EditorDescripcionSection`).
    const basicEntries = Object.entries(product.campos_basicos || {}).filter(
        ([key]) => key !== "descripcion",
    );
    // Status primero, después titulo/precio/stock, después el resto.
    const priorityOrder = ["estado", "titulo", "precio", "stock"];
    basicEntries.sort(([a], [b]) => {
        const aIdx = priorityOrder.indexOf(a);
        const bIdx = priorityOrder.indexOf(b);
        if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
    });

    const imageCount = product.imagenes?.total ?? product.imagenes?.lista?.length ?? 0;
    const primaryImg = product.imagenes?.lista?.[0];

    // ── Calculadora de margen (modal reusado del wizard de publicar) ─────────
    //
    // Estrategia para `currentPrice` (prioridad descendente):
    //   1. editFields.precio  — si el user lo modificó en el form pero no guardó
    //   2. oferta_precio      — si hay oferta activa, ese es el precio que ve el
    //                            comprador HOY (cálculo del margen real)
    //   3. campos_basicos.precio.valor — precio publicado normal
    //
    // Las dimensiones del paquete vienen como atributos del item ML:
    // SELLER_PACKAGE_LENGTH/WIDTH/HEIGHT/WEIGHT. El modal acepta el shape raw
    // (string "30 cm" o `{ number, unit }`) y lo normaliza internamente.
    const [calcOpen, setCalcOpen] = useState(false);

    const calcSnapshot = useMemo<CalculadoraModalSnapshot>(() => {
        // Fallback a buscar en atributos (por si en el futuro ML deja de
        // marcar SELLER_PACKAGE_* como hidden y vienen en `atributos[]`).
        const findAttr = (id: string): unknown =>
            product.atributos?.find((a) => a.id === id)?.valor ?? null;
        // Falabella: las dims llegan como atributos PackageLength/Width/Height/Weight.
        // Matcheamos por id normalizado (case/separador-insensible) para no depender
        // de la normalización exacta del backend.
        const findAttrFala = (canonical: string): unknown => {
            const want = canonical.toLowerCase().replace(/[_\s|/]/g, "");
            const hit = product.atributos?.find(
                (a) => String(a.id ?? "").toLowerCase().replace(/[_\s|/]/g, "") === want,
            );
            return hit?.valor ?? null;
        };
        const isFala = marketplace === "fala";

        const editedPrice = editFields.precio;
        const oferta = product.meta?.tiene_oferta
            ? product.meta?.oferta_precio
            : null;
        const basePrice = product.campos_basicos?.precio?.valor;

        // `editedPrice` solo debe ganar si el user REALMENTE cambió el precio en
        // el form. OJO: hydrateFromProduct() pre-rellena editFields.precio con el
        // precio base, así que editedPrice NUNCA es null al cargar. Sin el guard
        // `!== basePrice`, el precio de oferta jamás se usaba (ese era el bug:
        // con oferta activa la calc seedeaba el base $12.990, no el de oferta $8.623).
        const userEditedPrice =
            editedPrice != null &&
            Number.isFinite(Number(editedPrice)) &&
            (basePrice == null || Number(editedPrice) !== Number(basePrice));

        let currentPrice = 0;
        if (userEditedPrice) {
            currentPrice = Number(editedPrice);
        } else if (oferta != null && Number.isFinite(Number(oferta))) {
            currentPrice = Number(oferta);
        } else if (basePrice != null && Number.isFinite(Number(basePrice))) {
            currentPrice = Number(basePrice);
        }

        // Dimensiones: backend las expone parseadas en `product.shipping.dimensions`
        // (mig 2026-05-20). Si no vienen (item viejo, ML sin shipping config),
        // caemos al fallback de buscar SELLER_PACKAGE_* en atributos (raro pero
        // posible si el filtro `shouldHideAttribute` cambia).
        const dim = product.shipping?.dimensions ?? null;

        return {
            sku: product.sku,
            categoryId: product.meta?.category_id ?? null,
            currentPrice,
            // Precio para cotizar el envío FULL: el de oferta si está vigente, si no
            // el publicado base (NO el editado sin guardar). Solo ML lo usa.
            itemPrice: oferta != null && Number(oferta) > 0 ? Number(oferta) : (Number(basePrice) || 0),
            itemId: product.item_id ?? null,
            largoRaw: isFala ? findAttrFala("PackageLength") : (dim?.largo ?? findAttr("SELLER_PACKAGE_LENGTH")),
            anchoRaw: isFala ? findAttrFala("PackageWidth") : (dim?.ancho ?? findAttr("SELLER_PACKAGE_WIDTH")),
            altoRaw: isFala ? findAttrFala("PackageHeight") : (dim?.alto ?? findAttr("SELLER_PACKAGE_HEIGHT")),
            pesoRaw: isFala ? findAttrFala("PackageWeight") : (dim?.pesoKg ?? findAttr("SELLER_PACKAGE_WEIGHT")),
        };
    }, [
        marketplace,
        product.sku,
        product.item_id,
        product.meta?.category_id,
        product.meta?.tiene_oferta,
        product.meta?.oferta_precio,
        product.campos_basicos?.precio?.valor,
        product.atributos,
        product.shipping?.dimensions,
        editFields.precio,
    ]);

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            {/* ── Banner de moderación oficial de Mercado Libre ───── */}
            <ModerationPanel moderation={product.moderation} />

            {/* ── Card 1: Identificadores + meta ──────────────────── */}
            <Card title="Identificadores">
                <div className="grid grid-cols-[1fr_320px] gap-8">
                    <div className="min-w-0">
                        <SectionDivider icon={<Hash className="w-4 h-4" />}>
                            IDs del producto
                        </SectionDivider>

                        <FieldRow label="SKU interno">
                            <code className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded tabular-nums">
                                {product.sku}
                            </code>
                        </FieldRow>

                        {product.item_id && (
                            <FieldRow label="ID marketplace">
                                <code className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded tabular-nums">
                                    {product.item_id}
                                </code>
                            </FieldRow>
                        )}

                        {product.seller_sku && (
                            <FieldRow label="Seller SKU">
                                <span className="text-sm text-gray-900 tabular-nums">
                                    {product.seller_sku}
                                </span>
                            </FieldRow>
                        )}

                        {product.seller_custom_field !== undefined && (
                            <FieldRow
                                label="Seller custom field"
                                hint="Campo libre del seller. Se sincroniza al marketplace."
                            >
                                <Input
                                    value={product.seller_custom_field ?? ""}
                                    onChange={(e) =>
                                        onUpdateField(
                                            "seller_custom_field",
                                            e.target.value,
                                        )
                                    }
                                />
                            </FieldRow>
                        )}

                        {product.url_producto && (
                            <FieldRow label="URL pública">
                                <a
                                    href={product.url_producto}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline break-all"
                                >
                                    Ver publicación
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                </a>
                            </FieldRow>
                        )}
                    </div>

                    {/* Imagen principal + counter */}
                    <div className="border-l border-gray-200 pl-8">
                        <SectionDivider icon={<Box className="w-4 h-4" />}>
                            Portada
                        </SectionDivider>
                        <div className="aspect-square rounded-md border border-gray-200 bg-gray-50 overflow-hidden grid place-items-center">
                            {primaryImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={primaryImg}
                                    alt={String(editFields.titulo ?? product.sku)}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="text-gray-300 text-xs">Sin imagen</div>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-2 tabular-nums">
                            {imageCount} imagen{imageCount !== 1 ? "es" : ""}
                        </div>
                    </div>
                </div>
            </Card>

            {/* ── Card 1.5: Oferta activa (solo si tiene_oferta=true) ──
                El backend resuelve combinando `deal_ids` del item ML +
                `seller_promotions`. Si llega `tiene_oferta`, mostramos los
                campos `oferta_*` con el deal name, precio efectivo, precio
                tachado, % descuento, y vigencia. Si no, este bloque no
                aparece. Documentado en `normalize-ml.js` línea ~630.
                Equivalente al `promo-box` del legacy editar.html. */}
            {product.meta?.tiene_oferta && <OfertaActivaCard meta={product.meta} />}

            {/* ── Card 2: Campos básicos dinámicos ───────────────── */}
            {basicEntries.length > 0 && (
                <Card title="Datos del producto">
                    <SectionDivider icon={<Info className="w-4 h-4" />}>
                        Campos básicos
                    </SectionDivider>
                    <div className="space-y-1">
                        {basicEntries.map(([key, field]) => (
                            <FieldRow
                                key={key}
                                label={formatFieldLabel(key)}
                                align={field.tipo === "textarea" ? "top" : "center"}
                                hint={
                                    field.advertencia ? (
                                        <span className="text-amber-700">
                                            {field.advertencia}
                                        </span>
                                    ) : field.razon ? (
                                        <span className="text-gray-500">
                                            {field.razon}
                                        </span>
                                    ) : undefined
                                }
                            >
                                {key === "precio" && field.editable !== false ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <FieldControl
                                                fieldKey={key}
                                                field={field}
                                                value={editFields[key] ?? null}
                                                onChange={(v) => onUpdateField(key, v)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCalcOpen(true)}
                                            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium transition-colors shrink-0"
                                            title="Calcular precio sugerido según margen objetivo"
                                        >
                                            <CalculatorIcon className="w-4 h-4" />
                                            Calculadora
                                        </button>
                                    </div>
                                ) : (
                                    <FieldControl
                                        fieldKey={key}
                                        field={field}
                                        value={editFields[key] ?? null}
                                        onChange={(v) => onUpdateField(key, v)}
                                    />
                                )}
                            </FieldRow>
                        ))}
                    </div>
                </Card>
            )}

            {/* Modal de calculadora — reusa el mismo componente del wizard de
                publicar. Recibe snapshot construido del producto + editFields.
                Al confirmar, actualiza editFields.precio. */}
            <CalculadoraMargenModal
                open={calcOpen}
                marketplace={marketplace}
                snapshot={calcSnapshot}
                onClose={() => setCalcOpen(false)}
                onConfirm={(precio) => onUpdateField("precio", precio)}
            />

            {/* ── Card 3: Meta backend ───────────────────────────── */}
            {product.meta && (
                <Card title="Meta">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        {product.meta.last_updated && (
                            <FieldRow label="Última actualización">
                                <span className="text-sm text-gray-700 tabular-nums">
                                    {new Date(
                                        product.meta.last_updated,
                                    ).toLocaleString("es-CL")}
                                </span>
                            </FieldRow>
                        )}
                        {product.meta.health != null && (
                            <FieldRow label="Health score">
                                <span
                                    className={[
                                        "text-sm font-semibold tabular-nums",
                                        product.meta.health >= 0.8
                                            ? "text-emerald-700"
                                            : product.meta.health >= 0.5
                                                ? "text-amber-700"
                                                : "text-rose-700",
                                    ].join(" ")}
                                >
                                    {Math.round(product.meta.health * 100)}/100
                                </span>
                            </FieldRow>
                        )}
                        {product.meta.category_id && (
                            <FieldRow label="Categoría ML">
                                <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded tabular-nums">
                                    {product.meta.category_id}
                                </code>
                            </FieldRow>
                        )}
                        {product.meta.sold_quantity != null && (
                            <FieldRow label="Vendidos">
                                <span className="text-sm text-gray-900 tabular-nums">
                                    {product.meta.sold_quantity.toLocaleString(
                                        "es-CL",
                                    )}
                                </span>
                            </FieldRow>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}

// ── OfertaActivaCard ────────────────────────────────────────────────────────
//
// Bloque visual de oferta activa (deal/promo de ML). Solo se renderiza cuando
// el backend devuelve `meta.tiene_oferta = true`. Inspirado en el `promo-box`
// del legacy `editar.html` (líneas ~554-577).
//
// Muestra:
//   - Punto rojo + "Oferta activa" + nombre del deal (ej. "CyberClavo · Hot Sale")
//   - Precio oferta (grande, prominente) + precio original tachado + % descuento
//   - Vigencia "del X al Y" si hay fechas
//   - Warning: "No bajes el precio sin sacar primero la oferta"
//     (motivo: si bajás el precio base, ML te aplica el descuento de la oferta
//     ENCIMA → terminás vendiendo a un precio mucho menor del intencionado)

function OfertaActivaCard({ meta }: { meta: NonNullable<EditorProduct["meta"]> }) {
    const nombre = meta.oferta_nombre ?? "Oferta activa";
    const precioOferta = meta.oferta_precio ?? null;
    const precioOrig = meta.oferta_precio_orig ?? null;
    const pct = meta.oferta_pct ?? null;
    const inicio = meta.oferta_inicio ?? null;
    const fin = meta.oferta_fin ?? null;
    const tipo = meta.oferta_tipo ?? null;

    const fmtCLP = (n: number | null | undefined): string => {
        if (n == null || !Number.isFinite(Number(n))) return "—";
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(Number(n));
    };

    const fmtFecha = (s: string | null | undefined): string => {
        if (!s) return "";
        try {
            return new Date(s).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch {
            return "";
        }
    };
    const vigencia = (() => {
        const i = fmtFecha(inicio);
        const f = fmtFecha(fin);
        if (i && f) return `Vigente del ${i} al ${f}`;
        if (f) return `Vigente hasta ${f}`;
        return null;
    })();

    return (
        <Card title="Oferta activa">
            <div className="space-y-3">
                {/* Header: dot + label + nombre del deal */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-[10.5px] font-semibold tracking-wider uppercase text-gray-500">
                        Oferta activa
                    </span>
                    <span className="text-sm font-semibold text-gray-900 ml-1">
                        {nombre}
                    </span>
                    {tipo && tipo !== "DEAL" && (
                        <span className="text-[10.5px] text-gray-500 font-mono ml-auto bg-gray-100 px-1.5 py-0.5 rounded">
                            {tipo}
                        </span>
                    )}
                </div>

                {/* Precios */}
                {precioOferta != null && (
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-2xl font-bold text-gray-900 tabular-nums">
                            {fmtCLP(precioOferta)}
                        </span>
                        {precioOrig != null && precioOrig > precioOferta && (
                            <span className="text-sm text-gray-500 line-through tabular-nums">
                                {fmtCLP(precioOrig)}
                            </span>
                        )}
                        {pct != null && (
                            <span className="text-xs font-semibold text-rose-600 tabular-nums">
                                −{Number(pct).toFixed(0)}%
                            </span>
                        )}
                    </div>
                )}

                {/* Vigencia */}
                {vigencia && (
                    <div className="text-xs text-gray-500 tabular-nums">
                        {vigencia}
                    </div>
                )}

            </div>
        </Card>
    );
}
