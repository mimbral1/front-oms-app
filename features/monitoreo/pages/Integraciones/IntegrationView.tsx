/* 
// 1) Interfaz de datos
interface IntegrationInstance {
  primaryIdentifier: { title: string; subtitle: string };
  instanceId: string;
  status: "Waiting" | "Succeeded" | "Failed" | "Running";
  businessIdentifiers: string;
  duration: {
    label: string;
    value: string;
  }[];
}

// 2) Mock de ejemplo (valores visibles en español)
const mockInstances: IntegrationInstance[] = [
  {
    primaryIdentifier: {
      title: "Hora inicio: indefinida",
      subtitle: "DSF_PFE_SANITY_JAPA… | v2.0.0",
    },
    instanceId: "32855…",
    status: "Waiting",
    businessIdentifiers: "",
    duration: [
      { label: "Enviado", value: "Justo ahora" },
      { label: "Duración de espera", value: "–" },
    ],
  },
  {
    primaryIdentifier: {
      title: "Hora inicio: 10/03/2021 00:15:10",
      subtitle: "DSF_PFE_SANITY_JAPA… | v2.0.0",
    },
    instanceId: "33255…",
    status: "Succeeded",
    businessIdentifiers: "record-1. Hello World",
    duration: [
      { label: "Disparado", value: "Justo ahora" },
      { label: "Duración exitosa", value: "13 segundos" },
    ],
  },
  // … otros mocks …
];

// 3) Mapea estado a color y texto en español
const statusDot = (status: string) => {
  const map: Record<string, string> = {
    Waiting: "bg-yellow-500",
    Succeeded: "bg-green-500",
    Failed: "bg-red-500",
    Running: "bg-blue-500",
  };
  return map[status] || "bg-gray-400";
};
const statusText = (status: string) =>
  status === "Waiting"
    ? "En espera"
    : status === "Succeeded"
    ? "Completado"
    : status === "Running"
    ? "En curso"
    : status === "Failed"
    ? "Error"
    : status;

// Acción “Re-ejecutar”
const handleRerun = (instanceId: string) => {
  console.log("Re-ejecutando instancia", instanceId);
  // aquí iría tu llamada a la API
};
// 3.1) Clase de estado (pill)
const getStatusClass = (status: string): string => {
  switch (status) {
    case "Waiting":
      return "bg-yellow-500"; // coincide con border-yellow-500
    case "Succeeded":
      return "bg-green-500"; // coincide con border-green-500
    case "Failed":
      return "bg-red-500"; // coincide con border-red-500
    case "Running":
      return "bg-blue-500"; // coincide con border-blue-500
    default:
      return "bg-gray-400"; // coincide con border-gray-300/400
  }
};

// 4) Columnas de la tabla (encabezados en español)
function getColumns() {
  return [
    {
      header: "Identificador",
      accessorKey: "primaryIdentifier",
      cell: (row: IntegrationInstance) => (
        <div className="text-sm">
          <div>{row.primaryIdentifier.title}</div>
          <div className="text-gray-500 text-xs">
            {row.primaryIdentifier.subtitle}
          </div>
        </div>
      ),
    },
    {
      header: "ID de instancia",
      accessorKey: "instanceId",
      cell: (row: IntegrationInstance) => (
        <span className="font-mono">{row.instanceId}</span>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row: IntegrationInstance) => {
        const cls = getStatusClass(row.status);
        return (
          <div
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium text-white ${cls}`}
          >
            {row.status}
          </div>
        );
      },
    },
    {
      header: "ID de negocio",
      accessorKey: "businessIdentifiers",
      cell: (row: IntegrationInstance) => (
        <span className="text-sm">{row.businessIdentifiers || "–"}</span>
      ),
    },
    {
      header: "Duración",
      accessorKey: "duration",
      cell: (row: IntegrationInstance) => (
        <div className="space-y-1 text-sm">
          {row.duration.map((d, i) => (
            <div key={i} className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{d.label}:</span>
              <span>{d.value}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (row: IntegrationInstance) => (
        <button
          onClick={() => handleRerun(row.instanceId)}
          className="rounded-md bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"
        >
          Re-ejecutar
        </button>
      ),
    },
  ];
}

// 5) Filtros superiores (labels en español)
interface InstanceFilters {
  primaryIdentifier: string;
  instanceId: string;
  status: string;
}
function getFilters(filters: InstanceFilters) {
  return [
    {
      id: "primaryIdentifier",
      label: "Identificador",
      type: "text" as const,
      value: filters.primaryIdentifier,
    },
    {
      id: "instanceId",
      label: "ID de instancia",
      type: "text" as const,
      value: filters.instanceId,
    },
    {
      id: "status",
      label: "Estado",
      type: "select" as const,
      value: filters.status,
      options: [
        { label: "Todos", value: "" },
        { label: "En espera", value: "Waiting" },
        { label: "Completado", value: "Succeeded" },
        { label: "Error", value: "Failed" },
        { label: "En curso", value: "Running" },
      ],
    },
  ];
}

// 6) Componente principal
export function IntegrationMonitoringView() {
  const [instances] = useState<IntegrationInstance[]>(mockInstances);
  const [filters, setFilters] = useState<InstanceFilters>({
    primaryIdentifier: "",
    instanceId: "",
    status: "",
  });
  const router = useRouter();

  const handleFilterChange = (id: string, value: string) =>
    setFilters((prev) => ({ ...prev, [id]: value }));

  // Filtrado simple
  const filtered = instances.filter((i) => {
    const okId =
      !filters.primaryIdentifier ||
      i.primaryIdentifier.title
        .toLowerCase()
        .includes(filters.primaryIdentifier.toLowerCase());
    const okInst =
      !filters.instanceId || i.instanceId.includes(filters.instanceId);
    const okEst = !filters.status || i.status === filters.status;
    return okId && okInst && okEst;
  });

  const handleNew = () => router.push(`/almacen/gestion/ordenes-compra/nuevo`);
  const handleExport = () => {
    const headers = [
      "Identificador",
      "ID de instancia",
      "Estado",
      "ID de negocio",
      "Duración",
    ];

    // Preparamos cada fila como array de strings
    const rows = filtered.map((inst) => {
      // a) Concatenamos título y subtítulo en un solo campo
      const identificador = `${inst.primaryIdentifier.title} – ${inst.primaryIdentifier.subtitle}`;
      // b) Traducimos el estado
      const estado = statusText(inst.status);
      // c) Duración: unimos cada etiqueta:valor con punto y coma
      const duracion = inst.duration
        .map((d) => `${d.label}: ${d.value || "–"}`)
        .join("; ");

      return [
        identificador,
        inst.instanceId,
        estado,
        inst.businessIdentifiers || "–",
        duracion,
      ];
    });

    exportToCsv("Instancias.csv", [headers, ...rows]);
  };

  // Acciones del header (label en español)
  const headerActions: Action[] = [
    {
      label: "Refrescar",
      variant: "primary",
      onClick: () => console.log("Refrescar listado"),
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary", // botón azul
      onClick: handleExport,
        icon: <ArrowDownTrayIcon className="h-5 w-5" />
    },
  ];

  // Paginación
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col bg-page-bg min-h-screen">
      <PageHeader
        title="Monitoreo de Integraciones"
        filters={getFilters(filters)}
        onFilterChange={handleFilterChange}
        action={headerActions}
      />

      <div className="p-6">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <DataTable
            data={pageData}
            columns={getColumns() as any}
            rowPaddingY={20}
            dataType="integration"
            statusKey="status"
            showStatusBorder
          />
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          <span className="text-sm text-gray-500">
            {filtered.length} de {instances.length} instancias
          </span>
        </div>
      </div>
    </div>
  );
}
 */
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ArrowPathIcon, EyeIcon, ShoppingCartIcon, UserIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { exportToCsv } from "@/components/presets/export/export";
import { useFetchPedidos } from "@/features/pedidos/hooks/useFetchPedidos";
import { usePedidosStore } from "@/features/pedidos/stores/lista-pedidos";
import { Pedido } from "@/features/pedidos/types/lista-pedidos";
import { StatusBadge } from "@/components/ui/badge/status";
import TransformIcon from "@mui/icons-material/Transform";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import { clp } from "@/lib/format/money";
import { ChangeFormData } from "@/utils/types";
import EditIntegrationActions from "@/features/monitoreo/components/EditIntegration";
import PasswordModal from "@/features/monitoreo/components/ReRunIntegration";
import { ActionButton } from "@/components/ui/button/action-button";

