// app/views/Picking/Packing/TiposDePaquete/TiposDePaqueteView.tsx
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { GeneralStatusBadge } from "@/components/ui";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { Pagination } from "@/components/ui/pagination";
import { useFetchWithAuthQA } from "@/lib/http/client";
import { PACKAGE_TYPES_API } from "@/lib/http/endpoints";

/* ===== Tipos (igual mock/datos del archivo original) ===== */
export type PackageTypeStatus = "Active" | "Inactive";

export interface PackageType {
  id: string;
  nombre: string;
  regla: string;
  valor: number;
  material: string;
  retornable: boolean;
  usosMaximos: number;
  costoAdquisicion?: number;
  isDefault: boolean;
  status: PackageTypeStatus;
}

export interface PackageTypeFilters {
  nombre: string;
  regla: string;
  valor?: number;
  material: string;
  retornable?: boolean;
  usosMaximos?: number;
}

interface PackageTypeApiItem {
  Id: string;
  Name: string;
  IdentifierRule: string;
  IdentifierValue: string;
  Material: string;
  Returnable: boolean;
  MaxUsageQuantity: number;
  AcquisitionCost?: number;
  IsDefault: boolean;
  Status: string;
}

interface PackageTypeApiResponse {
  ok: boolean;
  page: number;
  pageSize: number;
  total: number;
  items: PackageTypeApiItem[];
}

/* ===== Helpers UI ===== */
const PER_PAGE = 20;
const statusText = (s: PackageTypeStatus) => (s === "Active" ? "Activo" : "Inactivo");
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

const toUiStatus = (status: string): PackageTypeStatus => {
  return status?.toLowerCase() === "active" ? "Active" : "Inactive";
};

const mapApiItemToPackageType = (item: PackageTypeApiItem): PackageType => ({
  id: item.Id,
  nombre: item.Name,
  regla: item.IdentifierRule,
  valor: Number(item.IdentifierValue) || 0,
  material: item.Material,
  retornable: Boolean(item.Returnable),
  usosMaximos: Number(item.MaxUsageQuantity) || 0,
  costoAdquisicion: item.AcquisitionCost ?? 0,
  isDefault: Boolean(item.IsDefault),
  status: toUiStatus(item.Status),
});

/* ===== Columnas ===== */
function getColumns(router: ReturnType<typeof useRouter>): Column<PackageType>[] {
  return [
    {
      header: "Nombre",
      accessorKey: "nombre",
      cell: (r) => (
        <button
          onClick={() => router.push(`/picking/packing/tipos-de-paquetes/${r.id}`)}
          className="text-left text-gray-900 hover:underline"
        >
          {r.nombre}
        </button>
      ),
    },
    { header: "Regla", accessorKey: "regla" },
    // { header: "Valor", accessorKey: "valor" }, // (estaba comentado en el original)
    { header: "Material", accessorKey: "material" },
    {
      header: "Retornable",
      accessorKey: "retornable",
      cell: (r) => (
        <GeneralStatusBadge
          status={r.retornable ? "Retornable" : "No retornable"}
          variant={r.retornable ? "Active" : "Inactive"}
          className="text-xs"
        />
      ),
    },
    { header: "Usos máximos", accessorKey: "usosMaximos" },
    {
      header: "Costo de adquisición",
      accessorKey: "costoAdquisicion",
      cell: (r) => (r.costoAdquisicion?.toString() ?? ""),
    },
    {
      header: "Default",
      accessorKey: "isDefault",
      cell: (r) => <span className="text-gray-900">{r.isDefault ? "Sí" : "No"}</span>,
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (r) => (
        <GeneralStatusBadge status={statusText(r.status)} variant={r.status} className="text-xs" />
      ),
    },
  ];
}

/* ===== Filtros header (contrato PageHeader) ===== */
const getFiltersConfig = (f: PackageTypeFilters, ruleOptions: string[]) => [
  { id: "nombre", label: "Nombre", type: "text" as const, value: f.nombre },
  {
    id: "regla",
    label: "Regla",
    type: "select" as const,
    value: f.regla,
    options: [
      { label: "Todas", value: "" },
      ...ruleOptions.map((rule) => ({ label: rule, value: rule })),
    ],
  },
  { id: "valor", label: "Valor", type: "text" as const, value: f.valor?.toString() ?? "" },
  { id: "material", label: "Material", type: "text" as const, value: f.material },
  {
    id: "retornable",
    label: "Retornable",
    type: "select" as const,
    value: f.retornable == null ? "" : String(f.retornable),
    options: [
      { label: "Todos", value: "" },
      { label: "Sí", value: "true" },
      { label: "No", value: "false" },
    ],
  },
  { id: "usosMaximos", label: "Usos máximos", type: "text" as const, value: f.usosMaximos?.toString() ?? "" },
];

