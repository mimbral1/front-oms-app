// app/(delivery)/carrier-groups/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

const formatDate = (iso: string) =>
    iso
        ? new Date(iso).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "-";

const PillNumber = ({ n }: { n: number }) => (
    <span className="inline-flex min-w-[46px] justify-center rounded-full border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">
        {n}
    </span>
);

type GroupType = "Transportista" | "Otro";

interface CarrierGroup {
    id: string;
    name: string;
    type: GroupType;
    timezone: string;
    windows: number;
    createdAt: string;
    modifiedAt: string;
    locations: string[];
    active: boolean;
}

type CarrierGroupApiItem = {
    id?: string;
    name?: string;
    timezone?: string | null;
    groupType?: string | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    locationIds?: string | null;
    windowConfiguration?: string | null;
};

type CarrierGroupApiResponse = {
    data?: CarrierGroupApiItem[];
};

type CarrierGroupFilters = {
    name: string;
    type: "" | GroupType;
    tz: string;
    loc: string;
};

const CARRIER_GROUP_URL = `${BASE_DELIVERY_SERVICE}/carrier-group`;
const PER_PAGE = 10;

const initialFilters: CarrierGroupFilters = {
    name: "",
    type: "",
    tz: "",
    loc: "",
};

function parseJsonField(value: unknown): unknown {
    if (value == null) return null;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
    return value;
}

function parseStringArray(value: unknown): string[] {
    const parsed = parseJsonField(value);
    if (Array.isArray(parsed)) return parsed.map((entry) => String(entry));
    if (typeof parsed === "string") return [parsed];
    return [];
}

function countWindows(value: unknown): number {
    const parsed = parseJsonField(value);

    if (Array.isArray(parsed)) return parsed.length;

    if (parsed && typeof parsed === "object") {
        const asRecord = parsed as Record<string, unknown>;
        if (Array.isArray(asRecord.windows)) return asRecord.windows.length;
        return 1;
    }

    return 0;
}

function mapGroupType(groupType?: string | null): GroupType {
    return String(groupType || "").toLowerCase() === "carrier" ? "Transportista" : "Otro";
}

const statusBg = (active: boolean) => (active ? "bg-green-500" : "bg-gray-400");

function getColumns(): Column<CarrierGroup>[] {
    return [
        {
            header: "Nombre",
            accessorKey: "name",
            cell: (group) => <span className="text-sm font-medium">{group.name}</span>,
        },
        {
            header: "Tipo",
            accessorKey: "type",
            cell: (group) => (
                <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700">
                    {group.type}
                </span>
            ),
        },
        { header: "Zona horaria", accessorKey: "timezone" },
        { header: "Ventanas", accessorKey: "windows", cell: (group) => <PillNumber n={group.windows} /> },
        {
            header: "Fecha de creación",
            accessorKey: "createdAt",
            cell: (group) => <span className="text-sm">{formatDate(group.createdAt)}</span>,
        },
        {
            header: "Modificado",
            accessorKey: "modifiedAt",
            cell: (group) => <span className="text-sm">{formatDate(group.modifiedAt)}</span>,
        },
        {
            header: "Estado",
            accessorKey: "active",
            cell: (group) => (
                <span className={`inline-block rounded-full px-3 py-2 text-xs font-semibold text-white ${statusBg(group.active)}`}>
                    {group.active ? "Activo" : "Inactivo"}
                </span>
            ),
        },
    ];
}

