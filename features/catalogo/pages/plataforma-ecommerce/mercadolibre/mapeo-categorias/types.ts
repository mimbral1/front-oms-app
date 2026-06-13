// features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-categorias/types.ts

/** Categoria de la tienda (catalogo PIM) */
export interface StoreCategory {
    id: string;
    name: string;
    parentId: string | null;
    level: number;
    children?: StoreCategory[];
}

/** Opcion de categoria de MercadoLibre para el selector */
export interface MeliCategoryOption {
    id: string;
    path: string;
}

/** Mapeo guardado entre una categoria de la tienda y una de MeLi */
export interface MeliCategoryMapping {
    storeCategoryId: string;
    meliCategoryId: string;
    meliCategoryPath: string;
    apiId?: number | string;  // ID del registro en la API para update/delete
}

// -- API types ------------------------------------------------------------------

export interface APICategoryItem {
    name: string;
    reference: string;
    nameTree: string;
    date_modified: string | null;
    user_modified: string | null;
    status: string;
}

export interface APICategoryResponse {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    data: APICategoryItem[];
}

// -- Build tree from flat API data ----------------------------------------------

export function buildCategoryTreeFromAPI(items: APICategoryItem[]): StoreCategory[] {
    const itemByPath = new Map<string, APICategoryItem>();
    items.forEach((item) => itemByPath.set(item.nameTree, item));

    const nodeByPath = new Map<string, StoreCategory>();

    // Collect all unique paths (including intermediate parents)
    const allPaths = new Set<string>();
    for (const item of items) {
        const segments = item.nameTree.split(" > ");
        for (let i = 1; i <= segments.length; i++) {
            allPaths.add(segments.slice(0, i).join(" > "));
        }
    }

    // Sort by depth so parents are created before children
    const sortedPaths = Array.from(allPaths).sort((a, b) => {
        const dA = a.split(" > ").length;
        const dB = b.split(" > ").length;
        return dA - dB || a.localeCompare(b);
    });

    const roots: StoreCategory[] = [];
    const usedIds = new Set<string>();

    for (const path of sortedPaths) {
        const segments = path.split(" > ");
        const level = segments.length - 1;
        const name = segments[segments.length - 1];
        const apiItem = itemByPath.get(path);

        let id = apiItem?.reference || path;
        // Ensure unique IDs — if reference is duplicated across paths, append suffix
        if (usedIds.has(id)) {
            id = `${id}__${path}`;
        }
        usedIds.add(id);

        const node: StoreCategory = {
            id,
            name,
            parentId: null,
            level,
            children: [],
        };

        nodeByPath.set(path, node);

        if (level === 0) {
            roots.push(node);
        } else {
            const parentPath = segments.slice(0, -1).join(" > ");
            const parent = nodeByPath.get(parentPath);
            if (parent) {
                node.parentId = parent.id;
                if (!parent.children) parent.children = [];
                parent.children.push(node);
            }
        }
    }

    return roots;
}

// (Las categorías de MercadoLibre se obtienen desde /api/meli-categories)

// -- Tipos de producto (sub-mapeo por categoría) --------------------------------

/** Mapeo de un tipo de producto de la tienda a una categoría de MeLi */
export interface TipoMapping {
    id: string;         // ID de la categoría MeLi (e.g., "MLC163593")
    nombre: string;     // Nombre de la categoría MeLi (e.g., "Martillos Demoledores")
    confianza: number;  // Score de confianza 0..1
    validado: boolean;  // Si fue revisado/aprobado manualmente
}

/** Detalle completo del mapeo de una categoría de la tienda */
export interface CategoryMappingDetail {
    mapeado: boolean;
    categoria: {
        id: string;     // ID de categoría MeLi padre
        nombre: string; // Ruta / nombre completo MeLi
    };
    tipos: Record<string, TipoMapping>;   // key = nombre del tipo en la tienda
}

/** Categoría de la tienda con sus tipos de producto */
export interface StoreCategoryWithTipos {
    id: number | string;
    nombre: string;
    tipos: { nombre: string }[];
}

// -- API types para categorías y mapeos (192.168.0.42:5050) ---------------------

/** Nodo del árbol de categorías — puede tener subcategorias o tipos (hoja) */
export interface CategoriaNode {
    id: number;
    nombre: string;
    subcategorias?: CategoriaNode[];
    tipos?: { nombre: string }[];
}

/** Respuesta de /api/categorias */
export interface CategoriasAPIResponse {
    success: boolean;
    categorias: CategoriaNode[];
}

/** Entrada individual del mapeo vista por marketplace */
export interface MapeoVistaEntry {
    mercadolibre: {
        mapeado: boolean;
        categoria: { id: string; nombre: string };
        tipos: Record<string, TipoMapping>;
    };
}

/** Respuesta de /api/mapeos/vista?marketplace=mercadolibre */
export interface MapeoVistaAPIResponse {
    success: boolean;
    marketplaces: string[];
    data: Record<string, MapeoVistaEntry>;
}

// ── Flat row for rendering the tree in a table ─────────────────────────────────

export interface FlatCategoryRow {
    id: string;           // stringified id
    nombre: string;
    level: number;        // depth for indentation
    hasChildren: boolean; // has subcategorias
    isTipo: boolean;      // is a tipo (leaf under a leaf category)
    parentCatId?: string; // if isTipo, the parent category id that owns the mapping
    tiposCount: number;   // number of tipos (only relevant for leaf categories)
}
