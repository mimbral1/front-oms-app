"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { DataTable, Column } from "@/components/ui/table";

// --- TYPES ---
interface PriceChangeEntry {
    id: string;
    previousPrice: number;
    currentPrice: number;
    priceDifference: number;
    previousListPrice: number;
    currentListPrice: number;
    listPriceDifference: number;
    previousCostPrice: number;
    currentCostPrice: number;
    costPriceDifference: number;
    dateCreated: string;
}

// --- MOCK DATA ---
const MOCK_DATA: PriceChangeEntry[] = [
    {
        id: "1",
        previousPrice: 15000,
        currentPrice: 18000,
        priceDifference: 3000,
        previousListPrice: 14000,
        currentListPrice: 17000,
        listPriceDifference: 3000,
        previousCostPrice: 10000,
        currentCostPrice: 12000,
        costPriceDifference: 2000,
        dateCreated: "2024-11-15T10:30:00Z",
    },
    {
        id: "2",
        previousPrice: 12000,
        currentPrice: 15000,
        priceDifference: 3000,
        previousListPrice: 11000,
        currentListPrice: 14000,
        listPriceDifference: 3000,
        previousCostPrice: 8000,
        currentCostPrice: 10000,
        costPriceDifference: 2000,
        dateCreated: "2024-10-01T14:00:00Z",
    },
    {
        id: "3",
        previousPrice: 10000,
        currentPrice: 12000,
        priceDifference: 2000,
        previousListPrice: 9500,
        currentListPrice: 11000,
        listPriceDifference: 1500,
        previousCostPrice: 7000,
        currentCostPrice: 8000,
        costPriceDifference: 1000,
        dateCreated: "2024-08-20T08:15:00Z",
    },
];

const formatCurrency = (v: number) =>
    v.toLocaleString("es-CL", { style: "currency", currency: "CLP" });

const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

// --- SIMPLE SVG CHART ---
function PriceChart({ data }: { data: PriceChangeEntry[] }) {
    if (data.length === 0) return null;

    const sorted = [...data].sort(
        (a, b) =>
            new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
    );

    const allValues = sorted.flatMap((d) => [d.currentPrice, d.currentListPrice]);
    const minVal = Math.min(...allValues) * 0.9;
    const maxVal = Math.max(...allValues) * 1.1;
    const range = maxVal - minVal || 1;

    const W = 600;
    const H = 200;
    const padX = 50;
    const padY = 20;
    const chartW = W - padX * 2;
    const chartH = H - padY * 2;

    const getX = (i: number) =>
        padX + (sorted.length === 1 ? chartW / 2 : (i / (sorted.length - 1)) * chartW);
    const getY = (v: number) => padY + chartH - ((v - minVal) / range) * chartH;

    const priceLine = sorted.map((d, i) => `${getX(i)},${getY(d.currentPrice)}`).join(" ");
    const listLine = sorted.map((d, i) => `${getX(i)},${getY(d.currentListPrice)}`).join(" ");

    return (
        <div className="bg-white rounded-xl border p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Price change history
            </h3>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[700px]">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                    const y = padY + chartH - frac * chartH;
                    const val = minVal + frac * range;
                    return (
                        <g key={frac}>
                            <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
                            <text x={padX - 5} y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">
                                {Math.round(val).toLocaleString()}
                            </text>
                        </g>
                    );
                })}
                {/* Current Price line (blue) */}
                <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={priceLine} />
                {sorted.map((d, i) => (
                    <circle key={`p-${i}`} cx={getX(i)} cy={getY(d.currentPrice)} r="3" fill="#3b82f6" />
                ))}
                {/* Current List Price line (red) */}
                <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={listLine} />
                {sorted.map((d, i) => (
                    <circle key={`l-${i}`} cx={getX(i)} cy={getY(d.currentListPrice)} r="3" fill="#ef4444" />
                ))}
                {/* X-axis labels */}
                {sorted.map((d, i) => (
                    <text key={`x-${i}`} x={getX(i)} y={H - 2} textAnchor="middle" fontSize="7" fill="#9ca3af">
                        {new Date(d.dateCreated).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                    </text>
                ))}
            </svg>
            <div className="flex gap-6 mt-3">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-blue-500 inline-block" />
                    <span className="text-xs text-gray-600">Current price</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-red-500 inline-block" />
                    <span className="text-xs text-gray-600">Current list price</span>
                </div>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export function PrecioPriceChangeView() {
    const { id } = useParams();
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const filtered = useMemo(() => {
        if (!dateFilter) return MOCK_DATA;
        return MOCK_DATA.filter((d) => d.dateCreated.startsWith(dateFilter));
    }, [dateFilter]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

    const actions = [
        {
            label: "Volver al listado",
            icon: <ArrowLeftIcon className="h-5 w-5" />,
            variant: "secondary" as const,
            onClick: () => window.history.back(),
        },
    ];

    usePageHeader(
        () => ({
            title: `Price change · ${id}`,
            action: actions,
            filters: [
                {
                    id: "dateCreated",
                    label: "Date created day",
                    type: "text" as const,
                    value: dateFilter,
                },
            ],
            onFilterChange: (filterId: string, value: string) => {
                if (filterId === "dateCreated") {
                    setDateFilter(value);
                    setPage(1);
                }
            },
        }),
        [id, dateFilter]
    );

    const columns: Column<PriceChangeEntry>[] = [
        {
            accessorKey: "previousPrice",
            header: "Previous price",
            cell: (r) => formatCurrency(r.previousPrice),
        },
        {
            accessorKey: "currentPrice",
            header: "Current price",
            cell: (r) => formatCurrency(r.currentPrice),
        },
        {
            accessorKey: "priceDifference",
            header: "Price difference",
            cell: (r) => (
                <span className={r.priceDifference >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(r.priceDifference)}
                </span>
            ),
        },
        {
            accessorKey: "previousListPrice",
            header: "Previous list price",
            cell: (r) => formatCurrency(r.previousListPrice),
        },
        {
            accessorKey: "currentListPrice",
            header: "Current list price",
            cell: (r) => formatCurrency(r.currentListPrice),
        },
        {
            accessorKey: "listPriceDifference",
            header: "List price difference",
            cell: (r) => (
                <span className={r.listPriceDifference >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(r.listPriceDifference)}
                </span>
            ),
        },
        {
            accessorKey: "previousCostPrice",
            header: "Previous cost price",
            cell: (r) => formatCurrency(r.previousCostPrice),
        },
        {
            accessorKey: "currentCostPrice",
            header: "Current cost price",
            cell: (r) => formatCurrency(r.currentCostPrice),
        },
        {
            accessorKey: "costPriceDifference",
            header: "Cost price difference",
            cell: (r) => (
                <span className={r.costPriceDifference >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(r.costPriceDifference)}
                </span>
            ),
        },
        {
            accessorKey: "dateCreated",
            header: "Date created",
            cell: (r) => formatDate(r.dateCreated),
        },
    ];

    return (
        <div className="p-6 space-y-4">
            <PriceChart data={filtered} />
            <DataTable
                columns={columns}
                data={pageData}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}
