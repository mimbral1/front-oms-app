// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/api/carga-masiva-api.ts
//
// Cliente HTTP tipado para carga masiva. Endpoint principal `/api/pim/imports/*`
// (proxied por pim-service hacia meli-catalog-service).
//
// ⚠️ NORMALIZACIÓN snake_case → camelCase
// El backend (`meli-catalog-service`) devuelve TODO en snake_case (columnas DB
// directas de ml_bulk_imports + ml_skus). Este módulo hace la traducción en el
// boundary así la UI ve siempre camelCase. Los normalizers están agrupados al
// final del archivo (`normalizeBatch`, `normalizeRow`, `deriveRowStatus`).
//
// Caveat: el POST /excel devuelve un shape DIFERENTE al de GET /:batchId.
// POST: `{ batchId, totalRows, ok, skipped, incomplete, errors, status }` (camel mixed)
// GET : `{ batch_id, total_rows, rows_validated_ok, rows_skipped, rows_incomplete,
//          status, ... }` (snake puro)
// `normalizeBatch` acepta ambos.
//
// NOTA: el upload usa multipart/form-data, no JSON. Por eso esta función
// hace fetch directo en vez de usar `useFetchWithAuthPim` (que setea
// `Content-Type: application/json` en `buildHeaders`). Mantenemos el resto
// de headers (Authorization + x-plataforma-id) manualmente.

"use client";

import { useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import { useFetchWithAuthPim } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { URL_PIM_SERVICE } from "@/lib/http/endpoints";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { resolveMarketplaceKey } from "../../../productos/base/utils/marketplace";
import type {
    ApiEnvelope,
    BatchActivity,
    BatchSummary,
    BulkRow,
    PublishStatus,
    RowStatus,
    UploadExcelPayload,
    ValidationStatus,
} from "../types/carga-masiva-types";

/** Agrega `?marketplace=X` (o `&`) a un path para que pim rutee al µservice
 *  correcto (falabella → fcom-catalog, resto → meli-catalog). */
function appendMp(path: string, marketplace: string): string {
    return `${path}${path.includes("?") ? "&" : "?"}marketplace=${encodeURIComponent(marketplace)}`;
}

function pickToken(ctxToken: string | null): string {
    if (ctxToken) return ctxToken;
    try {
        const ls = JSON.parse(localStorage.getItem("authState") || "{}");
        if (ls?.token) return String(ls.token);
    } catch {
        /* vacío */
    }
    return Cookies.get("authToken") || "";
}

/**
 * Nombre canónico del lote: `carga_masiva_DD_MM_AAAA_HH_MM_SS.xlsx`, con fecha y
 * hora LOCALES de la subida. Se ignora el nombre original del archivo — el lote
 * se renombra a este formato (se guarda y se muestra así en lista/título/detalle).
 * Conserva la extensión .xls si el original era .xls.
 */
function buildBatchFilename(originalName: string): string {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const fecha = `${p(now.getDate())}_${p(now.getMonth() + 1)}_${now.getFullYear()}`;
    const hora = `${p(now.getHours())}_${p(now.getMinutes())}_${p(now.getSeconds())}`;
    const ext = /\.xls$/i.test(originalName) ? ".xls" : ".xlsx";
    return `carga_masiva_${fecha}_${hora}${ext}`;
}

export interface UseCargaMasivaApi {
    /** POST /api/pim/imports/excel — multipart. */
    upload: (payload: UploadExcelPayload) => Promise<BatchSummary>;
    /** GET /api/pim/imports/:batchId */
    getBatch: (batchId: string) => Promise<BatchSummary>;
    /** GET /api/pim/imports/:batchId/queue */
    getQueue: (batchId: string) => Promise<{
        batch: BatchSummary;
        rows: BulkRow[];
        /** Mapa publish_status → count, util para chips de resumen. */
        publishSummary: Record<string, number>;
        total: number;
    }>;
    /** GET /api/pim/imports?accountId=&limit=&includeArchived= */
    listBatches: (params?: {
        accountId?: number;
        limit?: number;
        includeArchived?: boolean;
    }) => Promise<BatchSummary[]>;
    /** PATCH /api/pim/imports/:batchId/rows/:n — editar fila.
     *  El caller solo pasa `{ mapped, updatedBy }`. El hook agrega
     *  `userName`/`userEmail` automáticamente desde el AuthContext. */
    updateRow: (
        batchId: string,
        rowNumber: number,
        payload: { mapped: Record<string, unknown>; updatedBy: number },
    ) => Promise<unknown>;
    /** POST /api/pim/imports/:batchId/publish-row/:n */
    publishRow: (
        batchId: string,
        rowNumber: number,
        triggeredBy: number,
    ) => Promise<unknown>;
    /** POST /api/pim/imports/:batchId/publish-all */
    publishAll: (batchId: string) => Promise<unknown>;
    /** GET /api/pim/imports/pool — bandeja cross-lote (ML). */
    getPool: (params?: { accountId?: number; assignedTo?: number; status?: string }) => Promise<BulkRow[]>;
    /** POST /api/pim/imports/:batchId/claim */
    claim: (batchId: string, rowNumbers: number[], userId: number) => Promise<{ claimed: number[]; requested: number }>;
    /** POST /api/pim/imports/:batchId/release */
    release: (batchId: string, rowNumbers: number[], userId: number) => Promise<{ released: number[] }>;
    /** GET /api/pim/imports/:batchId/rows/:rowNumber — fila con mapped parseado. */
    getRow: (batchId: string, rowNumber: number) => Promise<BulkRow | null>;
    /** PATCH /api/pim/imports/:batchId/archive — archiva (o desarchiva) un lote. */
    archive: (batchId: string, archived: boolean) => Promise<unknown>;
    /** GET /api/pim/imports/:batchId/activity — timeline de actividad del lote (ML). */
    getActivity: (batchId: string) => Promise<BatchActivity[]>;
    /** GET /api/pim/imports/template — descarga el .xlsx (blob + auth). */
    downloadTemplate: () => Promise<void>;
}

export function useCargaMasivaApi(): UseCargaMasivaApi {
    const { fetchWithAuthPim, token } = useFetchWithAuthPim();
    const { user } = useAuth();
    const platform = useEcommercePlatform();
    // Canal actual ("ml" | "falabella" | "vtex") — se manda en cada request para
    // que pim rutee al µservice correcto. Default "ml" (compat).
    const marketplace = resolveMarketplaceKey(platform.name);
    // Snapshot del actor desde el AuthContext. Lo enviamos en cada acción
    // que escribe en el backend para que los logs queden con nombre legible
    // sin requerir lookup a `Perfiles`.
    const actorUserName = user?.nombre ?? null;
    const actorUserEmail = user?.email ?? null;

    const upload = useCallback(
        async (payload: UploadExcelPayload): Promise<BatchSummary> => {
            const base = URL_PIM_SERVICE || "";
            const url = appendMp(`${base.replace(/\/+$/, "")}/api/pim/imports/excel`, marketplace);
            const t = pickToken(token);

            const fd = new FormData();
            // 3er arg = filename: el backend lo guarda como `originalname`, así que
            // el lote se renombra al formato canónico sin importar cómo se llamaba
            // el archivo subido.
            fd.append("file", payload.file, buildBatchFilename(payload.file.name));
            fd.append("accountId", String(payload.accountId));
            fd.append("uploadedBy", String(payload.uploadedBy));
            if (actorUserName) fd.append("userName", actorUserName);
            if (actorUserEmail) fd.append("userEmail", actorUserEmail);
            if (payload.skipSapCheck) fd.append("skipSapCheck", "true");

            // No `Content-Type` — el browser lo setea con boundary correcto al
            // pasarle un FormData.
            const headers: Record<string, string> = {
                "x-plataforma-id": "1",
            };
            if (t) headers.Authorization = `Bearer ${t}`;

            const res = await fetch(url, {
                method: "POST",
                body: fd,
                headers,
            });

            if (!res.ok) {
                let detail: { message?: string } = {};
                try {
                    detail = await res.json();
                } catch {
                    /* vacío */
                }
                const err = new Error(
                    detail?.message || `HTTP ${res.status} al subir archivo`,
                ) as Error & { status?: number };
                err.status = res.status;
                throw err;
            }

            const envelope: ApiEnvelope<unknown> = await res.json();
            if (!envelope?.ok || envelope.data == null) {
                throw new Error(envelope?.message || "Respuesta inesperada del backend");
            }
            return normalizeBatch(envelope.data);
        },
        [token, actorUserName, actorUserEmail, marketplace],
    );

    const getBatch = useCallback(
        async (batchId: string): Promise<BatchSummary> => {
            const env = await fetchWithAuthPim<ApiEnvelope<unknown>>(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}`, marketplace),
            );
            if (!env.ok || env.data == null) {
                throw new Error(env.message || "Respuesta inesperada del backend");
            }
            // GET /:batchId puede devolver { batch, rows } (getBatchDetail) o el
            // batch crudo. Soportamos ambos.
            const raw = (env.data as { batch?: unknown }).batch ?? env.data;
            return normalizeBatch(raw);
        },
        [fetchWithAuthPim, marketplace],
    );

    const getQueue = useCallback(
        async (batchId: string) => {
            const env = await fetchWithAuthPim<ApiEnvelope<unknown>>(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/queue`, marketplace),
            );
            // El backend siempre devuelve: { batch, summary, total, queue }.
            // Si por alguna razón (mock, fixture viejo) viniera plano como array,
            // lo soportamos también.
            if (!env.ok || env.data == null) {
                return {
                    batch: { batchId } as BatchSummary,
                    rows: [],
                    publishSummary: {},
                    total: 0,
                };
            }
            const data = env.data;
            if (Array.isArray(data)) {
                return {
                    batch: { batchId } as BatchSummary,
                    rows: data.map(normalizeRow),
                    publishSummary: {},
                    total: data.length,
                };
            }
            const obj = data as {
                batch?: unknown;
                queue?: unknown[];
                summary?: Record<string, number>;
                total?: number;
            };
            return {
                batch: obj.batch
                    ? normalizeBatch(obj.batch)
                    : ({ batchId } as BatchSummary),
                rows: Array.isArray(obj.queue) ? obj.queue.map(normalizeRow) : [],
                publishSummary: obj.summary ?? {},
                total: typeof obj.total === "number"
                    ? obj.total
                    : Array.isArray(obj.queue) ? obj.queue.length : 0,
            };
        },
        [fetchWithAuthPim, marketplace],
    );

    const listBatches = useCallback(
        async (params?: {
            accountId?: number;
            limit?: number;
            includeArchived?: boolean;
        }): Promise<BatchSummary[]> => {
            const q = new URLSearchParams();
            if (params?.accountId) q.set("accountId", String(params.accountId));
            if (params?.limit) q.set("limit", String(params.limit));
            if (params?.includeArchived) q.set("includeArchived", "true");
            q.set("marketplace", marketplace);
            const qs = q.toString();
            const env = await fetchWithAuthPim<ApiEnvelope<unknown[]>>(
                `/api/pim/imports${qs ? `?${qs}` : ""}`,
            );
            if (!Array.isArray(env.data)) return [];
            return env.data.map(normalizeBatch);
        },
        [fetchWithAuthPim, marketplace],
    );

    const updateRow = useCallback(
        (
            batchId: string,
            rowNumber: number,
            payload: { mapped: Record<string, unknown>; updatedBy: number },
        ) =>
            fetchWithAuthPim(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/rows/${rowNumber}`, marketplace),
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        ...payload,
                        userName: actorUserName,
                        userEmail: actorUserEmail,
                    }),
                },
            ),
        [fetchWithAuthPim, actorUserName, actorUserEmail, marketplace],
    );

    const publishRow = useCallback(
        (batchId: string, rowNumber: number, triggeredBy: number) =>
            fetchWithAuthPim(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/publish-row/${rowNumber}`, marketplace),
                {
                    method: "POST",
                    body: JSON.stringify({
                        triggeredBy,
                        userName: actorUserName,
                        userEmail: actorUserEmail,
                    }),
                },
            ),
        [fetchWithAuthPim, actorUserName, actorUserEmail, marketplace],
    );

    const publishAll = useCallback(
        (batchId: string) =>
            fetchWithAuthPim(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/publish-all`, marketplace),
                {
                    method: "POST",
                    // publishAll dispara la publicación de TODAS las filas OK
                    // del lote — registramos quién lo lanzó.
                    body: JSON.stringify({
                        triggeredBy: Number(user?.id) || null,
                        createdBy: Number(user?.id) || null,
                        userName: actorUserName,
                        userEmail: actorUserEmail,
                    }),
                },
            ),
        [fetchWithAuthPim, user?.id, actorUserName, actorUserEmail, marketplace],
    );

    const getPool = useCallback(
        async (params?: { accountId?: number; assignedTo?: number; status?: string }): Promise<BulkRow[]> => {
            const q = new URLSearchParams();
            if (params?.accountId != null) q.set("accountId", String(params.accountId));
            if (params?.assignedTo != null) q.set("assignedTo", String(params.assignedTo));
            if (params?.status) q.set("status", String(params.status));
            q.set("marketplace", marketplace);
            const env = await fetchWithAuthPim<ApiEnvelope<unknown[]>>(
                `/api/pim/imports/pool?${q.toString()}`,
            );
            return Array.isArray(env.data) ? env.data.map(normalizeRow) : [];
        },
        [fetchWithAuthPim, marketplace],
    );

    const claim = useCallback(
        (batchId: string, rowNumbers: number[], userId: number) =>
            fetchWithAuthPim(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/claim`, marketplace),
                { method: "POST", body: JSON.stringify({ rowNumbers, userId, userName: actorUserName }) },
            ) as Promise<{ claimed: number[]; requested: number }>,
        [fetchWithAuthPim, actorUserName, marketplace],
    );

    const release = useCallback(
        (batchId: string, rowNumbers: number[], userId: number) =>
            fetchWithAuthPim(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/release`, marketplace),
                { method: "POST", body: JSON.stringify({ rowNumbers, userId, userName: actorUserName }) },
            ) as Promise<{ released: number[] }>,
        [fetchWithAuthPim, actorUserName, marketplace],
    );

    const getRow = useCallback(
        async (batchId: string, rowNumber: number): Promise<BulkRow | null> => {
            const env = await fetchWithAuthPim<ApiEnvelope<unknown>>(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/rows/${rowNumber}`, marketplace),
            );
            return env.ok && env.data ? normalizeRow(env.data) : null;
        },
        [fetchWithAuthPim, marketplace],
    );

    const archive = useCallback(
        (batchId: string, archived: boolean) =>
            fetchWithAuthPim(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/archive`, marketplace),
                { method: "PATCH", body: JSON.stringify({ archived, updatedBy: Number(user?.id) || null }) },
            ),
        [fetchWithAuthPim, user?.id, marketplace],
    );

    const getActivity = useCallback(
        async (batchId: string): Promise<BatchActivity[]> => {
            const env = await fetchWithAuthPim<ApiEnvelope<unknown[]>>(
                appendMp(`/api/pim/imports/${encodeURIComponent(batchId)}/activity`, marketplace),
            );
            return Array.isArray(env.data) ? env.data.map(normalizeActivity) : [];
        },
        [fetchWithAuthPim, marketplace],
    );

    const downloadTemplate = useCallback(async () => {
        const base = (URL_PIM_SERVICE || "").replace(/\/+$/, "");
        const url = appendMp(`${base}/api/pim/imports/template`, marketplace);
        const t = pickToken(token);
        const headers: Record<string, string> = { "x-plataforma-id": "1" };
        if (t) headers.Authorization = `Bearer ${t}`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
            let detail: { message?: string } = {};
            try { detail = await res.json(); } catch { /* binario o vacío */ }
            throw new Error(detail?.message || `HTTP ${res.status} al descargar la plantilla`);
        }
        const blob = await res.blob();
        // Nombre desde Content-Disposition (lo setea el backend según
        // marketplace); fallback marketplace-aware si el header no viene.
        const cd = res.headers.get("content-disposition") || "";
        const match = /filename="?([^"]+)"?/i.exec(cd);
        const filename = match?.[1] || `plantilla_carga_masiva_${marketplace}.xlsx`;
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(dlUrl);
    }, [token, marketplace]);

    // El user del context se usa en la view para `uploadedBy`. Para mantener
    // la API simple no la inyectamos acá — la view la pasa explícita.
    void user;

    return useMemo(
        () => ({ upload, getBatch, getQueue, listBatches, updateRow, publishRow, publishAll, getPool, claim, release, getRow, archive, getActivity, downloadTemplate }),
        [upload, getBatch, getQueue, listBatches, updateRow, publishRow, publishAll, getPool, claim, release, getRow, archive, getActivity, downloadTemplate],
    );
}

// ════════════════════════════════════════════════════════════════════════════
// Normalizers — snake_case (backend) → camelCase (frontend)
// ════════════════════════════════════════════════════════════════════════════

type AnyRecord = Record<string, unknown>;

function num(v: unknown): number | undefined {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
    if (v == null) return undefined;
    const s = String(v);
    return s.length === 0 ? undefined : s;
}

function bool(v: unknown): boolean | undefined {
    if (v == null) return undefined;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
        const s = v.toLowerCase();
        if (s === "1" || s === "true" || s === "yes") return true;
        if (s === "0" || s === "false" || s === "no") return false;
    }
    return undefined;
}

/**
 * Normaliza el batch a la vista camelCase del front. Acepta ambos shapes:
 *
 *   POST /excel response (camel mixto):
 *     { batchId, totalRows, ok, skipped, incomplete, errors, status }
 *
 *   GET /:batchId & rows en /queue (snake puro):
 *     { batch_id, total_rows, rows_validated_ok, rows_skipped, rows_incomplete,
 *       status, filename, uploaded_at, finished_at, archived, archived_at,
 *       account_id, uploaded_by, ... }
 */
export function normalizeBatch(raw: unknown): BatchSummary {
    if (!raw || typeof raw !== "object") {
        return { batchId: "" };
    }
    const r = raw as AnyRecord;
    return {
        batchId: str(r.batchId ?? r.batch_id) ?? "",
        filename: str(r.filename),
        accountId: num(r.accountId ?? r.account_id),
        uploadedBy: num(r.uploadedBy ?? r.uploaded_by),
        uploadedAt: str(r.uploadedAt ?? r.uploaded_at),
        finishedAt: str(r.finishedAt ?? r.finished_at),
        status: str(r.status) as BatchSummary["status"],
        archived: bool(r.archived),
        // POST devuelve `totalRows` (camel) — GET devuelve `total_rows` (snake).
        totalRows: num(r.totalRows ?? r.total_rows),
        // POST devuelve `ok` — GET devuelve `rows_validated_ok`.
        okRows: num(r.okRows ?? r.rows_validated_ok ?? r.ok),
        // POST devuelve `incomplete` — GET devuelve `rows_incomplete`.
        incompleteRows: num(r.incompleteRows ?? r.rows_incomplete ?? r.incomplete),
        // POST devuelve `skipped` — GET devuelve `rows_skipped`.
        skippedRows: num(r.skippedRows ?? r.rows_skipped ?? r.skipped),
        // POST devuelve `errors` — GET no expone errors directo (se infiere de total - ok - skipped - incomplete).
        errorRows: num(r.errorRows ?? r.errors),
        uploadedByName: str(r.uploadedByName ?? r.uploaded_by_name) ?? null,
        publicados: num(r.publicados),
        asignados: num(r.asignados),
        pendientes: num(r.pendientes),
    };
}

/**
 * Deriva el status UI de la fila desde validation_status + publish_status.
 *
 * Reglas (en orden — la validación del excel actual manda sobre el publish
 * histórico, porque el seller acaba de subir datos nuevos y necesita ver si
 * la fila tal como vino requiere completarse):
 *
 *   1. validation_status === "error"                  → "err"  (campos críticos faltan)
 *   2. validation_status === "incomplete" | "skipped" → "warn" (faltan no críticos / SKU no SAP)
 *   3. publish_status === "error"                     → "err"  (publicación previa falló)
 *   4. publish_status === "synchronized"              → "ok"   (data válida + ya en ML)
 *   5. otherwise                                       → "ok"
 *
 * Antes el chequeo era al revés: `publish_status === "synchronized"` retornaba
 * "ok" primero y enmascaraba avisos de validación. Resultado: un SKU ya
 * sincronizado de una carga previa aparecía "OK" aunque el excel nuevo tuviera
 * categoría/peso/dimensiones vacías. El seller tiene que completar antes de
 * re-publicar — la fila se considera lista solo si la validación pasa.
 */
export function deriveRowStatus(
    validationStatus: ValidationStatus | null | undefined,
    publishStatus: PublishStatus,
): RowStatus {
    if (validationStatus === "error") return "err";
    if (validationStatus === "incomplete" || validationStatus === "skipped") {
        return "warn";
    }
    if (publishStatus === "error") return "err";
    if (publishStatus === "synchronized") return "ok";
    return "ok";
}

/**
 * Deriva el mensaje principal de la fila (lo que la UI muestra en la columna
 * "Mensaje"). Prioridad:
 *   1. error_message (publicación ML rechazada)
 *   2. primer validation_errors[].message
 *   3. null
 */
function deriveRowMessage(
    errorMessage: string | undefined,
    validationErrors: unknown,
): string | undefined {
    if (errorMessage) return errorMessage;
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        const first = validationErrors[0] as { message?: string; field?: string; code?: string };
        if (first?.message) return first.message;
        if (first?.field || first?.code) {
            return [first.code, first.field].filter(Boolean).join(": ");
        }
    }
    return undefined;
}

export function normalizeRow(raw: unknown): BulkRow {
    if (!raw || typeof raw !== "object") {
        return { rowNumber: 0, sku: null, status: "warn" };
    }
    const r = raw as AnyRecord;

    const rowNumber = num(r.rowNumber ?? r.row_number) ?? 0;
    const sku = str(r.sku) ?? null;

    const validationStatus = str(r.validationStatus ?? r.validation_status) as
        | ValidationStatus
        | undefined;
    const publishStatus = (str(r.publishStatus ?? r.publish_status) ?? null) as PublishStatus;

    const status = deriveRowStatus(validationStatus, publishStatus);

    // validation_errors viene como JSON string o array — el backend lo parsea
    // antes de devolverlo pero defensivamente lo manejamos.
    let validationErrors: unknown = r.validationErrors ?? r.validation_errors ?? [];
    if (typeof validationErrors === "string") {
        try {
            validationErrors = JSON.parse(validationErrors);
        } catch {
            validationErrors = [];
        }
    }

    const errorMessage = str(r.errorMessage ?? r.error_message);
    const message = deriveRowMessage(errorMessage, validationErrors);

    let mapped: Record<string, unknown> | null = null;
    const mappedRaw = r.mapped ?? r.mapped_json;
    if (mappedRaw && typeof mappedRaw === "object") {
        mapped = mappedRaw as Record<string, unknown>;
    } else if (typeof mappedRaw === "string") {
        try {
            mapped = JSON.parse(mappedRaw) as Record<string, unknown>;
        } catch {
            mapped = null;
        }
    }

    return {
        rowNumber,
        sku,
        status,
        message,
        validationStatus,
        publishStatus,
        mlSkuInserted: bool(r.mlSkuInserted ?? r.ml_sku_inserted),
        mlItemId: str(r.mlItemId ?? r.ml_item_id) ?? null,
        mapped,
        title: str(r.title ?? (mapped?.title as string | undefined)) ?? null,
        brand: str(r.brand ?? (mapped?.brand as string | undefined)) ?? null,
        margen: num(r.margen ?? (mapped?.margen as number | undefined)) ?? null,
        assignedTo: num(r.assignedTo ?? r.assigned_to) ?? null,
        assignedToName: str(r.assignedToName ?? r.assigned_to_name) ?? null,
        assignedAt: str(r.assignedAt ?? r.assigned_at) ?? null,
        uploadedBy: num(r.uploadedBy ?? r.uploaded_by) ?? null,
        uploadedByName: str(r.uploadedByName ?? r.uploaded_by_name) ?? null,
        batchId: str(r.batchId ?? r.batch_id),
        mlCategoryId: str(r.mlCategoryId ?? r.ml_category_id) ?? null,
        errorCode: str(r.errorCode ?? r.error_code) ?? null,
        errorMessage: errorMessage ?? null,
        errorPermanent: bool(r.errorPermanent ?? r.error_permanent),
        issues: Array.isArray(validationErrors)
            ? validationErrors.map((it) => {
                  const item = it as { severity?: string; message?: string; field?: string; code?: string };
                  return {
                      severity: (item.severity as ValidationStatus) ?? "error",
                      message: item.message ?? "",
                      field: item.field,
                      code: item.code,
                  };
              })
            : [],
    };
}

/**
 * Normaliza un evento de actividad del lote (ml_event_log) → BatchActivity.
 * El backend devuelve created_at_chile (hora Chile) — preferida sobre UTC.
 */
export function normalizeActivity(raw: unknown): BatchActivity {
    const r = (raw && typeof raw === "object" ? raw : {}) as AnyRecord;
    return {
        id: num(r.id) ?? 0,
        eventCode: str(r.eventCode ?? r.event_code) ?? "",
        eventType: str(r.eventType ?? r.event_type) ?? null,
        sku: str(r.sku) ?? null,
        rowNumber: num(r.rowNumber ?? r.row_number) ?? null,
        actorName: str(r.actorName ?? r.actor_name) ?? null,
        success: bool(r.success),
        errorMessage: str(r.errorMessage ?? r.error_message) ?? null,
        createdAt: str(r.createdAtChile ?? r.created_at_chile ?? r.createdAtUtc ?? r.created_at_utc) ?? null,
    };
}
