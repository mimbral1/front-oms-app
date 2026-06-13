"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { BasePriceFields, BasePrice } from "@/features/catalogo/components/precios/preciobase/BasePriceFields";

import { useFetchWithAuth } from "@/lib/http/client";

// Interfaz para la data de un precio base
export interface ListPriceData {
  ItemCode: string;
  PriceList: string;
  Price: string | null;
  PriceIVA: string | null;
  CreatedAt: string;
  UpdatedAt: string | null;
  ItemName: string;
  Status: string;
}

// Interfaz para el detalle de la lista de precios de la API
interface ApiPriceListDetail {
  ListNum: number;
  ListName: string;
  GroupCode: number;
  ValidFor: string;
  CreatedByName: string;
}

// Interfaz para la paginación de la API
interface ApiResponse<T> {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: T[];
}

export function BasePriceEditView() {
  const router = useRouter();
  const { fetchWithAuth, token } = useFetchWithAuth();

  const params = useParams();
  const itemCode = Array.isArray(params.itemCode) ? params.itemCode[0] : params.itemCode;
  const priceList = Array.isArray(params.priceList) ? params.priceList[0] : params.priceList;

  const [record, setRecord] = useState<BasePrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemCode || !priceList) {
      setLoading(false);
      setError("No se ha proporcionado código de producto o lista de precios.");
      return;
    }
    if (!token) return;

    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener detalle de la lista
        const priceListsUrl = `catalog/price-lists?listNum=${priceList}`;
        const priceListsResult: ApiResponse<ApiPriceListDetail> = await fetchWithAuth(priceListsUrl);
        const listStatus =
          priceListsResult.data[0]?.ValidFor?.toUpperCase() === "ACTIVE" ? "Activo" : "Inactivo";

        // Obtener precios
        const queryParams = new URLSearchParams({
          itemCode: itemCode,
          priceList: priceList,
        });
        const pricesUrl = `catalog/listprices?${queryParams.toString()}`;
        const pricesResult: ApiResponse<ListPriceData> = await fetchWithAuth(pricesUrl);

        const foundRecord = pricesResult.data.find(
          (r) => r.ItemCode === itemCode && String(r.PriceList) === priceList
        );

        if (foundRecord) {
          const combinedRecord: BasePrice = {
            ItemCode: foundRecord.ItemCode,
            PriceList: foundRecord.PriceList,
            ItemName: foundRecord.ItemName,
            Price: foundRecord.Price,
            PriceIVA: foundRecord.PriceIVA,
            Status: listStatus as "Active" | "Inactive",
            created: { username: "Desconocido", email: "—", date: foundRecord.CreatedAt },
            modified: foundRecord.UpdatedAt
              ? { username: "Desconocido", email: "—", date: foundRecord.UpdatedAt }
              : undefined,
          };
          setRecord(combinedRecord);
        } else {
          setError("Registro no encontrado.");
        }
      } catch (e: any) {
        console.error("Error en la carga de datos:", e);
        setError(`Error al obtener los datos: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [itemCode, priceList, token, fetchWithAuth]);


  const handleChange = (field: keyof BasePrice, value: string) => {
    if (record) setRecord({ ...record, [field]: value });
  };

  const handleSave = () => {
    console.log("Guardar", record);
  };

  const handleSaveAndNew = () => {
    handleSave();
    router.push("/catalogo/precios/precio-base/nuevo");
  };

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-5 w-5" />,
        onClick: handleSave,
      },
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-4 w-4" />,
        onClick: handleSave,
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
        onClick: handleSaveAndNew,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/catalogo/precios/precio-base"),
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
            Precio base
          </div>
          <div className="text-2xl font-semibold text-gray-900">{`Precio base: ${record?.ItemName ?? "—"}`}</div>
        </div>
      ),
      action: headerActions,
    } as PageHeaderProps),
    [record?.ItemName, headerActions]
  );

  if (loading) return <p className="p-4">Cargando…</p>;
  if (error) return <p className="p-4 text-red-500">Error al cargar el registro: {error}</p>;
  if (!record) return <p className="p-4 text-red-500">Registro no encontrado</p>;

  return (
    <div className="p-6 bg-white">
      <BasePriceFields
        record={record}
        readOnly={false}
        onChange={handleChange}
      />
    </div>
  );
}