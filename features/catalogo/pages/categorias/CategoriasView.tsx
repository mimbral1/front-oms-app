"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { getEstadoColor } from "@/utils/status";
import { Avatar } from "@/components/ui/user-avatar";
import { type EndpointConfig, type FilterConfig, useStandardFilters } from "@/lib/filters";

const CAT_ENDPOINT = "catalog/getcategorytree";

interface APICategoryItem {
  name: string;
  reference: string;
  nameTree: string;
  date_modified: string | null;
  user_modified: string | null;
  status: string;
}

interface PaginatedCategoryAPIResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: APICategoryItem[];
}

interface Category {
  id: string;
  name: string;
  reference: string;
  tree: string;
  parent: string;
  dateModified: string;
  userModified: string;
  status: string;
}

interface CategoryFilters {
  name: string;
  reference: string;
  parent: string;
}

const removeAccents = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N");

const getStatusColor = getEstadoColor;

function getColumns() {
  return [
    {
      header: "Nombre",
      accessorKey: "name",
      cell: (row: Category) => <span>{row.name}</span>,
    },
    {
      header: "Reference",
      accessorKey: "reference",
      cell: (row: Category) => <CopyableText text={row.reference}>{row.reference}</CopyableText>,
    },
    {
      header: "Árbol de nombres",
      accessorKey: "tree",
      cell: (row: Category) => <span>{row.tree}</span>,
    },
    {
      header: "Fecha de modificación",
      accessorKey: "dateModified",
      cell: (row: Category) => <span>{row.dateModified || "--"}</span>,
    },
    {
      header: "Usuario modificador",
      accessorKey: "userModified",
      cell: (row: Category) =>
        row.userModified ? (
          <div className="flex items-center gap-2 text-sm">
            <Avatar name={row.userModified} alt={row.userModified} className="h-7 w-7" />
            <span>{row.userModified}</span>
          </div>
        ) : (
          <span>--</span>
        ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row: Category) => (
        <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium text-white ${getStatusColor(row.status)}`}>
          {row.status}
        </div>
      ),
    },
  ];
}

const initialFilters: CategoryFilters = {
  name: "",
  reference: "",
  parent: "",
};

export function CategoriasView() {
  const router = useRouter();
  const { token } = useAuth();
  const { fetchWithAuth } = useFetchWithAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [parentOptions, setParentOptions] = useState<{ label: string; value: string }[]>([]);

  const filterConfig = useMemo<FilterConfig<CategoryFilters>[]>(
    () => [
      {
        id: "name",
        label: "Nombre",
        type: "text",
        queryParam: "buscarname",
      },
      {
        id: "reference",
        label: "Reference",
        type: "text",
        queryParam: "buscarreference",
      },
      {
        id: "parent",
        label: "Árbol de nombres",
        type: "select-search",
        options: parentOptions,
        queryParam: "buscarnametree",
        mapQueryValue: (value) => (value ? removeAccents(String(value)) : undefined),
      },
    ],
    [parentOptions]
  );

  const { headerFilters, handleFilterChange, buildUrl } = useStandardFilters<CategoryFilters>({
    initialFilters,
    configs: filterConfig,
  });

  const fetchParentOptions = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchWithAuth<PaginatedCategoryAPIResponse>(`${CAT_ENDPOINT}?pageSize=9999`);
      const uniqueParents = new Set<string>();
      data.data.forEach((item) => {
        const parts = item.nameTree.split(" > ");
        if (parts.length > 0 && parts[0]) uniqueParents.add(parts[0]);
      });

      setParentOptions(Array.from(uniqueParents).sort().map((parent) => ({ label: parent, value: parent })));
    } catch (error) {
      console.error("Error al cargar opciones de padres:", error);
      setParentOptions([]);
    }
  }, [token, fetchWithAuth]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const endpointConfig: EndpointConfig<CategoryFilters> = {
        path: CAT_ENDPOINT,
        pagination: { page: currentPage, pageSize },
      };

      const data = await fetchWithAuth<PaginatedCategoryAPIResponse>(buildUrl(endpointConfig));
      const mappedData: Category[] = data.data.map((item) => ({
        id: item.reference,
        name: item.name,
        reference: item.reference,
        tree: item.nameTree,
        parent: item.nameTree.split(" > ")[0] || "N/A",
        dateModified: item.date_modified ? new Date(item.date_modified).toLocaleDateString("es-ES") : "N/A",
        userModified: item.user_modified || "N/A",
        status: item.status === "Active" ? "Activo" : "Inactivo",
      }));

      setCategories(mappedData);
      setTotalRecords(typeof data.total === "number" ? data.total : 0);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(`Error al cargar categorías: ${err?.message ?? String(err)}`);
      setCategories([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [token, fetchWithAuth, currentPage, pageSize, buildUrl]);

  useEffect(() => {
    if (!token) return;
    fetchParentOptions();
  }, [token, fetchParentOptions]);

  useEffect(() => {
    if (!token) return;
    fetchCategories();
  }, [token, fetchCategories]);

  const handleRefresh = () => {
    fetchCategories();
    fetchParentOptions();
  };

  const handleExport = () => {
    const headers = ["Nombre", "Referencia", "Árbol", "Fecha modificación", "Usuario modificación", "Estado"];
    const rows = categories.map((category) => [
      category.name,
      category.reference,
      category.tree,
      category.dateModified,
      category.userModified,
      category.status,
    ]);
    exportToCsv("categorias.csv", [headers, ...rows]);
  };

  const headerActions: Action[] = [
    {
      label: "Actualizar",
      variant: "secondary",
      onClick: handleRefresh,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary",
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
    {
      label: "Crear",
      variant: "success",
      onClick: () => router.push("/catalogo/categorias/new"),
      icon: <PlusIcon className="h-5 w-5" />,
    },
  ];

  const columns = useMemo(() => getColumns(), []);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title="Buscar por Categoría"
        description=""
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, value);
        }}
        action={headerActions}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl shadow-sm">
            {loading ? (
              <div className="bg-white p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-4 rounded bg-gray-200"></div>
                  <div className="h-4 w-5/6 rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-4 rounded bg-gray-200"></div>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700 shadow-sm" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Error al cargar datos</h3>
                    <p className="mt-2 text-sm">{error}</p>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
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
              </div>
            ) : (
              <DataTable
                data={categories}
                dataType="General2"
                statusKey="status"
                columns={columns as any}
                rowBgClass="bg-white"
                rowPaddingY={12}
                onRowClick={(row: Category) => router.push(`/catalogo/categorias/${row.id}`)}
              />
            )}
          </div>

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
