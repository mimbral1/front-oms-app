"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
  AuditTypeFields,
  AuditTypeModel,
} from "@/features/pedidos/pages/Auditorias/tipos/componente/AuditTypeFields";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { SaveIcon } from "lucide-react";
import { FaPlus } from "react-icons/fa";

const mock: AuditTypeModel = {
  id: "T-001",
  name: "Operación",
  color: "#38bb1e",
  status: "Active",
  created: {
    username: "Nombre Usuario",
    email: "Username@gmail.com",
    date: "16/12/2021 12:20:02",
  },
};

export function AuditTypeResumenView() {
  const { id } = useParams<{ id: string }>();
  const data = mock;
  const router = useRouter();

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveIcon className="h-4 w-4" />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
              <FaPlus className="h-2.5 w-2.5 text-blue-500" />
            </div>
          </div>
        ),
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/pedidos/auditorias/tipos"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    []
  );

  usePageHeader(
    () =>
    ({
      title: data.name,
      description: "AUDIT TYPE",
      action: headerActions,
      status: {
        text: data.status,
        variant: data.status === "Active" ? "success" : "warning",
      },
    } as PageHeaderProps),
    [data.name, data.status, headerActions]
  );

  return (
    <div className="p-6 bg-white">
      <AuditTypeFields data={data} readOnly />
    </div>
  );
}
