// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/steps/Step2Obligatorios.tsx
//
// Step 2 — Look OMS pleno. Cards separadas por sección.
//
// Distribución (Mayo 2026):
//   Step 1: SKU + Producto + Título + Categoría + Dimensiones paquete + Precio + Stock
//   Step 2 (acá): Descripción + atributos requeridos + atributos RECOMENDADOS (colapsable)
//     - Fala suma: SellerSku, Marca, Estado operador
//   Step 3: Imágenes (era acá, se separó)
//   Step 4: Revisar
//
// Los atributos recomendados (antes Step3 dedicado) ahora viven como sección
// colapsable al final de este step — el user lee primero los obligatorios y
// si quiere mejorar la publicación, expande "Atributos recomendados".

"use client";

import { useState } from "react";
import {
    ChevronRight,
    Info,
    Star,
    TrendingUp,
} from "lucide-react";

import { ActionButton, Card, Input, Textarea } from "@/components/ui";
import { FieldRow, SectionDivider } from "../../../../_shared/ui";
import { AttrInput } from "../components/AttrInput";
import { BrandAutocomplete } from "../components/BrandAutocomplete";
import { ProgressSidebar } from "../components/ProgressSidebar";
import {
    canonicalFalaFeedName,
    FALA_HIDDEN_OPTIONALS,
    FALA_PACKAGE_DIMS,
    ML_HIDDEN_RECOMMENDED,
    partitionFalaOptionalAttrs,
    toArray,
} from "../helpers/constants";
import {
    cleanMlDescription,
    findMlDescriptionIssues,
} from "../helpers/ml-description";
import type { UsePublicarWizardReturn } from "../hooks/usePublicarWizard";
import type {
    FalaScoreRule,
    PublicarAttribute,
    PublicarStepId,
} from "../types/publicar-types";

export interface Step2ObligatoriosProps {
    wizard: UsePublicarWizardReturn;
    onJumpToStep: (s: PublicarStepId) => void;
}

/** Chip de regla de score Falabella — verde si el largo cumple el rango. */
function FalaScoreRulesChips({
    rules,
    field,
    currentValue,
}: {
    rules: FalaScoreRule[];
    field: "title" | "description";
    currentValue: string | number | undefined;
}) {
    const filtered = rules.filter((r) => r?.field === field);
    if (filtered.length === 0) return null;
    const len = String(currentValue || "").length;
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {filtered.map((rule, i) => {
                const min = rule.min != null ? Number(rule.min) : null;
                const max = rule.max != null ? Number(rule.max) : null;
                const minOk = min == null || len >= min;
                const maxOk = max == null || len <= max;
                const ok = minOk && maxOk;
                return (
                    <span
                        key={`${rule.field}-${rule.score}-${rule.min}-${rule.max}-${i}`}
                        className={
                            ok
                                ? "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap"
                                : "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border border-gray-200 bg-gray-50 text-gray-600 whitespace-nowrap"
                        }
                        title={rule.hint || ""}
                    >
                        {(rule.score ?? 0) >= 0 ? "+" : ""}
                        {rule.score} score · {rule.hint || ""}
                    </span>
                );
            })}
        </div>
    );
}

