// views\Picking\MonitorPicking\MonitorPickingView.tsx
"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    PencilSquareIcon,
    DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

/* =========================================================
   MOCK DATA
   ========================================================= */

type Metric = {
    done: number;
    total: number;
};

type Slot = {
    time: string;
    pedidos: Metric;
    productos: Metric;
};

type Day = {
    key: string;
    label: string;
    isActive?: boolean;
    slots: Slot[];
};

const MOCK: Day[] = [
    {
        key: "mon",
        label: "Lunes 14",
        slots: [
            {
                time: "08:00 - 12:00",
                pedidos: { done: 3, total: 8 },
                productos: { done: 126, total: 240 },
            },
            {
                time: "10:00 - 14:00",
                pedidos: { done: 3, total: 8 },
                productos: { done: 310, total: 240 },
            },
        ],
    },
    {
        key: "tue",
        label: "Martes 15",
        slots: [
            {
                time: "08:00 - 12:00",
                pedidos: { done: 4, total: 8 },
                productos: { done: 304, total: 240 },
            },
            {
                time: "10:00 - 14:00",
                pedidos: { done: 5, total: 8 },
                productos: { done: 266, total: 240 },
            },
        ],
    },
    {
        key: "wed",
        label: "Miércoles 16",
        slots: [
            {
                time: "08:00 - 12:00",
                pedidos: { done: 4, total: 8 },
                productos: { done: 304, total: 240 },
            },
            {
                time: "10:00 - 14:00",
                pedidos: { done: 5, total: 8 },
                productos: { done: 266, total: 240 },
            },
        ],
    },
    {
        key: "thu",
        label: "Jueves 17",
        isActive: true,
        slots: [
            {
                time: "08:00 - 12:00",
                pedidos: { done: 1, total: 8 },
                productos: { done: 210, total: 240 },
            },
            {
                time: "10:00 - 14:00",
                pedidos: { done: 4, total: 8 },
                productos: { done: 235, total: 240 },
            },
            {
                time: "12:00 - 16:00",
                pedidos: { done: 3, total: 8 },
                productos: { done: 282, total: 240 },
            },
        ],
    },
    {
        key: "fri",
        label: "Viernes 18",
        slots: [
            {
                time: "08:00 - 12:00",
                pedidos: { done: 0, total: 8 },
                productos: { done: 0, total: 240 },
            },
            {
                time: "10:00 - 14:00",
                pedidos: { done: 1, total: 8 },
                productos: { done: 57, total: 240 },
            },
        ],
    },
    {
        key: "sat",
        label: "Sábado 19",
        slots: [
            {
                time: "08:00 - 12:00",
                pedidos: { done: 0, total: 8 },
                productos: { done: 0, total: 240 },
            },
            {
                time: "10:00 - 14:00",
                pedidos: { done: 1, total: 8 },
                productos: { done: 14, total: 240 },
            },
        ],
    },
    {
        key: "sun",
        label: "Domingo 20",
        slots: [
            {
                time: "08:00 - 12:00",
                pedidos: { done: 0, total: 8 },
                productos: { done: 0, total: 240 },
            },
        ],
    },
];

/* =========================================================
   HELPERS
   ========================================================= */

const percent = (m: Metric) =>
    m.total === 0 ? 0 : Math.round((m.done / m.total) * 100);

const progressColor = (p: number) => {
    if (p >= 80) return "bg-red-500";
    if (p >= 40) return "bg-yellow-400";
    if (p > 0) return "bg-green-500";
    return "bg-gray-300";
};

const pillColor = (p: number) => {
    if (p >= 80) return "bg-red-100 text-red-700";
    if (p >= 40) return "bg-yellow-100 text-yellow-700";
    if (p > 0) return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-500";
};

/* =========================================================
   VIEW
   ========================================================= */

