"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import OrdersList from "./ordelist";
import AssignPicker from "./assignPicker";
import { BuildingStorefrontIcon, TrashIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useAssignRonda } from "@/features/picking/hooks/useAssignRound";
import { Action, ActionsModal } from "@/components/ui/modal/action";
import { useOrdersStore } from "@/features/olas/stores/ordersOlas";

// Función para llamar a la API unificada

export interface AssignPickerData {
  pickingPoint: string;
  rut: string;
  email: string;
  name: string;
}

export default function NuevaRonda() {
  const { id } = useParams();
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

  const [dateTime, setDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formattedDateTime = dateTime.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const [selectedItems, setSelectedItems] = useState<{
    [itemId: number]: boolean;
  }>({});
  const { orders, setOrders } = useOrdersStore();

  // Botones de la parte superior
  const handleDelete = () => {
    alert("Eliminar ronda");
  };
  const handleCancel = () => {
    router.push("/picking/olas");
  };

  const handleAssign = async (assignData: AssignPickerData) => {
    try {
      const selectedIDs = Object.entries(selectedItems)
        .filter(([_, isChecked]) => isChecked)
        .map(([itemId]) => Number(itemId));

      console.log("Ítems seleccionados para asignar:", selectedIDs);
      const waveId = Number(id) || 7;
      const result = await assignRonda(waveId, assignData, selectedIDs);
      console.log("Asignación exitosa. Respuesta:", result);
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
      setModalTitle("¡Ronda creada con éxito!");
      setModalDescription(
        "La ronda se creó y los ítems fueron asignados correctamente."
      );
      setModalActions([
        {
          label: "OK",
          onClick: () => {
            // Podrías redirigir o limpiar la selección
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
        "Ocurrió un error al asignar la ronda. Intenta nuevamente."
      );
      setModalActions([
        {
          label: "Cerrar",
          onClick: () => { },
          variant: "error",
          icon: <XCircleIcon className="h-5 w-5" />
        },
      ]);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EAF7]">
      {/* Encabezado */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-4xl font-bold text-gray-900">Nueva Ronda</h1>
        <p className="text-sm text-gray-500">Agendamiento (Ola {id})</p>
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <p className="text-sm text-gray-500">{formattedDateTime} &rarr;</p>
            <div className="flex items-center gap-2">
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">Inventario</span>
              <select className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700">
                <option>Opción A</option>
                <option>Opción B</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="text-red-500 hover:text-red-600"
              onClick={handleDelete}
            >
              <TrashIcon className="h-5 w-5" />
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
        <div className="w-2/5">
          <OrdersList
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        </div>

        {/* Columna derecha: asignar pickeador */}
        <div className="w-3/5">
          {/* Pasamos handleAssign al componente para que retorne los datos del pickeador */}
          <AssignPicker selectedItems={selectedItems} onAssign={handleAssign} />
        </div>

        <ActionsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalTitle}
          description={modalDescription}
          actions={modalActions}
        />
      </div>
    </div>
  );
}

// shsbgwbgwshwgsw
// esta pagina hace tal cosa nhanjnsxjsxjshxs
