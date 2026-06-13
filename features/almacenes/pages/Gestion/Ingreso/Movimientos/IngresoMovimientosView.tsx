// app/ordenes-compra/[id]/movimientos/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { ArrowDownOnSquareIcon, ArrowDownTrayIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

/* ------------------------------------------------- */
/*  Tipos y mocks                                    */
/* ------------------------------------------------- */
interface Move {
  id: string;
  titulo: string;
  origen: string;
  destino: string;
  contenido: string;
  cantidad: number;
  fecha: string;
  asignado: { initials: string; name: string; email: string };
  receptor: { initials: string; name: string; email: string };
  estado: "Pendiente" | "En curso" | "Finalizado";
}
interface OCMeta {
  folio: string;
  aprobacion: "Aprobado" | "Rechazado" | "Pendiente";
}

const OC_MOCK: OCMeta = {
  folio: "#240228-1LHFUF - 494949 - 45453454535353",
  aprobacion: "Aprobado",
};

const MOCK_MOVES: Move[] = [
  {
    id: "#240228-RXWHG9",
    titulo: "#240228-RXWHG9",
    origen: "Belgrano\nInbound\n1-3",
    destino: "Belgrano\nSlotting\n2-10",
    contenido:
      '16CBD5ECA75E4E7C - Perfiles de Aluminio Cuadrado 2". Espesor 3.05 mm Largo 5.85 mts. Material 6061-T6. Acabado Mill',
    cantidad: 50,
    fecha: "28/02/2024 18:04",
    asignado: { initials: "MB", name: "Martin Bello", email: "martin.bello@janis.com" },
    receptor: { initials: "MB", name: "Martin Bello", email: "martin.bello@janis.com" },
    estado: "Finalizado",
  },
  {
    id: "#250411-XAP4YC",
    titulo: "#250411-XAP4YC",
    origen: "Palermo\nIngreso (Inbound)\n1",
    destino: "Palermo\nSlotting\nPicking\n1-001-2",
    contenido: "21198916 - Auriculares Inalámbricos Aiwa AW-BT301 Negro",
    cantidad: 30,
    fecha: "11/05/2025 10:22",
    asignado: { initials: "LG", name: "Leandro Gomez", email: "lgomez@janis.com" },
    receptor: { initials: "LG", name: "Leandro Gomez", email: "lgomez@janis.com" },
    estado: "Pendiente",
  },
];

/* ------------------------------------------------- */
/*  Chips de usuario                                 */
/* ------------------------------------------------- */
function UserChip({ u }: { u: Move["asignado"] }) {
  return (
    <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
        {u.initials}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm font-medium">{u.name}</span>
        <span className="truncate text-xs text-gray-500">{u.email}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------- */
/*  Helpers de paginación (estilo SalesChannels)     */
/* ------------------------------------------------- */
const PER_PAGE = 60;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const pageWindow = (total: number, current: number) => {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(current - 1, total - 2));
  return [start, start + 1, start + 2];
};

/* ------------------------------------------------- */
/*  Columnas                                         */
/* ------------------------------------------------- */
function getColumns(): Column<Move>[] {
  return [
    { header: "Título", accessorKey: "titulo", cell: (m) => m.titulo },
    {
      header: "Origen",
      accessorKey: "origen",
      cell: (m) => <span className="whitespace-pre-wrap">{m.origen}</span>,
    },
    {
      header: "Destino",
      accessorKey: "destino",
      cell: (m) => <span className="whitespace-pre-wrap">{m.destino}</span>,
    },
    {
      header: "Contenido",
      accessorKey: "contenido",
      cell: (m) => (
        <div className="flex flex-col">
          {/* fila con icono + link azul (evita navegar al hacer click en el link) */}
          <div className="flex items-center gap-3">
            {/* emblema (rombo) */}
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-400">
              <span className="h-3 w-3 rotate-45 border-2 border-gray-500" />
            </span>

            <a
              href="#"
              onClick={(e) => e.stopPropagation()}
              className="max-w-[520px] truncate text-blue-600 hover:underline"
              title={m.contenido}
            >
              {m.contenido}
            </a>
          </div>

          {/* pill azul con cantidad, alineado a la izquierda debajo del link */}
          <span className="mt-2 inline-flex h-7 w-min min-w-[36px] items-center justify-center rounded-full bg-blue-500 px-3 text-sm font-semibold text-white">
            {m.cantidad}
          </span>
        </div>
      ),
    },
    { header: "Fecha", accessorKey: "fecha", cell: (m) => m.fecha },
    { header: "Asignado", accessorKey: "asignado", cell: (m) => <UserChip u={m.asignado} /> },
    { header: "Receptor", accessorKey: "receptor", cell: (m) => <UserChip u={m.receptor} /> },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (m) => (
        <span className="rounded-full bg-gray-400 px-4 py-1 text-sm font-medium text-white">
          {m.estado}
        </span>
      ),
    },
  ];
}

