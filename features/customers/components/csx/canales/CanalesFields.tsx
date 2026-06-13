// views\Customers\Csx\Canales\components\CanalesFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Toggle } from "@/components/ui/togle/togle";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

export type Estado = "Activo" | "Inactivo";

export interface Canal {
    id?: string;
    nombre: string;
    descripcion: string;
    logistica: boolean;
    defaultStockout: boolean;
    mostrarReportes: boolean;
    status: Estado;
    created?: { username: string; email?: string; date: string };
    modified?: { username: string; email?: string; date: string };
}

interface Props {
    record: Canal;
    readOnly?: boolean;
    onChange?: <K extends keyof Canal>(field: K, value: Canal[K]) => void;
}

/* --- helpers visuales --- */
const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="grid grid-cols-6 gap-4 py-3">
        <span className="col-span-1 text-sm text-gray-600">{label}</span>
        <div className="col-span-5">{children}</div>
    </div>
);

const estadoOptions: Estado[] = ["Activo", "Inactivo"];

const CanalesFields: React.FC<Props> = ({ record, readOnly = true, onChange }) => {
    const isNew = !record.created?.username;

    const set = <K extends keyof Canal>(field: K) => (val: Canal[K]) => onChange?.(field, val);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* LEFT */}
                <div className="lg:col-span-2 space-y-6">
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <FieldRow label="Nombre">
                            {readOnly ? (
                                <span className="text-sm font-medium text-gray-900 truncate">{record.nombre || "—"}</span>
                            ) : (
                                <input
                                    type="text"
                                    value={record.nombre}
                                    onChange={(e) => set("nombre")(e.target.value)}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            )}
                        </FieldRow>

                        <FieldRow label="Descripción">
                            {readOnly ? (
                                <span className="text-sm font-medium text-gray-900 truncate">{record.descripcion || "—"}</span>
                            ) : (
                                <input
                                    type="text"
                                    value={record.descripcion}
                                    onChange={(e) => set("descripcion")(e.target.value)}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            )}
                        </FieldRow>

                        <FieldRow label="Logistica">
                            {readOnly ? (
                                <span className="text-sm text-gray-900">{record.logistica ? "Sí" : "No"}</span>
                            ) : (
                                <Toggle checked={record.logistica} onCheckedChange={(v) => set("logistica")(v)} />
                            )}
                        </FieldRow>

                        <FieldRow label="Default (stockout)">
                            {readOnly ? (
                                <span className="text-sm text-gray-900">{record.defaultStockout ? "Sí" : "No"}</span>
                            ) : (
                                <Toggle checked={record.defaultStockout} onCheckedChange={(v) => set("defaultStockout")(v)} />
                            )}
                        </FieldRow>

                        <FieldRow label="Mostrar en reportes">
                            {readOnly ? (
                                <span className="text-sm text-gray-900">{record.mostrarReportes ? "Sí" : "No"}</span>
                            ) : (
                                <Toggle checked={record.mostrarReportes} onCheckedChange={(v) => set("mostrarReportes")(v)} />
                            )}
                        </FieldRow>
                    </Card>
                </div>

                {/* RIGHT */}
                <div className="space-y-6">
                    <Card
                        title="OTROS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <FieldRow label="Estado">
                            {readOnly ? (
                                <span className="text-sm font-medium text-gray-900">{record.status}</span>
                            ) : (
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.status}
                                    options={estadoOptions}
                                    onChange={(v) => set("status")(v as Estado)}
                                />
                            )}
                        </FieldRow>
                    </Card>

                    <Card title="USUARIO CREADOR" icon={UserIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        {isNew ? (
                            <span className="text-sm text-gray-500">—</span>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                        {record.created?.username?.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-semibold text-blue-600">{record.created?.username}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{record.created?.email}</div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">{record.created?.date}</span>
                            </div>
                        )}
                    </Card>

                    <Card title="ÚLTIMA MODIFICACIÓN" icon={PencilIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        {record.modified ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                        {record.modified?.username?.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-semibold text-blue-600">{record.modified?.username}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{record.modified?.email}</div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">{record.modified?.date}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500">—</span>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CanalesFields;
