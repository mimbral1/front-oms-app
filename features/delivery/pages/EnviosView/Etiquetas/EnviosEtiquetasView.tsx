// app/views/Envios/Detalle/Tabs/EnviosEtiquetasView.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/table";
import { type Estado, getEstadoColor } from "@/utils/status";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowDownTrayIcon,
    CloudArrowDownIcon,
} from "@heroicons/react/24/outline";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";

/* ────────────────────────────────────────────────────────────
   Tab "Etiquetas" dentro del detalle de Envío (solo listado)
   ──────────────────────────────────────────────────────────── */

interface EtiquetaRow {
    refId: string;
    formato: "pdf" | string;
    linkLabel: string;
    createdAt: string;   // dd/MM/yyyy HH:mm
    updatedAt: string;   // dd/MM/yyyy HH:mm
    acciones: string;
    status: Estado;
}

/* Chip estado (verde = Activo) */
const getStatusColor = getEstadoColor;
const StatusPill = ({ status }: { status: Estado }) => (
    <div
        className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
            status
        )}`}
    >
        {status}
    </div>
);

/* Chip formato (pdf) */
const Chip = ({ text }: { text: string }) => (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700">
        {text}
    </span>
);

function getColumns(): Column<EtiquetaRow>[] {
    return [
        { header: "Ref ID", accessorKey: "refId" },
        {
            header: "Formato",
            accessorKey: "formato",
            cell: (r) => <Chip text={r.formato} />,
        },
        {
            header: "Link",
            accessorKey: "linkLabel",
            cell: (r) => (
                <a
                    href="#"
                    className="text-blue-600 hover:underline"
                    onClick={(e) => e.preventDefault()}
                    title="Ver etiqueta"
                >
                    {r.linkLabel}
                </a>
            ),
        },
        { header: "Creación", accessorKey: "createdAt" },
        { header: "Modificado", accessorKey: "updatedAt" },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => <StatusPill status={r.status} />,
        },
        { header: "Acciones", accessorKey: "acciones" }, // vacío (como en la imagen)
    ];
}

const PER_PAGE = 60;

export default function EnviosEtiquetasView() {
    const { id } = useParams(); // id del envío
    const columns = useMemo(() => getColumns(), []);

    // Mock idéntico a la captura: 1 fila
    const [rows] = useState<EtiquetaRow[]>([
        {
            refId: "-",
            formato: "pdf",
            linkLabel: "Ver etiqueta",
            createdAt: "28/07/2021 17:05",
            updatedAt: "16/08/2022 11:50",
            status: "Activo",
            acciones: "",
        },
    ]);

    /* Acciones del PageHeader
       - Exportar: habilitado (azul)
       - Aplicar / Guardar / Guardar & Crear nuevo: deshabilitadas
       - Cancelar: vuelve atrás
    */
    const handleExport = () => {
        const headers = ["Ref ID", "Formato", "Link", "Creación", "Modificado", "Status"];
        const data = rows.map((r) => [r.refId, r.formato, r.linkLabel, r.createdAt, r.updatedAt, r.status]);
        exportToCsv("etiquetas-envio.csv", [headers, ...data]);
    };

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Exportar", variant: "primary" as const, onClick: () => console.log("Exportar"), icon: <CloudArrowDownIcon className="h-5 w-5" /> },
            { label: "Aplicar", variant: "success", disabled: true, icon: <CheckCircleIcon className="h-5 w-5" /> },
            { label: "Guardar", variant: "success", disabled: true, icon: <ArrowDownTrayIcon className="h-5 w-5" /> },
            { label: "Volver al listado", variant: "secondary", onClick: () => history.back(), icon: <XCircleIcon className="h-5 w-5" /> },
        ],
        [rows]
    );

    usePageHeader(
        () =>
        ({
            title: `Entrega ${String(id)}`,
            action: headerActions,
            status: { text: "Activo", variant: "success" }, // chip verde como en la imagen
        } as PageHeaderProps),
        [id, headerActions]
    );

    /* Paginación (con 1 ítem queda fija en 1) */
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const safePage = clamp(page, 1, totalPages);
    const startIdx = (safePage - 1) * PER_PAGE;
    const endIdx = Math.min(startIdx + PER_PAGE, rows.length);
    const shown = rows.slice(startIdx, endIdx);

    return (
        <div className="flex-1">
            <div className="rounded-xl shadow-sm overflow-hidden pt-5">
                <DataTable<EtiquetaRow>
                    data={shown}
                    columns={columns}
                    dataType="General2"
                    rowPaddingY={12}
                    showStatusBorder
                    rowBgClass="bg-white"
                />
            </div>
            {/* paginación */}
            <Pagination
                currentPage={page}
                totalRecords={rows.length}
                pageSize={PER_PAGE}
                onPageChange={setPage}
            />
        </div>
    );
}
