// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorAtributosSection.tsx
//
// Card "Atributos" del editor — match al legacy editar.html (sec-attrs, líneas 2122-2218).
//
// Layout:
//   - Header con count + chip "N faltantes"
//   - Grupo "Pendientes" (atributos faltantes editables) — siempre visible
//   - Grupo "Completos" (con valor llenado) — colapsable
//
// Cada atributo se renderiza con:
//   - Nombre (visible) + ID (small, code) + badge de prioridad (Requerido/
//     Recomendado/Opcional)
//   - Lock icon si `editable === false`
//   - Input según `tipo`: boolean (radios), select (con opciones[]), text default
//   - multivaluado → checkboxes (no implementado V1, fallback a text)
//
// El borrador se mantiene en `editAttrs[id]` (state del hook), no pega al
// backend hasta que el usuario clickea Guardar.

"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Lock, Tag } from "lucide-react";
import { Card, Input } from "@/components/ui";
import { SectionDivider } from "../../../../_shared/ui";
import type {
    EditorAtributo,
    EditorProduct,
} from "../types/editor-types";
import type { EditAttrValue } from "../hooks/useEditorState";

export interface EditorAtributosSectionProps {
    product: EditorProduct;
    editAttrs: Record<string, EditAttrValue>;
    onUpdateAttr: (id: string, value: EditAttrValue) => void;
}

const SELECT_CLASSES = [
    "block w-full rounded-md border border-gray-300 px-3 py-2",
    "text-sm text-gray-900 bg-white shadow-sm",
    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
    "cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed",
].join(" ");

