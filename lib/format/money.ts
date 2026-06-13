// lib/format/money.ts
// Funciones de formateo de moneda reutilizables.

export const clp = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
});

export function formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return "—";
    const n = typeof value === "string" ? parseInt(value, 10) : value;
    if (isNaN(n)) return "—";
    return clp.format(n);
}
