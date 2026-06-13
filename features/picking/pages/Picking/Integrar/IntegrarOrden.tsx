"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import OrdersList from "./ordelist";
import { ArrowPathIcon, BuildingStorefrontIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useAssignRonda } from "@/features/picking/hooks/useAssignRound";
import { Action, ActionsModal } from "@/components/ui/modal/action";
import { useOrdersStore } from "@/features/olas/stores/ordersOlas";
import { useCreateInvoice } from "@/features/monitoreo/hooks/useCreateIntegration";
import { ApiOrder, ApiOrderProduct } from "@/features/olas/types/olas";
import ChangeStoreForm, {
  ChangeStoreFormData,
} from "@/features/monitoreo/components/integracion";
import { useFetchOrders } from "@/features/olas/hooks/useFetchOrdersOlas";
import { formatDateTime } from "@/lib/format/date";
import { ActionButton } from "@/components/ui/button/action-button";

// FunciÁÆ’³n para llamar a la API unificada

/* export interface AssignPickerData {
  pickingPoint: string;
  rut: string;
  email: string;
  name: string;
} */
export interface AssignOrderData {
  pickingPoint: string;
  rut: string;
  email: string;
  name: string;
}

export function IntegrarOrden() {
  const router = useRouter();
  const { assignRonda, loading, error } = useAssignRonda();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalActions, setModalActions] = useState<Action[]>([
    {
      label: "OK",
      onClick: () => { },
      variant: "primary",
    },
  ]);

  const {
    sendInvoice,
    loading: invoiceLoading,
    error: invoiceError,
    data: invoiceData,
  } = useCreateInvoice();

  const [dateTime, setDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const { date, time } = formatDateTime(dateTime);
  const formattedDateTime = `${date} ${time}`;

  const [selectedItems, setSelectedItems] = useState<{
    [itemId: number]: boolean;
  }>({});
  const { orders, setOrders } = useOrdersStore();

  // Botones de la parte superior
  const { refetch } = useFetchOrders();
  const handleCancel = () => {
    router.push("/");
  };

  // Para abrir/cerrar el modal de RUT
  const [isRutModalOpen, setIsRutModalOpen] = useState(false);
  // Para almacenar el RUT actual
  const [currentRut, setCurrentRut] = useState<string>("");
  const handleRutSubmit = (data: ChangeStoreFormData) => {
    // data.rut es el RUT validado y formateado
    setCurrentRut(data.rut);
    setIsRutModalOpen(false);
    // AquÁÆ’­ podrÁÆ’­as enviar el RUT al backend si lo necesitas:
    // await api.updateRut({ rut: data.rut });
  };

  /*   const handleAssign = async (assignData: AssignPickerData) => {
    try {
      const selectedIDs = Object.entries(selectedItems)
        .filter(([_, isChecked]) => isChecked)
        .map(([itemId]) => Number(itemId));

      console.log("ÁÆ’tems seleccionados para asignar:", selectedIDs);
      const waveId = Number(id) || 7;
      const result = await assignRonda(waveId, assignData, selectedIDs);
      console.log("AsignaciÁÆ’³n exitosa. Respuesta:", result);
      const updatedOrders = orders.map((order) => ({
        ...order,
        products: order.products.map((product) => {
          if (selectedIDs.includes(product.orderProductID)) {
            return { ...product, isAssigned: 1 }; // Marcar como asignado
          }
          return product;
        }),
      }));
      setOrders(updatedOrders);
      setSelectedItems({});
      setModalTitle("Á‚¡Ronda creada con ÁÆ’©xito!");
      setModalDescription(
        "La ronda se creÁÆ’³ y los ÁÆ’­tems fueron asignados correctamente."
      );
      setModalActions([
        {
          label: "OK",
          onClick: () => {
            // PodrÁÆ’­as redirigir o limpiar la selecciÁÆ’³n
            setSelectedItems({});
          },
          variant: "primary",
        },
      ]);
      setIsModalOpen(true);
      //router.push("/picking/olas");
    } catch (err) {
      console.error("Error al asignar ronda:", err);
      setModalTitle("Error al crear la ronda");
      setModalDescription(
        "OcurriÁÆ’³ un error al asignar la ronda. Intenta nuevamente."
      );
      setModalActions([
        {
          label: "Cerrar",
          onClick: () => {},
          variant: "error",
            icon: <XCircleIcon className="h-5 w-5" />
        },
      ]);
      setIsModalOpen(true);
    }
  }; */

  /*   const handleAssign = async (assignData: AssignPickerData) => {
    try {
      const selectedIDs = Object.entries(selectedItems)
        .filter(([_, isChecked]) => isChecked)
        .map(([itemId]) => Number(itemId));

      console.log("ÁÆ’tems seleccionados para asignar:", selectedIDs);
      const waveId = Number(id) || 7;
      const result = await assignRonda(waveId, assignData, selectedIDs);
      console.log("Integracion exitosa. Respuesta:", result);
      const updatedOrders = orders.map((order) => ({
        ...order,
        products: order.products.map((product) => {
          if (selectedIDs.includes(product.orderProductID)) {
            return { ...product, isAssigned: 1 }; // Marcar como asignado
          }
          return product;
        }),
      }));
      setOrders(updatedOrders);
      setSelectedItems({});
      setModalTitle("Á‚¡Orden integrada con ÁÆ’©xito!");
      setModalDescription(
        "La Orden se integro correctamente"
      );
      setModalActions([
        {
          label: "OK",
          onClick: () => {
            // PodrÁÆ’­as redirigir o limpiar la selecciÁÆ’³n
            setSelectedItems({});
          },
          variant: "primary",
        },
      ]);
      setIsModalOpen(true);
      //router.push("/integracion");
    } catch (err) {
      console.error("Error al ejecutar integracion:", err);
      setModalTitle("Error al ejecutar integracion");
      setModalDescription(
        "OcurriÁÆ’³ un error al realizar la integracion de la orden. Intenta nuevamente."
      );
      setModalActions([
        {
          label: "Cerrar",
          onClick: () => {},
          variant: "error",
            icon: <XCircleIcon className="h-5 w-5" />
        },
      ]);
      setIsModalOpen(true);
    }
  }; */
  const HandleIntegration = async () => {
    try {
      /* ---------- 1. IDs seleccionados ---------- */
      const selectedIDs = Object.entries(selectedItems)
        .filter(([_, checked]) => checked)
        .map(([id]) => Number(id));

      if (!selectedIDs.length) {
        setModalTitle("Sin selecciÁÆ’³n");
        setModalDescription("Selecciona al menos un ÁÆ’­tem.");
        setModalActions([
          {
            label: "OK",
            onClick: () => { },
            variant: "primary",
          },
        ]);
        setIsModalOpen(true);
        return;
      }

      /* ---------- 2. Agrupar por pedido ---------- */
      // Mapa: orderID Á¢" ' { order, selectedProducts[] }
      const ordersToIntegrate = new Map<
        number,
        { order: ApiOrder; selectedProducts: ApiOrderProduct[] }
      >();

      orders.forEach((order) => {
        const prods = order.products.filter((p) =>
          selectedIDs.includes(p.orderProductID)
        );
        if (prods.length)
          ordersToIntegrate.set(order.orderID, {
            order,
            selectedProducts: prods,
          });
      });

      if (ordersToIntegrate.size === 0) {
        alert(
          "No se encontraron pedidos vÁÆ’¡lidos para los ÁÆ’­tems seleccionados."
        );
        return;
      }

      /* ---------- 3. Recorrer pedidos y enviar factura ---------- */
      const today = new Date().toISOString().split("T")[0];
      //const invoicePromises: Promise<unknown>[] = [];

      /*  ordersToIntegrate.forEach(async ({ order, selectedProducts }) => {
        const payload = {
          CardCode: order.cardcode.toString(),
          DocDate: today,
          DocDueDate: today,
          ReserveInvoice: "tYES",
          SalesPersonCode: 401,
          U_REF1: order.u_ref1,
          Comments: `Factura creada para orden ${order.orderID}`,
          DocumentLines: selectedProducts.map((p: ApiOrderProduct) => ({
            BaseType: 17,
            BaseEntry: order.docentry,
            BaseLine: p.lineNum,
            ItemCode: p.itemcode.toString(),
            Quantity: p.quantity,
          })),
        } as const;
        console.log("Payload: ", payload);
        invoicePromises.push(sendInvoice(payload));
        //await sendInvoice(payload);
      });
      //console.log("Payload: ", ordersToIntegrate);
      const results = await Promise.allSettled(invoicePromises); */
      const invoicePromises = Array.from(ordersToIntegrate.values()).map(
        ({ order, selectedProducts }) => {
          const payload = {
            CardCode: order.cardcode.toString(),
            DocDate: today,
            DocDueDate: today,
            ReserveInvoice: "tYES",
            SalesPersonCode: 401,
            U_REF1: order.u_ref1,
            Comments: `Factura creada para orden ${order.orderID}`,
            DocumentLines: selectedProducts.map((p: ApiOrderProduct) => ({
              BaseType: 17,
              BaseEntry: order.docentry,
              BaseLine: p.lineNum,
              ItemCode: p.itemcode.toString(),
              Quantity: p.quantity,
            })),
          } as const;

          console.log("Payload generado:", payload);
          return sendInvoice(payload); // se devuelve correctamente la Promise
        }
      );

      const results = await Promise.allSettled(invoicePromises);
      const rejects = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );
      const rutErrors = rejects.filter((r) => {
        const data = (r.reason as any).response?.data;
        console.log("Data para control de errores: ", data);
        return (
          data?.errorCode === "INVALID_RUT" ||
          data?.message?.toLowerCase().includes("rut invÁÆ’¡lido")
        );
      });
      if (rutErrors.length) {
        setModalTitle("Error de RUT");
        setModalDescription(
          `Detectamos ${rutErrors.length} lÁÆ’­nea(s) con RUT invÁÆ’¡lido.`
        );
        setModalActions([
          {
            label: "Corregir RUT",
            onClick: () => {
              setIsRutModalOpen(true);
            },
            variant: "warning",
          },
          { label: "Cerrar", onClick: () => { }, variant: "primary", icon: <XCircleIcon className="h-5 w-5" /> },
        ]);
        setIsModalOpen(true);
        return;
      }

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;

      /* ---------- 4. Éxito ---------- */
      setModalTitle(
        fail ? "Proceso finalizado con errores" : "Á‚¡Factura(s) creadas!"
      );
      setModalDescription(
        fail
          ? `Facturas correctas: ${ok}\nErrores: ${fail}`
          : `Se crearon ${ok} factura(s) en Service Layer.`
      );
      setModalActions([
        {
          label: "OK",
          onClick: () => setSelectedItems({}),
          variant: "primary",
        },
      ]);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al integrar orden:", error);
      setModalTitle("Error en la integraciÁÆ’³n");
      setModalDescription("OcurriÁÆ’³ un error al integrar una o mÁÆ’¡s ÁÆ’³rdenes.");
      setModalActions([
        { label: "Cerrar", onClick: () => { }, variant: "error", icon: <XCircleIcon className="h-5 w-5" /> },
      ]);
      setIsModalOpen(true);
    }
  };
  //const invoiceLoadingg = true;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter" && !invoiceLoading) {
        e.preventDefault();
        HandleIntegration();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [HandleIntegration, invoiceLoading]);

  return (
    <div className="min-h-screen bg-[#E8EAF7]">
      {invoiceLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <ArrowPathIcon className="h-12 w-12 text-white animate-spin" />
        </div>
      )}
      {/* Encabezado */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-4xl font-bold text-gray-900">Integrar orden</h1>
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <p className="text-sm text-gray-500">{formattedDateTime} &rarr;</p>
            <div className="flex items-center gap-2">
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => refetch()}
              className="text-sm text-green-600 hover:underline"
            >
              Actualizar
            </button>
            <button
              onClick={() => setIsRutModalOpen(true)}
              className="text-sm text-indigo-600 hover:underline"
            >
              Editar RUT
            </button>
            <button
              onClick={handleCancel}
              className="text-sm text-gray-700 hover:underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Layout de columnas */}
      <div className="mx-10 flex gap-4 p-6">
        {/* Columna izquierda: pedidos */}
        <div className="w-4/5">
          <OrdersList
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        </div>

        {/* Columna derecha: Integrar Pedido */}
        <div className="w-1/5">
          <div className="flex justify-end gap-2">
            <ActionButton
              variant="primary"
              onClick={HandleIntegration}
              disabled={invoiceLoading}
              className="mt-1 w-full rounded-2xl py-3 text-lg"
            >
              <ArrowPathIcon className="h-6 w-6" />
              <span>Integrar</span>
            </ActionButton>
          </div>
        </div>

        <ActionsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalTitle}
          description={modalDescription}
          actions={modalActions}
        />
        <ChangeStoreForm
          isOpen={isRutModalOpen}
          onClose={() => setIsRutModalOpen(false)}
          onSubmit={handleRutSubmit}
        />
      </div>
    </div>
  );
}

// shsbgwbgwshwgsw
// esta pagina hace tal cosa nhanjnsxjsxjshxs

