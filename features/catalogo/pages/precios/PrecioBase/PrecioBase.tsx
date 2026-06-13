"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { formatCurrency } from "@/lib/format/money";

// Formatea una fecha ISO a un formato más legible (ej: DD/MM/YYYY HH:MM)
const formatDate = (isoDate: string | null) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Interfaz para la respuesta de la API de precios
interface ListPriceData {
  ItemCode: string;
  PriceList: number;
  Price: number | null;
  PriceIVA: number | null;
  CreatedAt: string;
  UpdatedAt: string | null;
  ItemName: string;
  Status: string;
  CostPrice: number | null;
  MarginPercent: string;
}

// Interfaz para la paginación de la API
interface ApiResponse<T> {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: T[];
}

// Interfaz para el detalle de la lista de precios de la API
interface ApiPriceListDetail {
  ListNum: number;
  ListName: string;
  GroupCode: number;
  ValidFor: string;
  CreatedByName: string;
}

// Interfaz para los filtros de la vista, ajustado para ser como PrecioView.tsx
interface PriceFilters {
  itemCode: string;
  priceList: string;
  minPrice: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-500";
    case "Inactive":
      return "bg-gray-400";
    default:
      return "bg-gray-500";
  }
};

const getPriceFilters = (
  f: PriceFilters,
  priceListsMap: Map<number, ApiPriceListDetail>,
  priceListSearchQuery: string,
  setPriceListSearchQuery: (query: string) => void
) => {
  const filteredPriceListOptions = Array.from(priceListsMap.values())
    .filter(pl => pl.ListName.toLowerCase().includes(priceListSearchQuery.toLowerCase()))
    .map(pl => ({
      label: pl.ListName,
      value: String(pl.ListNum),
    }));

  return [
    {
      id: "itemCode",
      label: "Sku y/o Nombre del Producto",
      type: "text" as const,
      value: f.itemCode,
    },
    {
      id: "priceList",
      label: "Lista de Precios",
      type: "select-search" as const,
      value: f.priceList,
      options: [
        { label: "Todas", value: "" },
        ...filteredPriceListOptions,
      ],
      onSearch: setPriceListSearchQuery,
      searchQuery: priceListSearchQuery,
    },
    {
      id: "minPrice",
      label: "Precio Mínimo",
      type: "text" as const,
      value: f.minPrice,
    },
  ];
};


