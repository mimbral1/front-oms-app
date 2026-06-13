// app/views/Pricing/PriceSheet/Edit/PriceSheetEditPage.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { PriceSheetFields, PriceSheet } from "@/features/catalogo/components/precios/hojaprecios/PriceFields";
import { useFetchWithAuth } from "@/lib/http/client";

/* Tipos del endpoint de listas */
interface PriceListAPIItem {
  ListNum?: number;
  ListName?: string;
}
interface PriceListsAPIResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: PriceListAPIItem[];
}

export function PriceSheetEditView() {
  const router = useRouter();
  const { id } = useParams();
  const recordId = Array.isArray(id) ? id[0] : id;

  const { fetchWithAuth, token } = useFetchWithAuth();
  const [record, setRecord] = useState<PriceSheet | null>(null);
  const [loading, setLoading] = useState(true);

  const mapItem = (it?: PriceListAPIItem | null): PriceSheet | null => {
    if (!it) return null;
    return {
      id: String(it.ListNum ?? ""),
      name: it.ListName ?? "",
      reference: String(it.ListNum ?? ""),
      salesChannels: [],
      incrementThreshold: "",
      decrementThreshold: "",
    };
  };

  const fetchById = useCallback(async (listId: string) => {
    if (!token) return;

    setLoading(true);
    try {
      // 1) intento directo por id (si existe el endpoint RESTful)
      try {
        const one = await fetchWithAuth<PriceListAPIItem>(`catalog/price-lists/${listId}`);
        const mapped = mapItem(one);
        if (mapped && mapped.id) {
          setRecord(mapped);
          return;
        }
      } catch {
        // ignoramos y probamos fallback
      }

      // 2) fallback: pedir listado y buscar
      const res = await fetchWithAuth<PriceListsAPIResponse>(
        `catalog/price-lists?page=1&pageSize=5000`
      );
      const found = (res?.data ?? []).find((x) => String(x.ListNum) === String(listId)) || null;
      setRecord(mapItem(found));
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, token]);

  useEffect(() => {
    if (recordId) fetchById(recordId);
  }, [recordId, fetchById]);

  const handleChange = (field: keyof PriceSheet, value: string | string[]) => {
    if (record) setRecord({ ...record, [field]: value as any });
  };

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-5 w-5" />,
        onClick: () => console.log("Apply no close", record),
      },
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-4 w-4" />,
        onClick: () => console.log("Save", record),
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveOutlined className="h-4 w-4 text-current" />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
              <FaPlus className="h-2.5 w-2.5 text-blue-500" />
            </div>
          </div>
        ),
        onClick: () => router.push("/Pricing/PriceSheet/New"),
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/catalogo/precios/hoja-precios"),
      },
    ],
    [record, router]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Hoja de precios
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {record?.name ?? "—"}
          </div>
        </div>
      ),
      action: headerActions,
    } as PageHeaderProps),
    [record?.name, headerActions]
  );

  if (loading) return <p className="p-4">Cargando…</p>;
  if (!record) return <p className="p-4 text-red-500">Registro no encontrado</p>;

  return (
    <div className="p-6 bg-white">
      <PriceSheetFields record={record} readOnly={false} onChange={handleChange} />
    </div>
  );
}
