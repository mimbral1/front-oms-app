"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Action, PageHeader } from "@/components/layout/page-header";
import { AdjustmentsHorizontalIcon, ArrowDownTrayIcon, ArrowPathIcon, FunnelIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DataTable } from "@/components/ui/table";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";
import { exportToCsv } from "@/components/presets/export/export";

export interface Column<T> {
  header: string | React.ReactNode;
  accessorKey: keyof T;
  cell?: (item: T) => React.ReactNode;
}

// 1) Interfaz de datos (Control de pedidos)
interface PurchaseOrder {
  id: string; // Columna ID
  entidad: string; // Columna Entidad
  refId: string; // Columna Ref ID
  idEntidad: string; // Columna ID Entidad
  inventario: string; // Columna Inventario
  controlador: {
    user: string;
    email: string;
  }; // Columna Controlador
  status: string; // Columna Estado: Finalizada, En curso, Corregir, Error...
}

// 2) Mock de ejemplo
const mockOrders: PurchaseOrder[] = [
  {
    id: "240523-7VYBM7",
    entidad: "order",
    refId: "1434491022880-01",
    idEntidad: "664f73a891473bfec7561057",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Finalizada",
  },
  {
    id: "240523-OUEYG2",
    entidad: "order",
    refId: "1434491022881-01",
    idEntidad: "664f782acaa341802bbdf163",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "En curso",
  },
  {
    id: "240523-EAV8WB",
    entidad: "order",
    refId: "1432331022873-01",
    idEntidad: "664396e9c722d1aa6d4971",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "En curso",
  },
  {
    id: "240523-VUEWPJ",
    entidad: "order",
    refId: "1434471022879-01",
    idEntidad: "664f5e110b83b418d7bb2b48",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Corregir",
  },
  {
    id: "240522-9QJZXX",
    entidad: "order",
    refId: "1429491022862-01",
    idEntidad: "664014390a600699fadfc6cb",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Corregir",
  },
  {
    id: "240521-6BWYJP",
    entidad: "order",
    refId: "1432341022875-01",
    idEntidad: "6643a80eb6b7882e7eb39dab1",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "En curso",
  },
  {
    id: "240522-IHSXKR",
    entidad: "order",
    refId: "-",
    idEntidad: "635e8c531fe39232c48ecf372",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Error",
  },
  {
    id: "240521-OQLG37",
    entidad: "order",
    refId: "9982491041991-01",
    idEntidad: "6642d997d919864273e97022",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "En curso",
  },
  {
    id: "240523-QJ5F9E",
    entidad: "order",
    refId: "1434481022880-01",
    idEntidad: "664f70ee34d2892994e6377e",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Corregir",
  },
  {
    id: "240522-L05P0H",
    entidad: "order",
    refId: "1434491022882-01",
    idEntidad: "664f89d8f338779b90c056d6",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Corregir",
  },
  {
    id: "240522-F3U9D0",
    entidad: "order",
    refId: "1434491022883-01",
    idEntidad: "664f8c47141505c87e83f3b9",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Corregir",
  },
  {
    id: "240522-S8Y6H1",
    entidad: "order",
    refId: "1434491022884-01",
    idEntidad: "664f8d22329302e1c953a948",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Corregir",
  },
  {
    id: "240522-X7Q2Z3",
    entidad: "order",
    refId: "1434491022885-01",
    idEntidad: "664f8de806509f7a77b8f9a2",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Finalizada",
  },
  {
    id: "240522-P9R4T5",
    entidad: "order",
    refId: "1434491022886-01",
    idEntidad: "664f8e97f0e9d6d3d4b68e9e",
    inventario: "Palermo",
    controlador: { user: "Leonardo Garmendia", email: "leonardo.gambin..." },
    status: "Finalizada",
  },
];

// 3) Avatar simple con iniciales
const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="h-8 w-8 flex-none rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-semibold">
      {initials}
    </div>
  );
};

// 4) Color de estado
const getStatusColor = (status: string) => {
  switch (status) {
    case "Finalizada":
      return "#22c55e"; // Corresponde a bg-green-500
    case "En curso":
      return "#3b82f6"; // Corresponde a bg-blue-500
    case "Corregir":
      return "#9ca3af"; // Corresponde a bg-gray-400
    case "Error":
      return "#ef4444"; // Corresponde a bg-red-500
    default:
      return "#d1d5db"; // Corresponde a bg-gray-300
  }
};

