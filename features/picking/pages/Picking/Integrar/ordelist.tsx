"use client";

import { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useFetchOrders } from "@/features/olas/hooks/useFetchOrdersOlas";
import { ApiOrder, ApiOrderProduct } from "@/features/olas/types/olas";
import { useOrdersStore } from "@/features/olas/stores/ordersOlas";
import clsx from "clsx";

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
  const { isLoading, error } = useFetchOrders();
  const { orders } = useOrdersStore();

  /* pedido actualmente activo (derivado) */
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  /* ========== DERIVAR activeOrderId A PARTIR DE selectedItems ========== */
  useEffect(() => {
    const firstProdId = Number(Object.keys(selectedItems)[0]);
    if (!firstProdId) return setActiveOrderId(null);

    const foundOrder = orders.find((o) =>
      o.products.some((p) => p.orderProductID === firstProdId)
    );
    setActiveOrderId(foundOrder ? foundOrder.orderID : null);
  }, [selectedItems, orders]);

  /* ---------- helpers ---------- */
  const clearSelection = () => setSelectedItems({});

  const handleToggleExpand = (orderID: number) =>
    setExpanded((prev) => ({ ...prev, [orderID]: !prev[orderID] }));

  /* --- checkbox del pedido (selecciona / deselecciona todo) --- */
  const handleOrderCheckbox = (order: ApiOrder) => {
    //const selectable = order.products.filter((p) => p.isAssigned === 0);
    const selectable = order.products;
    const allSelected = selectable.every(
      (p) => selectedItems[p.orderProductID]
    );

    /* console.log("==== CLICK PEDIDO #", order.orderID);
    console.log(
      "Selectable:",
      selectable.map((p) => p.orderProductID)
    );
    console.log("selectedItems antes:", selectedItems);
    console.log("allSelected:", allSelected); */

    const next = allSelected
      ? {}
      : Object.fromEntries(selectable.map((p) => [p.orderProductID, true]));

    /* console.log("selectedItems después:", next); */
    setSelectedItems(next);
  };

  /* --- checkbox individual --- */
  const handleItemCheckbox = (orderID: number, prod: ApiOrderProduct) => {
    //if (prod.isAssigned) return;

    setSelectedItems((prev) => {
      /* si pertenece a otro pedido, empezamos desde cero */
      const belongsToOther =
        activeOrderId !== null && activeOrderId !== orderID;
      const base = belongsToOther ? {} : { ...prev };

      /* console.log(
        "---- CLICK ITEM",
        prod.orderProductID,
        "del pedido",
        orderID
      );
      console.log("belongsToOther:", belongsToOther);
      console.log("prev:", prev); */

      base[prod.orderProductID] = !base[prod.orderProductID];

      /* si quedó vacío, devuelvo {}  */
      return Object.values(base).some(Boolean) ? base : {};
    });
  };

  /* ---------- loading / error ---------- */
  if (isLoading)
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-950">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
        Cargando pedidos...
      </div>
    );
  if (error)
    return (
      <p className="mt-4 text-sm font-medium text-red-600">
        Ocurrió un error: {error}
      </p>
    );

  /* ---------- render ---------- */
  return (
    <div
      className={`
      space-y-4 overflow-y-auto max-h-[70vh] pr-2
      /* WebKit */
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar]:h-2
      [&::-webkit-scrollbar-track]:bg-gray-100
      [&::-webkit-scrollbar-track]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-blue-500
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb]:shadow-md
      [&::-webkit-scrollbar-thumb:hover]:bg-gray-400
      /* Firefox */
      scrollbar-thin
      scrollbar-thumb-gray-300
      scrollbar-track-gray-100
      dark:scrollbar-thumb-neutral-500
      dark:scrollbar-track-neutral-700
    `}
    >
      {orders.map((order) => {
        const isOpen = expanded[order.orderID];

        // const unassignedProds = order.products.filter( (p) => p.isAssigned === 0 );
        const selectableProds = order.products;
        /* const allUnassignedSelected =
          unassignedProds.length > 0 &&
          unassignedProds.every((p) => selectedItems[p.orderProductID]);
 */
        const allSelected =
          selectableProds.length > 0 &&
          selectableProds.every((p) => selectedItems[p.orderProductID]);
        return (
          <div
            key={order.orderID}
            className="rounded-lg border bg-white shadow transition-shadow
          hover:shadow-lg py-1"
          >
            {/* Header del pedido */}
            <div
              style={{ top: 0, zIndex: 10 }}
              className="
            sticky bg-white flex items-center justify-between
            px-6 py-4 cursor-pointer hover:bg-gray-50
            transition-colors duration-150
          "
              onClick={() => handleToggleExpand(order.orderID)}
            >
              <div
                className="flex items-center gap-3 px-6"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  /* checked={!!unassignedProds.length && allUnassignedSelected} */
                  checked={!!selectableProds.length && allSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleOrderCheckbox(order);
                  }}
                />
                <div className="flex flex-col space-y-1">
                  <p className="text-base  text-gray-900">
                    Pedido #{order.orderID} | Cliente: {order.cardcode}
                  </p>
                  {/* <div className="flex items-center space-x-2">
                    {/* Si en un futuro quieres mostrar estado, así queda preparado: */}
                  {/* <span className="inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
      Pendiente
    </span> 
                    <p className="text-xs text-gray-500">Envío: N/A</p>
                  </div> */}
                </div>
              </div>
              {isOpen ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon
                  className={`h-5 w-5 transform transition-transform duration-200 ${
                    isOpen ? "rotate-90" : ""
                  }`}
                />
              )}
            </div>

            {/* Lista de ítems */}
            {isOpen && (
              <div className="divide-y  px-6 pb-3">
                {order.products.map((prod, idx) => {
                  const checked = !!selectedItems[prod.orderProductID];
                  //const disabled = prod.isAssigned === 1;
                  const disabled = false;

                  return (
                    <div
                      key={prod.orderProductID}
                      className={clsx(
                        "flex items-center justify-between py-2 cursor-pointer hover:bg-gray-100 transition-colors duration-150 border-l-4",
                        checked
                          ? "bg-blue-100 border-blue-500" // <- aquí forzamos el color
                          : "border-transparent"
                      )}
                      onClick={() => handleItemCheckbox(order.orderID, prod)}
                    >
                      <div className="flex items-center gap-3 px-6">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          disabled={disabled}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() =>
                            handleItemCheckbox(order.orderID, prod)
                          }
                        />
                        <span className="text-sm text-gray-800">
                          {prod.dscription}
                        </span>
                        <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {prod.quantity}
                        </span>
                      </div>
                      {disabled && (
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
