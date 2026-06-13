// app/templates/new/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, PlusIcon as HeroPlusIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { ActionButton } from "@/components/ui/button/action-button";

const TypedHeroPlus = HeroPlusIcon as unknown as React.FC<
  React.SVGProps<SVGSVGElement>
>;

export function EtiquetasNew() {
  const router = useRouter();

  // Estados de los campos
  const [service, setService] = useState("");
  const [entity, setEntity] = useState("");
  const [position, setPosition] = useState("");
  const [code, setCode] = useState("");
  const [format, setFormat] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [templateText, setTemplateText] = useState("");

  // Icono Guardar & Crear nuevo
  const SaveWithPlusIcon = () => (
    <div className="relative flex h-5 w-5 items-center justify-center">
      <SaveOutlined className="h-4 w-4 text-current" />
      <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
        <TypedHeroPlus className="h-2.5 w-2.5 text-blue-500" />
      </div>
    </div>
  );

  // Acciones del header
  const headerActions = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success" as const,
        onClick: () => {
          /* lgica apply */
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success" as const,
        onClick: () => {
          /* lgica save */
        },
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success" as const,
        onClick: () => {
          /* lgica save & new */
        },
        icon: <SaveWithPlusIcon />,
      },
      {
        label: "Volver al listado",
        variant: "secondary" as const,
        onClick: () => router.push("/almacen/configuracion/etiquetas"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );

  // Inyectar header
  usePageHeader(
    () => ({
      title: "TEMPLATES",
      description: "Nuevo",
      action: headerActions,
    }),
    [headerActions]
  );

  // Copiar al portapapeles
  const copyToClipboard = () => {
    navigator.clipboard.writeText(templateText);
  };

  return (
    <div className="flex-1 bg-[#f0f2f8] p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* --- IZQUIERDA (DETAIL) --- */}
        <div className="space-y-6">
          <Card title="DETALLE" hasTitleDivider>
            <div className="space-y-4">
              {/* Servicio */}
              <CollapsibleField
                label="Servicio"
                value={service}
                options={["WMS", "ERP", "Mobi", "API"]}
                onChange={setService}
              />
              {/* Entidad */}
              <div className="flex items-center border-b border-gray-200 pb-2">
                <span className="text-sm text-gray-600 w-32">Entidad</span>
                <input
                  className="flex-1 text-sm font-medium text-gray-900 focus:outline-none"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>
              {/* Position + botn Nuevo */}
              <div className="flex items-center border-b border-gray-200 pb-2">
                <span className="text-sm text-gray-600 w-32">Position</span>
                <input
                  className="flex-1 text-sm font-medium text-gray-900 focus:outline-none"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. A1"
                />
                <ActionButton
                  variant="primary"
                  size="sm"
                  className="ml-4"
                  onClick={() => {
                    /* lgica nuevo position */
                  }}
                >
                  <HeroPlusIcon className="h-4 w-4" />
                  Nuevo
                </ActionButton>
              </div>
              {/* Modalidad */}
              <div className="flex items-center border-b border-gray-200 pb-2">
                <span className="text-sm text-gray-600 w-32">Modalidad</span>
                <input
                  className="flex-1 text-sm font-medium text-gray-900 focus:outline-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. labels"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* --- DERECHA (FORMAT) --- */}
        <div className="space-y-6">
          <Card title="FORMAT" hasTitleDivider>
            <div className="space-y-4">
              {/* Formato */}
              <CollapsibleField
                label="Formato"
                value={format}
                options={["Custom", "Standard", "Small", "Large"]}
                onChange={setFormat}
              />
              {/* Width */}
              <div className="flex items-center border-b border-gray-200 pb-2">
                <span className="text-sm text-gray-600 w-24">Width</span>
                <input
                  type="number"
                  className="flex-1 text-sm font-medium text-gray-900 focus:outline-none"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
              {/* Height */}
              <div className="flex items-center border-b border-gray-200 pb-2">
                <span className="text-sm text-gray-600 w-24">Height</span>
                <input
                  className="flex-1 text-sm font-medium text-gray-900 focus:outline-none"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 10.5"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* --- FULL WIDTH (TEMPLATE) --- */}
        <div className="lg:col-span-2">
          <Card title="TEMPLATE" hasTitleDivider>
            <div className="relative">
              <textarea
                className="w-full h-40 resize-none border border-gray-200 p-3 text-sm font-mono text-gray-800 focus:outline-none"
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                placeholder="Pega aqu tu template..."
              />
              <button
                className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                onClick={copyToClipboard}
              >
                <HeroPlusIcon className="h-4 w-4 rotate-45" />{" "}
                {/* icono de copiar */}
                Copiar
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
