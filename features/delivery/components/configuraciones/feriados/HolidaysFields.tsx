// views\Delivery\Configuraciones\Feriados\components\HolidaysFields.tsx
"use client";

/* === Fields de Holiday (MISMO ESTILO QUE UsuariosFields) ===
   - Grid 6 columnas (label col-span-1, control col-span-5)
   - Inputs con: border-b bg-transparent text-sm outline-none
   - Toggles como en UsuariosFields
   - Cards con hasTitleDivider, noDefaultStyles
   - Sección derecha con info de usuarios SOLO cuando !isCreate
*/

import React from "react";
import Card from "@/components/ui/card/Card";
import { SingleDateFilter } from "@/components/ui/single-date-filter/SingleDateFilter";
import {
    ClipboardDocumentListIcon,
    TruckIcon,
    UserIcon,
} from "@heroicons/react/24/outline";

export type HolidayStatus = "active" | "inactive";

export interface HolidayRecord {
    id?: string;
    name: string;
    day: string; // YYYY-MM-DD
    status: HolidayStatus;
    target: { delivery: boolean };
    scope: { carrierIds: (string | number)[]; carrierReferenceIds: (string | number)[] };
    description: string;
    // Solo visual en Resumen
    created?: { user?: string; date?: string };
    modified?: { user?: string; date?: string };
}

export function HolidaysFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
    errors,
}: {
    record: HolidayRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof HolidayRecord>(field: K, value: HolidayRecord[K]) => void;
    isCreate?: boolean;
    errors?: Partial<Record<keyof HolidayRecord, string>>;
}) {
    const handle =
        <K extends keyof HolidayRecord>(field: K) =>
            (value: HolidayRecord[K]) =>
                onChange?.(field, value);

    const err = (k: keyof HolidayRecord) => errors?.[k];

    // helpers chips simples (texto separado por coma)
    const joinChips = (arr: (string | number)[]) => (arr ?? []).map(String).join(", ");
    const splitChips = (s: string) =>
        (s || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETAIL */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        className="rounded-xl"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Name */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className={`w-full border-b bg-transparent text-sm outline-none ${err("name") ? "border-red-500" : "border-gray-300"}`}
                                    value={record.name}
                                    onChange={(e) => handle("name")(e.target.value as any)}
                                    readOnly={readOnly}
                                    aria-invalid={!!err("name")}
                                    placeholder="Nombre del feriado"
                                />
                                {err("name") && <p className="mt-1 text-xs text-red-600">{err("name")}</p>}
                            </div>

                            {/* Day (fecha) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Día</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm font-medium text-gray-900">{record.day || "—"}</div>
                                ) : (
                                    <SingleDateFilter
                                        value={record.day || null}
                                        onChange={(date) => handle("day")((date ?? "") as any)}
                                        label="Seleccionar día"
                                    />
                                )}
                                {err("day") && <p className="mt-1 text-xs text-red-600">{err("day")}</p>}
                            </div>
                        </div>
                    </Card>

                    {/* DELIVERY */}
                    <Card
                        title="DELIVERY"
                        icon={TruckIcon}
                        hasTitleDivider
                        className="rounded-xl"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Target delivery (toggle como en UsuariosFields) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Aplica a Delivery</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.target?.delivery}
                                    onClick={() => handle("target")({ delivery: !Boolean(record.target?.delivery) } as any)}
                                    disabled={readOnly}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.target?.delivery ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.target?.delivery ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* carrier data by */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Transportistas</span>
                            <div className="col-span-5">
                                {(() => {
                                    const carrierDataBy =
                                        (record.scope?.carrierReferenceIds ?? []).length > 0
                                            ? (record.scope?.carrierReferenceIds ?? [])
                                            : (record.scope?.carrierIds ?? []);

                                    return (
                                        <input
                                            className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                            placeholder="carrier1, carrier2"
                                            value={joinChips(carrierDataBy)}
                                            onChange={(e) =>
                                                handle("scope")({
                                                    ...record.scope,
                                                    carrierReferenceIds: splitChips(e.target.value),
                                                } as any)
                                            }
                                            readOnly={readOnly}
                                        />
                                    );
                                })()}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(((record.scope?.carrierReferenceIds ?? []).length > 0
                                        ? record.scope?.carrierReferenceIds
                                        : record.scope?.carrierIds) ?? []).map((c, i) => (
                                            <span
                                                key={`${c}-${i}`}
                                                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                                            >
                                                {String(c)}
                                            </span>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Usuarios (solo Resumen) */}
                    {!isCreate && (
                        <>
                            <Card
                                title="USUARIO CREADOR"
                                icon={UserIcon}
                                hasTitleDivider
                                className="rounded-xl"
                            >
                                <div className="grid grid-cols-6 gap-4">
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Usuario</span>
                                    <div className="col-span-5">
                                        <div className="text-sm font-medium">{record.created?.user ?? "—"}</div>
                                        <div className="text-xs text-gray-500">{record.created?.date ?? "—"}</div>
                                    </div>
                                </div>
                            </Card>

                            <Card
                                title="USUARIO MODIFICADOR"
                                icon={UserIcon}
                                hasTitleDivider
                                className="rounded-xl"
                            >
                                <div className="grid grid-cols-6 gap-4">
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Usuario</span>
                                    <div className="col-span-5">
                                        <div className="text-sm font-medium">{record.modified?.user ?? "—"}</div>
                                        <div className="text-xs text-gray-500">{record.modified?.date ?? "—"}</div>
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HolidaysFields;
