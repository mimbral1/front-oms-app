"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
// import { mockControls } from "@/data/mocks/detalle-pedido";

interface Flow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  modifiedAt: string;
  creator: { initials: string; name: string; email: string };
  user: { initials: string; name: string; email: string };
}

interface FlowFilters {
  name: string;
  status: string;
  createdAtRange: string;  // JSON DateRange | ""
  modifiedAtRange: string; // JSON DateRange | ""
}

const MOCK_FLOW: Flow[] = [
  {
    id: "FLW-001",
    name: "Reposición de un producto con devolución en simultaneo - DOMICILIO",
    status: "Active",
    createdAt: "26/03/2025 13:40",
    modifiedAt: "26/03/2025 13:40",
    creator: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
    user: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
  },
  {
    id: "FLW-002",
    name: "Devolución del producto con membriño del dinero - HOME",
    status: "Active",
    createdAt: "26/03/2025 13:13",
    modifiedAt: "26/03/2025 13:13",
    creator: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
    user: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
  },
  {
    id: "FLW-003",
    name: "Devolución en tienda",
    status: "Active",
    createdAt: "17/02/2025 11:18",
    modifiedAt: "17/02/2025 11:18",
    creator: {
      initials: "LG",
      name: "Leonardo Gam...",
      email: "leonardo.gambin@...",
    },
    user: {
      initials: "LG",
      name: "Leonardo Gam...",
      email: "leonardo.gambin@...",
    },
  },
  {
    id: "FLW-004",
    name: "Falta de Producto (entrega)",
    status: "Active",
    createdAt: "16/08/2024 14:27",
    modifiedAt: "16/08/2024 14:27",
    creator: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
    user: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
  },
  {
    id: "FLW-005",
    name: "Reposición de producto CON devolución previa - TIENDA",
    status: "Active",
    createdAt: "06/08/2024 09:22",
    modifiedAt: "22/08/2024 11:24",
    creator: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
    user: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
  },
  {
    id: "FLW-006",
    name: "Reposición de producto CON devolución previa DOMICILIO",
    status: "Active",
    createdAt: "06/07/2024 13:21",
    modifiedAt: "05/03/2025 12:23",
    creator: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
    user: {
      initials: "LG",
      name: "Leonardo Gam...",
      email: "leonardo.gambin@...",
    },
  },
  {
    id: "FLW-007",
    name: "Devolucion de dinero",
    status: "Active",
    createdAt: "07/02/2024 09:49",
    modifiedAt: "16/08/2024 14:26",
    creator: {
      initials: "TC",
      name: "Tomas Canales",
      email: "tomas.canales@...",
    },
    user: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
  },
  {
    id: "FLW-008",
    name: "Reposición de producto S/N devolución previa DOMICILIO",
    status: "Active",
    createdAt: "07/09/2023 15:31",
    modifiedAt: "16/08/2024 14:26",
    creator: {
      initials: "TC",
      name: "Tomas Canales",
      email: "tomas.canales@...",
    },
    user: {
      initials: "AM",
      name: "Ariel Mikowski",
      email: "ariel.mikowski@...",
    },
  },
];

const format = (s: string) => s;

const getStatusColor = (s: string) =>
  s === "Active" ? "bg-green-500" : "bg-gray-400";

