// app/customers/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { Pagination } from "@/components/ui/pagination";
//import { StatusBadge } from "@/components/ui/badge/status";
import { exportToCsv } from "@/components/presets/export/export";
import { formatDateTime } from "@/lib/format/date";
import { GeneralStatusBadge } from "@/components/ui/badge/GeneralStatusBadge";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { useFetchWithAuthDelivery } from "@/lib/http/client";

export type DriverStatus = "Active" | "Inactive";
export interface DriverRow {
  refId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  documento?: string;
  idFuncionario?: string;
  userCreated: {
    name: string;
    email: string;
    avatar?: string;
  };
  user?: string;
  dateCreated: string;
  status: DriverStatus;
  activeWarehouse?: string;
}

type ApiDeliveryManItem = {
  id?: string;
  userId?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  documentNumber?: string | null;
  employeeId?: string | null;
  dateCreated?: string | null;
  status?: string | null;
  userCreated?: string | null;
  activeWarehouseId?: string | null;
};

type ApiDeliveryManResponse = {
  data?: ApiDeliveryManItem[];
};
export const defaultAvatar = "https://freesvg.org/img/abstract-user-flat-3.png";

export const mockDriverRows: DriverRow[] = [
  {
    refId: "RUTCHL 22222222",
    name: "Flor",
    firstName: "Flor",
    lastName: "KO",
    email: "flor.ko@example.com",
    idFuncionario: "22222222",
    documento: "12345678",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-10-22T17:33:00Z",
    status: "Active",
  },
  {
    refId: "CEDULACOL 72943314",
    name: "Michaela",
    firstName: "Michaela",
    lastName: "Vergara",
    email: "michaela.vergara@example.com",
    idFuncionario: "72943314",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-10-20T11:27:00Z",
    status: "Inactive",
  },
  {
    refId: "CEDULACOL 51120082",
    name: "Ana",
    firstName: "Ana",
    lastName: "Compte",
    email: "ana.compte@example.com",
    idFuncionario: "51120082",

    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-10-15T11:23:00Z",
    status: "Inactive",
  },
  {
    refId: "RUTCHL 227187662",
    name: "Layla",
    firstName: "Layla",
    lastName: "Itala",
    email: "layla.itala@example.com",
    idFuncionario: "227187662",

    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-10-14T15:15:00Z",
    status: "Active",
  },
  {
    refId: "CEDULACOL 1231311",
    name: "Leonardo",
    firstName: "Leonardo",
    lastName: "Gambino",
    email: "leonardo.gambino@example.com",
    idFuncionario: "1231311",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-10-06T12:07:00Z",
    status: "Active",
  },
  {
    refId: "CEDULACOL 39144658",
    name: "Katherine",
    firstName: "Katherine",
    lastName: "Alvarez",
    email: "katherine.alvarez@example.com",
    idFuncionario: "39144658",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-09-30T16:45:00Z",
    status: "Inactive",
  },
  {
    refId: "CEDULACOL 183947648",
    name: "Ignacio",
    firstName: "Ignacio",
    lastName: "Puga",
    email: "ignacio.puga@example.com",
    idFuncionario: "183947648",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-09-30T12:47:00Z",
    status: "Active",
  },
  {
    refId: "CEDULACOL 18018530",
    name: "Matias",
    firstName: "Matias",
    lastName: "Crisosto",
    email: "matias.crisosto@example.com",
    idFuncionario: "18018530",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-09-30T09:21:00Z",
    status: "Active",
  },
  {
    refId: "CEDULACOL 345654",
    name: "Ismael",
    firstName: "Ismael",
    lastName: "Garcia",
    email: "ismael.garcia@example.com",
    idFuncionario: "345654",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-09-29T18:21:00Z",
    status: "Active",
  },
  {
    refId: "RUTCHL 15113114k",
    name: "Katherine",
    firstName: "Katherine",
    lastName: "Alvarez",
    email: "katherine.alvarez2@example.com",
    idFuncionario: "15113114k",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-09-12T23:21:00Z",
    status: "Active",
  },
  {
    refId: "RUTCHL 244707491",
    name: "Ana",
    firstName: "Ana",
    lastName: "Compte",
    email: "ana.compte2@example.com",
    idFuncionario: "244707491",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-09-09T14:40:00Z",
    status: "Inactive",
  },
  {
    refId: "RUTCHL 111111111",
    name: "Matias",
    firstName: "Matias",
    lastName: "Crisosto",
    email: "matias.crisosto2@example.com",
    idFuncionario: "111111111",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-08-24T11:51:00Z",
    status: "Active",
  },
  {
    refId: "RUTCHL 180185305",
    name: "Matias",
    firstName: "Matias",
    lastName: "Crisosto",
    email: "matias.crisosto3@example.com",
    idFuncionario: "180185305",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-08-24T10:33:00Z",
    status: "Active",
  },
  {
    refId: "RUTCHL 155508698",
    name: "Ismael",
    firstName: "Ismael",
    lastName: "Garcia",
    email: "ismael.garcia2@example.com",
    idFuncionario: "155508698",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-08-20T14:27:00Z",
    status: "Inactive",
  },
  {
    refId: "CEDULACOL 888777666",
    name: "Luis",
    firstName: "Luis",
    lastName: "Perez",
    email: "luis.perez@example.com",
    idFuncionario: "888777666",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-08-15T09:10:00Z",
    status: "Inactive",
  },
  {
    refId: "CEDULACOL 777666555",
    name: "Maria",
    firstName: "Maria",
    lastName: "Ruiz",
    email: "maria.ruiz@example.com",
    idFuncionario: "777666555",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-07-10T12:00:00Z",
    status: "Active",
  },
  {
    refId: "CEDULACOL 666555444",
    name: "Carlos",
    firstName: "Carlos",
    lastName: "Soto",
    email: "carlos.soto@example.com",
    idFuncionario: "666555444",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-07-01T08:45:00Z",
    status: "Inactive",
  },
  {
    refId: "RUTCHL 555444333",
    name: "Daniela",
    firstName: "Daniela",
    lastName: "Morales",
    email: "daniela.morales@example.com",
    idFuncionario: "555444333",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-06-20T14:20:00Z",
    status: "Active",
  },
];

