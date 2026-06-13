// features/catalogo/pages/plataforma-ecommerce/shared/catalogo/base/index.ts

export { CatalogoView } from "./views/CatalogoView";

export { useCatalogoList, computeQualityDetail } from "./hooks/useCatalogoList";
export type {
    UseCatalogoListReturn,
    QualityDetail,
    QualityLevel,
} from "./hooks/useCatalogoList";

export { useCatalogoApi, mapPlatformToMarketplace } from "./api/catalogo-api";
export type { UseCatalogoApi } from "./api/catalogo-api";

export type {
    CatalogoListFilters,
    CatalogoStatusFilter,
    CatalogoViewMode,
    ReputationLevel,
    MarketplaceProduct,
    MarketplaceProductsAPIResponse,
} from "./types/catalogo-types";
