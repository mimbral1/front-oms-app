"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { Action } from "@/components/layout/page-header";
import { type Column, DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { fmtDateTime } from "@/lib/format/date";
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaFileExport } from "react-icons/fa";
import { exportToCsv } from "@/components/presets/export/export";
import Avatar from "@mui/material/Avatar";
import {
  CATALOG_PRODUCTS_API,
  WAREHOUSE_SKU_POSITION_API,
} from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

interface SlotSku {
  id: string;
  imageUrl: string;
  sku: { id: string; name: string };
  maxUnits: number;
  minUnits: number;
  modifiedAt: string;
  user: { name: string; email: string; avatarUrl?: string };
  status: "Active" | "Inactive";
}

type ApiSkuPosition = {
  id: string;
  warehouseId?: string | null;
  skuId?: string | null;
  positionId?: string | null;
  position?: {
    positionKey?: string | null;
    schemaId?: string | null;
    schemaType?: string | null;
  } | null;
  minUnits?: number | null;
  maxUnits?: number | null;
  isDefault?: boolean | null;
  status?: string | null;
  dateCreated?: string | null;
  dateModified?: string | null;
  userCreated?: string | null;
  userModified?: string | null;
};

type ApiCatalogProduct = {
  Image?: string | null;
  Name?: string | null;
  SKU?: string | null;
};

const SKU_POSITION_BASE_URL = WAREHOUSE_SKU_POSITION_API;
const PRODUCT_BASE_URL = CATALOG_PRODUCTS_API;

const SKU_PLACEHOLDER_IMAGE = "https://via.placeholder.com/40x40.png?text=SKU";

const formatDateTime = fmtDateTime;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

