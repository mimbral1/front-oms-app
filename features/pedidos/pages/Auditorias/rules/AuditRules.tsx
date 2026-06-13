/* ------------------------------------------------------------------
   app/audit/rules/page.tsx   (audit rule browse)
-------------------------------------------------------------------*/
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge/status";

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
   1. Tipos y datos mock
   ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
export interface AuditRule {
  id: string;
  type: "OMS" | "WMS" | "ERP";
  stage: "New order" | "Picking" | "Packing" | "Shipping";
  isException: boolean;
  description: string;
  dateCreated: string; // dd/mm/yyyy hh:mm
  status: "Active" | "Inactive";
}

/*  🔵  Mocks  (reemplaza por fetch/tabla real) */
const mockRules: AuditRule[] = [
  {
    id: "R-001",
    type: "OMS",
    stage: "New order",
    isException: false,
    description: "Método de entrega",
    dateCreated: "28/06/2021 17:43",
    status: "Active",
  },
  {
    id: "R-002",
    type: "OMS",
    stage: "New order",
    isException: false,
    description: "Monto",
    dateCreated: "25/06/2021 20:47",
    status: "Active",
  },
];

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
   2. Helpers
   ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
const statusVariant = (s: AuditRule["status"]) =>
  s === "Active" ? "success" : "warning";

/* Badge “Yes / No” para la columna de excepción */
const exceptionPill = (is: boolean) =>
  `inline-block w-10 rounded-full border ${
    is
      ? "border-gray-300 bg-white text-gray-700"
      : "border-gray-300 bg-white text-gray-700"
  } text-center text-xs py-0.5`;

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
   3. Vista principal
   ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
export function AuditRulesBrowse() {
  const router = useRouter();

  /* -------------- estado de filtros -------------- */
  const [filters, setFilters] = useState({
    type: "",
    stage: "",
    exception: "",
    status: "",
    dateFrom: "",
  });

  /* -------------- acciones del PageHeader -------- */
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Actualizar",
        variant: "secondary",
        onClick: () => {
          // refetch aquí
          console.log("refetch audit-rules");
        },
        icon: <ArrowPathIcon className="h-5 w-5" />,
      },
      {
        label: "New",
        variant: "primary",
        onClick: () => router.push("/audit/rules/new"),
        icon: <PlusIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );

  /* -------------- columnas para la DataTable ----- */
  const columns: Column<AuditRule>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: (r) => (
        <div className="flex items-center gap-2">
          {/* Barrita verde al costado */}
          <span className="text-sm font-medium text-gray-900">{r.type}</span>
        </div>
      ),
    },
    { accessorKey: "stage", header: "Stage" },
    {
      accessorKey: "isException",
      header: "Is an exception",
      cell: (r) => (
        <span className={exceptionPill(r.isException)}>
          {r.isException ? "Yes" : "No"}
        </span>
      ),
    },
    { accessorKey: "description", header: "Description" },
    {
      accessorKey: "dateCreated",
      header: "Date created",
      cell: (r) => <span className="text-sm">{r.dateCreated}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge status={r.status} variant={statusVariant(r.status)} />
      ),
    },
  ];

  /* -------------- render ------------------------- */
  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      {/* HEADER */}
      <PageHeader
        title="Audit rule browse"
        action={headerActions}
        filters={[
          {
            id: "type",
            label: "Type",
            type: "text",
            value: filters.type,
          },
          {
            id: "stage",
            label: "Stage",
            type: "text",
            value: filters.stage,
          },
          {
            id: "exception",
            label: "Is an exception",
            type: "select",
            value: filters.exception,
            options: [
              { label: "All", value: "" },
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          {
            id: "status",
            label: "Status",
            type: "select",
            value: filters.status,
            options: [
              { label: "All", value: "" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ],
          },
          {
            id: "dateFrom",
            label: "Date created day",
            type: "datetime",
            value: filters.dateFrom,
          },
        ]}
        onFilterChange={(id, value) =>
          setFilters((prev) => ({ ...prev, [id]: value }))
        }
      />

      {/* TABLA */}
      <div className="flex-1 p-6">
        <DataTable
          columns={columns}
          data={mockRules /* ↍ reemplaza por tus datos filtrados */}
          rowPaddingY={20}
          rowBgClass="bg-white"
          showStatusBorder={true}
          dataType="General"
        />
      </div>
    </div>
  );
}
