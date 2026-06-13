"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { PencilIcon, UserIcon } from "lucide-react";
import { ActiveStatusToggle } from "@/components/ui/togle";
import Select from "@/components/ui/select";

type OptionItem = {
    value: string;
    label: string;
};

export interface Vehiculos {
    ID?: string;
    type: string;
    refID: string;
    name: string;
    company: string;
    placa: string;
    model: string;
    brand: string;
    year: string;
    capacity: string;
    user: {
        img: string;
        name: string;
        email: string;
    };
    modified: string;
    status: "Activo" | "Inactivo";
}

interface Props {
    record: Vehiculos;
    readOnly?: boolean;
    onChange?: (field: keyof Vehiculos, value: string) => void;
    companyOptions?: OptionItem[];
    vehicleTypeOptions?: OptionItem[];
}

export const VehiculosFields: React.FC<Props> = ({
    record,
    readOnly = true,
    onChange,
    companyOptions = [],
    vehicleTypeOptions = [],
}) => {
    const handle =
        (field: keyof Vehiculos) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                onChange?.(field, e.target.value);
            };

    const companyLabel = companyOptions.find((o) => o.value === record.company)?.label ?? record.company;
    const vehicleTypeLabel = vehicleTypeOptions.find((o) => o.value === record.type)?.label ?? record.type;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/** ─── LEFT (span 2 cols) ─── */}
                <div className="lg:col-span-2 space-y-6">
                    {/** MAIN */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
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
                                        {record.refID}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.refID}
                                        onChange={handle("refID")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
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
                            {/* Compañía */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Compañía
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {companyLabel}
                                    </a>
                                ) : (
                                    <Select
                                        value={record.company}
                                        onValueChange={(value) => onChange?.("company", value)}
                                        options={companyOptions}
                                        placeholder="Seleccionar compañía"
                                    />
                                )}
                            </div>
                            {/* Tipo de vehículo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Tipo de vehículo
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {vehicleTypeLabel}
                                    </a>
                                ) : (
                                    <Select
                                        value={record.type}
                                        onValueChange={(value) => onChange?.("type", value)}
                                        options={vehicleTypeOptions}
                                        placeholder="Seleccionar tipo de vehículo"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    {/** MAXIMUM CAPACITIES */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Placa */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Placa</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.placa}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.placa}
                                        onChange={handle("placa")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* Marca */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Marca
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.brand}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.brand}
                                        onChange={handle("brand")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* Modelo  */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Modelo
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.model}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.model}
                                        onChange={handle("model")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* Año  */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Año
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.year}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.year}
                                        onChange={handle("year")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/** ─── OTROS ─── */}
                <div className="flex flex-col justify-between gap-8 h-full">
                    <Card
                        title="OTROS"
                        // icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl px-6 py-4 space-y-8"
                    >
                        {/* Status */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-black-600 font-bold">Status</span>
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
                        <br />

                        {/* Usuario Creador */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-gray-600" />
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                    Usuario creador
                                </span>
                                <div className="flex-1 h-px bg-gray-300" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <img
                                        src="https://randomuser.me/api/portraits/men/1.jpg"
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <div className="text-sm">
                                        <div className="font-semibold text-gray-900">Mariano Fernandez</div>
                                        <div className="text-xs text-gray-500">mariano.fernandez@fizzmo.cl</div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">18/01/2022 13:58:06</span>
                            </div>
                        </div>
                        <br />
                        <br />
                        {/* Última modificación */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-2">
                                <PencilIcon className="w-4 h-4 text-gray-600" />
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                    Última modificación
                                </span>
                                <div className="flex-1 h-px bg-gray-300" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <img
                                        src="https://randomuser.me/api/portraits/men/1.jpg"
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <div className="text-sm">
                                        <div className="font-semibold text-gray-900">Francisco Mato</div>
                                        <div className="text-xs text-gray-500">francisco@fizzmo.cl</div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">18/04/2022 15:28:36</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
