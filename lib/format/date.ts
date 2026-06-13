// lib/format/date.ts
// Funciones de formateo de fecha/hora reutilizables.
//
// 2026-05-20 — Fix Item 1 auditoría: el backend guarda timestamps en UTC
// (`SYSUTCDATETIME()`). Cuando los devuelve sin sufijo TZ explícito (ej.
// `"2026-05-20 14:16:39.910"` o `"2026-05-20T14:16:39.910"` sin `Z`), `new
// Date(value)` los interpreta como hora LOCAL del navegador en algunos
// browsers, lo que daba diferencia visual fantasma de ~4h. Ahora todos los
// helpers normalizan a UTC y renderizan en `America/Santiago` por defecto.

const DEFAULT_TIMEZONE = "America/Santiago"; // Chile continental
const DEFAULT_LOCALE = "es-CL";

/**
 * Parsea un valor a Date asumiendo UTC cuando el string no tiene sufijo TZ.
 *
 * Acepta:
 *   • Date — se devuelve tal cual.
 *   • number — interpretado como epoch ms.
 *   • string ISO con TZ (`"2026-05-20T14:16:39.910Z"` o `"+00:00"`) — respeta TZ.
 *   • string ISO sin TZ (`"2026-05-20T14:16:39.910"`) — se asume UTC.
 *   • string SQL Server (`"2026-05-20 14:16:39.910"`) — se convierte a ISO y se asume UTC.
 *
 * Esto es seguro porque el backend siempre guarda en UTC. Si en el futuro
 * el backend cambia a local, hay que ajustar acá.
 */
function parseToDate(value: string | Date | number | null | undefined): Date | null {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "number") {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "string") {
        // Si ya tiene TZ explícita (Z u offset ±HH:MM), confiar en el parser nativo.
        const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
        if (hasTz) {
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? null : d;
        }
        // Sin TZ: normalizar separador SQL Server (espacio) → ISO (T) y agregar Z.
        // Ej. "2026-05-20 14:16:39.910" → "2026-05-20T14:16:39.910Z"
        const normalized = value.includes("T") ? `${value}Z` : `${value.replace(" ", "T")}Z`;
        const d = new Date(normalized);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

/**
 * Formatea un valor fecha/hora a texto, con i18n y soporte de fallback.
 *
 * Por defecto convierte UTC → `America/Santiago` (hora Chile) y locale `es-CL`.
 * Pasar `timeZone: undefined` explícito si querés usar la TZ del navegador.
 */
export function formatDateTime(
    value: string | Date | number | null | undefined,
    {
        locale = DEFAULT_LOCALE,
        timeZone = DEFAULT_TIMEZONE,
    }: { locale?: string; timeZone?: string } = {}
): { date: string; time: string; parts: readonly [string, string] } {
    const date = parseToDate(value);
    if (!date) {
        if (value === null || value === undefined) {
            return { date: "Sin datos", time: "", parts: ["Sin datos", ""] as const };
        }
        return {
            date: "Fecha no válida",
            time: "",
            parts: ["Fecha no válida", ""] as const,
        };
    }

    const optsDate: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone,
    };

    const optsTime: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone,
    };

    const formattedDate = date.toLocaleDateString(locale, optsDate);
    const formattedTime = date.toLocaleTimeString(locale, optsTime);

    return {
        date: formattedDate,
        time: formattedTime,
        parts: [formattedDate, formattedTime] as const,
    };
}

/**
 * Shorthand: formats an ISO string (or Date) into "DD-MM-YYYY HH:mm:ss" Chile.
 * Returns "-" for null/undefined/invalid inputs.
 */
export function fmtDateTime(
    value: string | Date | number | null | undefined
): string {
    if (value === null || value === undefined || value === "-" || value === "") return "-";
    const result = formatDateTime(value);
    if (result.date === "Sin datos" || result.date === "Fecha no válida") return "-";
    return result.time ? `${result.date} ${result.time}` : result.date;
}

/**
 * Formatea solo la hora Chile (sin fecha). Útil para logs en línea.
 * Ej. "2026-05-20T14:16:39.910Z" → "10:16:39"
 */
export function fmtTimeCL(
    value: string | Date | number | null | undefined
): string {
    if (value === null || value === undefined || value === "") return "-";
    const date = parseToDate(value);
    if (!date) return "-";
    return date.toLocaleTimeString(DEFAULT_LOCALE, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: DEFAULT_TIMEZONE,
    });
}

/**
 * Formatea solo la fecha Chile. Ej. "20-05-2026".
 */
export function fmtDateCL(
    value: string | Date | number | null | undefined
): string {
    if (value === null || value === undefined || value === "") return "-";
    const date = parseToDate(value);
    if (!date) return "-";
    return date.toLocaleDateString(DEFAULT_LOCALE, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: DEFAULT_TIMEZONE,
    });
}

/**
 * "Hace X" relativo a ahora — útil para listados de logs / eventos.
 * Ej. "hace 2 minutos", "hace 3 horas", "hace 5 días".
 */
export function fmtRelativeCL(
    value: string | Date | number | null | undefined
): string {
    const date = parseToDate(value);
    if (!date) return "-";
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "hace un momento";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return diffMin === 1 ? "hace 1 minuto" : `hace ${diffMin} minutos`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return diffH === 1 ? "hace 1 hora" : `hace ${diffH} horas`;
    const diffDays = Math.floor(diffH / 24);
    if (diffDays < 30) return diffDays === 1 ? "hace 1 día" : `hace ${diffDays} días`;
    // Más de 30 días: cae a fecha absoluta.
    return fmtDateCL(value);
}

/**
 * Combines separate date and time strings into a single formatted string.
 * Useful for APIs that return date and time in separate fields.
 */
export function fmtDateTimeParts(
    date: string | null | undefined,
    time?: string | null
): string {
    if (!date) return "-";
    const timePart = time ? ` ${time}` : "";
    return `${date}${timePart}`;
}

/** Parsea "DD/MM/YYYY HH:mm:ss" a Date (tolerante con espacios). */
export function parseDayFirstDateTime(s?: string | null): Date {
    try {
        if (!s) return new Date(0);
        const [dmy, hmsPart] = s.trim().split(" ");
        const [dd, mm, yyyy] = (dmy || "").split("/").map(Number);
        let hh = 0, mi = 0, ss = 0;
        if (hmsPart) {
            const [h, m, s2] = hmsPart.replace(/[^\d:]/g, "").split(":").map(Number);
            hh = h || 0; mi = m || 0; ss = s2 || 0;
        }
        return new Date(yyyy || 0, (mm || 1) - 1, dd || 1, hh, mi, ss);
    } catch {
        return new Date(0);
    }
}
