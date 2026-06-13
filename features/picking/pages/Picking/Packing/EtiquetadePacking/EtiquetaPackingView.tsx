// app/views/Picking/Packing/EtiquetadePacking/EtiquetaView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import {
  ArrowDownTrayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* ---------- Tipos ---------- */
type Estado = "Activo" | "Inactivo";

interface UserRef {
  initials: string;
  name: string;
  email: string;
}
interface TemplateRow {
  id: string;
  nombre: string;
  servicio: string;    // Packing, etc.
  entidad: string;     // package, order, etc.
  modalidad: string;   // package-label
  formato: "Custom" | "A4" | "A5";
  ancho: number;       // cm
  alto: number;        // cm
  status: Estado;
  creador: UserRef;
  modificado: { user: UserRef; date: string }; // "dd/mm/yyyy hh:mm"
}

/* ---------- Mock ---------- */
const MOCK: TemplateRow[] = [
  {
    id: "TPL-001",
    nombre: "Etiqueta Packing default",
    servicio: "Packing",
    entidad: "package",
    modalidad: "package-label",
    formato: "Custom",
    ancho: 15,
    alto: 10,
    status: "Activo",
    creador: { initials: "GP", name: "Gastón Pereyra", email: "gaston.pereyra@acme.com" },
    modificado: {
      user: { initials: "IG", name: "Ismael García", email: "ismael@acme.com" },
      date: "10/12/2024 16:59",
    },
  },
  {
    id: "TPL-002",
    nombre: "Etiqueta A5",
    servicio: "Packing",
    entidad: "package",
    modalidad: "package-label",
    formato: "A5",
    ancho: 14.8,
    alto: 21.0,
    status: "Inactivo",
    creador: { initials: "LG", name: "Laura Gómez", email: "laura@acme.com" },
    modificado: {
      user: { initials: "LG", name: "Laura Gómez", email: "laura@acme.com" },
      date: "05/11/2024 11:12",
    },
  },
];

/* ---------- UI helpers ---------- */
const PER_PAGE = 10;
const statusBg = (s: Estado) => (s === "Activo" ? "bg-green-500" : "bg-gray-400");
const UserChip = ({ u }: { u: UserRef }) => (
  <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
      {u.initials}
    </div>
    <div className="flex flex-col overflow-hidden text-left">
      <span className="truncate text-sm font-medium">{u.name}</span>
      <span className="truncate text-xs text-gray-500">{u.email}</span>
    </div>
  </div>
);

/* ---------- Filtros ---------- */
type Filters = {
  servicio: string;
  entidad: string;
  modalidad: string;
  estado: "" | Estado;
  search: string; // por nombre
};

const initialFilters: Filters = {
  servicio: "",
  entidad: "",
  modalidad: "",
  estado: "",
  search: "",
};

const getFilters = (f: Filters, source: TemplateRow[]) => [
  {
    id: "servicio",
    label: "Servicio",
    type: "select-search" as const,
    value: f.servicio,
    options: [
      { label: "Todos", value: "" },
      ...Array.from(new Set(source.map((r) => r.servicio))).map((v) => ({
        label: v,
        value: v,
      })),
    ],
  },
  {
    id: "entidad",
    label: "Entidad",
    type: "select-search" as const,
    value: f.entidad,
    options: [
      { label: "Todas", value: "" },
      ...Array.from(new Set(source.map((r) => r.entidad))).map((v) => ({
        label: v,
        value: v,
      })),
    ],
  },
  {
    id: "modalidad",
    label: "Modalidad",
    type: "select-search" as const,
    value: f.modalidad,
    options: [
      { label: "Todas", value: "" },
      ...Array.from(new Set(source.map((r) => r.modalidad))).map((v) => ({
        label: v,
        value: v,
      })),
    ],
  },
  {
    id: "estado",
    label: "Estado",
    type: "select-search" as const,
    value: f.estado,
    options: [
      { label: "Todos", value: "" },
      { label: "Activo", value: "Activo" },
      { label: "Inactivo", value: "Inactivo" },
    ],
  },
  { id: "search", label: "Buscar", type: "text" as const, placeholder: "Nombre", value: f.search },
];

/* ---------- Columnas ---------- */
function getColumns(): Column<TemplateRow>[] {
  return [
    { header: "Nombre", accessorKey: "nombre" },
    { header: "Servicio", accessorKey: "servicio" },
    { header: "Entidad", accessorKey: "entidad" },
    { header: "Modalidad", accessorKey: "modalidad" },
    { header: "Formato", accessorKey: "formato" },
    {
      header: "Ancho (cm)",
      accessorKey: "ancho",
      cell: (r) => r.ancho.toFixed(1),
    },
    {
      header: "Alto (cm)",
      accessorKey: "alto",
      cell: (r) => r.alto.toFixed(1),
    },
    {
      header: "Usuario creador",
      accessorKey: "creador",
      cell: (r) => <UserChip u={r.creador} />,
    },
    {
      header: "Última modificación",
      accessorKey: "modificado",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <UserChip u={r.modificado.user} />
          <span className="text-xs text-gray-500">{r.modificado.date}</span>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (r) => (
        <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${statusBg(r.status)}`}>
          {r.status}
        </div>
      ),
    },
  ];
}

/* ---------- View ---------- */
export default function PackingLabelsView() {
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows] = useState<TemplateRow[]>(MOCK);

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return rows.filter((r) => {
      const byServ = !filters.servicio || r.servicio === filters.servicio;
      const byEnt = !filters.entidad || r.entidad === filters.entidad;
      const byMod = !filters.modalidad || r.modalidad === filters.modalidad;
      const byStatus = !filters.estado || r.status === filters.estado;
      const bySearch = !q || r.nombre.toLowerCase().includes(q);
      return byServ && byEnt && byMod && byStatus && bySearch;
    });
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const startIndex = (currentPage - 1) * PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + PER_PAGE);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  /* Acciones header */
  const handleExport = () => {
    const headers = ["ID", "Nombre", "Servicio", "Entidad", "Modalidad", "Formato", "Ancho", "Alto", "Estado", "Creador", "Email", "Última mod."];
    const data = filtered.map((r) => [
      r.id,
      r.nombre,
      r.servicio,
      r.entidad,
      r.modalidad,
      r.formato,
      r.ancho,
      r.alto,
      r.status,
      r.creador.name,
      r.creador.email,
      r.modificado.date,
    ]);
    exportToCsv("packing-label-templates.csv", [headers, ...data]);
  };

  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push(`/picking/packing/etiquetas-de-packing/nuevo`),
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
    {
      label: "Actualizar",
      variant: "secondary" as const,
      onClick: () => setFilters((f) => ({ ...f })), // mock refresh, icon: <ArrowPathIcon className="h-5 w-5" />,
    },
  ];

  const columns = getColumns();
  const viewFilters = getFilters(filters, rows);
  const handleFilterChange = (id: string, value: string) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [id]: value as Filters[keyof Filters] }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title="Etiquetas de packing"
        filters={viewFilters}
        onFilterChange={handleFilterChange}
        action={headerActions}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl shadow-sm">
            <DataTable
              data={paginated}
              columns={columns}
              dataType="General2"
              statusKey="status"
              rowPaddingY={12}
              rowBgClass="bg-white"
              onRowClick={(row: TemplateRow) =>
                router.push(`/picking/packing/etiquetas-de-packing/${encodeURIComponent(row.id)}`)
              }
            />
          </div>

          <Pagination
              currentPage={currentPage}
              totalRecords={filtered.length}
              pageSize={PER_PAGE}
              onPageChange={setCurrentPage}
            />
        </div>
      </div>
    </div>
  );
}
