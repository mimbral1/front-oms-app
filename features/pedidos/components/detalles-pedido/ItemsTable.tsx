"use client";

import { OrderItem } from "@/features/pedidos/types/detalle-pedido";
import { clp } from "@/lib/format/money";

interface ItemsTableProps {
  items: OrderItem[];
}

export function ItemsTable({ items }: ItemsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">âÅ““</span>
          <span className="text-sm font-medium text-gray-900">
            ITEMS ORIGINALES
          </span>
        </div>
        <select className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
          <option>Todos</option>
        </select>
      </div>
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-left py-4 px-6">
              Items
            </th>
            <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right py-4 px-6">
              Precio unitario
            </th>
            <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right py-4 px-6">
              Cantidad
            </th>
            <th className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right py-4 px-6">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="py-4 px-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{item.sku}</span>
                    {item.criteria && (
                      <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {item.criteria}
                      </span>
                    )}
                  </div>
                  {item.storeCode && (
                    <span className="text-xs text-gray-500">
                      {item.storeCode}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-6 text-right whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {clp.format(item.price)} x&nbsp;un
                </span>
              </td>
              <td className="py-4 px-6 text-right whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {item.quantity} un
                </span>
              </td>
              <td className="py-4 px-6 text-right whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">
                  {clp.format(item.total)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

