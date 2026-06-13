// utils/fecha.ts
/** Recibe "yyyy-mm-dd" o "dd/mm/yyyy" (con o sin hora) y devuelve SOLO la fecha (sin hora).
 *  Esto se usa para los filtros "Creado desde" / "Creado hasta" de /orders/summary.
 */
export function normalizeDateParam(input?: string, _asEnd: boolean = false): string | undefined {
    if (!input) return undefined;
    const s = input.trim();
    if (s === "") return undefined;

    // Si viene "dd/mm/yyyy HH:mm:ss" o "yyyy-mm-dd HH:mm:ss", nos quedamos solo con la fecha
    const [datePart] = s.replace("T", " ").split(" ");

    return datePart;
}