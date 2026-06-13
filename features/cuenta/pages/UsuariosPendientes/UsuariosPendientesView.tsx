// app/customers/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { formatDateTime } from "@/lib/format/date";

// ”€”€”€ 1 · Types & Mock Data ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€

export type UserStatus = "Active" | "Inactive";
export interface UserRow {
  refId: string;
  firstName: string;
  lastName: string;
  email: string;
  idFuncionario: string;
  perfil: string;
  totalAcces: boolean;
  motivo: string;
  userCreated: {
    name: string;
    email: string;
    avatar?: string;
  };
  dateCreated: string;
  status: UserStatus;
}
export const defaultAvatar = "https://freesvg.org/img/abstract-user-flat-3.png";

export const mockUserRows: UserRow[] = [
  {
    refId: "RUTCHL 22222222",
    firstName: "Flor",
    lastName: "KO",
    email: "flor.ko@example.com",
    idFuncionario: "22222222",
    perfil: "Picker",
    totalAcces: true,
    motivo: "",
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
    firstName: "Michaela",
    lastName: "Vergara",
    email: "michaela.vergara@example.com",
    idFuncionario: "72943314",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Ana",
    lastName: "Compte",
    email: "ana.compte@example.com",
    idFuncionario: "51120082",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Layla",
    lastName: "Itala",
    email: "layla.itala@example.com",
    idFuncionario: "227187662",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Leonardo",
    lastName: "Gambino",
    email: "leonardo.gambino@example.com",
    idFuncionario: "1231311",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Katherine",
    lastName: "Alvarez",
    email: "katherine.alvarez@example.com",
    idFuncionario: "39144658",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Ignacio",
    lastName: "Puga",
    email: "ignacio.puga@example.com",
    idFuncionario: "183947648",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Matias",
    lastName: "Crisosto",
    email: "matias.crisosto@example.com",
    idFuncionario: "18018530",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Ismael",
    lastName: "Garcia",
    email: "ismael.garcia@example.com",
    idFuncionario: "345654",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Katherine",
    lastName: "Alvarez",
    email: "katherine.alvarez2@example.com",
    idFuncionario: "15113114k",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Ana",
    lastName: "Compte",
    email: "ana.compte2@example.com",
    idFuncionario: "244707491",
    perfil: "Cliente",
    totalAcces: true,
    motivo: "",
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
    firstName: "Matias",
    lastName: "Crisosto",
    email: "matias.crisosto2@example.com",
    idFuncionario: "111111111",
    perfil: "Cliente",
    totalAcces: false,
    motivo: "",
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
    firstName: "Matias",
    lastName: "Crisosto",
    email: "matias.crisosto3@example.com",
    idFuncionario: "180185305",
    perfil: "Cliente",
    totalAcces: false,
    motivo: "",
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
    firstName: "Ismael",
    lastName: "Garcia",
    email: "ismael.garcia2@example.com",
    idFuncionario: "155508698",
    perfil: "Cliente",
    totalAcces: false,
    motivo: "",
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
    firstName: "Luis",
    lastName: "Perez",
    email: "luis.perez@example.com",
    idFuncionario: "888777666",
    perfil: "Cliente",
    totalAcces: false,
    motivo: "",
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
    firstName: "Maria",
    lastName: "Ruiz",
    email: "maria.ruiz@example.com",
    idFuncionario: "777666555",
    perfil: "Cliente",
    totalAcces: false,
    motivo: "",
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
    firstName: "Carlos",
    lastName: "Soto",
    email: "carlos.soto@example.com",
    idFuncionario: "666555444",
    perfil: "Cliente",
    totalAcces: false,
    motivo: "",
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
    firstName: "Daniela",
    lastName: "Morales",
    email: "daniela.morales@example.com",
    idFuncionario: "555444333",
    perfil: "Cliente",
    totalAcces: false,
    motivo: "",
    userCreated: {
      name: "system",
      email: "system@example.com",
      avatar: defaultAvatar,
    },
    dateCreated: "2021-06-20T14:20:00Z",
    status: "Active",
  },
];

