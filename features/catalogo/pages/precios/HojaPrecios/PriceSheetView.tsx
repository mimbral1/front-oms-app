// app/views/Pricing/PriceSheet/Browse/PriceSheetBrowsePage.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { fmtDateTime } from "@/lib/format/date";
import { useFetchWithAuth } from "@/lib/http/client";
import { Pagination } from "@/components/ui/pagination";

/* ---------- tipos api ---------- */
interface PriceListAPIItem {
  ListNum?: number;
  ListName?: string;
  GroupCode?: number | null;
  UpdateDate?: string | null;
  CreateDate?: string | null;
  ValidFor?: "Y" | "N" | null;
  ValidFrom?: string | null;
  ValidTo?: string | null;
  CreatedByName?: string | null;
  CreatedByEmail?: string | null;
  UpdatedByName?: string | null;
  UpdatedByEmail?: string | null;
  CreatedById?: number | null;
  UpdatedById?: number | null;
}
interface PriceListsAPIResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: PriceListAPIItem[];
}

/* ---------- modelo vista ---------- */
interface PriceSheet {
  id: string;                // ListNum
  name: string;              // ListName
  reference: string;         // ListNum
  createDate: string;        // CreateDate
  updateDate: string;        // UpdateDate
  createdByName: string;     // CreatedByName
  updatedByName: string;     // UpdatedByName
  validFrom: string;         // ValidFrom
  validTo: string;           // ValidTo
  status: "Active" | "Inactive"; // from ValidFor
}

/* ---------- utils ---------- */
const formatDateTime = fmtDateTime;

const estadoTraducido = (status: PriceSheet["status"]) =>
  status === "Active" ? "Activo" : "Inactivo";

const getStatusColor = (status: PriceSheet["status"]) =>
  status === "Active" ? "bg-green-500" : "bg-gray-400";

/* ---------- columnas ---------- */
function getColumns(router: ReturnType<typeof useRouter>): Column<PriceSheet>[] {
  return [
    {
      header: "Name",
      accessorKey: "name",
    },
    { header: "Reference", accessorKey: "reference", cell: (r) => r.reference },
    {
      header: "Increment threshold",
      accessorKey: "validFrom",
      cell: () => (
        <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium">15%</span>
      ),
    },
    {
      header: "Decrement threshold",
      accessorKey: "validTo",
      cell: () => (
        <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium">15%</span>
      ),
    },
    { header: "Date modified", accessorKey: "updateDate", cell: (r) => r.updateDate || "-" },
    { header: "User modified", accessorKey: "updatedByName", cell: (r) => r.updatedByName || "" },
    {
      header: "Status",
      accessorKey: "status",
      cell: (r) => (
        <span className={`inline-block rounded-full px-4 py-1 text-sm font-medium text-white ${getStatusColor(r.status)}`}>
          {estadoTraducido(r.status)}
        </span>
      ),
    },
  ];
}

/* ---------- filtros ---------- */
interface SheetFilters {
  name: string;
  reference: string;
  salesChannels: string;
}
function getFilters(f: SheetFilters) {
  return [
    { id: "name", label: "Name", type: "text" as const, value: f.name },
    { id: "reference", label: "Reference", type: "text" as const, value: f.reference },
    {
      id: "salesChannels",
      label: "Sales channels",
      type: "select" as const,
      value: f.salesChannels,
      options: [{ label: "All", value: "" }],
    },
  ];
}

/* ---------- componente ---------- */
export function PriceSheetBrowseView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(router), [router]);

  const { fetchWithAuth, token } = useFetchWithAuth();

  const [rows, setRows] = useState<PriceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SheetFilters>({ name: "", reference: "", salesChannels: "" });

  // paginación (server-side)
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Helpers de paginación (evitan salirse de rango)
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  const mapItem = (it: PriceListAPIItem): PriceSheet => ({
    id: String(it.ListNum ?? crypto.randomUUID()),
    name: it.ListName ?? "",
    reference: String(it.ListNum ?? ""),
    createDate: formatDateTime(it.CreateDate),
    updateDate: formatDateTime(it.UpdateDate),
    createdByName: it.CreatedByName ?? "",
    updatedByName: it.UpdatedByName ?? "",
    validFrom: formatDateTime(it.ValidFrom),
    validTo: formatDateTime(it.ValidTo),
    status: (it.ValidFor === "Y" ? "Active" : "Inactive") as PriceSheet["status"],
  });

  const fetchSheets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));
      // (si el endpoint soporta filtros, se agregan aquí; por ahora filtramos client-side)

      const data = await fetchWithAuth<PriceListsAPIResponse>(`catalog/price-lists?${qs.toString()}`);
      const list = (data?.data ?? []).map(mapItem);
      setRows(list);
      setTotalRecords(data?.totalRecords ?? list.length);
    } catch (e: any) {
      setError(e?.message || "Error al cargar la hoja de precios");
      setRows([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [token, fetchWithAuth, page, pageSize]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  // filtro client-side (por nombre o referencia)
  const filtered = rows.filter(
    (r) =>
      (!filters.name || r.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.reference || r.reference.toLowerCase().includes(filters.reference.toLowerCase()))
  );

  // export csv (adaptado a nuevas columnas)
  const handleExport = () => {
    const headers = [
      "ID",
      "Nombre",
      "Referencia",
      "Fecha creación",
      "Fecha modificación",
      "Usuario creador",
      "Usuario modificador",
      "Válido desde",
      "Válido hasta",
      "Estado",
    ];
    const data = filtered.map((s) => [
      s.id,
      s.name,
      s.reference,
      s.createDate,
      s.updateDate,
      s.createdByName,
      s.updatedByName,
      s.validFrom,
      s.validTo,
      estadoTraducido(s.status),
    ]);
    exportToCsv("price_sheets.csv", [headers, ...data]);
  };

  // acciones header
  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push("/catalogo/precios/hoja-de-precios/nuevo"),
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
        sticky
        stickyTop={0}
        title="Price sheet browse"
        action={headerActions}
        filters={getFilters(filters)}
        onFilterChange={(id, v) => {
          setFilters((prev) => ({ ...prev, [id]: v }));
          setPage(1);
        }}
        filterTitle
      />

      <div className="flex-1 p-6">
        {error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            dataType="General"
            statusKey="status"
            rowPaddingY={12}
            showStatusBorder
            rowBgClass="bg-white"
            onRowClick={(row: PriceSheet) =>
              router.push(`/catalogo/precios/hoja-de-precios/${row.id}`)
            }
          />
        )}

        {/* paginación server-side */}
        <Pagination
          currentPage={page}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
