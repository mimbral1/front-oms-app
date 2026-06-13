// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/api/catalog-hub-grid-api.ts
//
// Cliente de la grilla editable (Pieza E). Espeja el patrón de
// catalog-hub-api.ts: usa `useFetchWithAuthPim` (que prepende URL_PIM_SERVICE
// y devuelve el body RAW, sin envoltorio {ok,data}), envuelve en useMemo y
// arma las URLs con query strings.
"use client";

import { useMemo } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import type {
  N3ProductsResponse,
  N3SchemaResponse,
  N3ValuesResponse,
  N3ValueEntry,
} from "../types/grid-types";

const BASE = "/api/pim/catalog-hub";

/** Tamaño de lote para POST /values — el backend acota el body por request. */
const VALUES_CHUNK = 100;

export interface GetN3ProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** Contrato del save de la Pieza F. Definido aquí pero NO invocado en v1. */
export interface SaveItemInput {
  sku: string;
  values: Record<string, unknown>;
}
export interface SaveItemsResponse {
  saved: number;
  warnings?: string[];
  errors?: Array<{ sku: string; message: string }>;
}

/**
 * Predicción de categoría ML para un SKU (Pieza G). Snapshot batch leído de
 * `predicciones_ml` (cero cuota ML). Se usa para sembrar la categoría por fila
 * en modo Publicar. El backend devuelve más campos (top3, modelName, scoredAt,
 * mapeo*, etc.); acá tipamos solo lo que consume la grilla.
 */
export interface PrediccionSku {
  sku: string;
  mlCategoriaIdPredicha: string | null;
  mlCategoriaNombrePredicha: string | null;
  confianzaTop1?: number | null;
  esAutoaplicable?: boolean;
}

/**
 * Envelope real de `GET /api/pim/canales/mercadolibre/predicciones`
 * (verificado contra predictions.controller.js `list` + predictions.repository
 * `list`): `{ ok, marketplace, data, pagination }`. La paginación va anidada en
 * `pagination` (NO plano `{ data, page, pageSize, total }`).
 */
