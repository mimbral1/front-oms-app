"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { DataTable, type Column } from "@/components/ui/table";
import { NuevoPedidoItem } from "@/features/pedidos/types/nuevo-pedido";

interface ItemsTableProps {
  items: NuevoPedidoItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<NuevoPedidoItem>) => void;
}

export function ItemsTable({
  items,
  onRemoveItem,
  onUpdateItem,
}: ItemsTableProps) {
  const columns: Column<NuevoPedidoItem>[] = [
    {
      accessorKey: "producto",
      header: "Producto",
    },
    {
      accessorKey: "cantidad",
      header: "Cantidad",
      cell: (item) => (
        <input
          type="number"
          min="1"
          value={item.cantidad}
          onChange={(e) =>
            onUpdateItem(item.id, {
              cantidad: parseInt(e.target.value),
              subtotal: parseInt(e.target.value) * item.precio,
            })
          }
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right"
        />
      ),
    },
    {
      accessorKey: "precio",
      header: "Precio",
      cell: (item) => (
        <div className="text-right">${item.precio.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "subtotal",
      header: "Subtotal",
      cell: (item) => (
        <div className="text-right">${item.subtotal.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "id",
      header: "Acciones",
      disableRowClick: true,
      cell: (item) => (
        <button
          onClick={() => onRemoveItem(item.id)}
          className="text-red-600 hover:text-red-900"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      ),
    },
  ];

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <DataTable columns={columns} data={items} />
      </div>
      <div className="flex justify-end">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-lg font-semibold text-gray-900">
            Total: ${total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
