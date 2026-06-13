// features/catalogo/pages/plataforma-ecommerce/falabella/atributos/index.ts
//
// Re-exports del shared con alias `Fala*`.

export {
    AtributosListView as FalaAtributosListView,
    AtributosDetailView as FalaAtributosDetailView,
} from "../../shared/atributos/base";

export type {
    Atributo as FalaAtributo,
    AtributoDetailTab as FalaAtributoDetailTab,
    AtributosListFilters as FalaAtributosListFilters,
    MapeoAtributo as FalaMapeoAtributoBackend,
} from "../../shared/atributos/base";
