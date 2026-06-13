// app/views/Impresion/Etiquetas/Packing/Resumen/page.tsx  (o tu ruta actual)
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

import EtiquetaPackingFields, {
  type EtiquetaPacking,
} from "@/features/picking/components/picking/packing/etiquetadepacking/TemplateFields";

const DEFAULT_TEMPLATE = `<!-- Código editable para Etiqueta -->
<div style="width:100%; height:auto; border:2px solid #000; padding:0; background:#fff; font-family:Arial, sans-serif; font-size:15px;">
  <!-- … (mismo bloque que arriba) … -->
</div>
`;

const mockRecord: EtiquetaPacking = {
  nombre: "packing",
  servicio: "Packing",
  entidad: "Bulto",
  modalidad: "package-label",
  status: "Activo",
  formato: "Custom",
  width: 15,
  height: 10,
  template: DEFAULT_TEMPLATE, // <<< aquí
  created: { username: "system", email: "system@example.com", date: "—" },
  modified: { username: "Admin", email: "admin@example.com", date: "2025-02-01 12:00" },
  estado: "Activo",
};

export default function EtiquetaPackingResumen() {
  const router = useRouter();
  const [record, setRecord] = useState<EtiquetaPacking>(mockRecord);

  const onChange = (field: keyof EtiquetaPacking, value: any) =>
    setRecord((r) => ({ ...r, [field]: value }));

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: () => console.log("Aplicar (Resumen)", record),
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => console.log("Guardar (Resumen)", record),
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/picking/packing/etiquetas-de-packing"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [record, router]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Plantillas
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {record.nombre || "Etiqueta de packing"}
          </div>
        </div>
      ),
      action: headerActions,
      status: {
        text: record.status,
        variant: record.status === "Activo" ? "success" : "warning",
      },
    } as PageHeaderProps),
    [headerActions, record.nombre, record.status]
  );

  return (
    <div className="flex flex-col bg-white">
      <div className="p-6">
        <EtiquetaPackingFields record={record} onChange={onChange} />
      </div>
    </div>
  );
}
