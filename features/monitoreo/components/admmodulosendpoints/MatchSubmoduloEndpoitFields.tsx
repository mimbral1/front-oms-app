// views\MonitoreoView\AdmModulosEndpoints\components\MatchSubmoduloEndpoitFields.tsx
"use client";

import React, { useEffect } from "react";
import Card from "@/components/ui/card/Card";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

export type EndpointRow = {
    metodoHttp: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    target: string;
    activo: boolean;
};

export type MatchForm = {
    subModuloId: string;
    endpoints: EndpointRow[];
};

export default function MatchSubmoduloEndpoitFields({
    matchForm,
    onMatchChange,
    isCreate,
    // selector de submódulos
    submodOptions = [],
    submodSearch = "",
    onSubmodSearch,
    loadingSubmods = false,
}: {
    matchForm: MatchForm;
    onMatchChange: (f: MatchForm) => void;
    isCreate?: boolean;

    submodOptions?: { label: string; value: string }[];
    submodSearch?: string;
    onSubmodSearch?: (q: string) => void;
    loadingSubmods?: boolean;
}) {
    const addRow = () =>
        onMatchChange({
            ...matchForm,
            endpoints: [
                ...matchForm.endpoints,
                { metodoHttp: "GET", path: "", target: "", activo: true },
            ],
        });

    const updateRow = (idx: number, patch: Partial<EndpointRow>) => {
        const next = matchForm.endpoints.map((r, i) => (i === idx ? { ...r, ...patch } : r));
        onMatchChange({ ...matchForm, endpoints: next });
    };

    const removeRow = (idx: number) => {
        const next = matchForm.endpoints.filter((_, i) => i !== idx);
        onMatchChange({ ...matchForm, endpoints: next.length ? next : [{ metodoHttp: "GET", path: "", target: "", activo: true }] });
    };

    // siempre al menos 1 fila
    useEffect(() => {
        if (!Array.isArray(matchForm.endpoints) || matchForm.endpoints.length === 0) {
            onMatchChange({ ...matchForm, endpoints: [{ metodoHttp: "GET", path: "", target: "", activo: true }] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Card title="3) MATCH: SUBMÓDULO ↔ ENDPOINT(S) + PERMISOS (INLINE)" noDefaultStyles hasTitleDivider className="rounded-xl p-6">
            <div className="grid grid-cols-6 gap-4">
                {/* Submódulo (selector) */}
                <span className="col-span-1 text-sm text-gray-600 font-bold">Submódulo</span>
                <div className="col-span-5">
                    <SelectSearchInline
                        id="submodulo"
                        label="Submódulo"
                        value={matchForm.subModuloId || ""}
                        options={submodOptions || []}
                        searchQuery={submodSearch || ""}
                        loading={loadingSubmods}
                        onSearch={(q) => onSubmodSearch?.(q)}
                        onChange={(value) => onMatchChange({ ...matchForm, subModuloId: value })}
                        placeholderFromDefault
                    />
                </div>

                {/* Tabla inline de endpoints */}
                <div className="col-span-6 mt-4">
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full table-fixed">
                            {/* prettier-ignore */}
                            <colgroup><col className="w-32" /><col className="w-[38%]" /><col className="w-[38%]" /><col className="w-24" /><col className="w-28" /></colgroup>

                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs text-gray-500">
                                    <th className="px-3 py-2">Método</th>
                                    <th className="px-3 py-2">Path</th>
                                    <th className="px-3 py-2">Target</th>
                                    <th className="px-3 py-2">Activo</th>
                                    <th className="px-3 py-2 text-right">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="text-sm text-gray-700">
                                {matchForm.endpoints.map((row, idx) => (
                                    <tr key={idx} className="border-t">
                                        {/* Método */}
                                        <td className="px-3 py-2 align-middle">
                                            <select
                                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                                                value={row.metodoHttp}
                                                onChange={(e) =>
                                                    updateRow(idx, { metodoHttp: e.target.value as EndpointRow["metodoHttp"] })
                                                }
                                            >
                                                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Path */}
                                        <td className="px-3 py-2 align-middle">
                                            <input
                                                className="w-full border-b border-gray-300 text-sm outline-none"
                                                value={row.path}
                                                onChange={(e) => updateRow(idx, { path: e.target.value })}
                                                placeholder="/api/v1/..."
                                            />
                                        </td>

                                        {/* Target */}
                                        <td className="px-3 py-2 align-middle">
                                            <input
                                                className="w-full border-b border-gray-300 text-sm outline-none"
                                                value={row.target}
                                                onChange={(e) => updateRow(idx, { target: e.target.value })}
                                                placeholder="http://service:3000/..."
                                            />
                                        </td>

                                        {/* Activo */}
                                        <td className="px-3 py-2 align-middle">
                                            <label className="inline-flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={!!row.activo}
                                                    onChange={(e) => updateRow(idx, { activo: e.target.checked })}
                                                />
                                                <span className="text-xs text-gray-600">Activo</span>
                                            </label>
                                        </td>

                                        {/* Acciones (siempre visible) */}
                                        <td className="px-3 py-2 align-middle text-right">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs bg-white hover:bg-gray-50"
                                                onClick={() => removeRow(idx)}
                                                title="Eliminar fila"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="p-3">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-white hover:bg-gray-50"
                                onClick={addRow}
                            >
                                <span className="text-lg leading-none">ï¼‹</span>
                                Nueva fila
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </Card>
    );
}
