// app/customers/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Clock4Icon, TimerIcon } from "lucide-react";

export type DriverStatus = "Active" | "Inactive";
interface DriversProductivityRows {
    id: string;
    name: string;
    tiempoActividad: string;
    rutas: number;
    tiempoPromedioRuta: string;
    entregas: number;
    tiempoPromedioEntrega: string;
    distanciaRecorrida: string;
    distanciaPromedio: string;
    onTimeDelivery: string;
}

export const defaultAvatar = "https://freesvg.org/img/abstract-user-flat-3.png";

const mockDriversProductivityRows: DriversProductivityRows[] = [
    {
        id: "1",
        name: "Franco Pilafis",
        tiempoActividad: "313:50 Hs",
        rutas: 6,
        tiempoPromedioRuta: "52:18 Hs",
        entregas: 6,
        tiempoPromedioEntrega: "52:18 Hs",
        distanciaRecorrida: "53.76 Km",
        distanciaPromedio: "05:55 Hs/Km",
        onTimeDelivery: "83.33%",
    },
    {
        id: "2",
        name: "Gonzalo Lopez",
        tiempoActividad: "51:01 Hs",
        rutas: 1,
        tiempoPromedioRuta: "51:01 Hs",
        entregas: 2,
        tiempoPromedioEntrega: "25:31 Hs",
        distanciaRecorrida: "27.22 Km",
        distanciaPromedio: "01:53 Hs/Km",
        onTimeDelivery: "0%",
    },
];

const getColumns = (
    router: ReturnType<typeof useRouter>
): Column<DriversProductivityRows>[] => [
        {
            accessorKey: "name",
            header: "Nombre",
            cell: (r) => r.name,
        },
        {
            accessorKey: "tiempoActividad",
            header: "Tiempo de actividad",
            cell: (r) => {
                return (
                    <div className="display: flex">
                        <Clock4Icon className="h-4 w-4" />
                        <span>
                            {r.tiempoActividad}
                        </span>
                    </div>
                )
            },
        },
        {
            accessorKey: "rutas",
            header: "Rutas",
            cell: (r) => {
                return (
                    <div className="inline-flex items-center gap-1 border border-gray-300 rounded-full px-5 py-2 text-sm text-gray-800">
                        {r.rutas}
                    </div>
                );
            },
        },
        {
            accessorKey: "tiempoPromedioRuta" as const,
            header: "Tiempo promedio",
            cell: (r) => r.tiempoPromedioRuta,
        },
        {
            accessorKey: "entregas",
            header: "Entregas",
            cell: (r) => {
                return (
                    <div className="inline-flex items-center gap-1 border border-gray-300 rounded-full px-5 py-2 text-sm text-gray-800">
                        {r.entregas}
                    </div>
                );
            },
        },
        {
            accessorKey: "tiempoPromedioEntrega" as const,
            header: "Tiempo promedio entrega",
            cell: (r) => r.tiempoPromedioEntrega,
        },
        {
            accessorKey: "distanciaRecorrida",
            header: "Distancia recorrida",
            cell: (r) => {
                return (
                    <div className="inline-flex items-center gap-1 border border-gray-300 rounded-full px-5 py-2 text-sm text-gray-800">
                        {r.distanciaRecorrida}
                    </div>
                );
            },
        },
        {
            accessorKey: "distanciaPromedio" as const,
            header: "Distancia promedio",
            cell: (r) => r.distanciaPromedio,
        },
        {
            accessorKey: "onTimeDelivery" as const,
            header: "On time delivery",
            cell: (r) => {
                return (
                    <div className="inline-flex items-center gap-1 border border-blue-400 text-blue-600 rounded-full px-3 py-1 text-sm">
                        <TimerIcon className="h-4 w-4" />
                        {r.onTimeDelivery}
                    </div>
                );
            },
        },
    ];

export default function DriversProductivityView() {

    const router = useRouter();
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const [data, setData] = useState<DriversProductivityRows[]>([]);

    const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(n, max));

    // Estados de filtros
    const [dateStart, setDateStart] = useState("2024-01-01");
    const [dateEnd, setDateEnd] = useState("2024-01-31");
    const [driver, setDriver] = useState("");
    const [inventory, setInventory] = useState("");

    useEffect(() => {
        setData(mockDriversProductivityRows);
    }, []);

    const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
    const shown = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    useEffect(() => {
        setPage((p) => clamp(p, 1, totalPages));
    }, [totalPages]);

    const clearFilters = () => {
        setDateStart("2024-01-01");
        setDateEnd("2024-01-31");
        setDriver("");
        setInventory("");
    };

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title="Productividad de conductores"
            />

            {/* Bloque de filtros personalizado */}
            <div className="px-6 py-3 bg-[#f5f7fd] rounded-sm">
                <div className="flex justify-between flex-wrap items-end gap-y-4">
                    {/* Agrupa todos los filtros en una sola columna */}
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                        {/* Período */}
                        <div className="flex flex-col">
                            <label className="text-sm text-blue-600 font-medium mb-1">Período</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="rounded border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                                <span className="text-gray-600">→</span>
                                <input
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="rounded border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* Conductor */}
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600 font-medium mb-1">Conductor</label>
                            <select
                                value={driver}
                                onChange={(e) => setDriver(e.target.value)}
                                className="rounded border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Conductor</option>
                                <option value="franco">Franco Pilafis</option>
                                <option value="gonzalo">Gonzalo Lopez</option>
                            </select>
                        </div>

                        {/* Inventario */}
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600 font-medium mb-1">Inventario</label>
                            <select
                                value={inventory}
                                onChange={(e) => setInventory(e.target.value)}
                                className="rounded border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Inventario</option>
                                <option value="a">Inventario A</option>
                                <option value="b">Inventario B</option>
                            </select>
                        </div>
                    </div>

                    {/* Clear filters button */}
                    <div className="flex items-end mt-6">
                        <ClearFiltersButton onClick={clearFilters} />
                    </div>
                </div>

            </div>


            <div className="p-6">
                <DataTable
                    data={shown}
                    columns={getColumns(router)}
                    rowBgClass="bg-white"
                    rowPaddingY={12}
                    dataType="General2"
                />

                <div className="mt-4">
                    <Pagination
                        currentPage={page}
                        totalRecords={data.length}
                        pageSize={PER_PAGE}
                        onPageChange={(next) => setPage(clamp(next, 1, totalPages))}
                    />
                </div>
            </div>
        </div>
    );
}

