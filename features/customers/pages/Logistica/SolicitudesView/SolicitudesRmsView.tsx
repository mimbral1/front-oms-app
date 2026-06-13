// app/views/Operaciones/Solicitudes/Browse/SolicitudesRmsView.tsx
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* ---------- Tipos UI ---------- */
type Estado = "Procesando" | "Finalizada" | "Rechazada";

interface SolicitudRow {
  id: number;
  flow: string;
  pedido: string;
  clienteNombre: string;
  clienteEmail: string;
  creacion: string; // fecha formateada
  usuarioCreadorNombre: string;
  usuarioCreadorEmail: string;
  estado: Estado;
}

/* ---------- Helpers UI ---------- */
const PER_PAGE = 20;

const estadoColor = (s: Estado) =>
  s === "Procesando" ? "bg-yellow-500" : s === "Finalizada" ? "bg-green-500" : "bg-rose-500";

const EstadoPill = ({ estado }: { estado: Estado }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white ${estadoColor(estado)}`}>
    {estado}
  </span>
);

const Avatar = ({ name }: { name: string }) => {
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
      {initials || "?"}
    </div>
  );
};

/* ---------- Columnas ---------- */
function getColumns(): Column<SolicitudRow>[] {
  return [
    { header: "Flujo", accessorKey: "flow" },
    { header: "Pedido", accessorKey: "pedido" },
    {
      header: "Cliente",
      accessorKey: "clienteNombre",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{r.clienteNombre}</span>
          <span className="text-xs text-gray-500">{r.clienteEmail}</span>
        </div>
      ),
    },
    { header: "Creación", accessorKey: "creacion" },
    {
      header: "Usuario creador",
      accessorKey: "usuarioCreadorNombre",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Avatar name={r.usuarioCreadorNombre} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{r.usuarioCreadorNombre}</span>
            <span className="text-xs text-gray-500">{r.usuarioCreadorEmail}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (r) => <EstadoPill estado={r.estado} />,
    },
  ];
}

/* ---------- Filtros Header ---------- */
interface Filters {
  flow: string;        // texto libre -> filtra por columna "Flujo"
  pedido: string;      // texto
  estado: string;      // "", "Procesando", "Finalizada", "Rechazada"
  creacionSort: string; // "", "asc", "desc"
}

const getFiltersConfig = (f: Filters) => {
  return [
    {
      id: "flow",
      label: "Flujo",
      type: "text" as const,   // <-- ahora es input de texto
      value: f.flow,
      placeholder: "Buscar por flujo…",
    },
    {
      id: "pedido",
      label: "Pedido",
      type: "text" as const,
      value: f.pedido,
    },
    {
      id: "estado",
      label: "Estado",
      type: "select" as const,
      value: f.estado,
      options: [
        { label: "Todos", value: "" },
        { label: "Procesando", value: "Procesando" },
        { label: "Finalizada", value: "Finalizada" },
        { label: "Rechazada", value: "Rechazada" },
      ],
    },
    {
      id: "creacionSort",
      label: "Creación",
      type: "select" as const,
      value: f.creacionSort,
      options: [
        { label: "—", value: "" },
        { label: "Más antiguas primero", value: "asc" },
        { label: "Más recientes primero", value: "desc" },
      ],
    },
  ];
};

/* ---------- Página ---------- */
export default function SolicitudesRmsView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(), []);

  // tabla
  const [rows, setRows] = useState<SolicitudRow[]>([]);
  const [loading, setLoading] = useState(true);

  // paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // filtros
  const [filters, setFilters] = useState<Filters>({
    flow: "",
    pedido: "",
    estado: "",
    creacionSort: "desc",
  });

  // cargar listado principal (mock con shape igual al de la UI)
  const fetchList = useCallback(async () => {
    setLoading(true);

    const base: SolicitudRow[] = [
      {
        id: 1,
        flow: "Reposición de producto sin devolución previa - Tienda",
        pedido: "1375970523876-01",
        clienteNombre: "Tomas Canales",
        clienteEmail: "tomas.canales@janis.im",
        creacion: "13/11/2023 11:08",
        usuarioCreadorNombre: "Tomas Canales",
        usuarioCreadorEmail: "tomas.canales@janis.im",
        estado: "Procesando",
      },
      {
        id: 2,
        flow: "Devolución de dinero - Tienda",
        pedido: "1375340523874-01",
        clienteNombre: "Luis Andrade",
        clienteEmail: "luis.andrade@janis.im",
        creacion: "12/11/2023 21:29",
        usuarioCreadorNombre: "Luis Andrade",
        usuarioCreadorEmail: "luis.andrade@janis.im",
        estado: "Finalizada",
      },
      {
        id: 3,
        flow: "Reposición de producto sin devolución previa - Tienda",
        pedido: "1375040523860-01",
        clienteNombre: "Tomas Canales",
        clienteEmail: "tomas.canales@janis.im",
        creacion: "09/11/2023 13:06",
        usuarioCreadorNombre: "Tomas Canales",
        usuarioCreadorEmail: "tomas.canales@janis.im",
        estado: "Procesando",
      },
      {
        id: 4,
        flow: "Devolución de dinero - Tienda",
        pedido: "1374280523828-01",
        clienteNombre: "Mauricio Oruezabal",
        clienteEmail: "mauricio.oruezabal@fizzmod.com",
        creacion: "09/11/2023 12:13",
        usuarioCreadorNombre: "Tomas Canales",
        usuarioCreadorEmail: "tomas.canales@janis.im",
        estado: "Finalizada",
      },
      {
        id: 5,
        flow: "Devolución de dinero - Tienda",
        pedido: "1374280523828-01",
        clienteNombre: "Mauricio Oruezabal",
        clienteEmail: "mauricio.oruezabal@fizzmod.com",
        creacion: "08/11/2023 17:58",
        usuarioCreadorNombre: "Tomas Canales",
        usuarioCreadorEmail: "tomas.canales@janis.im",
        estado: "Rechazada",
      },
    ];

    // Filtro local (ahora 'flow' es texto: incluye si matchea en la columna Flujo)
    const filtered = base
      .filter((r) =>
        filters.flow ? r.flow.toLowerCase().includes(filters.flow.toLowerCase()) : true
      )
      .filter((r) => (filters.pedido ? r.pedido.toLowerCase().includes(filters.pedido.toLowerCase()) : true))
      .filter((r) => (filters.estado ? r.estado === (filters.estado as Estado) : true))
      .sort((a, b) => {
        if (!filters.creacionSort) return 0;
        const parse = (s: string) => {
          const [d, m, rest] = s.split("/");
          const [yy, hhmm] = rest.split(" ");
          return new Date(`${yy}-${m}-${d}T${hhmm}:00`).getTime();
        };
        const da = parse(a.creacion);
        const db = parse(b.creacion);
        return filters.creacionSort === "asc" ? da - db : db - da;
      });

    const total = filtered.length;
    const start = (currentPage - 1) * PER_PAGE;
    const pageRows = filtered.slice(start, start + PER_PAGE);

    setRows(pageRows);
    setTotalRecords(total);
    setTotalPages(Math.max(1, Math.ceil(total / PER_PAGE)));
    setLoading(false);
  }, [filters.flow, filters.pedido, filters.estado, filters.creacionSort, currentPage]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* acciones header */
  const handleExport = useCallback(() => {
    const headers = ["Flujo", "Pedido", "Cliente", "Email Cliente", "Creación", "Usuario Creador", "Email Creador", "Estado"];
    const data = rows.map((r) => [
      r.flow,
      r.pedido,
      r.clienteNombre,
      r.clienteEmail,
      r.creacion,
      r.usuarioCreadorNombre,
      r.usuarioCreadorEmail,
      r.estado,
    ]);
    exportToCsv("solicitudes-rms.csv", [headers, ...data]);
  }, [rows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/customers/logistica/solicitudes/nuevo"),
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
        onClick: () => fetchList(),
        icon: <ArrowPathIcon className="h-5 w-5" />,
      },
    ],
    [router, handleExport, fetchList]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Solicitudes"
        action={headerActions}
        filters={getFiltersConfig(filters)}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          setFilters((prev) => ({ ...prev, [id]: value as any }));
        }}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <p>Cargando solicitudes…</p>
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              dataType="SolicitudesRms"
              statusKey="estado"
              rowPaddingY={24}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: SolicitudRow) => router.push(`/customers/logistica/solicitudes/${row.id}`)}
            />
          )}

          <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={PER_PAGE}
              onPageChange={setCurrentPage}
            />
        </div>
      </div>
    </div>
  );
}
