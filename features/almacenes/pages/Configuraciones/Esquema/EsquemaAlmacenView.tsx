// views\Almacen\Configuraciones\Esquema\EsquemaAlmacenView.tsx
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { type Estado, getEstadoColor } from "@/utils/status";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { getPickingOrderLabel } from "@/features/almacenes/components/configuraciones/esquema/EsquemaAlmacenFields";

interface Usuario {
    name: string;
    email?: string;
    initials: string;
}

interface EsquemaRow {
    id: string;
    nombre: string;
    pickingOrder: string;
    niveles: string[];
    createdAt: string;
    createdBy?: Usuario;
    updatedAt?: string;
    updatedBy?: Usuario;
    status: Estado;
}

interface Filters {
    search: string;
    isActive: string;
    pickingOrder: string;
    nivel: string;
}

type ApiSchemaRow = {
    id?: string | null;
    name?: string | null;
    pickingOrder?: string | null;
    levels?: string[] | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
};

const PER_PAGE = 20;
const getStatusColor = getEstadoColor;
const SCHEMA_URL = `${BASE_WAREHOUSES}/schema`;

const initialFilters: Filters = {
    search: "",
    isActive: "",
    pickingOrder: "",
    nivel: "",
};

const filterConfig: FilterConfig<Filters, EsquemaRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        rowValue: (row) => row.nombre,
    },
    {
        id: "pickingOrder",
        label: "Orden de picking",
        type: "select",
        options: [
            { label: getPickingOrderLabel("storedGoods"), value: "storedGoods" },
            { label: getPickingOrderLabel("skuPositions"), value: "skuPositions" },
            { label: getPickingOrderLabel("categories"), value: "categories" },
            { label: getPickingOrderLabel("skuPositionsThenCategories"), value: "skuPositionsThenCategories" },
        ],
        rowValue: (row) => row.pickingOrder,
    },
    {
        id: "nivel",
        label: "Nivel",
        type: "text",
        placeholder: "Buscar nivel (ej. Sector 1, Dock, A, B, C...)",
        rowValue: (row) => row.niveles,
    },
    {
        id: "isActive",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
        rowValue: (row) => row.status,
        parse: (rawValue) => {
            if (rawValue === "1") return "Activo";
            if (rawValue === "0") return "Inactivo";
            return rawValue;
        },
    },
];

const Pill = ({ text }: { text: string }) => (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
        {text}
    </span>
);

const AvatarUser = ({ user }: { user?: Usuario }) =>
    !user ? (
        <span className="text-sm text-gray-400">--</span>
    ) : (
        <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-300 text-xs font-bold text-white">
                {user.initials}
            </div>
            <div className="leading-tight">
                <div className="text-sm text-gray-900">{user.name}</div>
                {user.email ? <div className="max-w-[180px] truncate text-xs text-gray-500">{user.email}</div> : null}
            </div>
        </div>
    );

function getColumns(): Column<EsquemaRow>[] {
    return [
        { header: "Nombre", accessorKey: "nombre" },
        {
            header: "Orden de picking",
            accessorKey: "pickingOrder",
            cell: (row) => (
                <span className="text-xs font-medium tracking-wide">{getPickingOrderLabel(row.pickingOrder)}</span>
            ),
        },
        {
            header: "Niveles",
            accessorKey: "niveles",
            cell: (row) => (
                <div className="flex flex-col items-start gap-2">
                    {row.niveles.map((nivel, index) => (
                        <Pill key={index} text={nivel} />
                    ))}
                </div>
            ),
        },
        { header: "Fecha de creacion", accessorKey: "createdAt" },
        {
            header: "Usuario creador",
            accessorKey: "createdBy",
            cell: (row) => <AvatarUser user={row.createdBy} />,
        },
        { header: "Modificado", accessorKey: "updatedAt" },
        {
            header: "Usuario",
            accessorKey: "updatedBy",
            cell: (row) => <AvatarUser user={row.updatedBy} />,
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => (
                <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(row.status)}`}>
                    {row.status}
                </div>
            ),
        },
    ];
}

const toInitials = (name?: string | null) => {
    const safe = String(name || "").trim();
    if (!safe) return "--";
    const parts = safe.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const formatDate = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const mapStatus = (status?: string | null): Estado =>
    String(status || "").toLowerCase() === "active" ? "Activo" : "Inactivo";

export default function EsquemaAlmacenView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [allRows, setAllRows] = useState<EsquemaRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, EsquemaRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);

            const response = await fetch(SCHEMA_URL, {
                method: "GET",
                headers: withAuthPlatformHeaders(),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || `HTTP ${response.status}`);
            }

            const data = (await response.json()) as ApiSchemaRow[];
            const mapped: EsquemaRow[] = (Array.isArray(data) ? data : []).map((row) => ({
                id: String(row.id || ""),
                nombre: String(row.name || "-"),
                pickingOrder: String(row.pickingOrder || "-"),
                niveles: Array.isArray(row.levels) ? row.levels.map((level) => String(level)) : [],
                createdAt: formatDate(row.dateCreated),
                createdBy: row.userCreated
                    ? { name: String(row.userCreated), email: "", initials: toInitials(row.userCreated) }
                    : undefined,
                updatedAt: formatDate(row.dateModified),
                updatedBy: row.userModified
                    ? { name: String(row.userModified), email: "", initials: toInitials(row.userModified) }
                    : undefined,
                status: mapStatus(row.status),
            }));

            setAllRows(mapped);
            setCurrentPage(1);
        } catch (error: unknown) {
            setAllRows([]);
            setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar el listado de esquemas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const filteredRows = useMemo(() => applyFilters(allRows), [allRows, applyFilters]);
    const rows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, filteredRows.length]);

    const handleExport = useCallback(() => {
        const headers = [
            "Nombre",
            "Orden de picking",
            "Niveles",
            "Fecha de creacion",
            "Usuario creador",
            "Modificado",
            "Usuario",
            "Estado",
        ];
        const data = filteredRows.map((row) => [
            row.nombre,
            getPickingOrderLabel(row.pickingOrder),
            row.niveles.join("-"),
            row.createdAt || "--",
            row.createdBy ? `${row.createdBy.name} <${row.createdBy.email ?? ""}>` : "--",
            row.updatedAt || "--",
            row.updatedBy ? `${row.updatedBy.name} <${row.updatedBy.email ?? ""}>` : "--",
            row.status,
        ]);
        exportToCsv("esquemas-almacen.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/almacen/configuracion/esquema/nuevo"),
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
                onClick: () => {
                    void fetchList();
                },
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [fetchList, handleExport, router]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Esquemas"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    handleFilterChange(id, value);
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
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: EsquemaRow) => router.push(`/almacen/configuracion/esquema/${row.id}`)}
                        />
                    )}

                    {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

                    <Pagination
                        currentPage={currentPage}
                        pageSize={PER_PAGE}
                        totalRecords={filteredRows.length}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
