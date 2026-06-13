// views\PickingView\configuraciones\PickersView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { useFetchWithAuth } from "@/lib/http/client";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";
import { fetchPickers, fetchPickerDetail, fetchLocationsSimple, fetchPickingPointsSimple } from "@/features/picking/services";
import { UserAvatarCell, CountBadgeCell } from "@/features/picking/components";

/* ──────────────────────────────
   1 · Tipos
────────────────────────────── */
interface Picker {
  id: string;
  nombre: string;
  email: string;
  status: string;

  locationsCount: number;
  pickingPointsCount: number;
  locationsInfo: string[];
  pickingPointsInfo: string[];

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
  } | null;
}

/* ---------- helpers ---------- */
const getStatusColor = (status: string) => {
  if (status === "active") return "bg-green-500";
  if (status === "inactive") return "bg-gray-400";
  return "bg-gray-500";
};

const isEnabledAssignment = (value: any) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "0" || v === "false" || v === "no") return false;
    return true;
  }
  return value !== false;
};

const toInfoList = (items: any[], kind: "location" | "point") => {
  const getLabel = (item: any) => {
    if (kind === "location") {
      return (
        item?.pickingPointName ??
        item?.locationName ??
        item?.name ??
        item?.nombre ??
        item?.pickingPointId ??
        item?.locationId ??
        item?.id
      );
    }
    return (
      item?.pickingPointName ??
      item?.name ??
      item?.nombre ??
      item?.pickingPointId ??
      item?.id
    );
  };

  return items
    .filter((x: any) => isEnabledAssignment(x?.enabled))
    .map((x: any) => String(getLabel(x) ?? "").trim())
    .filter(Boolean);
};

const toIdList = (items: any[], kind: "location" | "point") => {
  const getId = (item: any) => {
    if (kind === "location") {
      return (
        item?.pickingPointId ??
        item?.locationId ??
        item?.id ??
        item?.code ??
        item?.locationCode ??
        item?.pickingPointCode
      );
    }
    return item?.pickingPointId ?? item?.id ?? item?.code ?? item?.pickingPointCode;
  };

  return items
    .filter((x: any) => isEnabledAssignment(x?.enabled))
    .map((x: any) => String(getId(x) ?? "").trim())
    .filter(Boolean);
};

const resolveName = (idOrName: string, namesById: Record<string, string>) => {
  const raw = String(idOrName ?? "").trim();
  if (!raw) return raw;
  return namesById[raw] ?? namesById[raw.toLowerCase()] ?? raw;
};

type FetchFn = <T = any>(url: string, options?: RequestInit) => Promise<T>;

