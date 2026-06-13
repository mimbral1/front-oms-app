// views\PedidosView\Configuraciones\PerfilesImportacion\PerfilesImportacion.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* ---------- Tipos UI ---------- */
type Estado = "Activo" | "Inactivo";

interface PerfilImportacionRow {
    id: number;
    nombre: string;
    codigo: string;
    estado: Estado;
    importar: boolean;
    sincronizar: boolean;
    prioridad: "P1" | "P2" | "P3";
    cuentas: string;
    canales: string;
    tiposEnvio: string;
    ultimaActualizacion: string;
}

/* ---------- Helpers UI ---------- */
const PER_PAGE = 20;

const getStatusColor = (s: Estado) =>
    s === "Activo" ? "bg-green-500" : "bg-red-500";

const getPriorityColor = (p: string) =>
    p === "P1" ? "bg-green-500"
        : p === "P2" ? "bg-yellow-500"
            : "bg-gray-500";

const ToggleMock = ({ on }: { on: boolean }) => (
    <div
        className={`inline-flex h-6 w-12 items-center rounded-full transition-colors ${on ? "bg-blue-600" : "bg-gray-300"}`}
    >
        <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
        />
    </div>
);

/* ---------- Columnas ---------- */
function getColumns(): Column<PerfilImportacionRow>[] {
    return [
        {
            header: "Nombre",
            accessorKey: "nombre",
            cell: (r) => (
                <div className="flex flex-col w-[360px]">
                    <span>{r.nombre}</span>
                    <span className="text-xs text-gray-500">{r.codigo}</span>
                </div>
            ),
        },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (r) => {
                const isActive = r.estado === "Activo";

                const bg = isActive ? "bg-green-100" : "bg-red-100";
                const text = isActive ? "text-green-700" : "text-red-700";
                const dot = isActive ? "bg-green-500" : "bg-red-500";

                return (
                    <div className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full ${bg} ${text} text-xs font-medium`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                        {r.estado}
                    </div>
                );
            },
        },
        {
            header: "Importar",
            accessorKey: "importar",
            cell: (r) => {
                const on = r.importar;
                return (
                    <div className="inline-flex items-center gap-2">
                        <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-blue-600" : "bg-gray-300"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-1"
                                    }`}
                            />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{on ? "Sí" : "No"}</span>
                    </div>
                );
            },
        },
        {
            header: "Sincronizar",
            accessorKey: "sincronizar",
            cell: (r) => {
                const on = r.sincronizar;
                return (
                    <div className="inline-flex items-center gap-2">
                        <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-blue-600" : "bg-gray-300"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-1"
                                    }`}
                            />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{on ? "Sí" : "No"}</span>
                    </div>
                );
            },
        },
        {
            header: "Prioridad",
            accessorKey: "prioridad",
            cell: (r) => {
                const colors = {
                    P1: { dot: "bg-green-500", bg: "bg-green-100", text: "text-green-700" },
                    P2: { dot: "bg-yellow-500", bg: "bg-yellow-100", text: "text-yellow-700" },
                    P3: { dot: "bg-gray-600", bg: "bg-gray-200", text: "text-gray-700" },
                };

                const c = colors[r.prioridad];

                return (
                    <div className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full ${c.bg} ${c.text} text-xs font-semibold`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                        {r.prioridad}
                    </div>
                );
            },
        },

        { header: "Cuentas", accessorKey: "cuentas" },
        { header: "Canales", accessorKey: "canales" },
        { header: "Tipos de envío", accessorKey: "tiposEnvio" },
        { header: "Última actualización", accessorKey: "ultimaActualizacion" },
    ];
}

