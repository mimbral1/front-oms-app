"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePickingStore } from "../../../stores/rondas";
/* import { mockRondas } from "@/data/mocks/rondas"; */
import { RondaPicking } from "@/features/picking/types/rondas";
import { PageHeader } from "@/components/layout/page-header";
import { PlusIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { StatusBadge } from "@/components/ui/badge/status";
import { PickingFilters } from "@/features/picking/types/rondas";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/ui/table";
import { useFetchRondas } from "@/features/picking/hooks/useFetchRondas";
import { formatDateTime } from "@/lib/format/date";

const ITEMS_PER_PAGE = 5;

const getStatusVariant = (status: RondaPicking["status"]) => {
  switch (status) {
    case "Pickeada":
      return "success";
    case "Pendiente":
      return "warning";
    default:
      return "info";
  }
};

interface PickingTableProps {
  rondas: RondaPicking[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (ronda: RondaPicking) => void;
}

export function PickingTable({
  rondas,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
}: PickingTableProps) {
  const columns = getPickingColumns(onRowClick);

  return (
    <div className="space-y-6">
      <DataTable
        data={rondas}
        columns={columns}
        onRowClick={onRowClick}
        dataType="picking"
        rowBgClass="bg-white"
      />

      <div className="flex flex-col items-center gap-4">
        {rondas.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
        <div className="text-sm text-gray-500">{rondas.length} resultados</div>
      </div>
    </div>
  );
}

export const getPickingFilters = (filters: PickingFilters) => [
  {
    id: "pickingPoint",
    label: "Punto de picking",
    type: "text" as const,
    value: filters.pickingPoint || "",
  },
  {
    id: "picker",
    label: "Picker",
    type: "text" as const,
    value: filters.picker || "",
  },
  {
    id: "status",
    label: "Estado",
    type: "select" as const,
    value: filters.status || "",
    options: [
      { label: "Todos los estados", value: "" },
      { label: "Pickeada", value: "Pickeada" },
      { label: "Pendiente", value: "Pendiente" },
    ],
  },
];
// Quita el split y usa la función que formatea ISO a [fecha, hora].
/* const formatDateTime = (isoString: string | null | undefined) => {
  if (!isoString) return ["Sin datos", ""];

  const date = new Date(isoString);
  return [
    // Fecha: DD/MM/YYYY
    date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    // Hora: HH:mm:ss
    date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  ];
}; */

const DataBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="
      inline-flex 
      items-center 
      gap-2 
      px-3 
      py-1 
      text-sm 
      font-medium 
      text-gray-700 
      bg-gray-100
      border 
      border-gray-300 
      rounded-full 
      shadow-sm
      max-w-[150px]   /* Evita que crezca más de 150px */
      whitespace-nowrap 
      overflow-hidden 
      text-ellipsis
    "
    >
      {children}
    </div>
  );
};

export const getPickingColumns = (
  onRowClick: (ronda: RondaPicking) => void
) => [
    {
      header: "Display ID",
      accessorKey: "id" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(ronda);
          }}
          className="cursor-pointer"
        >
          <p className="font-semibold text-gray-900">{ronda.id}</p>
        </div>
      ),
    },
    {
      header: "Picking Point",
      accessorKey: "pickingPoint" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => (
        <div className="cursor-pointer">
          <p className="text-sm text-gray-600">{ronda.pickingPoint}</p>
        </div>
      ),
    },
    {
      header: "Ola",
      accessorKey: "ola" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => (
        <p className="text-sm font-medium text-gray-900">{ronda.ola}</p>
      ),
    },
    {
      header: "Picker",
      accessorKey: "picker" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => (
        <DataBadge>
          <UserCircleIcon className="h-6 w-6 text-gray-400" />
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{ronda.picker}</span>
            <span className="text-xs text-gray-500">{ronda.pickerEmail}</span>
          </div>
        </DataBadge>
      ),
    },
    {
      header: "Pedidos",
      accessorKey: "pedidos" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => <DataBadge>{ronda.pedidos}</DataBadge>,
    },
    {
      header: "Productos",
      accessorKey: "products" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => <DataBadge>{ronda.productos}</DataBadge>,
    },
    {
      header: "Items",
      accessorKey: "items" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => <DataBadge>{ronda.items}</DataBadge>,
    },
    {
      header: "Ítems Faltantes",
      accessorKey: "faltantes" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => (
        <DataBadge>{ronda.itemsFaltantes}</DataBadge>
      ),
    },
    {
      header: "Completado",
      accessorKey: "completado" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => <DataBadge>{ronda.completado}</DataBadge>,
    },
    {
      header: "Creación",
      accessorKey: "creacion" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => {
        // ✔ Usamos la función de formateo
        const [fecha, hora] = formatDateTime(ronda.creacion).parts;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">{fecha}</span>
            <span className="text-gray-600">{hora}</span>
          </div>
        );
      },
    },
    {
      header: "Modificado",
      accessorKey: "modificado" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => {
        // ✔ Usamos la función de formateo
        const [fecha, hora] = formatDateTime(ronda.modificado).parts;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">{fecha}</span>
            <span className="text-gray-600">{hora}</span>
          </div>
        );
      },
    },

    {
      header: "Estado",
      accessorKey: "status" as keyof RondaPicking,
      cell: (ronda: RondaPicking) => (
        <div className="flex justify-end">
          <StatusBadge
            status={ronda.status}
            variant={getStatusVariant(ronda.status)}
          />
        </div>
      ),
    },
  ];

export const getPickingActions = (onCreateRonda: () => void) => [
  {
    label: "Crear ronda",
    variant: "success" as const,
    onClick: onCreateRonda,
    icon: <PlusIcon className="h-5 w-5" />,
  },
];

export default function PickingView() {
  const router = useRouter();
  const { error, refetch } = useFetchRondas();
  const { rondas, filters, setFilters, setRondas } = usePickingStore();
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (id: string, value: string) => {
    setFilters({ [id]: value });
    setCurrentPage(1);
    refetch(); // Refresca los datos filtrados
  };
  const handleCreateRonda = () => {
    // Implementar lógica para crear nueva ronda
  };

  const handleRowClick = (ronda: RondaPicking) => {
    const path = `/picking/rondas/${encodeURIComponent(ronda.id)}`;
    const queryString = `?waveID=${encodeURIComponent(ronda.ola)}`; // Ensure ronda.ola is also encoded if it can contain special characters
    router.push(`${path}${queryString}`);
  };

  const filteredRondas = rondas.filter((ronda) => {
    const matchPickingPoint =
      !filters.pickingPoint || ronda.pickingPoint === filters.pickingPoint;
    const matchPicker =
      !filters.picker ||
      ronda.picker.toLowerCase().includes(filters.picker.toLowerCase());
    const matchStatus = !filters.status || ronda.status === filters.status;
    return matchPickingPoint && matchPicker && matchStatus;
  });

  const totalPages = Math.ceil(filteredRondas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRondas = filteredRondas.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const dataFilters = getPickingFilters(filters);
  const headerActions = getPickingActions(handleCreateRonda);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Rondas de Picking"
        description="Gestiona y monitorea las rondas de picking activas"
        action={headerActions}
        filters={dataFilters}
        onFilterChange={handleFilterChange}
      />

      <div className="flex-1 p-6">
        <PickingTable
          rondas={paginatedRondas}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}

