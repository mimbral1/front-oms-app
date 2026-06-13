// views\PickingView\olas\EsquemaHorario\components\EsquemaHorarioFields.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, Cog6ToothIcon, UserIcon } from "@heroicons/react/24/outline";
import { ActiveStatusToggle } from "@/components/ui/togle";
import { ActionButton } from "@/components/ui/button/action-button";
import { Avatar } from "@/components/ui/user-avatar";

/* --------- Interfaz --------- */
export type VentanaHorario = {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
    maxPedidos: number;
    maxItems: number;
    corteMinutos: number;
};

export type EsquemaHorarioRecord = {
    /* DETALLE */
    nombre: string;
    timezone: string;      // ej: "America/Santiago"
    dias: string[];        // Monday..Sunday
    start: string;         // "HH:mm"
    end: string;           // "HH:mm"

    // Capacidades base - reemplazo del bloque de la foto
    maxPedidosBase: number;    // Pedidos (máx.)
    maxItemsBase: number;      // Ítems (máx.)
    corteMinutosBase: number;  // Corte (minutos)

    /* AJUSTES */
    estado: "Activo" | "Inactivo";

    /* VALORES POR DEFECTO para ventanas */
    defaultsMaxPedidos: number;
    defaultsMaxItems: number;
    defaultsCorteMinutos: number;

    /* VENTANAS (array plano) */
    ventanas: VentanaHorario[];

    /* Solo en Resumen (lectura) */
    createdByUsername?: string;
    createdByEmail?: string;
    createdByAvatar?: string;
    createdAt?: string;
    modifiedByUsername?: string;
    modifiedByEmail?: string;
    modifiedByAvatar?: string;
    modifiedAt?: string;
};

const DAYS = [
    { key: "Monday", label: "Lunes" },
    { key: "Tuesday", label: "Martes" },
    { key: "Wednesday", label: "Miércoles" },
    { key: "Thursday", label: "Jueves" },
    { key: "Friday", label: "Viernes" },
    { key: "Saturday", label: "Sábado" },
    { key: "Sunday", label: "Domingo" },
];

const DEFAULT_TIMEZONE = "America/Santiago";

const toMinutes = (time: string) => {
    const [h, m] = String(time || "").split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
};

const formatDuration = (minutes: number | null) => {
    if (minutes === null || minutes <= 0) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
};

const toNonNegativeNumber = (value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
    return Math.max(0, n);
};

const clampByDefault = (value: unknown, limit: unknown) => {
    const max = toNonNegativeNumber(limit);
    return Math.min(toNonNegativeNumber(value), max);
};

