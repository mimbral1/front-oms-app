// src/data/types/auditoria.ts
export interface Auditoria {
  id: string;
  entidad: string;
  refId?: string;
  idEntidad: string;
  inventario: string;
  controlador: {
    name: string;
    email: string;
    avatar: string;
  };
  estado: string;
}

export type AuditoriaStatus = "Finalizada" | "En curso" | "Corregir" | "Error";

export interface AuditoriaFilters {
  id?: string;
  entidad?: string;
  refId?: string;
  idEntidad?: string;
  inventario?: string;
  contolador?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  estado?: string;
}

export interface AuditoriasStore {
  auditorias: Auditoria[];
  filters: AuditoriaFilters;
  setAuditorias: (auditorias: Auditoria[]) => void;
  setFilters: (filters: Partial<AuditoriaFilters>) => void;
}