export interface PrediccionesResponse {
  ok?: boolean;
  marketplace?: string;
  data: PrediccionSku[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface GetPrediccionesParams {
  page?: number;
  pageSize?: number;
}

/**
 * Categoría resuelta por la CASCADA VALIDADA del N3 (la misma del wizard), por
 * SKU. A diferencia de las predicciones crudas (`predicciones_ml`), esto aplica
 * el orden de prioridad P0_excepcion → P3_tipo_producto → P3.5_prediccion_ml →
 * P4_canonico, así que es la fuente correcta para sembrar la categoría en la
 * grilla. Cero cuota ML (lectura del backend pim). El endpoint devuelve TODO el
 * N3 (sin paginación). `fuente` indica de qué regla salió la categoría.
 */
export interface CascadeCategoria {
  sku: string;
  categoria_id: string | null;
  categoria_nombre: string | null;
  fuente: string;
}

/** Estado de un job de sincronización a ML (Pieza F). */
export type SyncStatus = "pending" | "running" | "done" | "error";
export interface StartSyncResponse { jobId: number; status: SyncStatus; total: number; }
export interface SyncJobItemResult {
  sku: string;
  action: "create" | "update" | null;
  status: "pending" | "running" | "ok" | "error";
  itemId: string | null;
  message: string | null;
}
export interface SyncJobStatus {
  jobId: number;
  status: SyncStatus;
  total: number;
  done: number;
  ok: number;
  errors: number;
  items: SyncJobItemResult[];
  finishedAt: string | null;
  errorMessage?: string | null;
}

export interface UseCatalogHubGridApi {
  getN3Products: (n3Id: string, params?: GetN3ProductsParams) => Promise<N3ProductsResponse>;
  /** U3 — productos de un flujo por membresía (mismo shape que getN3Products).
   *  Para flujos origen='seleccion' devuelve solo los miembros; legacy devuelve
   *  toda la N3 (el front no distingue). */
  getFlujoProducts: (flujoId: number | string, params?: GetN3ProductsParams) => Promise<N3ProductsResponse>;
  getN3Schema: (n3Id: string) => Promise<N3SchemaResponse>;
  getN3Values: (n3Id: string, skus: string[]) => Promise<N3ValuesResponse>;
  /** Pieza G — predicciones batch de categoría ML por SKU del N3 (cero cuota). */
  getPredicciones: (n3Id: string, params?: GetPrediccionesParams) => Promise<PrediccionesResponse>;
  /** Categoría por SKU resuelta con la cascada VALIDADA del N3 (cero cuota). */
  getN3CascadeCategorias: (n3Id: string) => Promise<{ data: CascadeCategoria[]; total: number }>;
  saveItems: (flujoId: number | string, items: SaveItemInput[]) => Promise<SaveItemsResponse>;
  startSync: (flujoId: number | string, skus: string[], accountId: number) => Promise<StartSyncResponse>;
  getSyncStatus: (flujoId: number | string, jobId: number) => Promise<SyncJobStatus>;
  getLatestSync: (flujoId: number | string) => Promise<SyncJobStatus | null>;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useCatalogHubGridApi(): UseCatalogHubGridApi {
  const { fetchWithAuthPim } = useFetchWithAuthPim();

  return useMemo<UseCatalogHubGridApi>(
    () => ({
      getN3Products: async (n3Id, params) => {
        const q = new URLSearchParams({ conn: "ml" });
        if (params?.page != null) q.set("page", String(params.page));
        if (params?.pageSize != null) q.set("pageSize", String(params.pageSize));
        if (params?.search) q.set("search", params.search);
        return fetchWithAuthPim<N3ProductsResponse>(
          `${BASE}/n3/${encodeURIComponent(n3Id)}/products?${q.toString()}`,
        );
      },

      // U3 — clon EXACTO de getN3Products cambiando solo la URL (productos por
      // flujo/membresía en vez de toda la N3). Mismo shape de respuesta.
      getFlujoProducts: async (flujoId, params) => {
        const q = new URLSearchParams({ conn: "ml" });
        if (params?.page != null) q.set("page", String(params.page));
        if (params?.pageSize != null) q.set("pageSize", String(params.pageSize));
        if (params?.search) q.set("search", params.search);
        return fetchWithAuthPim<N3ProductsResponse>(
          `${BASE}/flujos/${encodeURIComponent(String(flujoId))}/products?${q.toString()}`,
        );
      },

      getN3Schema: async (n3Id) =>
        fetchWithAuthPim<N3SchemaResponse>(
          `${BASE}/n3/${encodeURIComponent(n3Id)}/schema?mk=ml`,
        ),

      // Pieza G — predicciones batch (cero cuota ML). Una sola llamada siembra
      // la categoría sugerida por SKU en modo Publicar. El backend clampa
      // pageSize a 500 (ver routes/_helpers.getPagination); con 500 cabe el N3.
      getPredicciones: async (n3Id, params) => {
        const q = new URLSearchParams({ n3_id: n3Id });
        q.set("page", String(params?.page ?? 1));
        q.set("pageSize", String(params?.pageSize ?? 500));
        return fetchWithAuthPim<PrediccionesResponse>(
          `/api/pim/canales/mercadolibre/predicciones?${q.toString()}`,
        );
      },

      // Categoría por SKU vía la cascada VALIDADA del N3 (la misma del wizard).
      // Una sola llamada siembra la categoría correcta por SKU en modo Publicar.
      // Cero cuota ML; el endpoint devuelve todo el N3 (sin paginación).
      getN3CascadeCategorias: async (n3Id) =>
        fetchWithAuthPim<{ data: CascadeCategoria[]; total: number }>(
          `${BASE}/n3/${encodeURIComponent(n3Id)}/cascade-categorias?marketplace=ml`,
        ),

      getN3Values: async (n3Id, skus) => {
        // Auto-batch: troceamos en lotes de 100 y mergeamos las respuestas.
        const batches = chunk(skus, VALUES_CHUNK);
        const valuesBySku: Record<string, N3ValueEntry> = {};
        const warnings: string[] = [];
        for (const batch of batches) {
          const env = await fetchWithAuthPim<N3ValuesResponse>(
            `${BASE}/n3/${encodeURIComponent(n3Id)}/values?mk=ml`,
            { method: "POST", body: JSON.stringify({ skus: batch }) },
          );
          Object.assign(valuesBySku, env.valuesBySku ?? {});
          if (env.warnings?.length) warnings.push(...env.warnings);
        }
        return warnings.length > 0 ? { valuesBySku, warnings } : { valuesBySku };
      },

      // Pieza F — persiste los edits del flujo (overlay sobre lo que C entrega).
      saveItems: async (flujoId, items) =>
        fetchWithAuthPim<SaveItemsResponse>(
          `${BASE}/flujos/${encodeURIComponent(String(flujoId))}/items`,
          { method: "PATCH", body: JSON.stringify({ items }) },
        ),

      // Pieza F — encola un job de sincronización a ML (202 + jobId).
      startSync: async (flujoId, skus, accountId) =>
        fetchWithAuthPim<StartSyncResponse>(
          `${BASE}/flujos/${encodeURIComponent(String(flujoId))}/sync`,
          { method: "POST", body: JSON.stringify({ skus, accountId }) },
        ),

      // Pieza F — estado de un job puntual (para el polling del modal).
      getSyncStatus: async (flujoId, jobId) =>
        fetchWithAuthPim<SyncJobStatus>(
          `${BASE}/flujos/${encodeURIComponent(String(flujoId))}/sync/${jobId}`,
        ),

      // Pieza F — último job del flujo (para reenganchar uno en curso tras un 409).
      getLatestSync: async (flujoId) =>
        fetchWithAuthPim<SyncJobStatus | null>(
          `${BASE}/flujos/${encodeURIComponent(String(flujoId))}/sync`,
        ),
    }),
    [fetchWithAuthPim],
  );
}