export function EsquemaHorarioFields({
    record,
    readOnly,
    onChange,
    isCreate,
}: {
    record: EsquemaHorarioRecord;
    readOnly?: boolean;
    onChange?: (field: keyof EsquemaHorarioRecord, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof EsquemaHorarioRecord) => (value: any) => onChange?.(field, value);
    const [draftNumbers, setDraftNumbers] = useState<Record<string, string>>({});

    const getDraftValue = (key: string, currentValue: number) => {
        return Object.prototype.hasOwnProperty.call(draftNumbers, key)
            ? draftNumbers[key]
            : String(toNonNegativeNumber(currentValue));
    };

    const onDraftChange = (key: string, raw: string) => {
        if (!/^\d*$/.test(raw)) return;
        setDraftNumbers((prev) => ({ ...prev, [key]: raw }));
    };

    const clearDraft = (key: string) => {
        setDraftNumbers((prev) => {
            if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const commitDraft = (
        key: string,
        maxLimit: number,
        apply: (n: number) => void,
        fallbackCurrent: number
    ) => {
        const raw = Object.prototype.hasOwnProperty.call(draftNumbers, key)
            ? draftNumbers[key]
            : String(toNonNegativeNumber(fallbackCurrent));

        const normalized = raw === "" ? 0 : toNonNegativeNumber(raw);
        const clamped = clampByDefault(normalized, maxLimit);
        apply(clamped);
        clearDraft(key);
    };

    useEffect(() => {
        if (!record.timezone) {
            handle("timezone")(DEFAULT_TIMEZONE);
        }
    }, [record.timezone]);  

    useEffect(() => {
        const maxPedidosDefault = toNonNegativeNumber(record.defaultsMaxPedidos);
        const maxItemsDefault = toNonNegativeNumber(record.defaultsMaxItems);
        const maxCorteDefault = toNonNegativeNumber(record.defaultsCorteMinutos);

        const nextBasePedidos = clampByDefault(record.maxPedidosBase, maxPedidosDefault);
        const nextBaseItems = clampByDefault(record.maxItemsBase, maxItemsDefault);
        const nextBaseCorte = clampByDefault(record.corteMinutosBase, maxCorteDefault);

        if (nextBasePedidos !== record.maxPedidosBase) handle("maxPedidosBase")(nextBasePedidos);
        if (nextBaseItems !== record.maxItemsBase) handle("maxItemsBase")(nextBaseItems);
        if (nextBaseCorte !== record.corteMinutosBase) handle("corteMinutosBase")(nextBaseCorte);

        let windowsChanged = false;
        const nextWindows = (record.ventanas || []).map((w) => {
            const maxPedidos = clampByDefault(w.maxPedidos, maxPedidosDefault);
            const maxItems = clampByDefault(w.maxItems, maxItemsDefault);
            const corteMinutos = clampByDefault(w.corteMinutos, maxCorteDefault);

            if (
                maxPedidos !== w.maxPedidos ||
                maxItems !== w.maxItems ||
                corteMinutos !== w.corteMinutos
            ) {
                windowsChanged = true;
                return { ...w, maxPedidos, maxItems, corteMinutos };
            }

            return w;
        });

        if (windowsChanged) {
            onChange?.("ventanas", nextWindows);
        }
    }, [
        record.defaultsMaxPedidos,
        record.defaultsMaxItems,
        record.defaultsCorteMinutos,
        record.maxPedidosBase,
        record.maxItemsBase,
        record.corteMinutosBase,
        record.ventanas,
    ]);  

    const baseStartMin = toMinutes(record.start);
    const baseEndMin = toMinutes(record.end);
    const baseInvalidRange =
        baseStartMin !== null && baseEndMin !== null && baseEndMin <= baseStartMin;
    const baseDuration =
        baseStartMin !== null && baseEndMin !== null ? formatDuration(baseEndMin - baseStartMin) : "-";

    // =========================
    // Helpers Ventanas (UI)
    // =========================
    const newVentana = (): VentanaHorario => ({
        start: "13:00",
        end: "17:00",
        maxPedidos: record.defaultsMaxPedidos ?? 100,
        maxItems: record.defaultsMaxItems ?? 100000,
        corteMinutos: record.defaultsCorteMinutos ?? 30,
    });

    // groupStarts: índice de inicio de cada ventana dentro de record.ventanas (array plano).
    const [groupStarts, setGroupStarts] = useState<number[]>([]);

    // Inicialización: por defecto, cada item existente es su propia ventana.
    useEffect(() => {
        if (!record.ventanas) return;
        setGroupStarts((prev) => {
            if (prev.length && prev[0] === 0 && prev[prev.length - 1] < record.ventanas.length) return prev;
            return record.ventanas.map((_, i) => i);
        });
    }, [record.ventanas?.length]);  

    const recalcAfterInsert = (insertAt: number) => {
        setGroupStarts((gs) => gs.map((s) => (s >= insertAt ? s + 1 : s)));
    };

    const recalcAfterRemove = (removeAt: number) => {
        setGroupStarts((gs) =>
            gs
                .filter((s) => s !== removeAt)
                .map((s) => (s > removeAt ? s - 1 : s))
                .sort((a, b) => a - b)
        );
        setGroupStarts((gs) => (gs.length === 0 && record.ventanas.length - 1 > 0 ? [0] : gs));
    };

    // Crear NUEVA VENTANA (grupo)
    const addVentana = useCallback(() => {
        const next = [...(record.ventanas || []), newVentana()];
        onChange?.("ventanas", next);
        setGroupStarts((gs) => {
            const startIdx = (record.ventanas?.length ?? 0);
            return [...gs, startIdx].sort((a, b) => a - b);
        });
    }, [record.ventanas, onChange]);

    // Agregar ESQUEMA dentro de la misma ventana
    const addEsquemaInWindow = (groupIndex: number) => {
        const starts = groupStarts.slice().sort((a, b) => a - b);
        const start = starts[groupIndex];
        const end = starts[groupIndex + 1] ?? record.ventanas.length;
        const insertAt = end;
        const next = [...record.ventanas];
        next.splice(insertAt, 0, newVentana());
        onChange?.("ventanas", next);
        recalcAfterInsert(insertAt);
    };

    const updateWindow = (idx: number, patch: Partial<VentanaHorario>) => {
        const next = [...record.ventanas];
        next[idx] = { ...next[idx], ...patch };
        onChange?.("ventanas", next);
    };

    const removeVentanaEsquema = (idx: number) => {
        const next = record.ventanas.filter((_, i) => i !== idx);
        onChange?.("ventanas", next);
        recalcAfterRemove(idx);
    };

    // =========================

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* IZQUIERDA */}
                <div className="lg:col-span-8 space-y-6">
                    {/* DETALLE */}
                    <Card title="DETALLE" icon={ClipboardDocumentListIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>

                            {/* Zona horaria */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Zona horaria</span>
                            <div className="col-span-5">
                                <div className="flex items-center justify-between border-b border-gray-300 py-1">
                                    <span className="text-sm text-gray-800">{record.timezone || DEFAULT_TIMEZONE}</span>
                                    <span className="text-xs text-gray-500">Fija</span>
                                </div>
                            </div>

                            {/* Días */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Días</span>
                            <div className="col-span-5">
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(({ key, label }) => {
                                        const selected = record.dias.includes(key);
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${selected ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-gray-50 text-gray-600 ring-gray-200"
                                                    }`}
                                                onClick={() => {
                                                    if (readOnly) return;
                                                    const set = new Set<string>(record.dias);
                                                    selected ? set.delete(key) : set.add(key);
                                                    handle("dias")(Array.from(set));
                                                }}
                                            >
                                                {label}
                                                {selected && <span className="ml-2 opacity-60">x</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Horarios */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Hora inicio</span>
                            <div className="col-span-2">
                                <input
                                    type="time"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.start}
                                    onChange={(e) => handle("start")(e.target.value)}
                                    step={900}
                                    disabled={readOnly}
                                />
                            </div>
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Hora término</span>
                            <div className="col-span-2">
                                <input
                                    type="time"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.end}
                                    onChange={(e) => handle("end")(e.target.value)}
                                    step={900}
                                    disabled={readOnly}
                                />
                            </div>
                            <div className="col-span-6 flex items-center gap-3 text-xs">
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                                    Duración: {baseDuration}
                                </span>
                                {baseInvalidRange && (
                                    <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                                        La hora término debe ser mayor a la hora inicio
                                    </span>
                                )}
                            </div>

                            {/* --- BLOQUE (como la foto): Pedidos (máx.), Ítems (máx.) y Corte (minutos) --- */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Pedidos (máx.)</span>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={getDraftValue("maxPedidosBase", record.maxPedidosBase)}
                                    max={toNonNegativeNumber(record.defaultsMaxPedidos)}
                                    min={0}
                                    onChange={(e) => onDraftChange("maxPedidosBase", e.target.value)}
                                    onBlur={() =>
                                        commitDraft(
                                            "maxPedidosBase",
                                            toNonNegativeNumber(record.defaultsMaxPedidos),
                                            handle("maxPedidosBase"),
                                            record.maxPedidosBase
                                        )
                                    }
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ítems (máx.)</span>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={getDraftValue("maxItemsBase", record.maxItemsBase)}
                                    max={toNonNegativeNumber(record.defaultsMaxItems)}
                                    min={0}
                                    onChange={(e) => onDraftChange("maxItemsBase", e.target.value)}
                                    onBlur={() =>
                                        commitDraft(
                                            "maxItemsBase",
                                            toNonNegativeNumber(record.defaultsMaxItems),
                                            handle("maxItemsBase"),
                                            record.maxItemsBase
                                        )
                                    }
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Corte (minutos)</span>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-48 border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={getDraftValue("corteMinutosBase", record.corteMinutosBase)}
                                    max={toNonNegativeNumber(record.defaultsCorteMinutos)}
                                    min={0}
                                    onChange={(e) => onDraftChange("corteMinutosBase", e.target.value)}
                                    onBlur={() =>
                                        commitDraft(
                                            "corteMinutosBase",
                                            toNonNegativeNumber(record.defaultsCorteMinutos),
                                            handle("corteMinutosBase"),
                                            record.corteMinutosBase
                                        )
                                    }
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* CONFIGURACIÓN DE VENTANAS */}
                    <Card title="CONFIGURACIÓN DE VENTANAS" icon={ClipboardDocumentListIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="mb-3">
                            {!readOnly && (
                                <ActionButton
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={addVentana}
                                >
                                    Nueva ventana
                                </ActionButton>
                            )}
                        </div>

                        <div className="space-y-5">
                            {groupStarts
                                .slice()
                                .sort((a, b) => a - b)
                                .map((start, gi) => {
                                    const end = groupStarts[gi + 1] ?? record.ventanas.length;
                                    const indices = Array.from({ length: end - start }, (_, k) => start + k);

                                    return (
                                        <div key={`group-${gi}-${start}`} className="rounded-lg border border-gray-200 p-4">
                                            {/* Título de ventana */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm font-semibold text-gray-700">Ventana {gi + 1}</div>
                                            </div>

                                            {/* Esquemas dentro de la ventana */}
                                            <div className="space-y-4">
                                                {indices.map((idx) => {
                                                    const win = record.ventanas[idx];
                                                    return (
                                                        <div key={idx} className="grid grid-cols-12 gap-x-4 gap-y-3 items-center">
                                                            {(() => {
                                                                const startMin = toMinutes(win.start);
                                                                const endMin = toMinutes(win.end);
                                                                const invalidRange =
                                                                    startMin !== null && endMin !== null && endMin <= startMin;
                                                                const duration =
                                                                    startMin !== null && endMin !== null
                                                                        ? formatDuration(endMin - startMin)
                                                                        : "-";

                                                                return (
                                                                    <>
                                                                        {/* FILA 1: Inicio / Término */}
                                                                        <span className="col-span-2 text-sm font-bold text-gray-600">Inicio</span>
                                                                        <div className="col-span-4">
                                                                            <input
                                                                                type="time"
                                                                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                                value={win.start}
                                                                                onChange={(e) => updateWindow(idx, { start: e.target.value })}
                                                                                step={900}
                                                                                disabled={readOnly}
                                                                            />
                                                                        </div>

                                                                        <span className="col-span-2 text-sm font-bold text-gray-600">Término</span>
                                                                        <div className="col-span-4">
                                                                            <input
                                                                                type="time"
                                                                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                                value={win.end}
                                                                                onChange={(e) => updateWindow(idx, { end: e.target.value })}
                                                                                step={900}
                                                                                disabled={readOnly}
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-12 flex items-center gap-3 text-xs">
                                                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                                                                                Duración: {duration}
                                                                            </span>
                                                                            {invalidRange && (
                                                                                <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                                                                                    La hora término debe ser mayor a la hora inicio
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* FILA 2: tres campos en línea */}
                                                                        <span className="col-span-2 text-sm font-bold text-gray-600">Pedidos (máx.)</span>
                                                                        <div className="col-span-4">
                                                                            <input
                                                                                type="number"
                                                                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                                value={getDraftValue(`win-${idx}-maxPedidos`, win.maxPedidos)}
                                                                                max={toNonNegativeNumber(record.defaultsMaxPedidos)}
                                                                                min={0}
                                                                                onChange={(e) => onDraftChange(`win-${idx}-maxPedidos`, e.target.value)}
                                                                                onBlur={() =>
                                                                                    commitDraft(
                                                                                        `win-${idx}-maxPedidos`,
                                                                                        toNonNegativeNumber(record.defaultsMaxPedidos),
                                                                                        (n) => updateWindow(idx, { maxPedidos: n }),
                                                                                        win.maxPedidos
                                                                                    )
                                                                                }
                                                                                disabled={readOnly}
                                                                            />
                                                                        </div>

                                                                        <span className="col-span-2 text-sm font-bold text-gray-600">Ítems (máx.)</span>
                                                                        <div className="col-span-4">
                                                                            <input
                                                                                type="number"
                                                                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                                value={getDraftValue(`win-${idx}-maxItems`, win.maxItems)}
                                                                                max={toNonNegativeNumber(record.defaultsMaxItems)}
                                                                                min={0}
                                                                                onChange={(e) => onDraftChange(`win-${idx}-maxItems`, e.target.value)}
                                                                                onBlur={() =>
                                                                                    commitDraft(
                                                                                        `win-${idx}-maxItems`,
                                                                                        toNonNegativeNumber(record.defaultsMaxItems),
                                                                                        (n) => updateWindow(idx, { maxItems: n }),
                                                                                        win.maxItems
                                                                                    )
                                                                                }
                                                                                disabled={readOnly}
                                                                            />
                                                                        </div>

                                                                        <span className="col-span-2 text-sm font-bold text-gray-600">Corte (minutos)</span>
                                                                        <div className="col-span-4">
                                                                            <input
                                                                                type="number"
                                                                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                                value={getDraftValue(`win-${idx}-corteMinutos`, win.corteMinutos)}
                                                                                max={toNonNegativeNumber(record.defaultsCorteMinutos)}
                                                                                min={0}
                                                                                onChange={(e) => onDraftChange(`win-${idx}-corteMinutos`, e.target.value)}
                                                                                onBlur={() =>
                                                                                    commitDraft(
                                                                                        `win-${idx}-corteMinutos`,
                                                                                        toNonNegativeNumber(record.defaultsCorteMinutos),
                                                                                        (n) => updateWindow(idx, { corteMinutos: n }),
                                                                                        win.corteMinutos
                                                                                    )
                                                                                }
                                                                                disabled={readOnly}
                                                                            />
                                                                        </div>

                                                                        {/* ACCIONES por esquema */}
                                                                        {!readOnly && (
                                                                            <div className="col-span-12 flex items-center justify-end pt-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeVentanaEsquema(idx)}
                                                                                    className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                                                                                >
                                                                                    Eliminar esquema
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* FOOTER de la ventana */}
                                            {!readOnly && (
                                                <div className="mt-3 flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => addEsquemaInWindow(gi)}
                                                        className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-blue-200 text-blue-700 hover:bg-blue-50"
                                                    >
                                                        + Agregar esquema
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                            {record.ventanas.length === 0 && (
                                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                                    Sin ventanas configuradas.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* AJUSTES */}
                    <Card title="AJUSTES" icon={Cog6ToothIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-4">
                                <ActiveStatusToggle
                                    active={record.estado === "Activo"}
                                    disabled={!!readOnly}
                                    showStateLabel={false}
                                    onActiveChange={(active) =>
                                        handle("estado")(active ? "Activo" : "Inactivo")
                                    }
                                />
                            </div>
                        </div>
                    </Card>

                    {/* VALORES POR DEFECTO DE VENTANAS */}
                    <Card title="VALORES POR DEFECTO DE VENTANAS" icon={Cog6ToothIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Pedidos (máx.)</span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.defaultsMaxPedidos}
                                    onChange={(e) => handle("defaultsMaxPedidos")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Ítems (máx.)</span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.defaultsMaxItems}
                                    onChange={(e) => handle("defaultsMaxItems")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Corte (minutos)</span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.defaultsCorteMinutos}
                                    onChange={(e) => handle("defaultsCorteMinutos")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* USUARIOS (solo en Resumen) */}
                    {!isCreate && (
                        <Card title="USUARIO CREADOR / MODIFICADOR" icon={UserIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-2 text-sm text-gray-600 font-bold">Creador</span>
                                <div className="col-span-4 text-sm text-gray-800">
                                    {record.createdByUsername && record.createdByUsername !== "-" ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={record.createdByUsername}
                                                src={record.createdByAvatar}
                                                alt={record.createdByUsername}
                                                className="h-8 w-8"
                                            />
                                            <div className="leading-tight">
                                                <div className="text-sm font-medium">{record.createdByUsername}</div>
                                                {record.createdByEmail && (
                                                    <div className="text-xs text-gray-500">{record.createdByEmail}</div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                                <span className="col-span-2 text-sm text-gray-600 font-bold">Fecha creación</span>
                                <div className="col-span-4 text-sm text-gray-800">{record.createdAt || "-"}</div>

                                <span className="col-span-2 text-sm text-gray-600 font-bold">Últ. modificación</span>
                                <div className="col-span-4 text-sm text-gray-800">
                                    {record.modifiedByUsername && record.modifiedByUsername !== "-" ? (
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={record.modifiedByUsername}
                                                src={record.modifiedByAvatar}
                                                alt={record.modifiedByUsername}
                                                className="h-8 w-8"
                                            />
                                            <div className="leading-tight">
                                                <div className="text-sm font-medium">{record.modifiedByUsername}</div>
                                                {record.modifiedByEmail && (
                                                    <div className="text-xs text-gray-500">{record.modifiedByEmail}</div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                                <span className="col-span-2 text-sm text-gray-600 font-bold">Fecha modificación</span>
                                <div className="col-span-4 text-sm text-gray-800">{record.modifiedAt || "-"}</div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
