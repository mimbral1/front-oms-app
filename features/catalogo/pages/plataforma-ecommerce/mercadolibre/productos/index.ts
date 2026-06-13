// Alias específicos para MercadoLibre. Browse eliminado — usar Catálogo.
export {
    MarketplaceProductosDetail,
    MarketplaceProductosAtributos,
    MarketplaceProductosAtributosSection,
    useMarketplaceProductoDetailData,
    resolveMarketplaceKey,
} from "../../shared/productos";

export type {
    MarketplaceProduct,
    MarketplaceProductsAPIResponse,
    MarketplaceCampoBasico,
    MarketplaceProductoAtributo,
    MarketplaceProductDetail,
} from "../../shared/productos";

export { MarketplaceProductosDetail as MeliProductosDetail } from "../../shared/productos";
export { MarketplaceProductosAtributos as MeliProductosAtributos } from "../../shared/productos";
export { MarketplaceProductosAtributosSection as MeliProductosAtributosSection } from "../../shared/productos";
export { useMarketplaceProductoDetailData as useMeliProductoDetailData } from "../../shared/productos";

export type { MarketplaceProduct as MeliProduct, MarketplaceProductsAPIResponse as MeliProductsAPIResponse } from "../../shared/productos";
export type {
    MarketplaceCampoBasico as CampoBasico,
    MarketplaceProductoAtributo as ProductoAtributo,
    MarketplaceProductDetail as ProductDetail,
} from "../../shared/productos";
