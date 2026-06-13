// views\Almacen\Configuraciones\Sources\components\SourcesFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";

export interface SourceRecord {
    id?: string;

    nombre: string;
    refId: string;
    warehouseRefId: string;
    warehouseName: string;

    location: string;
    sourceCode: string;
    plataforma: string;

    salesChannels: string;
    sellers: string;

    notasInternas: string;
    estado: string; // "Activo" | "Inactivo"
}

export function SourcesFields({
    record,
    onChange,
}: {
    record: SourceRecord;
    onChange: (field: keyof SourceRecord, value: any) => void;
}) {
    const handle = (field: keyof SourceRecord) => (v: any) => onChange(field, v);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">

                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">

                            {/* Nombre */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Nombre legible para identificar el source.
                                </p>
                            </div>

                            {/* Warehouse RefID */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Almacén RefID</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.warehouseRefId}
                                    onChange={(e) => handle("warehouseRefId")(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    RefId del Almacén al que se vincula.
                                </p>
                            </div>

                            {/* Location */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Ubicación</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.location}
                                    onChange={(e) => handle("location")(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Se infiere del Almacén (puede ser informativo).
                                </p>
                            </div>

                            {/* Source Code */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Source Code (externo)</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.sourceCode}
                                    onChange={(e) => handle("sourceCode")(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Código del source en la plataforma externa.
                                </p>
                            </div>

                            {/* Sellers */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Vendedores</span>
                            <div className="col-span-4">
                                <textarea
                                    className="w-full border border-gray-300 rounded-md text-sm p-2 outline-none"
                                    rows={2}
                                    value={record.sellers}
                                    onChange={(e) => handle("sellers")(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Separados por coma.
                                </p>
                            </div>

                            {/* Notas internas */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Notas internas</span>
                            <div className="col-span-4">
                                <textarea
                                    className="w-full border border-gray-300 rounded-md text-sm p-2 outline-none"
                                    rows={2}
                                    value={record.notasInternas}
                                    onChange={(e) => handle("notasInternas")(e.target.value)}
                                />
                            </div>

                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">

                    {/* DATOS ADICIONALES */}
                    <Card
                        title="DATOS ADICIONALES"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">

                            {/* RefID  */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">RefID</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.refId}
                                    onChange={(e) => handle("refId")(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">Identificador interno único.</p>
                            </div>

                            {/* Warehouse Nombre */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Warehouse (nombre)</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.warehouseName}
                                    onChange={(e) => handle("warehouseName")(e.target.value)}
                                />
                            </div>

                            {/* Plataforma */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Plataforma</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.plataforma}
                                    onChange={(e) => handle("plataforma")(e.target.value)}
                                />
                            </div>

                            {/* Sales Channels */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Sales Channels</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.salesChannels}
                                    onChange={(e) => handle("salesChannels")(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Separados por coma (coinciden con salesChannelIds).
                                </p>
                            </div>

                            {/* Estado */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-4">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.estado}
                                    onChange={(e) => handle("estado")(e.target.value)}
                                />
                            </div>

                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
