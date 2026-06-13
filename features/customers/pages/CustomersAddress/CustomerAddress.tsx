// app/customers/[customerId]/addresses/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  PlusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
// No necesitamos importar el componente Pagination antiguo si ya no se usa aquí.
// import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/badge/status";
import { exportToCsv } from "@/components/presets/export/export";

interface AddressRow {
  id: string;
  customer: string;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  postal: string;
  complement: string;
  status: "Activo" | "Inactivo";
}

/** 👇 Datos de ejemplo */
const mockAddresses: AddressRow[] = [
  {
    id: "1",
    customer: "Michaela Vergara",
    country: "CHL",
    state: "-",
    city: "Vitacura",
    neighborhood: "Vitacura",
    street: "Av Villarán",
    number: "417",
    postal: "7630000",
    complement: "-",
    status: "Activo",
  },
  {
    id: "2",
    customer: "Flor KO",
    country: "CHL",
    state: "-",
    city: "Las Condes",
    neighborhood: "Las Condes",
    street: "Calle",
    number: "123",
    postal: "7550000",
    complement: "-",
    status: "Activo",
  },
  {
    id: "3",
    customer: "Ismael Garcia",
    country: "CHL",
    state: "-",
    city: "Salta",
    neighborhood: "-",
    street: "Av. Providencia",
    number: "2608",
    postal: "4400",
    complement: "-",
    status: "Activo",
  },
  {
    id: "4",
    customer: "Michaela Vergara",
    country: "CHL",
    state: "-",
    city: "Santiago",
    neighborhood: "Las Condes",
    street: "Avenida Presidente Kennedy",
    number: "5413",
    postal: "7550000",
    complement: "-",
    status: "Activo",
  },
  {
    id: "5",
    customer: "Ismael Garcia",
    country: "CHL",
    state: "-",
    city: "Providencia",
    neighborhood: "-",
    street: "Av. Providencia",
    number: "2608",
    postal: "-",
    complement: "-",
    status: "Activo",
  },
  // … puedes agregar más filas …
];

/** ─── Columnas para la tabla ───────────────────────────────── */
const getColumns = (
  router: ReturnType<typeof useRouter>
): Column<AddressRow>[] => [
    {
      accessorKey: "customer",
      header: "Cliente",
      cell: (r) => (
        <div
          className="whitespace-pre-wrap text-sm font-medium text-gray-900"
          onClick={() => router.push(`/customers/direcciones/${r.id}`)}
        >
          {r.customer}
        </div>
      ),
    },
    {
      accessorKey: "country",
      header: "País",
      cell: (r) => r.country,
    },
    {
      accessorKey: "state",
      header: "Región",
      cell: (r) => r.state,
    },
    {
      accessorKey: "city",
      header: "Ciudad",
      cell: (r) => r.city,
    },
    {
      accessorKey: "neighborhood",
      header: "Barrio",
      cell: (r) => r.neighborhood,
    },
    {
      accessorKey: "street",
      header: "Calle",
      cell: (r) => r.street,
    },
    {
      accessorKey: "number",
      header: "Número",
      cell: (r) => r.number,
    },
    {
      accessorKey: "postal",
      header: "Código postal",
      cell: (r) => (
        <span className="inline-block rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-700">
          {r.postal}
        </span>
      ),
    },
    {
      accessorKey: "complement",
      header: "Complemento",
      cell: (r) => r.complement || "-",
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: (r) => (
        <StatusBadge
          status={r.status}
          variant={r.status === "Activo" ? "success" : "error"}
        />
      ),
    },
  ];

