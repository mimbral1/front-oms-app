// views\ControlInsumos\Aprobaciones\components\SolicitudesPendientesView.tsx
"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ActionButton } from "@/components/ui/button/action-button";

interface PendingRow {
    id: string;
    colaborador: string;
    fecha: string;
    detalle: string;
    estado: "Pendiente";
}

/* -------------------- Helpers  -------------------- */

const PER_PAGE = 20;

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

const avatarMock = "/avatar-placeholder.png";

const EstadoPill = () => (
    <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-white bg-orange-500">
        Pendiente
    </span>
);

function getColumns(): Column<PendingRow>[] {
    return [
        { header: "ID Solicitud", accessorKey: "id" },
        {
            header: "Colaborador",
            accessorKey: "colaborador",
            cell: (r) => (
                <div className="flex items-center gap-2">
                    <Image
                        src={avatarMock}
                        alt=""
                        width={28}
                        height={28}
                        className="rounded-full border"
                    />
                    <span>{r.colaborador}</span>
                </div>
            ),
        },
        { header: "Fecha", accessorKey: "fecha" },
        {
            header: "Detalle de ítems",
            accessorKey: "detalle",
            cell: (r) => <div className="max-w-[300px]">{r.detalle}</div>,
        },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: () => <EstadoPill />,
        },
        {
            header: "Acciones",
            accessorKey: "estado",
            cell: () => (
                <div className="flex gap-2">
                    <ActionButton variant="primary" size="sm">
                        Aprobar
                    </ActionButton>
                    <ActionButton variant="error" size="sm">
                        Rechazar
                    </ActionButton>
                </div>
            ),
        },
    ];
}

export default function SolicitudesPendientesView() {
    const rows: PendingRow[] = [
        {
            id: "SOL-001",
            colaborador: "Ana García",
            fecha: "2023-10-26",
            detalle: "3x Resaltadores, 2x Cuadernos A4",
            estado: "Pendiente",
        },
        {
            id: "SOL-002",
            colaborador: "Juan Pérez",
            fecha: "2023-10-25",
            detalle: "1x Teclado ergonómico, 1x Mouse inalámbrico",
            estado: "Pendiente",
        },
        {
            id: "SOL-003",
            colaborador: "María López",
            fecha: "2023-10-24",
            detalle: "100x Hojas A4, 5x Bolígrafos negros",
            estado: "Pendiente",
        },
        {
            id: "SOL-004",
            colaborador: "Carlos Ruiz",
            fecha: "2023-10-23",
            detalle: "2x Marcadores permanentes, 1x Pizarra blanca",
            estado: "Pendiente",
        },
    ];

    /* -------------------- Estados de paginación -------------------- */

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

    /* -------------------- Render -------------------- */

    return (
        <div className="space-y-6">

            {/* Buscador */}
            <div className="flex w-full gap-4">
                {/* Input: 4 columnas */}
                <input
                    className="flex-[4] border border-gray-300 rounded-md px-3 py-2 text-sm outline-none"
                    placeholder="Buscar por Colaborador o ID..."
                />

                {/* Botón: 1 columna */}
                <div className="flex-[1] flex justify-end">
                    <button className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-100 flex items-center gap-2">
                        Filtrar por Fecha
                    </button>
                </div>
            </div>


            {/* Tabla */}
            <DataTable
                data={rows}
                columns={getColumns()}
                dataType="General2"
                rowPaddingY={12}
                rowBgClass="bg-white"
                showStatusBorder={false}
            />

            {/* -------------------- Paginación  -------------------- */}
            <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
