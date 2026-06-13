"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    DocumentTextIcon,
    AdjustmentsHorizontalIcon,
    UserIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import {
    Select,
    MenuItem,
    FormControl,
    Autocomplete,
    TextField,
    Chip,
} from "@mui/material";

export interface Attribute {
    Name: string;
    RefId: string;
    Group: string;
    Category: string;
    Accounts: string[];
    AppliesToSkus: boolean;
    Type: "text" | "number";
    Options: string[];
    Multiple: boolean;
    Mandatory: boolean;
    DefaultValue: string;
    Status: "Activo" | "Inactivo";
    DateModified: string | null;
    UpdatedByName: string | null;
    UpdatedByEmail: string | null;
    createdAtFormatted?: string;
}

export interface SelectOption {
    label: string;
    value: string;
}

interface AtributosFieldsProps {
    attribute: Attribute;
    readOnly?: boolean;
    onChange?: (field: keyof Attribute, value: any) => void;
    isNew?: boolean;
    groupOptions?: SelectOption[];
    categoryOptions?: SelectOption[];
    accountOptions?: SelectOption[];
    typeOptions?: SelectOption[];
}

/* ── Componente Toggle reutilizable ── */
const Toggle = ({
    checked,
    onChange,
    readOnly,
}: {
    checked: boolean;
    onChange: () => void;
    readOnly?: boolean;
}) => {
    if (readOnly) {
        return (
            <div className="flex items-center gap-2">
                <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${checked ? "bg-green-500" : "bg-red-400"
                        }`}
                />
                <span className="text-sm font-medium text-gray-900">
                    {checked ? "Sí" : "No"}
                </span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${checked
                        ? "bg-green-500 focus:ring-green-500"
                        : "bg-gray-300 focus:ring-gray-400"
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
            <div className="flex items-center gap-1.5">
                <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${checked ? "bg-green-500" : "bg-red-400"
                        }`}
                />
                <span
                    className={`text-sm font-medium ${checked ? "text-green-700" : "text-red-500"
                        }`}
                >
                    {checked ? "Sí" : "No"}
                </span>
            </div>
        </div>
    );
};

