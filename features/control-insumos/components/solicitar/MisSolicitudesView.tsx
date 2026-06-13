// views\ControlInsumos\Solicitar\components\MisSolicitudesView.tsx
"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { EyeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* ----------------------------
   Tipo de fila (mock)
----------------------------- */
interface SolicitudRow {
    id: string;
    fecha: string;
    estado: "Aprobada" | "Pendiente" | "Rechazada";
    detalle: string;
    motivo: string;
}

/* ----------------------------
   Estado (pill)
----------------------------- */
const getStatusColor = (estado: SolicitudRow["estado"]) => {
    switch (estado) {
        case "Aprobada":
            return "bg-green-500";
        case "Pendiente":
            return "bg-yellow-500";
        case "Rechazada":
            return "bg-red-500";
        default:
            return "bg-gray-400";
    }
};

const EstadoPill = ({ estado }: { estado: SolicitudRow["estado"] }) => (
    <span
        className={`
            inline-flex items-center justify-center 
            rounded-full px-3 py-1 
            text-xs font-medium text-white
            ${getStatusColor(estado)}
        `}
    >
        {estado}
    </span>
);

/* ----------------------------
   Columnas del DataTable
----------------------------- */
function getColumns(onView: (id: string) => void): Column<SolicitudRow>[] {
    return [
        { header: "ID Solicitud", accessorKey: "id", cell: (r) => <CopyableText text={r.id}>{r.id}</CopyableText> },
        { header: "Fecha Creación", accessorKey: "fecha" },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (row) => <EstadoPill estado={row.estado} />,
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
                    type="button"
                    onClick={() => onView(row.id)}
                    className="inline-flex items-center justify-center p-1 hover:bg-gray-100 rounded-md"
                >
                    <EyeIcon className="h-5 w-5 text-gray-600" />
                </button>
            ),
        },
    ];
}

/* ----------------------------
   PAGINACIÓN 
----------------------------- */

const PER_PAGE = 20;

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

/* ----------------------------
   Componente principal
----------------------------- */
export default function MisSolicitudesView() {
    const router = useRouter();

    const rows: SolicitudRow[] = [
        {
            id: "REQ001",
            fecha: "2023-10-26",
            estado: "Aprobada",
            detalle: "5 lápices, 2 cuadernos, 1 caja de clips",
            motivo:
                "Suministros de oficina para nuevo proyecto de diseño de interfaz.",
        },
        {
            id: "REQ002",
            fecha: "2023-10-25",
            estado: "Pendiente",
            detalle: "1 monitor externo, 1 teclado ergonómico",
            motivo:
                "Actualización de puesto de trabajo para mejorar productividad.",
        },
        {
            id: "REQ003",
            fecha: "2023-10-24",
            estado: "Rechazada",
            detalle: "1 impresora 3D, 2 bobinas de filamento",
            motivo:
                "Propuesta rechazada por presupuesto excedido y espacio insuficiente.",
        },
        {
            id: "REQ004",
            fecha: "2023-10-23",
            estado: "Aprobada",
            detalle: "100 hojas A4, 3 cartuchos de tinta",
            motivo:
                "Mantenimiento rutinario para asegurar impresión interna del equipo.",
        },
        {
            id: "REQ005",
            fecha: "2023-10-22",
            estado: "Pendiente",
            detalle: "2 cajas de bolígrafos de gel, 1 perforadora",
            motivo:
                "Reposición de insumos para recepción y atención a visitantes.",
        },
        {
            id: "REQ006",
            fecha: "2023-10-21",
            estado: "Aprobada",
            detalle: "1 proyector, cables HDMI y VGA",
            motivo:
                "Equipamiento para sala de reuniones para mejorar presentaciones.",
        },
        {
            id: "REQ007",
            fecha: "2023-10-20",
            estado: "Rechazada",
            detalle: "Software de edición de video (licencia anual)",
            motivo:
                "Existe solución alternativa interna, solicitud rechazada por presupuesto.",
        },
    ];

    /* Navegación al detalle */
    const handleView = useCallback(
        (id: string) => {
            router.push(`/control-insumos/mis-solicitudes/${id}`);
        },
        [router]
    );

    const headerActions = useMemo<Action[]>(() => [
        {
            label: "Actualizar",
            variant: "secondary",
            icon: <ArrowPathIcon className="h-5 w-5" />,
            onClick: () => window.location.reload(),
        },
    ], []);

    const columns = useMemo(() => getColumns(handleView), [handleView]);

    /* ----------------------------
       PAGINACIÓN STATE
    ----------------------------- */

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

    /* ----------------------------
       PageHeader
    ----------------------------- */
    usePageHeader(
        () =>
        ({
            title: "Mis solicitudes",
            description: "Aquí puedes revsar el estado y el historial de todas tus solicitudes de insumos",
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="flex-1 space-y-6">
            {/* <div className="rounded-xl shadow-sm overflow-hidden"> */}
            <div className="">
                <DataTable<SolicitudRow>
                    data={shownRows}
                    columns={columns}
                    dataType="General2"
                    rowPaddingY={12}
                    rowBgClass="bg-white"
                    showStatusBorder={false}
                />
            </div>

            {/* ----------------------- PAGINACIÓN ----------------------- */}
            <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
