"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import {
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    PlusCircleIcon,
    TrashIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";

/* Tipos */
export type WebhookStatus = "Activo" | "Inactivo";
export type TriggerDomain = "oms" | "order";
export type OrderEvent = "ready-for-invoice" | "in-delivery" | "delivered" | "not-delivered";

export interface WebhookRecord {
    id?: string;
    name: string;
    status: WebhookStatus;
    endpoint: string;

    // Triggers
    domains: {
        oms: { enabled: boolean; events: string[] }; // reservado
        order: { enabled: boolean; events: OrderEvent[] };
    };

    // headers
    headers: { id: string; key: string; value: string }[];

    // Meta
    creator?: { initials: string; name: string; email: string; date: string };
    lastmod?: { initials: string; name: string; email: string; date: string };
}

export function WebhookFields({
    record,
    readOnly = false,
    onChange,
}: {
    record: WebhookRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof WebhookRecord>(field: K, value: WebhookRecord[K]) => void;
}) {
    const set =
        <K extends keyof WebhookRecord>(field: K) =>
            (value: WebhookRecord[K]) =>
                onChange?.(field, value);

    const updateHeader = (hid: string, part: "key" | "value", value: string) => {
        const next = record.headers.map((h) => (h.id === hid ? { ...h, [part]: value } : h));
        set("headers")(next);
    };
    const addHeader = () => {
        set("headers")([
            ...record.headers,
            { id: crypto.randomUUID(), key: "", value: "" },
        ]);
    };
    const removeHeader = (hid: string) => {
        set("headers")(record.headers.filter((h) => h.id !== hid));
    };

    const orderEvents: OrderEvent[] = [
        "ready-for-invoice",
        "in-delivery",
        "delivered",
        "not-delivered",
    ];

    // estado triggers 
    const [triggersOpen, setTriggersOpen] = React.useState<{ oms: boolean; order: boolean }>({
        oms: false,
        order: true,
    });


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
                {/* IZQUIERDA — DETALLE */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            {/* Name */}
                            <label className="col-span-3 text-sm text-gray-600">Nombre</label>
                            <div className="col-span-9">
                                {readOnly ? (
                                    <div className="text-sm text-gray-900">{record.name || "—"}</div>
                                ) : (
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.name}
                                        onChange={(e) => set("name")(e.target.value)}
                                        placeholder="Webhook name"
                                    />
                                )}
                            </div>

                            {/* Triggers */}
                            <label className="col-span-3 text-sm text-gray-600">Triggers</label>
                            <div className="col-span-9">
                                <div className="rounded-lg border border-gray-200">

                                    {/* ── OMS (nivel 1) */}
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between px-3 py-2"
                                        onClick={() => setTriggersOpen((s) => ({ ...s, oms: !s.oms }))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4"
                                                checked={!!record.domains.oms.enabled}
                                                disabled={readOnly}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) =>
                                                    set("domains")({
                                                        ...record.domains,
                                                        oms: { ...record.domains.oms, enabled: e.target.checked },
                                                    })
                                                }
                                            />
                                            <span className="text-sm font-medium text-gray-800">oms</span>
                                            <span className="text-xs text-gray-500">
                                                ({record.domains.order.events.length}/{orderEvents.length})
                                            </span>
                                        </div>
                                        <ChevronDownIcon
                                            className={`h-4 w-4 text-gray-400 transition-transform ${triggersOpen.oms ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {/* Contenido de OMS */}
                                    {triggersOpen.oms && (
                                        <div className="border-t border-gray-100">
                                            {/* ── ORDER (nivel 2, anidado) */}
                                            <button
                                                type="button"
                                                className="flex w-full items-center justify-between px-3 py-2 pl-6"
                                                onClick={() => setTriggersOpen((s) => ({ ...s, order: !s.order }))}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4"
                                                        checked={!!record.domains.order.enabled}
                                                        disabled={readOnly}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) =>
                                                            set("domains")({
                                                                ...record.domains,
                                                                order: { ...record.domains.order, enabled: e.target.checked },
                                                            })
                                                        }
                                                    />
                                                    <span className="text-sm font-medium text-gray-800">order</span>
                                                    <span className="text-xs text-gray-500">
                                                        ({record.domains.order.events.length}/{orderEvents.length})
                                                    </span>
                                                </div>
                                                <ChevronDownIcon
                                                    className={`h-4 w-4 text-gray-400 transition-transform ${triggersOpen.order ? "rotate-180" : ""}`}
                                                />
                                            </button>

                                            {/* Eventos de ORDER */}
                                            {triggersOpen.order && (
                                                <div className="px-3 pb-3 pl-12">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {orderEvents.map((ev) => {
                                                            const checked = record.domains.order.events.includes(ev);
                                                            return (
                                                                <label key={ev} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4"
                                                                        // disabled={readOnly || !record.domains.order.enabled}
                                                                        checked={checked}
                                                                        onChange={(e) => {
                                                                            const list = new Set(record.domains.order.events);
                                                                            if (e.target.checked) list.add(ev);
                                                                            else list.delete(ev);
                                                                            set("domains")({
                                                                                ...record.domains,
                                                                                order: {
                                                                                    ...record.domains.order,
                                                                                    events: Array.from(list) as OrderEvent[],
                                                                                },
                                                                            });
                                                                        }}
                                                                    />
                                                                    {ev}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>




                            {/* Endpoint */}
                            <label className="col-span-3 text-sm text-gray-600">Endpoint</label>
                            <div className="col-span-9">
                                {readOnly ? (
                                    <div className="text-sm text-blue-600 underline">{record.endpoint || "—"}</div>
                                ) : (
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.endpoint}
                                        onChange={(e) => set("endpoint")(e.target.value)}
                                        placeholder="https://endpoint.example.com/"
                                    />
                                )}
                            </div>

                            {/* Custom headers */}
                            <label className="col-span-3 text-sm text-gray-600">Custom headers</label>
                            <div className="col-span-9">
                                <div className="space-y-2">
                                    {record.headers.map((h) => (
                                        <div key={h.id} className="grid grid-cols-12 items-center gap-2">
                                            <input
                                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                                placeholder="Header key"
                                                value={h.key}
                                                disabled={readOnly}
                                                onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                                            />
                                            <span className="col-span-1 text-center text-gray-500">:</span>
                                            <input
                                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                                placeholder="Header value"
                                                value={h.value}
                                                disabled={readOnly}
                                                onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                                            />
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeHeader(h.id)}
                                                    className="col-span-1 inline-flex items-center justify-center rounded p-1 text-gray-500 hover:text-red-600"
                                                    title="Eliminar"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={addHeader}
                                            className="mt-1 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100"
                                        >
                                            <PlusCircleIcon className="h-5 w-5" />
                                            Nuevo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA — OTROS */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <Card
                        title="OTROS"
                        icon={Cog6ToothIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <label className="col-span-5 text-sm text-gray-600">Estado</label>
                            <div className="col-span-7">
                                {readOnly ? (
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${record.status === "Activo" ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                                            }`}
                                    >
                                        {record.status}
                                    </span>
                                ) : (
                                    <CollapsibleField
                                        inline
                                        label=""
                                        value={record.status}
                                        options={["Activo", "Inactivo"]}
                                        onChange={(v) => set("status")(v as WebhookStatus)}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* META (si existe) */}
                    {/* {(record.creator || record.lastmod) && (
                        <div className="rounded-xl bg-white p-4 shadow-sm">
                            <div className="grid grid-cols-12 gap-6">
                                {record.creator && (
                                    <div className="col-span-12">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">CREATOR</span>
                                            <div className="h-px flex-1 bg-gray-300" />
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                                                {record.creator.initials}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{record.creator.name}</span>
                                                <span className="text-xs text-gray-500">{record.creator.email}</span>
                                            </div>
                                            <div className="ml-auto text-xs text-gray-500">{record.creator.date}</div>
                                        </div>
                                    </div>
                                )}
                                {record.lastmod && (
                                    <div className="col-span-12">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">LAST MODIFICATION</span>
                                            <div className="h-px flex-1 bg-gray-300" />
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                                                {record.lastmod.initials}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{record.lastmod.name}</span>
                                                <span className="text-xs text-gray-500">{record.lastmod.email}</span>
                                            </div>
                                            <div className="ml-auto text-xs text-gray-500">{record.lastmod.date}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
}
