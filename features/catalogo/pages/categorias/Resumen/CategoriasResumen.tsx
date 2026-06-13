"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { DetailFields, category } from "@/features/catalogo/components/categorias/DetailFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";

// Interfaz para la respuesta de la API al obtener una sola categoría
interface APISingleCategoryResponse {
  name: string;
  reference: string;
  nameTree: string;
  date_modified: string | null;
  user_modified: string | null;
  status: "Activo" | "Inactivo" | "Y" | "N" | string;
}

// Para el ícono + con tipado
const TypedFaPlus = FaPlus as unknown as React.FC<
  React.SVGProps<SVGSVGElement>
>;
export const SaveWithPlusIcon = () => (
  <div className="relative flex h-5 w-5 items-center justify-center">
    <SaveOutlined className="h-4 w-4 text-current" />
    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
      <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
    </div>
  </div>
);

// Categoría por defecto para estado inicial
const defaultCategory: category = {
  id: "",
  name: "Cargando...",
  reference: "",
  parent: "",
  Icategories: [],
  parentLink: "",
  accounts: [],
  slug: "",
  status: "Inactive",
  creatorUser: "",
  createdAt: "",
  updateAt: "",
};

export function CategoryDetailView() {
  const { id } = useParams();
  const { fetchWithAuth } = useFetchWithAuth();
  const { token } = useAuth();

  const [categoryData, setCategoryData] = useState<category>(defaultCategory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener la categoría desde la API
  const fetchCategoryDetails = useCallback(async () => {
    if (!id) {
      setError("ID de categoría no proporcionado.");
      setLoading(false);
      return;
    }
    if (!token) return; // Esperar token

    setLoading(true);
    setError(null);

    try {
      const url = `catalog/getcategorytree?buscarreference=${id}&pageSize=1`;
      const data = await fetchWithAuth<{ data: APISingleCategoryResponse[] }>(
        url
      );

      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        setCategoryData({
          id: item.reference,
          name: item.name,
          reference: item.reference,
          parent: item.nameTree.split(" > ")[0] || "N/A",
          Icategories: [],
          parentLink: "",
          accounts: [],
          slug: "",
          status:
            item.status === "Active" || item.status === "Y"
              ? "Active"
              : "Inactive",
          creatorUser: item.user_modified || "N/A",
          createdAt: "N/A",
          updateAt: item.date_modified
            ? new Date(item.date_modified).toLocaleString("es-ES")
            : "N/A",
        });
      } else {
        setError("Categoría no encontrada.");
        setCategoryData(defaultCategory);
      }
    } catch (err: any) {
      console.error("Error al cargar detalles de la categoría:", err);
      setError(`Error al cargar la categoría: ${err.message}`);
      setCategoryData(defaultCategory);
    } finally {
      setLoading(false);
    }
  }, [id, token, fetchWithAuth]);

  useEffect(() => {
    fetchCategoryDetails();
  }, [fetchCategoryDetails]);

  const handleChange = <K extends keyof category>(
    field: K,
    value: category[K]
  ) => {
    setCategoryData((prev) => ({ ...prev, [field]: value }));
  };

  // Definir acciones del header
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
      title: categoryData.name,
      action: headerActions,
      status: {
        text: categoryData.status === "Active" ? "Activo" : "Inactivo",
        variant:
          categoryData.status === "Active" ? "success" : "warning",
      },
    }),
    [categoryData.name, categoryData.status, headerActions]
  );

  if (loading) {
    return (
      <p className="p-4 text-center text-gray-500">
        Cargando detalles de la categoría...
      </p>
    );
  }

  if (error) {
    return (
      <p className="p-4 text-center text-red-500">Error: {error}</p>
    );
  }

  return <DetailFields category={categoryData} onChange={handleChange} />;
}
