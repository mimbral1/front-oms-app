// app/views/Soporte/Tickets/components/TicketsFields.tsx
"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    ClockIcon,
    QueueListIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

/* Interfaz: espejo del estilo de SalesChannelsFields (props + isCreate) */ // :contentReference[oaicite:4]{index=4}
export interface Ticket {
    id?: string | number;

    // PEDIDO
    commerceId: string;
    amount: number | string;
    currency: string;
    status?: "Nuevo" | "En progreso" | "Escalado" | "Pausado" | "Cerrado";
    createdAt?: string;

    // SLA
    slaValue?: number | null;
    slaUnit?: "Hours" | "Days" | "";
    slaDue?: string;

    // DETALLE
    channel: string;
    reason: string;

    // ASIGNACIÓN
    areaInCharge: string;
}

export function TicketsFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: Ticket;
    readOnly?: boolean;
    onChange?: (field: keyof Ticket, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof Ticket) => (v: any) => onChange?.(field, v);

    // opciones locales (mock) - mismo patrón de select-search inline
    const [channelSearch, setChannelSearch] = useState("");
    const channelOptions = useMemo(
        () => [
            { label: "Seleccione canal…", value: "" },
            { label: "Web", value: "Web" },
            { label: "App", value: "App" },
            { label: "Marketplace", value: "Marketplace" },
            { label: "WhatsApp", value: "WhatsApp" },
        ],
        []
    );
    const visibleChannels = useMemo(() => {
        const q = channelSearch.trim().toLowerCase();
        if (!q) return channelOptions;
        return channelOptions.filter((opt) =>
            (opt.label + " " + opt.value).toLowerCase().includes(q)
        );
    }, [channelOptions, channelSearch]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* PEDIDO */}
                    <Card
                        title="PEDIDO"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {/* Grid 2x2: cada item ocupa 6 columnas en lg (una mitad) */}
                        <div className="grid grid-cols-12 gap-4">
                            {/* Commerce ID (fila 1, col 1) */}
                            <div className="col-span-12 lg:col-span-6 grid grid-cols-6 gap-2 items-center">
                                <span className="col-span-2 text-sm text-gray-600 font-bold">Commerce ID</span>
                                <div className="col-span-4">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.commerceId}
                                        onChange={(e) => handle("commerceId")(e.target.value)}
                                        placeholder=""
                                        readOnly={readOnly}
                                    />
                                </div>
                            </div>

                            {/* Estado (fila 1, col 2) */}
                            <div className="col-span-12 lg:col-span-6 grid grid-cols-6 gap-2 items-center">
                                <span className="col-span-2 text-sm text-gray-600 font-bold">Estado</span>
                                <div className="col-span-4">
                                    <CollapsibleField
                                        label=""
                                        value={record.status || "Nuevo"}
                                        options={["Nuevo", "En progreso", "Escalado", "Pausado", "Cerrado"]}
                                        onChange={handle("status")}
                                        inline
                                    />
                                </div>
                            </div>

                            {/* Importe del pedido (fila 2, col 1) */}
                            <div className="col-span-12 lg:col-span-6 grid grid-cols-6 gap-2 items-center">
                                <span className="col-span-2 text-sm text-gray-600 font-bold">Importe del pedido</span>
                                <div className="col-span-4">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={record.amount}
                                        onChange={(e) => handle("amount")(e.target.value)}
                                        placeholder=""
                                        readOnly={readOnly}
                                    />
                                    {/* <div className="col-span-2">
                                        <CollapsibleField
                                            label=""
                                            value={record.currency}
                                            options={["ARS", "CLP", "USD", "EUR"]}
                                            onChange={handle("currency")}
                                            inline
                                        />
                                    </div> */}
                                </div>
                            </div>

                            {/* Creación (fila 2, col 2) — solo en Resumen */}
                            {!isCreate && (
                                <div className="col-span-12 lg:col-span-6 grid grid-cols-6 gap-2 items-center">
                                    <span className="col-span-2 text-sm text-gray-600 font-bold">Creación</span>
                                    <div className="col-span-4">
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={record.createdAt || "—"}
                                            readOnly
                                            disabled
                                            placeholder=""
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={QueueListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Channel (select-search inline) */} {/* :contentReference[oaicite:6]{index=6} */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Canal</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="channel"
                                    label="Channel"
                                    value={record.channel}
                                    options={visibleChannels}
                                    searchQuery={channelSearch}
                                    loading={false}
                                    onSearch={setChannelSearch}
                                    onChange={(val) => handle("channel")(val || "")}
                                    placeholderFromDefault
                                />
                            </div>

                            {/* Motivo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Motivo</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.reason}
                                    options={["Devolución", "Cambio", "Consulta", "Reclamo"]}
                                    onChange={handle("reason")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* SLA */}
                    <Card
                        title="SLA"
                        icon={ClockIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* SLA */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">SLA</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.slaValue ?? ""}
                                    onChange={(e) => handle("slaValue")(Number(e.target.value) || 0)}
                                    placeholder=""
                                    readOnly={readOnly}
                                />
                            </div>

                            {/* Unidad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Unidad</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.slaUnit || ""}
                                    options={["Hours", "Days"]}
                                    onChange={handle("slaUnit")}
                                    inline
                                />
                            </div>

                            {/* Plazo límite */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Plazo límite</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.slaDue || ""}
                                    onChange={(e) => handle("slaDue")(e.target.value)}
                                    placeholder="07/06/2023 14:21"
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* ASIGNACIÓN */}
                    <Card
                        title="ASIGNACIÓN"
                        // icon={UserCircleIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Área in charge */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Área en cambio</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.areaInCharge}
                                    options={["Operación", "Atención", "Finanzas"]}
                                    onChange={handle("areaInCharge")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