export default function MonitorPickingView() {

    const ITEMS_PER_PAGE = 7;
    const MAX_VISIBLE_PAGES = 3;

    const [currentPage, setCurrentPage] = useState(1);

    const [filters, setFilters] = useState({
        fecha: "2021-06-14",
        formato: "Semana",
        tienda: "Fizzmod",
    });

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Edición masiva",
                variant: "secondary",
                icon: <PencilSquareIcon className="h-5 w-5" />,
                onClick: () => { },
            },
            {
                label: "Copiar planificación",
                variant: "secondary",
                icon: <DocumentDuplicateIcon className="h-5 w-5" />,
                onClick: () => { },
            },
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: () => { },
            },
        ],
        []
    );

    const headerFilters = [
        {
            id: "fecha",
            label: "Fecha",
            type: "datetime" as const,
            value: filters.fecha,
        },
        {
            id: "formato",
            label: "Formato",
            type: "select" as const,
            value: filters.formato,
            options: [{ label: "Semana", value: "Semana" }],
        },
        {
            id: "tienda",
            label: "Tienda",
            type: "select" as const,
            value: filters.tienda,
            options: [{ label: "Fizzmod", value: "Fizzmod" }],
        },
    ];

    // paginacion 
    const totalRecords = MOCK.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    const pagedDays = MOCK.slice(startIndex, endIndex);

    // ventana de páginas (MISMO patrón que usas)
    let startPage = Math.max(
        1,
        currentPage - Math.floor(MAX_VISIBLE_PAGES / 2)
    );
    let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

    if (endPage - startPage < MAX_VISIBLE_PAGES - 1) {
        startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }

    const startItem =
        totalRecords === 0 ? 0 : startIndex + 1;
    const endItem = Math.min(endIndex, totalRecords);

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Picking"
                description="Monitor de Picking"
                action={headerActions}
                filters={headerFilters}
                filterTitle
                onFilterChange={(id, value) =>
                    setFilters((f) => ({ ...f, [id]: value }))
                }
            />

            <div className="flex-1 p-6 overflow-x-auto">
                <div className="grid grid-cols-7 gap-4 min-w-[1200px]">
                    {pagedDays.map((day) => (
                        <div
                            key={day.key}
                            className={`rounded-xl bg-white p-4 space-y-4 border-t-4 ${day.isActive
                                ? "border-blue-500"
                                : "border-yellow-400"
                                }`}
                        >
                            <div
                                className={`text-sm font-semibold ${day.isActive ? "text-blue-600" : "text-gray-600"
                                    }`}
                            >
                                {day.label}
                            </div>

                            {day.slots.map((slot, idx) => {
                                const pedidosPct = percent(slot.pedidos);
                                const productosPct = percent(slot.productos);

                                return (
                                    <div
                                        key={idx}
                                        className="rounded-lg border bg-white p-3 space-y-3"
                                    >
                                        <div className="text-sm font-medium text-gray-700">
                                            {slot.time}
                                        </div>

                                        {/* PEDIDOS */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                <span>Pedidos</span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${pillColor(
                                                        pedidosPct
                                                    )}`}
                                                >
                                                    {pedidosPct}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {slot.pedidos.done} / {slot.pedidos.total}
                                            </div>
                                            <div className="h-2 w-full rounded bg-gray-200">
                                                <div
                                                    className={`h-2 rounded ${progressColor(
                                                        pedidosPct
                                                    )}`}
                                                    style={{ width: `${pedidosPct}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* PRODUCTOS */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                <span>Productos</span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${pillColor(
                                                        productosPct
                                                    )}`}
                                                >
                                                    {productosPct}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {slot.productos.done} / {slot.productos.total}
                                            </div>
                                            <div className="h-2 w-full rounded bg-gray-200">
                                                <div
                                                    className={`h-2 rounded ${progressColor(
                                                        productosPct
                                                    )}`}
                                                    style={{ width: `${productosPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* PAGINACIÓN */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    {totalPages > 0 && (
                        <>
                            <div className="flex justify-center gap-2">
                                {currentPage > 1 && (
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                                    >
                                        &lt;
                                    </button>
                                )}

                                {Array.from(
                                    { length: endPage - startPage + 1 },
                                    (_, i) => startPage + i
                                ).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`rounded px-3 py-1 ${currentPage === page
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-200 hover:bg-gray-300"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                {currentPage < totalPages && (
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                                    >
                                        &gt;
                                    </button>
                                )}
                            </div>

                            <div className="text-sm text-gray-500">
                                {startItem}-{endItem} de {totalRecords} resultados
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
