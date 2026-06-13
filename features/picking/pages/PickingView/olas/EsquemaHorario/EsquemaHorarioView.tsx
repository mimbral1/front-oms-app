// views\PickingView\olas\EsquemaHorario\EsquemaHorarioView.tsx
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { type Estado, getEstadoColor } from "@/utils/status";
import { useFetchWithAuthQA } from "@/lib/http/client";
import { Avatar } from "@/components/ui/user-avatar";
import { ClearFiltersButton } from "@/components/ui/clear-filters";

/* =========================
 * Tipos
 * ========================= */

interface EsquemaHorarioRow {
    id: string;
    name: string;
    windowsCount: number;   // Ventanas
    status: Estado;         // Activo / Inactivo
    createdAt: string;      // Fecha de cre.
    updatedAt: string;      // Modificado
    creatorName: string;    // Usuario creador
    creatorEmail: string;   // Email mostrado en “Usuario”
    creatorAvatar?: string; // (opcional)
}

interface WindowsSchemasResponse {
    ok: boolean;
    data: {
        page: number;
        pageSize: number;
        total: number;
        items: Array<{
            schema: {
                id: string;
                name: string;
                status: "active" | "inactive" | string;
                activeWindowsCount: number;
                dateCreatedCL?: string;
                dateModifiedCL?: string;
            };
            profiles?: {
                createdBy?: {
                    email?: string;
                    nombres?: string;
                    apellidos?: string;
                    urlImagenPerfil?: string;
                } | null;
            } | null;
        }>;
    };
}

/* =========================
 * Helpers UI
 * ========================= */
const getStatusPillClass = (s: string) =>
    getEstadoColor(s) + " text-white";

