// views\PickingView\PickingPoints\PickingPoints.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { PickingStatusBadge, UserChip, CountBadgeCell } from "@/features/picking/components";
import { useFetchWithAuthQA } from "@/lib/http/client";

/* 1) Tipos + MOCK */
type Estado = string;

interface PickingPointRow {
  id: string;            // para navegar
  refId: string;         // Ref ID
  name: string;          // Nombre
  windows?: number;      // Ventanas (min) - puede no venir
  location: string;      // Ubicación
  creator?: { name: string; email: string }; // puede faltar
  modifier?: { name: string; email: string }; // puede faltar
  createdAt: string;     // Fecha de creación
  modifiedAt: string;    // Modificado
  status: Estado;        // Estado

  /* ===== NUEVAS PROPIEDADES (opcionales) ===== */
  optimizeRounds?: boolean;               // Optimizar el agrupamiento de pedidos en rondas
  minUnitsPerOrder?: number | string;     // Cantidad mínima de unidades por pedido
  maxUnitsPerOrder?: number | string;     // Cantidad máxima de unidades por pedido
  maxOrders?: number | string;            // Cantidad máxima de pedidos
  productGroupRestriction?: string[];     // Restricción por Grupo de Productos
}

type ApiProfile = {
  email?: string;
  userEmail?: string;
  nombres?: string;
  apellidos?: string;
  name?: string;
  fullName?: string;
  userName?: string;
  username?: string;
};

type PickingPointsResponse = {
  ok: boolean;
  data?: {
    page: number;
    pageSize: number;
    total: number;
    items: Array<{
      pickingPoint: {
        id: string;
        referenceId?: string;
        name?: string;
        locationId?: string;
        status?: "active" | "inactive" | string;
        dateCreatedCL?: string;
        dateModifiedCL?: string;
      };
      windowSchema?: {
        activeWindowsCount?: number;
      };
      profiles?: {
        createdBy?: ApiProfile;
        updatedBy?: ApiProfile;
      };
    }>;
  };
};

/* 2) Helpers */
const PER_PAGE = 10;
const MAX_CELL_CHARS = 14;

const StatusPill = ({ s }: { s: Estado }) => (
  <PickingStatusBadge status={s} colorMap={{ Activo: "bg-green-500" }} />
);

const mapProfileToUserMeta = (profile?: ApiProfile): { name: string; email: string } | undefined => {
  if (!profile) return undefined;

  const fullNameFromParts = [profile.nombres, profile.apellidos]
    .filter(Boolean)
    .join(" ")
    .trim();

  const name = (
    fullNameFromParts ||
    profile.fullName ||
    profile.userName ||
    profile.username ||
    profile.name ||
    ""
  ).trim();

  const email = (profile.email || profile.userEmail || "").trim();

  if (!name && !email) return undefined;

  return {
    name: name || "—",
    email: email || "—",
  };
};

const truncateCellText = (value: string, maxChars = MAX_CELL_CHARS) => {
  if (!value) return "";
  return value.length > maxChars ? `${value.slice(0, maxChars)}...` : value;
};

/* 3) Filtros (por columna) */
type Filters = { id: string; refId: string; name: string; location: string };
const initialFilters: Filters = { id: "", refId: "", name: "", location: "" };

const getFilters = (f: Filters) => [
  { id: "id", label: "ID", type: "text" as const, value: f.id, placeholder: "ID" },
  { id: "refId", label: "Ref ID", type: "text" as const, value: f.refId, placeholder: "Ref ID" },
  { id: "name", label: "Nombre", type: "text" as const, value: f.name, placeholder: "Nombre" },
  { id: "location", label: "Ubicación", type: "text" as const, value: f.location, placeholder: "Ubicación" },
];

/* 4) Columnas */
function getColumns(): Column<PickingPointRow>[] {
  return [
    {
      header: "ID",
      accessorKey: "id",
      cell: (r) => (
        <CopyableText text={r.id}>
          <span title={r.id}>{truncateCellText(r.id)}</span>
        </CopyableText>
      ),
    },
    {
      header: "Ref ID",
      accessorKey: "refId",
      cell: (r) => (
        <CopyableText text={r.refId}>
          <span title={r.refId}>{truncateCellText(r.refId)}</span>
        </CopyableText>
      ),
    },
    { header: "Nombre", accessorKey: "name" },
    {
      accessorKey: "windows",
      header: "Ventanas",
      cell: (r: PickingPointRow) => <CountBadgeCell value={r.windows} />,
    },

    { header: "Ubicación", accessorKey: "location" },
    { header: "Usuario creador", accessorKey: "creator", cell: (r) => <UserChip name={r.creator?.name} email={r.creator?.email} /> },
    { header: "Fecha de creación", accessorKey: "createdAt" },
    { header: "Usuario modificador", accessorKey: "modifier", cell: (r) => <UserChip name={r.modifier?.name} email={r.modifier?.email} /> },
    { header: "Modificado", accessorKey: "modifiedAt" },
    { header: "Estado", accessorKey: "status", cell: (r) => <StatusPill s={r.status} /> },

    /* ===== Columnas nuevas (opcionales) ===== */
    {
      header: "Opt. agrup.",
      accessorKey: "optimizeRounds",
      cell: (r: PickingPointRow) =>
        typeof r.optimizeRounds === "boolean" ? (r.optimizeRounds ? "Sí" : "No") : "—",
    },
    { header: "Min U/Ped", accessorKey: "minUnitsPerOrder" },
    { header: "Max U/Ped", accessorKey: "maxUnitsPerOrder" },
    { header: "Max Ped", accessorKey: "maxOrders" },
    {
      header: "Grupos",
      accessorKey: "productGroupRestriction",
      cell: (r: PickingPointRow) =>
        (r.productGroupRestriction && r.productGroupRestriction.length > 0)
          ? r.productGroupRestriction.join(", ")
          : "—",
    },
  ];
}

