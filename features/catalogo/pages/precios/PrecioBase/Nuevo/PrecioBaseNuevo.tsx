// app/views/Pricing/BasePrice/New/BasePriceCreatePage.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { BasePriceFields, BasePrice } from "@/features/catalogo/components/precios/preciobase/BasePriceFields";
import { ListPriceData } from "../Resumen/PrecioBaseResumen";

export function BasePriceCreateView() {
  const router = useRouter();

  const [record, setRecord] = useState<ListPriceData>({
    ItemCode: "",
    PriceList: "",
    Price: "",
    PriceIVA: "",
    CreatedAt: "",
    UpdatedAt: "",
    ItemName: "",
    Status: "Inactive",
  });

  const handleChange = (field: keyof BasePrice, value: string) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
  };

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-5 w-5" />,
        onClick: () => console.log("Aplicar sin cerrar", record),
      },
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-4 w-4" />,
        onClick: () => console.log("Guardar", record),
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
        onClick: () => {
          console.log("Guardar y limpiar", record);
          setRecord({
            ItemCode: "",
            PriceList: "",
            Price: "",
            PriceIVA: "",
            CreatedAt: "",
            UpdatedAt: "",
            ItemName: "",
            Status: "Inactive",
          });
        },
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
      title: "Nuevo Base Price",
      action: headerActions,
    } as PageHeaderProps),
    [headerActions]
  );

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
