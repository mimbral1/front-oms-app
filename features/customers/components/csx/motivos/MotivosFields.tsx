// views\Customers\Csx\Motivos\components\MotivosFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon } from "@heroicons/react/24/outline";

export type Estado = "Activo" | "Inactivo";

export interface Motivo {
    id?: string | number;

    // DETALLE (izquierda)
    nombre: string;
    descripcion: string;
    logistica: boolean;
    defaultStockout: boolean;

    // OTROS (derecha)
    estado: Estado;

    // Usuario (solo en Resumen)
    creador?: { nombre: string; email: string; fecha: string };
}

export function MotivosFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: Motivo;
    readOnly?: boolean;
    onChange?: (field: keyof Motivo, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof Motivo) => (v: any) => onChange?.(field, v);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA: DETALLE */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    readOnly={readOnly}
                                />
                            </div>

                            {/* Descripción */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.descripcion}
                                    onChange={(e) => handle("descripcion")(e.target.value)}
                                    readOnly={readOnly}
                                />
                            </div>

                            {/* Logística */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Logística</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.logistica}
                                    onClick={() => handle("logistica")(!record.logistica)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.logistica ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    disabled={readOnly}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.logistica ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Default (stockout) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Default (stockout)</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.defaultStockout}
                                    onClick={() => handle("defaultStockout")(!record.defaultStockout)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.defaultStockout ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    disabled={readOnly}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.defaultStockout ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA: OTROS + USUARIO CREADOR */}
                <div className="lg:col-span-3 space-y-6">
                    {/* OTROS */}
                    <Card
                        title="OTROS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Estado */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                {/* Input tipo select simple, manteniendo estilo de input con borde inferior */}
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.estado}
                                    onChange={(e) => handle("estado")(e.target.value as Estado)}
                                    disabled={readOnly}
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* USUARIO CREADOR (solo en Resumen) */}
                    {!isCreate && record.creador && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm text-gray-600 font-bold"> </span>
                                <div className="col-span-5">
                                    {/* “chip” simple con nombre/email/fecha (texto plano como en tus cards) */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                                        <div className="flex flex-col">
                                            <div className="text-sm">{record.creador.nombre}</div>
                                            <div className="text-xs text-gray-500">{record.creador.email}</div>
                                        </div>
                                        <div className="ml-auto text-xs text-gray-500">{record.creador.fecha}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
