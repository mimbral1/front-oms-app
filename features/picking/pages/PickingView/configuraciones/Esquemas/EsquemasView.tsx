/* ------------------------------------------------------------------
	app/picking/configuraciones/multipicking/esquemas/page.tsx
-------------------------------------------------------------------*/
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/badge/status";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { exportToCsv } from "@/components/presets/export/export";

/* ─────────────────────────────
	1. Tipos y mocks
   ───────────────────────────── */
export interface Scheme {
  id: string;
  name: string;
  window: number; // minutos
  status: "Active" | "Inactive";
  createdAt: string;
  creator: { name: string; email: string };
  modifiedAt: string;
  user: string;
}

const mockSchemes: Scheme[] = [
  {
    id: "S‑001",
    name: "Oferta Turbo",
    window: 84,
    status: "Active",
    createdAt: "14/02/2025 16:49",
    creator: { name: "Lucía Fernández", email: "lucia.fernandez@janis.com" },
    modifiedAt: "14/02/2025 10:49",
    user: "admin",
  },
  {
    id: "S‑002",
    name: "Shopify Express",
    window: 7,
    status: "Active",
    createdAt: "12/11/2023 20:20",
    creator: { name: "Tomás Herrera", email: "tomas.herrera@janis.com" },
    modifiedAt: "12/11/2023 20:20",
    user: "admin",
  },
  {
    id: "S‑003",
    name: "Plan de Inicio",
    window: 21,
    status: "Active",
    createdAt: "14/06/2022 17:25",
    creator: { name: "Valentina Ruiz", email: "valentina.ruiz@janis.com" },
    modifiedAt: "31/05/2024 12:56",
    user: "admin",
  },
];

/* ─────────────────────────────
	2. Helpers UI
   ───────────────────────────── */
const statusVariant = (s: Scheme["status"]) =>
  s === "Active" ? "success" : "error";

/* ─────────────────────────────
	3. Tabla
   ───────────────────────────── */
const getColumns = (router: ReturnType<typeof useRouter>): Column<Scheme>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: (r) => (
      <a
        onClick={() =>
          router.push(
            `/picking/configuraciones/multipicking/esquemas/${encodeURIComponent(
              r.id
            )}`
          )
        }
        className="cursor-pointer text-blue-600 hover:underline"
      >
        {r.name}
      </a>
    ),
  },
  {
    accessorKey: "window",
    header: "Ventana",
    cell: (r) => <span>{r.window}</span>,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: (r) => (
      <StatusBadge status={r.status} variant={statusVariant(r.status)} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de creación",
    cell: (r) => r.createdAt,
  },
  {
    accessorKey: "creator",
    header: "Usuario creador",
    cell: (r) => (
      <div className="flex items-center gap-2">
        <Avatar name={r.creator.name} />
        <span className="truncate max-w-[120px] text-sm">{r.creator.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "modifiedAt",
    header: "Modificado",
    cell: (r) => r.modifiedAt,
  },
  {
    accessorKey: "user",
    header: "Usuario",
    cell: (r) => r.user,
  },
];

/* ─────────────────────────────
	4. Vista principal
   ───────────────────────────── */
const PER_PAGE = 10;

export function SchemesBrowseView() {
  const router = useRouter();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => setSchemes(mockSchemes), []);

  /* ------------ header actions ---------- */
  const headerActions: Action[] = [
    {
      label: "Nuevo",
      variant: "success",
      icon: <PlusIcon className="h-5 w-5" />,
      onClick: () =>
        router.push("/picking/configuraciones/multipicking/esquemas/nuevo"),
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
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      onClick: () => {
        const headers = [
          "ID",
          "Nombre",
          "Ventana",
          "Estado",
          "Creado",
          "Creador",
          "Modificado",
        ];
        const rows = schemes.map((s) => [
          s.id,
          s.name,
          s.window.toString(),
          s.status,
          s.createdAt,
          s.creator.name,
          s.modifiedAt,
        ]);
        exportToCsv("schemes.csv", [headers, ...rows]);
      },
    },
  ];

  /* ------------ paginación ---------- */
  const totalPages = Math.max(1, Math.ceil(schemes.length / PER_PAGE));
  const shown = schemes.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* ------------ render ---------- */
  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader title="Esquemas" action={headerActions} />

      <div className="p-6 flex-1">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <DataTable
            data={shown}
            columns={getColumns(router)}
            rowPaddingY={20}
            rowBgClass="bg-white"
            showStatusBorder={false}
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          <span className="text-sm text-gray-500">
            {schemes.length} resultado{schemes.length !== 1 && "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
