// app/customers/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { customersAllPaged } from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { Pagination } from "@/components/ui/pagination";
import { type Estado, getEstadoColor } from "@/utils/status";

// hook de debounce (inline para no crear archivo)
function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ---------- Tipos API ---------- */
type ApiCustomer = {
  Id: string;
  PartnerType: string; // "C" | "P" | ...
  RUT?: string | null;
  FirstName?: string | null;
  LastName?: string | null;
  Email?: string | null;
  Phone?: string | null;
  Country?: string | null;
  IsActive: boolean;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
};

type ApiListResponse = {
  items: ApiCustomer[];
  total: number;
};

/* ---------- Tipos UI ---------- */
interface CustomerRow {
  id: string;
  docId: string; // RUT o ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: Estado;
  partnerType: string; // "C" | "P"
  createdAt: string;
  updatedAt: string;
}

/* ---------- Helpers UI ---------- */
const PER_PAGE = 10;
const getStatusColor = getEstadoColor;
const Pill = ({ text }: { text: string }) => (
  <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
    {text}
  </span>
);

/* ---------- Columnas (paridad de estilo con SalesChannels) ---------- */
function getColumns(): Column<CustomerRow>[] {
  return [
    {
      header: "Documento",
      accessorKey: "docId",
      cell: (r) => (
        <CopyableText text={r.docId} className="break-all">{r.docId}</CopyableText>
      ),
    },
    { header: "Nombre", accessorKey: "firstName" },
    { header: "Apellido", accessorKey: "lastName" },
    { header: "Email", accessorKey: "email", cell: (r) => <span className="break-all">{r.email}</span> },
    {
      header: "Teléfono",
      accessorKey: "phone",
      cell: (r) =>
        r.phone && r.phone.trim() !== "" ? (
          <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
            {r.phone}
          </span>
        ) : (
          <span>-</span>
        ),
    },
    // {
    //   header: "Tipo",
    //   accessorKey: "partnerType",
    //   cell: (r) => <Pill text={r.partnerType || "—"} />,
    // },
    {
      header: "Creado",
      accessorKey: "createdAt",
    },
    {
      header: "Actualizado",
      accessorKey: "updatedAt",
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (r) => (
        <div
          className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
            r.status
          )}`}
        >
          {r.status}
        </div>
      ),
    },
  ];
}

/* ---------- Filtros Header ---------- */
interface Filters {
  search: string;
  rut: string;
  isActive: string; // "", "1", "0"
  partnerType: string; // "", "C", "P"
}

const getFiltersConfig = (f: Filters) => [
  {
    id: "search",
    label: "Buscar",
    type: "text" as const,
    value: f.search,
  },
  {
    id: "rut",
    label: "RUT",
    type: "text" as const,
    value: f.rut,
    placeholder: "12345678-9",
  },
  {
    id: "isActive",
    label: "Estado",
    type: "select" as const,
    value: f.isActive,
    options: [
      { label: "Todos", value: "" },
      { label: "Activo", value: "1" },
      { label: "Inactivo", value: "0" },
    ],
  },
  // {
  //   id: "partnerType",
  //   label: "Tipo",
  //   type: "select" as const,
  //   value: f.partnerType,
  //   options: [
  //     { label: "Todos", value: "" },
  //     { label: "Cliente (C)", value: "C" },
  //     { label: "Proveedor (P)", value: "P" },
  //   ],
  // },
];

/* ---------- Página (View) ---------- */
export default function CustomersView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(), []);

  // tabla
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  // errores 
  const [error, setError] = useState<string | null>(null);

  // paginación local (la API devuelve todo)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // filtros
  const [filters, setFilters] = useState<Filters>({
    search: "",
    rut: "",
    isActive: "",
    partnerType: "C",
  });
  const qRaw = filters.search.trim();
  const qDebounced = useDebounced(qRaw, 300); // evita spam de requests
  const rutRaw = filters.rut.trim();
  const rutDebounced = useDebounced(rutRaw, 300);

  const hasActiveFilters = filters.search !== "" || filters.rut !== "" || filters.isActive !== "";

  const handleClearFilters = useCallback(() => {
    setCurrentPage(1);
    setFilters({ search: "", rut: "", isActive: "", partnerType: "C" });
  }, []);

  // cargar listado principal (server-side paging con /customers)
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rut = (rutDebounced || "").trim();
      const q = (qDebounced || "").trim();

      // búsqueda general va al backend; RUT se filtra en cliente
      const { items, total } = await customersAllPaged({
        q: q || undefined,
        page: currentPage,
        pageSize: PER_PAGE,
        partnerType: "C",
      });

      // mapeo a filas UI
      const mapped: CustomerRow[] = (items || []).map((it: any) => ({
        id: it.Id,
        docId: it.RUT || it.Id,
        firstName: it.FirstName || "",
        lastName: it.LastName || "",
        email: it.Email || "",
        phone: it.Phone || "",
        partnerType: it.PartnerType || "",
        status: it.IsActive ? "Activo" : "Inactivo",
        createdAt: it.CreatedAt ? new Date(it.CreatedAt).toLocaleString("es-CL") : "—",
        updatedAt: it.UpdatedAt ? new Date(it.UpdatedAt).toLocaleString("es-CL") : "—",
      }));

      // filtros en cliente: RUT y Estado
      const pageFiltered = mapped.filter((r) => {
        // filtrar por RUT (coincidencia parcial, sin distinguir may/min)
        if (rut !== "" && !r.docId.toLowerCase().includes(rut.toLowerCase())) return false;
        // filtrar por estado
        if (filters.isActive === "1" && r.status !== "Activo") return false;
        if (filters.isActive === "0" && r.status !== "Inactivo") return false;
        return true;
      });

      setRows(pageFiltered);
      setTotalRecords(total || pageFiltered.length);
      setTotalPages(Math.max(1, Math.ceil((total || pageFiltered.length) / PER_PAGE)));
    } catch (err: any) {
      console.error("Error listando clientes:", err);
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
      setError(`Error al cargar clientes: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [qDebounced, rutDebounced, filters.isActive, filters.partnerType, currentPage]);


  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* acciones header */
  const handleExport = useCallback(() => {
    const headers = [
      "ID",
      "Documento",
      "Nombre",
      "Apellido",
      "Email",
      "Teléfono",
      // "Tipo",
      "Estado",
      "Creado",
      "Actualizado",
    ];
    const data = rows.map((r) => [
      r.id,
      r.docId,
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      r.partnerType,
      r.status,
      r.createdAt,
      r.updatedAt,
    ]);
    exportToCsv("clientes.csv", [headers, ...data]);
  }, [rows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/customers/clientes/nuevo"),
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
        onClick: () => {
          setCurrentPage(1);
          fetchList();
        },
        icon: <ArrowPathIcon className="h-5 w-5" />,
      },
    ],
    [router, handleExport, fetchList]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        /* mismos props/estilo que la referencia de SalesChannels */
        sticky
        stickyTop={0}
        title="Clientes"
        action={headerActions}
        filters={getFiltersConfig(filters)}
        onFilterChange={(id, value) => {
          // Reinicia a la primera página cuando cambian filtros
          setCurrentPage(1);
          setFilters((prev) => ({ ...prev, [id]: value }));
        }}
        filterTitle
        filtersRight={
          <ClearFiltersButton onClick={handleClearFilters} disabled={!hasActiveFilters} />
        }
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl shadow-sm">
            {loading ? (
              <div className="bg-white">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                        Cargando…
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : error ? (
              <div
                className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-sm"
                role="alert"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon
                      className="h-5 w-5 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Error al cargar datos</h3>
                    <p className="mt-2 text-sm">{error}</p>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage(1);
                            fetchList();
                          }}
                          className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                        >
                          Reintentar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <DataTable
                data={rows}
                columns={columns}
                dataType="General2"
                statusKey="status"
                rowPaddingY={12}
                showStatusBorder
                rowBgClass="bg-white"
                onRowClick={(row: CustomerRow) =>
                  router.push(`/customers/clientes/${row.id}`)
                }
              />
            )}
          </div>

          {/* Paginación (mismo patrón visual que SalesChannels) */}
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
