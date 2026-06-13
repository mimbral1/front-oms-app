// views\Cuenta\Trace\ImportarLogs\components\ImportarLogsFieldsResumen.tsx

"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, Cog6ToothIcon, UserIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

export interface ImportLogResumenFields {
    id?: string;

    // principal
    servicio: string;   // wms | commerce | api
    entidad: string;    // sku_position | api | orders
    idEntidad: string;
    motivo: string;

    // fechas (misma línea: desde / hasta)
    fechaDesde: string; // dd/MM/yyyy HH:mm:ss
    fechaHasta: string; // dd/MM/yyyy HH:mm:ss

    // ejecución (columna derecha)
    athenaId: string;
    cantidad: number | string;
    tamano: string;
    tiempo: string;

    // usuario creador (columna derecha)
    createdBy: { initials: string; name: string; email: string; date?: string };
}

export function ImportarLogsFieldsResumen({
    record,
    onChange,
}: {
    record: ImportLogResumenFields;
    onChange?: (field: keyof ImportLogResumenFields, value: any) => void;
}) {
    const handle = (field: keyof ImportLogResumenFields) => (v: any) => onChange?.(field, v);

    const UserChip = ({ u }: { u: ImportLogResumenFields["createdBy"] }) => (
        <div className="inline-flex max-w-[260px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                {u.initials}
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{u.name}</span>
                <span className="truncate text-xs text-gray-500">{u.email}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA: PRINCIPAL + FECHAS */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="PRINCIPAL"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* ID */}
                            {!!record.id && (
                                <>
                                    <span className="col-span-1 text-sm font-bold text-gray-800">ID</span>
                                    <div className="col-span-5">
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={record.id}
                                            onChange={(e) => handle("id")(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Servicio */}
                            <span className="col-span-1 text-sm font-bold text-gray-800">Servicio</span>
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
                            <span className="col-span-1 text-sm font-bold text-gray-800">Entidad</span>
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
                            <span className="col-span-1 text-sm font-bold text-gray-800">ID Entidad</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.idEntidad}
                                    onChange={(e) => handle("idEntidad")(e.target.value)}
                                />
                            </div>

                            {/* Motivo */}
                            <span className="col-span-1 text-sm font-bold text-gray-800">Motivo</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.motivo}
                                    onChange={(e) => handle("motivo")(e.target.value)}
                                />
                            </div>

                            {/* Fechas en misma fila */}
                            <span className="col-span-1 text-sm font-bold text-gray-800">Fecha desde</span>
                            <div className="col-span-2">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.fechaDesde}
                                    onChange={(e) => handle("fechaDesde")(e.target.value)}
                                    placeholder="dd/MM/yyyy HH:mm:ss"
                                />
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-800">Fecha hasta</span>
                            <div className="col-span-2">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.fechaHasta}
                                    onChange={(e) => handle("fechaHasta")(e.target.value)}
                                    placeholder="dd/MM/yyyy HH:mm:ss"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA: EJECUCIÓN + USUARIO CREADOR */}
                <div className="lg:col-span-3 space-y-6">
                    {/* EJECUCIÓN */}
                    <Card
                        title="EJECUCIÓN"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-2 text-sm font-bold text-gray-800">ID ejecución Athena</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.athenaId}
                                    onChange={(e) => handle("athenaId")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-2 text-sm font-bold text-gray-800">Cant.</span>
                            <div className="col-span-4">
                                <input
                                    type="number"
                                    min={0}
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.cantidad}
                                    onChange={(e) => handle("cantidad")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-2 text-sm font-bold text-gray-800">Tamaño</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.tamano}
                                    onChange={(e) => handle("tamano")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-2 text-sm font-bold text-gray-800">Tiempo de ejecución</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.tiempo}
                                    onChange={(e) => handle("tiempo")(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* USUARIO CREADOR */}
                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <UserChip u={record.createdBy} />
                            <span className="text-sm text-gray-600">{record.createdBy.date ?? "—"}</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