/* const getColumns = (
  router: ReturnType<typeof useRouter>
): Column<DriverRow>[] => [
  {
    accessorKey: "refId",
    header: "Document",
    cell: (r) => {
      return (
        <span
          className="break-all cursor-pointer text-blue-600 hover:underline"
          onClick={() => router.push(`/cuenta/usuarios/listado-usuarios/${r.refId}`)}
        >
          {r.refId}
        </span>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (r) => <span className="break-all"> {r.email}</span>,
  },

  {
    accessorKey: "firstName",
    header: "Firstname",
    cell: (r) => r.firstName,
  },
  {
    accessorKey: "lastName",
    header: "Lastname",
    cell: (r) => r.lastName,
  },
  {
    accessorKey: "idFuncionario",
    header: "Employee",
    cell: (r) => r.idFuncionario || "-",
  },
  {
    accessorKey: "userCreated" as const,
    header: "User created",
    cell: (r) => (
      <div className="flex items-center gap-2">
        {r.userCreated.avatar && (
          <img src={r.userCreated.avatar} className="h-6 w-6 rounded-full" />
        )}
        <div>
          <div className="text-sm font-medium">{r.userCreated.name}</div>
          <div className="text-xs text-gray-500">{r.userCreated.email}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "dateCreated",
    header: "Date created",
    cell: (r) => {
      const { date, time } = formatDateTime(r.dateCreated, {
        locale: "es-CL", // o el que necesites
        timeZone: "America/Santiago",
      });
      return (
        <div className="flex flex-col leading-tight">
          <span>{date}</span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
      );
    },
  },
];
 */

