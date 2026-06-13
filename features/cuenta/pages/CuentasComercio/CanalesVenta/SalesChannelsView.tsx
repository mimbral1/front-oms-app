// views\Cuenta\CuentasComercio\CanalesVenta\SalesChannelsView.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { type Estado, getEstadoColor } from "@/utils/status";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";
import {
    type EndpointConfig,
    type FilterConfig,
    useStandardFilters,
} from "@/lib/filters";

/* ---------- Tipos API ---------- */
type ApiSalesChannel = {
    Id: number;
    CompanyId: number;
    CompanyName: string;
    ReferenceId: string;
    Name: string;
    ExternalDelivery: boolean;
    IsActive: boolean;
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
    data: ApiSalesChannel[];
};

/* ---------- Tipos UI ---------- */
interface SalesChannelRow {
    id: number;
    name: string;
    company: string;
    referenceId: string;
    externalDelivery: boolean;
    status: Estado;
    createdAt: string;
    updatedAt: string;
}

/* ---------- Helpers UI ---------- */
const PER_PAGE = 20;
const getStatusColor = getEstadoColor;
const Pill = ({ on, text }: { on: boolean; text: string }) => (
    <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${on ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
            }`}
    >
        {text}
    </span>
);

/* ---------- Columnas (estilo Precios) ---------- */
function getColumns(): Column<SalesChannelRow>[] {
    return [
        { header: "ID", accessorKey: "id" },
        { header: "Nombre", accessorKey: "name" },
        { header: "Compañía", accessorKey: "company" },
        { header: "Ref ID", accessorKey: "referenceId" },
        {
            header: "Picking externo",
            accessorKey: "externalDelivery",
            cell: (r) => <Pill on={r.externalDelivery} text={r.externalDelivery ? "Sí" : "No"} />,
        },
        { header: "Creado", accessorKey: "createdAt" },
        { header: "Actualizado", accessorKey: "updatedAt" },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
                        r.status
                    )}`}
                >
                    {r.status}
                </div>
            ),
        },
    ];
}

/* ---------- Filtros Header ---------- */
interface Filters {
    search: string;
    companyId: string; // string para el PageHeader
    isActive: string; // "", "1", "0"
    externalDelivery: string; // "", "1", "0"
}

const initialSalesChannelFilters: Filters = {
    search: "",
    companyId: "",
    isActive: "",
    externalDelivery: "",
};