function getColumns(router: ReturnType<typeof useRouter>): Column<Flow>[] {
  return [
    {
      header: "Nombre",
      accessorKey: "name",
      cell: (r) => (
        <span
          onClick={() => router.push(`/customers/logistica/flujos/${r.id}`)}
        >
          {r.name}
        </span>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (r) => (
        <span
          className={`inline-block rounded-full px-4 py-1 text-sm font-medium text-white ${getStatusColor(
            r.status
          )}`}
        >
          {r.status === "Active" ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      header: "Creación",
      accessorKey: "createdAt",
      cell: (r) => format(r.createdAt),
    },
    {
      header: "Modificado",
      accessorKey: "modifiedAt",
      cell: (r) => format(r.modifiedAt),
    },
    {
      header: "Usuario creador",
      accessorKey: "creator",
      cell: (r) => <UserChip {...r.creator} />,
    },
    {
      header: "Usuario",
      accessorKey: "user",
      cell: (r) => <UserChip {...r.user} />,
    },
  ];
}

function UserChip({
  initials,
  name,
  email,
}: {
  initials: string;
  name: string;
  email: string;
}) {
  return (
    <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
        {initials}
      </div>
      <div className="flex flex-col overflow-hidden text-left">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="truncate text-xs text-gray-500">{email}</span>
      </div>
    </div>
  );
}

const getFlowFilters = (f: FlowFilters) => [
  {
    id: "name",
    label: "Nombre",
    type: "text" as const,
    value: f.name,
  },
  {
    id: "status",
    label: "Estado",
    type: "select" as const,
    value: f.status,
    options: [
      { label: "Todos", value: "" },
      { label: "Activo", value: "Active" },
      { label: "Inactivo", value: "Inactive" },
    ],
  },
  {
    id: "createdAtRange",
    label: "Fecha de creación",
    type: "date-range" as const,
    value: f.createdAtRange,
  },
  {
    id: "modifiedAtRange",
    label: "Fecha de modificación",
    type: "date-range" as const,
    value: f.modifiedAtRange,
  },
];

/* ---------- página ---------- */
export function FlowBrowseView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(router), [router]);

  const [rows] = useState<Flow[]>(MOCK_FLOW);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<FlowFilters>({
    name: "",
    status: "",
    createdAtRange: "",
    modifiedAtRange: "",
  });

  /* helper para parsear rango de JSON */
  const parseRange = (json: string) => {
    if (!json) return { from: null, to: null };
    try {
      const r = JSON.parse(json);
      return { from: r.start ? new Date(r.start) : null, to: r.end ? new Date(r.end + "T23:59:59") : null };
    } catch { return { from: null, to: null }; }
  };

  /* filtrado */
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const createdAt = new Date(r.createdAt);
        const modifiedAt = new Date(r.modifiedAt);
        const cr = parseRange(filters.createdAtRange);
        const mr = parseRange(filters.modifiedAtRange);

        const matchesName =
          !filters.name ||
          r.name.toLowerCase().includes(filters.name.toLowerCase());
        const matchesStatus = !filters.status || r.status === filters.status;
        const matchesCreatedAt =
          (!cr.from || createdAt >= cr.from) &&
          (!cr.to || createdAt <= cr.to);
        const matchesModifiedAt =
          (!mr.from || modifiedAt >= mr.from) &&
          (!mr.to || modifiedAt <= mr.to);

        return (
          matchesName &&
          matchesStatus &&
          matchesCreatedAt &&
          matchesModifiedAt
        );
      }),
    [rows, filters]
  );

  /* paginación */
  const PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* export CSV */
  const handleExport = () => {
    const headers = [
      "ID",
      "Nombre",
      "Estado",
      "Creación",
      "Modificado",
      "Nombre creador",
      "Email creador",
      "Nombre usuario",
      "Email usuario",
    ];
    const data = filtered.map((r) => [
      r.id,
      r.name,
      r.status,
      r.createdAt,
      r.modifiedAt,
      r.creator.name,
      r.creator.email,
      r.user.name,
      r.user.email,
    ]);
    exportToCsv("flows.csv", [headers, ...data]);
  };

  /* acciones header */
  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push("/customers/logistica/flujos/nuevo"),
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Flujo de RMA"
        action={headerActions}
        filters={getFlowFilters(filters)}
        onFilterChange={(id, value) =>
          setFilters((prev) => ({ ...prev, [id]: value }))
        }
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <DataTable
            data={pageRows}
            columns={columns}
            dataType="General"
            statusKey="status"
            rowPaddingY={8}
            showStatusBorder
            rowBgClass="bg-white"
          />
          <Pagination
            currentPage={page}
            totalRecords={filtered.length}
            pageSize={PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
