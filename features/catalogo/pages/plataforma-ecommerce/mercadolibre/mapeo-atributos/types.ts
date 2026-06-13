// features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-atributos/types.ts

/** Categoria del catalogo (PIM) con sus atributos heredados */
export interface StoreCategory {
    id: string;
    name: string;
    parentId: string | null;
    level: number;
    children?: StoreCategory[];
    attributes: StoreAttribute[];
}

/** Atributo del catalogo de la tienda (PIM) */
export interface StoreAttribute {
    id: string;
    name: string;
    type: "string" | "number" | "list" | "boolean";
    categoryId: string;
    categoryName: string;
    apiId?: string | number;
}

/** Opcion de atributo de MercadoLibre para el selector */
export interface MeliAttributeOption {
    id: string;
    name: string;
    valueType: "string" | "number" | "list" | "boolean";
    required: boolean;
    categoryId: string;
}

/** Mapeo guardado entre un atributo de la tienda y uno de MeLi */
export interface MeliAttributeMapping {
    storeAttributeId: string;
    meliAttributeId: string;
    meliAttributeName: string;
    meliRequired: boolean;
    apiId?: string | number;
    n3Id?: string | number;
    validado?: boolean;
}

// Re-export API types from mapeo-categorias for shared usage
export type {
    APICategoryItem,
    APICategoryResponse,
} from "../mapeo-categorias/types";

import type { APICategoryItem } from "../mapeo-categorias/types";

// ── Build category tree with empty attributes from flat API data ───────────────

