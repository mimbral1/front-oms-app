"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon, PencilIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

/* Tipos */
export type ExportStatus = "Enviado" | "Pendiente" | "Error";
export type ExportFormat = "xlsx" | "csv" | "json";

export interface ExportRecord {
    id?: string;
    service: "catalog" | "trace" | "commerce" | string;
    entity: "product" | "category" | "log-import" | "sales-channel" | string;
    format: ExportFormat;
    total: number | string;
    date_created: string; // "YYYY-MM-DDTHH:mm"
    status: ExportStatus;

    createdBy?: { initials: string; name: string; email: string; date?: string };
    modified?: { initials: string; name: string; email: string; date?: string };
}

/* Componente */
export function ExportsFields({
    record,
    readOnly = false,
    onChange,
}: {
    record: ExportRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof ExportRecord>(field: K, value: ExportRecord[K]) => void;
}) {
    const set =
        <K extends keyof ExportRecord>(field: K) =>
            (value: ExportRecord[K]) =>
                onChange?.(field, value);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* DETALLE */}
                <Card
                    title="DETALLE"
                    icon={ClipboardDocumentListIcon}
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl p-6"
                >
                    <div className="grid grid-cols-6 gap-4">
                        {/* Servicio */}
                        <span className="col-span-2 text-sm text-gray-600">Servicio</span>
                        <div className="col-span-4">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.service}
                                options={["catalog", "trace", "commerce"]}
                                onChange={(v) => set("service")(String(v))}
                            // disabled={readOnly}
                            />
                        </div>

                        {/* Entidad */}
                        <span className="col-span-2 text-sm text-gray-600">Entidad</span>
                        <div className="col-span-4">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.entity}
                                options={["product", "category", "log-import", "sales-channel"]}
                                onChange={(v) => set("entity")(String(v))}
                            // disabled={readOnly}
                            />
                        </div>

                        {/* Formato */}
                        <span className="col-span-2 text-sm text-gray-600">Formato</span>
                        <div className="col-span-4">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.format}
                                options={["xlsx", "csv", "json"]}
                                onChange={(v) => set("format")(v as ExportFormat)}
                            // disabled={readOnly}
                            />
                        </div>

                        {/* Total */}
                        <span className="col-span-2 text-sm text-gray-600">Total</span>
                        <div className="col-span-4">
                            <input
                                type="number"
                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                value={record.total}
                                onChange={(e) => set("total")(e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Fecha de creación */}
                        <span className="col-span-2 text-sm text-gray-600">Fecha de creación</span>
                        <div className="col-span-4">
                            <input
                                type="datetime-local"
                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                value={record.date_created}
                                onChange={(e) => set("date_created")(e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Estado */}
                        <span className="col-span-2 text-sm text-gray-600">Estado</span>
                        <div className="col-span-4">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.status}
                                options={["Enviado", "Pendiente", "Error"]}
                                onChange={(v) => set("status")(v as ExportStatus)}
                            // disabled={readOnly}
                            />
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
                    <div className="grid grid-cols-6 gap-6">
                        {/* Usuario creador */}
                        <div className="col-span-6">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                                <UserIcon className="h-5 w-5" /> USUARIO CREADOR
                            </div>
                            <div className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                                        {record.createdBy?.initials ?? "US"}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">{record.createdBy?.name ?? "—"}</div>
                                        <div className="text-gray-500">{record.createdBy?.email ?? "—"}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500">{record.createdBy?.date ?? "—"}</div>
                            </div>
                        </div>

                        {/* Última modificación */}
                        <div className="col-span-6">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                                <PencilIcon className="h-5 w-5" /> ÚLTIMA MODIFICACIÓN
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                                        {record.modified?.initials ?? "UM"}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">{record.modified?.name ?? "—"}</div>
                                        <div className="text-gray-500">{record.modified?.email ?? "—"}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500">{record.modified?.date ?? "—"}</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default ExportsFields;