const ITEMS_PER_PAGE = 10;
const MAX_VISIBLE_PAGES = 3;

export function getPedidosColumns(onViewClick: (pedido: Pedido) => void) {
  return [
    {
      accessorKey: "id" as keyof Pedido,
      header: "ID Pedido",
      cell: (pedido: Pedido) => (
        <div className="text-sm font-semibold text-gray-900">{pedido.id}</div>
      ),
    },
    {
      accessorKey: "cliente" as keyof Pedido,
      header: "Cliente",
      cell: (pedido: Pedido) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {pedido.cliente.nombre}
            </p>
            <p className="text-xs text-gray-500">{pedido.cliente.telefono}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "fechaCreacion" as keyof Pedido,
      header: "Fecha creación",
      cell: (pedido: Pedido) => (
        <div className="text-sm text-gray-600">{pedido.fechaCreacion}</div>
      ),
    },
    {
      accessorKey: "fechaEntrega" as keyof Pedido,
      header: "Fecha entrega",
      cell: (pedido: Pedido) => (
        <div className="text-sm text-gray-600">{pedido.fechaEntrega}</div>
      ),
    },
    {
      accessorKey: "items" as keyof Pedido,
      header: "Items",
      cell: (pedido: Pedido) => (
        <div className="text-sm text-gray-900 flex items-center gap-2">
          <ShoppingCartIcon className="h-5 w-5 text-gray-400" />
          {pedido.picking?.items}/{pedido.picking?.unidades}
        </div>
      ),
    },
    {
      accessorKey: "prioridad" as keyof Pedido,
      header: "Prioridad",
      cell: (pedido: Pedido) => (
        <div className="text-sm font-medium text-gray-900">
          {pedido.prioridad}
        </div>
      ),
    },
    {
      accessorKey: "estado" as keyof Pedido,
      header: "Estado",
      cell: (pedido: Pedido) => (
        <StatusBadge
          status={pedido.estado}
          variant={getStatusVariant(pedido.estado)}
        />
      ),
    },
    {
      accessorKey: "estado" as keyof Pedido,
      header: "Estado",
      cell: (pedido: Pedido) => (
        <div className="flex items-center gap-2">
          <StatusBadge
            status={pedido.estado}
            variant={getStatusVariant(pedido.estado)}
          />
        </div>
      ),
    },
    {
      accessorKey: "id" as keyof Pedido,
      header: "Acciones",
      cell: (pedido: Pedido) => (
        <button
          onClick={() => onViewClick(pedido)}
          className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
        >
          <EyeIcon className="h-5 w-5" />
          <span className="text-sm">Ver</span>
        </button>
      ),
    },
  ];
}
function mapPedidoToChangeForm(p: Pedido): ChangeFormData {
  return {
    /* ───── claves base ───── */
    orderID: (p as any).id ?? 0,
    docentry: (p as any).docentry ?? 0,
    docnum: (p as any).docnum ?? 0,
    folionum: Number((p as any).folionum ?? 0), // ↍ string → number

    /* ───── datos de cliente ───── */
    cardcode: p.cliente.rut,
    cardname: p.cliente.nombre,
    phone1: p.cliente.telefono,
    e_mail: `${p.cliente.email ?? ""}`, // ↍ primitivo string

    /* ───── totales / fechas ───── */
    doctotalsy: p.totales.total,
    docdate: p.fechaCreacion,
    // itemsAmount: p.items.total,

    /* ───── ids internos ───── */
    orderStatusID: (p as any).orderStatusID ?? 0,
    paymentMethodID: (p as any).paymentMethodID ?? 0,
    deliveryTypeID: (p as any).deliveryTypeID ?? 0,
    salesChannelID: (p as any).salesChannelID ?? 0,

    /* ───── meta integración ───── */
    recipient: (p as any).recipient ?? "",
    deliveryDate: p.fechaEntrega ?? null,
    lastQueryDate: (p as any).lastQueryDate ?? null,
    createdate: (p as any).createdate ?? "",
    createts: (p as any).createts ?? Date.now(),

    fixed_rut: (p as any).fixed_rut ?? "",
    integrationError: (p as any).integrationError ?? null,
    INTEGRATION_STATUS: (p as any).INTEGRATION_STATUS ?? "",

    /* ───── producto opcional ───── */
    Product: {
      itemcode: (p as any).Product?.itemcode ?? "",
      dscription: (p as any).Product?.dscription ?? "",
      quantity: (p as any).Product?.quantity ?? 0,
      price: (p as any).Product?.price ?? 0,
    },
  };
}

