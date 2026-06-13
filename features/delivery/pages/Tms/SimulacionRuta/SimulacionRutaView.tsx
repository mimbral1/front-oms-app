"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
  CubeIcon,
  HomeIcon,
  PlusIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

type Estado = "Pendiente de confirmación" | "Routes created" | "Error" | string;

interface SimRow {
  id: string;
  fecha_creacion: string;
  fechaCreacionRaw: string;
  programacion: string;
  entregaDesdeRaw: string;
  entregaHastaRaw: string;
  inventario: string;
  rutas: number;
  entregas: number;
  creador: { iniciales: string; nombre: string; email: string };
  estado: Estado;
  compania?: string;
  carrierIds?: string[];
}

interface Filters {
  entregaDesde: string;
  entregaHasta: string;
  estado: string;
  creadoDesde: string;
  creadoHasta: string;
  usuario: string;
}

const PER_PAGE = 20;

const initialFilters: Filters = {
  entregaDesde: "",
  entregaHasta: "",
  estado: "",
  creadoDesde: "",
  creadoHasta: "",
  usuario: "",
};

const MOCK: SimRow[] = [
  {
    id: "SIM-250228-TAL-01",
    fecha_creacion: "28/02/2025 09:10",
    fechaCreacionRaw: "2025-02-28T09:10:00",
    programacion: "28/02/2025 00:00 → 28/02/2025 23:59",
    entregaDesdeRaw: "2025-02-28T00:00:00",
    entregaHastaRaw: "2025-02-28T23:59:00",
    inventario: "Talca Centro",
    rutas: 2,
    entregas: 5,
    creador: { iniciales: "FP", nombre: "Felipe Pino", email: "fpino@mimbral.cl" },
    estado: "Pendiente de confirmación",
    compania: "Compañía A",
    carrierIds: ["Carrier-TAL-01"],
  },
];

const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const toTimestamp = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const matchesDateFilter = (
  rowValue: string,
  filterValue: string,
  mode: "gte" | "lte"
) => {
  const rowTimestamp = toTimestamp(rowValue);
  const filterTimestamp = toTimestamp(filterValue);

  if (rowTimestamp === null || filterTimestamp === null) return true;
  return mode === "gte" ? rowTimestamp >= filterTimestamp : rowTimestamp <= filterTimestamp;
};

const EstadoBadge = ({ value }: { value: Estado }) => {
  const normalized = normalize(value);
  const baseClass = "rounded-full px-3 py-1 text-xs font-semibold";

  if (normalized === "routes created") {
    return <span className={`${baseClass} bg-green-600 text-white`}>Routes created</span>;
  }

  if (normalized === "error") {
    return <span className={`${baseClass} bg-red-600 text-white`}>Error</span>;
  }

  return <span className={`${baseClass} bg-orange-500 text-white`}>Pendiente de confirmación</span>;
};

const Chip = ({ text }: { text: string }) => (
  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
    {text}
  </span>
);

function getColumns(): Column<SimRow>[] {
  return [
    {
      header: "Envío",
      accessorKey: "id",
      cell: (row) => (
        <div className="relative pl-4">
          <div className="flex flex-col">
            <a className="text-sm font-semibold text-blue-600"># {row.id}</a>
            <div className="text-xs text-gray-600">{row.fecha_creacion}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Programación",
      accessorKey: "programacion",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-700" />
          <Chip text={row.programacion} />
        </div>
      ),
    },
    {
      header: "Inventario",
      accessorKey: "inventario",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <HomeIcon className="h-5 w-5 text-gray-600" />
          <div className="flex flex-col">
            <a className="text-sm text-blue-600">{row.inventario}</a>
            <span className="text-xs text-blue-600">Talca</span>
          </div>
        </div>
      ),
    },
    {
      header: "Rutas",
      accessorKey: "rutas",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <TruckIcon className="h-5 w-5 text-gray-700" />
          <span className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm">
            {row.rutas}
          </span>
        </div>
      ),
    },
    {
      header: "Entregas",
      accessorKey: "entregas",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <CubeIcon className="h-5 w-5 text-gray-700" />
          <span className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm">
            {row.entregas}
          </span>
        </div>
      ),
    },
    {
      header: "Usuario creador",
      accessorKey: "creador",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-pink-600 text-xs font-semibold text-white">
            {row.creador.iniciales}
          </span>
          <div className="flex flex-col">
            <a className="text-sm text-blue-600 hover:underline">{row.creador.nombre}</a>
            <span className="text-xs text-gray-600">{row.creador.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (row) => (
        <div className="flex items-center justify-between">
          <EstadoBadge value={row.estado} />
        </div>
      ),
    },
  ];
}