/* ------------------------------------------------- */
/*  Componente principal                              */
/* ------------------------------------------------- */
export default function MovementsView() {
  const { id } = useParams();
  const router = useRouter();

  const [items] = useState<Move[]>(MOCK_MOVES);

  // Toggle Abastecimiento / Replenishment
  const [mode, setMode] = useState<"abastecimiento" | "replenishment">("replenishment");

  // Paginación estilo nuevo

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(MOCK_MOVES.length / PER_PAGE));
  const safe = clamp(currentPage, 1, totalPages);
  const startIdx = (safe - 1) * PER_PAGE;
  const endIdx = Math.min(startIdx + PER_PAGE, MOCK_MOVES.length);
  const displayed = MOCK_MOVES.slice(startIdx, endIdx);

  // Acciones header (deshabilitadas como en la imagen)
  const headerActions = useMemo<Action[]>(
    () => [
      { label: "Aplicar", variant: "success", disabled: true, icon: <CheckCircleIcon className="h-5 w-5" /> },
      { label: "Guardar", variant: "success", disabled: true, icon: <ArrowDownTrayIcon className="h-5 w-5" /> },
      { label: "Guardar & Crear nuevo", variant: "success", disabled: true, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Volver al listado", variant: "secondary", onClick: () => history.back(), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    []
  );

  const approvalVariant =
    OC_MOCK.aprobacion === "Aprobado" ? "success" : OC_MOCK.aprobacion === "Rechazado" ? "error" : "pending";

  usePageHeader(
    () =>
    ({
      title: OC_MOCK.folio,
      status: { text: OC_MOCK.aprobacion, variant: approvalVariant },
      action: headerActions,
    } as PageHeaderProps),
    [headerActions]
  );

  return (
    <div className="flex-1"> {/* p-6 */}
      <div className="ml-6 mt-4 mb-3 inline-flex items-center gap-3">
        {/* Abastecimiento */}
        <button
          type="button"
          onClick={() => setMode("abastecimiento")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition
      ${mode === "abastecimiento"
              ? "border border-blue-500 text-blue-600 bg-white shadow-sm"
              : "border border-gray-300 text-gray-600 bg-white"}`}
        >
          {mode === "abastecimiento" ? (
            <CheckCircleIcon className="h-4 w-4 text-blue-500" />
          ) : (
            <span className="h-4 w-4 rounded-full border-2 border-gray-300" />
          )}
          Abastecimiento
        </button>

        {/* Replenish */}
        <button
          type="button"
          onClick={() => setMode("replenishment")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition
      ${mode === "replenishment"
              ? "border border-blue-500 text-blue-600 bg-white shadow-sm"
              : "border border-gray-300 text-gray-600 bg-white"}`}
        >
          {mode === "replenishment" ? (
            <CheckCircleIcon className="h-4 w-4 text-blue-500" />
          ) : (
            <span className="h-4 w-4 rounded-full border-2 border-gray-300" />
          )}
          Replenish
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl shadow-sm overflow-hidden">
        <DataTable<Move>
          data={displayed}
          columns={getColumns()}
          dataType="General2"
          rowPaddingY={12}
          rowBgClass="bg-white"
          // navegación por click en fila completa
          onRowClick={(row) =>
            router.push(
              `/almacen/gestion/ordenes-compra/${encodeURIComponent(String(id))}/movimientos/${encodeURIComponent(row.id)}`
            )
          }
        />
      </div>

      {/* Paginación */}

      <Pagination
        currentPage={currentPage}
        totalRecords={items.length}
        pageSize={PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
