"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { auditoriaMock } from "@/data/mocks/auditorias";
import { Auditoria } from "@/features/auditorias/types/auditorias";
import { useRouter } from "next/navigation";

export function AuditoriasView() {
  const router = useRouter();
  // Estado local para la data y los filtros
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  //const { error, refetch } = useFetchAuditorias();
  //const { auditorias, filters, setFilters, setAuditorias } = useAuditoriasStore();
  const [filters, setFilters] = useState({
    id: "",
    entidad: "",
    refId: "",
    idEntidad: "",
  });

  useEffect(() => {
    setAuditorias(auditoriaMock);
  }, []);
  const estadoColorMap: Record<string, string> = {
    Finalizada: "bg-[#28a745] text-white", // ✅ Verde
    "En curso": "bg-[#007bff] text-white", // ✅ Azul
    Corregir: "bg-[#d6d6d6] text-black", // ✅ Gris (con texto negro para mejor visibilidad)
    Error: "bg-[#dc3545] text-white", // ✅ Rojo
  };

  // Acciones de encabezado
  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => alert("Crear nueva auditoría"),
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: () => alert("Exportar CSV/Excel"),
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
  ];

  // Filtros para PageHeader
  const dataFilters = [
    {
      id: "id",
      label: "ID Auditoría",
      type: "text" as const,
      value: filters.id || "",
    },
    {
      id: "entidad",
      label: "Entidad",
      type: "text" as const,
      value: filters.entidad || "",
    },
    {
      id: "refId",
      label: "Ref ID",
      type: "text" as const,
      value: filters.refId || "",
    },
    {
      id: "idEntidad",
      label: "ID Entidad",
      type: "text" as const,
      value: filters.idEntidad || "",
    },
  ];

  // Maneja cambios de filtros
  /* const handleFilterChange = (id: string, value: string) => {
    setFilters({ [id]: value });
  }; */
  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev, // copiamos todas las props anteriores
      [field]: value, // sólo actualizamos la que cambió
    }));
  };
  //240523-7VYBM7
  // Definimos las columnas de la tabla
  const columns: Column<Auditoria>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: (row) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            router.push(
              `/pedidos/auditorias/all/${encodeURIComponent(row.id)}`
            );
          }}
          className="cursor-pointer"
        >
          <span className="text-sm font-medium text-gray-900">{row.id}</span>
        </div>
      ),
    },
    {
      accessorKey: "entidad",
      header: "Entidad",
      cell: (row) => (
        <span className="text-sm text-blue-600 font-medium">{row.entidad}</span>
      ),
    },
    {
      accessorKey: "refId",
      header: "Ref ID",
      cell: (row) => (
        <span className="text-sm text-gray-900">{row.refId ?? "-"}</span>
      ),
    },
    {
      accessorKey: "idEntidad",
      header: "ID Entidad",
      cell: (row) => (
        <span className="text-sm text-gray-900">{row.idEntidad}</span>
      ),
    },
    {
      accessorKey: "inventario",
      header: "Inventario",
      cell: (row) => (
        <span className="text-sm text-blue-600 font-medium">
          {row.inventario}
        </span>
      ),
    },
    {
      accessorKey: "controlador",
      header: "Controlador",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
            {row.controlador.avatar}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {row.controlador.name}
            </span>
            <span className="text-xs text-gray-500">
              {row.controlador.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (row) => {
        const bgColor = estadoColorMap[row.estado] || "bg-gray-400 text-black"; // Usa el mapa de colores

        return (
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${bgColor}`}
          >
            {row.estado}
          </span>
        );
      },
    },
  ];

  // Filtrar en base a los valores de `filters`
  const filteredAuditorias = auditorias.filter((audit) => {
    // Filtra por ID
    const matchId =
      !filters.id || audit.id.toLowerCase().includes(filters.id.toLowerCase());

    // Filtra por Entidad
    const matchEntidad =
      !filters.entidad ||
      audit.entidad.toLowerCase().includes(filters.entidad.toLowerCase());

    // Filtra por Ref ID
    const matchRefId =
      !filters.refId ||
      (audit.refId?.toLowerCase().includes(filters.refId.toLowerCase()) ??
        false);

    // Filtra por ID Entidad
    const matchIdEntidad =
      !filters.idEntidad ||
      audit.idEntidad.toLowerCase().includes(filters.idEntidad.toLowerCase());

    return matchId && matchEntidad && matchRefId && matchIdEntidad;
  });

  return (
    <div className="flex flex-col bg-page-bg min-h-screen">
      <PageHeader
        title="Control de pedidos"
        action={headerActions}
        filters={dataFilters}
        onFilterChange={handleFilterChange}
      />

      <div className="p-6 flex-1">
        <DataTable<Auditoria>
          data={filteredAuditorias}
          columns={columns}
          showStatusBorder
          rowBgClass="bg-white"
          rowGap={4}
        />
      </div>
    </div>
  );
}