export function Step2Obligatorios({ wizard, onJumpToStep }: Step2ObligatoriosProps) {
    const { state, updateField, updateAttr } = wizard;
    const channel = state.channel;
    const cat = channel === "ml" ? state.category : state.categoryFala;

    // Atributos requeridos (sin package dims — esos ya están en Step 1).
    const requiredAttrs: PublicarAttribute[] =
        channel === "ml"
            ? toArray<PublicarAttribute>(state.mlAvailableAttrs).filter(
                  (a) => a.required,
              )
            : toArray<PublicarAttribute>(state.falaRequiredAttrs).filter(
                  (a) =>
                      !FALA_HIDDEN_OPTIONALS.has(
                          canonicalFalaFeedName(a.feedName || a.id || ""),
                      ) &&
                      !FALA_PACKAGE_DIMS.has(
                          canonicalFalaFeedName(a.feedName || a.id || ""),
                      ),
              );

    // Atributos recomendados (era el Step3 dedicado). Para ML filtramos los
    // hidden_recommended (5 atributos de garantía que ensucian el UI). Para
    // Falabella separamos los que impactan score de los demás "Más opciones".
    const mlRecommended: PublicarAttribute[] =
        channel === "ml"
            ? toArray<PublicarAttribute>(state.mlAvailableAttrs)
                  .filter((a) => !a.required)
                  .filter(
                      (a) =>
                          !ML_HIDDEN_RECOMMENDED.has(
                              String(a.id || a.feedName || "").toUpperCase(),
                          ),
                  )
            : [];

    const falaPartition =
        channel === "fala"
            ? partitionFalaOptionalAttrs(
                  toArray<PublicarAttribute>(state.falaOptionalAttrs),
              )
            : { scoreImpact: [], moreOptional: [] };

    const channelData = channel === "ml" ? state.ml : state.fala;
    const attrValue = (key: string) => {
        const attrs = (channelData?.attrs as Record<string, unknown>) ?? {};
        const canonicalKey = canonicalFalaFeedName(key);
        const legacyKey = canonicalKey
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .toLowerCase();
        return ((attrs[canonicalKey] ?? attrs[key] ?? attrs[legacyKey]) as unknown) ?? "";
    };

    const falaMeta = (state.falaBasicMeta || {}) as Record<
        string,
        { content_score_impact?: boolean; score_hint?: string; catalog_note?: string }
    >;
    const falaScoreRules = toArray<FalaScoreRule>(state.falaScoreRules);

    // Total de recomendados (para el header de la sección colapsable).
    const totalRecommended =
        channel === "ml"
            ? mlRecommended.length
            : falaPartition.scoreImpact.length + falaPartition.moreOptional.length;

    // Estado expand/collapse de las 3 secciones colapsables.
    const [recOpen, setRecOpen] = useState(false);
    const [falaMoreOpen, setFalaMoreOpen] = useState(false);

    // Headline score (solo Fala — viene del backend o calculado local).
    const scoreImpactFilled = falaPartition.scoreImpact.filter((a) =>
        Boolean(attrValue(a.feedName ?? a.id ?? "")),
    ).length;
    const scorePctLocal = falaPartition.scoreImpact.length
        ? Math.round((scoreImpactFilled / falaPartition.scoreImpact.length) * 100)
        : 0;
    const scoreDisplay =
        channel === "fala" && state.falaScoreActual != null
            ? state.falaScoreActual
            : scorePctLocal;

    if (!cat) {
        return (
            <div className="px-6 pt-6 pb-10">
                <Card title="Selecciona una categoría primero">
                    <div className="py-8 text-center">
                        <div className="text-amber-500 mx-auto w-12 h-12 mb-3">
                            <Info className="w-12 h-12" />
                        </div>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Los atributos obligatorios dependen de la categoría
                            marketplace. Vuelve al Step 1.
                        </p>
                        <div className="mt-4">
                            <ActionButton
                                variant="secondary"
                                size="sm"
                                onClick={() => onJumpToStep("sku")}
                            >
                                Volver al Step 1
                            </ActionButton>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="px-6 pt-6 pb-10">
            <div className="grid grid-cols-[1fr_360px] gap-6">
                <div className="space-y-4 min-w-0">
                    {state.fichaOrigen && (
                        <div className="mb-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                            Datos precargados desde tu publicación en{" "}
                            {state.fichaOrigen === "mercadolibre" ? "MercadoLibre" : "Falabella"}.
                            Revísalos y ajústalos antes de publicar.
                        </div>
                    )}

                    {/* ── 1. Datos Falabella (solo Fala) ───────────────────── */}
                    {channel === "fala" && (
                        <Card title="Datos Falabella">
                            <FieldRow
                                label="SellerSku"
                                hint="Identificador interno. Se envía a nivel Product. Pre-fill con el SKU."
                            >
                                <Input
                                    value={state.fala.SellerSku ?? ""}
                                    onChange={(e) =>
                                        updateField(
                                            "fala",
                                            "SellerSku",
                                            e.target.value,
                                        )
                                    }
                                    placeholder={state.sku}
                                    className="tabular-nums"
                                />
                            </FieldRow>
                            <FieldRow
                                label={
                                    falaMeta.Brand?.content_score_impact
                                        ? "Marca ↑ score"
                                        : "Marca"
                                }
                                hint={
                                    falaMeta.Brand?.catalog_note ||
                                    "Falabella valida marcas contra su catálogo interno."
                                }
                            >
                                <BrandAutocomplete
                                    value={state.fala.Brand ?? ""}
                                    onChange={(v) =>
                                        updateField("fala", "Brand", v)
                                    }
                                    placeholder={state.sap?.marca ?? "—"}
                                />
                            </FieldRow>
                            <FieldRow
                                label="Estado operador"
                                hint="active = visible · inactive = oculto en el catálogo."
                            >
                                <select
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={state.fala.Status ?? "active"}
                                    onChange={(e) =>
                                        updateField(
                                            "fala",
                                            "Status",
                                            e.target.value as "active" | "inactive",
                                        )
                                    }
                                >
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                </select>
                            </FieldRow>
                        </Card>
                    )}

                    {/* ── 2. Descripción ───────────────────────────────────── */}
                    <Card title="Descripción">
                        {channel === "ml" ? (
                            <FieldRow
                                label="Descripción del producto"
                                align="top"
                                hint="Texto plano. ML rechaza HTML y emojis — los limpiamos automáticamente al publicar."
                            >
                                <Textarea
                                    rows={7}
                                    value={state.ml.description ?? ""}
                                    onChange={(e) =>
                                        updateField(
                                            "ml",
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Material, dimensiones, casos de uso, contenido del paquete…"
                                    className="resize-y min-h-[140px]"
                                />
                                <DescriptionIssuesChip
                                    text={String(state.ml.description ?? "")}
                                    onClean={(cleaned) =>
                                        updateField("ml", "description", cleaned)
                                    }
                                />
                            </FieldRow>
                        ) : (
                            <FieldRow
                                label={
                                    falaMeta.Description?.content_score_impact
                                        ? "Descripción ↑ score"
                                        : "Descripción"
                                }
                                align="top"
                                hint={
                                    falaMeta.Description?.score_hint ||
                                    "Descripción principal del producto. Texto plano."
                                }
                            >
                                <Textarea
                                    rows={7}
                                    value={state.fala.Description ?? ""}
                                    onChange={(e) =>
                                        updateField("fala", "Description", e.target.value)
                                    }
                                    className="resize-y min-h-[140px]"
                                />
                                <FalaScoreRulesChips
                                    rules={falaScoreRules}
                                    field="description"
                                    currentValue={state.fala.Description}
                                />
                                <div className="text-xs text-gray-400 text-right mt-1 tabular-nums">
                                    {(state.fala.Description ?? "").length} caracteres
                                </div>
                            </FieldRow>
                        )}
                    </Card>

                    {/* ── 3. Atributos categoría (sin dims) ───────────────── */}
                    {requiredAttrs.length > 0 && (
                        <Card
                            title={
                                channel === "ml"
                                    ? `Atributos de la categoría (${requiredAttrs.length})`
                                    : `Atributos requeridos de Falabella (${requiredAttrs.length})`
                            }
                        >
                            <p className="text-xs text-gray-500 mb-3">
                                {cat.path || cat.nombre || "Categoría"}
                            </p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                {requiredAttrs.map((attr) => {
                                    // ML usa el id del atributo tal cual (BRAND, MODEL, …):
                                    // es la key que leen el scorer de obligatorios (coverage),
                                    // el payload-builder y el seed de SAP. canonicalFalaFeedName
                                    // es solo de Falabella (mapea BRAND→Brand, etc.) y corrompía
                                    // la key en ML (escribía "Brand" pero todos leen "BRAND").
                                    const key =
                                        channel === "ml"
                                            ? attr.id || attr.feedName || ""
                                            : canonicalFalaFeedName(
                                                  attr.feedName || attr.id || "",
                                              );
                                    return (
                                        <AttrInput
                                            key={key}
                                            attr={attr}
                                            value={attrValue(key)}
                                            onChange={(v) =>
                                                updateAttr(channel, key, v)
                                            }
                                            layout={
                                                channel === "fala" ? "stacked" : "row"
                                            }
                                            missingRequired={
                                                !attrValue(key) ||
                                                attrValue(key) === ""
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* ── 4. ATRIBUTOS RECOMENDADOS (colapsables) ─────────── */}
                    {/* Antes vivían en Step3 dedicado. Movidos acá como sección
                        colapsable para reducir steps del wizard (4 → 4 con
                        Imágenes nueva). Default: cerrado, el user los abre si
                        quiere mejorar la publicación. */}
                    {totalRecommended > 0 && (
                        // title="" porque usamos un header custom interactivo
                        // (todo el Card es el botón collapse/expand). Card de
                        // OMS requiere title prop pero acepta string vacío.
                        <Card title="">
                            <button
                                type="button"
                                onClick={() => setRecOpen((o) => !o)}
                                className="w-full flex items-center justify-between gap-3 -m-4 px-4 py-3 hover:bg-gray-50 rounded-t-lg transition-colors"
                                aria-expanded={recOpen}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Star className="w-4 h-4 text-amber-500 shrink-0" />
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-gray-900">
                                            Atributos recomendados (opcional)
                                        </div>
                                        <div className="text-[11.5px] text-gray-500 mt-0.5">
                                            {totalRecommended} campos opcionales que mejoran calidad o score. No bloquean la publicación.
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight
                                    className="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-150"
                                    style={{
                                        transform: recOpen ? "rotate(90deg)" : "rotate(0deg)",
                                    }}
                                />
                            </button>

                            {recOpen && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    {/* Headline score (solo Fala) */}
                                    {channel === "fala" && (
                                        <div className="flex items-center gap-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-white border-2 border-amber-500 grid place-items-center text-sm font-bold text-amber-700 shrink-0">
                                                {scoreDisplay}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {state.falaScoreActual != null
                                                        ? `Score Falabella actual: ${state.falaScoreActual}%`
                                                        : "Cobertura de atributos recomendados"}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {scoreImpactFilled} de {falaPartition.scoreImpact.length} atributos que impactan score completados.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {channel === "ml" ? (
                                        <>
                                            <p className="text-xs text-gray-500 mb-3">
                                                {state.category?.nombre ?? "categoría"}
                                            </p>
                                            <div className="grid grid-cols-2 gap-x-8">
                                                {mlRecommended.map((attr) => {
                                                    const key = attr.id;
                                                    return (
                                                        <AttrInput
                                                            key={key}
                                                            attr={attr}
                                                            value={attrValue(key)}
                                                            onChange={(v) => updateAttr("ml", key, v)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {falaPartition.scoreImpact.length > 0 && (
                                                <>
                                                    <SectionDivider
                                                        icon={<TrendingUp className="w-4 h-4" />}
                                                    >
                                                        Recomendados (impactan score) (
                                                        {falaPartition.scoreImpact.length})
                                                    </SectionDivider>
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-2">
                                                        {falaPartition.scoreImpact.map((attr) => {
                                                            const key = attr.feedName ?? attr.id;
                                                            return (
                                                                <AttrInput
                                                                    key={key}
                                                                    attr={attr}
                                                                    value={attrValue(key)}
                                                                    onChange={(v) =>
                                                                        updateAttr("fala", key, v)
                                                                    }
                                                                    layout="stacked"
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}

                                            {falaPartition.moreOptional.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFalaMoreOpen((s) => !s)}
                                                        className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 hover:text-gray-700 font-semibold mb-2"
                                                    >
                                                        <ChevronRight
                                                            className="w-3 h-3 transition-transform duration-150"
                                                            style={{
                                                                transform: falaMoreOpen
                                                                    ? "rotate(90deg)"
                                                                    : "rotate(0deg)",
                                                            }}
                                                        />
                                                        Más opciones ({falaPartition.moreOptional.length})
                                                    </button>
                                                    {falaMoreOpen && (
                                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                            {falaPartition.moreOptional.map((attr) => {
                                                                const key = attr.feedName ?? attr.id;
                                                                return (
                                                                    <AttrInput
                                                                        key={key}
                                                                        attr={attr}
                                                                        value={attrValue(key)}
                                                                        onChange={(v) =>
                                                                            updateAttr("fala", key, v)
                                                                        }
                                                                        layout="stacked"
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                <ProgressSidebar
                    currentStep="obligatorios"
                    coverage={wizard.coverage}
                    channel={channel}
                    onJumpToStep={onJumpToStep}
                />
            </div>
        </div>
    );
}

/** Chip + botón "Limpiar HTML / emojis" para descripción ML. */
function DescriptionIssuesChip({
    text,
    onClean,
}: {
    text: string;
    onClean: (cleaned: string) => void;
}) {
    const issues = findMlDescriptionIssues(text);
    const htmlCount = issues.filter((i) => i.kind === "html").length;
    const emojiCount = issues.filter((i) => i.kind === "emoji").length;
    return (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
            {issues.length > 0 && (
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs text-rose-700 bg-rose-50 border border-rose-200"
                    title={`Primer problema: ${issues[0]!.kind === "html" ? "HTML" : "emoji"} "${issues[0]!.match}" en posición ${issues[0]!.index}`}
                >
                    ⚠ ML rechaza:{" "}
                    {htmlCount > 0 && (
                        <>
                            {htmlCount} HTML tag{htmlCount === 1 ? "" : "s"}
                        </>
                    )}
                    {htmlCount > 0 && emojiCount > 0 && ", "}
                    {emojiCount > 0 && (
                        <>
                            {emojiCount} emoji{emojiCount === 1 ? "" : "s"}
                        </>
                    )}
                </span>
            )}
            {issues.length > 0 && (
                <button
                    type="button"
                    onClick={() => onClean(cleanMlDescription(text))}
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-700 rounded-md hover:bg-blue-50"
                >
                    Limpiar HTML / emojis
                </button>
            )}
            <span className="flex-1" />
            <span className="text-xs text-gray-400 tabular-nums">
                {text.length} caracteres
            </span>
        </div>
    );
}
