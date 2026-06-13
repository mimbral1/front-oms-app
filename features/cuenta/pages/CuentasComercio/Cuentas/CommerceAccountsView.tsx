// app/views/Commerce/Accounts/Browse/CommerceAccountsView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { type Estado, getEstadoColor } from "@/utils/status";

/* Tipado */
type Plataforma = "VTEX" | "Shopify" | "Meli";

interface CommerceAccountRow {
  id: number;
  nombre: string;
  comercio: string;
  refId: string;
  plataforma: string;
  status: Estado;
  salesChannelName: string;
}

/* Helpers */
const PER_PAGE = 20;
const statusBg = getEstadoColor;

/* Filtros */
type Filters = {
  search: string;               // name / salesChannelName
  plataforma: "" | Plataforma;  // Platform
  ecommerceName: string;        // comercio
  salesChannelName: string;     // canal
  status: "" | "1" | "0";       // Status (1/0)
};
const initialFilters: Filters = { search: "", plataforma: "", ecommerceName: "", salesChannelName: "", status: "" };

const getFilters = (filters: Filters) => [
  { id: "search", label: "Buscar", type: "text" as const, placeholder: "Nombre o Canal de venta", value: filters.search },
  {
    id: "plataforma",
    label: "Plataforma",
    type: "text" as const,
    value: filters.plataforma,
    placeholder: "Ej: VTEX, Shopify, Meli…",
  },

  { id: "ecommerceName", label: "Comercio", type: "text" as const, value: filters.ecommerceName },
  { id: "salesChannelName", label: "Canal", type: "text" as const, value: filters.salesChannelName },
  {
    id: "status",
    label: "Estado",
    type: "select" as const,
    value: filters.status,
    options: [
      { label: "Todos", value: "" },
      { label: "Activo", value: "1" },
      { label: "Inactivo", value: "0" },
    ],
  },
];