// 5) Columnas
const getColumns = (
  router: ReturnType<typeof useRouter>
): Column<PurchaseOrder>[] => [
    {
      header: "ID",
      accessorKey: "id",
      cell: (row: PurchaseOrder) => (
        <span
          className="font-medium flex flex-col w-[180px]"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/pedidos/control/${encodeURIComponent(row.id)}`);
          }}
        >
          {row.id}
        </span>
      ),
    },
    {
      header: "Entidad",
      accessorKey: "entidad",
      cell: (row: PurchaseOrder) => (
        <div className="inline-flex items-center gap-1 border border-blue-400 text-blue-600 rounded-full px-3 py-1 text-sm">
          <ShoppingCartIcon className="h-4 w-4" />
          {row.entidad}
        </div>
      ),
    },
    {
      header: "Ref ID",
      accessorKey: "refId",
      cell: (row: PurchaseOrder) => <span>{row.refId || "–"}</span>,
    },
    {
      header: "ID Entidad",
      accessorKey: "idEntidad",
      cell: (row: PurchaseOrder) => (
        <span className="text-sm text-gray-600 truncate max-w-[140px]">
          {row.idEntidad}
        </span>
      ),
    },
    {
      header: "Inventario",
      accessorKey: "inventario",
      cell: (row: PurchaseOrder) => <span className="text-blue-600">{row.inventario}</span>,
    },
    {
      header: "Controlador",
      accessorKey: "controlador",
      cell: (row: PurchaseOrder) => (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
          <div className="flex items-center gap-2">
            <Avatar name={row.controlador.user} />
            <div className="flex flex-col">
              <span className="font-medium">{row.controlador.user}</span>
              <span className="text-xs text-gray-500 truncate max-w-[120px]">
                {row.controlador.email}
              </span>
            </div>
          </div>
        </div >
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row: PurchaseOrder) => {
        const color = getStatusColor(row.status);
        return (
          <div
            style={{ backgroundColor: color }}
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium text-white`}
          >
            {row.status}
          </div>
        );
      },
    },
  ];


// 6) Filtros superiores
interface PurchaseOrderFilters {
  id: string;
  entidad: string;
  refId: string;
  idEntidad: string;
}

function getPurchaseOrderFilters(filters: PurchaseOrderFilters) {
  return [
    {
      id: "id",
      label: "ID",
      type: "text" as const,
      value: filters.id,
    },
    {
      id: "entidad",
      label: "Entidad",
      type: "text" as const,
      value: filters.entidad,
    },
    {
      id: "refId",
      label: "Ref ID",
      type: "text" as const,
      value: filters.refId,
    },
    {
      id: "idEntidad",
      label: "ID Entidad",
      type: "text" as const,
      value: filters.idEntidad,
    },
  ];
}

// 7) Componente principal
export function ControlPedidosView() {
  const router = useRouter();
  const [orders] = useState<PurchaseOrder[]>(mockOrders);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    id: "",
    entidad: "",
    refId: "",
    idEntidad: "",
  });

  const handleFilterChange = (id: string, value: string) =>
    setFilters((prev) => ({ ...prev, [id]: value }));

  // Filtrado básico
  const filtered = orders.filter((o) => {
    return (
      (!filters.id || o.id.includes(filters.id)) &&
      (!filters.entidad || o.entidad.includes(filters.entidad)) &&
      (!filters.refId || o.refId.includes(filters.refId)) &&
      (!filters.idEntidad || o.idEntidad.includes(filters.idEntidad))
    );
  });

  const handleNew = () => router.push(`/almacen/gestion/ordenes-compra/nuevo`);
  const handleExport = () => {
    const headers = [
      "ID",
      "Entidad",
      "Ref ID",
      "ID Entidad",
      "Inventario",
      "Controlador",
      "Estado",
    ];
    const rows = filtered.map((o) => [
      o.id,
      o.entidad,
      o.refId,
      o.idEntidad,
      o.inventario,
      `${o.controlador.user} <${o.controlador.email}>`,
      o.status,
    ]);
    exportToCsv("ControlPedidos.csv", [headers, ...rows]);
  };

  const headerActions: Action[] = [
    {
      label: "Nuevo",
      variant: "success", // usas la variante “green” (verde) tal como la definiste
      onClick: handleNew,
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary", // botón azul
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />
    },
    {
      label: "",
      variant: "text", // iconos secundarios como “texto”
      onClick: () => console.log("Eliminar"),
      icon: <TrashIcon className="h-5 w-5" />,
    },
    {
      label: "",
      variant: "text",
      onClick: () => console.log("Filtrar"),
      icon: <FunnelIcon className="h-5 w-5" />,
    },
    {
      label: "",
      variant: "text",
      onClick: () => console.log("Ordenar"),
      icon: <AdjustmentsHorizontalIcon className="h-5 w-5" />,
    },
    {
      label: "",
      variant: "text",
      onClick: () => console.log("Refrescar"),
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
  ];

  // Paginación
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const total = Math.ceil(filtered.length / PER_PAGE);
  const currentData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const columns = getColumns(router);
  const hdrFilters = getPurchaseOrderFilters(filters);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Control de pedidos"
        filters={hdrFilters}
        onFilterChange={handleFilterChange}
        action={headerActions}
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl shadow-sm">
            <DataTable
              data={currentData}
              columns={columns}
              rowPaddingY={8}
              rowBgClass="bg-white"
              dataType="pedido"
              statusKey="status"
            />
          </div>
          <div className="mt-6 flex flex-col items-center gap-4">
            {filtered.length > 0 && (
              <div className="flex justify-center gap-2">
                {/* Botón Anterior */}
                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    &lt;
                  </button>
                )}

                {Array.from({ length: Math.min(total, 3) }, (_, index) => {
                  const pageNumber = Math.max(1, page - 1) + index;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`px-3 py-1 rounded ${page === pageNumber
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                {/* Botón Siguiente */}
                {page < total && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    &gt;
                  </button>
                )}
              </div>
            )}

            {/* Mostrar número total de resultados */}
            <div className="text-sm text-gray-500">
              {filtered.length} resultados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