const getStatusVariant = (status: Pedido["estado"]) => {
  switch (status) {
    case "Pedido Recibido":
      return "info";
    case "Asignando Pickers":
      return "processing";
    case "En picking":
      return "processing";
    case "Picking Completado Parcialmente":
      return "partial";
    case "Picking Completado":
      return "success";
    case "En packing":
      return "review";
    case "Pendiente de auditar":
      return "dispatch";
    case "En reparto":
      return "delivered";
    case "Entregado":
      return "success";
    case "Pedido recibido":
      return "info";
    default:
      return "info";
  }
};

interface PedidosTableProps {
  pedidos: Pedido[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewClick: (pedido: Pedido) => void;
}

export function PedidosTable({
  pedidos,
  currentPage,
  totalPages,
  onPageChange,
  onViewClick,
}: PedidosTableProps) {
  const columns = getPedidosColumns(onViewClick);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <DataTable columns={columns} data={pedidos} />
      </div>
      {pedidos.length > 0 && (
        <div className="flex flex-col items-center gap-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
          <div className="text-sm text-gray-500">
            {pedidos.length} resultados
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrationMonitoringView() {
  const router = useRouter();

  // define currentPage ANTES y pásalo al hook
  const [currentPage, setCurrentPage] = useState(1);
  const { error, refetch } = useFetchPedidos({
    // page: currentPage,
    // pageSize: ITEMS_PER_PAGE,
    page: 1,
    pageSize: 999999,
  });

  const { pedidos, filters, setFilters, setPedidos } = usePedidosStore();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ChangeFormData | null>(null);

  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pendingInstance, setPendingInstance] = useState<any | null>(null);

  const askPassword = (instanceId: any) => {
    setPendingInstance(instanceId);
    setPwdModalOpen(true);
  };

  const runAfterPassword = () => {
    if (pendingInstance !== null) {
      handleRerun(pendingInstance); // ↍ tu hook real
    }
    setPwdModalOpen(false);
    setPendingInstance(null);
  };

  const handleFilterChange = (id: string, value: string) => {
    setFilters({ [id]: value });
    setCurrentPage(1);
  };

  const handleChangeStore = (data: ChangeFormData) => {
    // Implementar lógica de cambio de tienda
    console.log("Cambiar tienda", data);
  };

  const dataFilters = [
    {
      id: "id",
      label: "ID Pedido",
      type: "text" as const,
      value: filters.id || "",
    },
    {
      id: "cliente",
      label: "Cliente",
      type: "text" as const,
      value: filters.cliente || "",
    },
    {
      id: "fechaDesde",
      label: "Fecha desde",
      type: "datetime" as const,
      value: filters.fechaDesde || "",
    },
    {
      id: "fechaHasta",
      label: "Fecha hasta",
      type: "datetime" as const,
      value: filters.fechaHasta || "",
    },
  ];

  const columns = [
    {
      header: "Pedido",
      accessorKey: "id" as keyof Pedido,
      cell: (pedido: Pedido) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            /* router.push(`/pedidos/${encodeURIComponent(pedido.id)}`); */
          }}
          className="cursor-pointer flex flex-col min-h-[80px] text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{pedido.id}</span>
          </div>
          {/* Folio y Fecha de Creación */}
          <div className="flex flex-col mt-1">
            <span>{pedido.folionum}</span>
            <span>{pedido.fechaCreacion}</span>
          </div>
          {/* Seller */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{pedido.seller}</span>
          </div>
        </div>
      ),
    },

    {
      header: "Cliente",
      accessorKey: "cliente" as keyof Pedido,
      cell: (pedido: Pedido) => (
        <div className="flex flex-col min-h-[80px] text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <p className="font-medium text-gray-900">{pedido.cliente.nombre}</p>
          </div>
          {/* Aquí se alinean los otros datos con el nombre */}
          <div className="ml-7">
            {/* Ajusta el margen izquierdo para alinear con el nombre */}
            <p className="text-sm text-gray-500">{pedido.cliente.email}</p>
            <p className="text-sm text-gray-500">{pedido.cliente.rut}</p>
            <p className="text-sm text-gray-500">{pedido.cliente.telefono}</p>
          </div>
        </div>
      ),
    },

    {
      header: "Items",
      accessorKey: "picking" as keyof Pedido,
      cell: (pedido: Pedido) => (
        <div className="flex items-center gap-2">
          <TransformIcon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-500">
              {Number(pedido.picking)}{" "}
              <span className="text-xs text-gray-500">
                {Number(pedido.picking) > 1 ? "items" : "item"}
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Totales",
      accessorKey: "totales" as keyof Pedido,
      cell: (pedido: Pedido) => (
        <div className="flex flex-col gap-1">
          {/* Operaciones y Total */}
          <div className="flex items-center gap-2">
            <CalculateOutlinedIcon className="h-6 w-6 text-gray-500 bg-white" />
            <span className="font-inter text-sm leading-6 text-[#7E7F8DFF] font-medium">
              {clp.format(pedido.totales.total)} CLP
            </span>
          </div>

          {/* Método de pago */}
          {pedido.totales.metodo && (
            <div className="ml-4">
              <span className="font-inter text-sm leading-6 text-[#7E7F8DFF]">
                Método de pago: {pedido.totales.metodo}
              </span>
            </div>
          )}

          {/* Tipo Documento */}
          {pedido.totales.documento && (
            <div className="ml-4">
              <span className="font-inter text-sm leading-6 text-[#7E7F8DFF]">
                Tipo de documento: {pedido.totales.documento}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (row: any) => (
        <ActionButton
          variant="primary"
          size="sm"
          onClick={() => askPassword(row.instanceId)}
        >
          Re-ejecutar
        </ActionButton>
      ),
    },

    {
      header: "",
      accessorKey: "actions",
      cell: (pedido: Pedido) => (
        <ActionButton
          variant="error"
          size="sm"
          onClick={() => {
            const data = mapPedidoToChangeForm(pedido);
            setSelectedRow(data);
            setIsActionsOpen(true);
          }}
        >
          Modificar
        </ActionButton>
      ),
    },
  ];

  const filteredPedidos = pedidos.filter((pedido) => {
    // const matchPickingPoint =
    //   !filters.pickingPoint ||
    //   pedido.picking.toLowerCase().includes(filters.pickingPoint.toLowerCase());
    const matchEstado = !filters.estado || pedido.estado === filters.estado;

    const pedidoFecha = new Date(pedido.fechaCreacion);
    const filterDesde = filters.fechaDesde
      ? new Date(filters.fechaDesde)
      : null;
    const filterHasta = filters.fechaHasta
      ? new Date(filters.fechaHasta)
      : null;

    const matchFechaDesde = !filterDesde || pedidoFecha >= filterDesde;
    const matchFechaHasta = !filterHasta || pedidoFecha <= filterHasta;

    return (
      matchEstado && matchFechaDesde && matchFechaHasta
    );
  });

  const handleExport = () => {
    const headers = [
      "ID Pedido",
      "Cliente",
      "Fecha Creación",
      "Fecha Entrega",
      "Items",
      "Prioridad",
      "Estado",
    ];
    const rows = filteredPedidos.map((pedido) => [
      pedido.id,
      pedido.cliente.nombre,
      pedido.fechaCreacion,
      pedido.fechaEntrega,
      // `${pedido.items.procesados}/${pedido.items.total}`,
      pedido.prioridad,
      pedido.estado,
    ]);
    exportToCsv("pedidos.csv", [headers, ...rows]);
  };
  /* console.log("Rows: ", filteredPedidos); */
  const headerActions = [
    {
      label: "Exportar",
      variant: "secondary" as const,
      onClick: handleExport,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
  ];

  const totalPages = Math.ceil(pedidos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPedidos = pedidos.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );
  let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
  let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

  if (endPage - startPage < MAX_VISIBLE_PAGES - 1) {
    startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Monitoreo de Integraciones"
        description="Gestiona y monitorea la integracion de los pedidos"
        action={headerActions}
        filters={dataFilters}
        onFilterChange={handleFilterChange}
      />

      <div className="flex-1 p-6">
        {/* <div className="overflow-hidden rounded-xl bg-white shadow-sm"></div> */}
        <DataTable
          data={paginatedPedidos} //filteredPedidos//paginatedPedidos(puede ser que el mock este funcionand mal)
          columns={columns as any}
          /* onRowClick={(pedido) => {
            router.push(`/pedidos/${encodeURIComponent(pedido.id)}`);
          }} */
          showStatusBorder={false}
          statusKey="estado"
          rowGap={4}
          rowBgClass="bg-white shadow-sm"
        />
        {/* 
					rowGap={4}
					rowBgClass="bg-white shadow-sm" */}
        {/* estilos para crear espaciado y fondo a las filas de las tablas */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {filteredPedidos.length > 0 && (
            <div className="flex justify-center gap-2">
              {/* Botón Anterior */}
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  &lt;
                </button>
              )}

              {/* Lógica para mostrar máximo 3 páginas */}
              {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
                const pageNumber = Math.max(1, currentPage - 1) + index;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-1 rounded ${currentPage === pageNumber
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                      }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {/* Botón Siguiente */}
              {currentPage < totalPages && (
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  &gt;
                </button>
              )}
            </div>
          )}

          {/* Mostrar número total de resultados */}
          <div className="text-sm text-gray-500">
            {filteredPedidos.length} resultados
          </div>
        </div>
      </div>
      <EditIntegrationActions
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onChangeStore={handleChangeStore}
        data={selectedRow}
      />
      <PasswordModal
        isOpen={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        onSuccess={runAfterPassword}
      />
    </div>
  );
}
function handleRerun(instanceId: any): void {
  throw new Error("Function not implemented.");
}

