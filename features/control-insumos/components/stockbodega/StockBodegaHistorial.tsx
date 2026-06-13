// views\ControlInsumos\StockBodega\components\StockBodegaHistorial.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { DataTable, type Column } from "@/components/ui/table";
import { EyeIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

interface HistorialItem {
    id: string;
    item: string;
    cambio: string;
    cantidad: number;
    fecha: string;
    usuario: string;
}

/* -------- Paginación -------- */

const PER_PAGE = 20;
const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

function getColumns(onView: (id: string) => void): Column<HistorialItem>[] {
    return [
        { header: "ID", accessorKey: "id" },
        { header: "Item", accessorKey: "item" },
        { header: "Cambio", accessorKey: "cambio" },
        { header: "Cantidad", accessorKey: "cantidad" },
        { header: "Fecha", accessorKey: "fecha" },
        { header: "Usuario", accessorKey: "usuario" },
        {
            header: "Acciones",
            accessorKey: "id",
            cell: (row) => (
                <button
                    onClick={() => onView(row.id)}
                    className="inline-flex items-center justify-center p-1 hover:bg-gray-100 rounded-md"
                >
                    <EyeIcon className="h-5 w-5 text-gray-600" />
                </button>
            ),
        },
    ];
}

export default function StockBodegaHistorial() {
    const rows: HistorialItem[] = [
        {
            id: "MOV-001",
            item: "Tornillos Phillips #2",
            cambio: "Ingreso",
            cantidad: 300,
            fecha: "2023-10-20 14:00",
            usuario: "Carlos Ruiz",
        },
        {
            id: "MOV-002",
            item: "Guantes Seguridad XL",
            cambio: "Salida",
            cantidad: 50,
            fecha: "2023-10-19 09:30",
            usuario: "María López",
        },
    ];

    const handleView = useCallback((id: string) => {
        console.log("ver detalle", id);
    }, []);

    const columns = useMemo(() => getColumns(handleView), [handleView]);

    /* -------- paginación -------- */

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        setTotalRecords(rows.length);
        setTotalPages(Math.max(1, Math.ceil(rows.length / PER_PAGE)));
    }, [rows]);

    const startIdx = (currentPage - 1) * PER_PAGE;
    const endIdx = Math.min(startIdx + PER_PAGE, rows.length);
    const shownRows = rows.slice(startIdx, endIdx);

    return (
        <div className="space-y-6">

            <DataTable
                data={shownRows}
                columns={columns}
                dataType="General2"
                rowPaddingY={12}
                rowBgClass="bg-white"
                showStatusBorder={false}
            />

            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={PER_PAGE}
                onPageChange={setCurrentPage}
              />
        </div>
    );
}