const getColumns = (
  router: ReturnType<typeof useRouter>
): Column<UserRow>[] => [
    {
      accessorKey: "userCreated" as const,
      header: "User Image",
      cell: (r) => (
        <div
          className="flex items-center gap-2"
          onClick={() => router.push(`/cuenta/usuarios/pendientes/${r.refId}`)}
        >
          {r.userCreated.avatar && (
            <img src={r.userCreated.avatar} className="h-6 w-6 rounded-full" />
          )}
        </div>
      ),
    },
    /*  {
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
      }, */
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
      accessorKey: "email",
      header: "Email",
      cell: (r) => <span className="break-all"> {r.email}</span>,
    },

    {
      accessorKey: "perfil",
      header: "Profile",
      cell: (r) => r.perfil || "-",
    },
    {
      accessorKey: "idFuncionario",
      header: "Employee",
      cell: (r) => r.idFuncionario || "-",
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
      accessorKey: "refId",
      header: "Acciones",
      cell: (r) => (
        <button
          onClick={() => {
            console.log("removiendo usuario:", r.refId);
            if (
              window.confirm(`¿Seguro que quieres eliminar a ${r.firstName}?`)
            ) {
              alert(`Usuario ${r.firstName} eliminado`);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full 
								px-4 py-2 text-sm font-medium text-white 
								bg-[#ff2a2a] hover:bg-[#f44646]"
        >
          <TrashIcon className="h-5 w-5" />
          Remove
        </button>
      ),
    },
  ];

// ”€”€”€ 3 · Main View ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
export function UsersPendingView() {
  const router = useRouter();
  const [data, setData] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    // replace with your fetch/SWR
    setData(mockUserRows);
  }, []);

  // ”€”€”€ Header Actions ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "New",
        variant: "primary",
        icon: <PlusIcon className="h-5 w-5" />,
        onClick: () => router.push("/cuenta/usuarios/pendientes/nuevo"),
      },
      /* {
        label: "Delete",
        variant: "text",
        icon: <TrashIcon className="h-5 w-5" />,
        onClick: () => alert("Delete selected"),
      }, */

      {
        label: "Export",
        variant: "secondary",
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        onClick: () => {
          const headers = [
            "Document",
            "Firstname",
            "Lastname",
            "Email",
            "Commerce",
            "Erp",
            "Employee",
            "Is new",
            "Black listed",
            "Associate",
            "Status",
            "User created",
            "Date created",
          ];
          const rows = data.map((r) => [
            r.refId,
            r.firstName,
            r.lastName,
            r.email,
            r.idFuncionario,
            r.userCreated,
            r.dateCreated,
          ]);
          exportToCsv("customers.csv", [headers, ...rows]);
        },
      },
    ],
    [router, data]
  );

  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  const shown = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Pending user browse"
        filters={[
          { id: "refId", label: "Ref ID", type: "text", value: "" },
          {
            id: "idFuncionario",
            label: "ID Funcionario",
            type: "text",
            value: "",
          },
          { id: "firstName", label: "Firstname", type: "text", value: "" },
          { id: "lastName", label: "Lastname", type: "text", value: "" },
          { id: "email", label: "Email", type: "text", value: "" },
        ]}
        onFilterChange={(id, v) => console.log("filter", id, v)}
        action={headerActions}
      />
      <div className="p-6 flex-1">
        <DataTable
          data={shown}
          columns={getColumns(router)}
          rowPaddingY={12}
          rowBgClass="bg-white"
          showStatusBorder={true}
          dataType="General"
        />
        <div className="mt-4 flex flex-col items-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          <span className="text-sm text-gray-500">
            {data.length} resultados
          </span>
        </div>
      </div>
    </div>
  );
}

