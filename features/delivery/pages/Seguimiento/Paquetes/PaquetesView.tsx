// app/views/Delivery/Seguimiento/Paquetes/PaqueteView.tsx
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

type EstadoUI = "Creada" | "Inactiva";
type NumberOrDash = number | "-";

export interface PackageRow {
    id: string;
    refId: string;
    barcode: string;
    shipping: string;
    nombre: string;
    descripcion: string;
    ancho: NumberOrDash;
    altura: NumberOrDash;
    largo: NumberOrDash;
    volumen: NumberOrDash;
    peso: NumberOrDash;
    createdAt: string;
    modifiedAt: string;
    status: EstadoUI;
}

type ApiPackageItem = {
    id?: string;
    refId?: string | null;
    ean?: string | null;
    shippingId?: string | null;
    name?: string | null;
    description?: string | null;
    width?: number | null;
    height?: number | null;
    length?: number | null;
    volume?: number | null;
    weight?: number | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
};

type ApiPackageResponse = {
    data?: ApiPackageItem[];
};

type PackageFilters = {
    refId: string;
    shipping: string;
    nombre: string;
    status: string;
};

const PACKAGE_URL = `${BASE_DELIVERY_SERVICE}/package`;
const PER_PAGE = 60;

const initialFilters: PackageFilters = {
    refId: "",
    shipping: "",
    nombre: "",
    status: "",
};

const fdt = (iso: string) =>
    new Date(iso).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const statusPillClass = (status: EstadoUI) =>
    status === "Creada"
        ? "bg-orange-500 text-white"
        : "bg-gray-500 text-white";

const mapStatus = (rawStatus?: string | null): EstadoUI => {
    const normalized = String(rawStatus || "").trim().toLowerCase();
    return normalized === "inactive" ? "Inactiva" : "Creada";
};

const mapNumber = (value?: number | null): NumberOrDash => {
    return typeof value === "number" && Number.isFinite(value) ? value : "-";
};

export default function PaquetesView() {
    const router = useRouter();
    const [rows, setRows] = useState<PackageRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const shippingOptions = useMemo(
        () =>
            Array.from(new Set(rows.map((row) => row.shipping).filter(Boolean)))
                .sort((left, right) => left.localeCompare(right))
                .map((value) => ({ label: value, value })),
        [rows]
    );

    const filterConfig = useMemo<FilterConfig<PackageFilters, PackageRow>[]>(
        () => [
            {
                id: "refId",
                label: "Ref ID",
                type: "text",
                placeholder: "Buscar Ref ID",
                rowValue: (row) => row.refId,
            },
            {
                id: "shipping",
                label: "Shipping",
                type: "select-search",
                options: shippingOptions,
                rowValue: (row) => row.shipping,
            },
            {
                id: "nombre",
                label: "Nombre",
                type: "text",
                placeholder: "Buscar nombre",
                rowValue: (row) => row.nombre,
            },
            {
                id: "status",
                label: "Status",
                type: "select-search",
                options: [
                    { label: "Creada", value: "Creada" },
                    { label: "Inactiva", value: "Inactiva" },
                ],
                rowValue: (row) => row.status,
            },
        ],
        [shippingOptions]
    );

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<PackageFilters, PackageRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchPackages = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const response = await fetch(`${PACKAGE_URL}?page=1&limit=500`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al listar paquetes`);
            }

            const payload = (await response.json()) as ApiPackageResponse;
            const mapped = (Array.isArray(payload?.data) ? payload.data : []).map((item): PackageRow => ({
                id: String(item.id || ""),
                refId: String(item.refId || "-"),
                barcode: String(item.ean || "-"),
                shipping: String(item.shippingId || "-"),
                nombre: String(item.name || "-"),
                descripcion: String(item.description || "-"),
                ancho: mapNumber(item.width),
                altura: mapNumber(item.height),
                largo: mapNumber(item.length),
                volumen: mapNumber(item.volume),
                peso: mapNumber(item.weight),
                createdAt: String(item.dateCreated || ""),
                modifiedAt: String(item.dateModified || ""),
                status: mapStatus(item.status),
            }));

            setRows(mapped);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error al cargar paquetes", error);
            setRows([]);
            setLoadError(error instanceof Error ? error.message : "Error al cargar paquetes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchPackages();
    }, [fetchPackages]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const handleExport = useCallback(() => {
        const headers = [
            "Ref ID",
            "Código de barras",
            "Envío",
            "Nombre",
            "Descripción",
            "Ancho",
            "Altura",
            "Largo",
            "Volumen",
            "Peso",
            "Creación",
            "Modificado",
            "Status",
        ];

        const data = filteredRows.map((row) => [
            row.refId,
            row.barcode,
            row.shipping,
            row.nombre,
            row.descripcion,
            row.ancho,
            row.altura,
            row.largo,
            row.volumen,
            row.peso,
            fdt(row.createdAt),
            fdt(row.modifiedAt),
            row.status,
        ]);

        exportToCsv("paquetes.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = [
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/delivery/seguimiento/paquetes/nuevo"),
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
                void fetchPackages();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    const columns = useMemo<Column<PackageRow>[]>(
        () => [
            { header: "Ref ID", accessorKey: "refId" },
            { header: "Código de barras", accessorKey: "barcode" },
            { header: "Envío", accessorKey: "shipping" },
            {
                header: "Nombre",
                accessorKey: "nombre",
                cell: (row) => (
                    <span className="inline-block max-w-[180px] truncate text-sm text-gray-900" title={row.nombre}>
                        {row.nombre}
                    </span>
                ),
            },
            {
                header: "Descripción",
                accessorKey: "descripcion",
                cell: (row) => (
                    <span className="inline-block max-w-[120px] truncate" title={row.descripcion}>
                        {row.descripcion}
                    </span>
                ),
            },
            { header: "Ancho", accessorKey: "ancho" },
            { header: "Altura", accessorKey: "altura" },
            { header: "Largo", accessorKey: "largo" },
            { header: "Volumen", accessorKey: "volumen" },
            { header: "Peso", accessorKey: "peso" },
            { header: "Creación", accessorKey: "createdAt", cell: (row) => fdt(row.createdAt) },
            { header: "Modificado", accessorKey: "modifiedAt", cell: (row) => fdt(row.modifiedAt) },
            {
                header: "Status",
                accessorKey: "status",
                cell: (row) => (
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(row.status)}`}>
                        {row.status}
                    </span>
                ),
            },
        ],
        []
    );

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Paquetes"
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
                            Cargando paquetes...
                        </div>
                    ) : null}

                    {!loading && rows.length === 0 ? (
                        <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                            Aún no hay paquetes registrados.
                        </div>
                    ) : null}

                    {!loading && rows.length > 0 && filteredRows.length === 0 ? (
                        <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                            No hay paquetes que coincidan con los filtros seleccionados.
                        </div>
                    ) : null}

                    {!loading && filteredRows.length > 0 ? (
                        <>
                            <div className="overflow-hidden rounded-xl shadow-sm">
                                <DataTable
                                    data={paginatedRows}
                                    columns={columns}
                                    dataType="Paquete"
                                    statusKey="status"
                                    showStatusBorder
                                    rowPaddingY={20}
                                    rowBgClass="bg-white"
                                    onRowClick={(row: PackageRow) => router.push(`/delivery/seguimiento/paquetes/${encodeURIComponent(row.id)}`)}
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
