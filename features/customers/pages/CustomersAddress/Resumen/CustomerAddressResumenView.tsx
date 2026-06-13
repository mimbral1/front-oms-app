"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { SchemeFields } from "@/features/customers/components/customers-address/EsquemaField";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

export interface Scheme {
  id: string;
  CustomerName: string;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: number;
  postalCode: string;
  complement?: string;
  latitude: number;
  longitude: number;
  status: "Activo" | "Inactivo";
  createdAt: string;
  createdBy: {
    username: string;
    email: string;
    imagen: string;
  };

  updatedAt: string;
  user: {
    username: string;
    usermail: string;
    userimage: string;
  };
}

export const schemesMock: Scheme[] = [
  {
    id: "1",
    CustomerName: "Michaela Vergara",
    country: "CHL",
    state: "-",
    city: "Vitacura",
    neighborhood: "Vitacura",
    street: "Av. Providencia",
    number: 417,
    postalCode: "7630000",
    complement: "-",
    latitude: -33.3985,
    longitude: -70.5855,
    status: "Activo",
    createdAt: "2021-10-13T14:14:59Z",
    createdBy: {
      username: "system",
      email: "system@fizzmod.com",
      imagen:
        "https://static.vecteezy.com/system/resources/previews/007/407/996/non_2x/user-icon-person-icon-client-symbol-login-head-sign-icon-design-vector.jpg",
    },
    updatedAt: "2021-10-21T19:51:14Z",
    user: {
      username: "Ismael Garcia",
      usermail: "ismael@fizzmod.com",
      userimage: "https://i.pravatar.cc/40?u=ismael",
    },
  },
  {
    id: "2",
    CustomerName: "Flor KO",
    country: "CHL",
    state: "-",
    city: "Las Condes",
    neighborhood: "Las Condes",
    street: "Av. Providencia",
    number: 123,
    postalCode: "7550000",
    complement: "-",
    latitude: -33.404,
    longitude: -70.5796,
    status: "Activo",
    createdAt: "2021-10-22T17:33:00Z",
    createdBy: {
      username: "system",
      email: "system@fizzmod.com",
      imagen:
        "https://static.vecteezy.com/system/resources/previews/007/407/996/non_2x/user-icon-person-icon-client-symbol-login-head-sign-icon-design-vector.jpg",
    },
    updatedAt: "2021-10-22T17:33:00Z",
    user: {
      username: "Flor KO",
      usermail: "flor.ko@fizzmod.com",
      userimage: "https://i.pravatar.cc/40?u=flor",
    },
  },
  {
    id: "3",
    CustomerName: "Ismael Garcia",
    country: "CHL",
    state: "-",
    city: "Salta",
    neighborhood: "-",
    street: "Av. Providencia",
    number: 2608,
    postalCode: "4400",
    complement: "-",
    latitude: -33.4378,
    longitude: -70.6505,
    status: "Activo",
    createdAt: "2021-09-30T09:21:00Z",
    createdBy: {
      username: "system",
      email: "system@fizzmod.com",
      imagen:
        "https://static.vecteezy.com/system/resources/previews/007/407/996/non_2x/user-icon-person-icon-client-symbol-login-head-sign-icon-design-vector.jpg",
    },
    updatedAt: "2021-09-30T09:21:00Z",
    user: {
      username: "Matias Crisosto",
      usermail: "matias.crisosto@fizzmod.com",
      userimage: "https://i.pravatar.cc/40?u=matias",
    },
  },
  {
    id: "4",
    CustomerName: "Michaela Vergara",
    country: "CHL",
    state: "-",
    city: "Santiago",
    neighborhood: "Las Condes",
    street: "Av. Providencia",
    number: 5413,
    postalCode: "7550000",
    complement: "-",
    latitude: -33.4166,
    longitude: -70.5863,
    status: "Activo",
    createdAt: "2021-09-29T18:21:00Z",
    createdBy: {
      username: "system",
      email: "system@fizzmod.com",
      imagen:
        "https://static.vecteezy.com/system/resources/previews/007/407/996/non_2x/user-icon-person-icon-client-symbol-login-head-sign-icon-design-vector.jpg",
    },
    updatedAt: "2021-09-29T18:21:00Z",
    user: {
      username: "Katherine Alvarez",
      usermail: "katherine.alvarez@fizzmod.com",
      userimage: "https://i.pravatar.cc/40?u=katherine",
    },
  },
  {
    id: "5",
    CustomerName: "Ismael Garcia",
    country: "CHL",
    state: "-",
    city: "Providencia",
    neighborhood: "-",
    street: "Av. Providencia",
    number: 2608,
    postalCode: "-",
    complement: "-",
    latitude: -33.4328,
    longitude: -70.6071,
    status: "Activo",
    createdAt: "2021-10-15T11:23:00Z",
    createdBy: {
      username: "system",
      email: "system@fizzmod.com",
      imagen:
        "https://static.vecteezy.com/system/resources/previews/007/407/996/non_2x/user-icon-person-icon-client-symbol-login-head-sign-icon-design-vector.jpg",
    },
    updatedAt: "2021-10-15T11:23:00Z",
    user: {
      username: "Ana Compte",
      usermail: "ana.compte@fizzmod.com",
      userimage: "https://i.pravatar.cc/40?u=ana",
    },
  },
  // …puedes agregar más filas siguiendo este patrón…
];

export function ResumenView() {
  const router = useRouter();
  const { id } = useParams();
  const scheme = schemesMock.find((o) => o.id === id) ?? schemesMock[0];

  const [schemeData, setSchemeData] = useState<typeof scheme>(scheme);

  useEffect(() => {
    const found = schemesMock.find((o) => o.id === id) ?? schemesMock[0];
    setSchemeData(found);
  }, [id]);

  const handleChange = <K extends keyof Scheme>(field: K, value: Scheme[K]) => {
    setSchemeData((prev) => ({ ...prev, [field]: value }));
  };

  if (!scheme) {
    return (
      <>
        <p className="p-4 text-center text-red-500">Esquema no encontrado</p>
      </>
    );
  }

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => { },
        icon: <SaveOutlined className="h-5 w-5" />,
      },

      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/customers/direcciones"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    []
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Dirección del cliente
          </div>
          <div className="text-2xl font-semibold text-gray-900">{schemeData.CustomerName ?? "—"}</div>
        </div>
      ),
      description: schemeData.status === "Inactivo" ? "Pending" : "",
      action: headerActions,
      status: {
        text: schemeData.status,
        variant: schemeData.status === "Activo" ? "success" : "warning",
      },
    } as PageHeaderProps),
    [schemeData.id, schemeData.status, headerActions]
  );

  return (
    <div className="p-6 bg-white">
      <SchemeFields
        scheme={schemeData}
        onChange={handleChange}
        isReadOnly={false}
      />
    </div>
  );
}
