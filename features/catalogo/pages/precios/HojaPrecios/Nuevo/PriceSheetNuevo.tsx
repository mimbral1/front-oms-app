// app/views/Pricing/PriceSheet/New/PriceSheetCreatePage.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { PriceSheetFields, PriceSheet } from "@/features/catalogo/components/precios/hojaprecios/PriceFields";

export function PriceSheetCreateView() {
  const router = useRouter();

  const initial: PriceSheet = {
    id: "",
    name: "",
    reference: "",
    salesChannels: [],
    incrementThreshold: "",
    decrementThreshold: "",
  };

  const [record, setRecord] = useState<PriceSheet>(initial);

  const handleChange = (field: keyof PriceSheet, value: string | string[]) => {
    setRecord((prev) => ({ ...prev, [field]: value as any }));
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
        onClick: () => {
          console.log("Save & clear", record);
          setRecord(initial);
        },
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/Pricing/PriceSheet"),
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
            Nueva hoja de precios
          </div>
        </div>
      ),
      action: headerActions,
    } as PageHeaderProps),
    [headerActions]
  );

  return (
    <div className="p-6 bg-white">
      <PriceSheetFields record={record} readOnly={false} onChange={handleChange} />
    </div>
  );
}
