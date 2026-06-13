"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { Action } from "@/components/layout/page-header";
import { type Column, DataTable } from "@/components/ui/table";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowDownIcon,
  HomeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { fmtDateTime } from "@/lib/format/date";
import { FaBoxes } from "react-icons/fa";
import {
  CATALOG_PRODUCTS_API,
  WAREHOUSE_STORED_GOOD_API,
} from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

type StoredGoodResponse = {
  id: string;
  type?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  warehouseReferenceId?: string | null;
  locationId?: string | null;
  schemaId?: Array<string | null> | null;
  positionId?: string | null;
  positionKey?: Array<string | null> | string | null;
  schemaType?: Array<string | null> | string | null;
  quantity?: number | null;
  skuId?: string | null;
  orderId?: string | null;
  barcode?: string | null;
  status?: string | null;
  dateCreated?: string | null;
  dateModified?: string | null;
};

type ApiCatalogProduct = {
  Name?: string | null;
};

interface SlotStorage {
  id: string;
  inventory: { id: string; name: string };
  slot: string;
  slotSchema: string;
  typefirst: string;
  type: string;
  product: { id: string; sku: string; name: string };
  quantity: number;
  modifiedAt: string;
}

const storedGoodUrl = WAREHOUSE_STORED_GOOD_API;
const productBaseUrl = CATALOG_PRODUCTS_API;
const formatDateTime = fmtDateTime;