/* Columnas  */
const COLUMNS: Column<EsquemaHorarioRow>[] = [
    {
        header: "ID",
        accessorKey: "id",
        cell: (r) => (
            <CopyableText text={r.id} className="text-sm font-medium text-gray-900">
                {r.id}
            </CopyableText>
        ),
    },
    { header: "Nombre", accessorKey: "name" },
    { header: "Ventanas", accessorKey: "windowsCount" },
    {
        header: "Estado",
        accessorKey: "status",
        cell: (r) => (
            <span className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-medium ${getStatusPillClass(r.status)}`}>
                {r.status}
            </span>
        ),
    },
    { header: "Fecha de cre.", accessorKey: "createdAt" },
    { header: "Usuario creador", accessorKey: "creatorName" },
    { header: "Modificado", accessorKey: "updatedAt" },
    {
        header: "Usuario",
        accessorKey: "creatorEmail",
        cell: (r) => (
            <div className="flex items-center gap-3">
                <Avatar
                    name={r.creatorName || r.creatorEmail || "-"}
                    src={r.creatorAvatar || undefined}
                    alt={r.creatorName || r.creatorEmail || "-"}
                    className="h-8 w-8"
                />
                <div className="leading-tight">
                    <div className="text-sm font-medium">{r.creatorName}</div>
                    <div className="text-xs text-gray-500">{r.creatorEmail}</div>
                </div>
            </div>
        ),
    },
];

/* =========================
 * Filtros de PageHeader
 * ========================= */
type Filters = {
    id: string;        // texto (numérico)
    name: string;      // texto
    status: string;    // "", "1", "0"
    creator: string;   // texto (nombre o email exacto)
};

const buildFiltersConfig = (f: Filters) => [
    { id: "id", label: "ID", type: "text" as const, value: f.id },
    { id: "name", label: "Nombre", type: "text" as const, value: f.name },
    {
        id: "status",
        label: "Estado",
        type: "select" as const,
        value: f.status,
        options: [
            { label: "Todos", value: "" },
            { label: "Activo", value: "1" },
            { label: "Inactivo", value: "0" },
        ],
    },
    { id: "creator", label: "Usuario creador", type: "text" as const, value: f.creator },
];

/* =========================
 * Vista
 * ========================= */
export default function EsquemaHorarioView() {
    const router = useRouter();
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [filters, setFilters] = useState<Filters>({
        id: "",
        name: "",
        status: "",
        creator: "",
    });

    const [allRows, setAllRows] = useState<EsquemaHorarioRow[]>([]);
    const [rows, setRows] = useState<EsquemaHorarioRow[]>([]);
    const [loading, setLoading] = useState(true);

    /* ===== Paginación (consistente con tu estilo) ===== */
    const PER_PAGE = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const hasActiveFilters = useMemo(
        () => Object.values(filters).some((value) => value.trim() !== ""),
        [filters]
    );

    const handleClearFilters = useCallback(() => {
        setFilters({
            id: "",
            name: "",
            status: "",
            creator: "",
        });
        setCurrentPage(1);
    }, []);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    const fetchSchemas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuthQA<WindowsSchemasResponse>(
                "picking-service/windows/schemas?page=1&pageSize=200",
                { method: "GET" }
            );

            const mapped: EsquemaHorarioRow[] = (res?.data?.items || []).map((item) => {
                const creator = item.profiles?.createdBy;
                const creatorName = [creator?.nombres, creator?.apellidos]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                return {
                    id: item.schema.id,
                    name: item.schema.name,
                    windowsCount: Number(item.schema.activeWindowsCount ?? 0),
                    status: item.schema.status === "active" ? "Activo" : "Inactivo",
                    createdAt: item.schema.dateCreatedCL || "—",
                    updatedAt: item.schema.dateModifiedCL || "—",
                    creatorName: creatorName || "—",
                    creatorEmail: creator?.email || "—",
                    creatorAvatar: creator?.urlImagenPerfil || undefined,
                };
            });

            setAllRows(mapped);
        } catch (e) {
            console.error("Error cargando esquemas horarios:", e);
            setAllRows([]);
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuthQA]);

    const applyFilters = useCallback(() => {
        // filtros
        const filtered = allRows.filter((r) => {
            const passId = !filters.id || String(r.id).includes(filters.id.trim());
            const passName = !filters.name || r.name.toLowerCase().includes(filters.name.trim().toLowerCase());
            const passStatus =
                filters.status === ""
                    ? true
                    : filters.status === "1"
                        ? r.status === "Activo"
                        : r.status === "Inactivo";
            const passCreator =
                !filters.creator ||
                r.creatorName.toLowerCase().includes(filters.creator.trim().toLowerCase()) ||
                r.creatorEmail.toLowerCase().includes(filters.creator.trim().toLowerCase());

            return passId && passName && passStatus && passCreator;
        });

        // paginación
        const total = filtered.length;
        const totalPg = Math.max(1, Math.ceil(total / PER_PAGE));
        const page = clamp(currentPage, 1, totalPg);
        const start = (page - 1) * PER_PAGE;
        const pageRows = filtered.slice(start, start + PER_PAGE);

        setRows(pageRows);
        setTotalPages(totalPg);
        setTotalRecords(total);
        if (page !== currentPage) setCurrentPage(page);
    }, [allRows, filters, currentPage]);

    useEffect(() => {
        fetchSchemas();
    }, [fetchSchemas]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    /* Acciones de header */
    const handleExport = () => {
        const headers = [
            "ID",
            "Nombre",
            "Ventanas",
            "Estado",
            "Fecha de cre.",
            "Usuario creador",
            "Modificado",
            "Email creador",
        ];
        const data = rows.map((r) => [
            r.id,
            r.name,
            r.windowsCount,
            r.status,
            r.createdAt,
            r.creatorName,
            r.updatedAt,
            r.creatorEmail,
        ]);
        exportToCsv("esquemas-horarios.csv", [headers, ...data]);
    };

    const headerActions: Action[] = [
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/picking/olas/esquema-horario/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary",
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
        {
            label: "Actualizar",
            variant: "secondary",
            onClick: () => fetchSchemas(),
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Esquemas"
                action={headerActions}
                filters={buildFiltersConfig(filters)}
                filtersRight={
                    <ClearFiltersButton
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                    />
                }
                onFilterChange={(id, value) => {
                    // al cambiar filtros, volver a página 1
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <p>Cargando esquemas...</p>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={COLUMNS}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: EsquemaHorarioRow) =>
                                router.push(`/picking/olas/esquema-horario/${row.id}`)
                            }
                        />
                    )}

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

