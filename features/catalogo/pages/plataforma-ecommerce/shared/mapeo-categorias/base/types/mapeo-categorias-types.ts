// features/catalogo/pages/plataforma-ecommerce/shared/mapeo-categorias/base/types/mapeo-categorias-types.ts
//
// Tipos del dominio Mapeo de categorías. Backend canónico:
//   GET    /api/pim/categorias/arbol      → árbol completo N1/N2/N3
//   GET    /api/pim/categorias/:id/mapeos → mapeos de una N3
//   POST   /api/pim/categorias/:id/mapeos → crear mapeo
//   PUT    /api/pim/categorias/:id/mapeos → editar
//   DELETE /api/pim/categorias/:id/mapeos → quitar
//   GET    /api/pim/categorias/buscar?q=  → búsqueda
//
// NOTA: el shape de algunos endpoints (`/mapeos`, `/buscar`) varía según el
// estado del backend. Estos tipos son best-effort — si en runtime el shape
// difiere, ampliamos.

/** Nivel del árbol (1 = N1 raíz, 2 = N2, 3 = N3 hoja). */
export type CategoriaLevel = 1 | 2 | 3;

/** Nodo del árbol (recursivo). */
export interface CategoriaNodo {
    id: number | string;
    nombre: string;
    /** Sólo en N3: id de la categoría marketplace mapeada (si existe). */
    mapeado?: string | null;
    /** Counts (solo N1/N2). */
    count?: number;
    /** Subcategorías. En N3, es []. */
    subcategorias?: CategoriaNodo[];
}

/** Response de `GET /api/pim/categorias/arbol`. */
export interface CategoriasArbolResponse {
    data?: CategoriaNodo[];
    categorias?: CategoriaNodo[];
}

/** Mapeo categoría Mimbral → categoría marketplace. */
export interface MapeoCategoria {
    id?: number;
    n3_id: number | string;
    marketplace_categoria_id: string;
    marketplace_categoria_nombre?: string;
    /** Confianza estimada [0..1] o [0..100]. */
    confianza?: number;
    validado?: boolean;
    /** Si es mapeo "secundario" (por marca). */
    marca?: string | null;
    /** Cantidad de SKUs vinculados (denormalizado). */
    skus_count?: number;
    /** ISO timestamp del último update. */
    updated_at?: string;
    /** Nombre del usuario que hizo el último cambio. */
    updated_by_name?: string;
    updated_by_email?: string;
}
