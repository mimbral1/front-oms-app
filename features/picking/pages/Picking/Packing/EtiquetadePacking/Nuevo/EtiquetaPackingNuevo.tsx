// app/views/Impresion/Etiquetas/Packing/Nuevo/page.tsx  (o tu ruta actual)
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import EtiquetaPackingFields, {
  type EtiquetaPacking,
} from "@/features/picking/components/picking/packing/etiquetadepacking/TemplateFields";

/** MISMO DEFAULT DEL RESUMEN VIEJO */
const DEFAULT_TEMPLATE = `<!-- Código editable para Etiqueta -->
<div style="width:100%; height:auto; border:2px solid #000; padding:0; background:#fff; font-family:Arial, sans-serif; font-size:15px;">
  <div style="padding:10px;">
    <div style="display:flex; align-items:flex-start;">
      <div style="display:flex; flex-direction:column; align-items:flex-start; min-width:0; margin-right:18px; flex:1 1 auto;">
        <img src="{{barcodeImgUrl}}" style="display:block; height:45px; object-fit:contain;padding-left:7px" />
        <div style="font-size:10px;text-align:center;padding-left:2px; letter-spacing:2px; word-break:break-all;">
          {{barcode}}
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; min-width:0; flex:0 0 auto;">
        <img src="{{barcode2ImgUrl}}" style="display:block; height:45px; object-fit:contain;" />
        <div style="font-size:10px;align-self:center;">{{barcode2}}</div>
      </div>
    </div>
    <hr style="border:none; border-top:3px solid #000; margin:5px 0 0px 0;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <div style="font-weight:bold;">ENVÍA</div>
        <div>{{sender}}</div>
      </div>
      <div>
        <div style="font-weight:bold;">RECIBE</div>
        <div>{{recipientName}}</div>
        <div>DNI: {{dni}}</div>
        <div>{{phone}}</div>
      </div>
    </div>
    <hr style="border:none; border-top:3px solid #000; margin:10px 0 8px 0;">
    <div style="font-weight:bold;">ENTREGA</div>
    <div>{{deliveryDate}}</div>
    <div>{{address}}</div>
    <hr style="border:none; border-top:3px solid #000; margin:10px 0 8px 0;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-weight:bold;">OPERADOR</div>
        <div>{{operator}}</div>
        <div>{{operator2}}</div>
      </div>
      <div style="display:flex; align-items:center;">
        <div style="border:1.5px solid #000; padding:8px 20px; font-size:24px; margin-right:8px;">
          {{page}}/{{totalPages}}
        </div>
        <img src="{{qrImgUrl}}" style="width:44px; height:44px;" />
      </div>
    </div>
  </div>
</div>
`;

const emptyRecord: EtiquetaPacking = {
  nombre: "",
  servicio: "Packing",
  entidad: "Bulto",
  modalidad: "package-label",
  status: "Activo",
  formato: "Custom",
  width: 15,
  height: 10,
  template: DEFAULT_TEMPLATE, // <<< aquí
  created: { username: "system", email: "system@example.com", date: "—" },
  modified: { username: "—", email: "—", date: "—" },
  estado: "Activo",
};

export default function EtiquetaPackingNuevo() {
  const router = useRouter();
  const [record, setRecord] = useState<EtiquetaPacking>(emptyRecord);

  const onChange = (field: keyof EtiquetaPacking, value: any) =>
    setRecord((r) => ({ ...r, [field]: value }));

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Guardar",
        variant: "success",
        onClick: () => console.log("Guardar", record),
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        onClick: () => {
          console.log("Guardar & crear nuevo", record);
          setRecord(emptyRecord);
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
            Nueva etiqueta de packing
          </div>
        </div>
      ),
      action: headerActions,
      status: {
        text: record.status,
        variant: record.status === "Activo" ? "success" : "warning",
      },
    } as PageHeaderProps),
    [headerActions, record.status]
  );

  return (
    <div className="flex flex-col bg-white">
      <div className="p-6">
        <EtiquetaPackingFields record={record} onChange={onChange} />
      </div>
    </div>
  );
}
