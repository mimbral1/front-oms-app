"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { ArrowPathIcon, PlusIcon, ArrowDownTrayIcon, ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import ExportTransportistasModal from "@/features/delivery/components/transportistas/transportista/ExportTransportistasModal";
import { Pagination } from "@/components/ui/pagination";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

/* -------------------- Tipos -------------------- */
export interface TransportistaRow {
  carrierId?: string;          // id real de carrier para navegación al resumen
  id: string;                 // hash corto visible en "Info"
  refId: string;              // Ref ID (para filtros si quieres)
  nombre: string;             // Nombre (segunda línea en la columna Info y propia columna "Nombre")
  reference: string;          // "Reference janis-xxxx"
  metodoEntrega: string;      // Columna "Tipo de entrega" (shippingType)
  /* columnas faltantes del view según referencia */
  operadorLogistico?: {
    name: string;             // nombre visible (ej. "correosEs")
    integration?: string;     // subtítulo "Integration xxxx"
  } | null;
  generarRuta?: boolean;         // generateRoute -> Sí/No
  isInternal?: boolean;          // isInternal -> Sí/No
  fechaCreacion?: string;        // "DD/MM/YYYY HH:mm" - columna "Fecha de creación"
  /* FIN NUEVO */
  modificado: string;         // fecha/hora "DD/MM/YYYY HH:mm"
  estado: "Active" | "Inactive";
  salesChannelLimited?: boolean; // mock del dropdown "Limited by sales channel"
}

type ApiCarrierItem = {
  id?: string;
  refId?: string | null;
  name?: string | null;
  reference?: string | null;
  shippingType?: string | null;
  companyId?: string | number | null;
  companyName?: string | null;
  company?: {
    id?: string | number | null;
    name?: string | null;
  } | null;
  generateRoute?: boolean | null;
  isInternal?: boolean | null;
  dateCreated?: string | null;
  dateModified?: string | null;
  status?: string | null;
  limitedToSalesChannels?: boolean | null;
};

type ApiCarrierResponse = {
  data?: ApiCarrierItem[];
};

/* -------------------- MOCK DATA  -------------------- */
export const MOCK: TransportistaRow[] = [
  {
    id: "", // en la 1ª fila de la imagen no se muestra el hash
    refId: "exxe",
    nombre: "exxe",
    reference: "exxe",
    metodoEntrega: "Express",
    operadorLogistico: null,
    generarRuta: false,
    isInternal: false,
    fechaCreacion: "08/10/2024 16:40",
    modificado: "27/02/2025 14:19",
    estado: "Active",
    salesChannelLimited: undefined,
  },
  {
    id: "#66f58a93c44148decd9165992",
    refId: "RT-Pilar",
    nombre: "Pickup Pilar",
    reference: "RT-Pilar",
    metodoEntrega: "Retiro en tienda",
    operadorLogistico: null,
    generarRuta: false,
    isInternal: false,
    fechaCreacion: "26/09/2024 13:23",
    modificado: "26/09/2024 13:24",
    estado: "Active",
    salesChannelLimited: undefined,
  },
  {
    id: "#66eb087b56a8fa1d28139ea4",
    refId: "fizzmodqa-2",
    nombre: "Entrega Agendada",
    reference: "fizzmodqa-2",
    metodoEntrega: "Entrega Agendada",
    operadorLogistico: null,
    generarRuta: false,
    isInternal: false,
    fechaCreacion: "18/09/2024 14:06",
    modificado: "11/02/2025 12:59",
    estado: "Active",
    salesChannelLimited: undefined,
  },
  {
    id: "#6615833b323084214fc22693",
    refId: "calcesur",
    nombre: "Calcesur",
    reference: "calcesur",
    metodoEntrega: "Cliente Calcesur",
    operadorLogistico: null,
    generarRuta: false,
    isInternal: false,
    fechaCreacion: "09/04/2024 15:04",
    modificado: "18/09/2024 13:47",
    estado: "Active",
    salesChannelLimited: undefined,
  },
  {
    id: "#65dce6c4acc834dd5d084722",
    refId: "Delivery",
    nombre: "Delivery",
    reference: "Delivery",
    metodoEntrega: "Despacho a Domicilio",
    operadorLogistico: null,
    generarRuta: false,
    isInternal: false,
    fechaCreacion: "26/02/2024 16:30",
    modificado: "19/09/2024 18:30",
    estado: "Active",
    salesChannelLimited: undefined,
  },
  {
    id: "#6582fa56684ebf0f1902c9c6",
    refId: "correos-es-carrier",
    nombre: "Correos es Moto",
    reference: "correos-es-carrier",
    metodoEntrega: "Express 48hs",
    operadorLogistico: {
      name: "22",
      integration: undefined,
    },
    generarRuta: true,
    isInternal: false,
    fechaCreacion: "20/12/2023 11:29",
    modificado: "19/09/2024 18:30",
    estado: "Active",
    salesChannelLimited: undefined,
  },
];

