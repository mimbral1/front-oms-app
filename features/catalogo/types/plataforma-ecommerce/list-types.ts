// features/catalogo/pages/plataforma-ecommerce/shared/productos/base/types/list-types.ts

export interface CategoriaMarketplace {
    id: string;
}

export interface SapInfo {
    n3_id: string;
    n3_nombre: string;
    n2_nombre: string;
    n1_nombre: string;
}

export interface MapeoInfo {
    categoria_id: string;
    categoria_nombre: string;
    confianza: number;
    validado: boolean;
}

export interface MarketplaceProduct {
    item_id: string;
    sku: string;
    seller_sku?: string;
    titulo: string;
    url_producto: string;
    precio: number;
    stock: number;
    estado: string;
    imagenes: string[];
    categoria_marketplace: CategoriaMarketplace | null;
    sap: SapInfo | null;
    mapeo: MapeoInfo | null;
    coincide: boolean | null;
}

export interface MarketplaceProductsAPIResponse {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    marketplace: string;
    fromCache: boolean;
    data: MarketplaceProduct[];
}
