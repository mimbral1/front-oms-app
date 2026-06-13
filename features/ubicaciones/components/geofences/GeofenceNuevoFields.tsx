"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";

// Reutilizamos tus componentes ya existentes
import GooglePlacesAutocomplete from "@/features/pedidos/components/detalles-pedido/GooglePlacesAutocomplete";
import MapaGeofence, { Coverage } from "./MapaGeofence";

export type GeofenceStatus = "active" | "inactive";

export interface ApiGeofence {
    id?: string | number;
    name: string;
    status: GeofenceStatus;
    description?: string;
    user: string | number;
    coverage: Coverage | null; // [[[ [lng, lat], ... ]]]
}

export default function GeofenceNuevoFields({
    record,
    onChange,
    isCreate,
}: {
    record: ApiGeofence;
    onChange: <K extends keyof ApiGeofence>(field: K, value: ApiGeofence[K]) => void;
    isCreate?: boolean;
}) {
    const handle =
        <K extends keyof ApiGeofence>(field: K) =>
            (value: ApiGeofence[K]) =>
                onChange(field, value);

    // ====== buscador para centrar el mapa (no altera datos) ======
    const [searchQuery, setSearchQuery] = useState("");

    const statusOptions = useMemo(
        () => [
            { label: "Activo", value: "active" },
            { label: "Inactivo", value: "inactive" },
        ],
        []
    );

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
                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.name}
                                    onChange={(e) => handle("name")(e.target.value)}
                                    placeholder="Nombre de la geocerca"
                                />
                            </div>

                            {/* Descripción */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                            <div className="col-span-5">
                                <textarea
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.description || ""}
                                    onChange={(e) => handle("description")(e.target.value)}
                                    placeholder="Descripción (opcional)"
                                />
                            </div>

                            {/* Estado */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <select
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.status}
                                    onChange={(e) => handle("status")(e.target.value as GeofenceStatus)}
                                >
                                    {statusOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* COBERTURA (POLÍGONO) */}
                    <Card
                        title="COBERTURA (POLÍGONO)"
                        icon={MapPinIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {/* buscador inline, igual a tus vistas */}
                        <div className="mb-3">
                            <GooglePlacesAutocomplete
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Busca una dirección o sector"
                            />
                        </div>

                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Mapa</span>
                            <div className="col-span-5">
                                <MapaGeofence
                                    coverage={record.coverage}
                                    status={record.status}
                                    onChange={(cov) => handle("coverage")(cov)}
                                    centerAddress={searchQuery}
                                />
                                {/* helper */}
                                <div className="mt-2 text-xs text-gray-500">
                                    Dibuja el polígono y ajusta los vértices si lo necesitas. El primer punto se
                                    cierra automáticamente con el último al guardar.
                                </div>

                                {/* Panel avanzado JSON (consistente con estilos) */}
                                <details className="mt-3">
                                    <summary className="cursor-pointer text-xs font-semibold text-gray-600">
                                        Ver/Editar JSON de coverage (avanzado)
                                    </summary>
                                    <div className="mt-2">
                                        <textarea
                                            className="h-40 w-full rounded border border-gray-300 p-2 text-xs outline-none"
                                            value={JSON.stringify(record.coverage ?? [[[[]]]], null, 2)}
                                            onChange={(e) => {
                                                try {
                                                    const obj = JSON.parse(e.target.value);
                                                    handle("coverage")(obj as Coverage);
                                                } catch {
                                                    // ignorar parse error
                                                }
                                            }}
                                        />
                                        <div className="mt-1 text-xs text-gray-500">
                                            Formato requerido: <code>[[[[lng, lat], …]]]]</code>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Si más adelante agregas tarjetas de usuario creador/modificador como en otros módulos,
              colócalas aquí (solo en Resumen). */}
                    {false && !isCreate && <Card title="USUARIO CREADOR" className="rounded-xl p-6" noDefaultStyles hasTitleDivider />}
                </div>
            </div>
        </div>
    );
}
