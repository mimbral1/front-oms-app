// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/index.ts

// Vistas top-level
export { OfertasListView } from "./views/OfertasListView";
export { OfertasDetailView } from "./views/OfertasDetailView";
export type { OfertasDetailViewProps } from "./views/OfertasDetailView";
export { NuevaOfertaWizardView } from "./views/NuevaOfertaWizardView";
export { ElegibilidadView } from "./views/ElegibilidadView";

// Hooks
export { useOfertasList } from "./hooks/useOfertasList";
export type { UseOfertasListReturn } from "./hooks/useOfertasList";

export { useOferta } from "./hooks/useOferta";
export type { UseOfertaReturn } from "./hooks/useOferta";

// API
export {
    useOfertasApi,
    OfertasApiError,
    ApiError,
    getItemRange,
} from "./api/ofertas-api";
export type {
    UseOfertasApi,
    CreateCampaignBody,
    OptInItemBody,
    RetryResult,
    LoadOfertasResult,
    RawPromotionItem,
} from "./api/ofertas-api";

// Helpers
export {
    humanizeApiError,
} from "./helpers/error-map";
export {
    validateCampaignDraft,
    validateEnrollItem,
} from "./helpers/validations";
export type {
    EnrollContext,
    EnrollItemInput,
    ValidationError,
} from "./helpers/validations";
export {
    priceFromDiscount,
    discountFromPrice,
    topDealMinExtra,
} from "./helpers/pricing";
export {
    fmtCLP,
    fmtDate,
    fmtDateLong,
    daysBetween,
    addDays,
    today,
} from "./helpers/format";
export {
    statusOf,
    STATUS_LABEL,
    TYPE_LABEL,
    TYPE_COLOR,
} from "./helpers/status";
export type { TypeChipColor } from "./helpers/status";

// Data cache
export {
    primeCatalogCache,
    addToCatalogCache,
    getCachedCatalog,
    getCatalogByItemId,
    getCatalogBySku,
} from "./data/loader";

// Tipos
export type {
    Campaign,
    CampaignDraft,
    CampaignSku,
    CampaignStatus,
    CatalogSku,
    Channel,
    EnrollItem,
    EnrollPayload,
    MLAvailable,
    MLErrorCode,
    MLFailedInvitation,
    MLPromotionType,
    MlItemRange,
    OfertaDetailTab,
    OfertasState,
    OfertasTab,
    Reputation,
} from "./types/oferta-types";

export { asDate, daysLeft } from "./types/oferta-types";
