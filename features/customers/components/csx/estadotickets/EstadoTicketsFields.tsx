// views\Customers\Csx\EstadoTickets\components\EstadoTicketsFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon } from "@heroicons/react/24/outline";

export type Activo = "Activo" | "Inactivo";

export interface EstadoTicket {
    id?: number | string;

    // DETALLE (izquierda)
    nombre: string;
    descripcion: string;
    color: string;              // hex o texto (#1882cf)
    statusInicial: boolean;     // Status inicial
    statusFinal: boolean;       // Status final
    notificable: boolean;       // Notificable
    defaultStockout: boolean;   // Default (stockout)
    mostrarEnReportes: boolean; // Mostrar en reportes

    // OTROS (derecha)
    estado: Activo;

    // Solo en Resumen
    creador?: { nombre: string; email: string; fecha: string };
}

export function EstadoTicketsFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: EstadoTicket;
    readOnly?: boolean;
    onChange?: (field: keyof EstadoTicket, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof EstadoTicket) => (v: any) => onChange?.(field, v);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA */}
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

                            {/* Color (punto + hex) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Color</span>
                            <div className="col-span-5 flex items-center gap-3">
                                <span
                                    className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                                    style={{ backgroundColor: record.color || "#e5e7eb" }}
                                />
                                <input
                                    className="flex-1 border-b border-gray-300 text-sm outline-none"
                                    value={record.color}
                                    onChange={(e) => handle("color")(e.target.value)}
                                    readOnly={readOnly}
                                    placeholder="#1882cf"
                                />
                            </div>

                            {/* Status inicial */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado inicial</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.statusInicial}
                                    onClick={() => handle("statusInicial")(!record.statusInicial)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.statusInicial ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    disabled={readOnly}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.statusInicial ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Status final */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado final</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.statusFinal}
                                    onClick={() => handle("statusFinal")(!record.statusFinal)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.statusFinal ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    disabled={readOnly}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.statusFinal ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Notificable */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Notificable</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.notificable}
                                    onClick={() => handle("notificable")(!record.notificable)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.notificable ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    disabled={readOnly}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.notificable ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Default (stockout) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Por defecto (stockout)</span>
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

                            {/* Mostrar en reportes */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Mostrar en reportes</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.mostrarEnReportes}
                                    onClick={() => handle("mostrarEnReportes")(!record.mostrarEnReportes)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.mostrarEnReportes ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    disabled={readOnly}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.mostrarEnReportes ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
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
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.estado}
                                    onChange={(e) => handle("estado")(e.target.value as Activo)}
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
