// app/cuenta/acciones-masivas/documentos/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { StatusBadge } from "@/components/ui/badge/status";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";

/* ---------------------- Tipos + mocks (solo UI) ---------------------- */
type DocStatus = "Subido" | "Pendiente" | "Fallido";

interface DocumentoRow {
    id: string;
    service: string;       // Servicio (id)
    entity: string;        // Entidad
    entityId: string;      // ID Entidad
    templateCode: string;  // Código template
    createdAt: string;     // dd/mm/yyyy hh:mm
    status: DocStatus;     // Status
}

const MOCK: DocumentoRow[] = [
    {
        id: "1",
        service: "61b39f090f049d000…",
        entity: "Packing",
        entityId: "-",
        templateCode: "-",
        createdAt: "10/12/2021 15:40",
        status: "Subido",
    },
    {
        id: "2",
        service: "61b39cbc…",
        entity: "OMS (Order Management Service)",
        entityId: "61b39ca510c8d0b0…",
        templateCode: "order",
        createdAt: "10/12/2021 15:30",
        status: "Subido",
    },
];

/* ------------------------------ Columnas ------------------------------ */
const getColumns = (): Column<DocumentoRow>[] => [
    { header: "Servicio", accessorKey: "service" },
    { header: "Entidad", accessorKey: "entity" },
    { header: "ID Entidad", accessorKey: "entityId" },
    { header: "Código template", accessorKey: "templateCode" },
    { header: "Creación", accessorKey: "createdAt" },
    {
        header: "Status",
        accessorKey: "status",
        cell: (r) => (
            <StatusBadge
                status={r.status}
                variant={r.status === "Subido" ? "success" : r.status === "Pendiente" ? "warning" : "error"}
            />
        ),
    },
];

/* ----------------------------- Filtros header ----------------------------- */
// EXACTAMENTE: Servicio (select) · Entidad · ID Entidad · Código template · Fecha desde · Fecha hasta · Status (select)
type Filters = {
    servicio: string;
    entidad: string;
    idEntidad: string;
    templateCode: string;
    fechaDesde: string;
    fechaHasta: string;
    status: "" | DocStatus;
};

const initialFilters: Filters = {
    servicio: "",
    entidad: "",
    idEntidad: "",
    templateCode: "",
    fechaDesde: "",
    fechaHasta: "",
    status: "",
};

const STATUS_OPTIONS = [
    { label: "Status", value: "" },
    { label: "Subido", value: "Subido" },
    { label: "Pendiente", value: "Pendiente" },
    { label: "Fallido", value: "Fallido" },
];

const getServicioOptions = (rows: DocumentoRow[]) => [
    { label: "Servicio", value: "" },
    ...Array.from(new Set(rows.map((r) => r.service))).map((s) => ({ label: s, value: s })),
];

const getFiltersConfig = (
    f: Filters,
    servicioOptions: { label: string; value: string }[]
) => [
        { id: "servicio", label: "Servicio", type: "select" as const, value: f.servicio, options: servicioOptions },
        { id: "entidad", label: "Entidad", type: "text" as const, value: f.entidad },
        // { id: "idEntidad", label: "ID Entidad", type: "text" as const, value: f.idEntidad },
        { id: "templateCode", label: "Código template", type: "text" as const, value: f.templateCode },
        { id: "fechaDesde", label: "Fecha desde", type: "datetime" as const, value: f.fechaDesde },
        { id: "fechaHasta", label: "Fecha hasta", type: "datetime" as const, value: f.fechaHasta },
        { id: "status", label: "Status", type: "select" as const, value: f.status, options: STATUS_OPTIONS as any },
    ];

/* ------------------------------- Utils ------------------------------- */
const PER_PAGE = 20;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
const parseCL = (s: string) => {
    const [d, m, rest] = s.split("/");
    const [yy, time] = (rest || "").split(" ");
    const [hh = "00", mm = "00"] = (time || "").split(":");
    const dt = new Date(`${yy}-${m}-${d}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`);
    return isNaN(dt.getTime()) ? null : dt;
};

/* --------------------------------- Vista --------------------------------- */
export default function DocumentosView() {
    const router = useRouter();

    const [rows] = useState<DocumentoRow[]>(MOCK);
    const [filters, setFilters] = useState<Filters>(initialFilters);

    // paginación estilo SalesChannels
    const [currentPage, setCurrentPage] = useState(1);

    const servicioOptions = useMemo(() => getServicioOptions(rows), [rows]);
    const headerFilters = useMemo(
        () => getFiltersConfig(filters, servicioOptions),
        [filters, servicioOptions]
    );
    const columns = useMemo(() => getColumns(), []);

    const filtered = useMemo(() => {
        const q = {
            servicio: filters.servicio,
            entidad: filters.entidad.trim().toLowerCase(),
            idEntidad: filters.idEntidad.trim().toLowerCase(),
            templateCode: filters.templateCode.trim().toLowerCase(),
            status: filters.status,
            desde: filters.fechaDesde ? parseCL(filters.fechaDesde) : null,
            hasta: filters.fechaHasta ? parseCL(filters.fechaHasta) : null,
        };

        return rows.filter((r) => {
            const bySrv = !q.servicio || r.service === q.servicio;
            const byEnt = !q.entidad || r.entity.toLowerCase().includes(q.entidad);
            const byId = !q.idEntidad || r.entityId.toLowerCase().includes(q.idEntidad);
            const byTpl = !q.templateCode || r.templateCode.toLowerCase().includes(q.templateCode);
            const bySt = !q.status || r.status === q.status;
            let byDate = true;
            if (q.desde || q.hasta) {
                const d = parseCL(r.createdAt);
                byDate = !!d && (!q.desde || d >= q.desde) && (!q.hasta || d <= q.hasta);
            }
            return bySrv && byEnt && byId && byTpl && bySt && byDate;
        });
    }, [rows, filters]);

    // totales y corte
    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
    const start = (currentPage - 1) * PER_PAGE;
    const end = Math.min(currentPage * PER_PAGE, totalRecords);
    const shown = filtered.slice(start, end);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () => router.push("/cuenta/acciones-masivas/documentos/nuevo"),
            },
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: () =>
                    exportToCsv(
                        "documentos.csv",
                        shown.map((r) => ({
                            Servicio: r.service,
                            Entidad: r.entity,
                            "ID Entidad": r.entityId,
                            "Código template": r.templateCode,
                            Creación: r.createdAt,
                            Status: r.status,
                        }))
                    ),
            },
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: () => setFilters((f) => ({ ...f })),
            },
        ],
        [router, shown]
    );

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Documentos"
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    // reset de página al cambiar filtros (mismo patrón)
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value as any }));
                }}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="overflow-hidden rounded-xl shadow-sm">
                    <DataTable<DocumentoRow>
                        data={shown}
                        columns={columns}
                        dataType="General2"
                        statusKey="status"
                        rowPaddingY={20}
                        rowBgClass="bg-white"
                        onRowClick={(row) => router.push(`/cuenta/acciones-masivas/documentos/${encodeURIComponent(row.id)}`)}
                    />
                </div>

                {/* Paginación estilo SalesChannels */}
                <Pagination
                    currentPage={currentPage}
                    totalRecords={totalRecords}
                    pageSize={PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
            </div>
        </div>
    );
}
