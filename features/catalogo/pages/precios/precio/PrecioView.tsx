// app/views/Pricing/PriceBrowse/PriceBrowseView.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";
import { getEstadoColor } from "@/utils/status";
import { formatCurrency } from "@/lib/format/money";
import { Avatar } from "@/components/ui/user-avatar";

/* ---------- tipos ---------- */

// Renombramos 'listPrice' a 'precioIva'
export interface Price {
  id: string; // ItemCode
  sku: string; // ItemName
  priceSheet: string; // ListName
  price: string;
  precioIva: string;
  minQuantity: number;
  dateFrom: string;
  dateTo: string;
  modifiedAt: string;
  userModified: { initials: string; name: string; email: string }; // CreatedByName
  status: string;
}

// Interfaz para los datos crudos de la API /api/catalog/listprices
interface ApiPriceData {
  ItemCode: string;
  PriceList: number;
  Price: number;
  PriceIVA: number;
  CreatedAt: string;
  UpdatedAt: string | null;
  ItemName: string;
  MinQuantity: number;
  DateFrom: string | null;
  DateTo: string | null;
  DateModified: string | null; // Añadido este campo, asumiendo que es el que usarás para modifiedAt
  Status: string; // Asegúrate de que este campo esté en mayúscula si así viene de la API
}

// Interfaz para los datos de la API /api/catalog/price-lists
interface ApiPriceListDetail {
  ListNum: number;
  ListName: string;
  CreatedByName: string;
  CreatedByEmail: string | null;
}

/* ---------- helpers ---------- */
const getStatusColor = getEstadoColor;

// Formatea una fecha ISO a un formato más legible (ej: DD/MM/YYYY HH:MM)
const formatDate = (isoDate: string | null) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Formato 24 horas
  });
};

