// views\Cuenta\CuentasComercio\Sellers\components\SellersFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, PhotoIcon, UserIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { ActionButton } from "@/components/ui/button/action-button";

/* Interfaz */
export interface ExternalId {
    key: string;
    value: string;
}
export interface Seller {
    id?: string;
    name: string;
    externalIds: ExternalId[];
    email: string;
    phone: string;
    personalId: string;
    logoUrl: string; // no viene de API -> placeholder visual
    status: string;
    created: { username: string; email: string; date: string };
}

export function SellersFields({
    record,
    readOnly = false,
    onChange,
}: {
    record: Seller;
    readOnly?: boolean;
    onChange?: (field: keyof Seller, value: any) => void;
}) {
    const handle = (field: keyof Seller) => (v: any) => onChange?.(field, v);

    const addExternal = () => {
        const next = [...(record.externalIds || []), { key: "", value: "" }];
        handle("externalIds")(next);
    };
    const removeExternal = (idx: number) => {
        const next = (record.externalIds || []).filter((_, i) => i !== idx);
        handle("externalIds")(next);
    };
    const updateExternal = (idx: number, patch: Partial<ExternalId>) => {
        const next = (record.externalIds || []).map((e, i) => (i === idx ? { ...e, ...patch } : e));
        handle("externalIds")(next);
    };

    const hasData = (record.externalIds?.length ?? 0) > 0;
    const items: ExternalId[] = hasData ? record.externalIds! : [{ key: "", value: "" }];

    // Placeholder genérico de imagen cuando no hay logoUrl
    const LogoPlaceholder = () => (
        <div className="flex h-full w-full items-center justify-center text-gray-400">
            <div className="flex flex-col items-center gap-1">
                <PhotoIcon className="h-10 w-10" />
                <span className="text-xs">Sin imagen</span>
            </div>
        </div>
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
                            {/* Name */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.name}
                                    onChange={(e) => handle("name")(e.target.value)}
                                    placeholder=""
                                    disabled={readOnly}
                                />
                            </div>

                            {/* External IDs */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ids externos</span>
                            <div className="col-span-5 space-y-2">
                                {items.map((p, i) => (
                                    <div key={i} className="grid grid-cols-12 items-center gap-2">
                                        <input
                                            className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                            value={p.key}
                                            onChange={(e) => updateExternal(i, { key: e.target.value })}
                                            placeholder=""
                                            disabled={readOnly}
                                        />
                                        <span className="col-span-1 text-center">:</span>
                                        <input
                                            className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                            value={p.value}
                                            onChange={(e) => updateExternal(i, { value: e.target.value })}
                                            placeholder=""
                                            disabled={readOnly}
                                        />
                                        {hasData ? (
                                            <button
                                                type="button"
                                                className="col-span-1 inline-flex justify-end text-gray-500 hover:text-red-600"
                                                onClick={() => removeExternal(i)}
                                                title="Eliminar"
                                                disabled={readOnly}
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        ) : (
                                            <div className="col-span-1" />
                                        )}
                                    </div>
                                ))}
                                {/* {!readOnly && (
                                    // botones
                                )} */}
                                <ActionButton
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={addExternal}
                                    disabled={readOnly}
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </ActionButton>
                            </div>

                            {/* Email */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.email}
                                    onChange={(e) => handle("email")(e.target.value)}
                                    placeholder=""
                                    disabled={readOnly}
                                />
                            </div>

                            {/* Phone */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Teléfono</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.phone}
                                    onChange={(e) => handle("phone")(e.target.value)}
                                    placeholder=""
                                    disabled={readOnly}
                                />
                            </div>

                            {/* Personal ID */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Personal ID</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.personalId}
                                    onChange={(e) => handle("personalId")(e.target.value)}
                                    placeholder=""
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* LOGO */}
                    <Card
                        title="LOGO"
                        icon={PhotoIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-6 flex items-center justify-center">
                                <div className="h-64 w-64 overflow-hidden rounded-md border bg-gray-50">
                                    {record.logoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={record.logoUrl} alt="logo" className="h-full w-full object-cover" />
                                    ) : (
                                        <LogoPlaceholder />
                                    )}
                                </div>
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Logo (URL)</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.logoUrl}
                                    onChange={(e) => handle("logoUrl")(e.target.value)}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </Card>

                    {/* OTROS */}
                    <Card
                        title="OTROS"
                        icon={PhotoIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.status}
                                    options={["Activo", "Inactivo"]}
                                    onChange={handle("status")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* CREATOR USER */}
                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                                {(record.created.username?.charAt(0)?.toUpperCase() || "U")}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{record.created.username || "—"}</span>
                                <span className="text-xs text-gray-500">{record.created.email || "—"}</span>
                                <span className="text-xs text-gray-500">{record.created.date || "—"}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