/* -------------------- UI helpers -------------------- */
const EstadoPill = ({ estado }: { estado: "Active" | "Inactive" }) => {
  const label = estado === "Active" ? "Activo" : "Inactivo";
  const bg = estado === "Active" ? "bg-green-500" : "bg-gray-400";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${bg}`}>
      {label}
    </span>
  );
};

/* -------------------- Columnas (siguiendo la referencia) -------------------- */
function getColumns(router: ReturnType<typeof useRouter>): Column<TransportistaRow>[] {
  return [
    {
      header: "Info",
      accessorKey: "id",
      cell: (r) => (
        <div className="flex flex-col">
          <CopyableText text={r.id} className="text-[13px] text-gray-700">{r.id}</CopyableText>
          <button
            type="button"
            onClick={() => router.push(`/delivery/transportistas/listado-transportistas/${encodeURIComponent(r.carrierId || r.refId)}`)}
            className="text-left text-sm font-medium text-gray-900 hover:underline"
            title="Ver resumen"
          >
            {r.nombre}
          </button>
          <CopyableText text={r.reference} className="text-xs text-gray-500">
            Reference {r.reference}
          </CopyableText>
        </div>
      ),
    },
    {
      header: "Tipo de entrega",
      accessorKey: "metodoEntrega",
      cell: (r) => <span className="text-sm text-gray-800">{r.metodoEntrega}</span>,
    },
    /* Operador logístico */
    {
      header: "Operador logístico",
      accessorKey: "operadorLogistico",
      cell: (r) =>
        r.operadorLogistico && r.operadorLogistico.name ? (
          <span className="text-sm text-gray-800">{r.operadorLogistico.name}</span>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        ),
    },
    /* Generar ruta (Delivery) */
    {
      header: "Generar ruta",
      accessorKey: "generarRuta",
      cell: (r) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${r.generarRuta ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
            }`}
        >
          {r.generarRuta ? "Sí" : "No"}
        </span>
      ),
    },
    /* Interno */
    {
      header: "Interno",
      accessorKey: "isInternal",
      cell: (r) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${r.isInternal ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
            }`}
        >
          {r.isInternal ? "Sí" : "No"}
        </span>
      ),
    },
    /* Fecha de creación */
    {
      header: "Fecha de creación",
      accessorKey: "fechaCreacion",
      cell: (r) => <span className="text-sm text-gray-800">{r.fechaCreacion ?? "-"}</span>,
    },
    {
      header: "Modificado",
      accessorKey: "modificado",
      cell: (r) => <span className="text-sm text-gray-800">{r.modificado}</span>,
    },
    // El estado final lo pinta DataTable con statusKey,
    // aquí dejamos la col para ordenación/consistencia si la tabla lo requiere:
    {
      header: "Estado",
      accessorKey: "estado",
      // pill sólido estilo Mimbral
      cell: (r) => <EstadoPill estado={r.estado} />,
    },
  ];
}

/* -------------------- Filtros -------------------- */
interface Filters {
  id: string;
  refId: string;
  nombre: string;
  salesChannel: "" | "limited" | "unlimited";
}

const initialFilters: Filters = {
  id: "",
  refId: "",
  nombre: "",
  salesChannel: "",
};

const filterConfig: FilterConfig<Filters, TransportistaRow>[] = [
  {
    id: "id",
    label: "ID",
    type: "text",
    match: (row, value) =>
      `${row.id} ${row.carrierId ?? ""}`
        .toLowerCase()
        .includes(String(value ?? "").trim().toLowerCase()),
  },
  {
    id: "refId",
    label: "Ref ID",
    type: "text",
    rowValue: (row) => row.refId,
  },
  {
    id: "nombre",
    label: "Nombre",
    type: "text",
    rowValue: (row) => row.nombre,
  },
  {
    id: "salesChannel",
    label: "Limited by sales channel",
    type: "select",
    options: [
      { label: "Sí (limited)", value: "limited" },
      { label: "No (unlimited)", value: "unlimited" },
    ],
    rowValue: (row) => (row.salesChannelLimited ? "limited" : "unlimited"),
  },
];


/* -------------------- Página -------------------- */
const PER_PAGE = 60; // como en la captura: "60 por página"

export function TransportistasView() {
  const router = useRouter();
  const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();
  const columns = useMemo(() => getColumns(router), [router]);

  const [rows, setRows] = useState<TransportistaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { headerFilters, handleFilterChange, applyFilters } =
    useStandardFilters<Filters, TransportistaRow>({
      initialFilters,
      configs: filterConfig,
    });

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("es-CL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchWithAuthDelivery<ApiCarrierResponse>("carrier?page=1&limit=500", {
        method: "GET",
      });

      const mapped: TransportistaRow[] = (Array.isArray(res?.data) ? res.data : []).map((item) => {
        const statusRaw = String(item.status || "").trim().toLowerCase();
        const estado: "Active" | "Inactive" = statusRaw === "inactive" ? "Inactive" : "Active";
        const refId = String(item.refId || item.id || "").trim();
        const nombre = String(item.name || refId || "-").trim();
        const companyName = String(item.companyName || item.company?.name || "").trim();
        const companyId = String(item.companyId || item.company?.id || "").trim();
        return {
          carrierId: String(item.id || "").trim(),
          id: item.id ? `#${item.id}` : "",
          refId,
          nombre,
          reference: String(item.reference || refId || nombre),
          metodoEntrega: String(item.shippingType || "-"),
          operadorLogistico: companyName || companyId
            ? {
              name: companyName || companyId,
              integration: undefined,
            }
            : null,
          generarRuta: Boolean(item.generateRoute),
          isInternal: Boolean(item.isInternal),
          fechaCreacion: formatDate(item.dateCreated),
          modificado: formatDate(item.dateModified),
          estado,
          salesChannelLimited: Boolean(item.limitedToSalesChannels),
        };
      });

      setRows(mapped.length > 0 ? mapped : MOCK);
    } catch (error) {
      console.error("Error listando transportistas:", error);
      setRows(MOCK);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuthDelivery, formatDate, token]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);


  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const totalRecords = filteredRows.length;

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

  const visibleRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PER_PAGE;
    return filteredRows.slice(startIndex, startIndex + PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
    setCurrentPage((previousPage) => clamp(previousPage, 1, totalPages));
  }, [totalRecords]);

  /* -------------------- Modal Exportar -------------------- */
  const [exportOpen, setExportOpen] = useState(false);

  const goToResumen = useCallback((row: TransportistaRow) => {
    router.push(`/delivery/transportistas/listado-transportistas/${encodeURIComponent(row.carrierId || row.refId)}`);
  }, [router]);

  /* -------------------- Acciones Header -------------------- */
  const onImport = useCallback(() => {
    // MOCK: acción de importar (puedes abrir modal propio de importar si existe)
    alert("Importar (mock)");
  }, []);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/delivery/transportistas/listado-transportistas/nuevo"),
        icon: <PlusIcon className="h-5 w-5" />,
      },
      {
        label: "Exportar",
        variant: "primary",
        onClick: () => setExportOpen(true),
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      },
      {
        label: "Importar",
        variant: "primary",
        onClick: onImport,
        icon: <ArrowUpOnSquareIcon className="h-5 w-5" />,
      },
      {
        label: "Actualizar",
        variant: "secondary",
        onClick: fetchList,
        icon: <ArrowPathIcon className="h-5 w-5" />,
      },
    ],
    [router, onImport, fetchList]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Transportistas"
        action={headerActions}
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, String(value ?? ""));
        }}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <p>Cargando transportistas…</p>
          ) : visibleRows.length > 0 ? (
            <DataTable
              data={visibleRows}
              columns={columns}
              onRowClick={goToResumen}
              dataType="General"
              rowPaddingY={12}
              showStatusBorder
              rowBgClass="bg-white"
              statusKey="estado"
            />
          ) : (
            <div className="rounded-lg bg-white p-6 text-sm text-gray-600">
              No se encontraron transportistas con los filtros aplicados.
            </div>
          )}

          {/* Paginación + contador, 60 por página */}
          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modal Exportar (mock) */}
      <ExportTransportistasModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        rows={filteredRows}
        allRows={rows}
        defaultFileName="transportistas"
      />
    </div>
  );
}
