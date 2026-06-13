// views\MonitoreoView\AdmModulosEndpoints\AdmModulosEndpointsView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";

/* ================== Tipos API ================== */
type ApiModulo = {
    MODULO_ID: number;
    MODULO_NOMBRE: string;
    MODULO_DESCRIPCION: string;
    PLATAFORMA_ID: number;
    PLATAFORMA_NOMBRE: string;
    CANTIDAD_SUBMODULOS: number;
    ESTADO: string; // "ACTIVO" | "INACTIVO" 
};

type ApiListResponse = {
    ok: boolean;
    total: number;
    data: ApiModulo[];
};

/* ================== Tipos UI ================== */
type Estado = "Activa" | "Inactiva";
interface ModuloRow {
    id: number;
    nombre: string;
    descripcion: string;
    submodulos: number;
    plataforma: string;
    estado: Estado;
}

/* ================== Helpers ================== */
const PER_PAGE = 20;
const getStatusPill = (s: Estado) => (
    <span
        className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${s === "Activa" ? "bg-green-500" : "bg-gray-400"
            }`}
    >
        {s}
    </span>
);

function getColumns(): Column<ModuloRow>[] {
    return [
        { header: "Nombre del Módulo", accessorKey: "nombre" },
        { header: "Descripción", accessorKey: "descripcion" },
        { header: "Submódulos", accessorKey: "submodulos" },
        { header: "Plataforma", accessorKey: "plataforma" },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (r) => getStatusPill(r.estado),
        },
    ];
}

/* ================== Página ================== */
export default function AdmModulosEndpointsView() {
    const router = useRouter();
    const { token } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const columns = useMemo(() => getColumns(), []);

    // data
    const [rows, setRows] = useState<ModuloRow[]>([]);
    const [loading, setLoading] = useState(true);

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // para filtro de modulos 
    const [moduleOptions, setModuleOptions] = useState<{ label: string; value: string }[]>([]);
    const [moduleSearchQuery, setModuleSearchQuery] = useState("");

    // filtros (UI)
    interface Filters {
        moduleId: string; // "", "5", "1", ...
        status: string;   // "", "1", "0"
    }
    const [filters, setFilters] = useState<Filters>({ moduleId: "", status: "" });


    useEffect(() => {
        let mounted = true;
        const loadModules = async () => {
            try {
                // GET /idservice/modulos  -> [{ ID, NOMBRE, CODIGO }]
                const res = await fetchWithAuth<any[]>("idservice/modulos");
                if (!mounted) return;
                const options =
                    Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
                setModuleOptions(
                    options.map((m: any) => ({
                        // usa el label que prefieras: sólo nombre, o "NOMBRE (CODIGO)"
                        // label: String(m?.NOMBRE ?? `#${m?.ID ?? ""}`),
                        label: [m?.NOMBRE, m?.CODIGO].filter(Boolean).join(" (") + (m?.CODIGO ? ")" : ""),
                        value: String(m?.ID ?? ""),
                    }))
                );
            } catch {
                setModuleOptions([]);
            }
        };
        loadModules();
        return () => { mounted = false; };
    }, [fetchWithAuth]);

    // fetch listado (GET /idservice/modulos/get)
    const fetchList = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetchWithAuth<ApiListResponse>("idservice/modulos/get");
            const data = Array.isArray(res?.data) ? res.data : [];

            const mapped: ModuloRow[] = data.map((m) => ({
                id: m.MODULO_ID,
                nombre: m.MODULO_NOMBRE ?? "",
                descripcion: m.MODULO_DESCRIPCION ?? "",
                submodulos: Number(m.CANTIDAD_SUBMODULOS ?? 0),
                plataforma: m.PLATAFORMA_NOMBRE ?? "",
                estado: (m.ESTADO || "").toUpperCase() === "ACTIVO" ? "Activa" : "Inactiva",
            }));

            // --- filtros en cliente ---
            const byModule =
                !filters.moduleId ? mapped : mapped.filter((r) => String(r.id) === filters.moduleId);

            const byStatus =
                filters.status === ""
                    ? byModule
                    : byModule.filter((r) =>
                        filters.status === "1" ? r.estado === "Activa" : r.estado === "Inactiva"
                    );

            setTotalRecords(byStatus.length);
            setTotalPages(Math.max(1, Math.ceil(byStatus.length / PER_PAGE)));

            const start = (currentPage - 1) * PER_PAGE;
            const end = start + PER_PAGE;
            setRows(byStatus.slice(start, end));
        } catch {
            setRows([]);
            setTotalRecords(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [token, fetchWithAuth, filters.moduleId, filters.status, currentPage]);


    useEffect(() => {
        fetchList();
    }, [fetchList]);

    // header actions
    const handleExport = useCallback(() => {
        const headers = ["Nombre del Módulo", "Descripción", "Submódulos", "Plataforma", "Estado"];
        const data = rows.map((r) => [r.nombre, r.descripcion, r.submodulos, r.plataforma, r.estado]);
        exportToCsv("modulos_endpoints.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: handleExport,
            },
            {
                label: "Módulo",
                variant: "success",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () => {
                    router.push("/monitoreo/adm-modulos-endpoints/nuevo");
                },
            },
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: () => fetchList(),
            },
        ],
        [router, handleExport, fetchList]
    );

    // header filters (moduleId select-search + status)
    const headerFilters = useMemo(
        () => {
            const filteredModules =
                moduleOptions.length === 0
                    ? [{ label: "Todos los módulos", value: "" }]
                    : [
                        { label: "Todos los módulos", value: "" },
                        ...moduleOptions.filter((o) =>
                            (o.label + " " + o.value)
                                .toLowerCase()
                                .includes(moduleSearchQuery.toLowerCase())
                        ),
                    ];

            return [
                {
                    id: "moduleId",
                    label: "Módulo",
                    type: "select-search" as const,
                    value: filters.moduleId,
                    options: filteredModules,
                    onSearch: setModuleSearchQuery,
                    searchQuery: moduleSearchQuery,
                },
                {
                    id: "status",
                    label: "Estado",
                    type: "select" as const,
                    value: filters.status,
                    options: [
                        { label: "Todos", value: "" },
                        { label: "Activa", value: "1" },
                        { label: "Inactiva", value: "0" },
                    ],
                },
            ];
        },
        [filters.moduleId, filters.status, moduleOptions, moduleSearchQuery]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Administración de Módulos y Endpoints"
                description="Editar desde el Front: URL del Front y Endpoint + Permisos en una sola regla."
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />

            <div className="flex-1 pt-3 pr-6 pl-6 pb-6">
                <div className="space-y-6">
                    {loading ? (
                        <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="AdmModEnd"
                            statusKey="estado"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: ModuloRow) =>
                                router.push(`/monitoreo/adm-modulos-endpoints/${row.id}`)
                            }
                        />
                    )}


                    {/* Paginación  */}
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
