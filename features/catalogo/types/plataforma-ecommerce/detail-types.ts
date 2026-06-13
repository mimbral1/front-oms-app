export interface CampoBasico {
    valor: string | number | boolean | null;
    editable: boolean;
    tipo: "text" | "number" | "textarea" | "badge" | "boolean" | string;
    razon?: string;
    advertencia?: string;
}

export interface ProductoAtributo {
    id: string;
    nombre: string;
    valor: string | number | boolean | string[] | null;
    editable: boolean;
    requerido: boolean;
    faltante: boolean;
    tipo: "text" | "number" | "boolean" | "select" | string;
    opciones?: string[] | null;
    prioridad?: string;
    fill_priority?: number;
    es_variante?: boolean;
    multivaluado?: boolean;
}

export interface ProductDetail {
    sku: string;
    marketplace: string;
    item_id: string;
    url_producto?: string;
    seller_sku?: string;
    seller_custom_field?: string;
    campos_basicos: Record<string, CampoBasico>;
    atributos?: ProductoAtributo[];
    imagenes?: {
        lista?: string[];
        total?: number;
        maximo?: number;
        minimo_recomendado?: number;
        advertencia?: string;
    };
    meta?: {
        last_updated?: string;
        tiene_ventas?: boolean;
        sold_quantity?: number;
        health?: number;
        category_id?: string;
    };
}
