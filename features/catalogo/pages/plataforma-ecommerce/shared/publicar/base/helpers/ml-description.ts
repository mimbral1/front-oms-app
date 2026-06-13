// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/helpers/ml-description.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// publicar/mlDescription.ts`.
//
// Saneo + validación de descripción ML (espejo del backend en
// `MeliCatalog-service/src/utils/mlPublishPayload.js:sanitizeDescriptionPlainText`).
//
// ML rechaza HTML tags y emojis en la descripción con error 400 cause_id 398
// (`item.description.type.invalid`). Validamos client-side para que el seller
// vea el problema antes de mandar y pueda limpiarlo con un click.
//
// El backend igualmente sanitiza (defensa en profundidad) — esta validación
// es UX, no security.

const HTML_RE = /<[^>]*>/g;
// Mismas ranges que el backend. Cubre la mayor parte de emoji estándar:
//   U+1F000-U+1FFFF (multi-block: misc symbols, supplemental, extended-A)
//   U+2600-U+27BF  (dingbats / misc symbols 1)
const EMOJI_RE = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu;

export interface DescriptionIssue {
    readonly kind: "html" | "emoji";
    /** Match exacto del problema (ej. `<br>`, `😀`). */
    readonly match: string;
    /** Posición 0-indexed en el texto original. */
    readonly index: number;
}

/**
 * Detecta problemas (HTML / emojis). No modifica el texto.
 * Devuelve array vacío si está OK.
 */
export function findMlDescriptionIssues(text: string): DescriptionIssue[] {
    if (!text) return [];
    const issues: DescriptionIssue[] = [];
    // Usamos Array.from() en vez de for..of sobre matchAll() — TS target ES5
    // por default no soporta iteradores de RegExpMatchArray.
    Array.from(text.matchAll(HTML_RE)).forEach((m) => {
        issues.push({ kind: "html", match: m[0], index: m.index ?? 0 });
    });
    Array.from(text.matchAll(EMOJI_RE)).forEach((m) => {
        issues.push({ kind: "emoji", match: m[0], index: m.index ?? 0 });
    });
    // Ordenar por posición — útil para reportar el primero.
    issues.sort((a, b) => a.index - b.index);
    return issues;
}

/**
 * Sanitiza idénticamente al backend. Mantener en sync con
 * `sanitizeDescriptionPlainText` en `mlPublishPayload.js` — si cambia uno,
 * cambiar el otro o eventualmente sacarlos a un paquete compartido.
 */
export function cleanMlDescription(raw: string): string {
    if (raw == null) return "";
    return String(raw)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(HTML_RE, "")
        .replace(EMOJI_RE, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
