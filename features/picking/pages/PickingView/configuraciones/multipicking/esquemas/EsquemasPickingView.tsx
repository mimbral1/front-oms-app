// views\PickingView\configuraciones\multipicking\esquemas\EsquemasPickingView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useApiEsquemasPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/esquemas-picking/api-esquemas-picking";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/user-avatar";

/* ===================== Tipos  ===================== */
export type Estado = "Activo" | "Inactivo";

export interface PickingScheme {
  id: number | string;
  nombre: string;
  pickingZones: string[];
  default: boolean;
  estado: Estado;
  dateCreatedCL?: string;
  dateModifiedCL?: string;
  userCreatedProfile?: {
    nombres?: string;
    apellidos?: string;
    email?: string;
    urlImagenPerfil?: string;
  } | null;
  userModifiedProfile?: {
    nombres?: string;
    apellidos?: string;
    email?: string;
    urlImagenPerfil?: string;
  } | null;
}

/* ===================== Constantes / Mocks ===================== */
const PER_PAGE = 10;

const getStatusColor = (s: Estado) => (s === "Activo" ? "bg-green-500" : "bg-gray-400");

const renderProfileCell = (profile?: PickingScheme["userCreatedProfile"] | PickingScheme["userModifiedProfile"]) => {
  if (!profile) return <span className="text-gray-400">-</span>;

  const fullName = [profile.nombres, profile.apellidos].filter(Boolean).join(" ").trim();
  const displayName = fullName || profile.email || "-";

  return (
    <div className="flex items-center gap-2 text-sm">
      <Avatar
        name={displayName}
        src={profile.urlImagenPerfil || undefined}
        alt={displayName}
        className="h-7 w-7"
      />
      <span>{displayName}</span>
    </div>
  );
};
/* ===================== Columnas ===================== */

function getColumns(): Column<PickingScheme>[] {
  return [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "nombre" },
    {
      header: "Picking zones",
      accessorKey: "pickingZones",
      cell: (r) => (
        <div className="flex flex-wrap gap-2">
          {(r.pickingZones || []).map((z) => (
            <span key={z} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
              {z}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Default",
      accessorKey: "default",
      cell: (r) => (r.default ? "Sí" : "No"),
    },
    {
      header: "Usuario creador",
      accessorKey: "userCreatedProfile",
      cell: (r) => renderProfileCell(r.userCreatedProfile),
    },
    {
      header: "Fecha creación",
      accessorKey: "dateCreatedCL",
    },
    {
      header: "Usuario modificador",
      accessorKey: "userModifiedProfile",
      cell: (r) => renderProfileCell(r.userModifiedProfile),
    },
    {
      header: "Fecha modificación",
      accessorKey: "dateModifiedCL",
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (r) => (
        <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(r.estado)}`}>
          {r.estado}
        </div>
      ),
    },
  ];
}

/* ===================== Filtros del header (solo Search + Estado) ===================== */
interface Filters {
  search: string;
  estado: "" | Estado;
}

const getFiltersConfig = (f: Filters) => [
  { id: "search", label: "Buscar", type: "text" as const, value: f.search },
  {
    id: "estado",
    label: "Estado",
    type: "select" as const,
    value: f.estado,
    options: [
      { label: "Todos", value: "" },
      { label: "Activo", value: "Activo" },
      { label: "Inactivo", value: "Inactivo" },
    ],
  },
];

/* ===================== Vista ===================== */
export default function EsquemasPickingView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(), []);

  const [filters, setFilters] = useState<Filters>({ search: "", estado: "" });
  const [rows, setRows] = useState<PickingScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // paginación 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // fetch principal con los datos del endpoint 
  const { getPickingSchemasDetailed } = useApiEsquemasPicking();

  const fetchList = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await getPickingSchemasDetailed();

      const mapped: PickingScheme[] = res.items.map((item: any) => ({
        id: item.id,
        nombre: item.name,
        pickingZones: (item.pickingZones || []).map((z: any) => z.name),
        default: Boolean(item.isDefault),
        estado: item.isActive ? "Activo" : "Inactivo",
        dateCreatedCL: item.dateCreatedCL,
        dateModifiedCL: item.dateModifiedCL,
        userCreatedProfile: item.userCreatedProfile ?? null,
        userModifiedProfile: item.userModifiedProfile ?? null,
      }));

      let data = mapped;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter((r) =>
          `${r.id} ${r.nombre} ${r.pickingZones.join(" ")}`
            .toLowerCase()
            .includes(q)
        );
      }

      if (filters.estado) {
        data = data.filter((r) => r.estado === filters.estado);
      }

      const total = data.length;
      const startIdx = (currentPage - 1) * PER_PAGE;
      const pageSlice = data.slice(startIdx, startIdx + PER_PAGE);

      setRows(pageSlice);
      setTotalRecords(total);
      setTotalPages(Math.max(1, Math.ceil(total / PER_PAGE)));
    } catch (err: any) {
      console.error("Error cargando esquemas de picking:", err);
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
      setErrorMessage(
        typeof err === "string"
          ? err
          : err?.message || "Error al cargar esquemas de picking."
      );
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.estado, currentPage]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* -------- Acciones del header  -------- */
  const handleExport = useCallback(() => {
    const headers = ["ID", "Nombre", "Picking zones", "Default", "Estado"];
    const data = rows.map((r) => [
      r.id,
      r.nombre,
      (r.pickingZones || []).join(" | "),
      r.default ? "Sí" : "No",
      r.estado,
    ]);
    exportToCsv("esquemas-picking.csv", [headers, ...data]);
  }, [rows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/picking/configuraciones/multipicking/esquemas/nuevo"),
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
        onClick: () => fetchList(),
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
        title="Esquemas de Picking"
        action={headerActions}
        filters={getFiltersConfig(filters)}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          setFilters((prev) => ({ ...prev, [id]: value }));
        }}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <div className="overflow-x-auto border rounded-md bg-white">
              <table className="min-w-full text-sm">
                <tbody>
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                      <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                      Cargando esquemas de picking…
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : errorMessage ? (
            <div
              className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
              role="alert"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    Error al cargar esquemas de picking
                  </h3>
                  <p className="mt-2 text-sm">{errorMessage}</p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        fetchList();
                      }}
                      className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              dataType="General2"
              statusKey="estado"
              rowPaddingY={12}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: PickingScheme) =>
                router.push(`/picking/configuraciones/multipicking/esquemas/${row.id}`)
              }
            />
          )}

          {/* paginación  */}
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
