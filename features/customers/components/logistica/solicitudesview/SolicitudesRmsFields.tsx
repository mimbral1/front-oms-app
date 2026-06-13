// app/views/Operaciones/Solicitudes/components/SolicitudesRmsFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon } from "@heroicons/react/24/outline";

/** Modelo */
export interface SolicitudRms {
    id?: string;

    // DETALLE
    transportista: string;      // texto (ej: "Retiro en tienda")
    deadline: string;           // "dd/mm/yyyy hh:mm"

    // FLOW
    flowName: string;
    permitirSustitucion: boolean;
    pickearNuevoPedido: boolean;
    facturarPedido: boolean;
    solicitarNotaCredito: boolean;

    // CLIENTE (derecha)
    clienteNombre: string;
    clienteApellido: string;
    clienteEmail: string;

    // Usuarios (solo en Resumen)
    creador?: { nombre: string; email: string; fecha: string };
    modificador?: { nombre: string; email: string; fecha: string };
}

export function SolicitudesRmsFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: SolicitudRms;
    readOnly?: boolean;
    onChange?: (field: keyof SolicitudRms, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof SolicitudRms) => (v: any) => onChange?.(field, v);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Transportista */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Transportista</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.transportista}
                                    onChange={(e) => handle("transportista")(e.target.value)}
                                    readOnly={readOnly}
                                />
                            </div>

                            {/* Deadline */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Deadline</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.deadline}
                                    onChange={(e) => handle("deadline")(e.target.value)}
                                    readOnly={readOnly}
                                    placeholder="dd/mm/aaaa hh:mm"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* FLOW */}
                    <Card
                        title="FLOW"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Flow name */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Flow name</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.flowName}
                                    onChange={(e) => handle("flowName")(e.target.value)}
                                    readOnly={readOnly}
                                />
                            </div>

                            {/* Permitir sustitución */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Permitir sustitución</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.permitirSustitucion}
                                    onClick={() => handle("permitirSustitucion")(!record.permitirSustitucion)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.permitirSustitucion ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.permitirSustitucion ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Pickear nuevo pedido */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Pickear nuevo pedido</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.pickearNuevoPedido}
                                    onClick={() => handle("pickearNuevoPedido")(!record.pickearNuevoPedido)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.pickearNuevoPedido ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.pickearNuevoPedido ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Facturar pedido */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Facturar pedido</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.facturarPedido}
                                    onClick={() => handle("facturarPedido")(!record.facturarPedido)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.facturarPedido ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.facturarPedido ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Solicitar nota de crédito */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Solicitar nota de crédito</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.solicitarNotaCredito}
                                    onClick={() => handle("solicitarNotaCredito")(!record.solicitarNotaCredito)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.solicitarNotaCredito ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.solicitarNotaCredito ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* CLIENTE */}
                    <Card
                        title="CLIENTE"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.clienteNombre}
                                    onChange={(e) => handle("clienteNombre")(e.target.value)}
                                    readOnly={readOnly}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Apellido</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.clienteApellido}
                                    onChange={(e) => handle("clienteApellido")(e.target.value)}
                                    readOnly={readOnly}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                            <div className="col-span-5">
                                <input
                                    type="email"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.clienteEmail}
                                    onChange={(e) => handle("clienteEmail")(e.target.value)}
                                    readOnly={readOnly}
                                />
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
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                                <div className="col-span-5 text-sm">{record.creador.nombre}</div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                                <div className="col-span-5 text-sm">{record.creador.email}</div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Fecha</span>
                                <div className="col-span-5 text-sm">{record.creador.fecha}</div>
                            </div>
                        </Card>
                    )}

                    {/* ÚLTIMA MODIFICACIÓN (solo en Resumen) */}
                    {!isCreate && record.modificador && (
                        <Card
                            title="ÚLTIMA MODIFICACIÓN"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                                <div className="col-span-5 text-sm">{record.modificador.nombre}</div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                                <div className="col-span-5 text-sm">{record.modificador.email}</div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Fecha</span>
                                <div className="col-span-5 text-sm">{record.modificador.fecha}</div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
