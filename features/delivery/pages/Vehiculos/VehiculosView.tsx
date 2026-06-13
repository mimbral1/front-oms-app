"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowDownTrayIcon, PlusIcon, } from "@heroicons/react/24/outline";
import { BikeIcon, TruckIcon, CarIcon, BusIcon } from "lucide-react";
import { FaMotorcycle } from "react-icons/fa";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format/date";
import { GeneralStatusBadge } from "@/components/ui/badge/GeneralStatusBadge";
import { exportToCsv } from "@/components/presets/export/export";
import { Avatar } from "@/components/ui/user-avatar";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

export interface vehiculo {
  ID?: string;
  type: string;
  refID: string;
  name: string;
  company: string;
  placa: string;
  model: string;
  brand: string;
  year: string;
  capacity: string;
  user: {
    img: string;
    name: string;
    email: string;
  };
  modificado: {
    fecha: string;
    img: string;
    name: string;
    email: string;
  };
  status: "Activo" | "Inactivo";
}

type ApiVehicleItem = {
  id?: string;
  refId?: string | null;
  referenceId?: string | null;
  name?: string | null;
  vehicleTypeName?: string | null;
  vehicleTypeId?: string | null;
  companyName?: string | null;
  companyId?: string | null;
  plate?: string | null;
  model?: string | null;
  brand?: string | null;
  year?: number | string | null;
  capacity?: number | string | null;
  dateModified?: string | null;
  userCreatedName?: string | null;
  userCreatedEmail?: string | null;
  userModifiedName?: string | null;
  userModifiedEmail?: string | null;
  status?: string | null;
};

type ApiVehicleResponse = {
  data?: ApiVehicleItem[];
};

const MockVehiculos: vehiculo[] = [
  {
    "ID": "1",
    "type": "Camión chico",
    "refID": "C17",
    "name": "Camión con acoplado",
    "company": "DHL",
    "placa": "Plate",
    "model": "Ref - 1",
    "brand": "Brand",
    "year": "1999",
    "capacity": "23",
    "user": {
      "img": "https://randomuser.me/api/portraits/men/1.jpg",
      "name": "Usuario 1",
      "email": "usuario1@gmail.com",
    },
    modificado: {
      fecha: "2021-10-22T17:33:00Z",
      img: "https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png",
      name: "Juanito",
      email: "juanito@gmail.com",
    },
    status: "Activo",
  },
  {
    "ID": "2",
    "type": "Bicicleta",
    "refID": "JAN123",
    "name": "Minivan",
    "company": "beetrack",
    "placa": "ABC123",
    "model": "L300",
    "brand": "Mitsubishi",
    "year": "1997",
    "capacity": "100",
    "user": {
      "img": "https://randomuser.me/api/portraits/men/2.jpg",
      "name": "Usuario 2",
      "email": "usuario2@gmail.com",
    },
    modificado: {
      fecha: "2022-05-15T10:12:00Z",
      img: "https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png",
      name: "María",
      email: "maria@example.com",
    },
    status: "Inactivo",
  },
]
  ;
