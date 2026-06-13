// features/catalogo/pages/plataforma-ecommerce/vtex/atributos/index.ts
//
// Re-exports del shared con alias `Vtex*`.

export {
    AtributosListView as VtexAtributosListView,
    AtributosDetailView as VtexAtributosDetailView,
} from "../../shared/atributos/base";

export type {
    Atributo as VtexAtributo,
    AtributoDetailTab as VtexAtributoDetailTab,
    AtributosListFilters as VtexAtributosListFilters,
    MapeoAtributo as VtexMapeoAtributoBackend,
} from "../../shared/atributos/base";
