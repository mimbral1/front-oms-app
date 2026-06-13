// views\PickingView\configuraciones\multipicking\sectores\SectoresPickingView.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { useFetchWithAuth } from "@/lib/http/client";
import { useApiSectoresPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/sectores-picking/api-sectores-picking";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/user-avatar";

/* ──────────────────────────────
   1 · Tipos 
   ────────────────────────────── */
export interface Sector {
  id: string;
  nombre: string;

  pedidosMax: number;
  itemsMax: number;

  categorias: number;
  skus: number;
  esquema: string;

  createdDate: string;
  modifiedDate: string;

  creator: {
    username: string;
    email: string;
    avatar?: string;
  };

  modifier: {
    username: string;
    email: string;
    avatar?: string;
  };

  status: "Active" | "Inactive";
}

/* ──────────────────────────────
   2 · Filtros (ahora con ID)
   ────────────────────────────── */
interface Filters {
  id: string;
  nombre: string;
  esquema: string;
  usuario: string;
}

/* ---------- helpers ---------- */
const getStatusColor = (status: string) => {
  if (status === "Active") {
    return "bg-green-500"; // Color verde para activo
  } else if (status === "Inactive") {
    return "bg-gray-400"; // Color gris para inactivo
  }
  return "bg-gray-500"; // Color por defecto si el estado es desconocido
};

const getColumns = (router: ReturnType<typeof useRouter>): Column<Sector>[] => [
  {
    header: "Nombre",
    accessorKey: "nombre",
    cell: (r) => (
      <span
        onClick={() =>
          router.push(`/picking/configuraciones/multipicking/sectores/${r.id}`)
        }
        className="cursor-pointer hover:underline font-medium"
      >
        {r.nombre}
      </span>
    ),
  },
  {
    header: "Pedidos máx.",
    accessorKey: "pedidosMax",
    // pill redondeado como en la imagen
    cell: (r) => (
      <span className="inline-flex items-center justify-center h-7 w-10 rounded-full border border-gray-300 bg-white text-sm font-medium">
        {r.pedidosMax}
      </span>
    ),
  },
  {
    header: "Ítems máx.",
    accessorKey: "itemsMax",
    // pill con el valor (15000)
    cell: (r) => (
      <span className="inline-flex items-center justify-center h-7 min-w-14 px-3 rounded-full border border-gray-300 bg-white text-sm font-medium">
        {r.itemsMax}
      </span>
    ),
  },
  {
    header: "Categorías",
    accessorKey: "categorias",
    cell: (r) => <span className="text-sm">{r.categorias}</span>,
  },
  {
    header: "SKUs",
    accessorKey: "skus",
    cell: (r) => <span className="text-sm">{r.skus}</span>,
  },
  {
    header: "Usuario creador",
    accessorKey: "creator",
    cell: (r) =>
      r.creator.username !== "-" ? (
        <div className="flex items-center gap-2 text-sm">
          <Avatar
            name={r.creator.username}
            src={r.creator.avatar}
            className="h-7 w-7 bg-orange-100 text-xs font-bold text-orange-700"
          />
          <span className="truncate max-w-[140px]">
            {r.creator.username}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
  {
    header: "Fecha creación",
    accessorKey: "createdDate",
    cell: (r) => <span className="text-sm">{r.createdDate}</span>,
  },
  {
    header: "Usuario modificador",
    accessorKey: "modifier",
    cell: (r) =>
      r.modifier.username !== "-" ? (
        <div className="flex items-center gap-2 text-sm">
          <Avatar
            name={r.modifier.username}
            src={r.modifier.avatar}
            className="h-7 w-7 bg-orange-100 text-xs font-bold text-orange-700"
          />
          <span>
            {r.modifier.username}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
  {
    header: "Fecha modificación",
    accessorKey: "modifiedDate",
    cell: (r) => <span className="text-sm">{r.modifiedDate}</span>,
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: (row: Sector) => {
      const bgColor = getStatusColor(row.status);
      const displayStatusText =
        row.status === "Active" ? "Activo" : "Inactivo";

      return (
        <div
          className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${bgColor}`}
        >
          {displayStatusText}
        </div>
      );
    },
  },
];

/* ──────────────────────────────
   4 · Vista
   ────────────────────────────── */
export default function SectoresPicking() {
  const router = useRouter();
  const { fetchWithAuth } = useFetchWithAuth();
  const { getZones } = useApiSectoresPicking();

  const [data, setData] = useState<Sector[]>([]);
  const [filters, setFilters] = useState<Filters>({
    id: "",
    nombre: "",
    esquema: "",
    usuario: "",
  });

  // para filtro de usuario creador 
  const apiSectores = useApiSectoresPicking();
  const [userOptions, setUserOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // para filtro de esquemas
  const [schemaOptions, setSchemaOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // filtros 
  const filtersConfig = useMemo(() => [
    // {
    //   id: "id",
    //   label: "ID",
    //   type: "text" as const,
    //   value: filters.id,
    // },
    {
      id: "nombre",
      label: "Nombre",
      type: "text" as const,
      value: filters.nombre,
    },
    {
      id: "esquema",
      label: "Esquema",
      type: "select-search" as const,
      value: filters.esquema,
      options: schemaOptions,
    },
    {
      id: "usuario",
      label: "Usuario creador",
      type: "select-search" as const,
      value: filters.usuario,
      options: userOptions,
      onSearch: setUserSearchQuery,
      searchQuery: userSearchQuery,
    },
  ], [filters, userOptions, userSearchQuery]);


  // cache de perfiles (usuario creador / modificador)
  const perfilesCache = useRef<Record<number, any>>({});

  const load = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await getZones({
        id: filters.id || "",
        name: filters.nombre || "",
        createdBy: filters.usuario || "",
        schemaId: filters.esquema || "",
      });

      const mapped: Sector[] = res.items.map((z: any) => {
        const creatorProfile = z.createdByUser?.profile;
        const updaterProfile = z.updatedByUser?.profile;
        const creatorName = `${creatorProfile?.nombres ?? ""} ${creatorProfile?.apellidos ?? ""}`.trim();
        const updaterName = `${updaterProfile?.nombres ?? ""} ${updaterProfile?.apellidos ?? ""}`.trim();

        return {
          id: z.id,
          nombre: z.name,
          pedidosMax: z.maxQuantityOrders,
          itemsMax: z.maxQuantityItems,
          categorias: z.categoriesCount,
          skus: z.skusCount,
          esquema: `${z.categoriesCount} categorías / ${z.skusCount} SKUs`,
          createdDate: z.createdAtCL,
          modifiedDate: z.updatedAtCL ?? "-",
          creator: {
            username: creatorName || "-",
            email: creatorProfile?.email ?? "",
            avatar: creatorProfile?.urlImagenPerfil,
          },

          modifier: updaterProfile
            ? {
              username: updaterName || "-",
              email: updaterProfile.email ?? "",
              avatar: updaterProfile.urlImagenPerfil,
            }
            : {
              username: "-",
              email: "",
            },
          status: z.isActive ? "Active" : "Inactive",
        };
      });

      setData(mapped);
    } catch (err: any) {
      console.error("Error listando sectores:", err);
      setData([]);
      setErrorMessage(
        typeof err === "string"
          ? err
          : err?.message || "Error al listar sectores de picking."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, [filters.id, filters.nombre, filters.usuario, filters.esquema]);

  // para filtro de usuario creador 
  useEffect(() => {
    let mounted = true;

    const loadCreators = async () => {
      try {
        const res = await apiSectores.getZoneCreators();
        if (!mounted) return;

        const options =
          (res?.items ?? []).map((u: any) => ({
            label: u.name,
            value: String(u.id),
          }));

        setUserOptions([
          { label: "Seleccionar", value: "" },
          ...options,
        ]);
      } catch (e) {
        console.error("Error cargando usuarios creadores:", e);
        setUserOptions([{ label: "Seleccionar", value: "" }]);
      }
    };

    loadCreators();

    return () => {
      mounted = false;
    };
  }, []);

  // para filtro de esquemas 
  useEffect(() => {
    let mounted = true;

    const loadSchemas = async () => {
      try {
        const res = await apiSectores.getPickingSchemasSimple();
        if (!mounted) return;

        const options =
          (res?.items ?? []).map((s: any) => ({
            label: s.name,
            value: s.id,
          }));

        setSchemaOptions([
          { label: "Seleccionar", value: "" },
          ...options,
        ]);
      } catch (e) {
        console.error("Error cargando esquemas:", e);
        setSchemaOptions([{ label: "Seleccionar", value: "" }]);
      }
    };

    loadSchemas();

    return () => {
      mounted = false;
    };
  }, []);

  const handleFilter = (id: string, value: string) =>
    setFilters((p) => ({ ...p, [id]: value }));


  const handleExport = () => {
    const headers = [
      "ID",
      "Nombre",
      "Ítems máx.",
      "Esquema",
      "Fecha creación",
      "Creador",
      "Email creador",
      "Modificado",
      "Status",
    ];
    const rows = data.map((s) => [
      s.id,
      s.nombre,
      s.itemsMax,
      s.esquema,
      s.createdDate,
      s.creator.username,
      s.creator.email,
      s.modifiedDate,
      s.status,
    ]);
    exportToCsv("sectores_picking.csv", [headers, ...rows]);
  };

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        icon: <PlusIcon className="h-5 w-5" />,
        onClick: () =>
          router.push("/picking/configuraciones/multipicking/sectores/nuevo"),
      },
      {
        label: "Exportar",
        variant: "primary",
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        onClick: handleExport,
      },
      {
        label: "Actualizar",
        variant: "secondary",
        icon: <ArrowPathIcon className="h-5 w-5" />,
        onClick: () => load(),
      },
    ],
    [router, handleExport]
  );


  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  const shown = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Helpers de paginación (evitan salirse de rango)
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // para usuario modificador 
  const getPerfilById = async (id: number) => {
    if (perfilesCache.current[id]) {
      return perfilesCache.current[id];
    }

    try {
      const perfil = await fetchWithAuth<any>(
        `idservice/perfiles/${id}`,
        { method: "GET" }
      );

      // Caso: backend responde "Perfil no encontrado"
      if (!perfil || perfil?.mensaje) {
        perfilesCache.current[id] = null;
        return null;
      }

      perfilesCache.current[id] = perfil;
      return perfil;
    } catch (e) {
      console.error("Error obteniendo perfil:", id, e);
      perfilesCache.current[id] = null;
      return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Sectores de picking"
        filters={filtersConfig}
        onFilterChange={handleFilter}
        action={headerActions}
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
                      Cargando sectores de picking...
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
                    Error al cargar sectores de picking
                  </h3>
                  <p className="mt-2 text-sm">{errorMessage}</p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        load();
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
              data={shown}
              columns={getColumns(router)}
              dataType="General"
              statusKey="status"
              rowPaddingY={12}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: Sector) =>
                router.push(`/picking/configuraciones/multipicking/sectores/${row.id}`)
              }
            // rowGap={6}
            />
          )}

          {/* Paginación simple */}
          <Pagination
            currentPage={page}
            totalRecords={data.length}
            pageSize={PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
