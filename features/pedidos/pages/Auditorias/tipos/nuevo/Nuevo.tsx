/* ------------------------------------------------------------------
   app/auditoria/tipos/nuevo/page.tsx   ·  AuditTypeCreatePage
-------------------------------------------------------------------*/
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
  AuditTypeFields,
  AuditTypeModel,
} from "@/features/pedidos/pages/Auditorias/tipos/componente/AuditTypeFields";
import { ArrowDownOnSquareIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

const empty: AuditTypeModel = {
  name: "",
  color: "#38bb1e",
  status: "Active",
  created: { username: "", email: "", date: "" },
};

export function AuditTypeCreateView() {
  const [data, setData] = useState<AuditTypeModel>(empty);
  const router = useRouter();

  const onChange = <K extends keyof AuditTypeModel>(
    k: K,
    v: AuditTypeModel[K]
  ) => setData((p) => ({ ...p, [k]: v }));

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-5 w-5" />,
        onClick: () => console.log("apply", data),
      },
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-4 w-4" />,
        onClick: () => console.log("save", data),
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        onClick: () => {
          console.log("save & new", data);
          setData(empty); // limpia,
            icon: <ArrowDownOnSquareIcon className="h-5 w-5" />
        },
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveOutlined className="h-4 w-4" />
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
    [data]
  );

  usePageHeader(
    () =>
    ({
      title: "Nuevo Audit Type",
      action: headerActions,
    } as PageHeaderProps),
    [headerActions]
  );

  return (
    <div className="p-6 bg-white">
      <AuditTypeFields data={data} readOnly={false} onChange={onChange} />
    </div>
  );
}