function CountInfoHoverCell({
  value,
  details,
  title,
  pickerId,
  kind,
  fetchWithAuth,
  namesById,
}: {
  value: number;
  details: string[];
  title: string;
  pickerId: string;
  kind: "location" | "point";
  fetchWithAuth: FetchFn;
  namesById: Record<string, string>;
}) {
  const [hoverDetails, setHoverDetails] = useState<string[]>(details);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [open, setOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  const rows = hoverDetails.length > 0
    ? hoverDetails
    : loadingDetails
      ? ["Cargando detalle..."]
      : ["Sin detalle disponible"];

  const handleHover = async () => {
    if (loadingDetails || hasFetched || !pickerId) return;

    setLoadingDetails(true);
    try {
      const res = await fetchPickerDetail(fetchWithAuth, pickerId);
      const data = res?.data ?? res;
      const assignments = data?.assignments ?? {};

      const loadedDetails = kind === "location"
        ? toInfoList(assignments.locations ?? [], "location")
        : toInfoList(assignments.pickingPoints ?? [], "point");

      const withNames = loadedDetails.map((d) => resolveName(d, namesById));
      setHoverDetails(withNames);
    } catch {
      setHoverDetails([]);
    } finally {
      setLoadingDetails(false);
      setHasFetched(true);
    }
  };

  const updateOverlayPosition = (el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect();
    const popupWidth = 288;
    const popupHeight = 240;
    const gap = 8;

    const centerX = rect.left + rect.width / 2;
    const left = Math.max(popupWidth / 2 + 8, Math.min(centerX, window.innerWidth - popupWidth / 2 - 8));
    const canShowAbove = rect.top > popupHeight + gap + 8;

    if (canShowAbove) {
      setOverlayStyle({
        position: "fixed",
        left,
        top: rect.top - gap,
        transform: "translate(-50%, -100%)",
        zIndex: 80,
      });
      return;
    }

    setOverlayStyle({
      position: "fixed",
      left,
      top: rect.bottom + gap,
      transform: "translateX(-50%)",
      zIndex: 80,
    });
  };

  const onMouseEnterCell = async (e: React.MouseEvent<HTMLDivElement>) => {
    updateOverlayPosition(e.currentTarget);
    setOpen(true);
    await handleHover();
  };

  const onMouseLeaveCell = () => {
    setOpen(false);
  };

  return (
    <div
      className="relative inline-flex justify-center"
      onMouseEnter={onMouseEnterCell}
      onMouseLeave={onMouseLeaveCell}
    >
      <CountBadgeCell value={value} />

      {open && (
        <div
          style={overlayStyle}
          className="pointer-events-none w-72 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-2xl"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
          <ul className="max-h-56 overflow-y-auto text-xs text-slate-700 space-y-1">
            {rows.map((item, idx) => (
              <li key={`${item}-${idx}`} className="truncate" title={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- columnas ---------- */
const getColumns = (
  router: ReturnType<typeof useRouter>,
  fetchWithAuth: FetchFn,
  locationNamesById: Record<string, string>,
  pickingPointNamesById: Record<string, string>,
): Column<Picker>[] => [
    {
      header: "Picker",
      accessorKey: "nombre",
      cell: (r) => (
        <span
          onClick={() =>
            router.push(`/picking/configuraciones/pickers/${r.id}`)
          }
          className="cursor-pointer hover:underline font-medium"
        >
          {r.nombre}
        </span>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (r) => <span className="text-sm">{r.email}</span>,
    },
    {
      header: "Ubicaciones",
      accessorKey: "locationsCount",
      cell: (r) => (
        <CountInfoHoverCell
          value={r.locationsCount}
          details={r.locationsInfo.map((d) => resolveName(d, locationNamesById))}
          title="Ubicaciones"
          pickerId={r.id}
          kind="location"
          fetchWithAuth={fetchWithAuth}
          namesById={locationNamesById}
        />
      ),
    },
    {
      header: "Puntos picking",
      accessorKey: "pickingPointsCount",
      cell: (r) => (
        <CountInfoHoverCell
          value={r.pickingPointsCount}
          details={r.pickingPointsInfo.map((d) => resolveName(d, pickingPointNamesById))}
          title="Puntos de picking"
          pickerId={r.id}
          kind="point"
          fetchWithAuth={fetchWithAuth}
          namesById={pickingPointNamesById}
        />
      ),
    },
    {
      header: "Usuario creador",
      accessorKey: "creator",
      cell: (r) => (
        <UserAvatarCell
          username={r.creator.username}
          avatar={r.creator.avatar}
        />
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
      cell: (r) => (
        <UserAvatarCell
          username={r.modifier?.username ?? ""}
          avatar={r.modifier?.avatar}
        />
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
      cell: (row: Picker) => {
        const bgColor = getStatusColor(row.status);
        const label = row.status === "active" ? "Activo" : "Inactivo";

        return (
          <div
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${bgColor}`}
          >
            {label}
          </div>
        );
      },
    },
  ];

/* ---------- filtros ---------- */
interface Filters {
  firstname: string;
  lastname: string;
  email: string;
  pickingPointId: string;
  status: string;
}

interface SelectOption {
  label: string;
  value: string;
}

const INITIAL_FILTERS: Filters = {
  firstname: "",
  lastname: "",
  email: "",
  pickingPointId: "",
  status: "",
};

/* ──────────────────────────────
   4 · Vista
────────────────────────────── */
export default function PickersView() {
  const router = useRouter();
  const { fetchWithAuth } = useFetchWithAuth();

  /* ---------- filtros ---------- */
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<Filters>(INITIAL_FILTERS);
  const [pickingPointSearch, setPickingPointSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");

  const [pickingPointOptions, setPickingPointOptions] = useState<SelectOption[]>([
    { label: "Todos los picking points", value: "" },
  ]);
  const [locationNamesById, setLocationNamesById] = useState<Record<string, string>>({});
  const [pickingPointNamesById, setPickingPointNamesById] = useState<Record<string, string>>({});
  const locationLikeNamesById = useMemo(
    () => ({ ...pickingPointNamesById, ...locationNamesById }),
    [pickingPointNamesById, locationNamesById],
  );

  const filtersConfig = useMemo(
    () => [
      {
        id: "firstname",
        label: "Nombre",
        type: "text" as const,
        value: filters.firstname,
        colSpan: "lg:col-span-1 lg:max-w-[180px]",
      },
      {
        id: "lastname",
        label: "Apellido",
        type: "text" as const,
        value: filters.lastname,
        colSpan: "lg:col-span-1 lg:max-w-[180px]",
      },
      {
        id: "email",
        label: "Email",
        type: "text" as const,
        value: filters.email,
        colSpan: "lg:col-span-1 lg:max-w-[220px]",
      },
      {
        id: "pickingPointId",
        label: "Picking point",
        type: "select-search" as const,
        value: filters.pickingPointId,
        options: pickingPointOptions,
        searchQuery: pickingPointSearch,
        onSearch: setPickingPointSearch,
        colSpan: "lg:col-span-1 lg:max-w-[220px]",
      },
      {
        id: "status",
        label: "Estado",
        type: "select-search" as const,
        value: filters.status,
        colSpan: "lg:col-span-1 lg:max-w-[220px]",
        searchQuery: statusSearch,
        onSearch: setStatusSearch,
        options: [
          { label: "Todos los estados", value: "" },
          { label: "Activo", value: "active" },
          { label: "Inactivo", value: "inactive" },
        ],
      },
    ],
    [filters, pickingPointOptions, pickingPointSearch, statusSearch]
  );

  const handleFilter = (id: string, value: string) => {
    setPage(1);
    if (id === "pickingPointId" && value !== "") {
      setPickingPointSearch("");
    }
    if (id === "status" && value !== "") {
      setStatusSearch("");
    }
    setFilters((prev) => ({ ...prev, [id]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setPickingPointSearch("");
    setStatusSearch("");
    setFilters(INITIAL_FILTERS);
  };

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter((v) => v.trim() !== "").length,
    [filters],
  );

  /* ---------- paginación ---------- */
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const pageSize = PER_PAGE;
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));


  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

  // datos 
  const [data, setData] = useState<Picker[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetchPickers(fetchWithAuth, {
        page,
        pageSize,
        status: debouncedFilters.status,
        pickingPointId: debouncedFilters.pickingPointId,
        firstname: debouncedFilters.firstname,
        lastname: debouncedFilters.lastname,
        email: debouncedFilters.email,
      });


      const items = res?.data?.items ?? [];

      const mapped = items.map((i: any) => {
        const picker = i.picker;
        const profiles = i.profiles ?? {};
        const assignments = i.assignments ?? {};

        const pickerUser = profiles.pickerUser;
        const createdBy = profiles.createdBy;
        const updatedBy = profiles.updatedBy;

        const locationsInfo = toInfoList(
          assignments.locations ?? i.locations ?? i.locationAssignments ?? [],
          "location",
        );
        const pickingPointsInfo = toInfoList(
          assignments.pickingPoints ?? i.pickingPoints ?? i.pickingPointAssignments ?? [],
          "point",
        );

        const locationsCount = Number(
          i.counts?.locations ??
          i.counts?.locationCount ??
          i.locationsCount ??
          locationsInfo.length ??
          0,
        );
        const pickingPointsCount = Number(
          i.counts?.pickingPoints ??
          i.counts?.pickingPointCount ??
          i.pickingPointsCount ??
          pickingPointsInfo.length ??
          0,
        );

        const fullName =
          `${pickerUser?.nombres ?? ""} ${pickerUser?.apellidos ?? ""}`.trim() || "—";

        return {
          id: picker.id,

          nombre: fullName,
          email: pickerUser?.email ?? "—",

          status: picker.status,
          createdDate: picker.dateCreatedCL,
          modifiedDate: picker.dateModifiedCL,

          creator: createdBy
            ? {
              username: `${createdBy.nombres} ${createdBy.apellidos}`,
              email: createdBy.email,
              avatar: createdBy.urlImagenPerfil,
            }
            : { username: "—", email: "", avatar: undefined },

          modifier: updatedBy
            ? {
              username: `${updatedBy.nombres} ${updatedBy.apellidos}`,
              email: updatedBy.email,
              avatar: updatedBy.urlImagenPerfil,
            }
            : null,

          locationsCount: Number.isNaN(locationsCount) ? 0 : locationsCount,
          pickingPointsCount: Number.isNaN(pickingPointsCount) ? 0 : pickingPointsCount,
          locationsInfo,
          pickingPointsInfo,
        };
      });

      const detailedRows = await Promise.all(
        mapped.map(async (row: Picker) => {
          try {
            const detailRes = await fetchPickerDetail(fetchWithAuth, row.id);
            const detail = detailRes?.data ?? detailRes;
            const assignments = detail?.assignments ?? {};

            const locationIds = toIdList(assignments.locations ?? [], "location");
            const pointIds = toIdList(assignments.pickingPoints ?? [], "point");

            return {
              ...row,
              locationsInfo: locationIds.length > 0 ? locationIds : row.locationsInfo,
              pickingPointsInfo: pointIds.length > 0 ? pointIds : row.pickingPointsInfo,
              locationsCount: locationIds.length > 0 ? locationIds.length : row.locationsCount,
              pickingPointsCount: pointIds.length > 0 ? pointIds.length : row.pickingPointsCount,
            };
          } catch {
            return row;
          }
        }),
      );

      setData(detailedRows);
      setTotal(res.data.total);
    } catch (e: any) {
      setErrorMessage(e?.message || "Error al cargar pickers.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [pointsRes, locationsRes] = await Promise.all([
          fetchPickingPointsSimple(fetchWithAuth),
          fetchLocationsSimple(fetchWithAuth),
        ]);

        const pointItems = pointsRes?.items ?? pointsRes?.data?.items ?? [];
        const locationItems = locationsRes?.items ?? locationsRes?.data?.items ?? [];

        const options = pointItems.map((p: any) => ({
          label: p.name ?? p.nombre ?? String(p.id ?? ""),
          value: String(p.id ?? p.pickingPointId ?? ""),
        }));

        const pointMap: Record<string, string> = {};
        pointItems.forEach((p: any) => {
          const id = String(p.id ?? p.pickingPointId ?? "");
          const code = String(p.code ?? p.pickingPointCode ?? "");
          const name = String(p.name ?? p.nombre ?? p.pickingPointName ?? id);
          if (id) pointMap[id] = name;
          if (id) pointMap[id.toLowerCase()] = name;
          if (code) pointMap[code] = name;
          if (code) pointMap[code.toLowerCase()] = name;
        });
        setPickingPointNamesById(pointMap);

        const locationMap: Record<string, string> = {};
        locationItems.forEach((l: any) => {
          const id = String(l.id ?? l.locationId ?? "");
          const code = String(l.code ?? l.locationCode ?? "");
          const name = String(l.name ?? l.nombre ?? l.locationName ?? id);
          if (id) locationMap[id] = name;
          if (id) locationMap[id.toLowerCase()] = name;
          if (code) locationMap[code] = name;
          if (code) locationMap[code.toLowerCase()] = name;
        });
        setLocationNamesById(locationMap);

        setPickingPointOptions([
          { label: "Todos los picking points", value: "" },
          ...options.filter((o: SelectOption) => o.value),
        ]);
      } catch {
        setPickingPointOptions([{ label: "Todos los picking points", value: "" }]);
        setLocationNamesById({});
        setPickingPointNamesById({});
      }
    };

    loadCatalogs();
  }, [fetchWithAuth]);

  useEffect(() => {
    load();
  }, [
    page,
    debouncedFilters.firstname,
    debouncedFilters.lastname,
    debouncedFilters.email,
    debouncedFilters.pickingPointId,
    debouncedFilters.status,
  ]);

  /* -------- Acciones del header  -------- */
  const handleExport = () => {
    const headers = [
      "ID",
      "Nombre",
      "Email",
      "Estado",
      "Ubicaciones",
      "Puntos de picking",
      "Fecha creación",
      "Usuario creador",
      "Fecha modificación",
      "Usuario modificador",
    ];

    const rows = data.map((p) => [
      p.id,
      p.nombre,
      p.email,
      p.status,
      p.locationsCount,
      p.pickingPointsCount,
      p.createdDate,
      p.creator.username,
      p.modifiedDate,
      p.modifier?.username ?? "—",
    ]);

    exportToCsv("pickers.csv", [headers, ...rows]);
  };

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        icon: <PlusIcon className="h-5 w-5" />,
        onClick: () =>
          router.push("/picking/configuraciones/pickers/nuevo"),
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
    [router]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Pickers"
        filters={filtersConfig}
        onFilterChange={handleFilter}
        action={headerActions}
        filterTitle
        filtersGridClassName="gap-2 md:gap-2 lg:grid-cols-[repeat(5,minmax(0,max-content))] lg:justify-start lg:gap-x-3 lg:gap-y-2"
        filtersRight={
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm lg:flex">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
              <FunnelIcon className="h-4 w-4" />
              {activeFiltersCount} activo{activeFiltersCount === 1 ? "" : "s"}
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4" />
              Limpiar
            </button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <div className="overflow-x-auto border rounded-md bg-white">
              <table className="min-w-full text-sm">
                <tbody>
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                      <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                      Cargando pickers...
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
                    Error al cargar pickers
                  </h3>
                  <p className="mt-2 text-sm">{errorMessage}</p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => load()}
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
              data={data}
              columns={getColumns(router, fetchWithAuth, locationLikeNamesById, pickingPointNamesById)}
              dataType="General"
              statusKey="status"
              rowPaddingY={12}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: Picker) =>
                router.push(`/picking/configuraciones/pickers/${row.id}`)
              }
            />
          )}

          {/* Paginación */}
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
