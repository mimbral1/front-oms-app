// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/components/AtributoSummary.tsx
//
// Tab SUMMARY del detail view. Replica el mockup `atributos.html`
// (sección "Detail" + "Others" + "Creator user").
//
// ADAPTACIÓN: el mockup Janis muestra un "Attribute Set" (conjunto de atributos
// hijos en una tabla). Como el backend del PIM trabaja con atributos
// INDIVIDUALES (no agrupados en sets), acá mostramos los campos del atributo
// directamente. La tabla del mockup se omite — el atributo no tiene hijos.
// Si en V2 introducimos Attribute Sets, esta vista debe rediseñarse.

"use client";

import { List, Info, Star } from "lucide-react";
import { Card, Sec, Field, UnderlineInput } from "../../../../_shared/janis";
import type { Atributo, AtributoNivelHerencia } from "../types/atributo-types";

export interface AtributoSummaryProps {
    /** Versión editable (draft del hook). Si null, se muestra esqueleto. */
    draft: Atributo | null;
    /** Set field handler — viene de `useAtributo`. */
    onChange: <K extends keyof Atributo>(key: K, value: Atributo[K]) => void;
    /** Si true, muestra loading state en lugar de form. */
    loading?: boolean;
}

const HERENCIA_LABEL: Record<AtributoNivelHerencia, string> = {
    global: "Global — aplica a todos los productos",
    categoria: "Por categoría — opt-in por N3",
    sku: "Por SKU — único por publicación",
};

export function AtributoSummary({ draft, onChange, loading }: AtributoSummaryProps) {
    if (loading || !draft) {
        return (
            <div className="px-6 pt-6 pb-10">
                <Card>
                    <div className="text-gray-400 text-[13px]">Cargando atributo…</div>
                </Card>
            </div>
        );
    }

    return (
        <div className="px-6 pt-6 pb-10">
            <Card>
                <div className="grid grid-cols-[1fr_360px] gap-12">
                    {/* Columna izquierda: Detail */}
                    <div className="min-w-0">
                        <Sec icon={<List className="w-[18px] h-[18px]" />}>Detail</Sec>

                        <Field label="ID">
                            <UnderlineInput
                                tabular
                                value={String(draft.id ?? "")}
                                disabled
                                aria-label="ID del atributo"
                            />
                        </Field>

                        <Field
                            label="Nombre"
                            hint="Aparece como label en formularios y reportes."
                        >
                            <UnderlineInput
                                value={draft.nombre ?? ""}
                                onChange={(e) => onChange("nombre", e.target.value)}
                                placeholder="Ej. Color principal"
                            />
                        </Field>

                        <Field
                            label="Nombre técnico"
                            hint="Identificador interno (snake_case). Se usa como key en payloads."
                        >
                            <UnderlineInput
                                tabular
                                value={draft.nombreTecnico ?? ""}
                                disabled
                                aria-label="Nombre técnico (read-only)"
                            />
                        </Field>

                        <Field label="Tipo de dato" hint="Solo lectura — no editable post-creación.">
                            <UnderlineInput
                                value={draft.tipoDato ?? "—"}
                                disabled
                                aria-label="Tipo de dato"
                            />
                        </Field>

                        <Field label="Unidad de medida" hint="Solo aplica si el tipo es number_unit.">
                            <UnderlineInput
                                value={draft.unidadMedida ?? ""}
                                onChange={(e) => onChange("unidadMedida", e.target.value)}
                                placeholder="—"
                                disabled={draft.tipoDato !== "number_unit"}
                            />
                        </Field>
                    </div>

                    {/* Columna derecha: Others */}
                    <div className="border-l border-gray-200 pl-10">
                        <Sec icon={<Info className="w-[18px] h-[18px]" />}>Others</Sec>

                        <Field label="Nivel de herencia">
                            <NivelHerenciaSelect
                                value={draft.nivelHerencia ?? "global"}
                                onChange={(v) => onChange("nivelHerencia", v)}
                            />
                        </Field>

                        <Field label="Obligatorio">
                            <BoolToggle
                                value={!!draft.esObligatorio}
                                onChange={(v) => onChange("esObligatorio", v)}
                                labelOn="Sí — siempre requerido"
                                labelOff="No — opcional"
                            />
                        </Field>

                        <Field label="Activo">
                            <BoolToggle
                                value={!!draft.activo}
                                onChange={(v) => onChange("activo", v)}
                                labelOn="Activo"
                                labelOff="Inactivo (no se ofrece a operadores)"
                            />
                        </Field>

                        <div className="h-4" />
                        <Sec icon={<Star className="w-[18px] h-[18px]" />}>Estadísticas</Sec>
                        <Field label="Opciones">
                            <span className="tabular-nums text-gray-900">
                                {draft.totalOpciones ?? 0}{" "}
                                <span className="text-gray-400 text-[11.5px]">
                                    (valores predefinidos)
                                </span>
                            </span>
                        </Field>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function NivelHerenciaSelect({
    value,
    onChange,
}: {
    value: AtributoNivelHerencia;
    onChange: (v: AtributoNivelHerencia) => void;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as AtributoNivelHerencia)}
            className="w-full bg-transparent border-0 border-b border-gray-200 outline-none py-1.5 text-[13.5px] text-gray-900 hover:border-gray-300 focus:border-blue-700 cursor-pointer"
        >
            {(Object.keys(HERENCIA_LABEL) as AtributoNivelHerencia[]).map((k) => (
                <option key={k} value={k}>
                    {HERENCIA_LABEL[k]}
                </option>
            ))}
        </select>
    );
}

function BoolToggle({
    value,
    onChange,
    labelOn,
    labelOff,
}: {
    value: boolean;
    onChange: (v: boolean) => void;
    labelOn: string;
    labelOff: string;
}) {
    return (
        <div className="flex items-center gap-4 py-1.5">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                    type="radio"
                    name={`bool-${labelOn}-${labelOff}`}
                    checked={value === true}
                    onChange={() => onChange(true)}
                    className="accent-blue-700"
                />
                <span className="text-[13px]">{labelOn}</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                    type="radio"
                    name={`bool-${labelOn}-${labelOff}`}
                    checked={value === false}
                    onChange={() => onChange(false)}
                    className="accent-blue-700"
                />
                <span className="text-[13px] text-gray-500">{labelOff}</span>
            </label>
        </div>
    );
}
