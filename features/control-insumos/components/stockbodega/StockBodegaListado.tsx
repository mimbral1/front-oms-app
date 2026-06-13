// views\ControlInsumos\StockBodega\components\StockBodegaListado.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { Pagination } from "@/components/ui/pagination";
import { ActionButton } from "@/components/ui/button/action-button";

interface ItemRow {
    codigo: string;
    nombre: string;
    cantidad: number;
    unidad: string;
    bodega: string;
    fecha: string;
}

/* -------- PAGINACIÓN  -------- */

const PER_PAGE = 20;
const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

/* -------- Columnas -------- */

function getColumns(): Column<ItemRow>[] {
    return [
        { header: "Código", accessorKey: "codigo", cell: (r) => <CopyableText text={r.codigo}>{r.codigo}</CopyableText> },
        { header: "Ítem", accessorKey: "nombre" },
        { header: "Cantidad Disponible", accessorKey: "cantidad" },
        { header: "Unidad de Medida", accessorKey: "unidad" },
        { header: "Bodega", accessorKey: "bodega" },
        { header: "Última Actualización", accessorKey: "fecha" },
    ];
}

export default function StockBodegaListado() {
    /* -------- MOCK -------- */
    const rows: ItemRow[] = [
        {
            codigo: "MTR-001",
            nombre: "Tornillos Phillips #2",
            cantidad: 1500,
            unidad: "Unidades",
            bodega: "Bodega Central",
            fecha: "2023-10-26 14:30",
        },
        {
            codigo: "HER-005",
            nombre: 'Llave Ajustable 10"',
            cantidad: 50,
            unidad: "Unidades",
            bodega: "Bodega Norte",
            fecha: "2023-10-25 10:00",
        },
        {
            codigo: "SEG-010",
            nombre: "Guantes de Seguridad XL",
            cantidad: 300,
            unidad: "Pares",
            bodega: "Bodega Sur",
            fecha: "2023-10-26 09:15",
        },
        {
            codigo: "PNT-022",
            nombre: "Pintura Acrílica Blanca 1L",
            cantidad: 120,
            unidad: "Litros",
            bodega: "Bodega Central",
            fecha: "2023-10-24 16:45",
        },
        {
            codigo: "LMP-003",
            nombre: "Bombilla LED E27",
            cantidad: 800,
            unidad: "Unidades",
            bodega: "Bodega Norte",
            fecha: "2023-10-25 11:30",
        },
        {
            codigo: "LIM-015",
            nombre: "Detergente Industrial 5L",
            cantidad: 75,
            unidad: "Bidones",
            bodega: "Bodega Sur",
            fecha: "2023-10-26 15:00",
        },
    ];

    /* -------- Estados Filtro + Búsqueda (solo UI por ahora) -------- */

    const [bodegaSeleccionada, setBodegaSeleccionada] = useState("all");

    /* -------- Paginación -------- */

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

    const columns = useMemo(() => getColumns(), []);

    return (
        <div className="space-y-6">

            {/* ------------------- FILTRO SUPERIOR ------------------- */}
            <div className="flex items-center gap-4 flex-wrap">

                {/* Filtro por Bodega */}
                <select
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none"
                    value={bodegaSeleccionada}
                    onChange={(e) => setBodegaSeleccionada(e.target.value)}
                >
                    <option value="all">Todas las Bodegas</option>
                    <option value="central">Bodega Central</option>
                    <option value="norte">Bodega Norte</option>
                    <option value="sur">Bodega Sur</option>
                </select>

                {/* Buscador */}
                <input
                    placeholder="Buscar item o código..."
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none flex-1 min-w-[240px]"
                />

                {/* Botón detalles */}
                <ActionButton variant="secondary" className="ml-auto">
                    Ver detalles
                </ActionButton>
            </div>

            {/* ------------------- TABLA ------------------- */}
            <DataTable<ItemRow>
                data={shownRows}
                columns={columns}
                dataType="General2"
                rowPaddingY={12}
                rowBgClass="bg-white"
                showStatusBorder={false}
            />

            {/* ------------------- PAGINACIÓN ------------------- */}
            <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
