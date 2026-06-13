// lib/http/client.ts
// Cliente HTTP centralizado con autenticación.

"use client";

import { useAuth } from "@/app/context/auth/AuthContext";
import { useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import {
    URL_BASE,
    URL_BASE_QA,
    URL_INVENTORY,
    URL_INVENTORY_STOCK,
    URL_DELIVERY_SERVICE,
    URL_TMS_SERVICE,
    URL_PIM_SERVICE,
} from "@/lib/http/endpoints";

// ── helpers internos ──────────────────────────────────────────

const X_PLATAFORMA_ID = 1;

function resolveUrl(base: string | undefined, url: string): string {
    const trimmed = (url || "").trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const safeBase = `${base ?? ""}`.replace(/\/$/, "");
    const safePath = trimmed.replace(/^\//, "");
    return `${safeBase}/${safePath}`;
}

function getImmediateToken(ctxToken: string | null): string {
    if (ctxToken) return ctxToken;
    try {
        const ls = JSON.parse(localStorage.getItem("authState") || "{}");
        if (ls?.token) return String(ls.token);
    } catch { /* vacío */ }
    return Cookies.get("authToken") || "";
}

function buildHeaders(token: string, extra?: HeadersInit): HeadersInit {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-plataforma-id": String(X_PLATAFORMA_ID),
        ...(extra || {}),
    };
}

function handleUnauthorized(status: number) {
    if (status === 401) {
        try { window.dispatchEvent(new CustomEvent("auth:expired")); } catch { /* vacío */ }
    }
}

async function handleErrorResponse(response: Response): Promise<never> {
    let payload: any = null;
    try { payload = await response.clone().json(); }
    catch { try { payload = await response.text(); } catch { /* vacío */ } }

    const msg =
        (payload && typeof payload === "object" &&
            (payload.message || payload.error || payload.detail || payload?.data?.message)) ||
        (typeof payload === "string" && payload) ||
        `HTTP ${response.status}`;

    const error: any = new Error(msg);
    error.status = response.status;
    error.payload = payload;
    throw error;
}

// ── standalone fetch helpers (sin auth) ───────────────────────

/** Generic JSON fetcher — no auth headers, for public / internal APIs */
export async function fetchJson<T = any>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    if (!response.ok) await handleErrorResponse(response);
    // body vacío → null; evita "Unexpected end of JSON input".
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
}

// ── hooks públicos ────────────────────────────────────────────

export function useFetchWithAuth() {
    const { token } = useAuth();

    const fetchWithAuth = useCallback(
        async function <T = any>(url: string, options: RequestInit = {}): Promise<T> {
            const UrlFinal = resolveUrl(URL_BASE, url);
            const t = getImmediateToken(token);
            if (!t) throw new Error("No token available");

            const response = await fetch(UrlFinal, {
                ...options,
                headers: buildHeaders(t, options.headers as Record<string, string>),
            });

            handleUnauthorized(response.status);
            if (!response.ok) await handleErrorResponse(response);
            // body vacío (204 / 200 sin cuerpo) → null; evita "Unexpected end of JSON input".
            const text = await response.text();
            return (text ? JSON.parse(text) : null) as T;
        },
        [token],
    );

    return { fetchWithAuth, token };
}

