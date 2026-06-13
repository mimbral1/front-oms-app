// views\Ubicaciones\Locations\Locations\UbicacionesView.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import {
  PlusIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";

/* -------- Types basados en la API -------- */
export interface ApiLocation {
  id: number;
  storeId: number;
  name: string;
  country: string;
  stateProvince: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  status: "active" | "inactive";
  user?: string | number;
}

/* -------- Utils UI -------- */
const statusPill = (s: ApiLocation["status"]) =>
  s === "active"
    ? "inline-flex rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white"
    : "inline-flex rounded-full bg-gray-400 px-3 py-1 text-xs font-semibold text-white";

const PER_PAGE = 60;

export default function LocationsView() {
  const router = useRouter();
  const { fetchWithAuth } = useFetchWithAuth();
  const [items, setItems] = useState<ApiLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* -------- Fetch -------- */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        const data = await fetchWithAuth<{ total: number; items: ApiLocation[] }>(
          "comerce-service/locations"
        );

        if (!mounted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        console.error("Error fetching locations", e);
        if (mounted) {
          setErrorMessage("No se pudieron cargar las ubicaciones.");
          setItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fetchWithAuth]);

  /* -------- Columnas (siempre con accessorKey) -------- */
  const columns: Column<ApiLocation>[] = useMemo(
    () => [
      {
        header: "Nombre",
        accessorKey: "name",
        cell: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
      },
      { header: "País", accessorKey: "country" },
      { header: "Región/Estado", accessorKey: "stateProvince" },
      { header: "Ciudad", accessorKey: "city" },
      {
        header: "Dirección",
        accessorKey: "addressLine1", // key válida; el contenido lo armo en cell
        cell: (r) => (
          <div className="text-sm">
            <div className="text-gray-900">{r.addressLine1}</div>
            {!!r.addressLine2 && (
              <div className="text-gray-500">{r.addressLine2}</div>
            )}
          </div>
        ),
      },
      { header: "Cód. Postal", accessorKey: "postalCode" },
      {
        header: "Estado",
        accessorKey: "status",
        cell: (r) => (
          <span className={statusPill(r.status)}>
            {r.status === "active" ? "Activo" : "Inactivo"}
          </span>
        ),
      },
    ],
    []
  );

  /* -------- Export CSV (client-side) -------- */
  const handleExport = () => {
    try {
      // Encabezados en el mismo orden del listado
      const headers = [
        "Nombre",
        "País",
        "Región/Estado",
        "Ciudad",
        "Dirección (L1)",
        "Dirección (L2)",
        "Cód. Postal",
        "Estado",
      ];

      const rows = items.map((r) => [
        r.name ?? "",
        r.country ?? "",
        r.stateProvince ?? "",
        r.city ?? "",
        r.addressLine1 ?? "",
        r.addressLine2 ?? "",
        r.postalCode ?? "",
        r.status === "active" ? "Activo" : "Inactivo",
      ]);

      const csv =
        "\uFEFF" + // BOM para Excel
        [headers, ...rows]
          .map((row) =>
            row
              .map((cell) =>
                `"${String(cell).replace(/"/g, '""')}"`
              )
              .join(",")
          )
          .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ubicaciones.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al exportar CSV", e);
    }
  };

  /* -------- Paginación client-side simple -------- */
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = items.slice(start, start + PER_PAGE);

  const headerActions = [
    {
      label: "Nuevo",
      variant: "success" as const,
      onClick: () => router.push("/ubicaciones/listado-ubicaciones/nuevo"),
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
      onClick: () => {
        // fuerza refetch sencillo
        window.location.reload();
      },
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title="Ubicaciones"
        action={headerActions}
      />

      <div className="p-6">
        <div className="overflow-hidden rounded-xl shadow-sm">
          {loading ? (
            <div className="bg-white">
              <table className="min-w-full text-sm">
                <tbody>
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                      Cargando ubicaciones…
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : errorMessage ? (
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium">
                    Error al cargar ubicaciones
                  </h3>
                  <p className="mt-2 text-sm">{errorMessage}</p>
                </div>

                <button
                  onClick={() => window.location.reload()}
                  className="ml-4 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border rounded-md p-6 text-center text-sm text-gray-500">
              No hay ubicaciones para mostrar.
            </div>
          ) : (
            <DataTable<ApiLocation>
              data={pageItems}
              columns={columns}
              dataType="Ubicaciones"
              statusKey="status"
              showStatusBorder
              rowPaddingY={12}
              rowBgClass="bg-white"
              onRowClick={(row) =>
                router.push(`/ubicaciones/listado-ubicaciones/${row.id}`)
              }
            />
          )}
        </div>

        {/* Paginación compacta */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {items.length > 0 && !loading && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 disabled:opacity-50"
                disabled={currentPage <= 1}
              >
                &lt;
              </button>
              {[...Array(Math.min(3, totalPages))]
                .map((_, i) => {
                  const start = Math.max(
                    1,
                    Math.min(currentPage - 1, totalPages - 2)
                  );
                  return start + i;
                })
                .map((n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`rounded px-3 py-1 ${n === currentPage
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                      }`}
                  >
                    {n}
                  </button>
                ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300 disabled:opacity-50"
                disabled={currentPage >= totalPages}
              >
                &gt;
              </button>
            </div>
          )}

          {!loading && (<div className="text-sm text-gray-500">
            {(() => {
              if (items.length === 0) return "0 resultados";
              const from = (currentPage - 1) * PER_PAGE + 1;
              const to = Math.min(currentPage * PER_PAGE, items.length);
              return `${from}-${to} de ${items.length} resultados`;
            })()}
          </div>)}
        </div>
      </div>
    </div>
  );
}
