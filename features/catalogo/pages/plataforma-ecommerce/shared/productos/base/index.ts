// MarketplaceProductosBrowse eliminado — usar CatalogoView (en shared/catalogo)
// como nueva source-of-truth para listar productos.
export { MarketplaceProductosDetail } from "./views/MarketplaceProductosDetail";
export { MarketplaceProductosAtributos } from "./views/MarketplaceProductosAtributos";
export { MarketplaceProductosAtributosSection } from "@/features/catalogo/components/plataforma-ecommerce/shared/productos/base/MarketplaceProductosAtributosSection";
export { useMarketplaceProductoDetailData } from "./hooks/useMarketplaceProductoDetailData";
export { resolveMarketplaceKey } from "./utils/marketplace";

export type { MarketplaceProduct, MarketplaceProductsAPIResponse } from "./types/list-types";
export type {
    CampoBasico as MarketplaceCampoBasico,
    ProductoAtributo as MarketplaceProductoAtributo,
    ProductDetail as MarketplaceProductDetail,
} from "./types/detail-types";
