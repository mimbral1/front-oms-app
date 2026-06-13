/* ------------------------------------------------------------------
   app/pedidos/[id]/auditoria/page.tsx
-------------------------------------------------------------------*/
"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDownOnSquareIcon, CheckCircleIcon, MagnifyingGlassCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

import { DataTable, type Column } from "@/components/ui/table";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";

function DottedFlowIcon() {
  /* icono gris con 6 puntitos y líneas como en la UI original */
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-5 h-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <circle cx="4" cy="4" r="1.4" />
      <circle cx="16" cy="4" r="1.4" />
      <circle cx="4" cy="16" r="1.4" />
      <circle cx="16" cy="16" r="1.4" />
      <path d="M4 4 v12 M4 4 h12" />
    </svg>
  );
}

/* ────────────────────────────────────────────────
   1.  Tipos y mocks (puedes reemplazar por tu fetch)
   ──────────────────────────────────────────────── */
export interface AuditRow {
  id: string;
  reason: string;
  type: string;
  extraInfo: string;
  index: string;
  needApproval: boolean;
  actions?: never;
}

const mockAudits: AuditRow[] = [
  {
    id: "A-001",
    reason: "PrePicking",
    type: "Shipping has type",
    extraInfo: "express_delivery",
    index: "Loading error",
    needApproval: true,
  },
];
const timeline = [
  {
    label: "In audit",
    date: "12/01/2022 09:27",
    icon: <MagnifyingGlassCircleIcon className="w-6 h-6 text-white" />,
    bg: "bg-blue-600",
  },
  {
    label: "New",
    date: "12/01/2022 09:27",
    icon: <CheckCircleIcon className="w-5 h-5 text-white" />,
    bg: "bg-green-500",
  },
];
function Timeline() {
  const steps = [
    {
      label: "In audit",
      date: "12/01/2022 09:27",
      icon: <MagnifyingGlassCircleIcon className="w-6 h-6 text-white" />,
      bg: "bg-blue-600",
    },
    {
      label: "New",
      date: "12/01/2022 09:27",
      icon: <CheckCircleIcon className="w-5 h-5 text-white" />,
      bg: "bg-green-500",
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center mb-6">
        {/* icono */}
        <div className="w-6 h-6 mr-2 rounded-full bg-gray-200 flex items-center justify-center">
          <DottedFlowIcon />
        </div>

        {/* texto */}
        <span className="text-xs uppercase font-medium py-2 text-gray-400">
          In picking
        </span>
      </div>

      {/* Pasos activos */}
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-col items-center">
          {/* Línea verde solo para pasos activos */}
          {i !== 0 && <div className="w-px bg-green-500 flex-1" />}
          <div
            className={`w-9 h-9 flex items-center justify-center rounded-full ${s.bg}`}
          >
            {s.icon}
          </div>
          <div className="mt-1 mb-6 text-center">
            <span className="block text-sm font-medium text-gray-700">
              {s.label}
            </span>
            <span className="block text-xs text-gray-500">{s.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
/* ────────────────────────────────────────────────
   2.  Vista principal
   ──────────────────────────────────────────────── */
export function AuditView() {
  const { id } = useParams<{ id: string }>(); // id de pedido
  const router = useRouter();

  /* (En producción) llama a tu hook / fetch aquí  */
  const audits = mockAudits; // <- datos mock

  /* ─── Acciones del header ───────────────────── */
  const actions: Action[] = useMemo(
    () => [
      { label: "Aplicar", variant: "success", disabled: true, icon: <CheckCircleIcon className="h-5 w-5" /> },
      { label: "Guardar", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Volver al listado", variant: "secondary", onClick: () => router.push("/pedidos"), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    [router]
  );

  /* ─── PageHeader por contexto ───────────────── */
  usePageHeader(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            PEDIDOS
          </div>
          <div className="text-2xl font-semibold text-gray-900">PAL #${id ?? "ORD-XXXXXX"}</div>
        </div>
      ),
      action: actions,
      status: { text: "Audit", variant: "info" },
    }),
    [id, actions]
  );

  /* ─── Columnas de la tabla ───────────────────── */
  const columns: Column<AuditRow>[] = [
    {
      accessorKey: "reason",
      header: "Reason",
      cell: (row) => <span className="font-medium">{row.reason}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: (row) => row.type,
    },
    {
      accessorKey: "extraInfo",
      header: "Extra info",
      cell: (row) => row.extraInfo,
    },
    {
      accessorKey: "index",
      header: "Index",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-red-500">
          <XCircleIcon className="w-4 h-4" />
          {row.index}
        </span>
      ),
    },
    {
      accessorKey: "needApproval",
      header: "Need for approval",
      cell: (row) => (
        <span
          className={`px-3 py-0.5 rounded-full text-sm font-medium ${row.needApproval ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
        >
          {row.needApproval ? "Yes" : "No"}
        </span>
      ),
    },
    {
      accessorKey: "actions", // usas accessorKey en vez de id
      header: "",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => console.log("approve", row.id)}
            className="px-4 py-1 rounded-full bg-green-500 text-white text-sm"
          >
            Approve
          </button>
          <button
            onClick={() => console.log("reject", row.id)}
            className="px-4 py-1 rounded-full bg-red-500 text-white text-sm"
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  /* ─── Render ─────────────────────────────────── */
  return (
    <div className="pt-6 pr-6 bg-page-bg min-h-screen">
      {/* GRID: 260 px timeline | resto tabla */}
      <div className="grid grid-cols-[260px_1fr] ">
        <Timeline />
        <DataTable<AuditRow>
          data={mockAudits}
          columns={columns}
          rowBgClass="bg-white"
          rowPaddingY={24}
          showStatusBorder={false}
        />
      </div>
    </div>
  );
}
