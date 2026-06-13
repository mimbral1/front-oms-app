"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { customersAllPaged } from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { type Estado, getEstadoColor } from "@/utils/status";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

type ApiCustomer = {
    Id: string;
    PartnerType: string;
    RUT?: string | null;
    FirstName?: string | null;
    LastName?: string | null;
    Email?: string | null;
    Phone?: string | null;
    IsActive: boolean;
    CreatedAt?: string | null;
    UpdatedAt?: string | null;
};

interface ProveedorRow {
    id: string;
    docId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: Estado;
    partnerType: string;
    createdAt: string;
    updatedAt: string;
}

interface Filters {
    search: string;
    isActive: string;
}

const PER_PAGE = 10;
const getStatusColor = getEstadoColor;

const initialFilters: Filters = {
    search: "",
    isActive: "",
};

const filterConfig: FilterConfig<Filters, ProveedorRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.docId} ${row.firstName} ${row.lastName} ${row.email} ${row.phone}`
                .toLowerCase()
                .includes(String(value ?? "").trim().toLowerCase()),
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

function getColumns(): Column<ProveedorRow>[] {
    return [
        { header: "Documento", accessorKey: "docId", cell: (row) => <span className="cursor-pointer break-all hover:underline">{row.docId}</span> },
        { header: "Nombre", accessorKey: "firstName" },
        { header: "Apellido", accessorKey: "lastName" },
        { header: "Email", accessorKey: "email", cell: (row) => <span className="break-all">{row.email}</span> },
        {
            header: "Teléfono",
            accessorKey: "phone",
            cell: (row) =>
                row.phone && row.phone.trim() !== "" ? (
                    <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                        {row.phone}
                    </span>
                ) : (
                    <span>-</span>
                ),
        },
        { header: "Creado", accessorKey: "createdAt" },
        { header: "Actualizado", accessorKey: "updatedAt" },
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

export default function ProveedoresView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<ProveedorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, ProveedorRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const { items } = await customersAllPaged({
                page: 1,
                pageSize: 1000,
                partnerType: "P",
            });

            const mapped: ProveedorRow[] = ((items || []) as ApiCustomer[]).map((item) => ({
                id: item.Id,
                docId: item.RUT || item.Id,
                firstName: item.FirstName || "",
                lastName: item.LastName || "",
                email: item.Email || "",
                phone: item.Phone || "",
                partnerType: item.PartnerType || "",
                status: item.IsActive ? "Activo" : "Inactivo",
                createdAt: item.CreatedAt ? new Date(item.CreatedAt).toLocaleString("es-CL") : "—",
                updatedAt: item.UpdatedAt ? new Date(item.UpdatedAt).toLocaleString("es-CL") : "—",
            }));

            setRows(mapped);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error listando proveedores:", error);
            setRows([]);
            setLoadError(error instanceof Error ? error.message : "Error al cargar proveedores");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const pageRows = useMemo(() => {
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
        const headers = ["ID", "Documento", "Nombre", "Apellido", "Email", "Teléfono", "Estado", "Creado", "Actualizado"];
        const data = filteredRows.map((row) => [
            row.id,
            row.docId,
            row.firstName,
            row.lastName,
            row.email,
            row.phone,
            row.status,
            row.createdAt,
            row.updatedAt,
        ]);
        exportToCsv("proveedores.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/almacen/gestion/proveedores/nuevo"),
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
                title="Proveedores"
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
                    {loadError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                            {loadError}
                        </div>
                    ) : null}

                    {loading ? (
                        <p>Cargando proveedores...</p>
                    ) : filteredRows.length === 0 ? (
                        <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                            No hay proveedores que coincidan con los filtros seleccionados.
                        </div>
                    ) : (
                        <>
                            <DataTable
                                data={pageRows}
                                columns={columns}
                                dataType="General2"
                                statusKey="status"
                                rowPaddingY={12}
                                showStatusBorder
                                rowBgClass="bg-white"
                                onRowClick={(row: ProveedorRow) => router.push(`/almacen/gestion/proveedores/${row.id}`)}
                            />

                            <Pagination
                                currentPage={currentPage}
                                totalRecords={totalRecords}
                                pageSize={PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