const filterConfig: FilterConfig<Filters, SimRow>[] = [
  {
    id: "entregaDesde",
    label: "Fecha desde",
    type: "datetime",
    match: (row, value) => matchesDateFilter(row.entregaDesdeRaw, value, "gte"),
  },
  {
    id: "entregaHasta",
    label: "Fecha hasta",
    type: "datetime",
    match: (row, value) => matchesDateFilter(row.entregaHastaRaw, value, "lte"),
  },
  {
    id: "estado",
    label: "Estado",
    type: "select",
    options: [
      { label: "Pendiente de confirmación", value: "Pendiente de confirmación" },
      { label: "Routes created", value: "Routes created" },
      { label: "Error", value: "Error" },
    ],
    rowValue: (row) => row.estado,
  },
  {
    id: "creadoDesde",
    label: "Fecha de creación (desde)",
    type: "datetime",
    match: (row, value) => matchesDateFilter(row.fechaCreacionRaw, value, "gte"),
  },
  {
    id: "creadoHasta",
    label: "Fecha de creación (hasta)",
    type: "datetime",
    match: (row, value) => matchesDateFilter(row.fechaCreacionRaw, value, "lte"),
  },
  {
    id: "usuario",
    label: "Usuario creador",
    type: "text",
    placeholder: "Nombre o email…",
    match: (row, value) =>
      normalize(`${row.creador.nombre} ${row.creador.email}`).includes(normalize(value)),
  },
];

export default function SimulacionRutaView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(), []);
  const [currentPage, setCurrentPage] = useState(1);

  const { headerFilters, handleFilterChange, applyFilters } = useStandardFilters<Filters, SimRow>({
    initialFilters,
    configs: filterConfig,
  });

  const filteredRows = useMemo(() => applyFilters(MOCK), [applyFilters]);
  const totalRecords = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredRows.slice(start, start + PER_PAGE);
  }, [currentPage, filteredRows]);

  const handleExport = useCallback(() => {
    const headers = [
      "ID",
      "Fecha creación",
      "Programación",
      "Inventario",
      "Rutas",
      "Entregas",
      "Creador",
      "Estado",
      "Compañía",
      "Carrier Ids",
    ];

    const data = filteredRows.map((row) => [
      row.id,
      row.fecha_creacion,
      row.programacion,
      row.inventario,
      row.rutas,
      row.entregas,
      `${row.creador.nombre} <${row.creador.email}>`,
      row.estado,
      row.compania ?? "",
      (row.carrierIds ?? []).join(", "),
    ]);

    exportToCsv("simulacion_ruta.csv", [headers, ...data]);
  }, [filteredRows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/delivery/tms/simulacion-ruta/nuevo"),
        icon: <PlusIcon className="h-5 w-5" />,
      },
      {
        label: "Exportar",
        variant: "primary",
        onClick: handleExport,
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      },
      {
        label: "Actualizar",
        variant: "secondary",
        onClick: () => setCurrentPage(1),
        icon: <ArrowPathIcon className="h-5 w-5" />,
      },
    ],
    [handleExport, router]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Simulación de ruta"
        action={headerActions}
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, String(value ?? ""));
        }}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <DataTable
            data={pagedRows}
            columns={columns}
            statusKey="estado"
            rowPaddingY={12}
            showStatusBorder
            rowBgClass="bg-white"
            onRowClick={(row: SimRow) =>
              router.push(`/delivery/tms/simulacion-ruta/${row.id}`)
            }
          />

          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={PER_PAGE}
            onPageChange={(nextPage) =>
              setCurrentPage(Math.max(1, Math.min(nextPage, totalPages)))
            }
          />
        </div>
      </div>
    </div>
  );
}
