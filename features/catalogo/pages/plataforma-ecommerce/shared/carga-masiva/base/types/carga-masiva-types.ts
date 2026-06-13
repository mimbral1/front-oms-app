// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/types/carga-masiva-types.ts
//
// Tipos del dominio Carga Masiva.
//
// Endpoints backend (pim-service :3001 → meli-catalog-service :3013):
//
//   POST   /api/pim/imports/excel              (multipart/form-data: file + accountId + uploadedBy)
//   GET    /api/pim/imports?accountId=...      → listar batches
//   GET    /api/pim/imports/:batchId           → estado del batch
//   GET    /api/pim/imports/:batchId/queue     → { batch, summary, total, queue }
//   GET    /api/pim/imports/:batchId/rows/:n   → una fila
//   PATCH  /api/pim/imports/:batchId/rows/:n   → editar fila
//   POST   /api/pim/imports/:batchId/publish-row/:n
//   POST   /api/pim/imports/:batchId/publish-all
//   PATCH  /api/pim/imports/:batchId/archive
//   DELETE /api/pim/imports/:batchId
//
// FUENTE DE VERDAD del shape — `meli-catalog-service/src/modules/imports`:
//   - `infrastructure/bulk-imports.repository.js#getQueueByBatch` retorna rows
//     en snake_case desde MELICATALOG_DB (ml_bulk_imports JOIN ml_skus).
//   - `application/import.service.js#processExcelImport` POST → mixed camel
//     (batchId, totalRows, ok, skipped, incomplete, errors, status).
//   - `application/import.service.js#getBatchDetail` GET → `{ batch, rows }` con
//     batch en snake_case y rows en snake_case.
//   - `http/imports.routes.js` GET /queue → `{ batch, summary, total, queue }`.
//
// IMPORTANTE: estos tipos representan la vista CAMEL CASE del front. Las
// respuestas snake_case del backend se normalizan en `api/carga-masiva-api.ts`.

/** Stage visible del wizard. */
export type CargaMasivaStage = "upload" | "processing" | "preview";

/**
 * Status agregado de una fila para la UI. Se DERIVA de
 * `validation_status` + `publish_status` del backend:
 *
 *   - publish_status === 'synchronized'                        → "ok"   (publicada en ML)
 *   - publish_status === 'error'                               → "err"  (ML rechazó)
 *   - validation_status === 'error'                            → "err"
 *   - validation_status === 'incomplete'                       → "warn"
 *   - validation_status === 'skipped'                          → "warn"
 *   - validation_status === 'ok' (sin publish_status aún)      → "ok"
 *
 * El backend NO devuelve este campo — se calcula en `api/carga-masiva-api.ts#deriveRowStatus`.
 */
export type RowStatus = "ok" | "warn" | "err";

/** Status de validación del backend (campo `validation_status` en ml_bulk_import_rows). */
export type ValidationStatus = "ok" | "incomplete" | "error" | "skipped" | (string & {});

/** Status de publicación del backend (campo `publish_status` en ml_skus). */
export type PublishStatus =
    | "synchronized"
    | "pending"
    | "error"
    | "paused"
    | null
    | (string & {});

/** Estado del batch en `ml_bulk_imports.status`. */
export type BatchStatus =
    | "parsing"
    | "validating"
    | "ready"
    | "publishing"
    | "done"
    | "error"
    | "archived"
    | (string & {});

/**
 * Resumen del batch ya normalizado a camelCase (la respuesta REAL del backend
 * viene en snake_case y se mapea en `normalizeBatch` del API client).
 *
 * Fuente de verdad en backend:
 *   ml_bulk_imports → batch_id, account_id, uploaded_by, filename,
 *                     total_rows, status, archived, archived_at,
 *                     rows_validated_ok, rows_skipped, rows_incomplete,
 *                     uploaded_at, finished_at
 *
 * El POST /excel devuelve un shape DIFERENTE (ya en camel) con:
 *   { batchId, totalRows, ok, skipped, incomplete, errors, status }
 * `normalizeBatch` unifica ambos.
 */
