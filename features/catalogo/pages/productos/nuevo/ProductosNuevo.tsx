// views\CatalogoView\productos\nuevo\Nuevo.tsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import {
  ProductFields,
  Product,
  SelectOption,
} from "@/features/catalogo/components/productos/productsFields";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { FaPlus } from "react-icons/fa";

const TypedFaPlus = FaPlus as unknown as React.FC<
  React.SVGProps<SVGSVGElement>
>;
export const SaveWithPlusIcon = () => (
  <div className="relative h-5 w-5 flex items-center justify-center">
    <SaveOutlined className="h-4 w-4 text-current" />
    <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-[1px]">
      <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
    </div>
  </div>
);

// ── Mock dropdown options ──
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

const MOCK_CHANNEL_OPTIONS: SelectOption[] = [
  { label: "Mercado Libre", value: "ML" },
  { label: "VTEX", value: "VTEX" },
  { label: "Shopify", value: "SHOPIFY" },
  { label: "Tienda Propia", value: "TIENDA" },
];

export function ProductCreateView() {
  const router = useRouter();

  const [newProduct, setNewProduct] = useState<Product>({
    Image: "",
    Name: "",
    Reference: "",
    Slug: "",
    SKU: "",
    Category: "",
    Brand: "",
    TotalSalesChannel: "",
    SalesChannels: [],
    DateModified: "",
    UserId: "",
    Status: "Inactivo",
    Eans: "",
    UpdatedByName: "",
    UpdatedByEmail: "",
    CreateDate: "",
    CreateTime: "",
    createdAtFormatted: "",
    seoTitle: "",
    seoKeywords: "",
    seoDescription: "",
  });

  const handleFieldChange = (field: keyof Product, value: string) => {
    setNewProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof Product, value: string[]) => {
    setNewProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = useCallback(() => {
    console.log("[MOCK] Guardar nuevo producto:", newProduct);
    router.push("/catalogo/productos");
  }, [newProduct, router]);

  const handleSaveAndCreate = useCallback(() => {
    console.log("[MOCK] Guardar y crear otro:", newProduct);
    setNewProduct({
      Image: "",
      Name: "",
      Reference: "",
      Slug: "",
      SKU: "",
      Category: "",
      Brand: "",
      TotalSalesChannel: "",
      SalesChannels: [],
      DateModified: "",
      UserId: "",
      Status: "Inactivo",
      Eans: "",
      UpdatedByName: "",
      UpdatedByEmail: "",
      CreateDate: "",
      CreateTime: "",
      createdAtFormatted: "",
      seoTitle: "",
      seoKeywords: "",
      seoDescription: "",
    });
  }, [newProduct]);

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Apply",
        variant: "primary",
        onClick: () => console.log("[MOCK] Apply clicked:", newProduct),
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Save",
        variant: "success",
        onClick: handleSave,
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Save and create",
        variant: "primary",
        onClick: handleSaveAndCreate,
        icon: <SaveWithPlusIcon />,
      },
      {
        label: "Cancel",
        variant: "secondary",
        onClick: () => router.push("/catalogo/productos"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [handleSave, handleSaveAndCreate, newProduct, router]
  );

  usePageHeader(
    () => ({ title: "Crear Producto", action: headerActions }),
    [headerActions]
  );

  return (
    <ProductFields
      product={newProduct}
      readOnly={false}
      onChange={handleFieldChange}
      onArrayChange={handleArrayChange}
      isNew={true}
      brandOptions={MOCK_BRAND_OPTIONS}
      categoryOptions={MOCK_CATEGORY_OPTIONS}
      salesChannelOptions={MOCK_CHANNEL_OPTIONS}
    />
  );
}
