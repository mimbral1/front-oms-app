"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { DataTable } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { StoreIcon } from "lucide-react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { formatDateTime } from "@/lib/format/date";
import { getEstadoColor } from "@/utils/status";
import { type EndpointConfig, type FilterConfig, useStandardFilters } from "@/lib/filters";

export interface Product {
  Id?: string;
  Image: string | null;
  Name: string;
  ItemCode: string;
  Category: string | null;
  Brand: string | null;
  TotalSalesChannel: string | null;
  DateModified: string | null;
  Status: string;
  Eans: string | null;
}

export interface ProductsAPIResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: Product[];
}

export interface CategoryOption {
  Code: string;
  Name: string;
}

type Opt = { label: string; value: string };

const getStatusColor = getEstadoColor;

function getColumns() {
  return [
    {
      header: "Imagen",
      accessorKey: "Image",
      cell: (row: Product) => (
        <div className="flex cursor-pointer items-center">
          <img
            src={row.Image || "https://tumayorferretero.net/22457-large_default/producto-generico.jpg"}
            alt={row.Name || "Imagen del producto"}
            className="h-16 w-16 rounded-md border border-gray-200 object-cover"
          />
        </div>
      ),
    },
    {
      header: "Producto",
      accessorKey: "ItemCode",
      cell: (row: Product) => (
        <div className="text-sm">
          <CopyableText text={row.ItemCode} className="font-semibold text-gray-900">
            #{row.ItemCode}
          </CopyableText>
          <div className="text-sm text-gray-500">{row.Name}</div>
        </div>
      ),
    },
    {
      header: "Marca y categoría",
      accessorKey: "Category",
      cell: (row: Product) => (
        <div className="flex flex-col items-start gap-1">
          {row.Category && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {row.Category}
            </span>
          )}
          {row.Brand && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {row.Brand}
            </span>
          )}
          {!row.Category && !row.Brand && <span className="text-xs text-gray-500">Sin grupos</span>}
        </div>
      ),
    },
    {
      header: "Canales de venta",
      accessorKey: "TotalSalesChannel",
      cell: (row: Product) => (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
          <div className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5" />
            <span className="text-sm font-medium text-gray-900">{row.TotalSalesChannel || "0"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Sku",
      accessorKey: "ItemCode",
      cell: (row: Product) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{row.ItemCode}</span>
          <span className="text-xs text-gray-500">{row.Name}</span>
        </div>
      ),
    },
    {
      header: "Fecha de modificación",
      accessorKey: "DateModified",
      cell: (row: Product) => {
        const { date, time } = formatDateTime(row.DateModified);
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">{date}</span>
            <span className="text-gray-600">{time}</span>
          </div>
        );
      },
    },
    {
      header: "Estado",
      accessorKey: "Status",
      cell: (row: Product) => {
        const bgColor = getStatusColor(row.Status);
        const displayStatusText = row.Status === "Y" ? "Activo" : row.Status === "N" ? "Inactivo" : row.Status;

        return (
          <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${bgColor}`}>
            {displayStatusText}
          </div>
        );
      },
    },
  ];
}

interface ProductFilters {
  nameSearch: string;
  itemCodeSearch: string;
  brand: string;
  salesChannels: string;
  categoryName: string;
  barcode: string;
}

const initialFilters: ProductFilters = {
  nameSearch: "",
  itemCodeSearch: "",
  brand: "",
  salesChannels: "",
  categoryName: "",
  barcode: "",
};

export default function ProductBrowseView() {
  const router = useRouter();
  const { token } = useAuth();
  const { fetchWithAuth } = useFetchWithAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [brandOptions, setBrandOptions] = useState<Opt[]>([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [salesChannelOptions, setSalesChannelOptions] = useState<Opt[]>([{ label: "Todos los canales", value: "" }]);
  const [salesChannelSearchQuery, setSalesChannelSearchQuery] = useState("");

  const filterConfig = useMemo<FilterConfig<ProductFilters>[]>(
    () => [
      {
        id: "nameSearch",
        label: "Nombre producto",
        type: "text",
        queryParam: "name",
      },
      {
        id: "itemCodeSearch",
        label: "Sku",
        type: "text",
        queryParam: "itemCode",
      },
      {
        id: "brand",
        label: "Marca",
        type: "select-search",
        options: brandOptions,
        searchMode: "external",
        externalSearchQuery: brandSearchQuery,
        onSearchQueryChange: setBrandSearchQuery,
        emptyOptionLabel: false,
      },
      {
        id: "salesChannels",
        label: "Canales de venta",
        type: "select-search",
        options: salesChannelOptions,
        searchMode: "external",
        externalSearchQuery: salesChannelSearchQuery,
        onSearchQueryChange: setSalesChannelSearchQuery,
        queryParam: "salesChannelId",
        emptyOptionLabel: false,
      },
      {
        id: "categoryName",
        label: "Categorías",
        type: "select-search",
        options: categoryOptions.map((category) => ({
          label: category.Name,
          value: category.Code === "" ? "" : category.Name,
          code: category.Code,
        })),
        searchMode: "external",
        externalSearchQuery: categorySearchQuery,
        onSearchQueryChange: setCategorySearchQuery,
        emptyOptionLabel: false,
      },
      {
        id: "barcode",
        label: "Eans",
        type: "text",
        queryParam: "barcode",
      },
    ],
    [brandOptions, brandSearchQuery, salesChannelOptions, salesChannelSearchQuery, categoryOptions, categorySearchQuery]
  );

  const { filters, headerFilters, handleFilterChange, buildUrl, resetFilters } =
    useStandardFilters<ProductFilters>({
      initialFilters,
      configs: filterConfig,
    });

  const fetchBrandOptions = useCallback(async () => {
    try {
      const query = brandSearchQuery.trim();
      const params = new URLSearchParams({
        page: "1",
        pageSize: "20",
        code: "",
        name: "",
        fromdate: "",
        todate: "",
      });

      if (query) {
        if (/^\d+$/.test(query)) params.set("code", query);
        else params.set("name", query);
      }

      const data = await fetchWithAuth<{
        page: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
        data: Array<{ Code: string; Name: string }>;
      }>(`catalog/getmarca?${params.toString()}`);

      const uniqueNames = Array.from(
        new Map(
          (data?.data ?? [])
            .map((brand) => (brand?.Name ?? "").trim())
            .filter(Boolean)
            .map((name) => [name.toLowerCase(), name])
        ).values()
      );

      const selected = filters.brand.trim();
      const selectedLower = selected.toLowerCase();
      const remaining = uniqueNames
        .filter((name) => name.toLowerCase() !== selectedLower)
        .sort((left, right) => left.localeCompare(right, "es", { sensitivity: "base" }));

      const finalNames = selected ? [selected, ...remaining] : remaining;
      setBrandOptions([
        { label: "Todas las marcas", value: "" },
        ...finalNames.map((name) => ({ label: name, value: name })),
      ]);
    } catch {
      setBrandOptions([{ label: "Todas las marcas", value: "" }]);
    }
  }, [brandSearchQuery, fetchWithAuth, filters.brand]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBrandOptions();
    }, 300);
    return () => clearTimeout(handler);
  }, [brandSearchQuery, fetchBrandOptions]);

  const fetchSalesChannelOptions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "200",
        isActive: "1",
      });

      const search = salesChannelSearchQuery.trim();
      if (search) params.set("search", search);

      const response = await fetchWithAuth<any>(
        `comerce-service/sales-channel/Listar?${params.toString()}`,
        { method: "GET" }
      );

      const rawItems = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const options = rawItems.map((channel: { Id?: number | string; Name?: string; ExternalDelivery?: boolean }) => ({
        value: String(channel.Id),
        label: `${channel.Name || "Sin nombre"}${channel.ExternalDelivery ? " (Entrega externa)" : ""}`,
      }));

      setSalesChannelOptions([{ label: "Todos los canales", value: "" }, ...options]);
    } catch {
      setSalesChannelOptions([{ label: "Todos los canales", value: "" }]);
    }
  }, [fetchWithAuth, salesChannelSearchQuery]);

  useEffect(() => {
    if (!token) return;
    fetchSalesChannelOptions();
  }, [fetchSalesChannelOptions, token]);

  const fetchCategoryOptions = useCallback(async () => {
    try {
      let url = "catalog/getcategory";
      if (categorySearchQuery) url += `?buscar=${categorySearchQuery}`;
      const data = await fetchWithAuth<CategoryOption[]>(url);
      setCategoryOptions([{ Code: "", Name: "Todas las categorías" }, ...data]);
    } catch {
      setCategoryOptions([{ Code: "", Name: "Todas las categorías" }]);
    }
  }, [categorySearchQuery, fetchWithAuth]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCategoryOptions();
    }, 300);
    return () => clearTimeout(handler);
  }, [categorySearchQuery, fetchCategoryOptions]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpointConfig: EndpointConfig<ProductFilters> = {
        path: "catalog/products",
        pagination: { page: currentPage, pageSize },
        queryMapper: (activeFilters) => ({
          name: activeFilters.nameSearch || undefined,
          itemCode: activeFilters.itemCodeSearch || undefined,
          category: activeFilters.categoryName || categorySearchQuery || undefined,
          brand: activeFilters.brand || brandSearchQuery || undefined,
          barcode: activeFilters.barcode || undefined,
          salesChannelId: activeFilters.salesChannels || undefined,
        }),
      };

      const data = await fetchWithAuth<ProductsAPIResponse>(buildUrl(endpointConfig));
      setProducts(data.data);
      setTotalProducts(data.totalRecords);
    } catch (err: any) {
      setError(`Error al cargar productos: ${err.message}`);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, currentPage, pageSize, buildUrl, categorySearchQuery, brandSearchQuery]);

  useEffect(() => {
    if (!token) return;
    fetchProducts();
  }, [fetchProducts, token]);

  const handleRefresh = () => {
    setCurrentPage(1);
    setCategorySearchQuery("");
    setSalesChannelSearchQuery("");
    setBrandSearchQuery("");
    resetFilters();
  };

  const handleExport = () => {
    const headers = ["ItemCode", "Nombre", "Marca y categoría", "Canales de venta", "EANs", "Fecha modificación", "Estado"];
    const rows = products.map((product) => [
      product.ItemCode,
      product.Name,
      [product.Brand, product.Category].filter(Boolean).join(" / ") || "",
      product.TotalSalesChannel ?? "0",
      product.Eans ?? "",
      product.DateModified ?? "",
      product.Status,
    ]);
    exportToCsv("productos.csv", [headers, ...rows]);
  };

  const headerActions: Action[] = [
    {
      label: "Nuevo",
      variant: "success",
      onClick: () => router.push("/catalogo/productos/details/nuevo"),
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Actualizar",
      variant: "secondary",
      onClick: handleRefresh,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary",
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
  ];

  const columns = useMemo(() => getColumns(), []);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title="Productos y SKUs"
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
            {loading ? (
              <div className="bg-white">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                        <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                        Cargando...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : error ? (
              <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700 shadow-sm" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Error al cargar datos</h3>
                    <p className="mt-2 text-sm">{error}</p>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          onClick={handleRefresh}
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
                data={products}
                dataType="Products"
                statusKey="Status"
                columns={columns as any}
                rowBgClass="bg-white"
                rowPaddingY={12}
                onRowClick={(row: Product) => router.push(`/catalogo/productos/details/${row.ItemCode}`)}
              />
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalRecords={totalProducts}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
