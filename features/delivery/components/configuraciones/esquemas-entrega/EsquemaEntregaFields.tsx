"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, Cog6ToothIcon, UserIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { ActionButton } from "@/components/ui/button/action-button";

/* --------- Interfaz --------- */
export type VentanaConfig = {
    dayOfWeek?: string;
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
    maxEnvios: number;
    maxBultos: number;
    maxItems: number;
};

export type EsquemaEntregaRecord = {
    /* DETALLE */
    nombre: string;
    timezone: string;          // ej: "America/Santiago"
    dias: string[];            // Monday..Sunday
    start: string;             // "HH:mm"
    end: string;               // "HH:mm"
    maxEnviosBase: number;
    maxBultosBase: number;
    maxItemsBase: number;

    /* AJUSTES */
    estado: "Activo" | "Inactivo";

    /* VALORES POR DEFECTO */
    defaultsMaxEnvios: number;
    defaultsMaxItems: number;
    defaultsMaxBultos: number;
    costoExtraEntrega: number;

    /* VENTANAS (array plano) */
    ventanas: VentanaConfig[];

    /* Solo en Resumen (lectura) */
    createdByUsername?: string;
    createdByEmail?: string;
    createdAt?: string;
    modifiedByUsername?: string;
    modifiedByEmail?: string;
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

export function EsquemaEntregaFields({
    record,
    readOnly,
    onChange,
    isCreate,
}: {
    record: EsquemaEntregaRecord;
    readOnly?: boolean;
    onChange?: (field: keyof EsquemaEntregaRecord, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof EsquemaEntregaRecord) => (value: any) => onChange?.(field, value);

    const tzOptions = useMemo(
        () => ["America/Santiago", "America/Argentina/Buenos_Aires", "America/Montevideo"],
        []
    );

    // =========================
    // Helpers Ventanas (UI)
    // =========================
    const newEsquema = (): VentanaConfig => ({
        dayOfWeek: "Monday",
        start: "13:00",
        end: "17:00",
        maxEnvios: 100,
        maxBultos: 1000,
        maxItems: 100000,
    });

    // groupStarts: índice de inicio de cada ventana dentro de record.ventanas (array plano).
    const [groupStarts, setGroupStarts] = useState<number[]>([]);

    // Inicialización: por defecto, cada item existente es su propia ventana.
    useEffect(() => {
        if (!record.ventanas) return;
        setGroupStarts((prev) => {
            // Si ya hay estructura previa compatible con el largo actual, respétala.
            if (prev.length && prev[0] === 0 && prev[prev.length - 1] < record.ventanas.length) return prev;
            // Caso base: cada esquema es una ventana independiente.
            return record.ventanas.map((_, i) => i);
        });
    }, [record.ventanas?.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const recalcAfterInsert = (insertAt: number) => {
        setGroupStarts((gs) =>
            gs.map((s) => (s >= insertAt ? s + 1 : s))
        );
    };

    const recalcAfterRemove = (removeAt: number) => {
        setGroupStarts((gs) =>
            gs
                .filter((s) => s !== removeAt) // si justo borramos el start de una ventana con 1 esquema, eliminamos esa ventana
                .map((s) => (s > removeAt ? s - 1 : s))
                .sort((a, b) => a - b)
        );
        // Si no queda ningún start, pero hay elementos, marcamos 0
        setGroupStarts((gs) => (gs.length === 0 && record.ventanas.length - 1 > 0 ? [0] : gs));
    };

    // Crear NUEVA VENTANA (grupo): añade un esquema al final y registra su inicio como nueva ventana.
    const addVentana = useCallback(() => {
        const next = [...(record.ventanas || []), newEsquema()];
        onChange?.("ventanas", next);
        setGroupStarts((gs) => {
            const startIdx = (record.ventanas?.length ?? 0);
            return [...gs, startIdx].sort((a, b) => a - b);
        });
    }, [record.ventanas, onChange]);

    // Agregar ESQUEMA dentro de la misma ventana (debajo del último esquema del grupo actual).
    const addEsquemaInWindow = (groupIndex: number) => {
        const starts = groupStarts.slice().sort((a, b) => a - b);
        const start = starts[groupIndex];
        const end = starts[groupIndex + 1] ?? record.ventanas.length;
        const insertAt = end; // al final del grupo
        const next = [...record.ventanas];
        next.splice(insertAt, 0, newEsquema());
        onChange?.("ventanas", next);
        recalcAfterInsert(insertAt);
    };

    const updateWindow = (idx: number, patch: Partial<VentanaConfig>) => {
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
                                <CollapsibleField
                                    label=""
                                    value={record.timezone}
                                    options={tzOptions}
                                    onChange={(val) => handle("timezone")(val)}
                                    inline
                                />
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
                                                {selected && <span className="ml-2 opacity-60">×</span>}
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
                                    disabled={readOnly}
                                />
                            </div>

                            {/* Capacidades base */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Máx. envíos</span>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.maxEnviosBase}
                                    onChange={(e) => handle("maxEnviosBase")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Paquetes (máx.)</span>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.maxBultosBase}
                                    onChange={(e) => handle("maxBultosBase")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Máx. ítems</span>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-48 border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.maxItemsBase}
                                    onChange={(e) => handle("maxItemsBase")(Number(e.target.value))}
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
                                                {/* ícono/acciones de ventana podrían ir aquí más adelante */}
                                            </div>

                                            {/* Esquemas dentro de la ventana */}
                                            <div className="space-y-4">
                                                {indices.map((idx) => {
                                                    const win = record.ventanas[idx];
                                                    return (
                                                        <div key={idx} className="grid grid-cols-12 gap-x-4 gap-y-3 items-center">
                                                            <span className="col-span-2 text-sm font-bold text-gray-600">Día</span>
                                                            <div className="col-span-4">
                                                                <select
                                                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                    value={win.dayOfWeek ?? ""}
                                                                    onChange={(e) => updateWindow(idx, { dayOfWeek: e.target.value })}
                                                                    disabled={readOnly}
                                                                >
                                                                    {DAYS.map((day) => (
                                                                        <option key={day.key} value={day.key}>
                                                                            {day.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {/* FILA 1: Inicio / Término => 2 + 4 + 2 + 4 */}
                                                            <span className="col-span-2 text-sm font-bold text-gray-600">Inicio</span>
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="time"
                                                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                    value={win.start}
                                                                    onChange={(e) => updateWindow(idx, { start: e.target.value })}
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
                                                                    disabled={readOnly}
                                                                />
                                                            </div>

                                                            {/* FILA 2: tres campos en línea => (2+2) x 3 */}
                                                            <span className="col-span-2 text-sm font-bold text-gray-600">Máx. envíos</span>
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="number"
                                                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                    value={win.maxEnvios}
                                                                    onChange={(e) => updateWindow(idx, { maxEnvios: Number(e.target.value) })}
                                                                    disabled={readOnly}
                                                                />
                                                            </div>

                                                            <span className="col-span-2 text-sm font-bold text-gray-600">Paquetes (máx.)</span>
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="number"
                                                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                    value={win.maxBultos}
                                                                    onChange={(e) => updateWindow(idx, { maxBultos: Number(e.target.value) })}
                                                                    disabled={readOnly}
                                                                />
                                                            </div>

                                                            <span className="col-span-2 text-sm font-bold text-gray-600">Máx. ítems</span>
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="number"
                                                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                                                    value={win.maxItems}
                                                                    onChange={(e) => updateWindow(idx, { maxItems: Number(e.target.value) })}
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
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* FOOTER de la ventana: agregar esquema dentro de la misma ventana */}
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
                                <CollapsibleField
                                    label=""
                                    value={record.estado}
                                    options={["Activo", "Inactivo"]}
                                    onChange={(val) => handle("estado")(val)}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* VALORES POR DEFECTO DE VENTANAS */}
                    <Card title="VALORES POR DEFECTO DE VENTANAS" icon={Cog6ToothIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-3 text-sm text-gray-600 font-bold">Máx. envíos</span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.defaultsMaxEnvios}
                                    onChange={(e) => handle("defaultsMaxEnvios")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Máx. ítems</span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.defaultsMaxItems}
                                    onChange={(e) => handle("defaultsMaxItems")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Paquetes (máx.)</span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.defaultsMaxBultos}
                                    onChange={(e) => handle("defaultsMaxBultos")(Number(e.target.value))}
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">Costo extra de entrega</span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                    value={record.costoExtraEntrega}
                                    onChange={(e) => handle("costoExtraEntrega")(Number(e.target.value))}
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
                                    {record.createdByUsername || "—"} {record.createdByEmail ? `(${record.createdByEmail})` : ""}
                                </div>
                                <span className="col-span-2 text-sm text-gray-600 font-bold">Fecha creación</span>
                                <div className="col-span-4 text-sm text-gray-800">{record.createdAt || "—"}</div>

                                <span className="col-span-2 text-sm text-gray-600 font-bold">Últ. modificación</span>
                                <div className="col-span-4 text-sm text-gray-800">
                                    {record.modifiedByUsername || "—"} {record.modifiedByEmail ? `(${record.modifiedByEmail})` : ""}
                                </div>
                                <span className="col-span-2 text-sm text-gray-600 font-bold">Fecha modificación</span>
                                <div className="col-span-4 text-sm text-gray-800">{record.modifiedAt || "—"}</div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
