// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/format.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// ofertas/helpers/format.ts`. Helpers de formato puros (CLP, fechas, deltas).

export function fmtCLP(n: number | null | undefined): string {
    if (n == null || isNaN(n)) return "—";
    return "$" + Math.round(n).toLocaleString("es-CL");
}

export function today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

export function fmtDate(d: Date | string | null | undefined): string {
    if (!d) return "—";
    const x = d instanceof Date ? d : new Date(d);
    return x.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

/** Variante "long" usada en el wizard ("15 de mayo, 2026"). */
export function fmtDateLong(d: Date | string | null | undefined): string {
    if (!d) return "—";
    const x = d instanceof Date ? d : new Date(d);
    return x.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export function daysBetween(
    a: Date | string | null | undefined,
    b: Date | string | null | undefined,
): number {
    if (!a || !b) return 0;
    const A = a instanceof Date ? a : new Date(a);
    const B = b instanceof Date ? b : new Date(b);
    return Math.round((B.getTime() - A.getTime()) / 86400000);
}

export function addDays(d: Date | string, n: number): Date {
    const x = d instanceof Date ? new Date(d) : new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
