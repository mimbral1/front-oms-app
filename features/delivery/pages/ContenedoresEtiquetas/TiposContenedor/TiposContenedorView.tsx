"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

const ITEMS_PER_PAGE = 10;

type ShippingContainerTypeRow = {
    id: string;
    name: string;
    referenceId: string;
    weight: number | null;
    maxWeight: number | null;
    minPackageWeight: number | null;
    maxPackageWeight: number | null;
    status: string;
    dateModified: string;
};

type ApiShippingContainerTypeItem = {
    id?: string | null;
    name?: string | null;
    referenceId?: string | null;
    weight?: number | null;
    maxWeight?: number | null;
    minPackageWeight?: number | null;
    maxPackageWeight?: number | null;
    status?: string | null;
    dateModified?: string | null;
};

type ApiShippingContainerTypeResponse = {
    data?: ApiShippingContainerTypeItem[];
};

type ShippingContainerTypeFilters = {
    search: string;
    status: string;
};

const initialFilters: ShippingContainerTypeFilters = {
    search: "",
    status: "",
};

const filterConfig: FilterConfig<ShippingContainerTypeFilters, ShippingContainerTypeRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.name} ${row.referenceId}`
                .toLowerCase()
                .includes(String(value ?? "").trim().toLowerCase()),
    },
    {
        id: "status",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "active" },
            { label: "Inactivo", value: "inactive" },
        ],
        rowValue: (row) => row.status.toLowerCase(),
    },
];

const toNumberOrNull = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getColumns = (): Column<ShippingContainerTypeRow>[] => [
    {
        header: "Nombre",
        accessorKey: "name",
        cell: (row) => (
            <div className="min-h-[48px] leading-tight">
                <div className="text-sm font-semibold text-slate-800">{row.name}</div>
                <div className="mt-1 text-xs text-slate-500">Ref: {row.referenceId}</div>
            </div>
        ),
    },
    {
        header: "Pesos",
        accessorKey: "weight",
        cell: (row) => (
            <div className="min-h-[48px] leading-tight text-xs text-slate-700">
                <div>Peso base: {row.weight ?? "-"}</div>
                <div>Max contenedor: {row.maxWeight ?? "-"}</div>
                <div>Rango paquete: {row.minPackageWeight ?? "-"} - {row.maxPackageWeight ?? "-"}</div>
            </div>
        ),
    },
    {
        header: "Estado",
        accessorKey: "status",
        cell: (row) => {
            const active = row.status.toLowerCase() === "active";
            return (
                <div className="flex min-h-[48px] items-center">
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                            }`}
                    >
                        {active ? "Activo" : row.status || "Sin estado"}
                    </span>
                </div>
            );
        },
    },
    {
        header: "Ultima modificacion",
        accessorKey: "dateModified",
        cell: (row) => (
            <div className="flex min-h-[48px] items-center text-xs text-slate-600">
                {row.dateModified || "-"}
            </div>
        ),
    },
];

const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function TiposContenedorView() {
    const router = useRouter();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();
    const [rows, setRows] = useState<ShippingContainerTypeRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const columns = useMemo(() => getColumns(), []);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<ShippingContainerTypeFilters, ShippingContainerTypeRow>({
            initialFilters,
            configs: filterConfig,
        });

    const loadRows = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const response = await fetchWithAuthDelivery<ApiShippingContainerTypeResponse>("shipping-container-type?page=1&limit=200", {
                method: "GET",
                cache: "no-store",
            });

            const list = Array.isArray(response?.data) ? response.data : [];
            const mapped = list.map((item, index) => {
                const id = String(item?.id || "").trim() || `TYPE-${index + 1}`;
                const name = String(item?.name || "").trim() || "Sin nombre";
                const referenceId = String(item?.referenceId || "").trim() || id;
                const status = String(item?.status || "").trim() || "inactive";

                return {
                    id,
                    name,
                    referenceId,
                    weight: toNumberOrNull(item?.weight),
                    maxWeight: toNumberOrNull(item?.maxWeight),
                    minPackageWeight: toNumberOrNull(item?.minPackageWeight),
                    maxPackageWeight: toNumberOrNull(item?.maxPackageWeight),
                    status,
                    dateModified: formatDate(String(item?.dateModified || "")),
                };
            });

            setRows(mapped);
            setCurrentPage(1);
        } catch (error) {
            setRows([]);
            setLoadError(error instanceof Error ? error.message : "Error al cargar tipos de contenedor");
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuthDelivery]);

    useEffect(() => {
        void loadRows();
    }, [loadRows]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const handleExport = useCallback(() => {
        const headers = ["ID", "Nombre", "Referencia", "Peso", "Max peso", "Min paquete", "Max paquete", "Estado", "Ultima modificacion"];
        const data = filteredRows.map((row) => [
            row.id,
            row.name,
            row.referenceId,
            row.weight ?? "",
            row.maxWeight ?? "",
            row.minPackageWeight ?? "",
            row.maxPackageWeight ?? "",
            row.status,
            row.dateModified,
        ]);

        exportToCsv("tipos-contenedor.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = [
        {
            label: "Actualizar",
            variant: "secondary",
            onClick: () => {
                void loadRows();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/delivery/contenedores-etiquetas/tipos-contenedor/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary",
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Tipos de contenedores"
                description="Listado de tipos de contenedores desde shipping-container-type."
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    handleFilterChange(id, value);
                }}
                filterTitle
            />

            <div className="flex-1 px-6 pb-6 pt-2">
                {loadError ? (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {loadError}
                    </div>
                ) : null}

                <section className="overflow-x-auto">
                    {loading ? <div className="pb-3 text-sm text-slate-600">Cargando tipos de contenedor...</div> : null}

                    {!loading && rows.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                            Aun no hay tipos de contenedor registrados.
                        </div>
                    ) : null}

                    {!loading && rows.length > 0 && filteredRows.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                            No hay tipos de contenedor que coincidan con los filtros seleccionados.
                        </div>
                    ) : null}

                    {!loading && filteredRows.length > 0 ? (
                        <>
                            <DataTable
                                data={paginatedRows}
                                columns={columns}
                                dataType="TiposContenedor"
                                layout="adaptive"
                                rowGap={4}
                                rowPaddingY={16}
                                rowBgClass="bg-white shadow-sm"
                                onRowClick={(row: ShippingContainerTypeRow) => {
                                    router.push(`/delivery/contenedores-etiquetas/tipos-contenedor/${encodeURIComponent(row.id)}`);
                                }}
                            />

                            <Pagination
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                totalRecords={totalRecords}
                                pageSize={ITEMS_PER_PAGE}
                            />
                        </>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
