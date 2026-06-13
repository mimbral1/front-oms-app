import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Card from "@/components/ui/card/Card";
import type { ProductoAtributo } from "@/features/catalogo/types/plataforma-ecommerce/detail-types";

type Props = {
    attributes: ProductoAtributo[];
    editAttributes: Record<string, string | number | boolean | string[] | null>;
    onAttributeChange: (field: string, value: string | number | boolean | string[] | null) => void;
};

export function MarketplaceProductosAtributosSection({
    attributes,
    editAttributes,
    onAttributeChange,
}: Props) {
    const renderAttributeField = (attr: ProductoAtributo) => {
        const value = editAttributes[attr.id];

        if (!attr.editable) {
            if (Array.isArray(value)) {
                return (
                    <span className="text-sm text-gray-700">
                        {value.length > 0 ? value.join(", ") : "-"}
                    </span>
                );
            }
            const text = value === null || value === undefined || value === "" ? "-" : String(value);
            return <span className="text-sm text-gray-700">{text}</span>;
        }

        if (attr.tipo === "select" && attr.opciones && attr.opciones.length > 0) {
            const currentValue = typeof value === "string" && value.length > 0 ? value : null;
            return (
                <Autocomplete
                    fullWidth
                    options={attr.opciones}
                    value={currentValue}
                    onChange={(_, nextValue) => onAttributeChange(attr.id, nextValue ?? "")}
                    isOptionEqualToValue={(option, selected) => option === selected}
                    autoHighlight
                    clearOnEscape
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            placeholder="Seleccionar o buscar opcion..."
                            helperText={`${attr.opciones?.length ?? 0} opciones disponibles`}
                        />
                    )}
                    ListboxProps={{
                        style: {
                            maxHeight: 280,
                        },
                    }}
                />
            );
        }

        if (attr.tipo === "boolean") {
            const boolValue = typeof value === "boolean" ? value : String(value ?? "false") === "true";
            return (
                <select
                    value={String(boolValue)}
                    onChange={(e) => onAttributeChange(attr.id, e.target.value === "true")}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                    <option value="true">Si</option>
                    <option value="false">No</option>
                </select>
            );
        }

        if (attr.tipo === "number") {
            return (
                <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={value ?? ""}
                    onChange={(e) => onAttributeChange(attr.id, e.target.value === "" ? "" : Number(e.target.value))}
                />
            );
        }

        if (attr.multivaluado) {
            const display = Array.isArray(value) ? value.join(", ") : String(value ?? "");
            return (
                <TextField
                    size="small"
                    fullWidth
                    value={display}
                    onChange={(e) => {
                        const parts = e.target.value
                            .split(",")
                            .map((part) => part.trim())
                            .filter(Boolean);
                        onAttributeChange(attr.id, parts);
                    }}
                    helperText="Valores separados por coma"
                />
            );
        }

        return (
            <TextField
                size="small"
                fullWidth
                value={value ?? ""}
                onChange={(e) => onAttributeChange(attr.id, e.target.value)}
            />
        );
    };

    return (
        <Card title={`Atributos (${attributes.length})`}>
            {attributes.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    No hay atributos para mostrar.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {attributes.map((attr) => (
                        <div
                            key={attr.id}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm"
                        >
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold leading-5 text-gray-800">{attr.nombre}</h4>
                                <div className="flex flex-wrap items-center justify-end gap-1 text-[11px] sm:text-xs">
                                    {attr.editable && (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                                            Editable
                                        </span>
                                    )}
                                    {attr.requerido && (
                                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                                            Requerido
                                        </span>
                                    )}
                                    {attr.faltante && (
                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                            Faltante
                                        </span>
                                    )}
                                    {attr.es_variante && (
                                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                                            Variante
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="w-full">{renderAttributeField(attr)}</div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