export default function CarrierGroupsView() {
    const router = useRouter();
    const [rows, setRows] = useState<CarrierGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const timezoneOptions = useMemo(
        () =>
            Array.from(new Set(rows.map((group) => group.timezone).filter((timezone) => timezone && timezone !== "-")))
                .sort((left, right) => left.localeCompare(right))
                .map((value) => ({ label: value, value })),
        [rows]
    );

    const locationOptions = useMemo(
        () =>
            Array.from(new Set(rows.flatMap((group) => group.locations).filter(Boolean)))
                .sort((left, right) => left.localeCompare(right))
                .map((value) => ({ label: value, value })),
        [rows]
    );

    const filterConfig = useMemo<FilterConfig<CarrierGroupFilters, CarrierGroup>[]>(
        () => [
            {
                id: "name",
                label: "Buscar por nombre",
                type: "text",
                rowValue: (row) => row.name,
            },
            {
                id: "type",
                label: "Tipo",
                type: "select-search",
                options: [
                    { label: "Transportista", value: "Transportista" },
                    { label: "Otro", value: "Otro" },
                ],
                rowValue: (row) => row.type,
            },
            {
                id: "tz",
                label: "Zona horaria",
                type: "select-search",
                options: timezoneOptions,
                rowValue: (row) => row.timezone,
            },
            {
                id: "loc",
                label: "Ubicación",
                type: "select-search",
                options: locationOptions,
                rowValue: (row) => row.locations,
            },
        ],
        [locationOptions, timezoneOptions]
    );

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<CarrierGroupFilters, CarrierGroup>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const response = await fetch(`${CARRIER_GROUP_URL}?page=1&limit=500`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al listar grupos de transportistas`);
            }

            const payload = (await response.json()) as CarrierGroupApiResponse;
            const mapped: CarrierGroup[] = (Array.isArray(payload?.data) ? payload.data : []).map((item) => {
                const status = String(item.status || "").toLowerCase();

                return {
                    id: String(item.id || ""),
                    name: String(item.name || "-"),
                    type: mapGroupType(item.groupType),
                    timezone: item.timezone || "-",
                    windows: countWindows(item.windowConfiguration),
                    createdAt: String(item.dateCreated || ""),
                    modifiedAt: String(item.dateModified || ""),
                    locations: parseStringArray(item.locationIds),
                    active: status === "active",
                };
            });

            setRows(mapped);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error al cargar grupos de transportistas", error);
            setRows([]);
            setLoadError(error instanceof Error ? error.message : "Error al cargar grupos de transportistas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchGroups();
    }, [fetchGroups]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const pageData = useMemo(() => {
        const startIndex = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const columns = useMemo(() => getColumns(), []);

    const handleExport = useCallback(() => {
        const headers = ["Nombre", "Tipo", "Zona horaria", "Ventanas", "Creado", "Modificado", "Estado"];
        const data = filteredRows.map((group) => [
            group.name,
            group.type,
            group.timezone,
            group.windows,
            formatDate(group.createdAt),
            formatDate(group.modifiedAt),
            group.active ? "Activo" : "Inactivo",
        ]);

        exportToCsv("carrier-groups.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = [
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/delivery/transportistas/grupo-transportistas/nuevo"),
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
                void fetchGroups();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Grupos de transportistas"
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    handleFilterChange(id, value);
                }}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loadError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                            {loadError}
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                            Cargando grupos de transportistas...
                        </div>
                    ) : null}

                    {!loading && rows.length === 0 ? (
                        <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                            Aún no hay grupos de transportistas registrados.
                        </div>
                    ) : null}

                    {!loading && rows.length > 0 && filteredRows.length === 0 ? (
                        <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                            No hay grupos que coincidan con los filtros seleccionados.
                        </div>
                    ) : null}

                    {!loading && filteredRows.length > 0 ? (
                        <>
                            <div className="overflow-hidden rounded-xl shadow-sm">
                                <DataTable<CarrierGroup>
                                    data={pageData}
                                    columns={columns}
                                    dataType="General2"
                                    statusKey="active"
                                    rowPaddingY={12}
                                    rowBgClass="bg-white"
                                    onRowClick={(row) =>
                                        router.push(`/delivery/transportistas/grupo-transportistas/${encodeURIComponent(row.id)}`)
                                    }
                                />
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalRecords={totalRecords}
                                pageSize={PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
