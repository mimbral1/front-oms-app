// app\fetchWithAuth\api-orders\movements.tsx

const BASE_MOVEMENTS = process.env.NEXT_PUBLIC_BASE_MOVEMENTS_API;

/* ---------- Tipos ---------- */
export interface MovementRow {
    MovementId: string;
    Fecha: string;
    Type: string;
    Sku: string;
    FromWh: string | null;
    ToWh: string | null;
    Quantity: number;
    Reference: string;
    Status: string | null;
}

export interface MovementsResponse {
    rows: MovementRow[];
}

/* ---------- Listado ---------- */
export async function getMovements(): Promise<MovementsResponse> {
    const url = `${BASE_MOVEMENTS}/inventory-docs`;

    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo obtener el listado de traslados"}`
        );
    }

    const data = (await res.json()) as MovementsResponse;
    if (!data || !Array.isArray(data.rows)) return { rows: [] };
    return data;
}