export function EditorAtributosSection({
    product,
    editAttrs,
    onUpdateAttr,
}: EditorAtributosSectionProps) {
    const allAttrs = product.atributos || [];
    const [showComp, setShowComp] = useState(false);

    const { faltantes, completos } = useMemo(() => {
        const f: EditorAtributo[] = [];
        const c: EditorAtributo[] = [];
        for (const a of allAttrs) {
            if (a.editable === false) {
                // No editables van a completos (read-only).
                c.push(a);
            } else if (a.faltante) {
                // Bucket por el flag `faltante` del BACKEND, NO por el draft en
                // vivo. Si re-bucketeáramos según lo tipeado, al escribir el 1er
                // carácter el atributo saltaba de "Pendientes" a "Completos"
                // (colapsado) y se perdía el foco → parecía que "no dejaba
                // escribir". El atributo se mueve a Completos recién tras
                // Guardar + reload (cuando el backend devuelve faltante=false).
                f.push(a);
            } else {
                c.push(a);
            }
        }
        // Faltantes ordenados por prioridad: crítico > recomendado > opcional
        const priorityWeight: Record<string, number> = {
            critico: 0,
            recomendado: 1,
            completo: 2,
        };
        f.sort((a, b) => {
            const pa = priorityWeight[a.prioridad ?? "opcional"] ?? 3;
            const pb = priorityWeight[b.prioridad ?? "opcional"] ?? 3;
            if (pa !== pb) return pa - pb;
            return (a.nombre || a.id).localeCompare(b.nombre || b.id);
        });
        c.sort((a, b) => (a.nombre || a.id).localeCompare(b.nombre || b.id));
        return { faltantes: f, completos: c };
    }, [allAttrs]);

    if (allAttrs.length === 0) {
        return (
            <Card title="Atributos">
                <SectionDivider icon={<Tag className="w-4 h-4" />}>
                    Atributos de categoría
                </SectionDivider>
                <div className="text-sm text-gray-500 py-4">
                    Este producto no expone atributos editables en el shape del
                    marketplace.
                </div>
            </Card>
        );
    }

    return (
        <Card title={`Atributos (${allAttrs.length})`}>
            <SectionDivider icon={<Tag className="w-4 h-4" />}>
                {faltantes.length > 0
                    ? `Pendientes (${faltantes.length})`
                    : "Atributos"}
            </SectionDivider>

            {faltantes.length === 0 ? (
                <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                    ✓ No hay atributos faltantes editables.
                </div>
            ) : (
                <div className="space-y-1">
                    {faltantes.map((attr) => (
                        <AttrRow
                            key={attr.id}
                            attr={attr}
                            value={
                                editAttrs[attr.id] !== undefined
                                    ? editAttrs[attr.id]
                                    : attr.valor
                            }
                            onChange={(v) => onUpdateAttr(attr.id, v)}
                            highlighted
                        />
                    ))}
                </div>
            )}

            {completos.length > 0 && (
                <>
                    <button
                        type="button"
                        onClick={() => setShowComp((v) => !v)}
                        className="w-full mt-4 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-gray-500 hover:text-gray-700"
                    >
                        {showComp ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        Completos ({completos.length})
                    </button>
                    {showComp && (
                        <div className="space-y-1 mt-2">
                            {completos.map((attr) => (
                                <AttrRow
                                    key={attr.id}
                                    attr={attr}
                                    value={
                                        editAttrs[attr.id] !== undefined
                                            ? editAttrs[attr.id]
                                            : attr.valor
                                    }
                                    onChange={(v) => onUpdateAttr(attr.id, v)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </Card>
    );
}

// ─── AttrRow ──────────────────────────────────────────────────────────────

function PriorityBadge({ prioridad }: { prioridad?: string }) {
    if (!prioridad || prioridad === "completo") return null;
    const map: Record<string, { label: string; classes: string }> = {
        critico: {
            label: "Requerido",
            classes: "bg-rose-50 text-rose-700 ring-rose-200",
        },
        recomendado: {
            label: "Recomendado",
            classes: "bg-amber-50 text-amber-700 ring-amber-200",
        },
    };
    const meta = map[prioridad] ?? {
        label: "Opcional",
        classes: "bg-blue-50 text-blue-700 ring-blue-200",
    };
    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset ${meta.classes}`}
        >
            {meta.label}
        </span>
    );
}

function AttrRow({
    attr,
    value,
    onChange,
    highlighted,
}: {
    attr: EditorAtributo;
    value: EditAttrValue;
    onChange: (v: EditAttrValue) => void;
    highlighted?: boolean;
}) {
    const isEditable = attr.editable !== false;
    return (
        <div
            className={[
                "grid grid-cols-[1fr_360px] gap-6 py-2.5 border-b border-gray-100 last:border-b-0",
                highlighted ? "bg-rose-50/30 -mx-2 px-2 rounded-md" : "",
            ].join(" ")}
        >
            {/* Label + badges */}
            <div className="min-w-0 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                        {attr.nombre || attr.id}
                    </span>
                    <code className="text-[10px] text-gray-400 tabular-nums">
                        {attr.id}
                    </code>
                    <PriorityBadge prioridad={attr.prioridad} />
                    {!isEditable && (
                        <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200"
                            title="No editable"
                        >
                            <Lock className="w-2.5 h-2.5" />
                            Bloqueado
                        </span>
                    )}
                    {attr.es_variante && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200">
                            Variante
                        </span>
                    )}
                </div>
            </div>

            {/* Control */}
            <div className="min-w-0">
                <AttrControl
                    attr={attr}
                    value={value}
                    onChange={onChange}
                    disabled={!isEditable}
                />
                {(attr.descripcion || attr.ejemplo) && (
                    <p className="mt-1 text-[11px] leading-snug text-gray-500">
                        {attr.descripcion}
                        {attr.ejemplo && (
                            <span className="text-gray-400">
                                {attr.descripcion ? " · " : ""}Ej: {attr.ejemplo}
                            </span>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
}

function AttrControl({
    attr,
    value,
    onChange,
    disabled,
}: {
    attr: EditorAtributo;
    value: EditAttrValue;
    onChange: (v: EditAttrValue) => void;
    disabled: boolean;
}) {
    const t = attr.tipo ?? "text";

    // ── boolean → radios Sí/No
    if (t === "boolean") {
        const yesValues = ["si", "sí", "yes", "true", "1"];
        const noValues = ["no", "false", "0"];
        const cur = String(value ?? "").toLowerCase().trim();
        const esSi = yesValues.includes(cur);
        const esNo = noValues.includes(cur);
        return (
            <div className="flex items-center gap-4 py-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="radio"
                        name={`bool-${attr.id}`}
                        checked={esSi}
                        disabled={disabled}
                        onChange={() => onChange("si")}
                        className="accent-blue-700"
                    />
                    <span className="text-sm">Sí</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="radio"
                        name={`bool-${attr.id}`}
                        checked={esNo}
                        disabled={disabled}
                        onChange={() => onChange("no")}
                        className="accent-blue-700"
                    />
                    <span className="text-sm text-gray-500">No</span>
                </label>
                {!esSi && !esNo && (
                    <span className="text-xs text-gray-400 italic">sin responder</span>
                )}
            </div>
        );
    }

    // ── select con opciones[] → dropdown
    if (t === "select" && Array.isArray(attr.opciones)) {
        return (
            <select
                value={String(value ?? "")}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={SELECT_CLASSES}
            >
                <option value="">— seleccionar —</option>
                {attr.opciones.map((opt) => (
                    <option key={String(opt)} value={String(opt)}>
                        {String(opt)}
                    </option>
                ))}
            </select>
        );
    }

    // ── number → input numeric
    if (t === "number") {
        return (
            <Input
                type="number"
                value={value == null ? "" : String(value)}
                onChange={(e) =>
                    onChange(e.target.value === "" ? null : Number(e.target.value))
                }
                disabled={disabled}
                className="tabular-nums"
            />
        );
    }

    // ── default: text input (incluye select sin opciones, multivaluado, etc.)
    return (
        <Input
            value={value == null ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        />
    );
}