export const AtributosFields: React.FC<AtributosFieldsProps> = ({
    attribute,
    readOnly = true,
    onChange,
    isNew = false,
    groupOptions = [],
    categoryOptions = [],
    accountOptions = [],
    typeOptions = [],
}) => {
    const handleChange =
        (field: keyof Attribute) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                onChange?.(field, event.target.value);
            };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
                {/* ── Card: DETALLE ── */}
                <Card title="DETALLE" icon={DocumentTextIcon}>
                    <div className="space-y-1">
                        {/* Name */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Nombre</span>
                            {readOnly ? (
                                <span className="truncate text-sm font-medium text-gray-900">
                                    {attribute.Name || "--"}
                                </span>
                            ) : (
                                <input
                                    type="text"
                                    value={attribute.Name ?? ""}
                                    onChange={handleChange("Name")}
                                    placeholder="Nombre del atributo"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            )}
                        </div>

                        {/* Ref ID */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Ref ID</span>
                            {readOnly ? (
                                <span className="truncate text-sm font-medium text-gray-900">
                                    {attribute.RefId || "--"}
                                </span>
                            ) : (
                                <input
                                    type="text"
                                    value={attribute.RefId ?? ""}
                                    onChange={handleChange("RefId")}
                                    placeholder="Identificador de referencia"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            )}
                        </div>

                        {/* Group */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Grupo</span>
                            {readOnly ? (
                                <span className="truncate text-sm font-medium text-gray-900">
                                    {attribute.Group || "--"}
                                </span>
                            ) : groupOptions.length > 0 ? (
                                <FormControl fullWidth variant="standard" size="small">
                                    <Select
                                        value={attribute.Group ?? ""}
                                        onChange={(e) => onChange?.("Group", e.target.value)}
                                        disableUnderline
                                        displayEmpty
                                        sx={{ fontSize: "0.875rem" }}
                                        renderValue={(val) => (
                                            <span
                                                className={`text-sm font-medium ${val ? "text-gray-900" : "text-gray-400"
                                                    }`}
                                            >
                                                {val || "Seleccionar grupo"}
                                            </span>
                                        )}
                                    >
                                        {groupOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <input
                                    type="text"
                                    value={attribute.Group ?? ""}
                                    onChange={handleChange("Group")}
                                    placeholder="Grupo"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            )}
                        </div>

                        {/* Category */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Categoría</span>
                            {readOnly ? (
                                <span className="truncate text-sm font-medium text-gray-900">
                                    {attribute.Category || "--"}
                                </span>
                            ) : categoryOptions.length > 0 ? (
                                <FormControl fullWidth variant="standard" size="small">
                                    <Select
                                        value={attribute.Category ?? ""}
                                        onChange={(e) => onChange?.("Category", e.target.value)}
                                        disableUnderline
                                        displayEmpty
                                        sx={{ fontSize: "0.875rem" }}
                                        renderValue={(val) => (
                                            <span
                                                className={`text-sm font-medium ${val ? "text-gray-900" : "text-gray-400"
                                                    }`}
                                            >
                                                {val || "Seleccionar categoría"}
                                            </span>
                                        )}
                                    >
                                        <MenuItem value="">
                                            <em className="text-gray-400">Limpiar</em>
                                        </MenuItem>
                                        {categoryOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <input
                                    type="text"
                                    value={attribute.Category ?? ""}
                                    onChange={handleChange("Category")}
                                    placeholder="Categoría"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            )}
                        </div>

                        {/* Accounts */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Cuentas</span>
                            {readOnly ? (
                                <span className="truncate text-sm font-medium text-gray-900">
                                    {attribute.Accounts?.length
                                        ? attribute.Accounts.join(", ")
                                        : "--"}
                                </span>
                            ) : accountOptions.length > 0 ? (
                                <Autocomplete
                                    multiple
                                    size="small"
                                    options={accountOptions}
                                    getOptionLabel={(opt) => opt.label}
                                    value={accountOptions.filter((o) =>
                                        (attribute.Accounts || []).includes(o.value)
                                    )}
                                    onChange={(_, selected) => {
                                        onChange?.(
                                            "Accounts",
                                            selected.map((s) => s.value)
                                        );
                                    }}
                                    renderTags={(tagValue, getTagProps) =>
                                        tagValue.map((option, index) => {
                                            const { key, ...restProps } = getTagProps({ index });
                                            return (
                                                <Chip
                                                    key={key}
                                                    label={option.label}
                                                    size="small"
                                                    {...restProps}
                                                />
                                            );
                                        })
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="standard"
                                            placeholder="Seleccionar cuentas"
                                            InputProps={{
                                                ...params.InputProps,
                                                disableUnderline: true,
                                            }}
                                        />
                                    )}
                                    fullWidth
                                    disableCloseOnSelect
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={attribute.Accounts?.join(", ") ?? ""}
                                    readOnly
                                    placeholder="Sin cuentas"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            )}
                        </div>

                        {/* Applies to SKUs */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Aplica a SKUs</span>
                            <Toggle
                                checked={attribute.AppliesToSkus}
                                onChange={() =>
                                    onChange?.("AppliesToSkus", !attribute.AppliesToSkus)
                                }
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 py-3">
                            <span className="text-sm text-gray-500">Estado</span>
                            {readOnly ? (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-block h-2.5 w-2.5 rounded-full ${attribute.Status === "Activo"
                                                ? "bg-green-500"
                                                : "bg-red-400"
                                            }`}
                                    />
                                    <span className="text-sm font-medium text-gray-900">
                                        {attribute.Status}
                                    </span>
                                </div>
                            ) : (
                                <Toggle
                                    checked={attribute.Status === "Activo"}
                                    onChange={() =>
                                        onChange?.(
                                            "Status",
                                            attribute.Status === "Activo" ? "Inactivo" : "Activo"
                                        )
                                    }
                                />
                            )}
                        </div>
                    </div>
                </Card>

                {/* ── Card: COMPOSICIÓN ── */}
                <Card title="COMPOSICIÓN" icon={AdjustmentsHorizontalIcon}>
                    <div className="space-y-1">
                        {/* Type */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Tipo</span>
                            {readOnly ? (
                                <span className="truncate text-sm font-medium text-gray-900">
                                    {attribute.Type === "text"
                                        ? "Texto"
                                        : attribute.Type === "number"
                                            ? "Numérico"
                                            : attribute.Type || "--"}
                                </span>
                            ) : typeOptions.length > 0 ? (
                                <FormControl fullWidth variant="standard" size="small">
                                    <Select
                                        value={attribute.Type ?? ""}
                                        onChange={(e) => onChange?.("Type", e.target.value)}
                                        disableUnderline
                                        displayEmpty
                                        sx={{ fontSize: "0.875rem" }}
                                        renderValue={(val) => (
                                            <span
                                                className={`text-sm font-medium ${val ? "text-gray-900" : "text-gray-400"
                                                    }`}
                                            >
                                                {val === "text"
                                                    ? "Texto"
                                                    : val === "number"
                                                        ? "Numérico"
                                                        : val || "Seleccionar tipo"}
                                            </span>
                                        )}
                                    >
                                        {typeOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <input
                                    type="text"
                                    value={attribute.Type ?? ""}
                                    onChange={handleChange("Type")}
                                    placeholder="Tipo de atributo"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Opciones</span>
                            {readOnly ? (
                                <div className="flex flex-wrap gap-1">
                                    {attribute.Options?.length ? (
                                        attribute.Options.map((opt) => (
                                            <span
                                                key={opt}
                                                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                                            >
                                                {opt}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm font-medium text-gray-900">
                                            --
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <Autocomplete
                                    multiple
                                    freeSolo
                                    size="small"
                                    options={[]}
                                    value={attribute.Options || []}
                                    onChange={(_, newValue) => {
                                        onChange?.("Options", newValue as string[]);
                                    }}
                                    renderTags={(tagValue, getTagProps) =>
                                        tagValue.map((option, index) => {
                                            const { key, ...restProps } = getTagProps({ index });
                                            return (
                                                <Chip
                                                    key={key}
                                                    label={option}
                                                    size="small"
                                                    {...restProps}
                                                />
                                            );
                                        })
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="standard"
                                            placeholder="Agregar opción y presionar Enter"
                                            InputProps={{
                                                ...params.InputProps,
                                                disableUnderline: true,
                                            }}
                                        />
                                    )}
                                    fullWidth
                                />
                            )}
                        </div>

                        {/* Multiple */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Múltiple</span>
                            <Toggle
                                checked={attribute.Multiple}
                                onChange={() =>
                                    onChange?.("Multiple", !attribute.Multiple)
                                }
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Mandatory */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                            <span className="text-sm text-gray-500">Obligatorio</span>
                            <Toggle
                                checked={attribute.Mandatory}
                                onChange={() =>
                                    onChange?.("Mandatory", !attribute.Mandatory)
                                }
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Default value */}
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 py-3">
                            <span className="text-sm text-gray-500">Valor por defecto</span>
                            {readOnly ? (
                                <span className="truncate text-sm font-medium text-gray-900">
                                    {attribute.DefaultValue || "--"}
                                </span>
                            ) : (
                                <input
                                    type="text"
                                    value={attribute.DefaultValue ?? ""}
                                    onChange={handleChange("DefaultValue")}
                                    placeholder="Valor por defecto"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* ── Columna Derecha ── */}
            {!isNew && (
                <div className="space-y-6">
                    {/* Card: USUARIO CREADOR */}
                    <Card title="USUARIO CREADOR" icon={UserIcon}>
                        <div className="space-y-1">
                            <div className="flex items-center justify-end py-2">
                                <span className="text-xs italic text-gray-400">
                                    {attribute.createdAtFormatted || ""}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Card: ÚLTIMA MODIFICACIÓN */}
                    <Card title="ÚLTIMA MODIFICACIÓN" icon={ClockIcon}>
                        <div className="flex items-center justify-end py-2">
                            <span className="text-xs italic text-gray-400">
                                {attribute.DateModified || "Sin modificaciones"}
                            </span>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
