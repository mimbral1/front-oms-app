"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { Pagination } from "@/components/ui/pagination";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { useFetchWithAuth } from "@/lib/http/client"; // usar el hook de auth/fetch
import { useAuth } from "@/app/context/auth/AuthContext";
import { exportToCsv } from "@/components/presets/export/export";
import { fmtDateTime } from "@/lib/format/date";

/* Interfaz para las marcas */
interface Brand {
  id: string;
  name: string;
  reference: string;
  CreateDate: string;
  UpdateDate: string;
  userCreated: string;
  status: string;
}

/* Estructuras esperadas desde la API (paginada, igual idea que productos) */
interface BrandItemAPI {
  Id?: string;
  Name?: string;
  Code?: string;
  Reference?: string;
  DateCreated?: string | null;
  UpdateDate?: string | null;
  UserCreated?: string | null;
  Status?: string | null;
}

interface BrandsAPIResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: BrandItemAPI[];
}

/* formateo defensivo de fecha-hora -> "DD/MM/YYYY HH:mm" o "Sin fecha" */
const formatDateTimeSafe = fmtDateTime;

// compara solo la parte de "YYYY-MM-DD"
function isSameDay(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  const toISODate = (s: string) => {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    // si viene "YYYY-MM-DD HH:mm:ss"
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  };
  const A = toISODate(a);
  const B = toISODate(b);
  return !!A && !!B && A === B;
}



