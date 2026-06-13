// app/views/Transacciones/TransactionsBrowseView.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";

const estadoToVariant: Record<
  string,
  "success" | "warning" | "error" | "info"
> = {
  Pendiente: "warning",
  Procesado: "success",
  Cancelado: "error",
};

/* ————————— Mapping semantic variant → Tailwind bg class ————————— */
const variantBg: Record<string, string> = {
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

/* ---------- tipos ---------- */
interface Transaction {
  id: string;
  number: string;
  creditNoteNumber: string;
  orderId: string;
  sequentialId: string;
  amount: number;
  type: string;
  reason: string;
  payment: string;
  createdAt: string;
  creator: { initials: string; name: string; email: string };
  status: string;
}

/* ---------- mocks (reemplaza por tu fetch) ---------- */
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    number: "54645",
    creditNoteNumber: "",
    orderId: "1432800525654-01",
    sequentialId: "525654",
    amount: 441.07,
    type: "full-invoice",
    reason: "Sale",
    payment: "",
    createdAt: "16/05/2024 13:09",
    creator: {
      initials: "AH",
      name: "Argenis Hernandez",
      email: "argenis.hernandez@example.com",
    },
    status: "Procesado",
  },
  {
    id: "2",
    number: "TEST0005",
    creditNoteNumber: "-506.1",
    orderId: "1432130525648-01",
    sequentialId: "525648",
    amount: -506.1,
    type: "partial-refund",
    reason: "Devolución • Reembolso de items",
    payment: "",
    createdAt: "13/05/2024 18:30",
    creator: {
      initials: "AH",
      name: "Argenis Hernandez",
      email: "argenis.hernandez@example.com",
    },
    status: "Procesado",
  },
  {
    id: "3",
    number: "525648",
    creditNoteNumber: "",
    orderId: "1432130525648-01",
    sequentialId: "525648",
    amount: 733.45,
    type: "full-invoice",
    reason: "Sale",
    payment: "",
    createdAt: "13/05/2024 18:23",
    creator: {
      initials: "AG",
      name: "Ale Gonzalez",
      email: "alejandro.gonzalez@example.com",
    },
    status: "Procesado",
  },
  {
    id: "4",
    number: "INV-2025-001",
    creditNoteNumber: "",
    orderId: "1432900525700-02",
    sequentialId: "570002",
    amount: 259.99,
    type: "full-invoice",
    reason: "Sale",
    payment: "Credit Card",
    createdAt: "18/05/2024 11:45",
    creator: {
      initials: "LR",
      name: "Laura Ruiz",
      email: "laura.ruiz@example.com",
    },
    status: "Pendiente",
  },
  {
    id: "5",
    number: "REF-2025-002",
    creditNoteNumber: "-120.50",
    orderId: "1432950525725-01",
    sequentialId: "572501",
    amount: -120.5,
    type: "partial-refund",
    reason: "Reembolso por defecto",
    payment: "Bank Transfer",
    createdAt: "19/05/2024 09:10",
    creator: {
      initials: "JM",
      name: "Juan Martínez",
      email: "juan.martinez@example.com",
    },
    status: "Cancelado",
  },
  // …añade más filas si lo necesitas…
];

/* ---------- filtros ---------- */
interface TxFilters {
  factura: string;
  notaCredito: string;
  orderId: string;
  sequentialId: string;
}

function getTxFilters(f: TxFilters) {
  return [
    {
      id: "factura",
      label: "Factura #",
      type: "text" as const,
      value: f.factura,
    },
    {
      id: "notaCredito",
      label: "Nota de crédito #",
      type: "text" as const,
      value: f.notaCredito,
    },
    {
      id: "orderId",
      label: "ID Pedido",
      type: "select" as const,
      value: f.orderId,
      options: [
        { label: "Todos", value: "" },
        ...Array.from(new Set(MOCK_TRANSACTIONS.map((t) => t.orderId))).map(
          (o) => ({ label: o, value: o })
        ),
      ],
    },
    {
      id: "sequentialId",
      label: "ID Secuencial",
      type: "select" as const,
      value: f.sequentialId,
      options: [
        { label: "Todos", value: "" },
        ...Array.from(
          new Set(MOCK_TRANSACTIONS.map((t) => t.sequentialId))
        ).map((s) => ({ label: s, value: s })),
      ],
    },
  ];
}

