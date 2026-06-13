"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { GeneralStatusBadge } from "@/components/ui/badge/GeneralStatusBadge";
import { Bike, Car, Package, Truck } from "lucide-react";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { exportToCsv } from "@/components/presets/export/export";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

interface TypeVehicleRow {
  id?: string;
  Refid: string;
  name: string;
  motivo: string;
  icono: string;
  envios_max: string;
  items_max: string;
  volumen_maximo: string;
  status: "Activo" | "Inactivo" | "";
}

type ApiVehicleTypeItem = {
  id?: string;
  referenceId?: string | null;
  name?: string | null;
  type?: string | null;
  icon?: string | null;
  maxShippingQuantity?: number | string | null;
  maxProductQuantity?: number | string | null;
  maxVolume?: number | string | null;
  status?: string | null;
};

type ApiVehicleTypeResponse = {
  data?: ApiVehicleTypeItem[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
};

interface TypeVehicleFilters {
  search: string;
  name: string;
  motivo: string;
  status: "Activo" | "Inactivo" | "";
}

const ITEMS_PER_PAGE = 10;

const initialFilters: TypeVehicleFilters = {
  search: "",
  name: "",
  motivo: "",
  status: "",
};

const mockTypeVehicleRow: TypeVehicleRow[] = [
  {
    id: "1",
    Refid: "BTK",
    name: "Camioneta grande",
    motivo: "Van",
    icono: "shipping_van",
    envios_max: "40",
    items_max: "1500",
    volumen_maximo: "5",
    status: "Activo",
  },
];

function getVehicleIcon(iconValue: string) {
  const normalized = (iconValue || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("truck")) return <Truck className="h-4 w-4" />;
  if (normalized.includes("van")) return <Car className="h-4 w-4" />;
  if (normalized.includes("bike") || normalized.includes("motor")) return <Bike className="h-4 w-4" />;
  return <Package className="h-4 w-4" />;
}

const getColumns = (): Column<TypeVehicleRow>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: (row) => <span className="text-sm text-gray-800">{row.name}</span>,
  },
  {
    accessorKey: "motivo",
    header: "Motivo",
    cell: (row) => row.motivo,
  },
  {
    accessorKey: "icono",
    header: "Ícono",
    cell: (row) => {
      const raw = (row.icono || "").trim();
      const icon = getVehicleIcon(raw);
      if (!raw) return "-";

      return (
        <div className="inline-flex items-center gap-2">
          {icon}
          <span>{raw}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "envios_max",
    header: "Envíos (máx.)",
    cell: (row) => (
      <div className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-800">
        {row.envios_max}
      </div>
    ),
  },
  {
    accessorKey: "items_max",
    header: "Ítems (máx.)",
    cell: (row) => (
      <div className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-800">
        {row.items_max}
      </div>
    ),
  },
  {
    accessorKey: "volumen_maximo",
    header: "Volumen máximo",
    cell: (row) => (
      <div className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-800">
        {row.volumen_maximo}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (row) => <GeneralStatusBadge status={row.status} />,
  },
];

export default function TypeVehicleView() {
  const router = useRouter();
  const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();
  const columns = useMemo(() => getColumns(), []);
  const [tipoVehiculos, setTipoVehiculos] = useState<TypeVehicleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const nameOptions = useMemo(
    () =>
      Array.from(new Set(tipoVehiculos.map((row) => row.name).filter(Boolean)))
        .sort((left, right) => left.localeCompare(right))
        .map((value) => ({ label: value, value })),
    [tipoVehiculos]
  );

  const motivoOptions = useMemo(
    () =>
      Array.from(new Set(tipoVehiculos.map((row) => row.motivo).filter(Boolean)))
        .sort((left, right) => left.localeCompare(right))
        .map((value) => ({ label: value, value })),
    [tipoVehiculos]
  );

  const filterConfig = useMemo<FilterConfig<TypeVehicleFilters, TypeVehicleRow>[]>(
    () => [
      {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
          `${row.Refid} ${row.name}`.toLowerCase().includes(String(value ?? "").trim().toLowerCase()),
      },
      {
        id: "name",
        label: "Nombre",
        type: "select",
        options: nameOptions,
        rowValue: (row) => row.name,
      },
      {
        id: "motivo",
        label: "Motivo",
        type: "select",
        options: motivoOptions,
        rowValue: (row) => row.motivo,
      },
      {
        id: "status",
        label: "Estado",
        type: "select",
        options: [
          { label: "Activo", value: "Activo" },
          { label: "Inactivo", value: "Inactivo" },
        ],
        rowValue: (row) => row.status,
      },
    ],
    [motivoOptions, nameOptions]
  );

  const { headerFilters, handleFilterChange, applyFilters } =
    useStandardFilters<TypeVehicleFilters, TypeVehicleRow>({
      initialFilters,
      configs: filterConfig,
    });

  const loadVehicleTypes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetchWithAuthDelivery<ApiVehicleTypeResponse>("vehicle-type", {
        method: "GET",
      });

      const mapStatus = (value: string | null | undefined): "Activo" | "Inactivo" | "" => {
        const status = String(value || "").trim().toLowerCase();
        if (status === "active" || status === "activo") return "Activo";
        if (status === "inactive" || status === "inactivo") return "Inactivo";
        return "";
      };

      const mappedRows = (Array.isArray(response?.data) ? response.data : []).map((item, index) => ({
        id: String(item.id ?? index + 1),
        Refid: String(item.referenceId ?? ""),
        name: String(item.name ?? ""),
        motivo: String(item.type ?? ""),
        icono: String(item.icon ?? ""),
        envios_max: String(item.maxShippingQuantity ?? "0"),
        items_max: String(item.maxProductQuantity ?? "0"),
        volumen_maximo: String(item.maxVolume ?? "0"),
        status: mapStatus(item.status),
      }));

      setTipoVehiculos(mappedRows.length > 0 ? mappedRows : mockTypeVehicleRow);
    } catch (error) {
      console.error("Error cargando tipos de vehículo:", error);
      setTipoVehiculos(mockTypeVehicleRow);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuthDelivery, token]);

  useEffect(() => {
    loadVehicleTypes();
  }, [loadVehicleTypes]);

  const filteredRows = useMemo(() => applyFilters(tipoVehiculos), [applyFilters, tipoVehiculos]);
  const totalRecords = filteredRows.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [currentPage, totalRecords]);

  const handleExport = useCallback(() => {
    const headers = [
      "id",
      "Refid",
      "name",
      "motivo",
      "icono",
      "envios_max",
      "items_max",
      "volumen_maximo",
      "status",
    ];
    const data = filteredRows.map((row) => [
      row.id,
      row.Refid,
      row.name,
      row.motivo,
      row.icono,
      row.envios_max,
      row.items_max,
      row.volumen_maximo,
      row.status,
    ]);
    exportToCsv("typevehicle.csv", [headers, ...data]);
  }, [filteredRows]);

  const headerActions = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success" as const,
        onClick: () => router.push("/delivery/flota/tipo-de-vehiculo/nuevo"),
        icon: <PlusIcon className="h-5 w-5" />,
      },
      {
        label: "Exportar",
        variant: "primary" as const,
        onClick: handleExport,
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      },
    ],
    [handleExport, router]
  );

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Tipo vehículo"
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, String(value ?? ""));
        }}
        action={headerActions}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <p>Cargando tipos de vehículo…</p>
          ) : (
            <div className="overflow-hidden rounded-xl shadow-sm">
              <DataTable
                data={paginatedData}
                dataType="General2"
                statusKey="status"
                columns={columns}
                onRowClick={(row) => {
                  if (row.id) {
                    router.push(`/delivery/flota/tipo-de-vehiculo/${row.id}`);
                  }
                }}
                rowBgClass="bg-white"
                rowPaddingY={8}
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
