// views\ControlInsumos\Aprobaciones\components\HistorialAprobacionesView.tsx
"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/table";
import { EyeIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

interface HistorialRow {
    id: string;
    fecha: string;
    estado: "Aprobada" | "Rechazada";
    detalle: string;
    motivo: string;
}

/* -------------------- Helpers  -------------------- */

const PER_PAGE = 20;

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

/* -------------------- Pill de estado -------------------- */

const getStatusColor = (estado: HistorialRow["estado"]) =>
    estado === "Aprobada" ? "bg-green-500" : "bg-red-500";

const EstadoPill = ({ estado }: { estado: HistorialRow["estado"] }) => (
    <span
        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-white ${getStatusColor(
            estado
        )}`}
    >
        {estado}
    </span>
);

/* -------------------- Columnas -------------------- */

function getColumns(onView: (id: string) => void): Column<HistorialRow>[] {
    return [
        { header: "ID Solicitud", accessorKey: "id" },
        { header: "Fecha", accessorKey: "fecha" },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (r) => <EstadoPill estado={r.estado} />,
        },
        {
            header: "Detalle",
            accessorKey: "detalle",
            cell: (r) => (
                <div className="max-w-[300px] whitespace-pre-wrap">{r.detalle}</div>
            ),
        },
        {
            header: "Motivo / Observaciones",
            accessorKey: "motivo",
            cell: (r) => (
                <div className="max-w-[380px] whitespace-pre-wrap">{r.motivo}</div>
            ),
        },
        {
            header: "Acciones",
            accessorKey: "estado",
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

/* -------------------- Vista principal -------------------- */

export default function HistorialAprobacionesView() {
    const router = useRouter();

    const rows: HistorialRow[] = [
        {
            id: "SOL-010",
            fecha: "2023-10-20",
            estado: "Aprobada",
            detalle: "10x lápices, 2x archivadores",
            motivo: "Compra autorizada por requerimiento del equipo.",
        },
        {
            id: "SOL-011",
            fecha: "2023-10-18",
            estado: "Rechazada",
            detalle: "1x impresora térmica",
            motivo: "No corresponde al presupuesto del área.",
        },
    ];

    /* -------------------- Navegación detalle -------------------- */

    const handleView = useCallback(
        (id: string) => router.push(`/control-insumos/aprobaciones/${id}`),
        [router]
    );

    const columns = useMemo(() => getColumns(handleView), [handleView]);

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

            <DataTable
                data={shownRows}
                columns={columns}
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
