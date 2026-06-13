// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/api/editor-api.ts
//
// API client del Editor de producto. Endpoints reales del pim-service:
//
//   GET  /api/pim/productos/:sku/detalle?marketplace=<ml|falabella|vtex>
//   PUT  /api/pim/productos/:sku                       (con Idempotency-Key)
//   POST /api/pim/ml/imagenes                          (multipart, returns secure_url)
//
// Patrón replicado de `useMarketplaceProductoDetailData` para consistencia
// con el resto del módulo productos. Cuando exista un cliente HTTP centralizado
// (`useFetchWithAuthPim` u otro), migrar a ese.

"use client";

import { useMemo } from "react";
import Cookies from "js-cookie";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useAuth } from "@/app/context/auth/AuthContext";
import { URL_PIM_SERVICE } from "@/lib/http/endpoints";
import { resolveMarketplaceKey } from "../../../productos/base/utils/marketplace";
import type {
    EditorAuditEntry,
    EditorCalidad,
    EditorProduct,
    EditorPublicacion,
    EditorSavePatch,
    EditorSaveResult,
} from "../types/editor-types";
// Reusamos el tipo del diagnóstico de imágenes del módulo publicar (mismo
// contrato del backend `POST /api/pim/ml/imagenes/diagnostico`). Evita duplicar
// la forma; el editor ya importa otros artefactos de publicar (PayloadDrawer).
import type { ImageDiagnostic } from "../../../publicar/base/types/publicar-types";

/**
 * Resuelve el token JWT del usuario activo. Idéntico al patrón de
 * `useFetchWithAuthPim` — pim-service espera `Authorization: Bearer <token>`
 * para popular `req.user` y escribir logs de auditoría con el usuarioId.
 */
function pickToken(ctxToken: string | null | undefined): string {
    if (ctxToken) return ctxToken;
    try {
        const ls = JSON.parse(localStorage.getItem("authState") || "{}");
        if (ls?.token) return String(ls.token);
    } catch {
        /* vacío */
    }
    return Cookies.get("authToken") || "";
}

/** Base del backend pim-service. Coincide con `useMarketplaceProductoDetailData`. */
const API_BASE = `${URL_PIM_SERVICE}/api/pim/productos`;

/** Base de la familia /canales (proxy pim → meli-catalog). El endpoint de
 *  publicaciones (3b) vive acá, no bajo /productos. */
const CANALES_ML = `${URL_PIM_SERVICE}/api/pim/canales/mercadolibre/productos`;

/**
 * Endpoint de upload de imágenes — devuelve URLs públicas del CDN de ML
 * (mlstatic.com). Aunque es ML-specific en path, el URL resultante se
 * puede usar también en Falabella (Fala consume URLs externas).
 *
 * Source: `pim-service/Plataforma_Marketplace/public/editar.html:1337`.
 */
const IMG_UPLOAD_URL = `${URL_PIM_SERVICE}/api/pim/ml/imagenes`;

