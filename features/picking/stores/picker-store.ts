"use client";
import { create } from "zustand";
import { PickerUserConfig } from "@/features/picking/pages/PickingView/configuraciones/Nuevo/NewPicker";

interface PickersState {
  pickers: PickerUserConfig[];
  addPicker: (picker: PickerUserConfig) => void;
  // Por si quieres borrar, actualizar, etc:
  // removePicker: (rut: string) => void;
  // updatePicker: (rut: string, updated: Partial<PickerUserConfig>) => void;
}

// Estado inicial que tenías “estático”, si deseas partir con esos datos
const initialPickers: PickerUserConfig[] = [
  {
    rut: "11111111-1",
    name: "Ismael",
    lastname: "Garcia",
    email: "ismael@fizzmod",
    company: "Fizzmod",
    location: "Sucursal Renca",
    picking: 0,
    createdBy: {
      name: "Ismael Garcia",
      email: "ismael@fizzmod",
    },
    dateCreated: "2021-07-13T10:27:00Z",
    user: undefined,
    dateModified: "2021-08-20T12:21:00Z",
    status: "Active",
  },
  {
    rut: "22222222-2",
    name: "Leonardo",
    lastname: "Gambino",
    email: "leonardo@fizzmod",
    company: "Fizzmod",
    location: "Sucursal Belgrano",
    picking: 5,
    createdBy: {
      name: "Leonardo Gambino",
      email: "leonardo@fizzmod",
    },
    dateCreated: "2021-07-15T09:27:00Z",
    user: undefined,
    dateModified: "2021-08-22T22:39:00Z",
    status: "Inactive",
  },
];

export const usePickersStore = create<PickersState>((set) => ({
  // Partimos con el array inicial
  pickers: initialPickers,

  // Método para agregar un picker (por ej. cuando creas uno)
  addPicker: (picker: PickerUserConfig) =>
    set((state) => ({
      pickers: [...state.pickers, picker],
    })),
}));
