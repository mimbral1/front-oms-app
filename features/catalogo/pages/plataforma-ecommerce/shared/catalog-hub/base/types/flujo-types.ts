// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/types/flujo-types.ts
export type FlujoEstado = "en_progreso" | "pausado" | "completado";

export interface Flujo {
  id: number;
  nombre: string;
  descripcion: string | null;
  marketplace: string;
  n3_id: string | null;
  estado: FlujoEstado;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
  vencido: boolean;
}
export interface Cupo { activos: number; max: number; }
