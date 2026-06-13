// MarketplaceProductosBrowse eliminado — usar CatalogoView desde
// `shared/catalogo`. Este barrel solo expone Detail/Atributos hasta su
// reemplazo por /editor/[sku] (Fase 7).
export {
    MarketplaceProductosDetail,
    MarketplaceProductosAtributos,
    MarketplaceProductosAtributosSection,
    useMarketplaceProductoDetailData,
    resolveMarketplaceKey,
} from "./base";

export type {
    MarketplaceProduct,
    MarketplaceProductsAPIResponse,
    MarketplaceCampoBasico,
    MarketplaceProductoAtributo,
    MarketplaceProductDetail,
} from "./base";
