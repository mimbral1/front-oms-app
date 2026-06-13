// views\Customers\CustomersAddress\Perfiles\components\PerfilesFields.tsx
"use client";

import React, { useState } from "react";
import Card from "@/components/ui/card/Card";
import { PencilIcon } from "@heroicons/react/24/outline";
import { ClipboardListIcon, LockKeyholeIcon, User2Icon } from "lucide-react";

/* =========================
   Tipos base
   ========================= */

export interface Perfil {
    id?: string;
    name: string;
    description: string;
    plataformaCod: string;
    permissions: Record<
        string,
        {
            read?: boolean;
            write?: boolean;
            update?: boolean;
            delete?: boolean;
        }
    >;
    createdAt?: string;
    createdBy?: { username: string; email: string; date: string };
    modifiedAt?: string;
    modifiedBy?: { username: string; email: string; date: string };
    status?: string;
}

/**
 * Tipos que reflejan la respuesta del endpoint:
 * GET /api/idservice/estructura/MIMBRAL_360
 */
export interface AccionAPI {
    id: number;
    codigo: string;
    nombre: string;
}

export interface SubmodAPI {
    id: number;
    codigo: string;
    nombre: string;
    acciones: AccionAPI[];
}

export interface ModuloAPI {
    id: number;
    codigo: string;
    nombre: string;
    submodulos: SubmodAPI[];
}

type AccessKey = "read" | "write" | "update" | "delete";

const ACCESS_LABELS: Record<AccessKey, string> = {
    read: "Leer",
    write: "Crear",
    update: "Actualizar",
    delete: "Eliminar",
};

const ACCESS_TO_ACTION_CODE: Record<AccessKey, string> = {
    read: "READ",
    write: "CREATE",
    update: "UPDATE",
    delete: "DELETE",
};

interface FieldsProps {
    record: Perfil;
    readOnly?: boolean;
    onChange?: (field: keyof Perfil, value: string) => void;
    onPermissionChange?: (
        permissionKey: string, // ahora es el subModuloId en string
        access: AccessKey,
        value: boolean
    ) => void;
    /**
     * Módulos de Mimbral 360 (estructura/MIMBRAL_360)
     * Solo se mostrarán los que tengan submodulos.length > 0
     */
    modules?: ModuloAPI[];
}

/* =========================
   Item de módulo (CATÁLOGO, PEDIDOS, CUENTA, etc.)
   ========================= */

interface PermissionModuleItemProps {
    module: ModuloAPI;
    record: Perfil;
    readOnly: boolean;
    onPermissionChange?: FieldsProps["onPermissionChange"];
}