/* ---------- Página ---------- */
export default function SalesChannelsView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const { fetchWithAuth } = useFetchWithAuth();
    const { token } = useAuth();

    // tabla
    const [rows, setRows] = useState<SalesChannelRow[]>([]);
    const [loading, setLoading] = useState(true);

    // errores
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // filtros
    const [companyOptions, setCompanyOptions] = useState<{ label: string; value: string }[]>([]);
    const filterConfigs = useMemo<FilterConfig<Filters>[]>(() => [
        {
            id: "search",
            label: "Buscar",
            type: "text",
            queryParam: "search",
        },
        {
            id: "companyId",
            label: "Compañía",
            type: "select-search",
            queryParam: "companyId",
            options: companyOptions,
            emptyOptionLabel: "Todas las compañías",
        },
        {
            id: "isActive",
            label: "Estado",
            type: "select",
            queryParam: "isActive",
            options: [
                { label: "Activo", value: "1" },
                { label: "Inactivo", value: "0" },
            ],
            emptyOptionLabel: "Todos",
        },
        {
            id: "externalDelivery",
            label: "Picking externo",
            type: "select",
            queryParam: "externalDelivery",
            options: [
                { label: "Sí", value: "1" },
                { label: "No", value: "0" },
            ],
            emptyOptionLabel: "Todos",
        },
    ], [companyOptions]);

    const {
        headerFilters,
        handleFilterChange,
        buildUrl,
    } = useStandardFilters<Filters>({
        initialFilters: initialSalesChannelFilters,
        configs: filterConfigs,
    });

    // cargar compañías para el filtro
    useEffect(() => {
        let mounted = true;
        const loadCompanies = async () => {
            try {
                if (!token) return;
                const res = await fetchWithAuth<{ ok: boolean; data: any[] }>("comerce-service/company");
                if (!mounted) return;
                const options = (res?.data ?? []).map((c: any) => ({
                    label: String(c?.BusinessName ?? c?.LegalName ?? `#${c?.Id ?? ""}`),
                    value: String(c?.Id),
                }));
                setCompanyOptions(options);
            } catch (e) {
                console.error("Error listando compañías:", e);
                setCompanyOptions([]);
            }
        };
        loadCompanies();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth, token]);

    // cargar listado principal
    const fetchList = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setErrorMessage(null);

        try {
            const endpointConfig: EndpointConfig<Filters> = {
                path: "comerce-service/sales-channel/Listar",
                pagination: {
                    page: currentPage,
                    pageSize: PER_PAGE,
                },
            };

            // puede devolver ApiListResponse o { message: "Tu usuario no tiene permiso..." }
            const raw = await fetchWithAuth<any>(buildUrl(endpointConfig));

            if (raw && typeof raw === "object" && "message" in raw && !Array.isArray(raw.data)) {
                // respuesta de error tipo { message: "..." }
                throw new Error(String(raw.message || "Error al listar canales de venta."));
            }

            const res = raw as ApiListResponse;

            const data = Array.isArray(res?.data) ? res.data : [];
            const mapped: SalesChannelRow[] = data.map((it) => ({
                id: it.Id,
                name: it.Name || "",
                company: it.CompanyName || "",
                referenceId: it.ReferenceId || "",
                externalDelivery: Boolean(it.ExternalDelivery),
                status: it.IsActive ? "Activo" : "Inactivo",
                createdAt: it.CreatedAt ? new Date(it.CreatedAt).toLocaleString("es-CL") : "—",
                updatedAt: it.UpdatedAt ? new Date(it.UpdatedAt).toLocaleString("es-CL") : "—",
            }));

            setRows(mapped);
            const total = Number(res?.total ?? 0);
            setTotalRecords(total);
        } catch (err: any) {
            console.error("Error listando canales de venta:", err?.payload ?? err);
            setRows([]);
            setTotalRecords(0);

            const msg =
                typeof err === "string"
                    ? err
                    : err?.message || "Error al listar canales de venta.";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    }, [token, fetchWithAuth, buildUrl, currentPage]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* acciones header */
    const handleExport = useCallback(() => {
        const headers = [
            "ID",
            "Nombre",
            "Compañía",
            "Ref ID",
            "Picking externo",
            "Estado",
            "Creado",
            "Actualizado",
        ];
        const data = rows.map((r) => [
            r.id,
            r.name,
            r.company,
            r.referenceId,
            r.externalDelivery ? "Sí" : "No",
            r.status,
            r.createdAt,
            r.updatedAt,
        ]);
        exportToCsv("sales-channels.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/cuenta/cuentas-comercio/canales-venta/nuevo"),
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
                title="Canales de venta"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    // Reiniciar a la primera página cuando los filtros cambien
                    setCurrentPage(1);
                    handleFilterChange(id, value);
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
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
                    ) : errorMessage ? (
                        <div
                            className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">Error al cargar canales de venta</h3>
                                    <p className="mt-2 text-sm">
                                        {errorMessage}
                                    </p>
                                    <div className="mt-4">
                                        <div className="-mx-2 -my-1.5 flex">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setErrorMessage(null);
                                                    fetchList();
                                                }}
                                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: SalesChannelRow) =>
                                router.push(`/cuenta/cuentas-comercio/canales-venta/${row.id}`)
                            }
                        />
                    )}
                    {!loading && (
                        <Pagination
                            currentPage={currentPage}
                            totalRecords={totalRecords}
                            pageSize={PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
