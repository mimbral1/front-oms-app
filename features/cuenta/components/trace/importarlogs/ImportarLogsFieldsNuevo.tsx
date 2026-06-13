// views\Cuenta\Trace\ImportarLogs\components\ImportarLogsFieldsNuevo.tsx

"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    CalendarIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

/* Campos del formulario (Nuevo) */
export interface ImportLogNuevo {
    servicio: string;      // wms | commerce | api
    entidad: string;       // sku_position | api | orders
    idEntidad: string;
    motivo: string;        // new | sync | fix
    fechaDesdeDate: string; // "YYYY-MM-DD"
    fechaDesdeTime: string; // "HH:mm"
    fechaHastaDate: string;
    fechaHastaTime: string;
}

export function ImportarLogsFieldsNuevo({
    record,
    onChange,
}: {
    record: ImportLogNuevo;
    onChange?: (field: keyof ImportLogNuevo, value: any) => void;
}) {
    const handle = (field: keyof ImportLogNuevo) => (v: any) => onChange?.(field, v);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA: PRINCIPAL */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="PRINCIPAL"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Servicio */}
                            <span className="col-span-1 text-sm text-gray-800 font-bold">Servicio</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.servicio}
                                    options={["wms", "commerce", "api"]}
                                    onChange={handle("servicio")}
                                    inline
                                />
                            </div>

                            {/* Entidad */}
                            <span className="col-span-1 text-sm text-gray-800 font-bold">Entidad</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.entidad}
                                    options={["sku_position", "api", "orders"]}
                                    onChange={handle("entidad")}
                                    inline
                                />
                            </div>

                            {/* ID Entidad */}
                            <span className="col-span-1 text-sm text-gray-800 font-bold">ID Entidad</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.idEntidad}
                                    onChange={(e) => handle("idEntidad")(e.target.value)}
                                />
                            </div>

                            {/* Motivo (con clear button como en la referencia) */}
                            <span className="col-span-1 text-sm text-gray-800 font-bold">Motivo</span>
                            <div className="col-span-5 flex items-center gap-2">
                                <div className="flex-1">
                                    <CollapsibleField
                                        label=""
                                        value={record.motivo}
                                        options={["new", "sync", "fix"]}
                                        onChange={handle("motivo")}
                                        inline
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="h-6 w-6 rounded-full bg-gray-300 text-white text-sm"
                                    title="Limpiar motivo"
                                    onClick={() => handle("motivo")("")}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA: PERÍODO */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="PERÍODO"
                        icon={CalendarIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Fecha desde */}
                            <span className="col-span-1 text-sm text-gray-800 font-bold">Fecha desde</span>
                            <div className="col-span-5 grid grid-cols-6 gap-4 items-center">
                                <div className="col-span-3 flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                                    <input
                                        type="date"
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.fechaDesdeDate}
                                        onChange={(e) => handle("fechaDesdeDate")(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <ClockIcon className="h-5 w-5 text-gray-500" />
                                    <input
                                        type="time"
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.fechaDesdeTime}
                                        onChange={(e) => handle("fechaDesdeTime")(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Fecha hasta */}
                            <span className="col-span-1 text-sm text-gray-800 font-bold">Fecha hasta</span>
                            <div className="col-span-5 grid grid-cols-6 gap-4 items-center">
                                <div className="col-span-3 flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                                    <input
                                        type="date"
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.fechaHastaDate}
                                        onChange={(e) => handle("fechaHastaDate")(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <ClockIcon className="h-5 w-5 text-gray-500" />
                                    <input
                                        type="time"
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.fechaHastaTime}
                                        onChange={(e) => handle("fechaHastaTime")(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
