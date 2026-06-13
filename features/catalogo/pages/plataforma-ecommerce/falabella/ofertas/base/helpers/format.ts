// Helpers de formato para campañas Falabella.

export function fmtFecha(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function fmtClp(value: number | null | undefined): string {
    if (value == null) return "—";
    return `$${Math.round(value).toLocaleString("es-CL")}`;
}
