// app/slots/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, DocumentDuplicateIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

export interface Slot {
    id: string;
    inventory: { id: string; name: string };
    schemaType: string;
    schemaName: string;
    positionType: string;
    slotCode: string;
    status: "Active" | "Inactive";
}

type ApiPosition = {
    id: string;
    warehouseId?: string | null;
    schemaType?: string | null;
    schemaName?: string | null;
    positionKey?: string | null;
    stockAllocationType?: string | null;
    status?: string | null;
};

interface SlotFilters {
    inventory: string;
    schemaType: string;
    schemaName: string;
    positionType: string;
}

const POSITION_BASE_URL = `${BASE_WAREHOUSES}/position`;
const ITEMS_PER_PAGE = 60;

const initialFilters: SlotFilters = {
    inventory: "",
    schemaType: "",
    schemaName: "",
    positionType: "",
};

function formatLabel(value?: string | null): string {
    if (!value) return "-";
    return value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function buildFilterOptions(values: string[]) {
    const uniqueSorted = Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
        left.localeCompare(right, undefined, { sensitivity: "base" })
    );

    return uniqueSorted.map((value) => ({ label: value, value }));
}

function buildWarehouseLabel(referenceId?: string | null, name?: string | null, fallback?: string) {
    const safeReferenceId = String(referenceId || "").trim();
    const safeName = String(name || "").trim();

    if (!safeReferenceId) return safeName || fallback || "-";
    if (!safeName) return safeReferenceId;

    const normalizedReferenceId = safeReferenceId.toLowerCase();
    const normalizedName = safeName.toLowerCase();
    const nameAlreadyIncludesReferenceId =
        normalizedName === normalizedReferenceId ||
        normalizedName.startsWith(`${normalizedReferenceId} `) ||
        normalizedName.startsWith(`${normalizedReferenceId}-`);

    return nameAlreadyIncludesReferenceId ? safeName : `${safeReferenceId} - ${safeName}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
}

function getColumns() {
    return [
        {
            accessorKey: "inventory" as const,
            header: "Inventario",
            cell: (row: Slot) => (
                <a className="flex items-center text-sm font-medium text-[#5f7dbd]">
                    <HomeModernIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {row.inventory.name}
                </a>
            ),
        },
        {
            accessorKey: "schemaName" as const,
            header: "Esquema",
            cell: (row: Slot) => (
                <span className="text-sm text-gray-600">{row.schemaName}</span>
            ),
        },
        {
            accessorKey: "schemaType" as const,
            header: "Tipo de esquema",
            cell: (row: Slot) => (
                <span className="text-sm text-gray-800">{row.schemaType}</span>
            ),
        },
        {
            accessorKey: "positionType" as const,
            header: "Tipo de posición",
            cell: (row: Slot) => (
                <span className="text-sm text-gray-800">{row.positionType}</span>
            ),
        },
        {
            accessorKey: "slotCode" as const,
            header: "Slot",
            cell: (row: Slot) => (
                <span className="text-sm text-gray-600">{row.slotCode}</span>
            ),
        },
        {
            accessorKey: "status" as const,
            header: "Estado",
            cell: (row: Slot) => (
                <span
                    className={`inline-block rounded-full px-4 py-1 text-xs font-semibold ${row.status === "Active"
                        ? "bg-[#86d65f] text-white"
                        : "bg-[#d3d7df] text-[#4b5563]"
                        }`}
                >
                    {row.status === "Active" ? "Activo" : "Inactivo"}
                </span>
            ),
        },
    ];
}

export function SlotsPage() {
    const router = useRouter();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const inventoryOptions = useMemo(
        () => buildFilterOptions(slots.map((slot) => slot.inventory.name)),
        [slots]
    );
    const schemaTypeOptions = useMemo(
        () => buildFilterOptions(slots.map((slot) => slot.schemaType)),
        [slots]
    );
    const schemaNameOptions = useMemo(
        () => buildFilterOptions(slots.map((slot) => slot.schemaName)),
        [slots]
    );
    const positionTypeOptions = useMemo(
        () => buildFilterOptions(slots.map((slot) => slot.positionType)),
        [slots]
    );

    const filterConfig = useMemo<FilterConfig<SlotFilters, Slot>[]>(
        () => [
            {
                id: "inventory",
                label: "Inventario",
                type: "select",
                options: inventoryOptions,
                rowValue: (row) => row.inventory.name,
            },
            {
                id: "schemaType",
                label: "Tipo de esquema",
                type: "select",
                options: schemaTypeOptions,
                rowValue: (row) => row.schemaType,
            },
            {
                id: "schemaName",
                label: "Esquema",
                type: "select",
                options: schemaNameOptions,
                rowValue: (row) => row.schemaName,
            },
            {
                id: "positionType",
                label: "Tipo de posición",
                type: "select",
                options: positionTypeOptions,
                rowValue: (row) => row.positionType,
            },
        ],
        [inventoryOptions, positionTypeOptions, schemaNameOptions, schemaTypeOptions]
    );

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<SlotFilters, Slot>({
            initialFilters,
            configs: filterConfig,
        });

    const loadSlots = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [positionsRes, warehousesRes] = await Promise.all([
                fetch(POSITION_BASE_URL, {
                    method: "GET",
                    headers: withAuthPlatformHeaders(),
                }),
                warehousesAll().catch(() => ({ items: [], total: 0 })),
            ]);

            if (!positionsRes.ok) {
                throw new Error(`HTTP ${positionsRes.status}`);
            }

            const positions = (await positionsRes.json()) as ApiPosition[];
            const warehouseMap = new Map(
                warehousesRes.items.map((warehouse) => {
                    const label = buildWarehouseLabel(warehouse.referenceId, warehouse.name, warehouse.id);

                    return [warehouse.id, label || warehouse.id];
                })
            );

            const mapped: Slot[] = (Array.isArray(positions) ? positions : []).map((item) => {
                const warehouseId = String(item.warehouseId || "-");
                const status = String(item.status || "").toLowerCase() === "active" ? "Active" : "Inactive";

                return {
                    id: item.id,
                    inventory: {
                        id: warehouseId,
                        name: warehouseMap.get(warehouseId) || warehouseId,
                    },
                    schemaType: formatLabel(item.schemaType),
                    schemaName: item.schemaName || "-",
                    positionType: formatLabel(item.stockAllocationType),
                    slotCode: item.positionKey || "-",
                    status,
                };
            });

            setSlots(mapped);
            setPage(1);
        } catch (error: unknown) {
            setSlots([]);
            setError(getErrorMessage(error, "No se pudieron cargar los slots."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSlots();
    }, [loadSlots]);

    const filtered = useMemo(() => applyFilters(slots), [applyFilters, slots]);
    const pageData = useMemo(
        () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
        [filtered, page]
    );

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [filtered.length, page]);

    const handleExport = useCallback(() => {
        const headers = [
            "Inventario",
            "Tipo de esquema",
            "Esquema",
            "Tipo de posición",
            "Slot",
            "Estado",
        ];
        const rows = filtered.map((slot) => [
            slot.inventory.name,
            slot.schemaType,
            slot.schemaName,
            slot.positionType,
            slot.slotCode,
            slot.status,
        ]);
        exportToCsv("slots.csv", [headers, ...rows]);
    }, [filtered]);

    const headerActions = [
        {
            label: "Generar etiquetas",
            variant: "primary" as const,
            onClick: () => { },
            icon: <DocumentDuplicateIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "secondary" as const,
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
        {
            label: "Recargar",
            variant: "secondary" as const,
            onClick: () => {
                void loadSlots();
            },
            icon: <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />,
        },
        {
            label: "Importar",
            variant: "secondary" as const,
            onClick: () => { },
            icon: <ArrowUpTrayIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title="Slots"
                description=""
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setPage(1);
                    handleFilterChange(id, value);
                }}
                filterTitle={true}
                action={headerActions}
            />

            <div className="flex-1 p-6">
                {error ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                        <ArrowPathIcon className="h-4 w-4 animate-spin" /> Cargando slots...
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <DataTable
                        data={pageData}
                        columns={getColumns()}
                        onRowClick={(slot) =>
                            router.push(`/almacen/configuracion/slots/${slot.id}`)
                        }
                        statusKey="status"
                        dataType="General"
                        rowBgClass="bg-white"
                        rowGap="h-[6px] bg-[#eef1f6]"
                    />
                </div>

                {filtered.length > 0 ? (
                    <div className="mt-4 flex flex-col items-center">
                        <Pagination
                            currentPage={page}
                            totalRecords={filtered.length}
                            pageSize={ITEMS_PER_PAGE}
                            onPageChange={setPage}
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            {filtered.length} resultados
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
