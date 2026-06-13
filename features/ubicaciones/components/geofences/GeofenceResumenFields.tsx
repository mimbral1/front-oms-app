"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    MapPinIcon,
    CodeBracketIcon,
    ClipboardIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

// CodeMirror (igual que usas en Etiquetas)
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { dracula } from "@uiw/codemirror-theme-dracula";
import MapaGeofence from "./MapaGeofence";
import type { Coverage } from "./MapaGeofence";
import { ActionButton } from "@/components/ui/button/action-button";

export type GeofenceStatus = "active" | "inactive";

export interface GeofenceRecord {
    id?: string | number;
    name: string;
    status: GeofenceStatus;
    description?: string;
    user: string | number;
    coverage: Coverage | null;
    dateCreated?: string | null;
    userCreated?: string | null;
    dateModified?: string | null;
    userModified?: string | null;
}

export default function GeofenceResumenFields({
    record,
    onChange,
}: {
    record: GeofenceRecord;
    onChange: <K extends keyof GeofenceRecord>(field: K, value: GeofenceRecord[K]) => void;
}) {
    const handle =
        <K extends keyof GeofenceRecord>(field: K) =>
            (value: GeofenceRecord[K]) =>
                onChange(field, value);

    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // manejar modo de edicion

    const statusOptions = useMemo(
        () => [
            { label: "Activo", value: "active" },
            { label: "Inactivo", value: "inactive" },
        ],
        []
    );

    const codeStr = useMemo(
        () => JSON.stringify(record.coverage ?? [[[[]]]], null, 2),
        [record.coverage]
    );

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(codeStr);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                <div className="lg:col-span-7">
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
                </div>

                <div className="lg:col-span-4">
                    {/* COBERTURA (POLÍGONO) */}
                    <Card
                        title="COBERTURA (POLÍGONO)"
                        icon={MapPinIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm text-gray-700 font-medium">
                                {isEditing ? "Modo edición de polígono" : "Vista del polígono"}
                            </div>
                            <ActionButton
                                type="button"
                                variant={isEditing ? "gray" : "primary"}
                                size="sm"
                                onClick={() => setIsEditing((v) => !v)}
                            >
                                {isEditing ? "Terminar edición" : "Editar polígono"}
                            </ActionButton>
                        </div>

                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Mapa</span>
                            <div className="col-span-5">
                                <MapaGeofence
                                    coverage={record.coverage}
                                    status={record.status}
                                    editable={isEditing}                    // ↍ alterna edición / solo lectura sin desmontar
                                    onChange={(cov) => onChange("coverage", cov)}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-3">
                    {/* COORDENADAS (JSON) */}
                    <Card
                        title="COORDENADAS (Coverage)"
                        icon={CodeBracketIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-xs text-gray-500">Vista solo-lectura del JSON enviado a la API.</div>
                            <ActionButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={copyCode}
                                className="inline-flex items-center gap-1"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                        Copiado
                                    </>
                                ) : (
                                    <>
                                        <ClipboardIcon className="h-4 w-4" />
                                        Copiar
                                    </>
                                )}
                            </ActionButton>
                        </div>
                        <div className="rounded-lg border border-gray-200">
                            <CodeMirror value={codeStr} height="700px" extensions={[json()]} theme={dracula} readOnly />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
