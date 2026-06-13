"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOlasStore } from "@/features/olas/stores/olas";
import { Ola, OlasFilters } from "@/features/olas/types/olas";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowPathIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { DataTable } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { Pagination } from "@/components/ui/pagination";
import { useFetchOlas } from "@/features/olas/hooks/useFetchOlas";
import {
  LockClosedIcon,
  LockOpenIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { exportToCsv } from "@/components/presets/export/export";
import { formatDateTime } from "@/lib/format/date";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Finalizada":
      return "bg-green-500";
    case "En curso":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

export const getOlasFilters = (
  filters: OlasFilters,
  pickingPointOptions: Array<{ label: string; value: string }>
) => [
    {
      id: "displayId",
      label: "Display ID",
      type: "text" as const,
      value: filters.displayId || "",
    },
    {
      id: "pickingPoint",
      label: "Picking point",
      type: "select-search" as const,
      value: filters.pickingPoint || "",
      options: pickingPointOptions,
    },
    {
      id: "dateRange",
      label: "Rango de fecha",
      type: "date-range" as const,
      value: filters.dateRange || "",
    },
  ];
const DataBadge = ({ value }: { value: string }) => {
  return (
    <div className="inline-flex items-center justify-center min-w-[50px] px-3 py-1 text-sm font-medium text-gray-700 border rounded-full border-gray-300 bg-white shadow-sm">
      {value}
    </div>
  );
};

function renderAccionCell(
  ola: Ola,
  pendingMap: Record<string, boolean>,
  onPendingClick: (ola: Ola) => void
) {
  if (ola.status === "Finalizada" || ola.bloqueada) {
    return null;
  }

  if (ola.status === "Pendiente") {
    const toggled = pendingMap[ola.id];
    if (!toggled) {
      return (
        <button
          onClick={() => onPendingClick(ola)}
          className={`
    inline-flex items-center justify-center gap-2
    rounded-full px-4 py-2 text-sm font-medium text-white
    bg-[#3db779] hover:bg-[#36a76c]
  `}
        >
          <SparklesIcon className="h-4 w-4" />
          Nuevo
        </button>
      );
    } else {
      return (
        <button
          onClick={() => onPendingClick(ola)}
          className={`inline-flex items-center justify-center gap-2
    rounded-full px-4 py-2 text-sm font-medium text-white
    bg-[#1877f2] hover:bg-[#1563cc]
  `}
        >
          Crear rondas
        </button>
      );
    }
  }

  return null;
}

const getOlasColumns = (
  onViewClick: (ola: Ola) => void,
  pendingMap: Record<string, boolean>,
  handlePendingClick: (ola: Ola) => void
) => [
    {
      header: "Display ID",
      accessorKey: "id" as keyof Ola,
      cell: (ola: Ola) => (
        <CopyableText text={ola.id} className="text-sm font-medium text-gray-900">{ola.id}</CopyableText>
      ),
    },
    {
      header: "Picking point",
      accessorKey: "pickingPoint" as keyof Ola,
      cell: (ola: Ola) => (
        <div className="text-sm text-gray-900">{ola.pickingPoint}</div>
      ),
    },
    {
      header: "Fecha inicio",
      accessorKey: "fechaInicio" as keyof Ola,
      cell: (ola: Ola) => {
        const [fecha, hora] = formatDateTime(ola.fechaInicio).parts;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">{fecha}</span>
            <span className="text-gray-600">{hora}</span>
          </div>
        );
      },
    },
    {
      header: "Fecha fin",
      accessorKey: "fechaFin" as keyof Ola,
      cell: (ola: Ola) => {
        const [fecha, hora] = formatDateTime(ola.fechaFin).parts;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">{fecha}</span>
            <span className="text-gray-600">{hora}</span>
          </div>
        );
      },
    },
    {
      header: "Pedidos",
      accessorKey: "pedidos" as keyof Ola,
      cell: (ola: Ola) => (
        <DataBadge value={`${ola.pedidos.actual}/${ola.pedidos.total}`} />
      ),
    },
    {
      header: "Items",
      accessorKey: "items" as keyof Ola,
      cell: (ola: Ola) => (
        <DataBadge value={`${ola.items.actual}/${ola.items.total}`} />
      ),
    },
    {
      header: "Bloqueada",
      accessorKey: "bloqueada" as keyof Ola,
      cell: (ola: Ola) => {
        const isBlocked = ola.bloqueada;
        const Icon = isBlocked ? LockClosedIcon : LockOpenIcon;
        const label = isBlocked ? "Sí" : "No";
        const bgColor = isBlocked ? "bg-red-500" : "bg-gray-500";

        return (
          <div
            className={`
						inline-flex items-center justify-center gap-2 
						rounded-full px-4 py-2 text-sm font-medium text-white 
						${bgColor}
					`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Ola,
      cell: (ola: Ola) => {
        const bgColor = getStatusColor(ola.status); // "bg-green-500", etc.

        return (
          <div
            className={`
						inline-flex items-center justify-center gap-2
						rounded-full px-4 py-2 text-sm font-medium text-white
						${bgColor}
					`}
          >
            {ola.status}
          </div>
        );
      },
    },
    {
      header: "Acciones",
      accessorKey: "id",
      disableRowClick: true,
      cell: (ola: Ola) =>
        renderAccionCell(
          ola,
          pendingMap, // vendrá desde OlasTable
          handlePendingClick // vendrá desde OlasTable
        ),
    },
  ];

interface OlasTableProps {
  olas: Ola[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewClick: (ola: Ola) => void;

  pendingMap: Record<string, boolean>;
  handlePendingClick: (ola: Ola) => void;
}

export function OlasTable({
  olas,
  currentPage,
  totalPages,
  onPageChange,
  onViewClick,
  pendingMap,
  handlePendingClick,
}: OlasTableProps) {
  const columns = getOlasColumns(onViewClick, pendingMap, handlePendingClick);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl  shadow-sm">
        <DataTable
          data={olas}
          columns={columns as any}
          rowBgClass="bg-white"
          onRowClick={onViewClick}
        />
        {/* rowGap={4}
				rowBgClass="bg-white shadow-sm" */}
      </div>

      <div className="flex flex-col items-center gap-4">
        {olas.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
        <div className="text-sm text-gray-500">{olas.length} resultados</div>
      </div>
    </div>
  );
}

const getOlasActions = (
  onRefresh: () => void,
  onExport: () => void
) => [
    {
      label: "Actualizar",
      variant: "secondary" as const,
      onClick: onRefresh,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: onExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />
    },
  ];

const ITEMS_PER_PAGE = 10;

export default function OlasView() {
  const router = useRouter();
  const { error, isLoading, refetch } = useFetchOlas();
  const { olas, filters, setFilters } = useOlasStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({});
  const handlePendingClick = (ola: Ola) => {
    const toggled = pendingMap[ola.id];
    if (!toggled) {
      // Primer click => se cambia a "Crear"
      setPendingMap((prev) => ({ ...prev, [ola.id]: true }));
    } else {
      // Segundo click => Ir al tab de pedidos de la ola
      router.push(`/picking/olas/${ola.id}/pedidos`);
    }
  };

  const handleFilterChange = (id: string, value: string) => {
    setFilters({ [id]: value });
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({
      displayId: "",
      pickingPoint: "",
      dateRange: "",
    });
    setCurrentPage(1);
  };

  const handleExport = () => {
    const headers = [
      "Display ID",
      "Picking point",
      "Fecha inicio",
      "Fecha fin",
      "Pedidos",
      "Items",
      "Bloqueada",
      "Status",
    ];
    const rows = filteredOlas.map((ola: Ola) => {
      const [fechaInicio, horaInicio] = formatDateTime(ola.fechaInicio).parts;
      const [fechaFin, horaFin] = formatDateTime(ola.fechaFin).parts;
      return [
        ola.id,
        ola.pickingPoint,
        `${fechaInicio} ${horaInicio}`,
        `${fechaFin} ${horaFin}`,
        `${ola.pedidos.actual}/${ola.pedidos.total}`,
        `${ola.items.actual}/${ola.items.total}`,
        ola.bloqueada ? "Sí" : "No",
        ola.status,
      ];
    });
    exportToCsv("olas.csv", [headers, ...rows]);
  };

  const handleViewClick = (ola: Ola) => {
    router.push(`/picking/olas/${ola.id}`);
  };

  const pickingPointOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const ola of olas) {
      const name = (ola.pickingPoint || "").trim();
      if (name) unique.add(name);
    }

    return [
      { label: "Todos", value: "" },
      ...Array.from(unique)
        .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
        .map((name) => ({ label: name, value: name })),
    ];
  }, [olas]);

  const activeFiltersCount = [
    (filters.displayId || "").trim(),
    filters.pickingPoint || "",
    filters.dateRange || "",
  ].filter(Boolean).length;

  // Aplicar filtros
  const filteredOlas = olas.filter((ola: Ola) => {
    const matchId =
      !filters.displayId ||
      ola.id.toLowerCase().includes(filters.displayId.toLowerCase());
    const matchPickingPoint =
      !filters.pickingPoint || ola.pickingPoint === filters.pickingPoint;

    let matchDateRange = true;
    if (filters.dateRange) {
      try {
        const range = JSON.parse(filters.dateRange) as { start?: string; end?: string };
        const from = range.start ? new Date(range.start) : null;
        const to = range.end ? new Date(`${range.end}T23:59:59`) : null;
        const olaStart = new Date(ola.fechaInicio);

        if (Number.isNaN(olaStart.getTime())) return false;
        if (from && olaStart < from) matchDateRange = false;
        if (to && olaStart > to) matchDateRange = false;
      } catch {
        matchDateRange = true;
      }
    }

    return matchId && matchPickingPoint && matchDateRange;
  });

  const totalPages = Math.ceil(filteredOlas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOlas = filteredOlas.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const dataFilters = getOlasFilters(filters, pickingPointOptions);
  const headerActions = getOlasActions(handleRefresh, handleExport);

  const filtersRight = (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
        <FunnelIcon className="h-4 w-4 text-gray-600" />
        <span className="font-medium">{activeFiltersCount}</span>
      </div>
      <ClearFiltersButton onClick={handleClearFilters} disabled={activeFiltersCount === 0} />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Olas de picking"
        filters={dataFilters}
        onFilterChange={handleFilterChange}
        action={headerActions}
        filtersRight={filtersRight}
      />
      <div className="flex-1 p-6">
        <OlasTable
          olas={paginatedOlas}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onViewClick={handleViewClick}
          pendingMap={pendingMap}
          handlePendingClick={handlePendingClick}
        />
      </div>
    </div>
  );
}

