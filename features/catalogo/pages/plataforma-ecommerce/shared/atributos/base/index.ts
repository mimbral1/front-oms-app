// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/index.ts
//
// Barrel del módulo `shared/atributos/base/`. Las features por marketplace
// (`mercadolibre/atributos/index.ts`, etc.) re-exportan estas piezas con alias.

// Vistas top-level
export { AtributosListView } from "./views/AtributosListView";
export { AtributosDetailView } from "./views/AtributosDetailView";
export type { AtributosDetailViewProps } from "./views/AtributosDetailView";

// Hooks (export por si una feature quiere componer su propio chrome)
export { useAtributosList } from "./hooks/useAtributosList";
export type { UseAtributosListReturn } from "./hooks/useAtributosList";

export { useAtributo } from "./hooks/useAtributo";
export type { UseAtributoReturn } from "./hooks/useAtributo";

// API (export para custom hooks)
export { useAtributosApi } from "./api/atributos-api";
export type { UseAtributosApi } from "./api/atributos-api";

// Tipos del dominio
export type {
    Atributo,
    AtributoNivelHerencia,
    AtributoTipoDato,
    AtributosListFilters,
    AtributosListResponse,
    AtributoUpdatePayload,
    AtributoDetailTab,
    AtributoComment,
    AtributoLogEntry,
    MarketplaceAtributo,
    MarketplaceChannel,
    MapeoAtributo,
    MapeoAtributoUpsertPayload,
} from "./types/atributo-types";
