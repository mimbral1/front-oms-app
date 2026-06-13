// src/data/types/pickers.ts
export interface Picker {
  img: string;
  rut: number;
  name: string;
  email: string;
  roleName: string;
  location: string;
  picking: number;
  emp: string;
  statusID: number;
  statusName: string;
  user_created: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PickerStatus = "Activo" | "Inactivo";

export interface PickerFilters {
  rut: string;
  name: string;
  email: string;
  statusName: string;
}

export interface PickersStore {
  pickers: Picker[];
  filters: PickerFilters;
  setPickers: (pickers: Picker[]) => void;
  setFilters: (filters: Partial<PickerFilters>) => void;
}
