"use client";

import { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useFetchOrders } from "@/features/olas/hooks/useFetchOrdersOlas";
import { ApiOrder, ApiOrderProduct } from "@/features/olas/types/olas";
import { useOrdersStore } from "@/features/olas/stores/ordersOlas";

interface OrdersListProps {
  selectedItems: { [itemId: number]: boolean };
  setSelectedItems: React.Dispatch<
    React.SetStateAction<{ [itemId: number]: boolean }>
  >;
}

export default function OrdersList({
  selectedItems,
  setSelectedItems,
}: OrdersListProps) {
  const { isLoading, error, refetch } = useFetchOrders();
  const { orders } = useOrdersStore();
  //console.log("ORDERS: ", orders);

  // Controlar qué pedidos están expandidos
  const [expanded, setExpanded] = useState<{ [orderId: number]: boolean }>({});

  // Monitorear cambios en selectedItems para depuración
  useEffect(() => {
    console.log("selectedItems changed:", selectedItems);
  }, [selectedItems]);

  // Expandir/colapsar un pedido
  const handleToggleExpand = (orderID: number) => {
    console.log("Toggle expand for order:", orderID);
    setExpanded((prev) => ({
      ...prev,
      [orderID]: !prev[orderID],
    }));
  };

  // Marcar/desmarcar todos los ítems de un pedido
  const handleOrderCheckbox = (
    orderID: number,
    products: ApiOrderProduct[]
  ) => {
    console.log("handleOrderCheckbox called for order:", orderID);
    // Filtramos los productos no asignados
    const unassignedProds = products.filter((p) => p.isAssigned === 0);
    console.log("unassignedProds:", unassignedProds);
    console.log(
      "p.isAssigned",
      products.filter((p) => p.isAssigned)
    );

    // Verificamos si todos los no-asignados ya están seleccionados
    const allSelected = unassignedProds.every(
      (p) => selectedItems[p.orderProductID]
    );
    console.log("allSelected:", allSelected);

    const newSelected = { ...selectedItems };

    unassignedProds.forEach((prod) => {
      newSelected[prod.orderProductID] = !allSelected;
      console.log(
        `Setting product ${prod.orderProductID} selection to: `,
        !allSelected
      );
    });

    setSelectedItems(newSelected);
  };

  // Marcar/desmarcar un ítem individual
  const handleItemCheckbox = (prod: ApiOrderProduct) => {
    console.log(
      "handleItemCheckbox called for product:",
      prod.orderProductID,
      "isAssigned:",
      prod.isAssigned
    );
    if (prod.isAssigned === 1) return; // Evitamos re-asignar
    setSelectedItems((prev) => {
      const newState = {
        ...prev,
        [prod.orderProductID]: !prev[prod.orderProductID],
      };
      console.log(
        "New state for product",
        prod.orderProductID,
        ":",
        newState[prod.orderProductID]
      );
      return newState;
    });
  };

  // Manejo de carga y error
  if (isLoading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        Cargando pedidos...
      </div>
    );
  }
  if (error) {
    return (
      <p className="mt-4 text-sm font-medium text-red-600">
        Ocurrió un error: {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order: ApiOrder) => {
        const isOpen = expanded[order.orderID];
        // Productos no asignados
        const unassignedProds = order.products.filter(
          (p) => p.isAssigned === 0
        );
        // Verificamos si todos los no-asignados están seleccionados
        const allUnassignedSelected =
          unassignedProds.length > 0 &&
          unassignedProds.every((p) => selectedItems[p.orderProductID]);

        return (
          <div
            key={order.orderID}
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            {/* Encabezado del pedido: clickeable en toda la fila para expandir/collapse */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100"
              onClick={() => handleToggleExpand(order.orderID)}
            >
              <div
                className="flex items-center gap-2"
                // Evitamos que el click en el checkbox active el expandido
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={!!unassignedProds.length && allUnassignedSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleOrderCheckbox(order.orderID, order.products);
                  }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Pedido #{order.orderID}
                  </p>
                  <p className="text-xs text-gray-500">Envío: N/A</p>
                </div>
              </div>
              {/* Icono de expansión */}
              <div>
                {isOpen ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5" />
                )}
              </div>
            </div>

            {/* Lista de ítems: cada fila es clickeable en toda su extensión */}
            {isOpen && (
              <div className="divide-y divide-gray-100 px-6 pb-3">
                {order.products.map((prod: ApiOrderProduct) => {
                  const isChecked = !!selectedItems[prod.orderProductID];
                  const isDisabled = prod.isAssigned === 1; // Si ya está asignado

                  return (
                    <div
                      key={prod.orderProductID}
                      className={`flex items-center justify-between py-2 cursor-pointer hover:bg-gray-100 ${
                        isChecked ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleItemCheckbox(prod)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleItemCheckbox(prod);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-gray-800">
                          {prod.dscription}
                        </span>
                        {/* Badge para cantidad */}
                        <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {prod.quantity}
                        </span>
                      </div>
                      {isDisabled && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Asignado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
