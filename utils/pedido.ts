/** Extrae el ID numérico del último bloque de dígitos del parámetro de ruta. */
export function extractOrderId(param?: string): number | null {
    if (!param) return null;
    const blocks = param.match(/\d+/g);
    if (!blocks || !blocks.length) return null;
    const id = Number(blocks[blocks.length - 1]);
    return Number.isFinite(id) ? id : null;
}
