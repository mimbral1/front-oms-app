"use client";

import React, { useEffect, useState } from "react";
import type { AssignPickerData } from "./addOlas";
import { useFetchPickerUsers } from "@/features/picking/hooks/useFetchPickerUsers";
import { PickerUser } from "@/features/picking/types/users";
import { ActionButton } from "@/components/ui/button/action-button";

interface AssignPickerProps {
  selectedItems: { [itemId: number]: boolean };
  onAssign: (data: AssignPickerData) => void;
}

export default function AssignPicker({
  selectedItems,
  onAssign,
}: AssignPickerProps) {
  const numSelected = Object.values(selectedItems).filter(Boolean).length;
  const { pickers, loading, error } = useFetchPickerUsers();
  const [selectedPicker, setSelectedPicker] = useState<PickerUser | null>(null);

  // Simulamos algunos pickers (nombre)
  const mockPickers = ["Juan", "María", "Marcelo"];
  // Estado local para el nombre del picker
  const [pickerName, setPickerName] = useState(mockPickers[0]);

  // Simulamos algunos puntos de picking
  const pickingPoints = [
    "Bodega Central",
    "Sucursal Belgrano",
    "Sucursal Palermo",
  ];
  const [pickingPoint, setPickingPoint] = useState(pickingPoints[0]);
  useEffect(() => {
    if (!loading && pickers.length > 0 && !selectedPicker) {
      setSelectedPicker(pickers[0]);
    }
  }, [loading, pickers, selectedPicker]);

  const handlePickerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rutSelected = Number(e.target.value);
    const newPicker = pickers.find((p) => p.rut === rutSelected) || null;
    setSelectedPicker(newPicker);
  };

  const handlePickingPointChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPickingPoint(e.target.value);
  };

  const handleClickAssign = () => {
    if (!selectedPicker) return;

    onAssign({
      pickingPoint,
      rut: selectedPicker.rut.toString(),
      email: selectedPicker.email,
      name: selectedPicker.name,
    });
  };
  if (loading) {
    return <div>Cargando pickeadores...</div>;
  }
  if (error) {
    return <div>Error al cargar pickeadores</div>;
  }

  return (
    <div className="mx-11 flex flex-col rounded bg-white p-4 shadow min-w-[300px] min-h-[400px]">
      <h2 className="mb-4 text-lg font-medium text-gray-900">
        SELECCIONAR PICKEADOR
      </h2>

      <p className="mb-3 text-sm text-gray-500">Pickeadores disponibles</p>
      <select
        className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        value={selectedPicker ? selectedPicker.rut : ""}
        onChange={handlePickerChange}
      >
        {pickers.map((picker) => (
          <option key={picker.rut} value={picker.rut}>
            {picker.name}
          </option>
        ))}
      </select>

      <p className="mb-2 text-sm text-gray-500">Seleccionar punto de picking</p>
      <select
        value={pickingPoint}
        onChange={handlePickingPointChange}
        className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
      >
        {pickingPoints.map((point) => (
          <option key={point} value={point}>
            {point}
          </option>
        ))}
      </select>

      {selectedPicker && (
        <>
          <p className="mb-2 text-sm text-gray-600">
            <span className="font-semibold">RUT:</span> {selectedPicker.rut}
          </p>
          <p className="mb-4 text-sm text-gray-600">
            <span className="font-semibold">Email:</span> {selectedPicker.email}
          </p>
        </>
      )}

      <p className="mb-4 text-sm text-gray-600">
        Ítems seleccionados: <strong>{numSelected}</strong>
      </p>

      <div className="flex-1" />

      <div className="flex justify-end gap-2">
        <ActionButton variant="secondary">
          Cancelar
        </ActionButton>
        <ActionButton
          variant="pick"
          onClick={handleClickAssign}
        >
          Asignar
        </ActionButton>
      </div>
    </div>
  );
}