const getColumns = (
  router: ReturnType<typeof useRouter>
): Column<DriverRow>[] => [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: (r) => <span className="break-all text-sm text-gray-800">{r.name}</span>,
    },
    {
      accessorKey: "lastName",
      header: "Apellido",
      cell: (r) => r.lastName,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (r) => <span className="break-all">{r.email}</span>,
    },
    {
      accessorKey: "documento" as const,
      header: "Documento",
      cell: (r) => r.documento ? <CopyableText text={r.documento}>{r.documento}</CopyableText> : "\u2014",
    },
    {
      accessorKey: "idFuncionario" as const,
      header: "ID Funcionario",
      cell: (r) => r.idFuncionario ? <CopyableText text={r.idFuncionario}>{r.idFuncionario}</CopyableText> : "\u2014",
    },
    {
      accessorKey: "dateCreated",
      header: "Creación",
      cell: (r) => {
        const { date, time } = formatDateTime(r.dateCreated, {
          locale: "es-CL",
          timeZone: "America/Santiago",
        });
        return (
          <div className="flex flex-col leading-tight">
            <span>{date}</span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "userCreated" as const,
      header: "Usuario creador",
      cell: (r) => {
        return (
          <div className="inline-flex items-center gap-2 border rounded-full border-gray-300 px-3 py-0.5 bg-white max-w-max">
            {r.userCreated.avatar && (
              <img
                src={r.userCreated.avatar}
                alt={r.userCreated.name}
                className="h-6 w-6 rounded-full flex-shrink-0"
              />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium whitespace-nowrap">
                {r.userCreated.name}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {r.userCreated.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "firstName" as const,
      header: "Usuario",
      cell: (r) => {
        const fullName = [r.name, r.lastName].map((v) => (v || "").trim()).filter(Boolean).join(" ") || "-";
        return (
          <div className="inline-flex items-center gap-2 border rounded-full border-gray-300 px-3 py-0.5 bg-white max-w-max">
            {r.userCreated.avatar && (
              <img
                src={r.userCreated.avatar}
                alt={r.userCreated.name}
                className="h-6 w-6 rounded-full flex-shrink-0"
              />
            )}
            {/* Este div debe poder estrecharse */}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                {fullName}
              </span>
              <span className="text-xs text-gray-500 truncate">{r.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (r) => <GeneralStatusBadge status={r.status} />,
    },
  ];

interface DriverFilters {
  firstName: string;
  lastName: string;
  email: string;
  userCreated: string;
}

const initialFilters: DriverFilters = {
  firstName: "",
  lastName: "",
  email: "",
  userCreated: "",
};

const filterConfig: FilterConfig<DriverFilters, DriverRow>[] = [
  {
    id: "firstName",
    label: "Nombre",
    type: "text",
    match: (row, value) =>
      `${row.name} ${row.firstName}`.toLowerCase().includes(String(value ?? "").trim().toLowerCase()),
  },
  {
    id: "lastName",
    label: "Apellido",
    type: "text",
    rowValue: (row) => row.lastName,
  },
  {
    id: "email",
    label: "Email",
    type: "text",
    rowValue: (row) => row.email,
  },
  {
    id: "userCreated",
    label: "Usuario creador",
    type: "text",
    match: (row, value) =>
      `${row.userCreated.name} ${row.userCreated.email}`
        .toLowerCase()
        .includes(String(value ?? "").trim().toLowerCase()),
  },
];

export function DriversView() {
  const router = useRouter();
  const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();
  const columns = useMemo(() => getColumns(router), [router]);
  const [data, setData] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const { headerFilters, handleFilterChange, applyFilters } =
    useStandardFilters<DriverFilters, DriverRow>({
      initialFilters,
      configs: filterConfig,
    });

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchWithAuthDelivery<ApiDeliveryManResponse>("driver", {
        method: "GET",
      });

      const mapped: DriverRow[] = (Array.isArray(res?.data) ? res.data : []).map((item, index) => {
        const statusRaw = String(item.status || "").trim().toLowerCase();
        return {
          refId: String(item.id ?? index + 1),
          name: String(item.firstname ?? "-"),
          firstName: String(item.firstname ?? "-"),
          lastName: String(item.lastname ?? "-"),
          email: String(item.email ?? "-"),
          documento: String(item.documentNumber ?? ""),
          idFuncionario: String(item.employeeId ?? ""),
          userCreated: {
            name: String(item.userCreated ?? "Sistema"),
            email: "-",
            avatar: defaultAvatar,
          },
          dateCreated: String(item.dateCreated ?? new Date().toISOString()),
          status: statusRaw === "inactive" ? "Inactive" : "Active",
          activeWarehouse: String(item.activeWarehouseId ?? ""),
        };
      });

      setData(mapped.length > 0 ? mapped : mockDriverRows);
    } catch (error) {
      console.error("Error listando conductores:", error);
      setData(mockDriverRows);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuthDelivery, token]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredRows = useMemo(() => applyFilters(data), [applyFilters, data]);
  const shown = useMemo(
    () => filteredRows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filteredRows, page]
  );

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredRows.length, page]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        icon: <PlusIcon className="h-5 w-5" />,
        onClick: () => router.push("/delivery/flota/conductores/nuevo"),
      },
      {
        label: "Exportar",
        variant: "primary",
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        onClick: () => {
          const headers = [
            "Nombre",
            "Apellido",
            "Email",
            "Documento",
            "ID Funcionario",
            "Creación",
            "Usuario creador",
            "Status",
            "activeWarehouse",
          ];
          const rows = filteredRows.map((r) => [
            r.firstName,
            r.lastName,
            r.email,
            r.documento,
            r.idFuncionario,
            r.dateCreated,
            r.userCreated.name,
            r.status,
            r.activeWarehouse,
          ]);
          exportToCsv("conductores.csv", [headers, ...rows]);
        },
      },
      {
        label: "",
        variant: "text",
        icon: <FunnelIcon className="h-5 w-5 text-gray-500" />,
        onClick: () => console.log("abrir filtros"),
      },
      {
        label: "",
        variant: "text",
        icon: <ArrowPathIcon className="h-5 w-5 text-gray-500" />,
        onClick: fetchList,
      },
      {
        label: "",
        variant: "text",
        icon: <TrashIcon className="h-5 w-5 text-gray-500" />,
        onClick: () => console.log("Eliminar seleccionado"),
      },
    ],
    [router, filteredRows, fetchList]
  );

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Conductores"
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setPage(1);
          handleFilterChange(id, String(value ?? ""));
        }}
        action={headerActions}
      />

      <div className="p-6 flex-1">
        {loading ? (
          <p>Cargando conductores…</p>
        ) : (
          <DataTable
            data={shown}
            columns={columns}
            onRowClick={(row: DriverRow) => router.push(`/delivery/flota/conductores/${row.refId}`)}
            rowPaddingY={12}
            rowBgClass="bg-white"
            showStatusBorder={true}
            dataType="General"
          />
        )}

        <div className="mt-4 flex flex-col items-center">
          <Pagination
            currentPage={page}
            totalRecords={filteredRows.length}
            pageSize={PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