/* 5) View principal */
type PickingPointsViewProps = {
  locationId?: string;
};

export default function PickingPointsView({ locationId }: PickingPointsViewProps) {
  const router = useRouter();
  const { fetchWithAuthQA } = useFetchWithAuthQA();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<PickingPointRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchPoints = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PER_PAGE),
      });

      if (locationId) {
        query.set("locationId", locationId);
      }

      const response = await fetchWithAuthQA<PickingPointsResponse>(
        `picking-service/points/picking-points?${query.toString()}`,
        { method: "GET" }
      );

      const apiItems = response?.data?.items || [];

      const mapped: PickingPointRow[] = apiItems.map((item) => {
        const creator = item.profiles?.createdBy;
        const updatedBy = item.profiles?.updatedBy;

        return {
          id: item.pickingPoint.id,
          refId: item.pickingPoint.referenceId || "—",
          name: item.pickingPoint.name || "—",
          windows: Number(item.windowSchema?.activeWindowsCount ?? 0),
          location: item.pickingPoint.locationId || "—",
          creator: mapProfileToUserMeta(creator),
          modifier: mapProfileToUserMeta(updatedBy),
          createdAt: item.pickingPoint.dateCreatedCL || "—",
          modifiedAt: item.pickingPoint.dateModifiedCL || "—",
          status: item.pickingPoint.status === "active" ? "Activo" : "Inactivo",
        };
      });

      setRows(mapped);
      setTotalRecords(Number(response?.data?.total ?? mapped.length));
    } catch (error) {
      console.error("Error cargando puntos de picking:", error);
      setRows([]);
      setTotalRecords(0);
    }
  }, [currentPage, fetchWithAuthQA, locationId]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const filtered = useMemo(() => {
    const fid = filters.id.toLowerCase();
    const fref = filters.refId.toLowerCase();
    const fname = filters.name.toLowerCase();
    const floc = filters.location.toLowerCase();
    return rows.filter((r) => {
      const byId = !fid || r.id.toLowerCase().includes(fid);
      const byRef = !fref || r.refId.toLowerCase().includes(fref);
      const byName = !fname || r.name.toLowerCase().includes(fname);
      const byLoc = !floc || r.location.toLowerCase().includes(floc);
      return byId && byRef && byName && byLoc;
    });
  }, [filters, rows]);

  const handleExport = () => {
    const headers = ["ID", "REF ID", "NOMBRE", "VENTANAS", "UBICACIÓN", "CREADO", "CREADOR", "USUARIO_MODIFICADOR", "MODIFICADO", "ESTADO", "OPT_AGRUP", "MIN_U_PED", "MAX_U_PED", "MAX_PED", "GRUPOS"];
    const rows = filtered.map((r) => [
      r.id,
      r.refId,
      r.name,
      typeof r.windows === "number" ? r.windows : "",
      r.location,
      r.createdAt,
      r.creator?.name || "",
      r.modifier?.name || "",
      r.modifiedAt,
      r.status,
      typeof r.optimizeRounds === "boolean" ? (r.optimizeRounds ? "Sí" : "No") : "",
      r.minUnitsPerOrder ?? "",
      r.maxUnitsPerOrder ?? "",
      r.maxOrders ?? "",
      (r.productGroupRestriction || []).join(", "),
    ]);
    exportToCsv("puntos-picking.csv", [headers, ...rows]);
  };

  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push(`/ubicaciones/picking-points/nuevo`),
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
    {
      label: "Actualizar",
      variant: "secondary" as const,
      onClick: fetchPoints,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
  ];

  const viewFilters = getFilters(filters);
  const columns = getColumns();

  const handleFilterChange = (id: string, value: string) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [id]: value as Filters[keyof Filters] }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title="Puntos de picking"
        filters={viewFilters}
        onFilterChange={handleFilterChange}
        action={headerActions}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl shadow-sm">
            <DataTable
              data={filtered}
              columns={columns}
              dataType="General2"
              statusKey="status"
              rowPaddingY={12}
              rowBgClass="bg-white"
              onRowClick={(row: PickingPointRow) =>
                router.push(`/ubicaciones/picking-points/${encodeURIComponent(row.id)}`)
              }
            />
          </div>

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