/** ─── Vista principal ───────────────────────────────────────── */
export function CustomerAddressBrowseView() {
  const router = useRouter();
  const { customerId } = useParams();
  const [data, setData] = useState<AddressRow[]>([]);
  // Usamos 'page' y 'setPage' consistentemente para la paginación
  const [page, setPage] = useState(1);
  const PER_PAGE = 10; // Ajustado a 3 para ver la paginación con los mockAddresses

  // Estado para el total de productos, actualizado en useEffect
  const [totalProducts, setTotalProducts] = useState(0);

  // filtros simples
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStreet, setFilterStreet] = useState("");
  const [filterCountry, setFilterCountry] = useState("");

  useEffect(() => {
    // en producción trae de tu API: GET /customers/{customerId}/addresses
    setData(mockAddresses);
    // Corregido: setTotalProducts con la longitud del array
    setTotalProducts(mockAddresses.length);
  }, [customerId]);

  // ─── Filtrar y paginar ────────────────────────────────────────
  const filtered = data.filter(
    (r) =>
      (!filterCustomer ||
        r.customer.toLowerCase().includes(filterCustomer.toLowerCase())) &&
      (!filterStreet ||
        r.street.toLowerCase().includes(filterStreet.toLowerCase())) &&
      (!filterCountry || r.country === filterCountry)
  );

  // ─── Header Actions ────────────────────────────────────────────
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        icon: <PlusIcon className="h-5 w-5" />,
        onClick: () => router.push(`/customers/direcciones/nuevo`),
      },
      {
        label: "Exportar",
        variant: "primary",
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        onClick: () => {
          const headers = [
            "Customer",
            "Country",
            "State",
            "City",
            "Neighborhood",
            "Street",
            "Number",
            "Postal code",
            "Complement",
            "Status",
          ];
          const rows = filtered
            .slice(0, 1000)
            .map((r) => [
              r.customer,
              r.country,
              r.state,
              r.city,
              r.neighborhood,
              r.street,
              r.number,
              r.postal,
              r.complement,
              r.status,
            ]);
          exportToCsv("customer-addresses.csv", [headers, ...rows]);
        },
      },
      // { label: "Delete", variant: "text", icon: <TrashIcon ... /> },
    ],
    [router, data, filtered] // Agrega 'filtered' a las dependencias para que se actualice el export
  );

  // Calcula totalPages basado en el número de elementos filtrados y PER_PAGE
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Actualiza totalProducts cuando los datos filtrados cambian
  // y ajusta la página actual si excede el total de páginas
  useEffect(() => {
    setTotalProducts(filtered.length);
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    } else if (totalPages === 0 && page !== 1) { // Si no hay resultados, ir a la página 1
      setPage(1);
    }
  }, [filtered.length, totalPages, page]); // Dependencias para este efecto

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Customer address browse"
        filters={[
          {
            id: "customer",
            label: "Cliente",
            type: "text",
            value: filterCustomer,
          },
          {
            id: "street",
            label: "Calle",
            type: "text",
            value: filterStreet,
          },
          {
            id: "country",
            label: "País",
            type: "text", // si luego lo conviertes a dropdown pon type:"select"
            value: filterCountry,
          },
        ]}
        onFilterChange={(id, v) => {
          // Actualiza el filtro correspondiente y resetea la página a 1
          if (id === "customer") setFilterCustomer(v as string);
          else if (id === "street") setFilterStreet(v as string);
          else if (id === "country") setFilterCountry(v as string);
          setPage(1);
        }}
        action={headerActions}
      />

      <div className="p-6 flex-1">
        <DataTable
          data={shown}
          columns={getColumns(router)}
          rowPaddingY={20}
          rowBgClass="bg-white"
          showStatusBorder
          dataType="General2"
        />

        <div className="mt-6 flex flex-col items-center gap-4">
          {/* Asegúrate de que totalProducts sea mayor que 0 para mostrar la paginación */}
          {totalProducts > 0 && (
            <div className="flex justify-center gap-2">
              {/* Botón Anterior */}
              {page > 1 && ( // Usar 'page'
                <button
                  onClick={() => setPage(page - 1)} // Usar setPage
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  &lt;
                </button>
              )}

              {/* Generación de botones de página */}
              {Array.from(
                { length: Math.min(totalPages, 3) },
                (_, index) => {
                  // Ajusta el cálculo de pageNumber para centrar alrededor de la página actual
                  let startPage = Math.max(1, page - 1); // Usar 'page'
                  // Asegura que siempre haya 3 botones si es posible y no se salgan de los límites
                  if (totalPages - startPage < 2 && totalPages >= 3) {
                    startPage = Math.max(1, totalPages - 2);
                  }
                  const pageNumber = startPage + index;

                  // No renderizar si el número de página excede el total de páginas
                  if (pageNumber > totalPages) return null;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)} // Usar setPage
                      className={`px-3 py-1 rounded ${page === pageNumber // Usar 'page' para la comparación
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                }
              )}

              {/* Botón Siguiente */}
              {page < totalPages && ( // Usar 'page'
                <button
                  onClick={() => setPage(page + 1)} // Usar setPage
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  &gt;
                </button>
              )}
            </div>
          )}

          {/* Mostrar número total de resultados */}
          <div className="text-sm text-gray-500">
            {totalProducts} resultados
          </div>
        </div>
      </div>
    </div>
  );
}
