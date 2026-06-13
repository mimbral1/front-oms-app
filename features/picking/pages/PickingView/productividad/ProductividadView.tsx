"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductividadStore } from "@/features/picking/stores/productividad";
import { mockProductividad } from "@/data/mocks/productividad";
import { Productividad } from "@/features/picking/types/productividad";
import { PageHeader } from "@/components/layout/page-header";
import { ProductividadFilters } from "@/features/picking/types/productividad";
import { ArrowPathIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { EyeIcon } from "@heroicons/react/24/outline";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format/date";

interface ProductividadTableProps {
  productividad: Productividad[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewClick: (prod: Productividad) => void;
}

export function ProductividadTable({
  productividad,
  currentPage,
  totalPages,
  onPageChange,
  onViewClick,
}: ProductividadTableProps) {
  const columns = getProductividadColumns(onViewClick);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <DataTable columns={columns as any} data={productividad as any} />
      </div>
      {productividad.length > 0 && (
        <div className="flex flex-col items-center gap-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
          <div className="text-sm text-gray-500">
            {productividad.length} resultados
          </div>
        </div>
      )}
    </div>
  );
}

export function getProductividadFilters(filters: ProductividadFilters) {
  return [
    {
      id: "picker",
      label: "Picker",
      type: "text" as const,
      value: filters.picker ?? "",
    },
    {
      id: "pickingPoint",
      label: "Picking point",
      type: "select" as const,
      value: filters.pickingPoint ?? "",
      options: [
        { label: "Picking point", value: "" },
        { label: "Belgrano", value: "Belgrano" },
        { label: "Palermo", value: "Palermo" },
      ],
    },
    {
      id: "fechaInicio",
      label: "Fecha inicio",
      type: "datetime" as const,
      value: filters.fechaInicio ?? "",
    },
    {
      id: "fechaFin",
      label: "Fecha fin",
      type: "datetime" as const,
      value: filters.fechaFin ?? "",
    },
  ];
}

export function getProductividadColumns(
  onViewClick: (prod: Productividad) => void
): Array<{
  accessorKey: keyof Productividad;
  header: string;
  cell?: (prod: Productividad) => React.ReactNode;
}> {
  return [
    {
      accessorKey: "picker",
      header: "Picker",
      cell: (prod) => prod.picker,
    },
    {
      accessorKey: "pickingPoint",
      header: "Picking point",
      cell: (prod) => prod.pickingPoint,
    },
    {
      accessorKey: "fechaInicio",
      header: "Fecha inicio",
      cell: (prod) => {
        const { date: f, time: h } = formatDateTime(prod.fechaInicio, {
          locale: "es-ES",
          timeZone: "America/Santiago",
        });
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">{f}</span>
            <span className="text-gray-600">{h}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "fechaFin",
      header: "Fecha fin",
      cell: (prod) => {
        const { date: f, time: h } = formatDateTime(prod.fechaFin, {
          locale: "es-ES",
          timeZone: "America/Santiago",
        });
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">{f}</span>
            <span className="text-gray-600">{h}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "pedidosCompletados",
      header: "Pedidos completados",
      cell: (prod) => prod.pedidosCompletados,
    },
    {
      accessorKey: "itemsProcesados",
      header: "Items procesados",
      cell: (prod) => prod.itemsProcesados,
    },
    {
      accessorKey: "tiempoPromedio",
      header: "Tiempo promedio",
      cell: (prod) => prod.tiempoPromedio,
    },
    {
      accessorKey: "eficiencia",
      header: "Eficiencia",
      cell: (prod) => {
        const eficiencia = prod.eficiencia ?? 0;
        return (
          <div className="flex items-center">
            <span
              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${eficiencia >= 90
                ? "bg-green-100 text-green-800"
                : eficiencia >= 70
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
                }`}
            >
              {eficiencia}%
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "id",
      header: "Acciones",
      cell: (prod) => (
        <button
          onClick={() => onViewClick(prod)}
          className="text-blue-600 hover:text-blue-900"
        >
          <EyeIcon className="h-5 w-5" />
        </button>
      ),
    },
  ];
}

export function getProductividadActions(
  onRefresh: () => void,
  onExport: () => void
) {
  return [
    {
      label: "Actualizar",
      variant: "secondary" as const,
      onClick: onRefresh,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: onExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />
    },
  ];
}

const ITEMS_PER_PAGE = 5;

export default function ProductividadView() {
  const router = useRouter();
  const { productividad, filters, setProductividad, setFilters } =
    useProductividadStore();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setProductividad(mockProductividad);
  }, [setProductividad]);

  const handleFilterChange = (id: string, value: string) => {
    setFilters({ [id]: value });
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setProductividad(mockProductividad);
  };

  const handleExport = () => {
    // Implementar lógica de exportación
  };

  const handleViewClick = (prod: Productividad) => {
    router.push(`/picking/productividad/${prod.id}`);
  };

  // Aplicar filtros
  const filteredProductividad = productividad.filter((prod: Productividad) => {
    const matchPicker =
      !filters.picker ||
      prod.picker.toLowerCase().includes(filters.picker.toLowerCase());
    const matchPickingPoint =
      !filters.pickingPoint || prod.pickingPoint === filters.pickingPoint;

    // Convertir fechas para comparación
    const prodInicio = new Date(prod.fechaInicio);
    const prodFin = new Date(prod.fechaFin);
    const filterInicio = filters.fechaInicio
      ? new Date(filters.fechaInicio)
      : null;
    const filterFin = filters.fechaFin ? new Date(filters.fechaFin) : null;

    const matchFechaInicio = !filterInicio || prodInicio >= filterInicio;
    const matchFechaFin = !filterFin || prodFin <= filterFin;

    return (
      matchPicker && matchPickingPoint && matchFechaInicio && matchFechaFin
    );
  });

  const totalPages = Math.ceil(filteredProductividad.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProductividad = filteredProductividad.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const dataFilters = getProductividadFilters(filters);
  const headerActions = getProductividadActions(handleRefresh, handleExport);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Productividad de picking"
        filters={dataFilters}
        onFilterChange={handleFilterChange}
        action={headerActions}
      />
      <div className="flex-1 p-6">
        <ProductividadTable
          productividad={paginatedProductividad}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onViewClick={handleViewClick}
        />
      </div>
    </div>
  );
}

