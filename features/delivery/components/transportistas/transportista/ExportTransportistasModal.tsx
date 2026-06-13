"use client";

import { useEffect, useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { exportToCsv } from "@/components/presets/export/export";
import { ActionButton } from "@/components/ui/button/action-button";

/**
 * Modal de Exportación (mocks) – Calcado a la referencia
 * - Campos: Entidad (select), Formato (select), Tipo (select), Timezone (switch)
 * - Botones: Cancelar / Aplicar
 * - Mantiene layout col-span-1 / col-span-5
 * - Acción "Aplicar" mocked: si es CSV exporta CSV; para XLSX/PDF simula acción y descarga CSV con la extensión seleccionada.
 */

type Row = Record<string, any>;

interface ExportTransportistasModalProps {
    open: boolean;
    onClose: () => void;
    rows: Row[];              // dataset filtrado actual
    allRows?: Row[];          // dataset completo
    defaultFileName?: string; // sugerencia de nombre
}

const ENTIDADES_MOCK = [
    { label: "Carrier window", value: "carrier-window" },
    // Puedes agregar más si lo necesitas
];

const FORMATOS_MOCK = [
    { label: "Xlsx", value: "xlsx" },
    { label: "Csv", value: "csv" },
    { label: "Pdf", value: "pdf" },
];

const TIPOS_MOCK = [
    { label: "Completo", value: "full" },
    { label: "Compacto", value: "compact" },
    { label: "Resumen", value: "summary" },
];

export default function ExportTransportistasModal({
    open,
    onClose,
    rows,
    allRows,
    defaultFileName = "transportistas",
}: ExportTransportistasModalProps) {
    // Estado de campos (mocks)
    const [entidad, setEntidad] = useState(ENTIDADES_MOCK[0]?.value ?? "");
    const [formato, setFormato] = useState(FORMATOS_MOCK[0]?.value ?? "xlsx");
    const [tipo, setTipo] = useState(TIPOS_MOCK[0]?.value ?? "");
    const [useLocalTz, setUseLocalTz] = useState(true);

    // Derivar timezone local "GMT-3" etc.
    const tzLabel = useMemo(() => {
        const offsetMin = new Date().getTimezoneOffset(); // minutos respecto a UTC (positivo=occidente)
        const sign = offsetMin === 0 ? "" : offsetMin > 0 ? "-" : "+";
        const absMin = Math.abs(offsetMin);
        const hours = Math.floor(absMin / 60);
        const gmt = `${sign}${hours}`;
        return `GMT${gmt === "" ? "" : gmt}`;
    }, []);

    // Conjunto de datos a exportar (mock: todos los visibles/filtrados)
    const data = rows?.length ? rows : allRows ?? [];

    // Normalizador simple a CSV array
    function toCsvArray(list: Row[]) {
        if (!list?.length) return [[]];
        const cols = Object.keys(list[0] ?? {});
        const out: (string | number | boolean)[][] = [cols];
        for (const r of list) {
            out.push(
                cols.map((c) => {
                    const v = (r as any)[c];
                    if (Array.isArray(v)) return v.join(" / ");
                    if (v && typeof v === "object") return JSON.stringify(v);
                    return v ?? "";
                })
            );
        }
        return out;
    }

    function handleApply() {
        // MOCK: simulamos exportación según formato
        const baseName = defaultFileName || "export";
        const csvArray = toCsvArray(data);

        if (formato === "csv") {
            exportToCsv(`${baseName}.csv`, csvArray);
        } else if (formato === "xlsx") {
            // Mock: exportamos CSV pero con extensión .xlsx para simular
            exportToCsv(`${baseName}.xlsx`, csvArray);
        } else if (formato === "pdf") {
            // Mock: exportamos CSV con extensión .pdf (solo demo visual)
            exportToCsv(`${baseName}.pdf`, csvArray);
        }

        // Aquí podrías usar fetch-with-auth a un endpoint real de export
        // y pasar entidad, tipo y tz si es necesario.
        onClose();
    }

    // Reset básico al abrir
    useEffect(() => {
        if (open) {
            setEntidad(ENTIDADES_MOCK[0]?.value ?? "");
            setFormato(FORMATOS_MOCK[0]?.value ?? "xlsx");
            setTipo(TIPOS_MOCK[0]?.value ?? "");
            setUseLocalTz(true);
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

            {/* Modal */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">Exportar</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded p-1 hover:bg-gray-100"
                            aria-label="Cerrar"
                            title="Cerrar"
                        >
                            <XMarkIcon className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6">
                        <div className="grid grid-cols-6 gap-4">
                            {/* Entidad */}
                            <label className="col-span-1 text-sm font-medium text-gray-700">Entidad</label>
                            <div className="col-span-5">
                                <select
                                    className="w-full rounded border px-2 py-2 text-sm"
                                    value={entidad}
                                    onChange={(e) => setEntidad(e.target.value)}
                                >
                                    {ENTIDADES_MOCK.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Formato */}
                            <label className="col-span-1 text-sm font-medium text-gray-700">Formato</label>
                            <div className="col-span-5 flex items-center gap-2">
                                <select
                                    className="w-full rounded border px-2 py-2 text-sm"
                                    value={formato}
                                    onChange={(e) => setFormato(e.target.value)}
                                >
                                    {FORMATOS_MOCK.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {/* Ícono “x” de la referencia (decorativo / mock) */}
                                <button
                                    type="button"
                                    className="rounded p-2 hover:bg-gray-100"
                                    title="Limpiar formato"
                                    onClick={() => setFormato(FORMATOS_MOCK[0].value)}
                                >
                                    <span className="inline-block h-4 w-4 leading-4 text-gray-500">×</span>
                                </button>
                            </div>

                            {/* Tipo */}
                            <label className="col-span-1 text-sm font-medium text-gray-700">Tipo</label>
                            <div className="col-span-5">
                                <select
                                    className="w-full rounded border px-2 py-2 text-sm"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                >
                                    {TIPOS_MOCK.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Timezone */}
                            <label className="col-span-1 text-sm font-medium text-gray-700">Timezone</label>
                            <div className="col-span-5 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setUseLocalTz((v) => !v)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${useLocalTz ? "bg-blue-600" : "bg-gray-300"
                                        }`}
                                    aria-pressed={useLocalTz}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${useLocalTz ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                                <span className="text-sm text-gray-700">
                                    Usar mi zona horaria: <span className="font-medium">{tzLabel || "GMT-3"}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                        <ActionButton
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </ActionButton>
                        <ActionButton
                            type="button"
                            variant="primary"
                            onClick={handleApply}
                        >
                            Aplicar
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
