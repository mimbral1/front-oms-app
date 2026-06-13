// app/views/Logs/components/LogFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserIcon,
} from "@heroicons/react/24/outline";

/* Interfaz del registro de log */
export interface LogsRecord {
    id?: string;
    servicio: string;
    entidad: string;
    idEntidad: string;
    motivo: string;
    mensaje: string;
    logTexto: string;
    creacion: string;
    expira: string;
    usuarioCreador: {
        initials: string;
        name: string;
        email: string;
    };
}

export function LogsFields({
    record,
    readOnly = false,
    onChange,
}: {
    record: LogsRecord;
    readOnly?: boolean;
    onChange?: (field: keyof LogsRecord, value: any) => void;
}) {
    const handle = (field: keyof LogsRecord) => (v: any) => onChange?.(field, v);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-2 space-y-6">
                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Servicio */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Servicio</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.servicio}
                                    onChange={(e) => handle("servicio")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Entidad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Entidad</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.entidad}
                                    onChange={(e) => handle("entidad")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* ID Entidad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">ID Entidad</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.idEntidad}
                                    onChange={(e) => handle("idEntidad")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Motivo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Motivo</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.motivo}
                                    onChange={(e) => handle("motivo")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Mensaje */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Mensaje</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.mensaje}
                                    onChange={(e) => handle("mensaje")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Log (detalle) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Log</span>
                            <div className="col-span-5">
                                {/* <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-800">
                                    {record.logTexto || "—"}
                                </pre> */}
                                <textarea
                                    className="w-full rounded-md border border-gray-200 p-2 text-sm outline-none"
                                    rows={6}
                                    value={record.logTexto}
                                    onChange={(e) => handle("logTexto")(e.target.value)}
                                    placeholder="Detalle del log..."
                                />
                            </div>

                            {/* Creación */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Creación</span>
                            <div className="col-span-5">
                                <input
                                    type="datetime-local"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.creacion}
                                    onChange={(e) => handle("creacion")(e.target.value)}
                                />
                            </div>

                            {/* Expira */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Expira</span>
                            <div className="col-span-5">
                                <input
                                    type="datetime-local"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.expira}
                                    onChange={(e) => handle("expira")(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-1 space-y-6">
                    {/* USUARIO CREADOR / META */}
                    <Card title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                                {record.usuarioCreador.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{record.usuarioCreador.name || "—"}</span>
                                <span className="text-xs text-gray-500">{record.usuarioCreador.email || "—"}</span>
                                <span className="text-xs text-gray-500">{record.creacion || "—"}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
