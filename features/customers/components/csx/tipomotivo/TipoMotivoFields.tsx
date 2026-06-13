// views\Customers\Csx\TipoMotivo\components\TipoMotivoFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export type Estado = "Activo" | "Inactivo";
export type Prioridad = "Baja" | "Media" | "Alta";
export type UnidadSla = "Hours" | "Days";

export interface TipoMotivo {
    id?: string | number;

    // DETALLE (izquierda)
    claimMotive: string;
    parent: string;
    nombre: string;
    descripcion: string;
    logistica: boolean;
    defaultStockout: boolean;
    items: boolean;
    pedidos: boolean;
    area: string;
    procesosAfectados: string; // texto plano (puedes pasar chips luego)
    compensaciones: string;     // texto plano

    // SLA (derecha)
    sla: number | string;
    unidad: UnidadSla;

    // OTROS (derecha)
    prioridad: Prioridad;
    estado: Estado;
}

export function TipoMotivoFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false, // reservado por si más adelante ocultas secciones cuando es "nuevo"
}: {
    record: TipoMotivo;
    readOnly?: boolean;
    onChange?: (field: keyof TipoMotivo, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof TipoMotivo) => (v: any) => onChange?.(field, v);

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
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Motivo del reclamo</span>
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

                            {/* Parent */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Parent</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.parent}
                                    onChange={(e) => handle("parent")(e.target.value)}
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

                            {/* Logística */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Logística</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.logistica}
                                    onClick={() => handle("logistica")(!record.logistica)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.logistica ? "bg-blue-500" : "bg-gray-300"}`}
                                    disabled={readOnly}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.logistica ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>

                            {/* Default (stockout) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Por defecto</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.defaultStockout}
                                    onClick={() => handle("defaultStockout")(!record.defaultStockout)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.defaultStockout ? "bg-blue-500" : "bg-gray-300"}`}
                                    disabled={readOnly}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.defaultStockout ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>

                            {/* Ítems */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ítems</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.items}
                                    onClick={() => handle("items")(!record.items)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.items ? "bg-blue-500" : "bg-gray-300"}`}
                                    disabled={readOnly}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.items ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>

                            {/* Pedidos */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Pedidos</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.pedidos}
                                    onClick={() => handle("pedidos")(!record.pedidos)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.pedidos ? "bg-blue-500" : "bg-gray-300"}`}
                                    disabled={readOnly}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.pedidos ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>

                            {/* Area in charge */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Áres en cambio</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.area}
                                    onChange={(e) => handle("area")(e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option value="">—</option>
                                    <option value="Operación">Operación</option>
                                    <option value="Calidad">Calidad</option>
                                    <option value="Atención al cliente">Atención al cliente</option>
                                </select>
                            </div>

                            {/* Procesos afectados */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Procesos afectados</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.procesosAfectados}
                                    onChange={(e) => handle("procesosAfectados")(e.target.value)}
                                    readOnly={readOnly}
                                    placeholder="Ej.: Reingreso de mercadería"
                                />
                            </div>

                            {/* Compensaciones */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Compensaciones</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.compensaciones}
                                    onChange={(e) => handle("compensaciones")(e.target.value)}
                                    readOnly={readOnly}
                                    placeholder="Ej.: Giftcard a cliente"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* SLA */}
                    <Card
                        title="SLA"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">SLA</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.sla}
                                    onChange={(e) => handle("sla")(e.target.value)}
                                    readOnly={readOnly}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Unidad</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.unidad}
                                    onChange={(e) => handle("unidad")(e.target.value as UnidadSla)}
                                    disabled={readOnly}
                                >
                                    <option value="Hours">Hours</option>
                                    <option value="Days">Days</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* OTROS */}
                    <Card
                        title="OTROS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Prioridad</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                    value={record.prioridad}
                                    onChange={(e) => handle("prioridad")(e.target.value as Prioridad)}
                                    disabled={readOnly}
                                >
                                    <option value="Baja">Baja</option>
                                    <option value="Media">Media</option>
                                    <option value="Alta">Alta</option>
                                </select>
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
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
                </div>
            </div>
        </div>
    );
}
