"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { CheckCircleIcon, Cog6ToothIcon, MagnifyingGlassIcon, MinusCircleIcon, PlusCircleIcon, WrenchScrewdriverIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useParams } from "next/navigation";
// Hook que  gestiona el fetch de los items 
import { useAuditoriaItemsStore } from "@/features/auditorias/stores/detalle-auditorias";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { BarcodeIcon, ShoppingCartIcon, TagIcon } from "lucide-react";
import { FaPlus } from "react-icons/fa";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

// 1) Interfaz de datos (Control de contenido)
interface ItemControl {
  id: string; // ID interno si lo necesitás para manejar claves únicas
  tipo: "item" | "package";
  referencia: string;
  codigoBarras: string;
  items: number;
  resultados: {
    encontrado: number;
    faltante: number;
    sobrante: number;
  };
  fixed: boolean;
  estado: string;
}

// 2) Mock de ejemplo basado en la imagen
const mockControlPedidos: (ItemControl & { id: string })[] = [
  {
    id: "1",
    tipo: "item",
    referencia: "Yogurt Griego Natural Yoplait",
    codigoBarras: "3591230712957",
    items: 2,
    resultados: { encontrado: 2, faltante: 0, sobrante: 0 },
    fixed: false,
    estado: "found",
  },
  {
    id: "2",
    tipo: "item",
    referencia: "Yogurt Líquido Fresa Yes",
    codigoBarras: "5406545173226",
    items: 2,
    resultados: { encontrado: 1, faltante: 1, sobrante: 0 },
    fixed: false,
    estado: "missing",
  },
  {
    id: "3",
    tipo: "package",
    referencia: "ETMY4E",
    codigoBarras: "67RMN1YPCF9HX",
    items: 1,
    resultados: { encontrado: 1, faltante: 0, sobrante: 0 },
    fixed: false,
    estado: "found",
  },
];

/* const controlresultadostyles: Record<string, string> = {
  found: "bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold",
  missing: "bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold",
  error:
    "bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold",
};
 */