export function buildCategoryTreeWithAttrsFromAPI(items: APICategoryItem[]): StoreCategory[] {
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

    for (const path of sortedPaths) {
        const segments = path.split(" > ");
        const level = segments.length - 1;
        const name = segments[segments.length - 1];
        const apiItem = itemByPath.get(path);

        const node: StoreCategory = {
            id: apiItem?.reference || path,
            name,
            parentId: null,
            level,
            children: [],
            attributes: [], // attributes will come from a future API
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

// -- Flag para usar datos mock en desarrollo --
export const USE_MOCKS = false;

// -- Atributos de la tienda (mock) --
export const MOCK_STORE_ATTRIBUTES: StoreAttribute[] = [
    { id: "marca", name: "Marca", type: "string", categoryId: "*", categoryName: "General" },
    { id: "modelo", name: "Modelo", type: "string", categoryId: "*", categoryName: "General" },
    { id: "potencia", name: "Potencia", type: "string", categoryId: "MLC5991", categoryName: "Herramientas" },
    { id: "voltaje", name: "Voltaje", type: "list", categoryId: "MLC5991", categoryName: "Herramientas" },
    { id: "velocidad_rpm", name: "Velocidad RPM", type: "number", categoryId: "MLC5991", categoryName: "Herramientas" },
    { id: "disco_mm", name: "Diámetro de disco (mm)", type: "number", categoryId: "MLC6370", categoryName: "Herramientas" },
    { id: "color", name: "Color", type: "list", categoryId: "*", categoryName: "General" },
    { id: "tamano_pantalla", name: "Tamaño de Pantalla", type: "string", categoryId: "MLC1002", categoryName: "Televisores" },
    { id: "resolucion", name: "Resolución", type: "list", categoryId: "MLC1002", categoryName: "Televisores" },
    { id: "almacenamiento", name: "Almacenamiento", type: "list", categoryId: "MLC1055", categoryName: "Celulares" },
    { id: "memoria_ram", name: "Memoria RAM", type: "list", categoryId: "*", categoryName: "General" },
    { id: "capacidad_litros", name: "Capacidad (litros)", type: "string", categoryId: "MLC1576", categoryName: "Electrohogar" },
    { id: "capacidad_btu", name: "Capacidad BTU", type: "string", categoryId: "MLC1645", categoryName: "Climatización" },
];

// -- Atributos de MercadoLibre disponibles (mock) --
export const MOCK_MELI_ATTRIBUTES: MeliAttributeOption[] = [
    { id: "BRAND", name: "Marca", valueType: "string", required: true, categoryId: "*" },
    { id: "MODEL", name: "Modelo", valueType: "string", required: true, categoryId: "*" },
    { id: "POWER", name: "Potencia", valueType: "string", required: false, categoryId: "MLC5991" },
    { id: "VOLTAGE", name: "Voltaje", valueType: "list", required: false, categoryId: "MLC5991" },
    { id: "MAIN_COLOR", name: "Color Principal", valueType: "list", required: true, categoryId: "*" },
    { id: "MATERIAL", name: "Material", valueType: "string", required: false, categoryId: "*" },
    { id: "WEIGHT", name: "Peso", valueType: "number", required: false, categoryId: "*" },
    { id: "SCREEN_SIZE", name: "Tamaño de Pantalla", valueType: "string", required: true, categoryId: "MLC1002" },
    { id: "RESOLUTION", name: "Resolución", valueType: "list", required: true, categoryId: "MLC1002" },
    { id: "DISPLAY_TECHNOLOGY", name: "Tecnología de Pantalla", valueType: "list", required: false, categoryId: "MLC1002" },
    { id: "INTERNAL_MEMORY", name: "Memoria Interna", valueType: "list", required: true, categoryId: "MLC1055" },
    { id: "RAM", name: "Memoria RAM", valueType: "list", required: true, categoryId: "*" },
    { id: "PROCESSOR_MODEL", name: "Modelo del Procesador", valueType: "string", required: true, categoryId: "MLC1652" },
    { id: "CAPACITY", name: "Capacidad", valueType: "string", required: true, categoryId: "MLC1576" },
    { id: "ENERGY_EFFICIENCY", name: "Eficiencia Energética", valueType: "list", required: false, categoryId: "*" },
    { id: "COOLING_CAPACITY", name: "Capacidad de Enfriamiento (BTU)", valueType: "string", required: true, categoryId: "MLC1645" },
    { id: "WARRANTY_TYPE", name: "Tipo de Garantía", valueType: "list", required: false, categoryId: "*" },
    { id: "LENGTH", name: "Largo", valueType: "number", required: false, categoryId: "*" },
    { id: "WIDTH", name: "Ancho", valueType: "number", required: false, categoryId: "*" },
    { id: "HEIGHT", name: "Alto", valueType: "number", required: false, categoryId: "*" },
    { id: "RPM", name: "Velocidad RPM", valueType: "number", required: false, categoryId: "MLC5991" },
    { id: "DISC_DIAMETER", name: "Diámetro de Disco", valueType: "number", required: false, categoryId: "MLC6370" },
    { id: "STORAGE_CAPACITY", name: "Capacidad de Almacenamiento", valueType: "list", required: true, categoryId: "MLC1055" },
];

// -- Mapeos ya guardados (mock) --
export const MOCK_SAVED_ATTR_MAPPINGS: MeliAttributeMapping[] = [
    { storeAttributeId: "marca", meliAttributeId: "BRAND", meliAttributeName: "Marca", meliRequired: true },
    { storeAttributeId: "modelo", meliAttributeId: "MODEL", meliAttributeName: "Modelo", meliRequired: true },
    { storeAttributeId: "potencia", meliAttributeId: "POWER", meliAttributeName: "Potencia", meliRequired: false },
    { storeAttributeId: "voltaje", meliAttributeId: "VOLTAGE", meliAttributeName: "Voltaje", meliRequired: false },
    { storeAttributeId: "velocidad_rpm", meliAttributeId: "RPM", meliAttributeName: "Velocidad RPM", meliRequired: false },
    { storeAttributeId: "disco_mm", meliAttributeId: "DISC_DIAMETER", meliAttributeName: "Diámetro de Disco", meliRequired: false },
    { storeAttributeId: "color", meliAttributeId: "MAIN_COLOR", meliAttributeName: "Color Principal", meliRequired: true },
    { storeAttributeId: "tamano_pantalla", meliAttributeId: "SCREEN_SIZE", meliAttributeName: "Tamaño de Pantalla", meliRequired: true },
    { storeAttributeId: "resolucion", meliAttributeId: "RESOLUTION", meliAttributeName: "Resolución", meliRequired: true },
    { storeAttributeId: "almacenamiento", meliAttributeId: "INTERNAL_MEMORY", meliAttributeName: "Memoria Interna", meliRequired: true },
    { storeAttributeId: "memoria_ram", meliAttributeId: "RAM", meliAttributeName: "Memoria RAM", meliRequired: true },
    { storeAttributeId: "capacidad_litros", meliAttributeId: "CAPACITY", meliAttributeName: "Capacidad", meliRequired: true },
    { storeAttributeId: "capacidad_btu", meliAttributeId: "COOLING_CAPACITY", meliAttributeName: "Capacidad de Enfriamiento (BTU)", meliRequired: true },
];
