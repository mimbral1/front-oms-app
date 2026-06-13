// C:\Users\thoma\Desktop\ModuloApp\ModuloApp\views\Almacen\AlmacenesView\AlmacenesView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, CloudArrowDownIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { warehousesAll, type WarehouseDTO } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { getEstadoColor } from "@/utils/status";
import { fmtDateTime } from "@/lib/format/date";
import { Avatar } from "@/components/ui/user-avatar";
import { exportToCsv } from "@/components/presets/export/export";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

type Usuario = { name: string; email?: string };

type WarehouseRow = {
    id: string;
    nombre: string;
    refId?: string;
    grupo?: string;
    ubicacion?: string;
    slotsUsados?: number;
    slotsTotales?: number;
    distribucionExt?: boolean;
    ocupacion?: number;
    fechaCreacion?: string;
    fechaModificacion?: string;
    usuarioCreacion?: Usuario;
    usuarioModificacion?: Usuario;
    status: "Activo" | "Inactivo";
};

type WarehouseFilters = {
    buscar: string;
    nombre: string;
    refId: string;
    usuarioCreador: string;
};

const ITEMS_PER_PAGE = 60;
const formatDateTimeWithTime = fmtDateTime;
const getStatusColor = getEstadoColor;

const initialFilters: WarehouseFilters = {
    buscar: "",
    nombre: "",
    refId: "",
    usuarioCreador: "",
};

const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${className}`}>{children}</span>
);

function getColumns(router: ReturnType<typeof useRouter>) {
    return [
        { header: "Nombre", accessorKey: "nombre" as const, cell: (row: WarehouseRow) => <span>{row.nombre || "—"}</span> },
        { header: "Ref ID", accessorKey: "refId" as const, cell: (row: WarehouseRow) => <span>{row.refId ?? "—"}</span> },
        { header: "Grupo", accessorKey: "grupo" as const, cell: (row: WarehouseRow) => <span>{row.grupo ?? "—"}</span> },
        {
            header: "Location",
            accessorKey: "ubicacion" as const,
            cell: (row: WarehouseRow) => (
                <div className="inline-flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{row.ubicacion ? row.ubicacion : "—"}</span>
                </div>
            ),
        },
        {
            header: "Slots",
            accessorKey: "slotsTotales" as const,
            cell: (row: WarehouseRow) =>
                row.slotsTotales !== undefined && row.slotsTotales !== null ? <span>{row.slotsTotales}</span> : <span>—</span>,
        },
        {
            header: "Distribución ext.",
            accessorKey: "distribucionExt" as const,
            cell: (row: WarehouseRow) => {
                const isYes = row.distribucionExt === true;
                return (
                    <div className={`flex h-7 w-16 items-center rounded-full px-1 ${isYes ? "bg-primary-500" : "bg-gray-200"}`}>
                        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${isYes ? "translate-x-8" : "translate-x-0"}`} />
                        <span className="ml-2 text-xs">{isYes ? "Sí" : "No"}</span>
                    </div>
                );
            },
        },
        {
            header: "Ocupación (%)",
            accessorKey: "ocupacion" as const,
            cell: (row: WarehouseRow) =>
                Number.isFinite(row.ocupacion) ? <Pill className="bg-green-100 text-green-800">{`${row.ocupacion}%`}</Pill> : <span>—</span>,
        },
        { header: "Fecha creación", accessorKey: "fechaCreacion" as const, cell: (row: WarehouseRow) => <span>{formatDateTimeWithTime(row.fechaCreacion)}</span> },
        { header: "Fecha modificación", accessorKey: "fechaModificacion" as const, cell: (row: WarehouseRow) => <span>{formatDateTimeWithTime(row.fechaModificacion)}</span> },
        {
            header: "Usuario",
            accessorKey: "usuarioModificacion" as const,
            cell: (row: WarehouseRow) => {
                const user = row.usuarioModificacion || row.usuarioCreacion;
                if (!user?.name) return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">—</span>;
                return (
                    <div className="inline-flex max-w-[220px] items-center rounded-full border border-gray-200 bg-white px-2 py-1">
                        <Avatar name={user.name || user.email || "-"} alt={user.name || user.email || "-"} className="mr-2 h-7 w-7" />
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium leading-tight">{user.name}</span>
                            {user.email ? <span className="truncate text-xs leading-tight text-gray-500">{user.email}</span> : null}
                        </div>
                    </div>
                );
            },
        },
        {
            header: "Estado",
            accessorKey: "status" as const,
            cell: (row: WarehouseRow) => (
                <div className={`inline-flex items-center justify-center rounded-full px-6 py-1 text-sm font-medium text-white ${getStatusColor(row.status)}`}>
                    {row.status}
                </div>
            ),
        },
    ];
}

