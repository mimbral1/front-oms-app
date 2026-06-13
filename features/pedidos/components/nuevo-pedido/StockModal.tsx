"use client";

import React, { useCallback, useEffect, useState } from "react";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { WAREHOUSE_STOCK_API } from "@/lib/http/endpoints";

type StockApiRow = {
    warehouseReferenceId?: string;
    warehouseName?: string;
    availableStock?: number;
    inOrder?: number;
};

type StockRow = {
    id_almacen: number;
    nombre: string;
    disponible: number;
    orden_compra: number;
};

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
}

function getWarehouseId(name: string) {
    return Math.abs(
        Array.from(name).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0),
    );
}

export default function StockModal({
    sku,
    open,
    onClose,
}: {
    sku: string;
    open: boolean;
    onClose: () => void;
}) {
    const [rows, setRows] = useState<StockRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const fetchStock = useCallback(async () => {
        if (!open || !sku) return;

        setLoading(true);
        setErr(null);

        try {
            const url = new URL(WAREHOUSE_STOCK_API);
            url.searchParams.set("filters[sku]", sku);

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: withAuthPlatformHeaders({
                    "x-janis-page": "1",
                    "x-janis-page-size": "20",
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al consultar stock`);
            }

            const payload = await response.json();
            const data = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                    ? payload.data
                    : [];

            const allowedWarehouseReferenceIds = new Set(["07", "01"]);
            const parsed: StockRow[] = data
                .filter((row: StockApiRow) => {
                    const referenceId = String(row?.warehouseReferenceId ?? "").trim().padStart(2, "0");
                    return allowedWarehouseReferenceIds.has(referenceId);
                })
                .map((row: StockApiRow) => {
                    const warehouseName = String(row?.warehouseName ?? "").trim() || "-";

                    return {
                        id_almacen: getWarehouseId(warehouseName),
                        nombre: warehouseName,
                        disponible: Number(row?.availableStock ?? 0),
                        orden_compra: Number(row?.inOrder ?? 0),
                    };
                })
                .sort((a: StockRow, b: StockRow) => a.nombre.localeCompare(b.nombre, "es"));

            setRows(parsed);
        } catch (error: unknown) {
            setRows([]);
            setErr(getErrorMessage(error, "No se pudo obtener el stock."));
        } finally {
            setLoading(false);
        }
    }, [open, sku]);

    useEffect(() => {
        void fetchStock();
    }, [fetchStock]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Stock por almacen</h2>
                    <button
                        onClick={onClose}
                        className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="mb-3 text-sm text-gray-500">
                    SKU: <span className="font-mono">{sku}</span>
                </div>

                {loading && (
                    <div className="py-8 text-center text-sm text-gray-500">Cargando...</div>
                )}

                {err && !loading && (
                    <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {err}
                    </div>
                )}

                {!loading && !err && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Almacen
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Disponible
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Orden de compra
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {rows.map((row, index) => (
                                    <tr key={`${row.id_almacen}-${sku}-${index}`}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{row.nombre}</td>
                                        <td className="px-4 py-2 text-right text-sm tabular-nums">{row.disponible}</td>
                                        <td className="px-4 py-2 text-right text-sm tabular-nums">{row.orden_compra}</td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td
                                            className="px-4 py-6 text-center text-sm text-gray-500"
                                            colSpan={3}
                                        >
                                            Sin stock para este SKU en los almacenes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
