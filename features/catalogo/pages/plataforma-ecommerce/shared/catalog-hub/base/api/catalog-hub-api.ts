// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/api/catalog-hub-api.ts
"use client";
import { useMemo } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import type { Flujo, Cupo } from "../types/flujo-types";

type RawFlujo = Record<string, unknown>;
const str = (v: unknown): string | null => (v == null || v === "" ? null : String(v));

function normalizeFlujo(raw: RawFlujo): Flujo {
  const r = raw ?? {};
  return {
    id: Number(r.id),
    nombre: String(r.nombre ?? ""),
    descripcion: str(r.descripcion),
    marketplace: String(r.marketplace ?? "ml"),
    n3_id: str(r.n3_id),
    estado: (String(r.estado ?? "en_progreso") as Flujo["estado"]),
    createdByName: str(r.created_by_name ?? r.createdByName),
    updatedByName: str(r.updated_by_name ?? r.updatedByName),
    createdAt: str(r.created_at ?? r.createdAt),
    updatedAt: str(r.updated_at ?? r.updatedAt),
    expiresAt: str(r.expires_at ?? r.expiresAt),
    vencido: Boolean(r.vencido),
  };
}

/** U3 — resultado de crear flujos a partir de una selección de SKUs. El backend
 *  agrupa por N3 y devuelve un flujo por categoría; `sinCategoria` lista los SKUs
 *  que no se pudieron resolver a una N3 (no entran en ningún flujo). */
export interface CrearFlujosDesdeSeleccionResult {
  flujos: Flujo[];
  sinCategoria: string[];
}

/** U3 — N3 resuelta por SKU (para previsualizar el agrupamiento antes de crear). */
export interface ResolveN3Entry {
  sku: string;
  n3_id: string | null;
  n3_nombre: string | null;
}
export interface ResolveN3Result {
  data: ResolveN3Entry[];
}

export interface UseCatalogHubApi {
  listFlujos: () => Promise<{ flujos: Flujo[]; cupo: Cupo }>;
  crear: (p: { nombre: string; descripcion?: string | null; n3_id?: string | null }) => Promise<Flujo>;
  /** U3 — crea flujos (uno por N3) a partir de una selección de SKUs. */
  crearFlujosDesdeSeleccion: (items: { sku: string }[], prefijo?: string | null) => Promise<CrearFlujosDesdeSeleccionResult>;
  /** U3 — resuelve la N3 de cada SKU (sin crear nada). */
  resolveN3: (skus: string[]) => Promise<ResolveN3Result>;
  editar: (id: number, p: { nombre?: string; descripcion?: string | null }) => Promise<Flujo>;
  pausar: (id: number) => Promise<Flujo>;
  reanudar: (id: number) => Promise<Flujo>;
  eliminar: (id: number) => Promise<void>;
}

const BASE = "/api/pim/catalog-hub/flujos";

export function useCatalogHubApi(): UseCatalogHubApi {
  const { fetchWithAuthPim } = useFetchWithAuthPim();
  const { user } = useAuth();
  const userName = user?.nombre ?? null;

  return useMemo<UseCatalogHubApi>(() => ({
    listFlujos: async () => {
      const env = await fetchWithAuthPim<{ flujos?: RawFlujo[]; cupo?: Cupo }>(`${BASE}?mk=ml`);
      return { flujos: (env.flujos ?? []).map(normalizeFlujo), cupo: env.cupo ?? { activos: 0, max: 0 } };
    },
    crear: async (p) => {
      const env = await fetchWithAuthPim<{ flujo: RawFlujo }>(BASE, {
        method: "POST", body: JSON.stringify({ nombre: p.nombre, descripcion: p.descripcion ?? null, n3_id: p.n3_id ?? null, userName }),
      });
      return normalizeFlujo(env.flujo);
    },
    // U3 — mismo auth/userName que `crear`. El backend agrupa los SKUs por N3 y
    // devuelve un flujo (raw snake_case) por categoría → los normalizamos igual
    // que en `crear`/`listFlujos`.
    crearFlujosDesdeSeleccion: async (items, prefijo) => {
      const env = await fetchWithAuthPim<{ flujos?: RawFlujo[]; sinCategoria?: string[] }>(
        `${BASE}/from-seleccion`,
        { method: "POST", body: JSON.stringify({ items, prefijo: prefijo ?? null, userName }) },
      );
      return {
        flujos: (env.flujos ?? []).map(normalizeFlujo),
        sinCategoria: env.sinCategoria ?? [],
      };
    },
    // U3 — resuelve la N3 de cada SKU (lectura; no crea nada). El backend ya
    // devuelve el shape tipado { data: { sku, n3_id, n3_nombre }[] }.
    resolveN3: async (skus) => {
      const env = await fetchWithAuthPim<{ data?: ResolveN3Entry[] }>(
        `${BASE}/resolve-n3`,
        { method: "POST", body: JSON.stringify({ skus }) },
      );
      return { data: env.data ?? [] };
    },
    editar: async (id, p) => {
      const env = await fetchWithAuthPim<{ flujo: RawFlujo }>(`${BASE}/${id}`, {
        method: "PATCH", body: JSON.stringify({ ...p, userName }),
      });
      return normalizeFlujo(env.flujo);
    },
    pausar: async (id) => {
      const env = await fetchWithAuthPim<{ flujo: RawFlujo }>(`${BASE}/${id}/pausar`, { method: "POST", body: JSON.stringify({ userName }) });
      return normalizeFlujo(env.flujo);
    },
    reanudar: async (id) => {
      const env = await fetchWithAuthPim<{ flujo: RawFlujo }>(`${BASE}/${id}/reanudar`, { method: "POST", body: JSON.stringify({ userName }) });
      return normalizeFlujo(env.flujo);
    },
    eliminar: async (id) => { await fetchWithAuthPim(`${BASE}/${id}`, { method: "DELETE" }); },
  }), [fetchWithAuthPim, userName]);
}
