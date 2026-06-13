"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { CopyableText } from "@/components/ui/copyable-text";
import {
    HomeIcon,
    TruckIcon,
    UserIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

export type RutaEntregaRow = {
    id: string;
    refId: string;
    displayId: string;
    origin: string;
    type: string;
    carrierId: string;
    operatorLogisticId: string;
    status: string;
    failedDeliveries: number;
    scheduleStart: string;
    scheduleEnd: string;
    senderFullname: string;
    receiverFullname: string;
    receiverDocument: string;
    receiverPhone: string;
    dropoffAddress: string;
    productQuantity: number;
    dateCreated: string;
};

function toStatusLabel(value: string) {
    const status = String(value || "").trim().toLowerCase();
    if (status === "routed") return "En ruta";
    if (status === "delivered") return "Entregada";
    if (status === "created") return "Creada";
    if (status === "cancelled" || status === "canceled") return "Cancelada";
    if (!status) return "-";
    return value;
}

function toStatusClass(value: string) {
    const status = String(value || "").trim().toLowerCase();
    if (status === "delivered") return "bg-emerald-100 text-emerald-700";
    if (status === "cancelled" || status === "canceled") return "bg-rose-100 text-rose-700";
    if (status === "created") return "bg-orange-100 text-orange-700";
    return "bg-sky-100 text-sky-700";
}

function toRowAccent(value: string) {
    const status = String(value || "").trim().toLowerCase();
    if (status === "delivered") return "#10b981";
    if (status === "cancelled" || status === "canceled") return "#f43f5e";
    if (status === "created") return "#f97316";
    return "#3b82f6";
}

function toDateLabel(value: string) {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString();
}

function toProgramacionLabel(value: string) {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function RutasEntregasTab({
    rows,
    loading,
    error,
    onViewDelivery,
}: {
    rows: RutaEntregaRow[];
    loading: boolean;
    error: string | null;
    onViewDelivery?: (shippingId: string) => void;
}) {
    return (
        <Card title="" noDefaultStyles className="rounded-xl p-0">
            {loading ? (
                <div className="p-6 text-sm text-gray-500">Cargando entregas...</div>
            ) : error ? (
                <div className="m-6 rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : rows.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No hay entregas asociadas a esta ruta.</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
                    <div className="min-w-[1450px]">
                        <div className="grid grid-cols-[1.5fr_1.6fr_1.9fr_2.2fr_1.7fr_0.9fr] gap-3 px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <div>Envío</div>
                            <div>Entrega</div>
                            <div>Origen</div>
                            <div>Destino</div>
                            <div>Rango de entrega</div>
                            <div>Status</div>
                        </div>

                        <div className="space-y-1.5">
                            {rows.map((row) => (
                                <div
                                    key={row.id}
                                    className="grid grid-cols-[1.5fr_1.6fr_1.9fr_2.2fr_1.7fr_0.9fr] items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                                    style={{ borderLeft: `4px solid ${toRowAccent(row.status)}` }}
                                >
                                    <div className="min-w-0">
                                        <div className="font-semibold text-blue-600">
                                            <CopyableText text={row.refId}>{row.refId || "-"}</CopyableText>
                                        </div>
                                        <div className="text-xs text-slate-600">{toDateLabel(row.dateCreated)}</div>
                                    </div>

                                    <div className="min-w-0 text-slate-700">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <TruckIcon className="h-4 w-4 text-slate-500" />
                                            <div className="min-w-0 truncate">
                                                <CopyableText text={row.type}>{row.type || "-"}</CopyableText>
                                            </div>
                                        </div>
                                        <div className="truncate pl-6 text-xs text-slate-500">
                                            {row.displayId || "Entrega"}
                                        </div>
                                    </div>

                                    <div className="min-w-0 text-slate-700">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <HomeIcon className="h-4 w-4 text-slate-500" />
                                            <div className="min-w-0 truncate">
                                                <CopyableText text={row.origin}>{row.origin || "-"}</CopyableText>
                                            </div>
                                        </div>
                                        <div className="truncate pl-6 text-xs text-slate-500">{row.operatorLogisticId || "-"}</div>
                                    </div>

                                    <div className="min-w-0 text-slate-700">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <UserIcon className="h-4 w-4 text-slate-500" />
                                            <div className="min-w-0 truncate">
                                                <CopyableText text={row.receiverFullname}>{row.receiverFullname || "-"}</CopyableText>
                                            </div>
                                        </div>
                                        <div className="truncate pl-6 text-xs text-slate-500">{row.dropoffAddress || "-"}</div>
                                        <div className="truncate pl-6 text-xs text-slate-500">{row.receiverPhone || "-"}</div>
                                    </div>

                                    <div className="min-w-0 flex flex-col gap-1 text-xs text-slate-700">
                                        <div className="flex w-fit max-w-full items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5">
                                            <ClockIcon className="h-3.5 w-3.5" />
                                            <span className="truncate">{toProgramacionLabel(row.scheduleStart)}</span>
                                        </div>
                                        <div className="flex w-fit max-w-full items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5">
                                            <ClockIcon className="h-3.5 w-3.5" />
                                            <span className="truncate">{toProgramacionLabel(row.scheduleEnd)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toStatusClass(row.status)}`}>
                                            {toStatusLabel(row.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
