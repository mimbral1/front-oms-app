"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { type Estado, getEstadoColor } from "@/utils/status";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    PlusIcon,
    PhotoIcon,
    CurrencyDollarIcon,
    ClipboardDocumentListIcon,
    BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";
import { type EndpointConfig, type FilterConfig, useStandardFilters } from "@/lib/filters";

type ApiProduct = {
    Image: string | null;
    Name: string;
    ItemCode: string;
    Category: string | null;
    Brand: string | null;
    TotalSalesChannel: string | null;
    DateModified: string | null;
    Status: string;
    Eans: string | null;
};

type ApiProductsResponse = {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    data: ApiProduct[];
};

type ApiBarcodeItem = {
    ItemCode: string;
    Primary: string | null;
    Secondary: string[];
    All: string[];
    UpdateDate: string | null;
};

type ApiBarcodesResponse = {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    data: ApiBarcodeItem[];
};

type ApiPriceItem = {
    ItemCode: string;
    PriceList: number;
    Price: number;
    PriceIVA: number;
    Status: string;
};

type ApiPricesResponse = {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    data: ApiPriceItem[];
};

interface SkuRow {
    id: string;
    refId: string;
    name: string;
    brand: string;
    imageUrl: string | null;
    eans: string[];
    channels: number;
    uom: string;
    price: number | null;
    hasStock: boolean;
    status: Estado;
    lastModified: string;
    syncStatus: "Synced" | "Pending";
}

interface Filters {
    refId: string;
    name: string;
    storeId: string;
    categoryId: string;
    ean: string;
}

const PER_PAGE = 20;
const getStatusColor = getEstadoColor;

const initialFilters: Filters = {
    refId: "",
    name: "",
    storeId: "",
    categoryId: "",
    ean: "",
};

const filterConfig: FilterConfig<Filters>[] = [
    {
        id: "refId",
        label: "Ref ID",
        type: "text",
        queryParam: "itemCode",
        placeholder: "",
    },
    {
        id: "name",
        label: "Nombre",
        type: "text",
        queryParam: "name",
    },
    {
        id: "storeId",
        label: "Tienda",
        type: "select",
        options: [
            { label: "Tienda Central", value: "1" },
            { label: "Sucursal Norte", value: "2" },
        ],
        emptyOptionLabel: "Todas",
        mapQueryValue: () => undefined,
    },
    {
        id: "categoryId",
        label: "Categoría",
        type: "select",
        queryParam: "category",
        options: [
            { label: "Construcción", value: "cat_1" },
            { label: "Cuidado Personal", value: "cat_2" },
        ],
        emptyOptionLabel: "Todas",
    },
    {
        id: "ean",
        label: "EAN",
        type: "text",
        queryParam: "barcode",
    },
];

function formatDateSafe(raw?: string | null): string {
    if (!raw) return "Sin fecha";
    try {
        const parts = raw.trim().split(/\s+/);
        if (parts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
            const [year, month, day] = parts[0].split("-");
            return `${day}/${month}/${year} ${parts[1].substring(0, 5)}`;
        }
        const date = new Date(raw);
        if (!Number.isNaN(date.getTime())) {
            const pad = (value: number) => String(value).padStart(2, "0");
            return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }
    } catch {}
    return raw.trim() || "Sin fecha";
}

