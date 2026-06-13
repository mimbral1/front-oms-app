// app/views/Almacen/Gestion/Ingreso/pages/AlmacenesStagingPage.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";

import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus, FaClipboardList, FaCalculator } from "react-icons/fa";
import ViewHeadlineOutlinedIcon from "@mui/icons-material/ViewHeadlineOutlined";
import { TbArrowRampRight2, TbCircleTriangle } from "react-icons/tb";
import { CubeIcon } from "@heroicons/react/24/outline";

import Card from "@/components/ui/card/Card";

/* -------------------------------------------------- */
/*  Tipos y mock                                     */
/* -------------------------------------------------- */
interface StagingLevel {
  nivel: string;
  de: string;
  para: string;
  valores: string[];
}
interface StagingData {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  inboundLevels: StagingLevel[];
  slottingLevels: StagingLevel[];
  consolidationLevels: StagingLevel[];
  outboundLevels: StagingLevel[];
  holdingLevels: StagingLevel[];
  returnsLevels: StagingLevel[];
}

const mockStaging: StagingData[] = [
  {
    id: "20300",
    name: "Demo CAR Bodega",
    status: "Active",
    inboundLevels: [
      {
        nivel: "Sector",
        de: "c ",
        para: " b",
        valores: ["Resfriados", "Congelados", "+1"],
      },
      { nivel: "Bloque", de: "A", para: "E", valores: [] },
      { nivel: "Posición", de: "01", para: "06", valores: [] },
    ],
    slottingLevels: [
      { nivel: "Pasillo", de: "1", para: "6", valores: [] },
      { nivel: "Ubicación", de: "001", para: "010", valores: [] },
      { nivel: "Altura", de: "1", para: "7", valores: [] },
    ],
    consolidationLevels: [
      // …
      { nivel: "Nivel C1", de: "…", para: "…", valores: [] },
    ],
    outboundLevels: [
      // …
      { nivel: "Canal O", de: "…", para: "…", valores: [] },
    ],
    holdingLevels: [
      // …
      { nivel: "Holding", de: "…", para: "…", valores: [] },
    ],
    returnsLevels: [
      // …
      { nivel: "Returns", de: "…", para: "…", valores: [] },
    ],
  },
];

/* -------------------------------------------------- */
/*  CollapsibleCard                                  */
/* -------------------------------------------------- */
function CollapsibleCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card
      title={title}
      icon={icon}
      noDefaultStyles
      hasTitleDivider
      className="rounded-xl p-6 shadow-sm bg-white"
    >
      {/* Botón de toggle */}
      <div className="flex justify-end -mt-6 mb-4">
        <button onClick={() => setOpen((o) => !o)}>
          {open ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>
      {/* Contenido desplegable */}
      {open && <div className="space-y-10">{children}</div>}
    </Card>
  );
}

/* -------------------------------------------------- */
/*  StagingLevelView                                 */
/* -------------------------------------------------- */
function StagingLevelView({ nivelData }: { nivelData: StagingLevel }) {
  return (
    <div
      className="
        grid 
        grid-cols-[repeat(4,_minmax(0,_1fr))]

        items-start
        gap-x-8
        py-3
      "
    >
      {/* col-1  col-2 */}
      <FieldCell label="Nivel" value={nivelData.nivel} minW="6rem" />

      {/* col-3  col-4 */}
      <FieldCell label="De" value={nivelData.de} />

      {/* col-5  col-6 */}
      <FieldCell label="Para" value={nivelData.para} />

      {/* col-7 */}
      <FieldCellChips label="Valores" chips={nivelData.valores} />
    </div>
  );
}

function FieldCell({
  label,
  value,
  minW = "8rem", // ancho mínimo p/columna de valores
}: {
  label: string;
  value: React.ReactNode;
  minW?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-600">{label}</span>
      <span
        className="border-b border-gray-300 pb-0.5 text-sm font-medium text-gray-900"
        style={{ minWidth: minW }}
      >
        {value || " "}
      </span>
    </div>
  );
}
function FieldCellChips({ label, chips }: { label: string; chips: string[] }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-600">{label}</span>

      {/* línea con chips y flecha */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-0.5">
        <div className="flex flex-wrap gap-1">
          {chips.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
            >
              {c}
            </span>
          ))}
        </div>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      <div className="border-b border-gray-200 pb-1">
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );
}

function FieldLineChips({ label, chips }: { label: string; chips: string[] }) {
  return (
    <div>
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded bg-gray-200 px-2 py-1 text-xs text-gray-700"
            >
              {c}
            </span>
          ))}
        </div>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Página de Staging                                 */
/* -------------------------------------------------- */
export function AlmacenesStagingPage() {
  const { id } = useParams();
  const data = mockStaging.find((d) => d.id === id);
  if (!data) {
    return (
      <p className="p-4 text-center text-red-500">
        No se encontró datos de STAGING para este almacén
      </p>
    );
  }

  /* Header dinámico */
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "primary",
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
        onClick: () => window.history.back(),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    []
  );

  usePageHeader(
    () => ({
      title: `STAGING – ${data.name}`,
      action: headerActions,
      status: {
        text: data.status,
        variant: data.status === "Active" ? "success" : "warning",
      },
    }),
    [data.name, data.status, headerActions]
  );

  return (
    <div className="flex-1 bg-white p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
        {/* INGRESO (INBOUND) */}
        <CollapsibleCard
          title="INGRESO (INBOUND)"
          icon={<CubeIcon className="h-5 w-5 text-gray-500" />}
        >
          {data.inboundLevels.map((lvl, i) => (
            <StagingLevelView key={i} nivelData={lvl} />
          ))}
        </CollapsibleCard>

        {/* SLOTTING */}
        <CollapsibleCard
          title="SLOTTING"
          icon={<ViewHeadlineOutlinedIcon className="h-5 w-5 text-gray-500" />}
        >
          {data.slottingLevels.map((lvl, i) => (
            <StagingLevelView key={i} nivelData={lvl} />
          ))}
        </CollapsibleCard>

        {/* CONSOLIDACIÓN */}
        <CollapsibleCard
          title="CONSOLIDACIÓN"
          icon={<FaClipboardList className="h-5 w-5 text-gray-500" />}
        >
          {data.consolidationLevels.map((lvl, i) => (
            <StagingLevelView key={i} nivelData={lvl} />
          ))}
        </CollapsibleCard>

        {/* OUTBOUND */}
        <CollapsibleCard
          title="OUTBOUND"
          icon={<TbArrowRampRight2 className="h-5 w-5 text-gray-500" />}
        >
          {data.outboundLevels.map((lvl, i) => (
            <StagingLevelView key={i} nivelData={lvl} />
          ))}
        </CollapsibleCard>

        {/* HOLDING */}
        <CollapsibleCard
          title="HOLDING"
          icon={<FaCalculator className="h-5 w-5 text-gray-500" />}
        >
          {data.holdingLevels.map((lvl, i) => (
            <StagingLevelView key={i} nivelData={lvl} />
          ))}
        </CollapsibleCard>

        {/* RETURNS */}
        <CollapsibleCard
          title="RETURNS"
          icon={<TbCircleTriangle className="h-5 w-5 text-gray-500" />}
        >
          {data.returnsLevels.map((lvl, i) => (
            <StagingLevelView key={i} nivelData={lvl} />
          ))}
        </CollapsibleCard>
      </div>
    </div>
  );
}
