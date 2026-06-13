// app/views/Configuracion/TransicionesTickets/components/TransicionesTicketsFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export type Activo = "Activo" | "Inactivo";

export interface TransicionTicket {
    id?: number | string;

    // DETALLE (izquierda)
    claimMotive: string;
    nombre: string;
    descripcion: string;
    statusFrom: string;
    statusTo: string;
    color: string;            // hex o vacío (solo línea/indicador)
    permisoRequerido: boolean;
    statusResolucion: boolean;

    // OTROS (derecha)
    estado: Activo;
}

export function TransicionesTicketsFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false, // reservado
}: {
    record: TransicionTicket;
    readOnly?: boolean;
    onChange?: (field: keyof TransicionTicket, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof TransicionTicket) => (v: any) => onChange?.(field, v);

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
                            {/* Claim motive */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Motivo de reclamo</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.claimMotive}
                                    onChange={(e) => handle("claimMotive")(e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option value="">—</option>
                                    <option value="Devolución">Devolución</option>
                                    <option value="Cambio">Cambio</option>
                                    <option value="Stockout">Stockout</option>
                                </select>
                            </div>

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

                            {/* Status from */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado desde</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.statusFrom}
                                    onChange={(e) => handle("statusFrom")(e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option value="">—</option>
                                    <option value="Inicio">Inicio</option>
                                    <option value="En progreso">En progreso</option>
                                    <option value="Finalizado con éxito">Finalizado con éxito</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>

                            {/* Status to */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado hacia</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.statusTo}
                                    onChange={(e) => handle("statusTo")(e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option value="">—</option>
                                    <option value="Inicio">Inicio</option>
                                    <option value="En progreso">En progreso</option>
                                    <option value="Finalizado con éxito">Finalizado con éxito</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>

                            {/* Color (indicador + línea de input) */}
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
                                    placeholder="#10B981"
                                />
                            </div>

                            {/* Permiso requerido */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Permiso requerido</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.permisoRequerido}
                                    onClick={() => handle("permisoRequerido")(!record.permisoRequerido)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.permisoRequerido ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    disabled={readOnly}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.permisoRequerido ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Status de resolución */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado de resolución</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.statusResolucion}
                                    onClick={() => handle("statusResolucion")(!record.statusResolucion)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.statusResolucion ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                    disabled={readOnly}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.statusResolucion ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
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
                </div>
            </div>
        </div>
    );
}
