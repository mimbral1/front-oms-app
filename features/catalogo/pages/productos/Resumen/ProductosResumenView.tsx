// views\CatalogoView\productos\Resumen\ResumenView.tsx
"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import {
  ProductFields,
  Product,
  SelectOption,
} from "@/features/catalogo/components/productos/productsFields";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useFetchWithAuth } from "@/lib/http/client";
import { useSalesChannelOptions } from "@/features/pedidos/hooks/useSalesChannelOptions";

// Interfaz que representa la respuesta EXACTA de la API para un producto
export interface ProductAPIResponse {
  Image: string | null;
  Name: string;
  Reference: string;
  Slug: string;
  SKU: string;
  Category: string;
  Brand: string;
  TotalSalesChannel: string;
  SalesChannels: string[];
  DateModified: string | null;
  UserId: string;
  Status: "Activo" | "Inactivo" | "Y" | "N" | string;
  Eans: string | null;
  UpdatedByName: string | null;
  UpdatedByEmail: string | null;
  CreateDate: string;
  CreateTime: string;
  createdAtFormatted?: string;
}

const TypedFaPlus = FaPlus as unknown as React.FC<
  React.SVGProps<SVGSVGElement>
>;
export const SaveWithPlusIcon = () => (
  <div className="relative h-5 w-5 flex items-center justify-center">
    {/* Ícono base (disquete) */}
    <SaveOutlined className="h-4 w-4 text-current" />

    {/* Ícono + en la esquina inferior derecha */}
    <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-[1px]">
      <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
    </div>
  </div>
);

// ── Mock dropdown options (mismas que en create) ──
const MOCK_BRAND_OPTIONS: SelectOption[] = [
  { label: "AMP", value: "AMP" },
  { label: "Bosch", value: "Bosch" },
  { label: "Samsung", value: "Samsung" },
  { label: "Stanley", value: "Stanley" },
  { label: "DeWalt", value: "DeWalt" },
  { label: "Apple", value: "Apple" },
  { label: "LG", value: "LG" },
  { label: "Whirlpool", value: "Whirlpool" },
];

const MOCK_CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Energizantes", value: "Energizantes" },
  { label: "Herramientas eléctricas", value: "Herramientas eléctricas" },
  { label: "Electrónica", value: "Electrónica" },
  { label: "Hogar", value: "Hogar" },
  { label: "Taladros percutores", value: "Taladros percutores" },
  { label: "Computación", value: "Computación" },
];