// ── Pim-service (módulos de marketplace) ─────────────────────────────────
//
// Llama al pim-service que sirve las features de Plataforma de ecommerce
// (publicar, editar, ofertas, calculadora, etc.).
//
// DEV local: URL_PIM_SERVICE = http://localhost:5050 (apunta directo al
//            container del pim-service, sin pasar por gateway).
// PROD:      URL_PIM_SERVICE = http://api-gateway/api/pim
//            (cuando esté registrado en gateway services.js).
//
// pim-service hace `decodeUser` del JWT (sin verify) y popula req.user. Eso
// significa que cualquier token decodificable pasa en dev — la seguridad real
// viene del gateway en prod. En DEV es OK: red interna.
export function useFetchWithAuthPim() {
    const { token } = useAuth();

    const fetchWithAuthPim = useCallback(
        async function <T = any>(url: string, options: RequestInit = {}): Promise<T> {
            const base = URL_PIM_SERVICE || "";
            // url puede venir con o sin slash inicial — normalizamos.
            const cleanPath = url.startsWith("/") ? url.slice(1) : url;
            const UrlFinal = `${base.replace(/\/+$/, "")}/${cleanPath}`;
            const t = getImmediateToken(token);
            // pim-service no exige token (decodeUser es best-effort), pero si lo
            // tenemos lo mandamos para que req.user quede populado en el back.
            const headers = t
                ? buildHeaders(t, options.headers as Record<string, string>)
                : {
                      "Content-Type": "application/json",
                      "x-plataforma-id": "1",
                      ...(options.headers || {}),
                  };

            const response = await fetch(UrlFinal, { ...options, headers });

            handleUnauthorized(response.status);
            if (!response.ok) await handleErrorResponse(response);
            // Tolerar body vacío (204 / 200 sin cuerpo): response.json() revienta
            // con "Unexpected end of JSON input". Parseamos solo si hay texto.
            const text = await response.text();
            return (text ? JSON.parse(text) : null) as T;
        },
        [token],
    );

    return { fetchWithAuthPim, token };
}

export function useFetchWithAuthDelivery() {
    const { token } = useAuth();

    const fetchWithAuthDelivery = useCallback(
        async function <T = any>(url: string, options: RequestInit = {}): Promise<T> {
            const UrlFinal = resolveUrl(URL_DELIVERY_SERVICE, url);
            const t = getImmediateToken(token);
            if (!t) throw new Error("No token available");

            const response = await fetch(UrlFinal, {
                ...options,
                headers: buildHeaders(t, options.headers as Record<string, string>),
            });

            handleUnauthorized(response.status);
            if (!response.ok) await handleErrorResponse(response);
            // body vacío (204 / 200 sin cuerpo) → null; evita "Unexpected end of JSON input".
            const text = await response.text();
            return (text ? JSON.parse(text) : null) as T;
        },
        [token],
    );

    return { fetchWithAuthDelivery, token };
}

export function useFetchWithAuthTms() {
    const { token } = useAuth();

    const fetchWithAuthTms = useCallback(
        async function <T = any>(url: string, options: RequestInit = {}): Promise<T> {
            const UrlFinal = resolveUrl(URL_TMS_SERVICE, url);
            const t = getImmediateToken(token);
            if (!t) throw new Error("No token available");

            const response = await fetch(UrlFinal, {
                ...options,
                headers: buildHeaders(t, options.headers as Record<string, string>),
            });

            handleUnauthorized(response.status);
            if (!response.ok) await handleErrorResponse(response);
            // body vacío (204 / 200 sin cuerpo) → null; evita "Unexpected end of JSON input".
            const text = await response.text();
            return (text ? JSON.parse(text) : null) as T;
        },
        [token],
    );

    return { fetchWithAuthTms, token };
}

