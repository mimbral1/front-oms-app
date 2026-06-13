// lib/bulk-image-match.ts
//
// Matcher puro nombre-de-archivo → SKU para la carga masiva de imágenes.
// El nombre debe EMPEZAR con un SKU de la lista (match por el SKU más largo, con
// separador no-alfanumérico o fin tras el SKU) y los DÍGITOS SIGUIENTES = orden
// (la #1 = portada). Sin React ni I/O. es5-safe (sin for...of/spread sobre Set/Map).

/** Mínimo que el matcher necesita de cada archivo (un File real lo cumple). */
export interface MatchFile {
  name: string;
}

export interface MatchedItem<F extends MatchFile> {
  file: F;
  order: number;
}
export interface MatchedGroup<F extends MatchFile> {
  sku: string;
  items: MatchedItem<F>[]; // ordenados por `order` asc (desempate por nombre)
}
export interface UnmatchedFile<F extends MatchFile> {
  file: F;
  reason: string;
}
export interface MatchResult<F extends MatchFile> {
  matched: MatchedGroup<F>[];
  unmatched: UnmatchedFile<F>[];
}

/** Nombre sin la última extensión (`a.b.jpg` → `a.b`). */
export function baseName(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

/** True si el carácter NO es [A-Za-z0-9] (sirve como límite de SKU). */
function isBoundaryChar(ch: string): boolean {
  return !/[A-Za-z0-9]/.test(ch);
}

/**
 * SKU más largo de `skus` tal que `base === sku` o `base` empieza con `sku`
 * seguido de un carácter límite (no alfanumérico). Devuelve null si ninguno.
 * El orden por longitud desc evita que `0520` gane sobre `052032066`.
 *
 * Comparación CASE-INSENSITIVE (los nombres de archivo suelen venir en
 * minúsculas, p. ej. `bosch-gbm10re_1.jpg` para el SKU `BOSCH-GBM10RE`); se
 * devuelve igualmente el SKU CANÓNICO de la lista (no la versión del archivo),
 * para que el agrupado y el guardado usen el SKU real. `toLowerCase` preserva la
 * longitud, así que los índices/slices siguen siendo válidos.
 */
export function findSkuPrefix(base: string, skusByLenDesc: string[]): string | null {
  const lower = base.toLowerCase();
  for (let i = 0; i < skusByLenDesc.length; i++) {
    const sku = skusByLenDesc[i];
    if (!sku) continue;
    const sl = sku.toLowerCase();
    if (lower === sl) return sku;
    if (lower.length > sl.length && lower.slice(0, sl.length) === sl && isBoundaryChar(lower.charAt(sl.length))) {
      return sku;
    }
  }
  return null;
}

/** Primer entero en `s` (`-1.jpg`→1, `_03`→3); null si no hay dígitos. */
export function firstInt(s: string): number | null {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

const ORDER_SENTINEL = 1e9; // sin orden detectable → al final

/**
 * Asocia cada archivo a un SKU por nombre. Agrupa por SKU y ordena cada grupo
 * por `order` asc (desempate por nombre). Los que no calzan van a `unmatched`.
 */
export function matchFilesToSkus<F extends MatchFile>(files: F[], skus: string[]): MatchResult<F> {
  const skusByLenDesc = skus.slice().sort((a, b) => b.length - a.length);
  const skuSet: Record<string, boolean> = {};
  for (let i = 0; i < skus.length; i++) skuSet[skus[i]] = true;

  const groupsBySku: Record<string, MatchedItem<F>[]> = {};
  const order: string[] = []; // orden de aparición de los SKU para salida estable
  const unmatched: UnmatchedFile<F>[] = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const base = baseName(f.name);
    const sku = findSkuPrefix(base, skusByLenDesc);
    if (!sku) {
      // Heurística de mensaje: si empieza con dígitos, probablemente quiso un SKU.
      const lead = base.match(/^\d{3,}/);
      const reason = lead && !skuSet[lead[0]]
        ? `El SKU ${lead[0]} no está en la lista.`
        : "No empieza con un SKU de la lista.";
      unmatched.push({ file: f, reason });
      continue;
    }
    const rest = base.slice(sku.length);
    const ord = firstInt(rest);
    if (!groupsBySku[sku]) {
      groupsBySku[sku] = [];
      order.push(sku);
    }
    groupsBySku[sku].push({ file: f, order: ord == null ? ORDER_SENTINEL : ord });
  }

  const matched: MatchedGroup<F>[] = order.map((sku) => {
    const items = groupsBySku[sku].slice().sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.file.name.localeCompare(b.file.name);
    });
    return { sku, items };
  });

  return { matched, unmatched };
}