export interface BatchSummary {
    batchId: string;
    filename?: string;
    accountId?: number;
    uploadedBy?: number;
    /** ISO date string. */
    uploadedAt?: string;
    finishedAt?: string;
    status?: BatchStatus;
    archived?: boolean;
    /** Cantidad total de filas detectadas en el archivo. */
    totalRows?: number;
    /** Filas OK validadas (mapea a `rows_validated_ok`). */
    okRows?: number;
    /** Filas incompletas — falta info para publicar. */
    incompleteRows?: number;
    /** Filas skipped — SKU no existe en SAP. */
    skippedRows?: number;
    /** Filas con errores de validación que bloquean publicación. */
    errorRows?: number;
    /** Nombre del que subió el lote (users_mirror) — fallback a #uploadedBy. */
    uploadedByName?: string | null;
    /** Resumen de productos del lote (panel de lotes). */
    publicados?: number;
    asignados?: number;
    pendientes?: number;
}

/**
 * Una fila normalizada del batch (ya en camelCase, con `status` derivado).
 *
 * Fuente de verdad en backend (`getQueueByBatch`):
 *   row_id, row_number, sku, mapped_json (parseado), validation_status,
 *   validation_errors, ml_sku_inserted, row_created_at, row_updated_at,
 *   ml_item_id, user_product_id, publish_status, pending_category,
 *   error_code, error_message, error_permanent, retry_count, next_retry_at,
 *   ml_category_id, cascade_fuente, sku_updated_at, title, brand
 */
export interface BulkRow {
    rowNumber: number;
    sku: string | null;
    /** Status agregado UI (derivado — no viene del backend). */
    status: RowStatus;
    /** Mensaje principal — primer validation_error o error_message. */
    message?: string;
    /** Status de validación crudo del backend. */
    validationStatus?: ValidationStatus;
    /** Status de publicación ML crudo del backend. */
    publishStatus?: PublishStatus;
    /** True si se insertó en `ml_skus` (publicable). */
    mlSkuInserted?: boolean;
    /** ID de la publicación en ML (cuando ya se publicó). */
    mlItemId?: string | null;
    /** Mapped data — payload normalizado de la fila. */
    mapped?: Record<string, unknown> | null;
    /** Title resuelto desde mapped_json — siempre presente cuando hay título. */
    title?: string | null;
    /** Brand resuelto desde mapped_json. */
    brand?: string | null;
    /** Margen objetivo (fracción 0-1) desde mapped_json.margen. */
    margen?: number | null;
    /** userId asignado (claim exclusivo) — null si está libre. */
    assignedTo?: number | null;
    /** Nombre del asignado (users_mirror) — fallback a #assignedTo. */
    assignedToName?: string | null;
    /** ISO timestamp del claim. */
    assignedAt?: string | null;
    /** userId que subió el lote (ml_bulk_imports.uploaded_by). */
    uploadedBy?: number | null;
    /** Nombre del que subió (users_mirror) — fallback a #uploadedBy. */
    uploadedByName?: string | null;
    /** batch al que pertenece la fila (necesario en la bandeja cross-lote). */
    batchId?: string;
    /** ml_category_id resuelto (cascade o manual). */
    mlCategoryId?: string | null;
    /** ML rechazó la publicación con este código (PA_UNAUTHORIZED, etc). */
    errorCode?: string | null;
    /** Mensaje de error de publicación de ML. */
    errorMessage?: string | null;
    /** Si el error es permanente (no se reintenta). */
    errorPermanent?: boolean;
    /** Issues estructurados de validation_errors. */
    issues?: Array<{ severity: ValidationStatus; message: string; field?: string; code?: string }>;
}

/** Body de `POST /imports/excel`. Va en FormData. */
export interface UploadExcelPayload {
    file: File;
    accountId: number;
    uploadedBy: number;
    /** Si true, skipea check SAP. */
    skipSapCheck?: boolean;
}

/** Respuesta envelope estándar `{ ok, data }` del pim-service. */
export interface ApiEnvelope<T> {
    ok: boolean;
    data?: T;
    code?: string;
    message?: string;
}

/** Filtro visual de las filas en el preview. */
export type RowFilterTone = "all" | RowStatus;

/**
 * Un evento de actividad del lote (timeline del detalle). Viene de
 * `ml_event_log` scoped por `batch_id` (GET /imports/:batchId/activity).
 */
export interface BatchActivity {
    id: number;
    /** event_code del backend: Bulk_uploaded · Bulk_row_claimed · Bulk_row_released · Bulk_row_updated · Product_published · ... */
    eventCode: string;
    eventType?: string | null;
    sku?: string | null;
    rowNumber?: number | null;
    /** Nombre del actor (users_mirror) — null si no resuelto. */
    actorName?: string | null;
    success?: boolean;
    errorMessage?: string | null;
    /** Hora Chile (created_at_chile) o UTC fallback — ISO string. */
    createdAt?: string | null;
}
