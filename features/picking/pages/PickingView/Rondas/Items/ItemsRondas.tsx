// views\PickingView\Rondas\Items\ItemsRondas.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { useFetchWithAuthQA } from "@/lib/http/client";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

/* ──────────────────────────────
   Tipos UI
────────────────────────────── */
type Item = {
    id: string;
    nombre: string;
    imagen?: string;
    sku: string;
    barcode: string;
    precioUnitario: number;
    cantidad: number;
    total: number;
};

type Grupo = {
    id: string;
    nombre: string;

    codigo: string;
    bulto: string;
    almacen: string;

    items: Item[];
};

type SessionSummaryResponse = {
    data?: {
        items?: Array<{
            containerId?: string;
            containerTag?: string;
            containerLabel?: string;
            warehouse?: string;
            items?: Array<{
                sessionItemId?: string;
                productName?: string;
                imageUrl?: string;
                skuId?: string;
                eans?: string[];
                unitPrice?: number;
                qty?: number | string;
                total?: number;
            }>;
        }>;
    };
};

/* ──────────────────────────────
   Helpers
────────────────────────────── */
const CLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
});

const GRID_COLS =
    "grid-cols-[minmax(280px,1fr)_120px_100px_120px]";

/* ──────────────────────────────
   Vista
────────────────────────────── */
export default function ItemsRondasView() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const rondaId = params?.id;
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [data, setData] = useState<Grupo[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    const loadItems = async () => {
        if (!rondaId) {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetchWithAuthQA<SessionSummaryResponse>(
                `picking-service/sessions/${encodeURIComponent(rondaId)}/summary`,
                { method: "GET" }
            );

            const apiGroups = response?.data?.items || [];
            const mappedGroups: Grupo[] = apiGroups.map((group, groupIndex) => {
                const groupId =
                    group.containerId ||
                    group.containerTag ||
                    `container-${groupIndex + 1}`;

                const mappedItems: Item[] = (group.items || []).map((item, itemIndex) => {
                    // Cantidad debe venir del qty del item del carrito (data.items[].items[].qty).
                    const qtyFromItem =
                        typeof item.qty === "string"
                            ? Number(item.qty.replace(",", "."))
                            : Number(item.qty);

                    return {
                        id:
                            item.sessionItemId ||
                            `${groupId}-item-${itemIndex + 1}`,
                        nombre: item.productName || "Sin nombre",
                        imagen: item.imageUrl,
                        sku: item.skuId || "-",
                        barcode: item.eans?.[0] || "-",
                        precioUnitario: Number(item.unitPrice || 0),
                        cantidad: Number.isFinite(qtyFromItem) ? qtyFromItem : 0,
                        total: Number(item.total || 0),
                    };
                });

                return {
                    id: groupId,
                    nombre: group.containerLabel || `Bulto ${groupIndex + 1}`,
                    codigo: group.containerTag || "-",
                    bulto: group.containerId || String(groupIndex + 1),
                    almacen: group.warehouse || "-",
                    items: mappedItems,
                };
            });

            setData(mappedGroups);
            setOpenGroups(
                Object.fromEntries(mappedGroups.map((g) => [g.id, true]))
            );
        } catch {
            setErrorMessage("No se pudieron cargar los ítems de la ronda.");
            setData([]);
            setOpenGroups({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [rondaId]);

    /* ──────────────────────────────
       PageHeader
    ────────────────────────────── */
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/rondas"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Rondas
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        #{rondaId}
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions, rondaId]
    );

    /* ──────────────────────────────
       Estados
    ────────────────────────────── */
    if (loading) {
        return (
            <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="px-4 py-6 text-center text-gray-500">
                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                Cargando ítems de la ronda...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium">
                            Error al cargar ítems de la ronda
                        </h3>
                        <p className="mt-2 text-sm">{errorMessage}</p>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={loadItems}
                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ──────────────────────────────
       Render
    ────────────────────────────── */
    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <div className="flex-1 space-y-4">
                {data.map((grupo) => {
                    const isOpen = !!openGroups[grupo.id];
                    const totalGrupo = grupo.items.reduce(
                        (acc, i) => acc + i.total,
                        0
                    );

                    return (
                        <div
                            key={grupo.id}
                            className="rounded-xl border bg-white shadow-sm overflow-hidden"
                        >
                            {/* Header grupo */}
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenGroups((p) => ({
                                        ...p,
                                        [grupo.id]: !p[grupo.id],
                                    }))
                                }
                                className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-2">
                                    <ChevronRightIcon
                                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""
                                            }`}
                                    />
                                    <span className="font-semibold text-gray-800">
                                        {grupo.nombre}
                                    </span>
                                </div>

                                {/* <div className="text-sm text-gray-600">
                                    {grupo.items.length} ítems · Total grupo{" "}
                                    <span className="font-medium text-gray-800">
                                        {CLP.format(totalGrupo)}
                                    </span>
                                </div> */}
                            </button>

                            {isOpen && (
                                <div className="divide-y">
                                    {/* Header columnas */}
                                    <div
                                        className={`grid ${GRID_COLS} gap-x-4 px-6 py-2 text-xs text-gray-500 bg-gray-50`}
                                    >
                                        <div>Producto</div>
                                        <div className="text-right">Precio unit.</div>
                                        <div className="text-right">Cantidad</div>
                                        <div className="text-right">Total</div>
                                    </div>

                                    {/* items */}
                                    {grupo.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`grid ${GRID_COLS} gap-x-4 px-6 py-4 hover:bg-blue-50/40`}
                                        >
                                            <div className="flex gap-4">
                                                <div className="h-14 w-14 rounded-md border bg-white overflow-hidden">
                                                    <img
                                                        src={item.imagen}
                                                        alt={item.nombre}
                                                        className="h-full w-full object-contain"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800">
                                                        {item.nombre}
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-500 flex gap-4">
                                                        <span className="font-mono">
                                                            {item.barcode}
                                                        </span>
                                                        <span className="font-mono">
                                                            #{item.sku}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right text-sm text-gray-700">
                                                {CLP.format(item.precioUnitario)}
                                            </div>
                                            <div className="text-right text-sm text-gray-700">
                                                {item.cantidad}
                                            </div>
                                            <div className="text-right text-sm font-medium text-gray-900">
                                                {CLP.format(item.total)}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Footer bulto */}
                                    <div className="flex items-center justify-between px-6 py-3 bg-gray-50 text-sm text-gray-600">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Código:</span>
                                                <span className="font-mono">{grupo.codigo}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">ID:</span>
                                                <span>{grupo.bulto}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Almacén:</span>
                                            <span>{grupo.almacen}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}