export function ProductMainView() {
  const { id } = useParams();
  const router = useRouter();
  const { fetchWithAuth, token } = useFetchWithAuth();
  const { salesChannelOptions } = useSalesChannelOptions();
  const [product, setProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para formatear la hora de un entero (ej. 152514 -> "15:25:14")
  const formatTimeInteger = (time: string | number | null): string => {
    if (time === null) {
      return "N/A";
    }

    // Convertir el valor a un entero.
    const timeInt = typeof time === 'string' ? parseInt(time, 10) : time;

    // Si la conversión falla, retornar "N/A".
    if (isNaN(timeInt)) {
      return "N/A";
    }

    const hours = Math.floor(timeInt / 10000);
    const minutes = Math.floor((timeInt % 10000) / 100);
    const seconds = timeInt % 100;

    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };
  // Función para mapear la respuesta de la API a tu interfaz Product
  const mapAPIResponseToProduct = (apiProduct: ProductAPIResponse): Product => {
    // Formatear CreateDate y CreateTime para el nuevo campo createdAtFormatted
    let createdAtFormatted: string = "N/A";
    if (apiProduct.CreateDate) {
      const datePart = new Date(apiProduct.CreateDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const timePart = formatTimeInteger(apiProduct.CreateTime);
      createdAtFormatted = `${datePart} ${timePart}`;
    }

    return {
      Image: apiProduct.Image,
      Name: apiProduct.Name,
      Reference: apiProduct.Reference || "",
      Slug: apiProduct.Slug || "",
      SKU: apiProduct.SKU,
      Category: apiProduct.Category,
      Brand: apiProduct.Brand,
      TotalSalesChannel: apiProduct.TotalSalesChannel,
      SalesChannels: apiProduct.SalesChannels || [],
      DateModified: apiProduct.DateModified,
      UserId: apiProduct.SKU,
      Status: apiProduct.Status === "Y" ? "Activo" : "Inactivo", // Transformar estado
      Eans: apiProduct.Eans,
      UpdatedByName: apiProduct.UpdatedByName,
      UpdatedByEmail: apiProduct.UpdatedByEmail,
      CreateDate: apiProduct.CreateDate,
      CreateTime: apiProduct.CreateTime,
      createdAtFormatted: createdAtFormatted,
    };
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) {
        setError("ItemCode del producto no proporcionado.");
        setLoading(false);
        return;
      }
      if (!token) return;

      setLoading(true);
      setError(null);
      try {
        const url = `catalog/products/${id}`;
        const data = await fetchWithAuth<ProductAPIResponse>(url);
        const mapped = mapAPIResponseToProduct(data);
        setProduct(mapped);
        setEditProduct({ ...mapped });
      } catch (err: any) {
        console.error("Error fetching product details:", err);
        setError(`Error al cargar los detalles del producto: ${err.message}`);
        setProduct(null);
        setEditProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, token, fetchWithAuth]);

  const handleFieldChange = useCallback((field: keyof Product, value: string) => {
    setEditProduct((prev) => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const handleArrayChange = useCallback((field: keyof Product, value: string[]) => {
    setEditProduct((prev) => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editProduct || !id) return;
    console.log("[SAVE] Guardar producto:", editProduct);
    try {
      await fetchWithAuth(`catalog/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          Name: editProduct.Name,
          Reference: editProduct.Reference,
          Slug: editProduct.Slug,
          Brand: editProduct.Brand,
          Category: editProduct.Category,
          SalesChannels: editProduct.SalesChannels,
          Status: editProduct.Status === "Activo" ? "Y" : "N",
          seoTitle: editProduct.seoTitle,
          seoKeywords: editProduct.seoKeywords,
          seoDescription: editProduct.seoDescription,
        }),
      });
      setProduct({ ...editProduct });
      router.push("/catalogo/productos");
    } catch (err: any) {
      console.error("Error saving product:", err);
      setError(`Error al guardar: ${err?.message ?? String(err)}`);
    }
  }, [editProduct, id, fetchWithAuth, router]);

  const handleApply = useCallback(async () => {
    if (!editProduct || !id) return;
    console.log("[APPLY] Aplicar producto:", editProduct);
    try {
      await fetchWithAuth(`catalog/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          Name: editProduct.Name,
          Reference: editProduct.Reference,
          Slug: editProduct.Slug,
          Brand: editProduct.Brand,
          Category: editProduct.Category,
          SalesChannels: editProduct.SalesChannels,
          Status: editProduct.Status === "Activo" ? "Y" : "N",
          seoTitle: editProduct.seoTitle,
          seoKeywords: editProduct.seoKeywords,
          seoDescription: editProduct.seoDescription,
        }),
      });
      setProduct({ ...editProduct });
    } catch (err: any) {
      console.error("Error applying product:", err);
      setError(`Error al aplicar: ${err?.message ?? String(err)}`);
    }
  }, [editProduct, id, fetchWithAuth]);

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "primary",
        onClick: handleApply,
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: handleSave,
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Guardar y crear",
        variant: "primary",
        onClick: async () => {
          await handleSave();
          router.push("/catalogo/productos/details/nuevo");
        },
        icon: <SaveWithPlusIcon />,
      },
      {
        label: "Cancelar",
        variant: "secondary",
        onClick: () => router.push("/catalogo/productos"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [handleApply, handleSave, router]
  );

  usePageHeader(
    () => ({
      title: editProduct ? editProduct.Name : "Cargando Producto...",
      action: headerActions,
      status: editProduct
        ? {
          text: editProduct.Status,
          variant: editProduct.Status === "Activo" ? "success" : "warning",
        }
        : undefined,
    }),
    [editProduct, headerActions]
  );

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-10">
        <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin text-gray-500" />
        <span className="text-gray-500">Cargando…</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="p-4 text-center text-red-500">Error: {error}</p>
    );
  }

  if (!editProduct) {
    return (
      <p className="p-4 text-center text-gray-500">Producto no encontrado o no disponible.</p>
    );
  }

  return (
    <ProductFields
      product={editProduct}
      readOnly={false}
      onChange={handleFieldChange}
      onArrayChange={handleArrayChange}
      isNew={false}
      brandOptions={MOCK_BRAND_OPTIONS}
      categoryOptions={MOCK_CATEGORY_OPTIONS}
      salesChannelOptions={salesChannelOptions}
    />
  );
}
