// views\ControlInsumos\TrasladoAlmacenes\components\TrasladosListado.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { ActionButton } from "@/components/ui/button/action-button";

/* ------------------------------- Tipos ------------------------------- */

interface TrasladoRow {
    id: string;
    fecha: string;
    origen: string;
    destino: string;
    items: string;
    estado: "Completado" | "En tránsito" | "Pendiente" | "Rechazado";
}

/* ------------------------- Paginación  ------------------------ */

const PER_PAGE = 20;
const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

/* ------------------------------ Estado pill ------------------------------ */

const getColor = (estado: TrasladoRow["estado"]) => {
    switch (estado) {
        case "Completado": return "bg-green-500";
        case "En tránsito": return "bg-blue-500";
        case "Pendiente": return "bg-yellow-500";
        case "Rechazado": return "bg-red-500";
        default: return "bg-gray-400";
    }
};

const EstadoPill = ({ estado }: { estado: TrasladoRow["estado"] }) => (
    <span
        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium text-white ${getColor(
            estado
        )}`}
    >
        {estado}
    </span>
);

/* ------------------------------ Columnas ------------------------------ */

function getColumns(onView: (id: string) => void): Column<TrasladoRow>[] {
    return [
        { header: "ID", accessorKey: "id", cell: (r) => <CopyableText text={r.id}>{r.id}</CopyableText> },
        { header: "Fecha", accessorKey: "fecha" },
        { header: "Bodega de Origen", accessorKey: "origen" },
        { header: "Bodega de Destino", accessorKey: "destino" },
        {
            header: "Ítems",
            accessorKey: "items",
            cell: (r) => <div className="max-w-[320px]">{r.items}</div>,
        },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (r) => <EstadoPill estado={r.estado} />,
        },
        {
            header: "Acciones",
            accessorKey: "estado",
            cell: (row) => (
                <div className="flex gap-3">
                    <button
                        onClick={() => onView(row.id)}
                        className="p-1 hover:bg-gray-100 rounded-md"
                    >
                        <EyeIcon className="h-5 w-5 text-gray-600" />
                    </button>

                    {/* solo UI */}
                    <button className="p-1 hover:bg-gray-100 rounded-md">
                        <XMarkIcon className="h-5 w-5 text-red-600" />
                    </button>
                </div>
            ),
        },
    ];
}

/* ------------------------------ Componente ------------------------------ */

export default function TrasladosListado() {
    /* datos mock  */
    const rows: TrasladoRow[] = [
        {
            id: "TR001",
            fecha: "26/10/2023",
            origen: "Bodega Central",
            destino: "Almacén Norte",
            items: "5 ítems: Tornillos, Tuercas...",
            estado: "Completado",
        },
        {
            id: "TR002",
            fecha: "27/10/2023",
            origen: "Bodega Sur",
            destino: "Bodega Central",
            items: "2 ítems: Cajas de cables...",
            estado: "En tránsito",
        },
        {
            id: "TR003",
            fecha: "28/10/2023",
            origen: "Almacén Este",
            destino: "Bodega Sur",
            items: "1 ítem: Lotes de herramientas",
            estado: "Pendiente",
        },
        {
            id: "TR004",
            fecha: "29/10/2023",
            origen: "Bodega Central",
            destino: "Almacén Oeste",
            items: "4 ítems: Bombillos, Enchufe...",
            estado: "Rechazado",
        },
    ];

    const handleView = useCallback((id: string) => {
        console.log("Ver traslado:", id);
    }, []);

    const columns = useMemo(() => getColumns(handleView), [handleView]);

    /* ---------------- PAGINACIÓN ---------------- */

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        setTotalRecords(rows.length);
        setTotalPages(Math.max(1, Math.ceil(rows.length / PER_PAGE)));
    }, [rows]);

    const start = (currentPage - 1) * PER_PAGE;
    const end = Math.min(start + PER_PAGE, rows.length);
    const shownRows = rows.slice(start, end);

    return (
        <div className="space-y-6">

            {/* ---------------- FILTROS ---------------- */}
            <div className="bg-page-bg border rounded-xl p-5 space-y-4">

                <h2 className="font-semibold text-gray-700">Filtrar Traslados</h2>

                <div className="flex items-end gap-4 flex-wrap">

                    {/* Estado */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-700 mb-1">Estado</label>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                            <option>Todos</option>
                            <option>Pendiente</option>
                            <option>En tránsito</option>
                            <option>Completado</option>
                            <option>Rechazado</option>
                        </select>
                    </div>

                    {/* Fecha */}
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-700 mb-1">Rango de Fechas</label>
                        <input
                            type="text"
                            placeholder="Seleccionar fechas"
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <ActionButton variant="secondary">
                        Aplicar Filtros
                    </ActionButton>
                </div>
            </div>

            {/* ---------------- LISTA ---------------- */}
            <h3 className="font-semibold text-gray-700">Lista de Traslados</h3>

            <DataTable
                data={shownRows}
                columns={columns}
                dataType="General2"
                rowBgClass="bg-white"
                rowPaddingY={12}
            />

            {/* ---------------- PAGINACIÓN ---------------- */}
            <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
