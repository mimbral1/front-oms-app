"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";

import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/badge/status";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { exportToCsv } from "@/components/presets/export/export";

export interface AuditType {
  id: string;
  name: string;
  restrictions: string | "-";
  createdAt: string; // dd/mm/yyyy hh:mm
  modifiedAt: string | "-";
  creator: { name: string; email: string };
  user: { name: string; email: string };
  status: "Active" | "Inactive";
}

const mockTypes: AuditType[] = [
  {
    id: "T-001",
    name: "Operación",
    restrictions: "-",
    createdAt: "16/12/2021 12:20",
    modifiedAt: "-",
    creator: { name: "Luis Jara", email: "Luis@gmail.com" },
    user: { name: "Americo", email: "Americo@gmail.com" },
    status: "Active",
  },
];

const statusVariant = (s: AuditType["status"]) =>
  s === "Active" ? "success" : "warning";

const dotColor = (s: AuditType["status"]) =>
  s === "Active" ? "bg-green-500" : "bg-gray-400";

export function AuditTypesBrowse() {
  const router = useRouter();

  const [filters, setFilters] = useState({
    name: "",
    status: "",
  });

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        icon: <PlusIcon className="h-5 w-5" />,
        onClick: () => router.push("/pedidos/auditorias/tipos/nuevo"),
      },
      {
        label: "Actualizar",
        variant: "secondary",
        icon: <ArrowPathIcon className="h-5 w-5" />,
        onClick: () => console.log("refresh"),
      },
      {
        label: "Exportar",
        variant: "secondary",
        icon: <ArrowPathIcon className="h-5 w-5 rotate-90" />, // usa tu ícono
        onClick: handleExport,
      },
    ],
    [router]
  );

  const columns: Column<AuditType>[] = [
    {
      header: "Nombre",
      accessorKey: "name",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColor(r.status)}`} />
          <a
            onClick={() => router.push(`/pedidos/auditorias/tipos/${r.id}`)}
            className="text-blue-700 hover:underline cursor-pointer text-sm font-medium"
          >
            {r.name}
          </a>
        </div>
      ),
    },
    { accessorKey: "restrictions", header: "Restricciones" },
    {
      accessorKey: "createdAt",
      header: "Creación",
      cell: (r) => <span className="text-sm">{r.createdAt}</span>,
    },
    {
      accessorKey: "modifiedAt",
      header: "Modificado",
      cell: (r) => <span className="text-sm">{r.modifiedAt}</span>,
    },
    {
      header: "Usuario creador",
      accessorKey: "creator",
      cell: (r) => (
        <div className="flex items-center gap-2 text-sm">
          <Avatar name={r.creator.name} />
          <div className="flex flex-col">
            <span className="font-medium truncate max-w-[120px]">
              {r.creator.name}
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {r.creator.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Usuario",
      accessorKey: "user",
      cell: (r) => (
        <div className="flex items-center gap-2 text-sm">
          <Avatar name={r.user.name} />
          <div className="flex flex-col">
            <span className="font-medium truncate max-w-[120px]">
              {r.user.name}
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {r.user.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge status={r.status} variant={statusVariant(r.status)} />
      ),
    },
  ];

  const filtered = mockTypes.filter(
    (t) =>
      (!filters.name ||
        t.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.status || t.status === filters.status)
  );

  const [page, setPage] = useState(1);
  const PER_PAGE = 60;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleExport() {
    const headers = [
      "Name",
      "Restrictions",
      "Created",
      "Modified",
      "Creator",
      "Creator-email",
      "User",
      "User-email",
      "Status",
    ];
    const rows = filtered.map((t) => [
      t.name,
      t.restrictions,
      t.createdAt,
      t.modifiedAt,
      t.creator.name,
      t.creator.email,
      t.user.name,
      t.user.email,
      t.status,
    ]);
    exportToCsv("audit_types.csv", [headers, ...rows]);
  }

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Tipos de auditoría"
        filters={[
          {
            id: "name",
            label: "Nombre",
            type: "text",
            value: filters.name,
          },
          {
            id: "status",
            label: "Status",
            type: "select",
            value: filters.status,
            options: [
              { label: "Status", value: "" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ],
          },
        ]}
        onFilterChange={(id, value) =>
          setFilters((p) => ({ ...p, [id]: value }))
        }
        action={headerActions}
      />

      <div className="p-6 flex-1">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <DataTable
            data={shown}
            columns={columns}
            rowPaddingY={24}
            rowBgClass="bg-white"
            showStatusBorder={true}
            dataType="General"
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          {filtered.length > PER_PAGE && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
          <span className="text-sm text-gray-500">
            {filtered.length} resultado{filtered.length !== 1 && "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
