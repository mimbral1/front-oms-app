"use client";

import { useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";

import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus, FaClipboardList } from "react-icons/fa";
import ViewHeadlineOutlinedIcon from "@mui/icons-material/ViewHeadlineOutlined";

import Card from "@/components/ui/card/Card";
import { useMemo } from "react";
import type { Action } from "@/components/layout/page-header";

/* -------------------------------------------------- */
/*  Mock                                              */
/* -------------------------------------------------- */
const TypedFaPlus = FaPlus as unknown as React.FC<
  React.SVGProps<SVGSVGElement>
>;
const SaveWithPlusIcon = () => (
  <div className="relative flex h-5 w-5 items-center justify-center">
    <SaveOutlined className="h-4 w-4 text-current" />
    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
      <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
    </div>
  </div>
);

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
  consolidationLevels: StagingLevel[];
  slottingLevels: StagingLevel[];
}

const mockStaging: StagingData[] = [
  {
    id: "20300",
    name: "Demo CAR Bodega",
    status: "Active",
    consolidationLevels: [
      {
        nivel: "Sector",
        de: "",
        para: "",
        valores: ["Resfriados", "Congelados", "+1"],
      },
      { nivel: "Bloque", de: "A", para: "E", valores: [] },
      { nivel: "Posición", de: "01", para: "06", valores: [] },
    ],
    slottingLevels: [
      {
        nivel: "Corredor",
        de: "01",
        para: "10",
        valores: ["Resfriados", "Congelados", "+1"],
      },
      { nivel: "Lateral", de: "", para: "", valores: ["D", "+1"] },
      { nivel: "Bloque", de: "001", para: "010", valores: [] },
    ],
  },
];

/* -------------------------------------------------- */
/*  COMPONENT                                         */
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

  /* ---------- Header dinámico ---------- */
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
        icon: <SaveWithPlusIcon />,
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

  const statusVariantMap = { Active: "success", Inactive: "warning" } as const;

  /* 2ï¸‍⃣  builder + dependencias */
  usePageHeader(
    () => ({
      title: `STAGING – ${data.name}`,
      action: headerActions,
      status: { text: data.status, variant: statusVariantMap[data.status] },
    }),
    [data.name, data.status, headerActions]
  );

  /* ---------- UI ---------- */
  return (
    <div className="flex-1 bg-white p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* CONSOLIDACIÓN */}
        <Card
          title="CONSOLIDACIÓN"
          icon={FaClipboardList}
          hasOptions={false}
          noDefaultStyles
          hasTitleDivider
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="space-y-10">
            {data.consolidationLevels.map((lvl, idx) => (
              <StagingLevelView key={idx} nivelData={lvl} />
            ))}
          </div>
        </Card>

        {/* SLOTTING */}
        <Card
          title="SLOTTING"
          icon={ViewHeadlineOutlinedIcon}
          hasOptions={false}
          noDefaultStyles
          hasTitleDivider
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="space-y-10">
            {data.slottingLevels.map((lvl, idx) => (
              <StagingLevelView key={idx} nivelData={lvl} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/*  Helper components                                 */
/* -------------------------------------------------- */

interface StagingLevelViewProps {
  nivelData: StagingLevel;
}

function StagingLevelView({ nivelData }: StagingLevelViewProps) {
  return (
    <div className="space-y-8">
      <FieldLine label="Nivel" value={nivelData.nivel} />

      <FieldLine2
        labelLeft="De"
        valueLeft={nivelData.de}
        labelRight="Para"
        valueRight={nivelData.para}
      />

      <FieldLineValores label="Valores" chips={nivelData.valores} />
    </div>
  );
}

function FieldLine({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div>
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      <div className="border-b border-gray-200 pb-1">
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );
}

function FieldLine2({
  labelLeft,
  valueLeft,
  labelRight,
  valueRight,
}: {
  labelLeft: string;
  valueLeft: string;
  labelRight: string;
  valueRight: string;
}) {
  return (
    <div className="flex items-center gap-10">
      <div className="flex-1">
        <FieldLine label={labelLeft} value={valueLeft} />
      </div>
      <div className="flex-1">
        <FieldLine label={labelRight} value={valueRight} />
      </div>
    </div>
  );
}

function FieldLineValores({
  label,
  chips,
}: {
  label: string;
  chips: string[];
}) {
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
        <button className="text-gray-500 hover:text-gray-700">
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
