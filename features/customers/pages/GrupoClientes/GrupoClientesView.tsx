// views\Customers\GrupoClientes\GrupoClientesView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { type Estado, getEstadoColor } from "@/utils/status";
// Ajusta el path según dónde ubiques este archivo.
// Si lo pones junto a ClientesView y usas relativo, sería similar a:
// import { customerGroupsAll } from "@/app/fetchWithAuth/api-clientes/grupo-clientes";
import { customerGroupsAll } from "@/app/fetchWithAuth/api-grupo-clientes/grupo-clientes";
import { Pagination } from "@/components/ui/pagination";

/* --------------------------------------------------------------------------
 * hook de debounce (mismo patrón inline que en ClientesView)
 * -------------------------------------------------------------------------- */
function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ---------- Tipos API ---------- */

type ApiCustomerGroup = {
  GroupCode: number;
  PartnerType: string;
  GroupName: string;
  IsActive: boolean;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
};

/* ---------- Tipos UI ---------- */
interface CustomerGroupRow {
  id: number;          // GroupCode
  groupCode: number;
  groupName: string;
  partnerType: string; // "C"
  status: Estado;
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

/* ---------- Columnas ---------- */
function getColumns(): Column<CustomerGroupRow>[] {
  return [
    {
      header: "Código",
      accessorKey: "groupCode",
      cell: (r) => (
        <CopyableText text={String(r.groupCode)} className="break-all">
          {r.groupCode}
        </CopyableText>
      ),
    },
    {
      header: "Nombre de grupo",
      accessorKey: "groupName",
    },
    {
      header: "Tipo",
      accessorKey: "partnerType",
      cell: (r) => <Pill text={r.partnerType || "—"} />,
    },
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
  isActive: string; // "", "1", "0"
}

const getFiltersConfig = (f: Filters) => [
  {
    id: "search",
    label: "Buscar",
    type: "text" as const,
    value: f.search,
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
];

/* ---------- Página (View) ---------- */
export default function GrupoClientesView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(), []);

  // tabla
  const [rows, setRows] = useState<CustomerGroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  // paginación local (la API devuelve todo el listado)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // errores
  const [error, setError] = useState<string | null>(null);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // filtros
  const [filters, setFilters] = useState<Filters>({
    search: "",
    isActive: "",
  });

  const qRaw = filters.search.trim();
  const qDebounced = useDebounced(qRaw, 300); // evita spam de filtros

  // cargar listado principal
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await customerGroupsAll();

      // mapeo a filas UI
      const mapped: CustomerGroupRow[] = (items || []).map((it: ApiCustomerGroup) => ({
        id: it.GroupCode,
        groupCode: it.GroupCode,
        groupName: it.GroupName || "",
        partnerType: it.PartnerType || "",
        status: it.IsActive ? "Activo" : "Inactivo",
        createdAt: it.CreatedAt ? new Date(it.CreatedAt).toLocaleString("es-CL") : "—",
        updatedAt: it.UpdatedAt ? new Date(it.UpdatedAt).toLocaleString("es-CL") : "—",
      }));

      // filtros en cliente
      const q = (qDebounced || "").toLowerCase();
      let filtered = mapped;

      if (q) {
        filtered = filtered.filter((r) => {
          const codeStr = String(r.groupCode ?? "").toLowerCase();
          const nameStr = (r.groupName ?? "").toLowerCase();
          return (
            codeStr.includes(q) ||
            nameStr.includes(q)
          );
        });
      }

      if (filters.isActive !== "") {
        filtered = filtered.filter((r) =>
          filters.isActive === "1" ? r.status === "Activo" : r.status === "Inactivo"
        );
      }

      const total = filtered.length;
      setTotalRecords(total);
      const pages = Math.max(1, Math.ceil(total / PER_PAGE));
      setTotalPages(pages);

      const startIndex = (currentPage - 1) * PER_PAGE;
      const endIndex = startIndex + PER_PAGE;
      setRows(filtered.slice(startIndex, endIndex));
    } catch (err: any) {
      console.error("Error listando grupos de clientes:", err);
      setError(`Error al cargar grupos de clientes: ${err.message ?? String(err)}`);
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [qDebounced, filters.isActive, currentPage]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* acciones header */
  const handleExport = useCallback(() => {
    const headers = [
      "Código",
      "Nombre de grupo",
      "Tipo",
      "Estado",
      "Creado",
      "Actualizado",
    ];
    const data = rows.map((r) => [
      r.groupCode,
      r.groupName,
      r.partnerType,
      r.status,
      r.createdAt,
      r.updatedAt,
    ]);
    exportToCsv("grupos-clientes.csv", [headers, ...data]);
  }, [rows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/customers/grupo-clientes/nuevo"),
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
          // al refrescar, vuelvo a la página 1 para evitar índices inválidos
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
        sticky
        stickyTop={0}
        title="Grupo de Clientes"
        action={headerActions}
        filters={getFiltersConfig(filters)}
        onFilterChange={(id, value) => {
          // Reinicia a la primera página cuando cambian filtros
          setCurrentPage(1);
          setFilters((prev) => ({ ...prev, [id]: value }));
        }}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Listado / tabla */}
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
                  <h3 className="text-sm font-medium">
                    Error al cargar datos
                  </h3>
                  <p className="mt-2 text-sm">{error}</p>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        onClick={() => {
                          // mismo comportamiento que el botón "Actualizar"
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
              onRowClick={(row: CustomerGroupRow) =>
                router.push(`/customers/grupo-clientes/${row.id}`)
              }
            />
          )}

          {/* Paginación (mismo patrón visual que Clientes/SalesChannels) */}
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
