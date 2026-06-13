"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ActionButton } from "@/components/ui/button";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { Action } from "@/components/layout/page-header";
import { useFetchWithAuth } from "@/lib/http/client";
import { Avatar } from "@/components/ui/user-avatar";

const TypedFaPlus = FaPlus as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const SaveWithPlusIcon = () => (
  <div className="relative flex h-5 w-5 items-center justify-center">
    <SaveOutlined className="h-5 w-5 text-current" />
    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-gray-200 p-[1px]">
      <TypedFaPlus className="h-2.5 w-2.5 text-gray-500" />
    </div>
  </div>
);

/* ── Tipo de fila ── */
interface SkuRow {
  id: string;
  mainImage: string;
  name: string;
  eans: string;
  sellingMeasurementUnit: string;
  price: number | null;
  stock: number | null;
  dateModified: string;
  userModified: string;
  status: "Active" | "Inactive";
}

/* ── Respuesta de la API ── */
interface ProductAPIItem {
  Image: string | null;
  Name: string;
  ItemCode: string;
  Category: string | null;
  Brand: string | null;
  TotalSalesChannel: string | null;
  DateModified: string | null;
  Status: "Activo" | "Inactivo" | "Y" | "N" | string;
  Eans: string | null;
  CreatedName: string | null;
}

interface PaginatedProductsAPIResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: ProductAPIItem[];
}

const PLACEHOLDER_IMG =
  "https://tumayorferretero.net/22457-large_default/producto-generico.jpg";

/* ── Componente ── */
export function ProductSkus() {
  const router = useRouter();
  const { id: itemCode } = useParams();
  const { fetchWithAuth } = useFetchWithAuth();

  const [skus, setSkus] = useState<SkuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const ITEMS_PER_PAGE = 60;
  const totalPages = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));

  /* ── Fetch real desde la API ── */
  const fetchSkus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("itemCode", itemCode as string);
      queryParams.append("page", String(currentPage));
      queryParams.append("pageSize", String(ITEMS_PER_PAGE));

      const url = `catalog/products?${queryParams.toString()}`;
      const data = await fetchWithAuth<PaginatedProductsAPIResponse>(url, {
        method: "GET",
      });

      const mapped: SkuRow[] = data.data.map((item) => ({
        id: item.ItemCode,
        mainImage: item.Image || PLACEHOLDER_IMG,
        name: item.Name,
        eans: item.Eans || "",
        sellingMeasurementUnit: "UN",
        price: null,
        stock: null,
        dateModified: item.DateModified
          ? new Date(item.DateModified).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          : "",
        userModified: item.CreatedName || "",
        status: item.Status === "Y" || item.Status === "Activo" ? "Active" : "Inactive",
      }));

      setSkus(mapped);
      setTotalRecords(data.totalRecords);
    } catch (err: any) {
      console.error("Error fetching SKUs:", err);
      setError(
        typeof err?.message === "string"
          ? err.message
          : "Error al cargar SKUs. Intenta nuevamente."
      );
      setSkus([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [itemCode, currentPage, fetchWithAuth]);

  useEffect(() => {
    fetchSkus();
  }, [fetchSkus]);

  /* ── Header actions ── */
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "gray",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "gray",
        onClick: () => { },
        icon: <SaveOutlinedIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar y crear",
        variant: "gray",
        onClick: () => { },
        icon: <SaveWithPlusIcon />,
      },
      {
        label: "Cancelar",
        variant: "secondary",
        onClick: () => window.history.back(),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [],
  );

  usePageHeader(
    () => ({
      title: itemCode ? `SKU #${itemCode}` : "Listado de SKUs",
      action: headerActions,
      status: { text: "Active", variant: "success" },
    }),
    [itemCode, headerActions],
  );

  /* ── Navegación al detalle del SKU ── */
  const handleRowClick = useCallback(
    (row: SkuRow) => {
      router.push(`/catalogo/skus/${row.id}`);
    },
    [router],
  );

  /* ── Columnas ── */
  const columns = useMemo(
    () => [
      {
        header: "Imagen",
        accessorKey: "mainImage",
        cell: (row: SkuRow) => (
          <img
            src={row.mainImage || PLACEHOLDER_IMG}
            alt={row.name}
            className="h-10 w-10 rounded object-cover"
          />
        ),
      },
      {
        header: "Nombre",
        accessorKey: "name",
        cell: (row: SkuRow) => (
          <div className="leading-tight">
            <span className="block text-xs text-gray-500">#{row.id}</span>
            <span className="block text-sm font-medium text-gray-900">
              {row.name}
            </span>
          </div>
        ),
      },
      {
        header: "Código de barras",
        accessorKey: "eans",
        cell: (row: SkuRow) => (
          <span className="text-sm text-gray-700">{row.eans || "--"}</span>
        ),
      },
      {
        header: "Unidad de medida de venta",
        accessorKey: "sellingMeasurementUnit",
        cell: (row: SkuRow) => (
          <span className="text-sm text-gray-700">
            {row.sellingMeasurementUnit || "--"}
          </span>
        ),
      },
      {
        header: "Precio",
        accessorKey: "price",
        cell: (row: SkuRow) =>
          row.price != null ? (
            <span className="text-sm text-gray-700">
              ${row.price.toFixed(2)}
            </span>
          ) : (
            <span title="Sin precio asignado" className="cursor-help">
              <CurrencyDollarIcon className="inline h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            </span>
          ),
      },
      {
        header: "Stock",
        accessorKey: "stock",
        cell: (row: SkuRow) =>
          row.stock != null ? (
            <span className="text-sm text-gray-700">{row.stock}</span>
          ) : (
            <span title="Sin stock asignado" className="cursor-help">
              <ClipboardDocumentListIcon className="inline h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            </span>
          ),
      },
      {
        header: "Fecha de modificación",
        accessorKey: "dateModified",
        cell: (row: SkuRow) => (
          <span className="text-sm text-gray-700">
            {row.dateModified || "--"}
          </span>
        ),
      },
      {
        header: "Usuario modificador",
        accessorKey: "userModified",
        cell: (row: SkuRow) => (
          row.userModified ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Avatar name={row.userModified} alt={row.userModified} className="h-7 w-7" />
              <span>{row.userModified}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-700">--</span>
          )
        ),
      },
      {
        header: "Estado",
        accessorKey: "status",
        cell: (row: SkuRow) => (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${row.status === "Active" ? "bg-green-500" : "bg-gray-400"
              }`}
          >
            {row.status}
          </span>
        ),
      },
    ],
    [],
  );

  /* ── Render ── */
  return (
    <div className="flex-1 space-y-3">
      {/* Botón "Create sku" alineado a la derecha */}
      <div className="flex justify-end">
        <ActionButton
          variant="green"
          onClick={() => router.push("/catalogo/skus/nuevo")}
        >
          <SparklesIcon className="h-4 w-4" />
          Crear sku
        </ActionButton>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
            Cargando…
          </div>
        ) : error ? (
          <div
            className="flex items-start gap-3 rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700"
            role="alert"
          >
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-red-400" />
            <div>
              <h3 className="text-sm font-medium">Error al cargar SKUs</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        ) : skus.length === 0 ? (
          <p className="py-10 text-center text-gray-500">
            No se encontraron SKUs asociados a este producto.
          </p>
        ) : (
          <DataTable
            data={skus}
            dataType="product"
            statusKey="status"
            columns={columns as any}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {totalRecords} Result{totalRecords !== 1 && "s"}&nbsp;&nbsp;
          {ITEMS_PER_PAGE} Per page
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
