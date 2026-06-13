"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { type Estado, getEstadoColor } from "@/utils/status";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";
import { type EndpointConfig, type FilterConfig, useStandardFilters } from "@/lib/filters";

type ApiStore = {
    Id: number;
    CompanyId: number;
    CompanyName: string;
    Name: string;
    Email: string | null;
    PhoneNumber: string | null;
    Status: boolean;
    CreatedAt: string | null;
    UpdatedAt: string | null;
    UserCreated: string | null;
    UserModified: string | null;
};

type ApiListResponse = {
    ok: boolean;
    page: number;
    pageSize: number;
    total: number;
    data: ApiStore[];
};

interface StoreRow {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    status: Estado;
    createdAt: string;
    updatedAt: string;
}

interface Filters {
    search: string;
    status: string;
}

const PER_PAGE = 20;
const getStatusColor = getEstadoColor;

const initialFilters: Filters = {
    search: "",
    status: "",
};

const filterConfig: FilterConfig<Filters>[] = [
    {
        id: "search",
        label: "Buscar (store)",
        type: "text",
        queryParam: "search",
    },
    {
        id: "status",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "1" },
            { label: "Inactivo", value: "0" },
        ],
        emptyOptionLabel: "Todos",
    },
];

function getColumns(): Column<StoreRow>[] {
    return [
        { header: "ID", accessorKey: "id" },
        { header: "Nombre", accessorKey: "name" },
        { header: "Compañía", accessorKey: "company" },
        { header: "Email", accessorKey: "email" },
        { header: "Teléfono", accessorKey: "phone" },
        { header: "Creado", accessorKey: "createdAt" },
        { header: "Actualizado", accessorKey: "updatedAt" },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(row.status)}`}
                >
                    {row.status}
                </div>
            ),
        },
    ];
}

export default function StoreView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const { fetchWithAuth } = useFetchWithAuth();
    const { token } = useAuth();
    const [rows, setRows] = useState<StoreRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const { headerFilters, handleFilterChange, buildUrl } = useStandardFilters<Filters>({
        initialFilters,
        configs: filterConfig,
    });

    const fetchList = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const endpointConfig: EndpointConfig<Filters> = {
                path: "comerce-service/store",
                pagination: { page: currentPage, pageSize: PER_PAGE },
            };

            const response = await fetchWithAuth<ApiListResponse>(buildUrl(endpointConfig));
            const data = Array.isArray(response?.data) ? response.data : [];
            const mapped: StoreRow[] = data.map((item) => ({
                id: item.Id,
                name: item.Name || "",
                company: item.CompanyName || "",
                email: item.Email || "",
                phone: item.PhoneNumber || "",
                status: item.Status ? "Activo" : "Inactivo",
                createdAt: item.CreatedAt ? new Date(item.CreatedAt).toLocaleString("es-CL") : "-",
                updatedAt: item.UpdatedAt ? new Date(item.UpdatedAt).toLocaleString("es-CL") : "-",
            }));

            setRows(mapped);
            setTotalRecords(Number(response?.total ?? 0));
        } catch {
            setRows([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [token, fetchWithAuth, buildUrl, currentPage]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const handleExport = useCallback(() => {
        const headers = ["ID", "Nombre", "Compañía", "Email", "Teléfono", "Estado", "Creado", "Actualizado"];
        const data = rows.map((row) => [row.id, row.name, row.company, row.email, row.phone, row.status, row.createdAt, row.updatedAt]);
        exportToCsv("stores.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/ubicaciones/stores/nuevo"),
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
                onClick: () => fetchList(),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [router, handleExport, fetchList]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Stores"
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
                        <p>Cargando stores...</p>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: StoreRow) => router.push(`/ubicaciones/stores/${row.id}`)}
                        />
                    )}

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