export default function AlmacenesView() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<WarehouseRow[]>([]);

    const userOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    rows
                        .map((row) => row.usuarioCreacion?.name)
                        .filter(Boolean) as string[]
                )
            )
                .sort((left, right) => left.localeCompare(right))
                .map((value) => ({ label: value, value })),
        [rows]
    );

    const filterConfig = useMemo<FilterConfig<WarehouseFilters, WarehouseRow>[]>(
        () => [
            {
                id: "buscar",
                label: "Buscar",
                type: "text",
                match: (row, value) =>
                    `${row.nombre} ${row.refId ?? ""}`
                        .toLowerCase()
                        .includes(String(value ?? "").trim().toLowerCase()),
            },
            {
                id: "nombre",
                label: "Nombre",
                type: "text",
                rowValue: (row) => row.nombre,
            },
            {
                id: "refId",
                label: "Ref ID",
                type: "text",
                rowValue: (row) => row.refId,
            },
            {
                id: "usuarioCreador",
                label: "Usuario creador",
                type: "select-search",
                options: userOptions,
                rowValue: (row) => row.usuarioCreacion?.name,
            },
        ],
        [userOptions]
    );

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<WarehouseFilters, WarehouseRow>({
            initialFilters,
            configs: filterConfig,
        });

    useEffect(() => {
        let mounted = true;
        void (async () => {
            try {
                setLoading(true);
                const { items } = await warehousesAll();
                if (!mounted) return;

                const mapped: WarehouseRow[] = (items ?? []).map((warehouse: WarehouseDTO) => ({
                    id: warehouse.id,
                    nombre: warehouse.name ?? "—",
                    refId: warehouse.referenceId ?? warehouse.code ?? "—",
                    grupo: warehouse.groupName ?? warehouse.group ?? "—",
                    ubicacion: warehouse.location ?? "—",
                    slotsUsados: Number(warehouse.positions?.occupied ?? 0),
                    slotsTotales: Number(warehouse.positions?.total ?? 0),
                    distribucionExt: warehouse.externalDistribution,
                    ocupacion: Number(warehouse.positions?.occupancyPct ?? 0),
                    fechaCreacion: warehouse.createdAt,
                    fechaModificacion: warehouse.updatedAt,
                    usuarioCreacion: warehouse.userCreated
                        ? { name: warehouse.userCreated, email: warehouse.userCreated }
                        : undefined,
                    usuarioModificacion: warehouse.userModified
                        ? { name: warehouse.userModified, email: warehouse.userModified }
                        : undefined,
                    status: warehouse.isActive ? "Activo" : "Inactivo",
                }));

                setRows(mapped);
                setCurrentPage(1);
            } catch {
                setRows([]);
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const filtered = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const paginatedRows = useMemo(
        () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [currentPage, filtered]
    );

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, filtered.length]);

    const handleExport = useMemo(
        () => () => {
            const headers = [
                "Nombre",
                "Ref ID",
                "Grupo",
                "Location",
                "Slots",
                "Distribución ext.",
                "Ocupación (%)",
                "Fecha creación",
                "Fecha modificación",
                "Usuario",
                "Estado",
            ];
            const data = filtered.map((row) => [
                row.nombre,
                row.refId ?? "—",
                row.grupo ?? "—",
                row.ubicacion ?? "—",
                row.slotsTotales ?? "—",
                row.distribucionExt ? "Sí" : "No",
                Number.isFinite(row.ocupacion) ? row.ocupacion : "—",
                formatDateTimeWithTime(row.fechaCreacion),
                formatDateTimeWithTime(row.fechaModificacion),
                row.usuarioModificacion?.name ?? row.usuarioCreacion?.name ?? "—",
                row.status,
            ]);
            exportToCsv("almacenes.csv", [headers, ...data]);
        },
        [filtered]
    );

    const headerActions = [
        { label: "Crear Location", variant: "success" as const, onClick: () => console.log("Crear Location"), icon: <PlusIcon className="h-5 w-5" /> },
        { label: "Crear almacén", variant: "success" as const, onClick: () => router.push("/almacen/almacenes/nuevo"), icon: <PlusIcon className="h-5 w-5" /> },
        { label: "Exportar", variant: "primary" as const, onClick: handleExport, icon: <CloudArrowDownIcon className="h-5 w-5" /> },
    ];

    const columns = useMemo(() => getColumns(router), [router]);

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Almacenes"
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
                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable
                            data={paginatedRows}
                            columns={columns}
                            dataType="Almacenes"
                            statusKey="status"
                            rowPaddingY={12}
                            rowBgClass="bg-white"
                            onRowClick={(row: WarehouseRow) => router.push(`/almacen/almacenes/${row.id}`)}
                        />
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalRecords={filtered.length}
                        pageSize={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