export default function ControlView() {
  const router = useRouter();
  const { id } = useParams();

  const itemsControlPedidos = mockControlPedidos.find((o) => o.id === id) ?? mockControlPedidos[0];
  const [ItemsControlPedidosData, setItemsControlPedidosData] = useState<typeof itemsControlPedidos>(itemsControlPedidos);

  useEffect(() => {
    const found = mockControlPedidos.find((o) => o.id === id) ?? mockControlPedidos[0];
    setItemsControlPedidosData(found);
  }, [id]);

  // HAY QUE REVISAR LO DE AUDITORIA PORQUE NO VIENE AL CASO CON ESTE ARCHIVO
  // const bultoId = params?.id as string;

  // const auditoria = auditoriaMock.find((audit) => audit.id === bultoId);
  // console.log("bultoId: ", bultoId);
  // const { isLoading, error } = useFetchItemsAuditoria(bultoId); // Traemos los items transformados desde la API
  const { items } = useAuditoriaItemsStore();

  // Paginación
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const total = Math.ceil(mockControlPedidos.length / PER_PAGE);
  const currentData = mockControlPedidos.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // 1. Define una función que devuelve el ícono basado en el tipo
  const renderIcon = (tipo: any) => {
    switch (tipo) {
      case 'item':
        return <ShoppingCartIcon className="w-5 h-5 text-blue-500" />;
      case 'servicio':
        return <WrenchScrewdriverIcon className="w-5 h-5 text-green-500" />;
      case 'promocion':
        return <TagIcon className="w-5 h-5 text-purple-500" />;
      default: // Caso por defecto
        return <CheckCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  }

  // olor de estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "found":
        return "#22c55e"; // Corresponde a bg-green-500
      case "missing":
        return "#ef4444"; // Corresponde a bg-red-500
      default:
        return "#d1d5db"; // Corresponde a bg-gray-300
    }
  };

  const columns: Column<ItemControl>[] = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: (row) => (
        <div className="inline-flex items-center gap-1 border border-blue-400 text-blue-600 rounded-full px-3 py-1 text-sm">
          {renderIcon(row.tipo)}
          <span className="text-sm font-medium text-gray-800">{row.tipo}</span>
        </div>
      ),
    },
    {
      accessorKey: "referencia",
      header: "Referencia",
      cell: (row) => (
        <span className="text-sm text-gray-900 whitespace-pre-wrap">
          {row.referencia}
        </span>
      ),
    },
    {
      accessorKey: "codigoBarras",
      header: "Código de barras",
      cell: (row) => (
        <div className="inline-flex items-center gap-1">
          <BarcodeIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-800">{row.codigoBarras}</span>
        </div>
      ),
    },
    {
      accessorKey: "items",
      header: "Esperado",
      cell: (row) => (
        <div className="inline-flex items-center gap-1">
          <MagnifyingGlassIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-800">{row.items}</span>
        </div>
      ),
    },
    {
      accessorKey: "resultados",
      header: "Resultados",
      cell: (row) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600 font-bold">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <span>{row.resultados.encontrado}</span>
          </div>
          <div className="flex items-center gap-2 text-red-600 font-bold">
            <MinusCircleIcon className="w-5 h-5 text-red-500" />
            <span>{row.resultados.faltante}</span>
          </div>
          <div className="flex items-center gap-2 text-orange-600 font-bold">
            <PlusCircleIcon className="w-5 h-5 text-orange-500" />
            <span>{row.resultados.sobrante}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "fixed",
      header: "Fixed",
      cell: (row) => (
        <div className="inline-flex items-center gap-1">
          <Cog6ToothIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-800">{row.fixed ? "Yes" : "No"}</span>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (row) => {
        const color = getStatusColor(row.estado);
        return (
          <div
            style={{ backgroundColor: color }}
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium text-white`}
          >
            {row.estado === "found" ? "Encontrado" : row.estado === "missing" ? "Desaparecido" : row.estado}
          </div>
        );
      },
    },
  ];

  // header actions

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "primary",
        onClick: () => console.log("apply"),
        icon: <CheckCircleIcon className="h-5 w-5" />,
        disabled: true,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => console.log("save"),
        icon: <SaveOutlined className="h-4 w-4" />,
        disabled: true,
      },
      {
        label: "Guardar y crear",
        variant: "primary",
        onClick: () => console.log("save & new"),
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveOutlined className="h-4 w-4 text-current" />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
              <FaPlus className="h-2.5 w-2.5 text-blue-500" />
            </div>
          </div>
        ),
        disabled: true,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/pedidos/control"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );

  // page header

  const estadoTraducido =
    ItemsControlPedidosData?.estado === "found"
      ? "Encontrado"
      : ItemsControlPedidosData?.estado === "missing"
        ? "Desaparecido"
        : "Desconocido"; // fallback

  usePageHeader(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Control
          </div>
          <div className="text-2xl font-semibold text-gray-900">{ItemsControlPedidosData.id ?? "—"}</div>
        </div>
      ),
      action: headerActions,
      status: {
        text: estadoTraducido,
        variant: ItemsControlPedidosData?.estado === "found" ? "success" : "error",
      },
    }),
    [ItemsControlPedidosData?.id, ItemsControlPedidosData?.estado, headerActions]
  );
  // HAY QUE VER ESTO DE AUDITORIA PORQUE NO SE A QUE VIENE EN ESTE ARCHIVO
  // if (bultoId !== auditoria?.id) {
  //   return (
  //     <p className="p-4 text-center text-red-500">Almacén no encontrado</p>
  //   );
  // }

  // if (!auditoria) {
  //   return (
  //     <div className="text-center text-gray-500 mt-10">
  //       <p>No se encontró la auditoría con ID: {bultoId}</p>
  //     </div>
  //   );
  // }
  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  // if (error) {
  //   return <div>Error: {error}</div>;
  // }

  // Adaptar los items de la API al formato requerido por ItemControl
  const itemsMapped: ItemControl[] = items.map((item: any) => ({
    id: item.id,
    tipo: item.tipo ?? "item",
    referencia: item.referencia ?? "",
    codigoBarras: item.codigoBarras ?? "",
    items: item.items ?? 0,
    resultados: {
      encontrado: item.resultados?.encontrado ?? 0,
      faltante: item.resultados?.faltante ?? 0,
      sobrante: item.resultados?.sobrante ?? 0,
    },
    fixed: item.fixed ?? false,
    estado: item.estado ?? "found",
  }));

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl shadow-sm">
        <DataTable<ItemControl>
          data={currentData}
          columns={columns}
          showStatusBorder={true}
          rowPaddingY={8}
          rowBgClass="bg-white"
          dataType="pedido"
          statusKey="estado"
        />
      </div>
      <div className="mt-6 flex flex-col items-center gap-4">
        {mockControlPedidos.length > 0 && (
          <div className="flex justify-center gap-2">
            {/* Botón Anterior */}
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                &lt;
              </button>
            )}

            {Array.from({ length: Math.min(total, 3) }, (_, index) => {
              const pageNumber = Math.max(1, page - 1) + index;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`px-3 py-1 rounded ${page === pageNumber
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                    }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Botón Siguiente */}
            {page < total && (
              <button
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                &gt;
              </button>
            )}
          </div>
        )}

        {/* Mostrar número total de resultados */}
        <div className="text-sm text-gray-500">
          {mockControlPedidos.length} resultados
        </div>
      </div>
    </div>
  );
}
