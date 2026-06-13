"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import Select from "@/components/ui/select";
import { Toggle } from "@/components/ui/togle/togle";
import {
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export interface MetodoEntrega {
    id?: string;
    refId: string;
    modalidad: string;
    rutas: string;
    bultos: string;
    programado: string;
    titulo: string;
    creacion: string;
    modificado: string;
    status: string;
    origen: string;
    tiempo_min_fulfillment: string;
    needRoute: string;
    thresholdendStatus: string;
    thresholddateReference: string;
    thresholdcautionInMinutes: string;
    thresholdwarningInMinutes: string;
    thresholdcriticalInMinutes: string;
    thresholdtriggerCriticalWebhook: string;
}

interface Props {
    record: MetodoEntrega;
    readOnly?: boolean;
    onChange?: (field: keyof MetodoEntrega, value: string) => void;
}

export const MetodoEntregaFields: React.FC<Props> = ({
    record,
    readOnly = true,
    onChange,
}) => {
    const modalidadOptions = ["Delivery", "Express Delivery", "Store Pick Up", "Drive Through"];
    const modalidadSelectOptions = modalidadOptions.map((option) => ({
        value: option,
        label: option,
    }));
    const isStatusActive = ["activo", "active", "true"].includes(String(record.status).toLowerCase());

    const handle =
        (field: keyof MetodoEntrega) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                // para loss check de rutas, bultos y programado segun los requisitos
                if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
                    onChange?.(field, e.target.checked ? "true" : "false");
                } else {
                    onChange?.(field, e.target.value);
                }
            };

    // Define modalidades permitidas para cada check
    const rutasAllowedModalities: string[] = ["Delivery", "Express Delivery"];
    const programadoAllowedModalities: string[] = ["Delivery", "Store Pick Up", "Drive Through"];

    // determina si check de rutas debe estar deshabilitado
    const isRutasDisabled = !readOnly && !rutasAllowedModalities.includes(record.modalidad);
    // determina si check de programado debe estar deshabilitado
    const isProgramadoDisabled = !readOnly && !programadoAllowedModalities.includes(record.modalidad);

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
                            {/* ref id */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ref ID</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.refId}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.refId}
                                        onChange={handle("refId")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* origen */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Origen
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.origen}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.origen}
                                        onChange={handle("origen")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* modalidad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Modalidad
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.modalidad}
                                    </a>
                                ) : (
                                    <Select
                                        value={record.modalidad}
                                        options={modalidadSelectOptions}
                                        placeholder="Seleccionar modalidad"
                                        onValueChange={(value) => onChange?.("modalidad", value)}
                                        className="text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* titulo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Título
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.titulo}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.titulo}
                                        onChange={handle("titulo")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* tiempo minimo de fulfillment */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Tiempo mínimo de fulfillment
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.tiempo_min_fulfillment}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.tiempo_min_fulfillment}
                                        onChange={handle("tiempo_min_fulfillment")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* check rutas */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Permite Rutas
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-blue-600 truncate">
                                        {record.rutas === "true" ? "Activo" : "Inactivo"}
                                    </span>
                                ) : (
                                    <Toggle
                                        id="toggle-rutas"
                                        checked={record.rutas === "true"}
                                        onCheckedChange={(checked) => onChange?.("rutas", checked ? "true" : "false")}
                                        disabled={isRutasDisabled}
                                        aria-label="Rutas"
                                    />
                                )}
                            </div>
                            {/* check bultos */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Permite Creación de Bultos
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-blue-600 truncate">
                                        {record.bultos === "true" ? "Activo" : "Inactivo"}
                                    </span>
                                ) : (
                                    <Toggle
                                        id="toggle-bultos"
                                        checked={record.bultos === "true"}
                                        onCheckedChange={(checked) => onChange?.("bultos", checked ? "true" : "false")}
                                        aria-label="Creacion de Bultos"
                                    />
                                )}
                            </div>
                            {/* check programado */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Programado
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-blue-600 truncate">
                                        {record.programado === "true" ? "Activo" : "Inactivo"}
                                    </span>
                                ) : (
                                    <Toggle
                                        id="toggle-programado"
                                        checked={record.programado === "true"}
                                        onCheckedChange={(checked) => onChange?.("programado", checked ? "true" : "false")}
                                        disabled={isProgramadoDisabled}
                                        aria-label="Programado"
                                    />
                                )}
                            </div>

                            {/* check needRoute */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Need Route
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-blue-600 truncate">
                                        {record.needRoute === "true" ? "Activo" : "Inactivo"}
                                    </span>
                                ) : (
                                    <Toggle
                                        id="toggle-need-route"
                                        checked={record.needRoute === "true"}
                                        onCheckedChange={(checked) => onChange?.("needRoute", checked ? "true" : "false")}
                                        aria-label="Need Route"
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
                                    <Toggle
                                        id="toggle-status"
                                        checked={isStatusActive}
                                        onCheckedChange={(checked) => onChange?.("status", checked ? "Activo" : "Inactivo")}
                                        aria-label="Status"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};