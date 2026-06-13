"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { PencilIcon, UserIcon } from "lucide-react";
import { ActiveStatusToggle } from "@/components/ui/togle";

const VEHICLE_TYPE_OPTIONS = [
    { label: "Bicycle", value: "bicycle" },
    { label: "Motorcycle", value: "motorcycle" },
    { label: "Car", value: "car" },
    { label: "Van", value: "van" },
    { label: "Truckt", value: "truckt" },
];

export interface TypeVehicle {
    id?: string;
    Refid: string;
    name: string;
    motivo: string;
    origin: string;
    companyId: string;
    icono: string;
    fuelConsumption: string;
    envios_max: string;
    items_max: string;
    volumen_maximo: string;
    maxDistance: string;
    maxWeight: string;
    status: string;
    userCreated?: string;
    dateCreated?: string;
    userModified?: string;
    dateModified?: string;
    created?: { user?: string; date?: string };
    modified?: { user?: string; date?: string };
}

interface Props {
    record: TypeVehicle;
    readOnly?: boolean;
    onChange?: (field: keyof TypeVehicle, value: string) => void;
}

export const TypeVehicleFields: React.FC<Props> = ({
    record,
    readOnly = true,
    onChange,
}) => {
    const handle =
        (field: keyof TypeVehicle) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                onChange?.(field, e.target.value);
            };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/** ─── LEFT (span 2 cols) ─── */}
                <div className="lg:col-span-2 space-y-6">
                    {/** MAIN */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.name}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.name}
                                        onChange={handle("name")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* ref if */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Ref ID
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.Refid}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.Refid}
                                        onChange={handle("Refid")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* motivo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Motivo
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.motivo}
                                    </a>
                                ) : (
                                    <select
                                        value={record.motivo}
                                        onChange={handle("motivo")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        {VEHICLE_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            {/* icono */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Ícono
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.icono}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.icono}
                                        onChange={handle("icono")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            {/* origin */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Origen
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.origin}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.origin}
                                        onChange={handle("origin")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            {/* company id */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Compañía
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.companyId}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.companyId}
                                        onChange={handle("companyId")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            {/* Distancia máxima */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Distancia máxima
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.maxDistance}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.maxDistance}
                                        onChange={handle("maxDistance")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            {/* Consumo combustible */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Consumo combustible
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.fuelConsumption}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.fuelConsumption}
                                        onChange={handle("fuelConsumption")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    {/** maxima capacidad */}
                    <Card
                        title="MÁXIMA CAPACIDAD"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Envíos (máx.) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Envíos (máx.)</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.envios_max}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.envios_max}
                                        onChange={handle("envios_max")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* Ítems (máx.) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Ítems (máx)
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.items_max}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.items_max}
                                        onChange={handle("items_max")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* volumen  */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Volumen máximo
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.volumen_maximo}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.volumen_maximo}
                                        onChange={handle("volumen_maximo")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                            {/* Peso máximo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Peso máximo
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.maxWeight}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.maxWeight}
                                        onChange={handle("maxWeight")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>

                        </div>
                    </Card>
                </div>

                {/** ─── RIGHT COLUMN ─── */}
                <div className="flex flex-col gap-6 h-full">
                    <Card
                        title="OTROS"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {/* Status */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-black-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm text-black-900">{record.status}</span>
                                ) : (
                                    <ActiveStatusToggle
                                        active={record.status === "Activo"}
                                        onActiveChange={(active) => onChange?.("status", active ? "Activo" : "Inactivo")}
                                        disabled={readOnly}
                                        showStateLabel={false}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="text-sm">
                                    <div className="font-semibold text-gray-900">{record.userCreated || record.created?.user || "-"}</div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">{record.dateCreated || record.created?.date || "-"}</span>
                        </div>
                    </Card>

                    <Card
                        title="ÚLTIMA MODIFICACIÓN"
                        icon={PencilIcon}
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="text-sm">
                                    <div className="font-semibold text-gray-900">{record.userModified || record.modified?.user || "-"}</div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">{record.dateModified || record.modified?.date || "-"}</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
