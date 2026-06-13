// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/types/grid-types.ts
//
// Tipos de la grilla editable (Pieza E). Se dividen en dos bloques:
//   1. Respuestas crudas del backend (RAW — sin envoltorio {ok,data}; el
//      pim-service responde el body directo, igual que catalog-hub-api.ts).
//   2. Modelo de grilla en memoria (lo que consume la UI de la Pieza E).

// ===== Respuestas backend (RAW, sin {ok,data}) =====

export interface N3ProductRow {
  sku: string;
  nombre: string;
  n3_id: string;
  item_id: string | null;
  publish_status:
    | "publicado"
    | "en_proceso"
    | "error"
    | "pausado"
    | "no_publicado"
    | "desconocido";
  ml_status: string | null;
  publicaciones_count: number;
  /** Valores guardados en el overlay del flujo (catalog_hub_flujo_item). Solo lo
   *  devuelve `getFlujoProducts`. Se superpone sobre los valores del N3 maestro
   *  para que las ediciones/imágenes guardadas se vean al recargar. */
  overlay?: Record<string, unknown> | null;
}

export interface N3ProductsResponse {
  n3: { id: string; nombre: string; n2Nombre?: string; n1Nombre?: string };
  total: number;
  page: number;
  pageSize: number;
  products: N3ProductRow[];
  warnings?: string[];
}

export interface SchemaColumn {
  key: string;
  label: string;
  group: "fijo" | "categoria";
  type:
    | "text"
    | "number"
    | "textarea"
    | "boolean"
    | "list"
    | "number_unit"
    | "string";
  required?: boolean;
  options?: { id: string; name: string }[] | null;
  unit?: string[] | null;
  lazy?: boolean;
}

export interface N3SchemaResponse {
  // Pieza G: el backend ya NO devuelve la categoría del N3 (`getN3Schema`
  // entrega solo el set común; la categoría ML pasó a ser por SKU). Se deja
  // opcional por compatibilidad con respuestas viejas, pero el front no debe
  // depender de él — la categoría vive en `row.values.category_id`/nombre.
  ml_category?: { id: string | null; nombre: string | null; mapeada: boolean };
  columns: SchemaColumn[];
  warnings?: string[];
}

export interface N3ValueEntry {
  item_id: string | null;
  categoria_divergente: boolean;
  fuente: "ml_item" | "ficha" | "vacio";
  values: Record<string, unknown>;
}

export interface N3ValuesResponse {
  valuesBySku: Record<string, N3ValueEntry>;
  warnings?: string[];
}

// ===== Modelo de grilla (memoria) =====

export type LauncherKind =
  | "descripcion"
  | "imagenes";

export interface GridColumn extends Omit<SchemaColumn, "group"> {
  group: "fijo" | "categoria" | "control";
  launcher?: LauncherKind;
}

/**
 * Fila de la grilla en memoria.
 *
 * Pieza G — convención de categoría POR FILA: la categoría ML de cada SKU vive
 * dentro de `values`, en dos keys:
 *   - `values.category_id`      → id de la categoría ML (p.ej. "MLC1234").
 *   - `values.category_nombre`  → nombre/path legible de la categoría.
 * No hay un campo dedicado en `GridRow` ni un `mlCategory` a nivel grilla: se
 * lee/escribe siempre desde `values` (en Publicar se siembra de la predicción;
 * en Editar viene de `getN3Values`). El setter `setCategoria` del hook escribe
 * esas dos keys vía el mecanismo de edits.
 */
export interface GridRow {
  sku: string;
  nombre: string;
  itemId: string | null;
  publishStatus: string;
  mlStatus: string | null;
  categoriaDivergente: boolean;
  fuente: "ml_item" | "ficha" | "vacio" | "desconocido";
  values: Record<string, unknown>;
}

export type Edits = Record<string, Record<string, unknown>>;

export type RowStatus = "ok" | "warn" | "error";