/* Columnas (estilo Precios) */
function getColumns(): Column<CommerceAccountRow>[] {
  return [
    { header: "ID", accessorKey: "id", cell: (r) => <CopyableText text={String(r.id)}>{r.id}</CopyableText> },
    { header: "Nombre", accessorKey: "nombre" },
    { header: "Comercio", accessorKey: "comercio" },
    { header: "Ref ID", accessorKey: "refId", cell: (r) => <CopyableText text={r.refId}>{r.refId}</CopyableText> },
    { header: "Plataforma", accessorKey: "plataforma" },
    { header: "Canal de venta", accessorKey: "salesChannelName" },
    {
      header: "Status",
      accessorKey: "status",
      cell: (r) => (
        <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${statusBg(r.status)}`}>
          {r.status}
        </div>
      ),
    },
  ];
}

/* View */
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";

type ApiRow = {
  Id: number;
  SalesChannelId: number;
  SalesChannelName: string;
  ReferenceId: string;
  Name: string;
  Platform: string;
  EcommerceName: string;
  Features: string | null;
  Status: boolean;
  DateCreated: string | null;
  DateModified: string | null;
  UserCreated: number | null;
  UserModified: number | null;
};

type ApiList = {
  ok: boolean;
  page: number;
  pageSize: number;
  total: number;
  data: ApiRow[];
};

export default function CommerceAccountsView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(), []);
  const { fetchWithAuth } = useFetchWithAuth();
  const { token } = useAuth();

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  // estado para opciones y búsquedas
  type Opt = { label: string; value: string };

  const [platformOptions, setPlatformOptions] = useState<Opt[]>([
    { label: "Seleccione plataforma…", value: "" },
  ]);
  const [channelOptions, setChannelOptions] = useState<Opt[]>([
    { label: "Seleccione canal…", value: "" },
  ]);

  const [platformSearch, setPlatformSearch] = useState("");
  const [channelSearch, setChannelSearch] = useState("");

  // datos
  const [rows, setRows] = useState<CommerceAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // manejo de errores 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // cargar listado desde API
  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("pagesize", String(PER_PAGE));
      if (filters.search) params.set("name", filters.search);
      if (filters.plataforma) params.set("platform", filters.plataforma);
      if (filters.ecommerceName) params.set("ecommerceName", filters.ecommerceName);
      if (filters.salesChannelName) params.set("salesChannelName", filters.salesChannelName);
      if (filters.status !== "") params.set("status", filters.status);

      // puede venir ApiList o { message: "Tu usuario no tiene permiso..." }
      const raw = await fetchWithAuth<any>(`comerce-service/account/Listar?${params.toString()}`);

      if (raw && typeof raw === "object" && "message" in raw && !Array.isArray(raw.data)) {
        throw new Error(String(raw.message || "Error al listar cuentas de comercio."));
      }

      const res = raw as ApiList;
      const data = Array.isArray(res?.data) ? res.data : [];

      const mapped: CommerceAccountRow[] = data.map((a) => ({
        id: a.Id,
        nombre: a.Name || "",
        comercio: a.EcommerceName || "",
        refId: a.ReferenceId || "",
        plataforma: (a.Platform?.toUpperCase() as Plataforma) || "",
        status: a.Status ? "Activo" : "Inactivo",
        salesChannelName: a.SalesChannelName || "",
      }));

      const total = Number(res?.total ?? 0);
      const pageSize = Number(res?.pageSize ?? PER_PAGE);
      setRows(mapped);
      setTotalRecords(total);
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
    } catch (err: any) {
      console.error("Error listando accounts:", err?.payload ?? err);
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);

      const msg =
        typeof err === "string"
          ? err
          : err?.message || "Error al listar cuentas de comercio.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    fetchWithAuth,
    currentPage,
    filters.search,
    filters.plataforma,
    filters.ecommerceName,
    filters.salesChannelName,
    filters.status,
  ]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // cargar opciones para selectores 
  useEffect(() => {
    let alive = true;

    // canales (value = NOMBRE)
    (async () => {
      try {
        const res = await fetchWithAuth<{ ok: boolean; data: Array<{ Id: number; Name: string }> }>(
          "comerce-service/sales-channel/Listar?page=1&pageSize=200&isActive=1"
        );
        if (!alive) return;
        const rows = Array.isArray(res?.data) ? res!.data : [];
        setChannelOptions([
          { label: "Seleccione canal…", value: "" },
          ...rows.map(r => ({ label: String(r.Name ?? ""), value: String(r.Name ?? "") })),
        ]);
      } catch {
        setChannelOptions([{ label: "Seleccione canal…", value: "" }]);
      }
    })();

    // plataformas (value = NOMBRE)
    (async () => {
      try {
        const res = await fetchWithAuth<{ ok: boolean; total: number; data: Array<{ ID: number; NOMBRE: string }> }>(
          "idservice/plataformas/obtener"
        );
        if (!alive) return;
        const rows = Array.isArray(res?.data) ? res!.data : [];
        setPlatformOptions([
          { label: "Seleccione plataforma…", value: "" },
          ...rows.map(p => ({ label: String(p.NOMBRE ?? ""), value: String(p.NOMBRE ?? "") })),
        ]);
      } catch {
        setPlatformOptions([{ label: "Seleccione plataforma…", value: "" }]);
      }
    })();

    return () => { alive = false; };
  }, [fetchWithAuth]);

  const headerActions = useMemo(
    () => [
      { label: "Nuevo", variant: "success" as const, onClick: () => router.push(`/cuenta/cuentas-comercio/cuentas/nuevo`), icon: <PlusIcon className="h-5 w-5" /> },
      {
        label: "Exportar",
        variant: "primary" as const,
        onClick: () =>
          exportToCsv(
            "cuentas-de-comercio.csv",
            rows.map((r) => ({
              ID: r.id,
              Nombre: r.nombre,
              Comercio: r.comercio,
              "Ref ID": r.refId,
              Plataforma: r.plataforma,
              Estado: r.status,
              "Canal de venta": r.salesChannelName,
            }))
          ),
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      },
      { label: "Actualizar", variant: "secondary" as const, onClick: () => fetchList(), icon: <ArrowPathIcon className="h-5 w-5" /> },
    ],
    [router, rows, fetchList]
  );

  //  Sustituye getFilters(filters) por un array con select-search
  const viewFilters = [
    { id: "search", label: "Buscar", type: "text" as const, placeholder: "Nombre o Canal de venta", value: filters.search },
    {
      id: "plataforma",
      label: "Plataforma",
      type: "select-search" as const,
      value: filters.plataforma,             // guarda NOMBRE
      options: platformOptions,
      searchQuery: platformSearch,
      onSearch: setPlatformSearch,
    },
    { id: "ecommerceName", label: "Comercio", type: "text" as const, value: filters.ecommerceName },
    {
      id: "salesChannelName",
      label: "Canal",
      type: "select-search" as const,
      value: filters.salesChannelName,       // guarda NOMBRE
      options: channelOptions,
      searchQuery: channelSearch,
      onSearch: setChannelSearch,
    },
    {
      id: "status",
      label: "Estado",
      type: "select" as const,
      value: filters.status,
      options: [
        { label: "Todos", value: "" },
        { label: "Activo", value: "1" },
        { label: "Inactivo", value: "0" },
      ],
    },
  ];

  const handleFilterChange = (id: string, value: string) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [id]: value as Filters[keyof Filters] }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title="Cuentas de comercio"
        filters={viewFilters}
        onFilterChange={handleFilterChange}
        action={headerActions}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl shadow-sm">
            {loading ? (
              <div className="mt-0 overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500">
                        <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                        Cargando…
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : errorMessage ? (
              <div
                className="mt-0 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                role="alert"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Error al cargar cuentas de comercio</h3>
                    <p className="mt-2 text-sm">
                      {errorMessage}
                    </p>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage(null);
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
                rowBgClass="bg-white"
                showStatusBorder={true}
                onRowClick={(row: CommerceAccountRow) =>
                  router.push(`/cuenta/cuentas-comercio/cuentas/${encodeURIComponent(String(row.id))}`)
                }
              />
            )}
          </div>

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
