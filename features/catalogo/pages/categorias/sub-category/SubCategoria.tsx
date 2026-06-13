"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Avatar } from "@/components/ui/user-avatar";

// Tipo para el icono SaveWithPlusIcon
const TypedFaPlus = FaPlus as unknown as React.FC<
  React.SVGProps<SVGSVGElement>
>;
const SaveWithPlusIcon = () => (
  <div className="relative flex h-5 w-5 items-center justify-center">
    <SaveOutlined className="h-4 w-4 text-current" />
    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
      <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
    </div>
  </div>
);

// Interfaz para un elemento de categoría de la API
interface APICategoryItem {
  name: string;
  reference: string;
  nameTree: string;
  date_modified: string | null;
  user_modified: string | null;
  status: string;
}

// Interfaz para la respuesta paginada de la API
interface PaginatedCategoryAPIResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: APICategoryItem[];
}

// Interfaz para los datos de la tabla
interface SubCategory {
  id: string;
  name: string;
  reference: string;
  tree: string;
  dateModified: string;
  userModified: string;
  status: string;
}

// Función auxiliar para quitar tildes
const removeAccents = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N");
};

// Vista principal de Subcategorías (Categorías Hijas)
export function SubCategoryView() {
  const router = useRouter();
  const { id } = useParams();
  const { fetchWithAuth } = useFetchWithAuth();
  const { token } = useAuth();

  const [parentName, setParentName] = useState<string | null>(null);
  const [parentStatus, setParentStatus] = useState<string>("Inactive");
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(60);
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Obtener nombre del padre y luego las subcategorías
  const fetchData = useCallback(async () => {
    if (!id || !token) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener la categoría padre para saber su nombre
      const parentUrl = `catalog/getcategorytree?buscarreference=${id}&pageSize=1`;
      const parentResponse = await fetchWithAuth<PaginatedCategoryAPIResponse>(parentUrl);

      if (!parentResponse.data || parentResponse.data.length === 0) {
        setError("Categoría padre no encontrada.");
        setLoading(false);
        return;
      }

      const parentItem = parentResponse.data[0];
      setParentName(parentItem.name);
      setParentStatus(
        parentItem.status === "Active" || parentItem.status === "Activo" || parentItem.status === "Y"
          ? "Active"
          : "Inactive"
      );

      // 2. Buscar subcategorías usando el nombre del padre en el nameTree
      const queryParams = new URLSearchParams();
      queryParams.append("page", currentPage.toString());
      queryParams.append("pageSize", pageSize.toString());
      queryParams.append("buscarnametree", removeAccents(parentItem.name));

      const url = `catalog/getcategorytree?${queryParams.toString()}`;
      const apiResponse = await fetchWithAuth<PaginatedCategoryAPIResponse>(url);

      if (!Array.isArray(apiResponse.data)) {
        throw new Error("La respuesta de la API no contiene un array de datos válido.");
      }

      // Filtrar para excluir la categoría padre misma (solo mostrar hijas)
      const childData: SubCategory[] = apiResponse.data
        .filter((item) => item.reference !== id)
        .map((item) => ({
          id: item.reference,
          name: item.name,
          reference: item.reference,
          tree: item.nameTree,
          dateModified: item.date_modified
            ? new Date(item.date_modified).toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
            : "--",
          userModified: item.user_modified || "--",
          status:
            item.status === "Active" || item.status === "Activo" || item.status === "Y"
              ? "Activo"
              : "Inactivo",
        }));

      setSubcategories(childData);
      // El total puede incluir el padre, ajustar si fue filtrado
      const parentInResults = apiResponse.data.some((item) => item.reference === id);
      setTotalRecords(parentInResults ? apiResponse.total - 1 : apiResponse.total);
    } catch (err: any) {
      console.error("Error al cargar categorías hijas:", err);
      setError(err.message || "Error al cargar categorías hijas.");
      setSubcategories([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [id, token, currentPage, pageSize, fetchWithAuth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Acciones del header
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "primary",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => { },
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Guardar y crear",
        variant: "primary",
        onClick: () => { },
        icon: <SaveWithPlusIcon />,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => window.history.back(),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    []
  );

  // Inyectar encabezado
  usePageHeader(
    () => ({
      title: parentName || "Cargando...",
      action: headerActions,
      status: {
        text: parentStatus === "Active" ? "Activo" : "Inactivo",
        variant: parentStatus === "Active" ? "success" : "warning",
      },
    }),
    [parentName, parentStatus, headerActions]
  );

  // Columnas de la tabla
  const columns = useMemo(
    () => [
      {
        header: "Nombre",
        accessorKey: "name",
        cell: (row: SubCategory) => (
          <span
            onClick={() => router.push(`/catalogo/categorias/${row.id}`)}
            className="cursor-pointer text-gray-700 hover:text-blue-600"
          >
            {row.name}
          </span>
        ),
      },
      {
        header: "Referencia",
        accessorKey: "reference",
        cell: (row: SubCategory) => <span>{row.reference}</span>,
      },
      {
        header: "Árbol de nombres",
        accessorKey: "tree",
        cell: (row: SubCategory) => <span>{row.tree}</span>,
      },
      {
        header: "Fecha de modificación",
        accessorKey: "dateModified",
        cell: (row: SubCategory) => <span>{row.dateModified}</span>,
      },
      {
        header: "Usuario modificador",
        accessorKey: "userModified",
        cell: (row: SubCategory) => (
          row.userModified ? (
            <div className="flex items-center gap-2 text-sm">
              <Avatar name={row.userModified} alt={row.userModified} className="h-7 w-7" />
              <span>{row.userModified}</span>
            </div>
          ) : <span>--</span>
        ),
      },
      {
        header: "Estado",
        accessorKey: "status",
        cell: (row: SubCategory) => {
          const color = row.status === "Activo" ? "bg-green-500" : "bg-gray-400";
          return (
            <div
              className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium text-white ${color}`}
            >
              {row.status}
            </div>
          );
        },
      },
    ],
    [router]
  );

  if (loading) {
    return (
      <p className="p-4 text-center text-gray-500">
        Cargando categorías hijas...
      </p>
    );
  }

  if (error) {
    return <p className="p-4 text-center text-red-500">Error: {error}</p>;
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="overflow-hidden rounded-xl shadow-sm">
        <DataTable
          data={subcategories}
          dataType="General2"
          statusKey="status"
          columns={columns as any}
          rowBgClass="bg-white"
          rowPaddingY={8}
        />
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-sm text-gray-500">
          {totalRecords} {totalRecords === 1 ? "Resultado" : "Resultados"}{" "}
          <span className="ml-2 text-gray-400">{pageSize} Por página</span>
        </div>
        {totalRecords > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
