"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { PriceFields, Price } from "@/features/catalogo/components/precios/precio/PriceFields";

import { useFetchWithAuth } from "@/lib/http/client";
import { formatCurrency } from "@/lib/format/money";

// --- INTERFACES DE LA API ---
// Interfaz para los datos de la API /api/catalog/listprices
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
  DateModified: string | null;
}

// Interfaz para los datos de la API /api/catalog/price-lists/:listNum
interface ApiPriceListDetail {
  ListNum: number;
  ListName: string;
  CreatedByName: string;
  CreatedByEmail: string | null;
  UpdatedByName: string | null;
  UpdatedByEmail: string | null;
  CreateDate: string;
  UpdateDate: string | null;
  ValidFor: "Y" | "N";
}

// --- HELPERS ---

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
    hour12: false,
  });
};

const getStatusText = (validFor: "Y" | "N") => {
  return validFor === "Y" ? "Active" : "Inactive";
};

// --- COMPONENTE PRINCIPAL ---
export function PriceEditView() {
  const router = useRouter();
  const { id } = useParams();
  const { fetchWithAuth, token } = useFetchWithAuth();
  const itemCode = Array.isArray(id) ? id[0] : id;

  const [record, setRecord] = useState<Price | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemCode) {
      setLoading(false);
      setError("No se ha proporcionado un código de producto.");
      return;
    }
    if (!token) return;

    const fetchPriceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `catalog/listprices?itemCode=${itemCode}`;
        // Llamada usando fetchWithAuth
        const priceData = await fetchWithAuth<{ data: ApiPriceData[] }>(url);

        const mainPrice = priceData.data.length > 0 ? priceData.data[0] : null;

        if (!mainPrice) {
          setRecord(null);
          setLoading(false);
          setError("Registro no encontrado para el código de producto proporcionado.");
          return;
        }

        // Llamada usando fetchWithAuth para el detalle
        let priceListDetail: ApiPriceListDetail | null = null;
        try {
          priceListDetail = await fetchWithAuth<ApiPriceListDetail>(
            `catalog/price-lists/${mainPrice.PriceList}`
          );
        } catch (error) {
          console.error("No se pudieron obtener los detalles de la lista de precios", error);
        }

        const transformedRecord: Price = {
          id: mainPrice.ItemCode,
          sku: mainPrice.ItemName,
          priceSheet: priceListDetail?.ListName || `Lista ${mainPrice.PriceList}`,
          price: formatCurrency(mainPrice.Price),
          precioIva: formatCurrency(mainPrice.PriceIVA),
          costPrice: "",
          minQuantity: mainPrice.MinQuantity.toString(),
          dateFrom: formatDate(mainPrice.DateFrom),
          timeFrom: mainPrice.DateFrom ? new Date(mainPrice.DateFrom).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "",
          dateTo: formatDate(mainPrice.DateTo),
          timeTo: mainPrice.DateTo ? new Date(mainPrice.DateTo).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "",
          status: priceListDetail ? getStatusText(priceListDetail.ValidFor) : "Unknown",
          created: {
            username: priceListDetail?.CreatedByName || "Desconocido",
            email: priceListDetail?.CreatedByEmail || "",
            date: formatDate(priceListDetail?.CreateDate || mainPrice.CreatedAt),
          },
          modified: {
            username: priceListDetail?.UpdatedByName || "N/A",
            email: priceListDetail?.UpdatedByEmail || "",
            date: formatDate(mainPrice.DateModified || mainPrice.UpdatedAt || priceListDetail?.UpdateDate || null),
          },
        };

        setRecord(transformedRecord);
      } catch (err) {
        console.error("Error al obtener los datos del precio:", err);
        setError("Error al cargar los datos del producto. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [itemCode, token, fetchWithAuth]);


  const handleChange = (field: keyof Price, value: string) => {
    if (record) setRecord({ ...record, [field]: value });
  };

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-5 w-5" />,
        onClick: () => console.log("Apply without closing", record),
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
        onClick: () => router.push("/Pricing/Price/New"),
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/catalogo/precios/precio"),
      },
    ],
    [record, router]
  );

  usePageHeader(
    () =>
    ({
      title: `Precio: ${record?.sku ?? "—"}`,
      action: headerActions,
      status: record
        ? {
          text: record.status,
          variant: record.status === "Active" ? "success" : "warning",
        }
        : undefined,
    } as PageHeaderProps),
    [record?.sku, headerActions]
  );

  if (loading) return <p className="p-4">Cargando...</p>;
  if (error)
    return <p className="p-4 text-red-500">Error: {error}</p>;
  if (!record)
    return <p className="p-4 text-red-500">Registro no encontrado.</p>;

  return (
    <div className="p-6 bg-white">
      <PriceFields record={record} readOnly={false} onChange={handleChange} />
    </div>
  );
}