function formatLabel(value?: string | null): string {
  if (!value) return "-";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getPrimaryValue(value?: Array<string | null> | string | null) {
  if (Array.isArray(value)) {
    const match = value.find((item) => String(item || "").trim());
    return String(match || "").trim();
  }

  return String(value || "").trim();
}

function buildInventoryLabel(inventory: SlotStorage["inventory"]) {
  const referenceId = String(inventory.id || "").trim();
  const name = String(inventory.name || "").trim();

  if (!referenceId) return name || "-";
  if (!name) return referenceId;

  const normalizedReferenceId = referenceId.toLowerCase();
  const normalizedName = name.toLowerCase();
  const nameAlreadyIncludesReferenceId =
    normalizedName === normalizedReferenceId ||
    normalizedName.startsWith(`${normalizedReferenceId} `) ||
    normalizedName.startsWith(`${normalizedReferenceId}-`);

  return nameAlreadyIncludesReferenceId ? name : `${referenceId} - ${name}`;
}

const getStoredGoodList = (
  payload:
    | StoredGoodResponse[]
    | { items?: StoredGoodResponse[]; data?: StoredGoodResponse[] }
) => {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

function getColumns(
  onViewInventory: (inv: SlotStorage["inventory"]) => void,
  onViewProduct: (prod: SlotStorage["product"]) => void
): Column<SlotStorage>[] {
  return [
    {
      header: "Inventario",
      accessorKey: "inventory",
      cell: (row) => (
        <button
          type="button"
          onClick={() => onViewInventory(row.inventory)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <HomeIcon className="h-5 w-5 text-gray-500" />
          {buildInventoryLabel(row.inventory)}
        </button>
      ),
    },
    {
      header: (
        <span className="inline-flex items-center gap-1">
          Slot
          <ArrowDownIcon className="h-4 w-4 text-blue-600" />
        </span>
      ),
      accessorKey: "slot",
      cell: (row) => (
        <div className="flex items-start gap-2 text-sm">
          <MapPinIcon className="mt-0.5 h-5 w-5 text-gray-500" />
          <div className="flex flex-col leading-4">
            <span className="font-medium text-gray-800">{row.slot}</span>
            {row.slotSchema !== "-" ? (
              <span className="mt-0.5 text-xs text-gray-500">
                {row.slotSchema}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      header: "",
      accessorKey: "typefirst",
      cell: (row) => (
        <span className="text-sm font-medium text-gray-700">
          {row.typefirst}
        </span>
      ),
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: (row) => (
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
          {row.type}
        </span>
      ),
    },
    {
      header: "Bienes almacenados",
      accessorKey: "product",
      cell: (row) => (
        <button
          type="button"
          onClick={() => onViewProduct(row.product)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <FaBoxes className="h-5 w-5 text-gray-500" />
          {row.product.id} - {row.product.name}
        </button>
      ),
    },
    {
      header: "Cantidad",
      accessorKey: "quantity",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full border border-gray-300 px-4 py-1 text-sm font-medium text-gray-700">
          {row.quantity}
        </span>
      ),
    },
    {
      header: "Modificado",
      accessorKey: "modifiedAt",
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {formatDateTime(row.modifiedAt)}
        </span>
      ),
    },
  ];
}

export function SlotStorageView() {
  const params = useParams();
  const id = String(params?.id || "").trim();
  const router = useRouter();

  const [data, setData] = useState<SlotStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStorage = async () => {
      if (!id) {
        if (mounted) {
          setData([]);
          setLoading(false);
          setError("PositionId inválido.");
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const storedGoodRes = await fetch(
          `${storedGoodUrl}?filters[positionId]=${encodeURIComponent(id)}`,
          {
            method: "GET",
            headers: withAuthPlatformHeaders({
              "Content-Type": "application/json",
            }),
            cache: "no-store",
          }
        );

        if (!storedGoodRes.ok) throw new Error(`HTTP ${storedGoodRes.status}`);

        const payload = (await storedGoodRes.json()) as
          | StoredGoodResponse[]
          | { items?: StoredGoodResponse[]; data?: StoredGoodResponse[] };
        const storedGoods = getStoredGoodList(payload);

        const uniqueSkuIds = Array.from(
          new Set(
            storedGoods
              .map((item) => String(item.skuId || "").trim())
              .filter(Boolean)
          )
        );

        const productBySku = new Map<string, ApiCatalogProduct>();
        const productEntries = await Promise.allSettled(
          uniqueSkuIds.map(async (skuId) => {
            const res = await fetch(
              `${productBaseUrl}/${encodeURIComponent(skuId)}`,
              {
                method: "GET",
                headers: withAuthPlatformHeaders({
                  "Content-Type": "application/json",
                }),
                cache: "no-store",
              }
            );

            if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
            const product = (await res.json()) as ApiCatalogProduct;
            return [skuId, product] as const;
          })
        );

        productEntries.forEach((entry) => {
          if (entry.status === "fulfilled") {
            const [skuId, product] = entry.value;
            productBySku.set(skuId, product);
          }
        });

        const mapped: SlotStorage[] = storedGoods.map((item) => {
          const skuId = String(item.skuId || "-");
          const product = productBySku.get(skuId);
          const positionKey = getPrimaryValue(item.positionKey);
          const schemaType = getPrimaryValue(item.schemaType);

          return {
            id: item.id,
            inventory: {
              id: String(item.warehouseReferenceId || item.warehouseId || "-"),
              name: String(item.warehouseName || "-"),
            },
            slot: positionKey || "-",
            slotSchema: "-",
            typefirst: formatLabel(schemaType),
            type: formatLabel(item.type || "sku"),
            product: {
              id: skuId,
              sku: skuId,
              name: product?.Name?.trim() || "-",
            },
            quantity: Number(item.quantity ?? 0),
            modifiedAt: String(item.dateModified || item.dateCreated || ""),
          };
        });

        if (!mounted) return;
        setData(mapped);
      } catch (loadError: unknown) {
        if (!mounted) return;
        setData([]);
        setError(
          getErrorMessage(loadError, "No se pudo cargar almacenamiento del slot.")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadStorage();

    return () => {
      mounted = false;
    };
  }, [id]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "gray",
        onClick: () => {},
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "gray",
        onClick: () => {},
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.back(),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );

  usePageHeader(
    () => ({
      title: `${id} - ALMACENAMIENTO`,
      status: { text: "Activo", variant: "success" },
      action: headerActions,
    }),
    [id, headerActions]
  );

  const columns = useMemo(
    () =>
      getColumns(
        (inventory) => router.push(`/almacen/inventarios/${inventory.id}`),
        (product) => router.push(`/almacen/productos/${product.id}`)
      ),
    [router]
  );

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(data.length / pageSize);
  const displayed = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex-1 bg-page-bg p-6">
      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <ArrowPathIcon className="h-4 w-4 animate-spin" /> Cargando
          almacenamiento...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" /> {error}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-page-bg">
        <DataTable
          data={displayed}
          columns={columns}
          showStatusBorder={false}
          rowPaddingY={20}
          rowBgClass="bg-white"
          rowGap="h-[10px] bg-page-bg"
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        {data.length > pageSize && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
        <div className="text-sm text-gray-500">{data.length} resultados</div>
      </div>
    </div>
  );
}
