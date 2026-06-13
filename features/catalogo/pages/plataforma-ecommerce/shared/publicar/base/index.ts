// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/index.ts

// Vistas top-level
export { PublicarWizardView } from "./views/PublicarWizardView";
export type { PublicarWizardViewProps } from "./views/PublicarWizardView";

export { CalculadoraMargenView } from "./views/CalculadoraMargenView";
export type { CalculadoraMargenViewProps } from "./views/CalculadoraMargenView";

// Hooks
export { usePublicarWizard } from "./hooks/usePublicarWizard";
export type {
    UsePublicarWizardReturn,
    UsePublicarWizardOptions,
} from "./hooks/usePublicarWizard";

// API
export { usePublicarApi } from "./api/publicar-api";
export type { UsePublicarApi } from "./api/publicar-api";

// Helpers
export { computeCoverage } from "./helpers/coverage";

// Types
export type {
    CoverageSummary,
    ItemCondition,
    MarketplaceCategory,
    ProductoSap,
    PublicarAttribute,
    PublicarChannel,
    PublicarResult,
    PublicarState,
    PublicarStepId,
    UploadedImage,
} from "./types/publicar-types";
