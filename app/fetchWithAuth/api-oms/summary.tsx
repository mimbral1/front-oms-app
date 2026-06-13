import type { IssueSummaryResponse } from "@/features/pedidos/types/resumen-pedidos";
import { BASE_OMS } from "@/lib/http/endpoints";

export async function fetchIssueSummary(orderId: number, init?: RequestInit) {
    const url = `${BASE_OMS}/orders/${orderId}/issue-summary`;
    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`IssueSummary ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as IssueSummaryResponse;
}
