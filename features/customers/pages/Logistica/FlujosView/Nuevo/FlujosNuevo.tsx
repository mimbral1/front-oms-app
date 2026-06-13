// app/views/Almacen/Gestion/Ingreso/Create/OrderCreatePage.tsx
"use client";

import React, { useMemo, useState } from "react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { FlowFields } from "@/features/customers/components/logistica/flujosview/FlowFields";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";

export interface Flow {
  id: string;
  nombre: string;
  metodo: string;

  tipo: string;
  allowreplace: boolean | undefined;
  automaticAprove: boolean | undefined;
  PickNewOrder: boolean | undefined;

  createdAt: string; // ISO o string legible
  createdBy: {
    username: string;
    email: string;
    imagen: string;
  };

  updatedAt: string;
  user: {
    username: string;
    usermail: string;
    userimage: string;
  };
  status: "Active" | "Inactive";
}

export function FlowCreateView() {
  // Estado inicial «vacío»
  const initialFlow: Flow = {
    id: "",
    nombre: "",
    metodo: "",
    tipo: "",
    allowreplace: false,
    automaticAprove: false,
    PickNewOrder: false,
    createdAt: "",
    createdBy: {
      username: "",
      email: "",
      imagen: "",
    },
    updatedAt: "",
    user: {
      username: "",
      usermail: "",
      userimage: "",
    },
    status: "Inactive",
  };

  const [flow, setFlow] = useState<Flow>(initialFlow);
  const router = useRouter();

  // Handler genérico para cualquier campo
  const handleChange = <K extends keyof Flow>(field: K, value: Flow[K]) => {
    setFlow((prev) => ({ ...prev, [field]: value }));
  };

  // Acciones del header idénticas a tu vista de resumen
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: () => console.log("Aplicar", flow),
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => console.log("Guardar orden", flow),
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        onClick: () => {
          console.log("Guardar y limpiar formulario", flow);
          setFlow(initialFlow);
        },
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveOutlined className="h-4 w-4 text-current" />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
              <FaPlus className="h-2.5 w-2.5 text-blue-500" />
            </div>
          </div>
        ),
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/customers/logistica/flujos"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [flow]
  );

  // Inyectamos el header (título + acciones)
  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Nuevo Flujo de RMA
          </div>
          <div className="text-2xl font-semibold text-gray-900">Nuevo Flujo de RMA</div>
        </div>
      ),
      action: headerActions,
    } as PageHeaderProps),
    [headerActions]
  );

  return (
    <div className="p-6 bg-white">
      {/* Aquí pasamos readOnly={false} y nuestro handleChange */}
      <FlowFields flow={flow} readOnly={false} onChange={handleChange} />
    </div>
  );
}