// columnas
function getColumns(router: ReturnType<typeof useRouter>) {
  const CellWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-block min-w-[220px] max-w-[260px] truncate align-middle">
      {children}
    </span>
  );

  return [
    {
      header: "Nombre",
      accessorKey: "name",
      cell: (row: Brand) => (
        <CellWrap>
          <span>{row.name}</span>
        </CellWrap>
      ),
    },
    {
      header: "Reference",
      accessorKey: "reference",
      cell: (row: Brand) => (
        <CellWrap>
          <CopyableText text={row.reference}>{row.reference}</CopyableText>
        </CellWrap>
      ),
    },
    {
      header: "Fecha de creación",
      accessorKey: "CreateDate",
      cell: (row: Brand) => (
        <CellWrap>
          <span>{row.CreateDate || "Sin fecha"}</span>
        </CellWrap>
      ),
    },
    {
      header: "Usuario creador",
      accessorKey: "userCreated",
      cell: (row: Brand) => (
        <CellWrap>
          <span>{row.userCreated || "-"}</span>
        </CellWrap>
      ),
    },
    {
      header: "Fecha de modificación",
      accessorKey: "UpdateDate",
      cell: (row: Brand) => (
        <CellWrap>
          <span>{row.UpdateDate || "Sin fecha"}</span>
        </CellWrap>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row: Brand) => {
        const isActive = row.status === "Activo";
        const color = isActive ? "bg-green-500" : "bg-gray-400";
        return (
          <div
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium text-white ${color}`}
          >
            {row.status}
          </div>
        );
      },
    },
  ];
}


/* Filtros */
interface BrandFilters {
  search: string;
  name: string;
  reference: string;
  account: string;
  dateCreated: string;
  userCreated: string;
}

function getBrandFilters(
  filters: BrandFilters,
  accountOptions: { label: string; value: string }[],
  accountSearchQuery: string,
  onAccountSearch: (q: string) => void,
  userOptions: { label: string; value: string }[],
  userSearchQuery: string,
  onUserSearch: (q: string) => void,
) {
  return [
    {
      id: "search",
      label: "Búsqueda",
      type: "text" as const,
      value: filters.search,
    },
    {
      id: "name",
      label: "Nombre",
      type: "text" as const,
      value: filters.name,
    },
    {
      id: "reference",
      label: "Referencia",
      type: "text" as const,
      value: filters.reference,
    },
    {
      id: "account",
      label: "Cuentas",
      type: "select-search" as const,
      value: filters.account,
      options: accountOptions,
      onSearch: onAccountSearch,
      searchQuery: accountSearchQuery,
    },
    {
      id: "dateCreated",
      label: "Fecha de creación",
      type: "single-date" as const,
      value: filters.dateCreated,
    },
    {
      id: "userCreated",
      label: "Usuario creador",
      type: "select-search" as const,
      value: filters.userCreated,
      options: userOptions,
      onSearch: onUserSearch,
      searchQuery: userSearchQuery,
    },
  ];
}

/* 5) Vista principal */
export function BrandView() {
  const router = useRouter();

  // token y fetch con headers (igual que ProductosView)
  const { token } = useAuth();
  const { fetchWithAuth } = useFetchWithAuth();

  // estado de grilla
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [filters, setFilters] = useState<BrandFilters>({
    search: "",
    name: "",
    reference: "",
    account: "",
    dateCreated: "",
    userCreated: "",
  });

  // opciones para select-search de Cuentas y Usuario creador
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: string }[]>([{ label: "Cuentas", value: "" }]);
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([{ label: "Usuario creador", value: "" }]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Helpers de paginación (evitan salirse de rango)
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  // paginación (desde backend)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // mapear item API -> Brand (para respetar TUS columnas)
  const mapToBrand = (it: BrandItemAPI): Brand => {
    return {
      id: it.Id ?? it.Code ?? it.Reference ?? crypto.randomUUID(),
      name: it.Name ?? "",
      reference: (it.Reference ?? it.Code ?? "") + "",
      CreateDate: formatDateTimeSafe(it.DateCreated) || "",
      UpdateDate: formatDateTimeSafe(it.UpdateDate) || "",
      userCreated: it.UserCreated ?? "-",
      status: it.Status === "Active" || it.Status === "Y" ? "Activo" : it.Status === "Inactive" || it.Status === "N" ? "Inactivo" : it.Status ?? "Activo",
    };
  };

  // construir y ejecutar fetch (siguiendo patrón de ProductosView)
  const fetchBrands = useCallback(async () => {
    if (!token) return; // espera a tener token
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(currentPage));
      qs.set("pageSize", String(pageSize));

      // La API acepta: code, name, fromdate, todate
      if (filters.search) qs.set("name", filters.search);
      if (filters.name) qs.set("name", filters.name);
      if (filters.reference) qs.set("code", filters.reference);

      // Filtro por fecha de creación (día exacto)
      if (filters.dateCreated) {
        qs.set("fromdate", filters.dateCreated);
        qs.set("todate", filters.dateCreated);
      }

      const url = `catalog/getmarca?${qs.toString()}`;
      const resp = await fetchWithAuth<BrandsAPIResponse>(url);

      const list = (resp?.data ?? []).map(mapToBrand);
      setBrands(list);
      setTotalRecords(resp?.totalRecords ?? list.length);
    } catch (err: any) {
      setBrands([]);
      setTotalRecords(0);
      setError(`Error al cargar marcas: ${err?.message || "desconocido"}`);
    } finally {
      setLoading(false);
    }
  }, [token, fetchWithAuth, currentPage, pageSize, filters.search, filters.name, filters.reference, filters.dateCreated]);

  // efectos: carga inicial y cuando cambian dependencias
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Cargar opciones de cuentas y usuarios (una vez que haya datos)
  const fetchFilterOptions = useCallback(async () => {
    if (!token) return;
    try {
      const qs = new URLSearchParams();
      qs.set("page", "1");
      qs.set("pageSize", "9999");
      const url = `catalog/getmarca?${qs.toString()}`;
      const resp = await fetchWithAuth<BrandsAPIResponse>(url);
      const items = resp?.data ?? [];

      // Extraer usuarios únicos
      const uniqueUsers = new Set<string>();
      items.forEach((it) => {
        // No hay campo de user en BrandItemAPI, se podría usar algo como it.UserCreated
        // Por ahora dejamos la lista vacía y se populará cuando la API lo soporte
      });
      setUserOptions([
        { label: "Usuario creador", value: "" },
        ...Array.from(uniqueUsers).sort().map((u) => ({ label: u, value: u })),
      ]);

      // Cuentas: por ahora opciones estáticas (la API de marcas no devuelve cuentas)
      setAccountOptions([
        { label: "Cuentas", value: "" },
        { label: "La Torre", value: "La Torre" },
        { label: "Husqvarna", value: "Husqvarna" },
      ]);
    } catch {
      // silenciar
    }
  }, [token, fetchWithAuth]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Opciones filtradas localmente por la búsqueda del select-search
  const filteredAccountOptions = useMemo(
    () => accountOptions.filter((o) => o.label.toLowerCase().includes(accountSearchQuery.toLowerCase())),
    [accountOptions, accountSearchQuery]
  );
  const filteredUserOptions = useMemo(
    () => userOptions.filter((o) => o.label.toLowerCase().includes(userSearchQuery.toLowerCase())),
    [userOptions, userSearchQuery]
  );

  // cambios de filtro
  const handleFilterChange = (id: string, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: value }));
    setCurrentPage(1);
  };

  // limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      search: "",
      name: "",
      reference: "",
      account: "",
      dateCreated: "",
      userCreated: "",
    });
    setAccountSearchQuery("");
    setUserSearchQuery("");
    setCurrentPage(1);
  };

  const hasAnyFilter = Object.values(filters).some((v) => v !== "");

  // acciones header
  const handleRefresh = () => {
    fetchBrands();
  };
  const handleNew = () => {
    router.push(`/catalogo/marcas/nueva`);
  };
  const handleExport = () => {
    const headers = ["Nombre", "Reference", "Fecha de creación", "Fecha actualización"];
    const rows = brands.map((b) => [b.name, b.reference, b.CreateDate, b.UpdateDate]);
    exportToCsv("marcas.csv", [headers, ...rows]);
  };

  const headerActions = [
    {
      label: "Actualizar",
      variant: "secondary" as const,
      onClick: handleRefresh,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: handleNew,
      icon: <PlusIcon className="h-5 w-5" />,
    },
  ];

  // columnas (exactas, no cambiadas)
  const columns = useMemo(() => getColumns(router), [router]);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title="Buscar por Marca"
        description=""
        filters={getBrandFilters(
          filters,
          filteredAccountOptions,
          accountSearchQuery,
          setAccountSearchQuery,
          filteredUserOptions,
          userSearchQuery,
          setUserSearchQuery,
        )}
        onFilterChange={handleFilterChange}
        action={headerActions}
        filtersRight={
          <ClearFiltersButton onClick={handleClearFilters} disabled={!hasAnyFilter} />
        }
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl  shadow-sm">
            {loading ? (
              <div className="bg-white p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-sm" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Error al cargar datos</h3>
                    <p className="mt-2 text-sm">{error}</p>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleRefresh}
                        className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <DataTable
                data={brands}
                dataType="General"
                columns={columns as any}
                rowBgClass="bg-white"
                rowPaddingY={12}
                rowGap={6}
                onRowClick={(row: BrandItemAPI) =>
                  router.push(`/catalogo/marcas/${row.Id}`)
                }
              />
            )}
          </div>

          {/* Paginación */}

          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />

        </div>
      </div>
    </div>
  );
}