/* ---------- columnas ---------- */
function getColumns(router: ReturnType<typeof useRouter>): Column<Price>[] {
  return [
    {
      header: "SKU",
      accessorKey: "sku",
    },
    {
      header: "Lista de precios",
      accessorKey: "priceSheet",
      cell: (r) => r.priceSheet,
    },
    {
      header: "Precio",
      accessorKey: "price",
      cell: (r) => (
        <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium">
          {r.price}
        </span>
      ),
    },
    {
      header: "Precio IVA",
      accessorKey: "precioIva",
      cell: (r) => (
        <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium">
          {r.precioIva}
        </span>
      ),
    },
    {
      header: "Cantidad mínima",
      accessorKey: "minQuantity",
      cell: (r) => (
        <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium">
          {r.minQuantity}
        </span>
      ),
    },
    {
      header: "Fecha desde",
      accessorKey: "dateFrom",
      cell: (r) => r.dateFrom || "--",
    },
    {
      header: "Fecha hasta",
      accessorKey: "dateTo",
      cell: (r) => r.dateTo || "--",
    },
    {
      header: "Fecha de modificación",
      accessorKey: "modifiedAt",
      cell: (r) => r.modifiedAt,
    },
    {
      header: "Usuario modificador",
      accessorKey: "userModified",
      cell: (r) => <UserChip {...r.userModified} />,
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row: Price) => {
        const bgColor = getStatusColor(row.status);
        const displayStatusText =
          row.status === "Active" ? "Activo" : row.status === "Inactive" ? "Inactivo" : row.status;

        return (
          <div
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${bgColor}`}
          >
            {displayStatusText}
          </div>
        );
      },
    },
  ];
}

/* mini-componente para "User modified" */
function UserChip({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  if (!name && !email) return <span>N/A</span>; // Manejar caso sin datos

  return (
    <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
      <Avatar
        name={name || email || "-"}
        alt={name || email || "-"}
        className="h-8 w-8"
      />
      <div className="flex flex-col overflow-hidden text-left">
        <span className="truncate text-sm font-medium">{name || 'Usuario desconocido'}</span>
        <span className="truncate text-xs text-gray-500">{email || ''}</span>
      </div>
    </div>
  );
}

/* ---------- filtros para PageHeader ---------- */
interface PriceFilters {
  itemCode: string;
  priceList: string;
  minPrice: string;
}

const getPriceFilters = (f: PriceFilters, priceListsMap: Map<number, ApiPriceListDetail>, priceListSearchQuery: string, setPriceListSearchQuery: (query: string) => void) => {
  // Filtra las opciones de lista de precios en el frontend
  const filteredPriceListOptions = Array.from(priceListsMap.values())
    .filter(pl => pl.ListName.toLowerCase().includes(priceListSearchQuery.toLowerCase()))
    .map(pl => ({
      label: pl.ListName,
      value: String(pl.ListNum), // El valor es el número de la lista, como string
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
      label: "Precio",
      type: "text" as const,
      value: f.minPrice,
    },
  ];
};

/* ---------- página ---------- */
export function PriceBrowseView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(router), [router]);
  const { fetchWithAuth } = useFetchWithAuth();
  const { token } = useAuth();

  const [rows, setRows] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PER_PAGE = 10; // Según el pageSize de la API

  // Helpers de paginación (evitan salirse de rango)
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // Estado para almacenar el mapeo de ListNum a sus detalles (ListName, CreatedByName)
  const [priceListDetailsMap, setPriceListDetailsMap] = useState<Map<number, ApiPriceListDetail>>(new Map());

  // Agregar el estado para la búsqueda interna del select-search
  const [priceListSearchQuery, setPriceListSearchQuery] = useState("");

  const [filters, setFilters] = useState<PriceFilters>({
    itemCode: "", // Inicializado como itemCode
    priceList: "",
    minPrice: "", // Inicializado como minPrice
  });

  // Función para obtener los detalles de las listas de precios
  const fetchPriceListDetails = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchWithAuth<{ data: ApiPriceListDetail[] }>(`catalog/price-lists?pageSize=500`);
      const newMap = new Map<number, ApiPriceListDetail>();
      data.data.forEach(list => newMap.set(list.ListNum, list));
      setPriceListDetailsMap(newMap);
    } catch (error) {
      console.error("Error al obtener listas de precios:", error);
    }
  }, [token, fetchWithAuth]);

  const fetchPrices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      params.append("pageSize", String(PER_PAGE));
      if (filters.itemCode) params.append("itemCode", filters.itemCode);
      if (filters.priceList) params.append("priceList", filters.priceList);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);

      const data = await fetchWithAuth<{ data: ApiPriceData[]; totalPages: number; totalRecords: number }>(`catalog/listprices?${params.toString()}`);
      const transformedRows: Price[] = data.data.map(apiItem => {
        const priceListDetail = priceListDetailsMap.get(apiItem.PriceList);
        const userName = priceListDetail?.CreatedByName || "Desconocido";
        const userEmail = priceListDetail?.CreatedByEmail || "";
        const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "UD";
        return {
          id: apiItem.ItemCode,
          sku: apiItem.ItemName,
          priceSheet: priceListDetail?.ListName || `Lista ${apiItem.PriceList}`,
          price: formatCurrency(apiItem.Price),
          precioIva: formatCurrency(apiItem.PriceIVA),
          minQuantity: apiItem.MinQuantity,
          dateFrom: formatDate(apiItem.DateFrom),
          dateTo: formatDate(apiItem.DateTo),
          modifiedAt: formatDate(apiItem.DateModified || apiItem.UpdatedAt || apiItem.CreatedAt),
          userModified: { initials: userInitials, name: userName, email: userEmail },
          status: apiItem.Status,
        };
      });
      setRows(transformedRows);
      setTotalPages(data.totalPages);
      setTotalRecords(data.totalRecords);
    } catch (error) {
      console.error("Error al obtener precios:", error);
      setRows([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, filters, priceListDetailsMap, fetchWithAuth]);

  useEffect(() => {
    if (!token) return;
    fetchPriceListDetails();
  }, [token, fetchPriceListDetails]);

  useEffect(() => {
    if (!token) return;
    if (priceListDetailsMap.size > 0 || Object.values(filters).every(val => val === "")) {
      fetchPrices();
    }
  }, [token, currentPage, filters, priceListDetailsMap, fetchPrices]);
  /* export CSV */
  const handleExport = () => {
    const headers = [
      "ID",
      "SKU",
      "Price sheet",
      "Price",
      "Precio IVA",
      "Min quantity",
      "Date from",
      "Date to",
      "Modified at",
      "User modified",
      "User email",
      "Status",
    ];
    const data = rows.map((r) => [
      r.id,
      r.sku,
      r.priceSheet,
      r.price,
      r.precioIva,
      String(r.minQuantity),
      r.dateFrom,
      r.dateTo,
      r.modifiedAt,
      r.userModified.name,
      r.userModified.email,
      r.status,
    ]);
    exportToCsv("prices.csv", [headers, ...data]);
  };

  /* acciones header */
  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push("/catalogo/precios/precio/nuevo"),
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Buscar precios"
        action={headerActions}
        filters={getPriceFilters(filters, priceListDetailsMap, priceListSearchQuery, setPriceListSearchQuery)}
        onFilterChange={(id, value) => {
          // Reiniciar a la primera página cuando los filtros cambien
          setCurrentPage(1);
          setFilters((prev) => ({ ...prev, [id]: value }));
        }}
        filterTitle
      />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <p>Cargando precios...</p>
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              dataType="General"
              statusKey="status"
              rowPaddingY={12}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: Price) =>
                router.push(`/catalogo/precios/precio/${row.id}`)
              }
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
