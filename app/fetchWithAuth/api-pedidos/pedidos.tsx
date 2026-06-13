// app\fetchWithAuth\api-pedidos\pedidos.tsx

import { BASE_OMS } from "@/lib/http/endpoints";

type IssueView =
    | "historial"
    | "resumen,historial"
    | "items,historial"
    | "facturacion,historial"
    | "envios";


const X_PLATAFORMA_ID = "1";

async function fetchIssueView<T>(token: string, orderId: number, view: IssueView): Promise<T> {

    const url = `${BASE_OMS}/orders/${orderId}/issue-summary?view=${view}`;

    const r = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-plataforma-id": X_PLATAFORMA_ID,
        },
    });

    if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`${r.status} ${text || r.statusText}`);
    }

    return r.json() as Promise<T>;
}

export function fetchIssueResumen<T>(token: string, orderId: number): Promise<T> {
    return fetchIssueView<T>(token, orderId, "resumen,historial");
}

export function fetchIssueItems<T>(token: string, orderId: number): Promise<T> {
    return fetchIssueView<T>(token, orderId, "items,historial");
}

export function fetchIssueFacturacion<T>(token: string, orderId: number): Promise<T> {
    return fetchIssueView<T>(token, orderId, "facturacion,historial");
}

export function fetchIssueHistorial<T>(token: string, orderId: number): Promise<T> {
    return fetchIssueView<T>(token, orderId, "historial");
}

export function fetchIssueEnvios<T>(token: string, orderId: number): Promise<T> {
    return fetchIssueView<T>(token, orderId, "envios");
}

export async function fetchIssueResumenFull<T>(
    token: string,
    orderId: number
): Promise<T> {
    const url = `${BASE_OMS}/orders/${orderId}/issue-summary`;

    const r = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-plataforma-id": X_PLATAFORMA_ID,
        },
    });

    if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(`${r.status} ${text || r.statusText}`);
    }

    return r.json() as Promise<T>;
}