/** Genera un Idempotency-Key UUID v4. Stripe-style replay-safe. */
function genIdempotencyKey(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `fb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface EditorApiError extends Error {
    status?: number;
    code?: string;
    /** Optimistic locking — backend devuelve la versión actual cuando hay conflict. */
    your_version?: number;
    current_version?: number;
    current_value?: unknown;
    atributos_bloqueados?: string[];
}

export interface EditorImageUploadResult {
    /** URL pública del CDN (mlstatic.com). */
    secure_url: string;
    /** Picture ID de ML (opcional, no se usa en el editor por ahora). */
    picture_id?: string;
    [key: string]: unknown;
}

export interface EditorApi {
    /** GET /detalle — fetch del producto. */
    fetchProduct: (sku: string) => Promise<EditorProduct>;
    /**
     * GET /calidad — fetch del score de calidad. Endpoint separado del detalle
     * porque el legacy lo invoca en paralelo (Promise.allSettled) y no debe
     * bloquear si falla.
     */
    fetchCalidad: (sku: string) => Promise<EditorCalidad>;
    /**
     * GET /:sku/audit — bitácora del producto (cambios + respuesta Sellercenter).
     * Hoy solo Falabella; ML/VTEX devuelven 501 (la tab muestra empty-state).
     * `includePayload` trae el XML enviado + la respuesta cruda de Falabella.
     */
    fetchAuditLog: (
        sku: string,
        opts?: { limit?: number; includePayload?: boolean },
    ) => Promise<EditorAuditEntry[]>;
    /**
     * GET /api/pim/canales/mercadolibre/productos/:sku/publicaciones — las N
     * publicaciones ML del SKU (clásica + catálogo + variaciones). Solo lectura.
     */
    fetchPublicaciones: (sku: string) => Promise<EditorPublicacion[]>;
    /**
     * PUT /:sku — guardar cambios.
     * El caller pasa la MISMA idempotencyKey en cada retry (browser timeout o
     * doble click). Si se quiere forzar un intento "nuevo" tras un error
     * user-conscious, regenerar la key.
     */
    saveProduct: (
        sku: string,
        patch: EditorSavePatch,
        opts?: { idempotencyKey?: string },
    ) => Promise<EditorSaveResult>;
    /**
     * Sube un File al backend y retorna `{secure_url, picture_id}`. Timeout 30s
     * (imágenes pueden ser grandes). El URL resultante se puede usar en ML
     * y Falabella.
     */
    uploadImage: (file: File) => Promise<EditorImageUploadResult>;
    /**
     * POST /api/pim/ml/imagenes/diagnostico — diagnóstico de calidad de ML
     * (fondo blanco, tamaño mínimo, texto/logo, marca de agua). Solo ML.
     * No bloquea: degrada a `{ ok:false, action:"unknown" }` si falla (red/cuota).
     */
    diagnosticarImagen: (args: {
        pictureId?: string;
        pictureUrl?: string;
        categoryId?: string;
        title?: string;
        pictureType?: "thumbnail" | "variation_thumbnail" | "other";
    }) => Promise<ImageDiagnostic>;
    /** Genera una nueva idempotency key (UUID v4). */
    genIdempotencyKey: () => string;
    /** Resolved marketplace key del platform actual ("ml" | "falabella" | "vtex"). */
    marketplaceKey: string;
}

/**
 * Hook que devuelve el API client del editor — inyecta el marketplace
 * automáticamente desde `useEcommercePlatform()`. NO POST/PUT/DELETE espontáneo:
 * `saveProduct` solo se invoca tras click humano explícito en "Guardar".
 */
export function useEditorApi(): EditorApi {
    const platform = useEcommercePlatform();
    const { token, user } = useAuth();
    const userId = Number(user?.id) || 0;
    const userName = user?.nombre ?? null;
    const userEmail = user?.email ?? null;
    const marketplaceKey = useMemo(
        () => resolveMarketplaceKey(platform.name),
        [platform.name],
    );

    return useMemo<EditorApi>(
        () => ({
            marketplaceKey,
            genIdempotencyKey,

            fetchProduct: async (sku: string) => {
                const url = `${API_BASE}/${encodeURIComponent(sku)}/detalle?marketplace=${encodeURIComponent(marketplaceKey)}`;
                const t = pickToken(token);
                const r = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(t ? { Authorization: `Bearer ${t}` } : {}),
                    },
                    cache: "no-store",
                });
                const json = await r.json().catch(() => ({}));
                if (!r.ok) {
                    const err = new Error(
                        json?.message || `HTTP ${r.status} ${r.statusText}`,
                    ) as EditorApiError;
                    err.status = r.status;
                    err.code = json?.code;
                    throw err;
                }
                return json as EditorProduct;
            },

            fetchCalidad: async (sku: string) => {
                const url = `${API_BASE}/${encodeURIComponent(sku)}/calidad?marketplace=${encodeURIComponent(marketplaceKey)}`;
                const t = pickToken(token);
                const r = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(t ? { Authorization: `Bearer ${t}` } : {}),
                    },
                    cache: "no-store",
                });
                const json = await r.json().catch(() => ({}));
                if (!r.ok) {
                    const err = new Error(
                        json?.message || `HTTP ${r.status} ${r.statusText}`,
                    ) as EditorApiError;
                    err.status = r.status;
                    err.code = json?.code;
                    throw err;
                }
                return json as EditorCalidad;
            },

            fetchAuditLog: async (
                sku: string,
                opts: { limit?: number; includePayload?: boolean } = {},
            ) => {
                const qs = new URLSearchParams({
                    marketplace: marketplaceKey,
                    limit: String(opts.limit ?? 100),
                });
                if (opts.includePayload) qs.set("includePayload", "1");
                const url = `${API_BASE}/${encodeURIComponent(sku)}/audit?${qs.toString()}`;
                const t = pickToken(token);
                const r = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(t ? { Authorization: `Bearer ${t}` } : {}),
                    },
                    cache: "no-store",
                });
                const json = await r.json().catch(() => ({}));
                if (!r.ok) {
                    const err = new Error(
                        json?.message || `HTTP ${r.status} ${r.statusText}`,
                    ) as EditorApiError;
                    err.status = r.status;
                    err.code = json?.code;
                    throw err;
                }
                // backend: { ok, data: [...] }
                const rows = Array.isArray(json?.data)
                    ? json.data
                    : Array.isArray(json)
                      ? json
                      : [];
                return rows as EditorAuditEntry[];
            },

            fetchPublicaciones: async (sku: string) => {
                const url = `${CANALES_ML}/${encodeURIComponent(sku)}/publicaciones`;
                const t = pickToken(token);
                const r = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(t ? { Authorization: `Bearer ${t}` } : {}),
                    },
                    cache: "no-store",
                });
                const json = await r.json().catch(() => ({}));
                if (!r.ok) {
                    const err = new Error(
                        json?.message || `HTTP ${r.status} ${r.statusText}`,
                    ) as EditorApiError;
                    err.status = r.status;
                    err.code = json?.code;
                    throw err;
                }
                // Envelope 3a: { ok, channel, sku, publications:[...] }
                return Array.isArray(json?.publications)
                    ? (json.publications as EditorPublicacion[])
                    : [];
            },

            uploadImage: async (file: File) => {
                const fd = new FormData();
                fd.append("file", file);
                if (userId) fd.append("uploadedBy", String(userId));
                if (userName) fd.append("userName", userName);
                if (userEmail) fd.append("userEmail", userEmail);
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 30000);
                try {
                    const t = pickToken(token);
                    const r = await fetch(IMG_UPLOAD_URL, {
                        method: "POST",
                        signal: ctrl.signal,
                        body: fd, // sin Content-Type → browser pone el boundary
                        headers: t ? { Authorization: `Bearer ${t}` } : {},
                    });
                    clearTimeout(timer);
                    const json = await r.json().catch(() => ({}));
                    if (!r.ok) {
                        throw new Error(
                            json?.message || `HTTP ${r.status} al subir imagen`,
                        );
                    }
                    return (json?.data ?? json) as EditorImageUploadResult;
                } finally {
                    clearTimeout(timer);
                }
            },

            diagnosticarImagen: async ({
                pictureId,
                pictureUrl,
                categoryId,
                title,
                pictureType,
            }) => {
                // "unknown" = no se pudo validar (no es un error que bloquee).
                const fallback: ImageDiagnostic = {
                    ok: false,
                    action: "unknown",
                    detections: [],
                };
                try {
                    const t = pickToken(token);
                    const r = await fetch(
                        `${URL_PIM_SERVICE}/api/pim/ml/imagenes/diagnostico`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(t ? { Authorization: `Bearer ${t}` } : {}),
                            },
                            body: JSON.stringify({
                                pictureId,
                                pictureUrl,
                                categoryId,
                                title,
                                pictureType,
                            }),
                        },
                    );
                    if (!r.ok) return fallback;
                    const json = await r.json().catch(() => null);
                    const data = (json?.data ?? json) as ImageDiagnostic | null;
                    return data ?? fallback;
                } catch {
                    return fallback; // no bloquear el flujo de imágenes
                }
            },

            saveProduct: async (
                sku: string,
                patch: EditorSavePatch,
                opts: { idempotencyKey?: string } = {},
            ) => {
                const url = `${API_BASE}/${encodeURIComponent(sku)}`;
                const idemKey = opts.idempotencyKey ?? genIdempotencyKey();
                const t = pickToken(token);
                // Patrón del proyecto (ver `features/picking/...PickerNuevoView.tsx`):
                // el front envía `{ userId, userName, userEmail }` para que el
                // backend escriba logs de auditoría con nombre legible sin tener
                // que hacer JOIN a `Perfiles`. El backend valida que coincida
                // con el JWT antes de confiar en estos campos.
                const bodyWithUser = userId
                    ? { ...patch, userId, userName, userEmail }
                    : patch;
                const r = await fetch(url, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Idempotency-Key": idemKey,
                        ...(t ? { Authorization: `Bearer ${t}` } : {}),
                    },
                    body: JSON.stringify(bodyWithUser),
                });
                const json = await r.json().catch(() => ({}));
                if (!r.ok) {
                    const err = new Error(
                        json?.message || `HTTP ${r.status}`,
                    ) as EditorApiError;
                    err.status = r.status;
                    err.code = json?.code;
                    err.your_version = json?.your_version;
                    err.current_version = json?.current_version;
                    err.current_value = json?.current_value;
                    err.atributos_bloqueados = json?.atributos_bloqueados;
                    throw err;
                }
                return (json?.data ?? json) as EditorSaveResult;
            },
        }),
        [marketplaceKey, token, userId, userName, userEmail],
    );
}
