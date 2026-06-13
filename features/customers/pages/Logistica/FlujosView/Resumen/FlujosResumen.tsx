// app/views/Almacen/Gestion/Ingreso/Resumen/FlowResumenPage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { FlowFields } from "@/features/customers/components/logistica/flujosview/FlowFields";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { Flow } from "../Nuevo/FlujosNuevo";

const mockFlows: Flow[] = [
  {
    id: "FLW-001",
    nombre: "Reemplazo con devolución previa",
    metodo: "Home",
    tipo: "Reemplazo del producto",
    allowreplace: true,
    automaticAprove: false,
    PickNewOrder: true,
    createdAt: "2024-06-10 09:15",
    createdBy: {
      username: "Leonardo",
      email: "leo@mimbral.com",
      imagen: "",
    },
    updatedAt: "2024-06-12 13:45",
    user: {
      username: "Juan",
      usermail: "juan@mimbral.com",
      userimage: "",
    },
    status: "Inactive",
  },
  {
    id: "FLW-002",
    nombre: "Reposicion de producto sin devolucion previa",
    metodo: "Home",
    tipo: "Reemplazo del producto",
    allowreplace: true,
    automaticAprove: false,
    PickNewOrder: true,
    createdAt: "2024-06-10 09:15",
    createdBy: {
      username: "Leonardo",
      email: "leo@mimbral.com",
      imagen: "",
    },
    updatedAt: "2024-06-12 13:45",
    user: {
      username: "Juan",
      usermail: "juan@mimbral.com",
      userimage: "",
    },
    status: "Active",
  },
];

export function FlowResumenView() {
  const { id } = useParams();
  const router = useRouter();

  const [flow, setFlow] = useState<Flow | null>(null);
  useEffect(() => {
    const found = mockFlows.find((f) => f.id === id) ?? mockFlows[0];
    setFlow(JSON.parse(JSON.stringify(found)));
  }, [id]);

  const handleChange = <K extends keyof Flow>(field: K, value: Flow[K]) => {
    setFlow((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => { },
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        onClick: () => { },
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
      /* {push(`/customers/logistica/flujos`)} */
    ],
    []
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Flujo de RMA
          </div>
          <div className="text-2xl font-semibold text-gray-900">{(flow?.nombre || flow?.id) ?? "—"}</div>
        </div>
      ),
      action: headerActions,
      status: flow
        ? {
          text: flow.status === "Active" ? "Activo" : "Inactivo",
          variant: flow.status === "Active" ? "success" : "warning",
        }
        : undefined,
    } as PageHeaderProps),
    [flow, headerActions]
  );
  if (!flow) {
    return <p className="p-4 text-center text-red-500">Flujo no encontrado</p>;
  }

  return (
    <div className="p-6 bg-white">
      <FlowFields flow={flow} readOnly={false} onChange={handleChange} />
    </div>
  );
}