function getColumns(onViewSku: (sku: SlotSku["sku"]) => void): Column<SlotSku>[] {
  return [
    {
      header: "Imagen",
      accessorKey: "imageUrl",
      cell: (row) => (
        <img
          src={row.imageUrl}
          alt={row.sku.name}
          className="h-8 w-8 rounded object-contain"
        />
      ),
    },
    {
      header: "SKU",
      accessorKey: "sku",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <TagIcon className="h-5 w-5 text-gray-500" />
          <button
            type="button"
            onClick={() => onViewSku(row.sku)}
            className="text-sm text-blue-600 hover:underline"
          >
            {row.sku.id} - {row.sku.name}
          </button>
        </div>
      ),
    },
    {
      header: "Unidades Máx.",
      accessorKey: "maxUnits",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-sm">
          {row.maxUnits}
        </span>
      ),
    },
    {
      header: "Unidades Mín.",
      accessorKey: "minUnits",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-sm">
          {row.minUnits}
        </span>
      ),
    },
    {
      header: "Modificado",
      accessorKey: "modifiedAt",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">
            {formatDateTime(row.modifiedAt)}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      ),
    },
    {
      header: "Usuario",
      accessorKey: "user",
      cell: (row) => (
        <div className="inline-flex max-w-[200px] items-center rounded-full border border-gray-200 bg-white px-2 py-1">
          <Avatar
            alt={row.user.name}
            src={row.user.avatarUrl || undefined}
            className="h-7 w-7 text-xs"
          >
            {!row.user.avatarUrl && getInitials(row.user.name)}
          </Avatar>
          <div className="ml-2 flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{row.user.name}</span>
            <span className="truncate text-xs text-gray-500">
              {row.user.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row) => (
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
            row.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];
}

export function SkusView() {
  const params = useParams();
  const id = String(params?.id || "").trim();
  const router = useRouter();
  const [data, setData] = useState<SlotSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSkus = async () => {
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
        const res = await fetch(
          `${SKU_POSITION_BASE_URL}?filters[positionId]=${encodeURIComponent(id)}`,
          {
            method: "GET",
            headers: withAuthPlatformHeaders({
              "Content-Type": "application/json",
            }),
            cache: "no-store",
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const payload = (await res.json()) as ApiSkuPosition[];
        const mapped: SlotSku[] = (Array.isArray(payload) ? payload : []).map(
          (item) => {
            const userName = item.userModified || "-";
            return {
              id: item.id,
              imageUrl: SKU_PLACEHOLDER_IMAGE,
              sku: {
                id: String(item.skuId || "-"),
                name: "-",
              },
              maxUnits: Number(item.maxUnits ?? 0),
              minUnits: Number(item.minUnits ?? 0),
              modifiedAt: String(item.dateModified || ""),
              user: {
                name: userName,
                email: "-",
              },
              status:
                String(item.status || "").toLowerCase() === "active"
                  ? "Active"
                  : "Inactive",
            };
          }
        );

        const uniqueSkuIds = Array.from(
          new Set(
            mapped
              .map((item) => item.sku.id)
              .filter((skuId) => skuId && skuId !== "-")
          )
        );

        const productEntries = await Promise.allSettled(
          uniqueSkuIds.map(async (skuId) => {
            const productRes = await fetch(
              `${PRODUCT_BASE_URL}/${encodeURIComponent(skuId)}`,
              {
                method: "GET",
                headers: withAuthPlatformHeaders({
                  "Content-Type": "application/json",
                }),
                cache: "no-store",
              }
            );

            if (!productRes.ok) {
              throw new Error(`Catalog HTTP ${productRes.status}`);
            }

            const product = (await productRes.json()) as ApiCatalogProduct;
            return [skuId, product] as const;
          })
        );

        const productBySku = new Map<string, ApiCatalogProduct>();
        productEntries.forEach((entry) => {
          if (entry.status === "fulfilled") {
            const [skuId, product] = entry.value;
            productBySku.set(skuId, product);
          }
        });

        const enriched: SlotSku[] = mapped.map((item) => {
          const product = productBySku.get(item.sku.id);
          return {
            ...item,
            imageUrl: product?.Image || SKU_PLACEHOLDER_IMAGE,
            sku: {
              ...item.sku,
              name: product?.Name?.trim() || "-",
            },
          };
        });

        if (!mounted) return;
        setData(enriched);
      } catch (loadError: unknown) {
        if (!mounted) return;
        setData([]);
        setError(
          getErrorMessage(loadError, "No se pudieron cargar los SKUs del slot.")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSkus();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleExport = () => {
    const headers = [
      "ID",
      "Imagen URL",
      "SKU",
      "Unidades Máx.",
      "Unidades Mín.",
      "Modificado",
      "Usuario",
      "Estado",
    ];

    const rows = data.map((sku) => [
      sku.id,
      sku.imageUrl,
      `${sku.sku.id} - ${sku.sku.name}`,
      sku.maxUnits.toString(),
      sku.minUnits.toString(),
      formatDateTime(sku.modifiedAt),
      `${sku.user.name} <${sku.user.email}>`,
      sku.status,
    ]);

    exportToCsv(`skus-${id}.csv`, [headers, ...rows]);
  };

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Exportar",
        variant: "primary",
        onClick: handleExport,
        icon: <FaFileExport className="h-5 w-5" />,
      },
      {
        label: "Aplicar",
        variant: "gray",
        disabled: true,
        onClick: () => {},
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "gray",
        disabled: true,
        onClick: () => {},
        icon: <SaveOutlined className="h-5 w-5" />,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/almacen/configuracion/slots"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [handleExport, router]
  );

  usePageHeader(
    () => ({
      title: `${id} - SKUS`,
      status: { text: "Activo", variant: "success" },
      action: headerActions,
    }),
    [id, headerActions]
  );

  const columns = useMemo(
    () => getColumns((sku) => router.push(`/almacen/productos/${sku.id}`)),
    [router]
  );

  const [page, setPage] = useState(1);
  const pageSize = 60;
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex-1 bg-page-bg p-6">
      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <ArrowPathIcon className="h-4 w-4 animate-spin" /> Cargando SKUs...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" /> {error}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <DataTable
          data={pageData}
          columns={columns}
          statusKey="status"
          dataType="General"
          rowPaddingY={20}
        />
      </div>

      {data.length > pageSize && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          <div className="text-sm text-gray-500">{data.length} resultados</div>
        </div>
      )}
    </div>
  );
}
