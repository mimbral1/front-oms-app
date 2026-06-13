"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Box, ShoppingCart, Triangle } from "lucide-react";
import { MetricPill } from "@/components/ui/metric-pill";
import { warehouseGet } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";

import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
type SlotRow = {
    esquema: string;
    tipoEsquema: string;
    slot: string;
    skus: number | null;
    items: number | null;
    bultos: number | null;
    pedidos: number | null;
    itemsPedidos: number | null;
};

type ApiPosition = {
    id: string;
    warehouseId?: string;
    schemaType?: string | null;
    schemaName?: string | null;
    positionKey?: string | null;
    stockAllocationType?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
    stats?: {
        skus?: number | null;
        items?: number | null;
        packages?: number | null;
        orders?: number | null;
        orderedItems?: number | null;
    } | null;
};

const POSITION_BASE_URL = `${BASE_WAREHOUSES}/position`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function AlmacenesSlotsView() {
    const router = useRouter();
    const { id } = useParams();
    const [slotSort, setSlotSort] = useState<"asc" | "desc">("asc");
    const [rowsData, setRowsData] = useState<SlotRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const rows = useMemo(() => {
        const next = [...rowsData].sort((a, b) =>
            a.slot.localeCompare(b.slot, undefined, { numeric: true, sensitivity: "base" })
        );
        return slotSort === "asc" ? next : next.reverse();
    }, [rowsData, slotSort]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const rawId = String(id || "").trim();
                if (!rawId) {
                    if (mounted) {
                        setRowsData([]);
                        setLoading(false);
                    }
                    return;
                }

                let warehouseId = rawId;
                if (!UUID_REGEX.test(rawId)) {
                    const warehouse = await warehouseGet(rawId).catch(() => undefined);
                    if (warehouse?.id) {
                        warehouseId = warehouse.id;
                    }
                }

                const url = `${POSITION_BASE_URL}?filters[warehouseId]=${encodeURIComponent(warehouseId)}`;
                const res = await fetch(url, {
                    method: "GET",
                    headers: JANIS_HEADERS,
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const payload = (await res.json()) as ApiPosition[];

                if (!mounted) return;

                const mapped: SlotRow[] = (Array.isArray(payload) ? payload : []).map((item) => ({
                    esquema: String(item.schemaName || "-"),
                    tipoEsquema: String(item.schemaType || "-"),
                    slot: String(item.positionKey || "-"),
                    skus: item.stats?.skus ?? null,
                    items: item.stats?.items ?? null,
                    bultos: item.stats?.packages ?? null,
                    pedidos: item.stats?.orders ?? null,
                    itemsPedidos: item.stats?.orderedItems ?? null,
                }));

                setRowsData(mapped);
            } catch (e: any) {
                if (mounted) {
                    setRowsData([]);
                    setError(e?.message || "No se pudo cargar slots.");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => router.push("/almacen/almacenes"),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Almacenes</div>
                    <div className="text-2xl font-semibold text-gray-900">#{String(id || "-")}</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions, id]
    );

    return (
        <div className="p-6 bg-white">
            {loading ? (
                <div className="mb-3 flex items-center text-sm text-gray-600">
                    <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" /> Cargando slots...
                </div>
            ) : error ? (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="mr-2 h-4 w-4" /> {error}
                    </div>
                </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl bg-[#f0f2f7] p-2.5">
                <table className="min-w-full table-fixed border-separate border-spacing-y-1 text-sm">
                    <colgroup>
                        <col className="w-[19%]" />
                        <col className="w-[18%]" />
                        <col className="w-[8%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                        <col className="w-[11%]" />
                    </colgroup>
                    <thead>
                        <tr className="text-left text-xs font-semibold text-[#7b818d]">
                            <th className="px-3 py-1.5">Esquema</th>
                            <th className="px-3 py-1.5">Tipo de esquema</th>
                            <th className="px-3 py-1.5">
                                <button
                                    type="button"
                                    onClick={() => setSlotSort((prev) => (prev === "asc" ? "desc" : "asc"))}
                                    className="inline-flex items-center gap-1 text-[#6f7684] hover:text-[#2563eb]"
                                    title={`Ordenar slot ${slotSort === "asc" ? "descendente" : "ascendente"}`}
                                >
                                    Slot <span className="text-blue-600">{slotSort === "asc" ? "â†‘" : "â†“"}</span>
                                </button>
                            </th>
                            <th className="px-3 py-1.5">SKUs</th>
                            <th className="px-3 py-1.5">Items</th>
                            <th className="px-3 py-1.5">Bultos</th>
                            <th className="px-3 py-1.5">Pedidos</th>
                            <th className="px-3 py-1.5">Items pedidos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={8} className="rounded-md border border-[#d8dce6] bg-[#f6f7fa] px-3 py-5 text-center text-sm text-[#6f7684]">
                                    Sin posiciones para este warehouse.
                                </td>
                            </tr>
                        ) : rows.map((row) => (
                            <tr key={row.slot} className="text-[#4f5561]">
                                <td className="rounded-l-md border-y border-l border-[#d8dce6] bg-[#f6f7fa] px-3 py-2 align-top text-sm shadow-[inset_2px_0_0_0_#9ddc90]">
                                    <span className="whitespace-pre-line text-[13px] font-medium leading-4">{row.esquema}</span>
                                </td>
                                <td className="border-y border-[#d8dce6] bg-[#f6f7fa] px-3 py-2 text-[13px] font-semibold text-[#5f6674]">{row.tipoEsquema}</td>
                                <td className="border-y border-[#d8dce6] bg-[#f6f7fa] px-3 py-2 text-[13px] font-semibold text-[#4e5663]">{row.slot}</td>
                                <td className="border-y border-[#d8dce6] bg-[#f6f7fa] px-3 py-2">
                                    <MetricPill value={row.skus} icon={<Triangle className="h-2.5 w-2.5" />} />
                                </td>
                                <td className="border-y border-[#d8dce6] bg-[#f6f7fa] px-3 py-2">
                                    <MetricPill value={row.items} icon={<Triangle className="h-2.5 w-2.5" />} />
                                </td>
                                <td className="border-y border-[#d8dce6] bg-[#f6f7fa] px-3 py-2">
                                    <MetricPill value={row.bultos} icon={<Box className="h-2.5 w-2.5" />} />
                                </td>
                                <td className="border-y border-[#d8dce6] bg-[#f6f7fa] px-3 py-2">
                                    <MetricPill value={row.pedidos} icon={<ShoppingCart className="h-2.5 w-2.5" />} />
                                </td>
                                <td className="rounded-r-md border-y border-r border-[#d8dce6] bg-[#f6f7fa] px-3 py-2">
                                    <MetricPill value={row.itemsPedidos} icon={<ShoppingCart className="h-2.5 w-2.5" />} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