const getColumns = (
  router: ReturnType<typeof useRouter>
): Column<vehiculo>[] => [
    {
      header: "Ref ID",
      accessorKey: "refID",
      cell: (row: vehiculo) => (
        <div className="text-sm">
          <CopyableText text={row.refID} className="font-medium text-gray-900">{row.refID}</CopyableText>
        </div>
      ),
    },
    {
      header: "Nombre",
      accessorKey: "name",
      cell: (row: vehiculo) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.name}</div>
        </div>
      ),
    },
    {
      header: "Compañia",
      accessorKey: "company",
      cell: (row: vehiculo) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.company}</div>
        </div>
      ),
    },
    {
      header: "Placa",
      accessorKey: "placa",
      cell: (row: vehiculo) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.placa}</div>
        </div>
      ),
    },
    {
      header: "Modelo",
      accessorKey: "model",
      cell: (row: vehiculo) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.model}</div>
        </div>
      ),
    },
    {
      header: "Marca",
      accessorKey: "brand",
      cell: (row: vehiculo) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.brand}</div>
        </div>
      ),
    },
    {
      header: "Año",
      accessorKey: "year",
      cell: (row: vehiculo) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.year}</div>
        </div>
      ),
    },
    {
      header: "Capacidad",
      accessorKey: "capacity",
      cell: (row: vehiculo) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.capacity}</div>
        </div>
      ),
    },
    {
      header: "Usuario creador",
      accessorKey: "user" as const,
      cell: (row: vehiculo) => (
        <div className="flex items-center gap-2">
          <Avatar
            name={row.user.name || row.user.email || "-"}
            src={row.user.img || undefined}
            alt={row.user.name || row.user.email || "-"}
            className="h-6 w-6"
          />
          <div>
            <div className="text-sm font-medium">{row.user.name}</div>
            <div className="text-xs text-gray-500">{row.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Fecha Modificacion",
      accessorKey: "modificado",
      cell: (row: vehiculo) => {
        const { date, time } = formatDateTime(row.modificado.fecha, {
          locale: "es-CL",
          timeZone: "America/Santiago",
        });
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">{date}</span>
            <span className="text-gray-600">{time}</span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: vehiculo) => <GeneralStatusBadge status={row.status} />,
    },
  ];


export function getVehicleIcon(type: string) {
  switch (type.toLowerCase()) {
    case "bicicleta":
      return <BikeIcon className="h-5 w-5 text-blue-600 mr-2" />;
    case "camión chico":
      return <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />;
    case "auto":
      return <CarIcon className="h-5 w-5 text-blue-600 mr-2" />;
    case "bus":
      return <BusIcon className="h-5 w-5 text-blue-600 mr-2" />;
    case "motocicleta":
      return <FaMotorcycle className="h-5 w-5 text-blue-600 mr-2" />;
    default:
      return <TruckIcon className="h-5 w-5 text-gray-400 mr-2" />;
  }
}


/* interface ProductFilters {
  search: string;
  salesChannels: string;
  category: string;
  officeType: string;
}
 */

interface VehicleFilters {
  search: string;
  name: string;
  company: string;
  brand: string;
  status: "" | "Activo" | "Inactivo";
}

const initialVehicleFilters: VehicleFilters = {
  search: "",
  name: "",
  company: "",
  brand: "",
  status: "",
};

const vehicleFilterConfig: FilterConfig<VehicleFilters, vehiculo>[] = [
  {
    id: "search",
    label: "Ref ID",
    type: "text",
    rowValue: (vehicle) => [vehicle.refID, vehicle.placa, vehicle.name],
  },
  {
    id: "name",
    label: "Nombre",
    type: "text",
    rowValue: (vehicle) => [vehicle.refID, vehicle.placa, vehicle.name],
  },
  {
    id: "company",
    label: "Compañía",
    type: "select",
    options: [
      { label: "DHL", value: "DHL" },
      { label: "FedEx", value: "FedEx" },
      { label: "UPS", value: "UPS" },
    ],
    emptyOptionLabel: "Compañía",
    rowValue: (vehicle) => vehicle.company,
  },
  {
    id: "brand",
    label: "Marca",
    type: "select",
    options: [
      { label: "Mitsubishi", value: "Mitsubishi" },
      { label: "Mercedes-Benz", value: "Mercedes-Benz" },
      { label: "Scania", value: "Scania" },
    ],
    emptyOptionLabel: "Marca",
    rowValue: (vehicle) => vehicle.brand,
  },
  {
    id: "status",
    label: "Estado",
    type: "select",
    options: [
      { label: "Activo", value: "Activo" },
      { label: "Inactivo", value: "Inactivo" },
    ],
    emptyOptionLabel: "Estado",
    rowValue: (vehicle) => vehicle.status,
  },
];

export function VehiculosView() {
  const router = useRouter();
  const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();
  const [vehiculos, setVehiculos] = useState<vehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const {
    headerFilters,
    handleFilterChange,
    applyFilters,
  } = useStandardFilters<VehicleFilters, vehiculo>({
    initialFilters: initialVehicleFilters,
    configs: vehicleFilterConfig,
  });

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const loadVehicles = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuthDelivery<ApiVehicleResponse>("vehicle", {
          method: "GET",
        });

        const mapped: vehiculo[] = (Array.isArray(res?.data) ? res.data : []).map((item, index) => {
          const statusRaw = String(item.status || "").trim().toLowerCase();
          return {
            ID: String(item.id ?? index + 1),
            type: String(item.vehicleTypeName ?? item.vehicleTypeId ?? "Vehículo"),
            refID: String(item.refId ?? item.referenceId ?? "-"),
            name: String(item.name ?? "-"),
            company: String(item.companyName ?? item.companyId ?? "-"),
            placa: String(item.plate ?? "-"),
            model: String(item.model ?? "-"),
            brand: String(item.brand ?? "-"),
            year: String(item.year ?? "-"),
            capacity: String(item.capacity ?? "0"),
            user: {
              img: "",
              name: String(item.userCreatedName ?? "Sistema"),
              email: String(item.userCreatedEmail ?? "-"),
            },
            modificado: {
              fecha: String(item.dateModified ?? new Date().toISOString()),
              img: "",
              name: String(item.userModifiedName ?? "Sistema"),
              email: String(item.userModifiedEmail ?? "-"),
            },
            status: statusRaw === "inactive" ? "Inactivo" : "Activo",
          };
        });

        if (mounted) setVehiculos(mapped.length > 0 ? mapped : MockVehiculos);
      } catch (error) {
        console.error("Error listando vehículos:", error);
        if (mounted) setVehiculos(MockVehiculos);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadVehicles();
    return () => {
      mounted = false;
    };
  }, [fetchWithAuthDelivery, token]);

  const filteredVehiculos = useMemo(
    () => applyFilters(vehiculos),
    [applyFilters, vehiculos]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // cantidad de items por cada pagina
  const totalPages = Math.ceil(filteredVehiculos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredVehiculos.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const columns = getColumns(router);

  /* export CSV */
  const handleExport = () => {
    const headers = [
      "Tipo",
      "Ref ID",
      "Nombre",
      "Compañia",
      "Placa",
      "Modelo",
      "Marca",
      "Año",
      "Capacidad",
      "Username",
      "User Email",
      "UserModified",
      "UserModidied Email",
      "Estado",
    ];
    const rows = filteredVehiculos.map((r) => [
      r.type,
      r.refID,
      r.name,
      r.company,
      r.placa,
      r.model,
      r.brand,
      r.year,
      r.capacity,
      r.user.name,
      r.user.email,
      r.modificado.name,
      r.modificado.email,
      r.status,
    ]);
    exportToCsv("vehiculos.csv", [headers, ...rows]);
  };

  /* acciones header */
  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push("/delivery/flota/vehiculos/nuevo"),
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: handleExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Vehículos"
        filters={headerFilters}
        onFilterChange={(id, value) => {
          handleFilterChange(id, value);
          setCurrentPage(1);
        }}
        action={headerActions}
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <p>Cargando vehículos…</p>
          ) : (
            <div className="overflow-hidden rounded-xl shadow-sm">
              <DataTable
                data={paginatedData}
                dataType="General2"
                statusKey="status"
                columns={columns as any}
                onRowClick={(row: vehiculo) => {
                  if (row.ID) router.push(`/delivery/flota/vehiculos/${row.ID}`);
                }}
                rowBgClass="bg-white"
                rowPaddingY={8}
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            {filteredVehiculos.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
            <div className="text-sm text-gray-500">
              {filteredVehiculos.length} resultados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

