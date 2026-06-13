// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/steps/Step1SkuCategoria.tsx
//
// Step 1 — Look OMS pleno.
//
// Layout:
//   - 3 cards separadas (Card OMS con title prop): SKU base · Categoría · Precio y stock
//   - FieldRow helper compartido (`_shared/ui/`): grid [160px_1fr]
//   - Input OMS bordered, lucide-react para iconos
//
// Sub-secciones (Dimensiones del paquete) usan h3 + divider inline.

"use client";

import { useEffect, useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";

import { Card, Input } from "@/components/ui";
import { FieldRow } from "../../../../_shared/ui";
import { CalculadoraMargenModal } from "../components/CalculadoraMargenModal";
import { CategoryPickerModal } from "../components/CategoryPickerModal";
import { ProgressSidebar } from "../components/ProgressSidebar";
import {
    canonicalFalaFeedName,
    FALA_PACKAGE_FIELD_META,
    FALA_PACKAGE_DIMS,
    ML_PACKAGE_FIELDS,
    toArray,
} from "../helpers/constants";
import type { UsePublicarWizardReturn } from "../hooks/usePublicarWizard";
import type {
    MarketplaceCategory,
    PublicarAttribute,
    PublicarStepId,
} from "../types/publicar-types";

export interface Step1SkuCategoriaProps {
    wizard: UsePublicarWizardReturn;
    onJumpToStep: (s: PublicarStepId) => void;
    /**
     * Modo carga-masiva: el SKU viene fijado desde la fila del lote y no se
     * puede cambiar. Se renderiza el input como read-only (visualmente
     * atenuado). En el flujo normal (alta libre) el SKU sigue editable.
     */
    skuReadOnly?: boolean;
}

export function Step1SkuCategoria({
    wizard,
    onJumpToStep,
    skuReadOnly = false,
}: Step1SkuCategoriaProps) {
    const {
        state,
        lookupSku,
        loading,
        error,
        updateField,
        updateAttr,
        handleSelectMlCategory,
        handleSelectFalaCategory,
    } = wizard;
    const channel = state.channel;
    const cat = channel === "ml" ? state.category : state.categoryFala;

    const [skuInput, setSkuInput] = useState<string>(state.sku || "");
    const [pickerOpen, setPickerOpen] = useState(false);
    /** Modal calculadora de margen — abre desde el ícono al lado del precio. */
    const [calcOpen, setCalcOpen] = useState(false);

    useEffect(() => {
        setSkuInput(state.sku || "");
    }, [state.sku]);

    const handleSkuBlur = async () => {
        const sku = skuInput.trim();
        if (sku && sku !== state.sku) {
            await lookupSku(sku);
        }
    };

    const handleCategorySelect = async (category: MarketplaceCategory) => {
        setPickerOpen(false);
        if (channel === "ml") await handleSelectMlCategory(category);
        else await handleSelectFalaCategory(category);
    };

    // Slots canonical (ML/Fala mapean a distintas keys).
    const title =
        channel === "ml" ? state.ml.title ?? "" : state.fala.Name ?? "";
    const setTitle = (v: string) => {
        if (channel === "ml") updateField("ml", "title", v);
        else updateField("fala", "Name", v);
    };
    // Sanitiza leading zeros para que "012" → "12" cuando el user typea
    // sobre un value inicial "0" (lookupSku() a veces inicializa stock=0).
    // Preserva "0" solo si es el ÚNICO dígito (caso legítimo de stock=0).
    // Vacío queda vacío para que se muestre el placeholder "0".
    const _stripLeadingZeros = (v: string): string => {
        if (!v) return "";
        // "012" → "12" · "0" → "0" · "00" → "0" · "0.5" → "0.5" (decimal preserved)
        return v.replace(/^0+(\d)/, "$1");
    };

    const stock =
        channel === "ml"
            ? state.ml.available_quantity ?? ""
            : state.fala.Quantity ?? "";
    const setStock = (v: string) => {
        const sanitized = _stripLeadingZeros(v);
        if (channel === "ml") updateField("ml", "available_quantity", sanitized);
        else updateField("fala", "Quantity", sanitized);
    };
    const price =
        channel === "ml" ? state.ml.price ?? "" : state.fala.Price ?? "";
    const setPrice = (v: string) => {
        const sanitized = _stripLeadingZeros(v);
        if (channel === "ml") updateField("ml", "price", sanitized);
        else updateField("fala", "Price", sanitized);
    };
    const attrValue = (key: string) => {
        const slot = channel === "ml" ? state.ml : state.fala;
        const attrs = (slot?.attrs as Record<string, unknown>) ?? {};
        const canonicalKey = canonicalFalaFeedName(key);
        const legacyKey = canonicalKey
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .toLowerCase();
        return ((attrs[canonicalKey] ?? attrs[key] ?? attrs[legacyKey]) as unknown) ?? "";
    };

    // Dimensiones del paquete:
    //   - ML: usar `ML_PACKAGE_FIELDS` (4 fields fijos con units cm/kg/etc).
    //   - Fala: extraer de `state.falaRequiredAttrs` los que matcheen
    //     `FALA_PACKAGE_DIMS` (vienen promovidos desde `normalizeVistaPrevia`).
    const falaPackageDims: PublicarAttribute[] =
        channel === "fala"
            ? toArray<PublicarAttribute>(state.falaRequiredAttrs).filter((a) =>
                  FALA_PACKAGE_DIMS.has(canonicalFalaFeedName(a.feedName || a.id || "")),
              )
            : [];

    return (
        <div className="px-6 pt-6 pb-10">
            <div className="grid grid-cols-[1fr_360px] gap-6">
                <div className="space-y-4 min-w-0">
                    {/* ── 1. SKU BASE ──────────────────────────────────────── */}
                    <Card title="SKU base">
                        <FieldRow
                            label="SKU interno"
                            hint={
                                skuReadOnly
                                    ? "El SKU no se puede cambiar."
                                    : state.sap
                                      ? `Marca: ${state.sap.marca ?? "—"}${state.sap.codeBars ? ` · Code bars: ${state.sap.codeBars}` : ""}`
                                      : "Si ya existe en tu catálogo se autocompletan el resto de campos."
                            }
                        >
                            <Input
                                value={skuInput}
                                onChange={
                                    skuReadOnly
                                        ? undefined
                                        : (e) => setSkuInput(e.target.value)
                                }
                                onBlur={skuReadOnly ? undefined : handleSkuBlur}
                                onKeyDown={
                                    skuReadOnly
                                        ? undefined
                                        : (e) => {
                                              if (e.key === "Enter") {
                                                  e.preventDefault();
                                                  void handleSkuBlur();
                                              }
                                          }
                                }
                                readOnly={skuReadOnly}
                                placeholder="MIM-XXXX"
                                className={
                                    skuReadOnly
                                        ? "tabular-nums bg-gray-50 text-gray-500 cursor-not-allowed"
                                        : "tabular-nums"
                                }
                            />
                        </FieldRow>

                        <FieldRow
                            label="Producto"
                            hint={
                                loading
                                    ? "Buscando en SAP…"
                                    : state.sap
                                      ? "Nombre tal como está en SAP. No editable."
                                      : "Se autocompletará al detectar el SKU."
                            }
                        >
                            <Input
                                value={state.sap?.nombre ?? ""}
                                disabled
                                placeholder="(se llena al buscar el SKU)"
                            />
                        </FieldRow>

                        <FieldRow
                            label="Título publicación"
                            hint={`Aparece en ${channel === "ml" ? "MercadoLibre" : "Falabella"}. Pre-rellena el nombre SAP — puedes editarlo. Máx 60 caracteres.`}
                        >
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={60}
                                placeholder="Ej. Taladro inalámbrico 12V con 2 baterías"
                            />
                        </FieldRow>

                        {error && (
                            <div className="text-xs text-rose-600 mt-1">{error}</div>
                        )}
                    </Card>

                    {/* ── 2. CATEGORÍA ─────────────────────────────────────── */}
                    <Card
                        title={`Categoría ${channel === "ml" ? "MercadoLibre" : "Falabella"}`}
                    >
                        <FieldRow
                            label="Categoría sugerida"
                            hint={
                                cat?.suggested
                                    ? "Sugerida por la cascade. Click para cambiar."
                                    : cat
                                      ? "Click para cambiar."
                                      : "Click para seleccionar una categoría."
                            }
                        >
                            <button
                                type="button"
                                onClick={() => setPickerOpen(true)}
                                disabled={loading}
                                className="w-full flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 hover:border-blue-500 hover:shadow-sm transition text-left disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {cat ? (
                                    <span className="flex items-center gap-2 min-w-0">
                                        {cat.suggested && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                                                Sugerida
                                            </span>
                                        )}
                                        {cat.deprecated && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                                                Deprecada
                                            </span>
                                        )}
                                        <span className="truncate text-sm text-gray-900">
                                            {cat.path || cat.nombre || cat.id}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-400">
                                        Buscar categoría…
                                    </span>
                                )}
                                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                            </button>
                        </FieldRow>

                        {/* ── DIMENSIONES DEL PAQUETE ─────────────────────
                            Sub-sección dentro de Categoría. Layout custom (no
                            usamos AttrInput+FieldRow porque ese mete el label
                            a la IZQUIERDA y al renderizar 4 columnas el input
                            queda aplastado a ~30px). Acá label arriba +
                            input proporcionado + select de unidad inline. */}
                        {channel === "ml" && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                                    Dimensiones del paquete
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    ML las exige para publicar el item.
                                </p>
                                <div className="grid grid-cols-[repeat(4,minmax(0,180px))] gap-x-8 gap-y-3">
                                    {ML_PACKAGE_FIELDS.map((field) => {
                                        const raw = attrValue(field.id);
                                        const v =
                                            raw && typeof raw === "object" &&
                                            "number" in (raw as object)
                                                ? (raw as { number?: number | null; unit?: string })
                                                : { number: undefined, unit: field.default_unit };
                                        return (
                                            <PackageDimField
                                                key={field.id}
                                                label={field.label}
                                                required
                                                value={v.number ?? ""}
                                                unit={v.unit ?? field.default_unit}
                                                units={[...field.units]}
                                                onChange={(n, u) =>
                                                    updateAttr("ml", field.id, {
                                                        number: n === "" ? null : Number(n),
                                                        unit: u,
                                                    })
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {channel === "fala" && falaPackageDims.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                                    Dimensiones del paquete
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Decisión Mimbral: obligatorias para publicar.
                                </p>
                                <div className="grid grid-cols-[repeat(4,minmax(0,180px))] gap-x-8 gap-y-3">
                                    {falaPackageDims.map((attr) => {
                                        const key = canonicalFalaFeedName(attr.feedName ?? attr.id ?? "");
                                        const meta = FALA_PACKAGE_FIELD_META[key];
                                        const raw = attrValue(key);
                                        // Fala puede mandar number_unit con shape {number,unit}
                                        // o un value directo (string/number). Normalizamos.
                                        const v =
                                            raw && typeof raw === "object" &&
                                            "number" in (raw as object)
                                                ? (raw as { number?: number | null; unit?: string })
                                                : {
                                                      number:
                                                          typeof raw === "number" ||
                                                          (typeof raw === "string" && raw !== "")
                                                              ? raw
                                                              : undefined,
                                                      unit: meta?.defaultUnit ?? attr.default_unit,
                                                  };
                                        return (
                                            <PackageDimField
                                                key={key}
                                                label={meta?.label || attr.label || attr.name || key}
                                                required
                                                value={(v.number as number | string | undefined) ?? ""}
                                                unit={v.unit ?? meta?.defaultUnit ?? attr.default_unit}
                                                units={meta?.units ?? attr.units ?? []}
                                                onChange={(n, u) =>
                                                    updateAttr("fala", key, {
                                                        number: n === "" ? null : Number(n),
                                                        unit: u,
                                                    })
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* ── 3. PRECIO Y STOCK ────────────────────────────────── */}
                    <Card title="Precio y stock">
                        <div className="grid grid-cols-2 gap-x-6">
                            <FieldRow label="Precio venta">
                                {/* Calculadora va embebida como sufijo del input (no
                                    como botón externo) para que el control sea uno
                                    solo y no se desborde en grids angostos. Antes
                                    estaba lado a lado y el botón pisaba el label
                                    "Stock" de la columna 2 al achicar viewport. */}
                                <div className="flex items-center gap-2 rounded-md border border-gray-300 pl-3 pr-1 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                    <span className="text-sm text-gray-500">CLP</span>
                                    <input
                                        className="bg-transparent outline-none flex-1 min-w-0 text-right tabular-nums text-sm py-1"
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCalcOpen(true)}
                                        title="Calcular precio según margen objetivo"
                                        aria-label="Calcular precio según margen objetivo"
                                        className="h-7 w-7 grid place-items-center rounded text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 shrink-0 transition-colors"
                                    >
                                        <Calculator className="w-4 h-4" />
                                    </button>
                                </div>
                            </FieldRow>
                            <FieldRow label="Stock">
                                <Input
                                    type="number"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    placeholder="0"
                                    className="tabular-nums text-right"
                                />
                            </FieldRow>
                        </div>
                    </Card>

                    {/* Hint inferior */}
                    <div className="text-xs text-gray-500 px-1">
                        Continuá al paso{" "}
                        <button
                            type="button"
                            onClick={() => onJumpToStep("obligatorios")}
                            className="text-blue-700 hover:underline font-semibold"
                        >
                            2 · Obligatorios
                        </button>{" "}
                        para llenar descripción, atributos de categoría y recomendados.
                        Las imágenes van en el paso{" "}
                        <button
                            type="button"
                            onClick={() => onJumpToStep("imagenes")}
                            className="text-blue-700 hover:underline font-semibold"
                        >
                            3 · Imágenes
                        </button>
                        .
                    </div>
                </div>

                <ProgressSidebar
                    currentStep="sku"
                    coverage={wizard.coverage}
                    channel={channel}
                    onJumpToStep={onJumpToStep}
                />
            </div>

            <CategoryPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                channel={channel}
                current={cat ?? null}
                onSelect={handleCategorySelect}
            />

            {/* Modal calculadora de margen. Snapshot lee del state actual del
                wizard al abrir (sku, categoryId, dims, peso, precio actual).
                Al confirmar inyecta el precio nuevo via setPrice() — mismo
                handler que el input manual. */}
            <CalculadoraMargenModal
                open={calcOpen}
                marketplace={channel === "fala" ? "fala" : "ml"}
                snapshot={{
                    sku: state.sku || "",
                    categoryId: channel === "ml"
                        ? state.category?.id ?? null
                        : state.categoryFala?.id ?? null,
                    currentPrice: Number(price) || 0,
                    // Dims: ML usa `seller_package_*`; Falabella usa las keys
                    // `Package*` (feedName) que viven en state.fala.attrs.
                    largoRaw: channel === "fala"
                        ? attrValue("PackageLength")
                        : attrValue("seller_package_length") || attrValue("SELLER_PACKAGE_LENGTH"),
                    anchoRaw: channel === "fala"
                        ? attrValue("PackageWidth")
                        : attrValue("seller_package_width") || attrValue("SELLER_PACKAGE_WIDTH"),
                    altoRaw: channel === "fala"
                        ? attrValue("PackageHeight")
                        : attrValue("seller_package_height") || attrValue("SELLER_PACKAGE_HEIGHT"),
                    pesoRaw: channel === "fala"
                        ? attrValue("PackageWeight")
                        : attrValue("seller_package_weight") || attrValue("SELLER_PACKAGE_WEIGHT"),
                }}
                initialMargenPct={state.margen != null ? state.margen * 100 : undefined}
                onClose={() => setCalcOpen(false)}
                onConfirm={(precio) => setPrice(String(precio))}
            />
        </div>
    );
}

// ── PackageDimField ─────────────────────────────────────────────────────────
//
// Layout custom para las 4 dimensiones del paquete (Largo/Ancho/Alto/Peso).
// NO usamos AttrInput porque ese mete el label a la IZQUIERDA via FieldRow
// (grid 160px/1fr) — al meterlo en un grid-cols-4 los inputs quedan
// aplastados a ~30px (input chico/no cuadrado, se sale del margen).
//
// Acá:
//   - Label arriba del input (smaller, gray-600, bullet rojo si required)
//   - Input numérico de altura cómoda + flex-1 para ocupar el ancho disponible
//   - Select de unidad inline a la derecha, ancho fijo
//
// El componente expone una API estable independiente del shape interno
// (que es {number, unit} para number_unit ML/Fala).
function PackageDimField({
    label,
    required,
    value,
    unit,
    units,
    onChange,
}: {
    label: string;
    required?: boolean;
    value: number | string;
    unit: string | undefined;
    units: readonly string[];
    onChange: (number: number | string, unit: string) => void;
}) {
    return (
        <div className="min-w-0">
            <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">
                <span>{label}</span>
                {required && (
                    <span
                        className="text-rose-500 text-[10px] ml-1 align-top"
                        title="Obligatorio"
                        aria-label="Obligatorio"
                    >
                        ●
                    </span>
                )}
            </label>
            <div className="flex items-stretch gap-1.5">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value, unit ?? "")}
                    className="min-w-0 flex-1 h-10 px-2 rounded-md border border-gray-300 text-sm text-center tabular-nums bg-white shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    inputMode="decimal"
                />
                {units.length <= 1 ? (
                    <span className="h-10 min-w-10 px-2 grid place-items-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-600">
                        {unit || units[0] || ""}
                    </span>
                ) : (
                    <select
                        value={unit ?? ""}
                        onChange={(e) =>
                            onChange(value, e.target.value)
                        }
                        className="h-10 pl-2 pr-7 rounded-md border border-gray-300 text-sm text-gray-700 bg-white shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        style={{
                            backgroundImage:
                                "url('data:image/svg+xml;utf8,<svg fill=\"none\" stroke=\"%236b7280\" stroke-width=\"1.5\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 8l5 5 5-5\"/></svg>')",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 6px center",
                            backgroundSize: "12px",
                            appearance: "none",
                        }}
                    >
                        {units.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}
