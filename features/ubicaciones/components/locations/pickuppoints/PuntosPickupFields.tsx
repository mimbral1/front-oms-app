// app/views/Pickup/Points/components/PickupFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

/* Interfaz del formulario/resumen */
export interface PickupPoint {
    id?: string;
    name: string;
    refId: string;
    locationName: string;
    locationId?: string;
    scheduleScheme: string;
    startDay: string;   // ej: "lunes"
    startTime: string;  // ej: "11:00"
    status?: "Activo" | "Inactivo";
    coords?: { lat: number; lon: number };

    created: { username: string; email: string; date: string };
    modified: { username: string; email: string; date: string };
}

interface Props {
    record: PickupPoint;
    readOnly?: boolean;
    onChange?: <K extends keyof PickupPoint>(field: K, value: PickupPoint[K]) => void;
}

export const PickupFields: React.FC<Props> = ({ record, readOnly: _readOnly = false, onChange }) => {
    const handle = <K extends keyof PickupPoint>(field: K) => (val: PickupPoint[K]) => onChange?.(field, val);

    return (
        <div className="space-y-6">
            {/* ─── GRID PRINCIPAL ─── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* LEFT (DETALLE + USUARIOS) */}
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
                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    value={record.name}
                                    onChange={(e) => handle("name")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Ref ID */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ref ID</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    value={record.refId}
                                    onChange={(e) => handle("refId")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Ubicacion */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ubicación</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.locationName}
                                    options={["Store 101", "Store 103", "Store 205"]}
                                    onChange={handle("locationName")}
                                    inline
                                />
                            </div>

                            {/* Esquema horario */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Esquema horario</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    value={record.scheduleScheme}
                                    onChange={(e) => handle("scheduleScheme")(e.target.value)}
                                >
                                    {["Windows default", "Horario tienda", "Feriados"].map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fecha inicio (día) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Fecha inicio</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    value={record.startDay}
                                    onChange={(e) => handle("startDay")(e.target.value)}
                                >
                                    {["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"].map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Hora inicio */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Hora de inicio</span>
                            <div className="col-span-1">
                                <input
                                    type="time"
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    value={record.startTime}
                                    onChange={(e) => handle("startTime")(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT: UBICACIÓN (mapa mock) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card
                        title="UBICACIÓN"
                        icon={MapPinIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-3 gap-4">
                            {/* <span className="col-span-1 text-sm text-gray-600 font-bold">Ubicación</span> */}
                            <div className="col-span-3 h-80 w-full rounded-md border bg-gray-100 flex items-center justify-center">
                                <span className="text-xs text-gray-500">[Mapa mock con marcador]</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