const getColumns = (router: ReturnType<typeof useRouter>) => [
  {
    header: "Nombre del producto",
    accessorKey: "ItemName" as const,
    cell: (row: ListPriceData) => (
      <div
        onClick={() => router.push(`/catalogo/precios/precio-base/${row.ItemCode}/${row.PriceList}`)}
      >
        <span className="text-sm text-gray-800">{row.ItemName}</span>
      </div>
    ),
  },
  {
    header: "Precio",
    accessorKey: "Price" as const,
    cell: (row: ListPriceData) => (
      <span className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm bg-white">
        {formatCurrency(row.Price)}
      </span>
    ),
  },
  {
    header: "Precio con IVA",
    accessorKey: "PriceIVA" as const,
    cell: (row: ListPriceData) => (
      <span className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm bg-white">
        {formatCurrency(row.PriceIVA)}
      </span>
    ),
  },
  {
    header: "Lista de precio",
    accessorKey: "PriceList" as const,
    cell: (row: ListPriceData) => (
      <span className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm bg-white">
        {row.PriceList}
      </span>
    ),
  },
  {
    header: "Precio de costo",
    accessorKey: "CostPrice" as const,
    cell: (row: ListPriceData) => (
      <>
        {row.CostPrice !== null && row.CostPrice !== undefined ? (
          <span className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm bg-white">
            {formatCurrency(row.CostPrice)}
          </span>
        ) : (
          <span>—</span>
        )}
      </>
    ),
  },
  {
    header: "Porcentaje de margen",
    accessorKey: "MarginPercent" as const,
    cell: (row: ListPriceData) => (
      <>
        {row.MarginPercent !== null && row.MarginPercent !== undefined && row.MarginPercent !== "" ? (
          <span className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm bg-white">
            {row.MarginPercent}%
          </span>
        ) : (
          <span>—</span>
        )}
      </>
    ),
  },
  {
    header: "Fecha de modificación",
    accessorKey: "UpdatedAt" as const,
    cell: (row: ListPriceData) => (
      <div className="flex flex-col text-sm text-gray-700">
        <span>{formatDate(row.UpdatedAt)}</span>
      </div>
    ),
  },
  {
    header: "Estado",
    accessorKey: "Status" as const,
    cell: (row: ListPriceData) => {
      const bgColor = getStatusColor(row.Status);
      const statusText = row.Status === "Active" ? "Activo" : "Inactivo";
      return (
        <div
          className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium text-white ${bgColor}`}
        >
          {statusText}
        </div>
      );
    },
  },
];

export function BasePriceBrowseView() {

  const router = useRouter();
  const { fetchWithAuth } = useFetchWithAuth();
  const { token } = useAuth();

  const [filters, setFilters] = useState<PriceFilters>({
    itemCode: "",
    priceList: "",
    minPrice: "",
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListPriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 0,
  });

  const [priceListsMap, setPriceListsMap] = useState<Map<number, ApiPriceListDetail>>(new Map());
  const [priceListSearchQuery, setPriceListSearchQuery] = useState("");

  const ITEMS_PER_PAGE = 10;

  // Helpers de paginación 
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  /** Ventana deslizante de 3 páginas. */

  // Asegura que la página actual no quede fuera de rango cuando cambia totalPages
  useEffect(() => {
    const tp = pagination.totalPages || 1;
    if (page > tp) setPage(tp);
    if (page < 1) setPage(1);
  }, [pagination.totalPages]);


  // Obtener listas de precios
  const fetchPriceLists = useCallback(async () => {
    if (!token) return;
    try {
      const result = await fetchWithAuth<ApiResponse<ApiPriceListDetail>>(
        `catalog/price-lists`
      );
      const newMap = new Map<number, ApiPriceListDetail>();
      result.data.forEach((pl) => newMap.set(pl.ListNum, pl));
      setPriceListsMap(newMap);
    } catch (e) {
      console.error("Error fetching price lists:", e);
    }
  }, [token, fetchWithAuth]);

  // Obtener precios
  const fetchPrices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(ITEMS_PER_PAGE),
      });
      if (filters.itemCode) params.append("itemCode", filters.itemCode);
      if (filters.priceList) params.append("priceList", filters.priceList);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);

      const result = await fetchWithAuth<ApiResponse<ListPriceData>>(
        `catalog/listprices?${params.toString()}`
      );
      setData(result.data);
      setPagination({
        totalRecords: result.totalRecords,
        totalPages: result.totalPages,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, fetchWithAuth, page, filters]);

  useEffect(() => {
    fetchPriceLists();
  }, [fetchPriceLists]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);


  const handleExport = () => {
    const headers = [
      "ItemCode",
      "ItemName",
      "Price",
      "PriceIVA",
      "DateModified",
      "Status",
    ];
    const rows = data.map((r) => [
      r.ItemCode,
      r.ItemName,
      formatCurrency(r.Price),
      formatCurrency(r.PriceIVA),
      formatDate(r.UpdatedAt),
      r.Status,
    ]);
    exportToCsv("base-price-browse.csv", [headers, ...rows]);
  };

  /* acciones header */

  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push(`/catalogo/precios/precio-base/nuevo`),
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
  ];

  const columns = getColumns(router);

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Buscar Precio Base"
        filters={getPriceFilters(filters, priceListsMap, priceListSearchQuery, setPriceListSearchQuery)}
        onFilterChange={(id, val) => {
          setFilters((prev) => ({ ...prev, [id]: val }));
          setPage(1);
        }}
        action={headerActions}
        onMoreOptions={() => { }}
        filterTitle={true} // Mostrar títulos de los filtros
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="overflow-hidden rounded-xl shadow-sm">
          {loading ? (
            // <div className="p-6 text-center text-gray-500">Cargando categorías...</div>
            // Esqueleto de carga (opcional: puedes crear un componente más complejo)
            <div className="bg-white p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
            // <div className="p-6 text-center text-gray-500">
            //   Cargando productos...
            // </div>
          ) : error ? (
            // <div className="p-6 text-center text-red-500">Error: {error}</div>
            // Alerta de error más profesional
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-sm" role="alert">
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
                        // onClick={handleRefresh}
                        className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                      >
                        Reintentar
                      </button>
                      {/* <button
                          type="button"
                          className="ml-3 rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                        >
                          Contactar Soporte
                        </button> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            // <div className="p-6 text-center text-red-500">
            //   Error: {error}
            // </div>
          ) : (
            <DataTable
              data={data}
              columns={columns}
              dataType="General"
              statusKey="Status"
              rowPaddingY={12}
              rowGap={4}
              rowBgClass="bg-white "
              onRowClick={(row: ListPriceData) =>
                router.push(`/catalogo/precios/precio-base/${row.ItemCode}/${row.PriceList}`)

              }
            />
          )}
        </div>
        <Pagination
          currentPage={page}
          totalRecords={pagination.totalRecords}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