const PermissionModuleItem: React.FC<PermissionModuleItemProps> = ({
    module,
    record,
    readOnly,
    onPermissionChange,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const submodules = module.submodulos || [];

    const hasAnyPermissionForSubmodule = (subId: number) => {
        const key = String(subId);
        const p = record.permissions?.[key];
        return !!(p?.read || p?.write || p?.update || p?.delete);
    };

    const checkedCount = submodules.filter((s) => hasAnyPermissionForSubmodule(s.id)).length;
    const totalCount = submodules.length;
    const anyPermissionsInModule = checkedCount > 0;

    const handleMainCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        if (!onPermissionChange) return;

        submodules.forEach((sub) => {
            const key = String(sub.id);
            (["read", "write", "update", "delete"] as AccessKey[]).forEach((acc) => {
                onPermissionChange(key, acc, newValue);
            });
        });
    };

    const renderCRUDCheckboxes = (sub: SubmodAPI) => {
        const key = String(sub.id);
        const availableCodes = new Set(
            (sub.acciones || []).map((a) => (a.codigo || "").toUpperCase())
        );

        return (
            <div className="flex flex-wrap items-center gap-8 text-xs text-gray-600 ml-8 my-3 relative">
                <div className="absolute top-0 bottom-0 left-[-16px] w-px bg-gray-300" />
                {(["read", "write", "update", "delete"] as AccessKey[]).map((acc) => {
                    const actionCode = ACCESS_TO_ACTION_CODE[acc];
                    const isAvailable = availableCodes.has(actionCode);
                    const disabled = readOnly || !isAvailable;
                    const checked = !!record.permissions?.[key]?.[acc];

                    return (
                        <label key={acc} className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                    onPermissionChange?.(key, acc, e.target.checked)
                                }
                                disabled={disabled}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                style={{
                                    accentColor: checked && !disabled ? "#2563eb" : "inherit",
                                }}
                            />
                            <span>{ACCESS_LABELS[acc]}</span>
                        </label>
                    );
                })}
            </div>
        );
    };

    if (!totalCount) {
        // Módulos sin submódulos -> no se muestran (a medida que se llenen en BD aparecerán)
        return null;
    }

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <div
                className="flex items-center py-3 cursor-pointer"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center space-x-2 flex-grow">
                    <button
                        type="button"
                        className="p-1 rounded-full text-gray-500 hover:text-gray-900"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCollapsed(!isCollapsed);
                        }}
                    >
                        {isCollapsed ? (
                            <span className="inline-block rotate-0">▶</span>
                        ) : (
                            <span className="inline-block rotate-90">▶</span>
                        )}
                    </button>

                    <span className="font-semibold text-gray-800 text-sm">
                        {module.nombre}
                    </span>

                    {totalCount > 0 && (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {checkedCount} de {totalCount} submódulos con permisos
                        </span>
                    )}
                </div>

                {totalCount > 0 && (
                    <label className="flex items-center space-x-2 text-xs text-gray-600 mr-4">
                        <input
                            type="checkbox"
                            checked={anyPermissionsInModule}
                            onChange={handleMainCheckboxChange}
                            disabled={readOnly || totalCount === 0}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            style={{
                                accentColor:
                                    anyPermissionsInModule && !(readOnly || totalCount === 0)
                                        ? "#2563eb"
                                        : "inherit",
                            }}
                        />
                        <span>Seleccionar todos</span>
                    </label>
                )}
            </div>

            {!isCollapsed && totalCount > 0 && (
                <div className="pl-4 pb-2 space-y-1">
                    {submodules.map((sub) => {
                        const key = String(sub.id);
                        const hasAny = hasAnyPermissionForSubmodule(sub.id);

                        return (
                            <div key={sub.id} className="relative">
                                <div className="flex items-center justify-between py-2 pl-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={hasAny}
                                            onChange={(e) => {
                                                const value = e.target.checked;
                                                (["read", "write", "update", "delete"] as AccessKey[]).forEach(
                                                    (acc) => {
                                                        onPermissionChange?.(key, acc, value);
                                                    }
                                                );
                                            }}
                                            disabled={readOnly}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            style={{
                                                accentColor: hasAny && !readOnly ? "#2563eb" : "inherit",
                                            }}
                                        />
                                        <span className="text-sm font-light text-gray-800">
                                            {sub.nombre}
                                        </span>
                                    </div>
                                </div>
                                {renderCRUDCheckboxes(sub)}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/* =========================
   COMPONENTE PRINCIPAL
   ========================= */

export const PerfilesFields: React.FC<FieldsProps> = ({
    record,
    readOnly = true,
    onChange,
    onPermissionChange,
    modules,
}) => {
    const handle =
        (field: keyof Perfil) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                onChange?.(field, e.target.value);
            };

    const isNew = !record.createdAt;

    const modulesWithSubmodules =
        (modules || []).filter((m) => (m.submodulos || []).length > 0) ?? [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card
                        title="PRINCIPAL"
                        icon={ClipboardListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="mt-8 grid grid-cols-6 gap-8">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Nombre
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {record.name}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.name}
                                        onChange={handle("name")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Descripción
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {record.description}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.description}
                                        onChange={handle("description")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="PERMISOS"
                        icon={LockKeyholeIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="p-4 rounded-lg max-h-200 overflow-y-auto">
                            {modulesWithSubmodules.length > 0 ? (
                                modulesWithSubmodules.map((module) => (
                                    <PermissionModuleItem
                                        key={module.id}
                                        module={module}
                                        record={record}
                                        readOnly={readOnly}
                                        onPermissionChange={onPermissionChange}
                                    />
                                ))
                            ) : (
                                <div className="text-sm text-gray-500">
                                    No hay módulos de permisos configurados para esta plataforma.
                                </div>
                            )}
                        </div>
                        <br />
                        <br />
                    </Card>
                </div>

                <div className="space-y-6">
                    {isNew ? null : (
                        <>
                            <Card
                                title="OTROS"
                                icon={ClipboardListIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="mt-8 grid grid-cols-6 gap-8">
                                    <span className="col-span-1 text-sm text-black-600 font-bold">
                                        Status
                                    </span>
                                    <div className="col-span-5">
                                        {readOnly ? (
                                            <span className="text-sm text-black-900">
                                                {record.status}
                                            </span>
                                        ) : (
                                            <select
                                                value={record.status}
                                                onChange={handle("status")}
                                                className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                            >
                                                <option value="Activo">Activo</option>
                                                <option value="Inactivo">Inactivo</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Card
                                title="USUARIO CREADOR"
                                icon={User2Icon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                                    <div className="col-span-4">
                                        <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                                {record?.createdBy?.username
                                                    ?.split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-semibold text-blue-600">
                                                    {record?.createdBy?.username}
                                                </div>
                                                <div className="text-gray-500 truncate max-w-[200px]">
                                                    {record?.createdBy?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-500 text-right truncate">
                                        {record?.createdBy?.date}
                                    </div>
                                </div>
                            </Card>

                            <Card
                                title="ÚLTIMA MODIFICACIÓN"
                                icon={PencilIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                                    <div className="col-span-4">
                                        <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                                {record?.modifiedBy?.username
                                                    ?.split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-semibold text-blue-600">
                                                    {record?.modifiedBy?.username}
                                                </div>
                                                <div className="text-gray-500 truncate max-w-[200px]">
                                                    {record?.modifiedBy?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-500 text-right truncate">
                                        {record?.modifiedBy?.date}
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