const StatusPill = ({ status }: { status: Estado }) => (
    <div
        className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(status)}`}
    >
        {status}
    </div>
);

function getColumns(): Column<SkuRow>[] {
    return [
        {
            header: "Imagen",
            accessorKey: "imageUrl",
            cell: (row) => (
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    {row.imageUrl ? (
                        <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
                    ) : (
                        <PhotoIcon className="h-6 w-6 text-gray-300" />
                    )}
                </div>
            ),
        },
        {
            header: "SKUS",
            accessorKey: "refId",
            cell: (row) => (
                <div className="flex flex-col">
                    <CopyableText text={row.refId} className="text-sm font-medium text-gray-900">
                        {row.refId} - {row.name}
                    </CopyableText>
                    <span className="text-xs text-gray-500">{row.brand}</span>
                </div>
            ),
        },
        {
            header: "Eans",
            accessorKey: "eans",
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.eans.map((ean, index) => (
                        <CopyableText
                            key={`${row.id}-${ean}-${index}`}
                            text={ean}
                            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                        >
                            {ean}
                        </CopyableText>
                    ))}
                </div>
            ),
        },
        {
            header: "Canales",
            accessorKey: "channels",
            cell: (row) => (
                <div className="flex items-center gap-1 text-gray-600">
                    <BuildingStorefrontIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{row.channels}</span>
                </div>
            ),
        },
        {
            header: "Unidad de medida de venta",
            accessorKey: "uom",
            cell: (row) => <span className="text-sm text-gray-600">{row.uom}</span>,
        },
        {
            header: "Precio",
            accessorKey: "price",
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <CurrencyDollarIcon className={`h-4 w-4 ${row.price != null ? "text-gray-700" : "text-gray-300"}`} />
                    <span className={`text-sm ${row.price != null ? "font-medium text-gray-900" : "text-gray-400"}`}>
                        {row.price != null ? `$${Math.round(row.price).toLocaleString("es-CL")}` : "-"}
                    </span>
                </div>
            ),
        },
        {
            header: "Stock",
            accessorKey: "hasStock",
            cell: (row) => (
                <div className="flex justify-center">
                    <ClipboardDocumentListIcon className={`h-5 w-5 ${row.hasStock ? "text-gray-700" : "text-gray-300"}`} />
                </div>
            ),
        },
        {
            header: "Última modificación",
            accessorKey: "lastModified",
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm text-gray-700">{row.lastModified}</span>
                    {row.syncStatus === "Pending" && (
                        <span className="flex items-center gap-1 text-xs text-blue-500">
                            <ArrowPathIcon className="h-3 w-3" /> Pendiente
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => <StatusPill status={row.status} />,
        },
    ];
}

export default function SKUsView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const { fetchWithAuth } = useFetchWithAuth();
    const { token } = useAuth();
    const [rows, setRows] = useState<SkuRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const { filters, headerFilters, handleFilterChange, buildUrl } = useStandardFilters<Filters>({
        initialFilters,
        configs: filterConfig,
    });

    const fetchList = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const endpointConfig: EndpointConfig<Filters> = {
                path: "catalog/products",
                pagination: { page: currentPage, pageSize: PER_PAGE },
            };

            const productsRes = await fetchWithAuth<ApiProductsResponse>(buildUrl(endpointConfig));
            const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
            const itemCodes = products.map((product) => product.ItemCode).filter(Boolean);
            let barcodesMap: Record<string, string[]> = {};
            let pricesMap: Record<string, number> = {};

            if (itemCodes.length > 0) {
                const [barcodeRes, pricesRes] = await Promise.allSettled([
                    fetchWithAuth<ApiBarcodesResponse>(
                        `catalog/barcodes?page=1&pageSize=${itemCodes.length * 2}`
                    ),
                    fetchWithAuth<ApiPricesResponse>(
                        `catalog/listprices?page=1&pageSize=${itemCodes.length * 3}`
                    ),
                ]);

                if (barcodeRes.status === "fulfilled") {
                    const barcodeData = Array.isArray(barcodeRes.value?.data) ? barcodeRes.value.data : [];
                    for (const barcode of barcodeData) {
                        if (barcode.ItemCode && barcode.All?.length > 0) {
                            barcodesMap[barcode.ItemCode] = barcode.All;
                        }
                    }
                }

                if (pricesRes.status === "fulfilled") {
                    const priceData = Array.isArray(pricesRes.value?.data) ? pricesRes.value.data : [];
                    for (const price of priceData) {
                        if (!price.ItemCode) continue;
                        if (!(price.ItemCode in pricesMap) || price.PriceList === 1) {
                            pricesMap[price.ItemCode] = price.PriceIVA;
                        }
                    }
                }
            }

            const mapped: SkuRow[] = products.map((product) => {
                const eans = barcodesMap[product.ItemCode] ?? (
                    product.Eans
                        ? product.Eans.split(",").map((value) => value.trim()).filter(Boolean)
                        : []
                );
                const isActive = product.Status === "Activo" || product.Status === "Y";

                return {
                    id: product.ItemCode,
                    refId: product.ItemCode,
                    name: product.Name ?? "",
                    brand: product.Brand ?? "",
                    imageUrl: product.Image,
                    eans,
                    channels: Number(product.TotalSalesChannel) || 0,
                    uom: "-",
                    price: pricesMap[product.ItemCode] ?? null,
                    hasStock: true,
                    status: isActive ? "Activo" : "Inactivo",
                    lastModified: formatDateSafe(product.DateModified),
                    syncStatus: "Synced",
                };
            });

            setRows(mapped);
            setTotalRecords(Number(productsRes?.totalRecords ?? 0));
        } catch (error: any) {
            console.error("Error listando SKUs:", error?.payload ?? error);
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
        const headers = ["Ref ID", "Nombre", "Marca", "UOM", "Precio", "Estado", "Modificado"];
        const data = rows.map((row) => [
            row.refId,
            row.name,
            row.brand,
            row.uom,
            row.price != null ? `$${Math.round(row.price).toLocaleString("es-CL")}` : "",
            row.status,
            row.lastModified,
        ]);
        exportToCsv("skus-export.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/catalogo/skus/nuevo"),
                icon: <PlusIcon className="h-5 w-5" />,
            },
            {
                label: "Exportar",
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
        ],
        [router, handleExport]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="SKUs"
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
                        <div className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                            <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                            Cargando SKUs...
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
                            onRowClick={(row: SkuRow) => router.push(`/catalogo/skus/${row.id}`)}
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
