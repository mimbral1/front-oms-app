// views\FinanzasView\Reportes\NotasDeCredito\ReporteNotasDeCreditoView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";

/* ──────────────────────────────
   1 · Tipos
   ────────────────────────────── */
export interface NotaCredito {
    id: string;
    folio: string;
    rutCliente: string;
    nombreCliente: string;
    fecha: string;
    monto: string;
    creator: { username: string; email: string };
    estado: string;
}

/* ──────────────────────────────
   2 · Filtros
   ────────────────────────────── */
interface Filters {
    rut: string;
    nombre: string;
    folio: string;
    usuario: string;
    fechaRange: string; // JSON DateRange | ""
}

/* ──────────────────────────────
   3 · Columnas
   ────────────────────────────── */
const getColumns = (): Column<NotaCredito>[] => [
    { header: "ID Nota de Crédito", accessorKey: "id" },
    { header: "Folio", accessorKey: "folio" },
    { header: "RUT Cliente", accessorKey: "rutCliente" },
    { header: "Nombre Cliente", accessorKey: "nombreCliente" },
    { header: "Fecha", accessorKey: "fecha" },
    {
        header: "Monto",
        accessorKey: "monto",
        cell: (r) => (
            <span className="text-sm font-medium text-red-600">{r.monto}</span>
        ),
    },
    {
        header: "Usuario que la creó",
        accessorKey: "creator",
        cell: (r) =>
            r.creator.username !== "—" ? (
                <div className="flex items-center gap-2 text-sm">
                    <Avatar name={r.creator.username} />
                    <span className="truncate max-w-[140px]">
                        {r.creator.username}
                    </span>
                </div>
            ) : (
                <span className="text-gray-400">—</span>
            ),
    },
    {
        header: "Estado",
        accessorKey: "estado",
        cell: (r) => (
            <div
                className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${r.estado === "Abierta" ? "bg-green-500" : "bg-blue-500"
                    }`}
            >
                {r.estado}
            </div>
        ),
    },
];

/* ──────────────────────────────
   4 · Vista
   ────────────────────────────── */
export default function ReporteNotasDeCreditoView() {
    const router = useRouter();

    const [data, setData] = useState<NotaCredito[]>([]);
    const [filters, setFilters] = useState<Filters>({
        rut: "",
        nombre: "",
        folio: "",
        usuario: "",
        fechaRange: "",
    });

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* ──────────────────────────────
       Paginación (igual a SectoresPickingView)
    ────────────────────────────── */
    const PER_PAGE = 10;
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let result = data;
        if (filters.rut) result = result.filter(r => r.rutCliente.toLowerCase().includes(filters.rut.toLowerCase()));
        if (filters.nombre) result = result.filter(r => r.nombreCliente.toLowerCase().includes(filters.nombre.toLowerCase()));
        if (filters.folio) result = result.filter(r => r.folio.toLowerCase().includes(filters.folio.toLowerCase()));
        if (filters.usuario) result = result.filter(r => r.creator.username.toLowerCase().includes(filters.usuario.toLowerCase()));
        if (filters.fechaRange) {
            try {
                const range = JSON.parse(filters.fechaRange);
                const from = range.start ? new Date(range.start) : null;
                const to = range.end ? new Date(range.end + "T23:59:59") : null;
                result = result.filter(r => {
                    const d = new Date(r.fecha);
                    if (isNaN(d.getTime())) return false;
                    if (from && d < from) return false;
                    if (to && d > to) return false;
                    return true;
                });
            } catch { /* ignore */ }
        }
        return result;
    }, [data, filters]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    const shown = filtered.slice(
        (page - 1) * PER_PAGE,
        page * PER_PAGE
    );

    const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(n, max));

    /* ──────────────────────────────
       Filtros (MISMO PATRÓN)
       ────────────────────────────── */
    const filtersConfig = useMemo(
        () => [
            { id: "rut", label: "RUT cliente", type: "text" as const, value: filters.rut },
            { id: "nombre", label: "Nombre cliente", type: "text" as const, value: filters.nombre },
            { id: "folio", label: "Folio", type: "text" as const, value: filters.folio },
            { id: "usuario", label: "Usuario creador", type: "text" as const, value: filters.usuario },
            { id: "fechaRange", label: "Rango de fecha", type: "date-range" as const, value: filters.fechaRange },
        ],
        [filters]
    );

    const handleFilter = (id: string, value: string) =>
        setFilters((p) => ({ ...p, [id]: value }));

    /* ──────────────────────────────
       Mock load
       ────────────────────────────── */
    const load = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            setData([
                {
                    id: "NC-000145",
                    folio: "32456",
                    rutCliente: "12.345.678-9",
                    nombreCliente: "Juan Pérez González",
                    fecha: "2025-12-28",
                    monto: "-$145.990",
                    creator: { username: "csaavedra", email: "" },
                    estado: "Cerrada",
                },
                {
                    id: "NC-000146",
                    folio: "32457",
                    rutCliente: "76.835.178-3",
                    nombreCliente: "Constructora Andes SpA",
                    fecha: "2025-12-29",
                    monto: "-$89.500",
                    creator: { username: "finanzas01", email: "" },
                    estado: "Abierta",
                },
                {
                    id: "NC-000147",
                    folio: "32458",
                    rutCliente: "9.876.543-2",
                    nombreCliente: "María López Rojas",
                    fecha: "2025-12-30",
                    monto: "-$32.990",
                    creator: { username: "ecommerce_admin", email: "" },
                    estado: "Cerrada",
                },
                {
                    id: "NC-000148",
                    folio: "32459",
                    rutCliente: "77.112.456-1",
                    nombreCliente: "Transporte Sur Ltda",
                    fecha: "2025-12-31",
                    monto: "-$210.000",
                    creator: { username: "contabilidad", email: "" },
                    estado: "Abierta",
                },
            ]);
            setPage(1);

        } catch (e: any) {
            setErrorMessage("Error cargando reporte de notas de crédito.");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: () => exportToCsv("reporte_notas_credito.csv", []),
            },
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: load,
            },
        ],
        []
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Reporte de notas de crédito"
                filters={filtersConfig}
                onFilterChange={handleFilter}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                {loading ? (
                    <div className="overflow-x-auto border rounded-md bg-white">
                        <table className="min-w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="px-4 py-6 text-center text-gray-500">
                                        <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                        Cargando reporte…
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : errorMessage ? (
                    <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium">
                                    Error al cargar reporte
                                </h3>
                                <p className="mt-2 text-sm">{errorMessage}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <DataTable
                        data={shown}
                        columns={getColumns()}
                        dataType="ReporteNotasDeCredito"
                        statusKey="estado"
                        rowPaddingY={12}
                        rowBgClass="bg-white"
                    />
                )}
                {/* paginacion  */}
                <Pagination
                    currentPage={page}
                    totalRecords={filtered.length}
                    pageSize={PER_PAGE}
                    onPageChange={setPage}
                />

            </div>
        </div>
    );
}