export function useFetchWithAuthInventory() {
    const { token } = useAuth();

    const fetchWithAuthInventory = useCallback(
        async function <T = any>(url: string, options: RequestInit = {}): Promise<T> {
            const UrlFinal = resolveUrl(URL_INVENTORY, url);
            const t = getImmediateToken(token);
            if (!t) throw new Error("No token available");

            const response = await fetch(UrlFinal, {
                ...options,
                headers: buildHeaders(t, options.headers as Record<string, string>),
            });

            handleUnauthorized(response.status);
            if (!response.ok) await handleErrorResponse(response);
            // body vacío (204 / 200 sin cuerpo) → null; evita "Unexpected end of JSON input".
            const text = await response.text();
            return (text ? JSON.parse(text) : null) as T;
        },
        [token],
    );

    const fetchWithAuthInventoryStock = useCallback(
        async function <T = any>(url: string, options: RequestInit = {}): Promise<T> {
            const UrlFinal = resolveUrl(URL_INVENTORY_STOCK, url);
            const t = getImmediateToken(token);
            if (!t) throw new Error("No token available");

            const response = await fetch(UrlFinal, {
                ...options,
                headers: buildHeaders(t, options.headers as Record<string, string>),
            });

            handleUnauthorized(response.status);
            if (!response.ok) await handleErrorResponse(response);
            // body vacío (204 / 200 sin cuerpo) → null; evita "Unexpected end of JSON input".
            const text = await response.text();
            return (text ? JSON.parse(text) : null) as T;
        },
        [token],
    );

    return { fetchWithAuthInventory, fetchWithAuthInventoryStock, token };
}

// ── helpers sin hook (para AuthContext, etc.) ──────────────────

export async function fetchWithAuthToken<T = any>(
    token: string | null,
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const UrlFinal = resolveUrl(URL_BASE, url);
    const response = await fetch(UrlFinal, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
            "x-plataforma-id": String(X_PLATAFORMA_ID),
            ...(options.headers || {}),
        },
    });

    handleUnauthorized(response.status);
    if (!response.ok) await handleErrorResponse(response);
    // body vacío → null; evita "Unexpected end of JSON input".
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
}

export async function fetchWithAuthSinToken<T = any>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const UrlFinal = resolveUrl(URL_BASE, url);

    const response = await fetch(UrlFinal, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "x-plataforma-id": String(X_PLATAFORMA_ID),
            ...(options.headers || {}),
        },
    });

    handleUnauthorized(response.status);

    let payload: any = null;
    try { payload = await response.clone().json(); }
    catch { try { payload = await response.text(); } catch { /* vacío */ } }

    if (!response.ok) await handleErrorResponse(response);

    if (payload && typeof payload === "object") return payload as T;
    return (payload ?? null) as T;
}

// ── OMS service ───────────────────────────────────────────────

export function useOmsService() {
    const { fetchWithAuth } = useFetchWithAuth();

    type OrdersSummaryResponse = {
        total: number;
        page: number;
        pageSize: number;
        sortBy?: string;
        sortDir?: "ASC" | "DESC";
        data: any[];
    };

    const listOrders = useCallback(
        async (params?: { page?: number; pageSize?: number }) => {
            const q = new URLSearchParams();
            if (params?.page) q.set("page", String(params.page));
            if (params?.pageSize) q.set("pageSize", String(params.pageSize));
            const qs = q.toString();
            const url = `oms-service/orders/summary${qs ? `?${qs}` : ""}`;
            return fetchWithAuth<OrdersSummaryResponse>(url, { method: "GET" });
        },
        [fetchWithAuth],
    );

    return useMemo(() => ({ listOrders }), [listOrders]);
}

// ── QA variant ────────────────────────────────────────────────

export function useFetchWithAuthQA() {
    const { token } = useAuth();

    const fetchWithAuthQA = useCallback(
        async function <T = any>(url: string, options: RequestInit = {}): Promise<T> {
            const isAbsoluteUrl = /^https?:\/\//i.test(url);
            const UrlFinal = isAbsoluteUrl ? url : `${URL_BASE_QA}/${url}`;
            const t = getImmediateToken(token);
            if (!t) throw new Error("No token available");

            const response = await fetch(UrlFinal, {
                ...options,
                headers: buildHeaders(t, options.headers as Record<string, string>),
            });

            handleUnauthorized(response.status);
            if (!response.ok) await handleErrorResponse(response);
            // body vacío (204 / 200 sin cuerpo) → null; evita "Unexpected end of JSON input".
            const text = await response.text();
            return (text ? JSON.parse(text) : null) as T;
        },
        [token],
    );

    return { fetchWithAuthQA, token };
}