/* ---------- Mocks desde la imagen ---------- */
const MOCK_ROWS: PerfilImportacionRow[] = [
    {
        id: 1,
        nombre: "VTEX B2C – Delivery pagado",
        codigo: "VTEX-B2C-DELIVERY",
        estado: "Activo",
        importar: true,
        sincronizar: true,
        prioridad: "P1",
        cuentas: "VTEX-B2C",
        canales: "WEB-B2C, MOBILE-APP",
        tiposEnvio: "DELIVERY, SCHEDULED_DELIVERY",
        ultimaActualizacion: "2025-11-20 10:32",
    },
    {
        id: 2,
        nombre: "VTEX – Retiro en tienda",
        codigo: "VTEX-PICKUP-STORE",
        estado: "Activo",
        importar: true,
        sincronizar: false,
        prioridad: "P2",
        cuentas: "VTEX-B2C",
        canales: "WEB-B2C",
        tiposEnvio: "PICKUP_IN_STORE",
        ultimaActualizacion: "2025-11-18 16:05",
    },
    {
        id: 3,
        nombre: "Mercado Libre Full – Sólo lectura",
        codigo: "ML-FULL",
        estado: "Inactivo",
        importar: false,
        sincronizar: true,
        prioridad: "P3",
        cuentas: "MERCADO-LIBRE-FULL",
        canales: "ML-MARKETPLACE",
        tiposEnvio: "DELIVERY",
        ultimaActualizacion: "2025-11-10 09:14",
    },
    {
        id: 4,
        nombre: "B2B – Pedidos empresa",
        codigo: "B2B-EMPRESA",
        estado: "Activo",
        importar: true,
        sincronizar: true,
        prioridad: "P1",
        cuentas: "PORTAL-EMPRESAS",
        canales: "WEB-B2B",
        tiposEnvio: "DELIVERY, CUSTOM",
        ultimaActualizacion: "2025-11-22 18:47",
    },
];

/* ---------- Filtros ---------- */
interface Filters {
    name: string;
    estado: string;
    prioridad: string;
}

const getFiltersConfig = (f: Filters) => [
    { id: "name", label: "Nombre", type: "text" as const, value: f.name },
    {
        id: "estado",
        label: "Estado",
        type: "select" as const,
        value: f.estado,
        options: [
            { label: "Todos", value: "" },
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
    },
    {
        id: "prioridad",
        label: "Prioridad",
        type: "select" as const,
        value: f.prioridad,
        options: [
            { label: "Todas", value: "" },
            { label: "P1", value: "P1" },
            { label: "P2", value: "P2" },
            { label: "P3", value: "P3" },
        ],
    },
];

/* ---------- Página ---------- */
export default function PerfilesImportacionView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);

    const [rows] = useState(MOCK_ROWS);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<Filters>({
        name: "",
        estado: "",
        prioridad: "",
    });

    const filtered = rows.filter((r) => {
        const byName = !filters.name || r.nombre.toLowerCase().includes(filters.name.toLowerCase());
        const byEstado = !filters.estado || r.estado === filters.estado;
        const byPrio = !filters.prioridad || r.prioridad === filters.prioridad;
        return byName && byEstado && byPrio;
    });

    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
    const pageStart = (currentPage - 1) * PER_PAGE;
    const pageRows = filtered.slice(pageStart, pageStart + PER_PAGE);

    const handleExport = () => {
        const headers = [
            "Nombre",
            "Estado",
            "Importar",
            "Sincronizar",
            "Prioridad",
            "Cuentas",
            "Canales",
            "Tipos de envío",
            "Última actualización",
        ];
        const data = filtered.map((r) => [
            r.nombre,
            r.estado,
            r.importar ? "Sí" : "No",
            r.sincronizar ? "Sí" : "No",
            r.prioridad,
            r.cuentas,
            r.canales,
            r.tiposEnvio,
            r.ultimaActualizacion,
        ]);

        exportToCsv("perfiles-importacion.csv", [headers, ...data]);
    };

    const headerActions: Action[] = [
        {
            label: "Nuevo",
            variant: "success",
            icon: <PlusIcon className="h-5 w-5" />,
            onClick: () => router.push("/pedidos/configuraciones/perfiles-importacion/nuevo"),
        },
        {
            label: "Exportar",
            variant: "primary",
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            onClick: handleExport,
        },
        {
            label: "Actualizar",
            variant: "secondary",
            icon: <ArrowPathIcon className="h-5 w-5" />,
            onClick: () => { },
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Perfiles de Importación"
                description="Define qué órdenes se pueden importar y sincronizar desde cada cuenta, seller y tipo de envío"
                action={headerActions}
                filters={getFiltersConfig(filters)}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <DataTable
                        data={pageRows}
                        columns={columns}
                        dataType="General2"
                        statusKey="estado"
                        rowPaddingY={12}
                        showStatusBorder
                        rowBgClass="bg-white"
                        onRowClick={(row) => router.push(`/pedidos/configuraciones/perfiles-importacion/${row.id}`)}
                    />

                    {/* Paginación */}
                    <Pagination
                        currentPage={currentPage}
                        totalRecords={totalRecords}
                        pageSize={PER_PAGE}
                        onPageChange={setCurrentPage}
                      />
                </div>
            </div>
        </div>
    );
}