/* ---------- columnas ---------- */
function getColumns(
  router: ReturnType<typeof useRouter>
): Column<Transaction>[] {
  return [
    {
      header: "Número",
      accessorKey: "number",
      cell: (r) => (
        <span className="inline-flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
          {r.number}
        </span>
      ),
    },
    {
      header: "ID de pedido",
      accessorKey: "orderId",
      cell: (r) => (
        <div className="flex flex-col">
          <span>{r.orderId}</span>
          <span className="text-xs text-gray-500">{r.sequentialId}</span>
        </div>
      ),
    },
    {
      header: "Importe",
      accessorKey: "amount",
      cell: (r) => (
        <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium">
          {r.amount > 0 ? r.amount.toFixed(2) : r.amount.toFixed(2)}
        </span>
      ),
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: (r) => r.type,
    },
    {
      header: "Motivo",
      accessorKey: "reason",
      cell: (r) => r.reason,
    },
    {
      header: "Pago",
      accessorKey: "payment",
      cell: () => (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm">
          <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />—
        </span>
      ),
    },
    {
      header: "Creación",
      accessorKey: "createdAt",
      cell: (r) => r.createdAt,
    },
    {
      header: "Punto de venta",
      accessorKey: "id", // dummy
      cell: () => (
        <span className="inline-flex items-center gap-2 text-gray-700">
          <BuildingStorefrontIcon className="h-5 w-5" />
          <MapPinIcon className="h-5 w-5" />
        </span>
      ),
    },
    {
      header: "Usuario creador",
      accessorKey: "creator",
      cell: (r) => (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border bg-white px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
            {r.creator.initials}
          </div>
          <div className="flex flex-col overflow-hidden text-left">
            <span className="truncate text-sm font-medium">
              {r.creator.name}
            </span>
            <span className="truncate text-xs text-gray-500">
              {r.creator.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (r) => {
        // pick a semantic variant from the raw status
        const variant = estadoToVariant[r.status] ?? "info";
        // then lookup the correct bg-class
        const bg = variantBg[variant];
        return (
          <span
            className={[
              "inline-block rounded-full px-4 py-1 text-sm font-medium text-white",
              bg,
            ].join(" ")}
          >
            {r.status}
          </span>
        );
      },
    },
  ];
}

/* ---------- página ---------- */
export function TransactionsBrowseView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(router), [router]);

  const [rows] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [page, setPage] = useState(1);
  const PER_PAGE = 60;

  const [filters, setFilters] = useState<TxFilters>({
    factura: "",
    notaCredito: "",
    orderId: "",
    sequentialId: "",
  });

  const filtered = useMemo(
    () =>
      rows.filter(
        (t) =>
          (!filters.factura || t.number.includes(filters.factura)) &&
          (!filters.notaCredito ||
            t.creditNoteNumber.includes(filters.notaCredito)) &&
          (!filters.orderId || t.orderId === filters.orderId) &&
          (!filters.sequentialId || t.sequentialId === filters.sequentialId)
      ),
    [rows, filters]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    const headers = [
      "Número",
      "Nota de crédito",
      "ID Pedido",
      "ID Secuencial",
      "Importe",
      "Tipo",
      "Motivo",
      "Creación",
      "Usuario creador",
      "Email",
      "Estado",
    ];
    const data = filtered.map((t) => [
      t.number,
      t.creditNoteNumber,
      t.orderId,
      t.sequentialId,
      t.amount.toString(),
      t.type,
      t.reason,
      t.createdAt,
      t.creator.name,
      t.creator.email,
      t.status,
    ]);
    exportToCsv("transacciones.csv", [headers, ...data]);
  };

  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push("/Transacciones/New"),
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
        title="Transacciones"
        action={headerActions}
        filters={getTxFilters(filters)}
        onFilterChange={(id, v) => setFilters((prev) => ({ ...prev, [id]: v }))}
        filterTitle
      />

      <div className="flex-1 p-6">
        <DataTable
          data={pageRows}
          columns={columns}
          dataType="Finanza"
          statusKey="status"
          rowPaddingY={28}
          showStatusBorder
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
