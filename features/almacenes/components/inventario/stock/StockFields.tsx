"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    CubeIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/user-avatar";
import { CopyableText } from "@/components/ui/copyable-text";
import { Toggle } from "@/components/ui/togle/togle";

/** ====== tipos ALINEADOS al view (StockRow) ====== */
export type WarehouseRow = {
    warehouse: string;
    onHand: number;
    safety: number;
    reservado: number;
    proyectado: number;
    disponible: number;
    infinito: boolean;
    updatedAt: string; // ISO
    blocked: boolean
};

export interface StockRecord {
    sku: string;
    nombre: string;
    inventario: string;       // warehouseCode (de la fila principal)
    onHand: number;           // Stock (única)
    safety: number;           // Stock de seguridad
    reservado: number;        // Reservado (NV)
    disponible: number;       // onHand - reservado
    proyectado: number;       // Orden de compra (OC)
    infinito: boolean;        // Infinite stock
    updatedAt: string;        // fecha/hora
    usuario: string;
    correo: string;
    blocked: boolean;
    warehouses: WarehouseRow[]; // detalle por bodega
}

export type InventarioOption = {
    value: string;
    label: string;
};

/** Chips */
const tone: Record<"yellow" | "blue" | "green" | "red" | "gray", string> = {
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-200 text-gray-700",
};

const Pill = ({ v, t }: { v: number | string; t: keyof typeof tone }) => (
    <span className={`inline-flex min-w-[36px] justify-center items-center rounded-full px-3 py-1 text-sm font-semibold ${tone[t]}`}>
        {v}
    </span>
);

export default function StockFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
    hideInfiniteInDetail = false,
    inventarios = [
        { value: "01", label: "01" },
        { value: "02", label: "02" },
        { value: "03", label: "03" },
    ],
}: {
    record: StockRecord;
    readOnly?: boolean;
    onChange?: (field: keyof StockRecord, value: any) => void;
    isCreate?: boolean;
    hideInfiniteInDetail?: boolean;
    inventarios?: InventarioOption[];
}) {
    const set =
        (field: keyof StockRecord) =>
            (v: any) =>
                onChange?.(field, v);

    const Label = ({ children }: { children: React.ReactNode }) => (
        <span className="text-sm text-gray-600 font-bold">{children}</span>
    );

    const createStockValue = Number.isFinite(record.onHand) ? String(record.onHand) : "";

    return (
        <div className="space-y-6">
            <div className={`grid grid-cols-1 items-stretch gap-6 ${isCreate ? "lg:grid-cols-1" : "lg:grid-cols-7"}`}>
                {/* IZQUIERDA: DETALLE */}
                <div className={isCreate ? "flex" : "lg:col-span-4 flex"}>
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        borderClass="border-slate-200"
                        className="h-full w-full bg-white"
                    >
                        {isCreate ? (
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <Label>SKU</Label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-semibold text-gray-800 outline-none focus:border-blue-400"
                                                value={record.sku}
                                                onChange={(e) => set("sku")(e.target.value)}
                                                disabled={readOnly}
                                                placeholder="Ingresa SKU"
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <Label>Stock</Label>
                                        <div className="mt-2">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-semibold text-gray-800 outline-none focus:border-blue-400"
                                                value={createStockValue}
                                                onChange={(e) => {
                                                    if (e.target.value === "") {
                                                        set("onHand")(Number.NaN);
                                                        return;
                                                    }
                                                    const next = Number(e.target.value);
                                                    set("onHand")(Number.isFinite(next) ? next : 0);
                                                }}
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <Label>Inventario</Label>
                                        <div className="mt-2">
                                            <select
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-semibold text-gray-800 outline-none focus:border-blue-400"
                                                value={record.inventario}
                                                onChange={(e) => set("inventario")(e.target.value)}
                                                disabled={readOnly}
                                            >
                                                <option value="">Selecciona bodega</option>
                                                {inventarios.map((inv) => (
                                                    <option key={inv.value} value={inv.value}>
                                                        {inv.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <Label>Stock infinito</Label>
                                        <div className="mt-2 flex h-[42px] items-center rounded-xl border border-gray-300 bg-white px-3">
                                            <Toggle
                                                checked={record.infinito}
                                                onCheckedChange={(v) => set("infinito")(v)}
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Fila: SKU */}
                                <div className="grid grid-cols-6 gap-4 items-center">
                                    <div className="col-span-1">
                                        <Label>SKU</Label>
                                    </div>
                                    <div className="col-span-5 flex items-center gap-2">
                                        <CubeIcon className="h-5 w-5 text-gray-500" />
                                        <div className="w-full border-b border-gray-300 pb-[2px] text-base font-semibold text-blue-600">
                                            <CopyableText text={record.sku}>{record.sku || "—"}</CopyableText>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <Label>Stock</Label>
                                        <div className="mt-2">
                                            <Pill v={record.onHand} t={record.onHand < 0 ? "red" : "blue"} />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <Label>Stock disponible</Label>
                                        <div className="mt-2">
                                            <Pill v={record.disponible} t={record.disponible < 0 ? "red" : "green"} />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <Label>Stock reservado</Label>
                                        <div className="mt-2">
                                            <Pill v={record.reservado} t={record.reservado < 0 ? "red" : "yellow"} />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <Label>Stock de seguridad</Label>
                                        <div className="mt-2">
                                            {readOnly ? (
                                                <Pill v={Number.isFinite(record.safety) ? record.safety : 0} t="gray" />
                                            ) : (
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    className="w-full max-w-[160px] rounded-full border border-gray-300 bg-white px-3 py-1.5 text-base font-semibold text-gray-800 outline-none focus:border-blue-400"
                                                    value={Number.isFinite(record.safety) ? record.safety : 0}
                                                    onChange={(e) => {
                                                        const next = Number(e.target.value);
                                                        set("safety")(Number.isFinite(next) ? next : 0);
                                                    }}
                                                    disabled={readOnly}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {!hideInfiniteInDetail && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                                            <Label>Stock infinito</Label>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Toggle
                                                    checked={record.infinito}
                                                    onCheckedChange={(v) => set("infinito")(v)}
                                                    disabled={readOnly}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Card>
                </div>

                {/* DERECHA: USUARIOS */}
                {!isCreate && <div className="lg:col-span-3 flex flex-col gap-6">
                    {!isCreate && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            hasTitleDivider
                            borderClass="border-slate-200"
                            className="bg-white"
                        >
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        name={record.usuario || "Sistema"}
                                        alt={record.usuario || "Sistema"}
                                        className="h-9 w-9"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-semibold text-slate-800">{record.usuario || "Sistema"}</p>
                                        <p className="truncate text-sm text-slate-500">{record.correo || "Sin email"}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>}
            </div>
        </div>
    );
}