/* ===== Página ===== */
export default function TiposDePaqueteView() {
  const router = useRouter();
  const { fetchWithAuthQA } = useFetchWithAuthQA();
  const columns = useMemo(() => getColumns(router), [router]);

  const emptyFilters: PackageTypeFilters = {
    nombre: "",
    regla: "",
    valor: undefined,
    material: "",
    retornable: undefined,
    usosMaximos: undefined,
  };

  const [all, setAll] = useState<PackageType[]>([]);
  const [filters, setFilters] = useState<PackageTypeFilters>(emptyFilters);

  const [rows, setRows] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(all.length);

  const activeFiltersCount = useMemo(() => {
    return [
      filters.nombre.trim() !== "",
      filters.regla !== "",
      filters.valor != null,
      filters.material.trim() !== "",
      filters.retornable != null,
      filters.usosMaximos != null,
    ].filter(Boolean).length;
  }, [filters]);

  const activeFiltersLabel = useMemo(() => {
    return activeFiltersCount === 1 ? "1 filtro activo" : `${activeFiltersCount} filtros activos`;
  }, [activeFiltersCount]);

  const availableRules = useMemo(
    () => Array.from(new Set(all.map((item) => item.regla).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [all]
  );

  const loadPackageTypes = useCallback(async () => {
    setLoading(true);
    try {
      const pageSize = 200;
      let page = 1;
      let total = 0;
      const aggregated: PackageTypeApiItem[] = [];

      do {
        const payload = await fetchWithAuthQA<PackageTypeApiResponse>(`${PACKAGE_TYPES_API}?page=${page}&pageSize=${pageSize}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!payload?.ok) {
          throw new Error("El endpoint de tipos de paquete respondió sin éxito.");
        }

        total = Number(payload.total ?? 0);
        aggregated.push(...(payload.items ?? []));
        page += 1;
      } while (aggregated.length < total);

      setAll(aggregated.map(mapApiItemToPackageType));
    } catch (error) {
      console.error("Error cargando tipos de paquete:", error);
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuthQA]);

  useEffect(() => {
    loadPackageTypes();
  }, [loadPackageTypes]);

  /* listar + filtros + paginación */
  const fetchList = useCallback(() => {
    let filtered = [...all];

    if (filters.nombre.trim()) {
      const q = filters.nombre.toLowerCase();
      filtered = filtered.filter((r) => r.nombre.toLowerCase().includes(q));
    }
    if (filters.regla) filtered = filtered.filter((r) => r.regla === filters.regla);
    if (filters.valor != null && filters.valor !== undefined) filtered = filtered.filter((r) => r.valor === filters.valor);
    if (filters.material.trim()) {
      const q = filters.material.toLowerCase();
      filtered = filtered.filter((r) => r.material.toLowerCase().includes(q));
    }
    if (filters.retornable != null && filters.retornable !== undefined)
      filtered = filtered.filter((r) => r.retornable === filters.retornable);
    if (filters.usosMaximos != null && filters.usosMaximos !== undefined)
      filtered = filtered.filter((r) => r.usosMaximos === filters.usosMaximos);

    const total = filtered.length;
    setTotalRecords(total);
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    setTotalPages(pages);
    const start = (currentPage - 1) * PER_PAGE;
    const pageRows = filtered.slice(start, start + PER_PAGE);
    setRows(pageRows);
  }, [all, filters, currentPage]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const applyFilters = (id: keyof PackageTypeFilters, raw: string) => {
    let parsed: string | number | boolean | undefined = raw;
    if (id === "valor" || id === "usosMaximos") {
      if (raw.trim() === "") {
        parsed = undefined;
      } else {
        const numericValue = Number(raw);
        parsed = Number.isNaN(numericValue) ? undefined : numericValue;
      }
    }
    if (id === "retornable") parsed = raw === "" ? undefined : raw === "true";
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [id]: parsed }));
  };

  const clearFilters = useCallback(() => {
    setCurrentPage(1);
    setFilters(emptyFilters);
  }, []);

  const goToPage = (page: number) => setCurrentPage((_) => clamp(page, 1, totalPages));

  /* acciones header */
  const handleExport = useCallback(() => {
    const headers = [
      "Nombre",
      "Regla",
      "Valor",
      "Material",
      "Retornable",
      "Usos máximos",
      "Costo de adquisición",
      "Default",
      "Estado",
    ];
    const data = (rows.length ? rows : all).map((p) => [
      p.nombre,
      p.regla,
      String(p.valor),
      p.material,
      p.retornable ? "Sí" : "No",
      String(p.usosMaximos),
      p.costoAdquisicion?.toString() ?? "",
      p.isDefault ? "Sí" : "No",
      statusText(p.status),
    ]);
    exportToCsv("tipos_de_paquete.csv", [headers, ...data]);
  }, [rows, all]);

  const headerActions: Action[] = useMemo(
    () => [
      { label: "Nuevo", variant: "success", onClick: () => router.push("/picking/packing/tipos-de-paquetes/nuevo"), icon: <PlusIcon className="h-5 w-5" /> },
      { label: "Exportar", variant: "primary", onClick: handleExport, icon: <ArrowDownTrayIcon className="h-5 w-5" /> },
      { label: "Actualizar", variant: "secondary", onClick: () => loadPackageTypes(), icon: <ArrowPathIcon className="h-5 w-5" /> },
    ],
    [router, handleExport, loadPackageTypes]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Tipos de paquete"
        action={headerActions}
        filters={getFiltersConfig(filters, availableRules)}
        onFilterChange={(id, v) => applyFilters(id as keyof PackageTypeFilters, v)}
        filtersRight={(
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <span className={`h-1.5 w-1.5 rounded-full ${activeFiltersCount > 0 ? "bg-indigo-500" : "bg-slate-400"}`} />
              {activeFiltersLabel}
            </span>
            <ClearFiltersButton onClick={clearFilters} disabled={activeFiltersCount === 0} />
          </div>
        )}
        filtersGridClassName="lg:pr-72"
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <DataTable
            data={rows}
            columns={columns}
            dataType="General"
            statusKey="status"
            rowPaddingY={20}
            showStatusBorder
            rowBgClass="bg-white"
            onRowClick={(row: PackageType) => router.push(`/picking/packing/tipos-de-paquetes/${row.id}`)}
          />

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

/* Fuente original (mock/datos): se mantuvo sin cambios y solo se modernizó la vista. */ // :contentReference[oaicite:1]{index=1}
