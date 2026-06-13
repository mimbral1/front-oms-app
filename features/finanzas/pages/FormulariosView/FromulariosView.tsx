// app/views/Formularios/FormsBrowseView.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";

/* ---------- types ---------- */
interface FormRow {
  id: string;
  index: string;
  value: string;
  itemsQuantity: number;
  createdAt: string;
  modifiedAt: string;
  user: { initials: string; name: string; email: string };
  status: "Pendiente" | "Facturado" | "Cancelado";
}

/* ---------- mock data ---------- */
const MOCK_FORMS: FormRow[] = [
  {
    id: "1429460507059-01-A",
    index: "001",
    value: "108,00 ARS",
    itemsQuantity: 3,
    createdAt: "02/05/2024 15:37",
    modifiedAt: "02/05/2024 15:37",
    user: {
      initials: "LG",
      name: "Laura García",
      email: "laura.garcia@example.com",
    },
    status: "Pendiente",
  },
  {
    id: "1429460507059-01",
    index: "001",
    value: "250,00 ARS",
    itemsQuantity: 1,
    createdAt: "02/05/2024 15:35",
    modifiedAt: "02/05/2024 15:35",
    user: {
      initials: "MG",
      name: "María González",
      email: "maria.gonzalez@example.com",
    },
    status: "Pendiente",
  },
  // …add more rows as needed…
];

/* ---------- filters ---------- */
interface FormFilters {
  idPedido: string;
  indice: string;
  estado: string;
}
function getFormFilters(f: FormFilters) {
  return [
    {
      id: "idPedido",
      label: "ID Pedido",
      type: "text" as const,
      value: f.idPedido,
    },
    {
      id: "indice",
      label: "Índice",
      type: "text" as const,
      value: f.indice,
    },
    {
      id: "estado",
      label: "Estado",
      type: "select" as const,
      value: f.estado,
      options: [
        { label: "Todos", value: "" },
        { label: "Pendiente", value: "Pendiente" },
        { label: "Procesado", value: "Procesado" },
        { label: "Cancelado", value: "Cancelado" },
      ],
    },
  ];
}

/* ---------- columns ---------- */
function getColumns(router: ReturnType<typeof useRouter>): Column<FormRow>[] {
  return [
    {
      header: "ID Pedido",
      accessorKey: "id",
      cell: (r) => r.id,
    },
    {
      header: "Índice",
      accessorKey: "index",
      cell: (r) => r.index,
    },
    {
      header: "Valor",
      accessorKey: "value",
      cell: (r) => r.value,
    },
    {
      header: "Invoice form fields items quantity",
      accessorKey: "itemsQuantity",
      cell: (r) => (
        <span className="inline-block rounded-full border border-gray-300 px-3 py-1 text-sm">
          {r.itemsQuantity}
        </span>
      ),
    },
    {
      header: "Creación",
      accessorKey: "createdAt",
      cell: (r) => r.createdAt,
    },
    {
      header: "Modificado",
      accessorKey: "modifiedAt",
      cell: (r) => r.modifiedAt,
    },
    {
      header: "Usuario",
      accessorKey: "user",
      cell: (r) => (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border bg-white px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
            {r.user.initials}
          </div>
          <div className="flex flex-col overflow-hidden text-left">
            <span className="truncate text-sm font-medium">{r.user.name}</span>
            <span className="truncate text-xs text-gray-500">
              {r.user.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (r) => {
        // mapeo sencillo status → bg-class
        const bgColor =
          r.status === "Pendiente"
            ? "bg-yellow-500"
            : r.status === "Facturado"
            ? "bg-green-500"
            : "bg-gray-400";

        return (
          <span
            className={[
              "inline-block rounded-full px-4 py-1 text-sm font-medium text-white",
              bgColor,
            ].join(" ")}
          >
            {r.status}
          </span>
        );
      },
    },
  ];
}

/* ---------- page component ---------- */
export function FormsBrowseView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(router), [router]);

  const [rows] = useState<FormRow[]>(MOCK_FORMS);
  const [page, setPage] = useState(1);
  const PER_PAGE = 60;

  const [filters, setFilters] = useState<FormFilters>({
    idPedido: "",
    indice: "",
    estado: "",
  });

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filters.idPedido || r.id.includes(filters.idPedido)) &&
          (!filters.indice || r.index.includes(filters.indice)) &&
          (!filters.estado || r.status === filters.estado)
      ),
    [rows, filters]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    const headers = [
      "ID Pedido",
      "Índice",
      "Valor",
      "Cantidad ítems",
      "Creación",
      "Modificado",
      "Usuario",
      "Email",
      "Estado",
    ];
    const data = filtered.map((r) => [
      r.id,
      r.index,
      r.value,
      String(r.itemsQuantity),
      r.createdAt,
      r.modifiedAt,
      r.user.name,
      r.user.email,
      r.status,
    ]);
    exportToCsv("formularios.csv", [headers, ...data]);
  };

  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push("/Formularios/New"),
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
        title="Formularios"
        action={headerActions}
        filters={getFormFilters(filters)}
        onFilterChange={(id, v) => setFilters((prev) => ({ ...prev, [id]: v }))}
        filterTitle
      />

      <div className="flex-1 p-6">
        <DataTable
          data={pageRows}
          columns={columns}
          dataType="Formulario"
          statusKey="status"
          rowPaddingY={28}
          //showStatusBorder
          rowBgClass="bg-white"
        />

        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
            <p className="text-sm text-gray-500">
              {filtered.length} resultados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
