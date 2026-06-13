// features/catalogo/pages/plataforma-ecommerce/mercadolibre/atributos/index.ts
//
// Re-exports del módulo shared/atributos/base con alias `Meli*` para que
// las rutas Next puedan importar `MeliAtributosListView` sin acoplarse al
// path interno de shared. Patrón canónico — replicar para Falabella y VTEX.

export {
    AtributosListView as MeliAtributosListView,
    AtributosDetailView as MeliAtributosDetailView,
} from "../../shared/atributos/base";

export type {
    Atributo as MeliAtributo,
    AtributoDetailTab as MeliAtributoDetailTab,
    AtributosListFilters as MeliAtributosListFilters,
    MapeoAtributo as MeliMapeoAtributoBackend,
} from "../../shared/atributos/base";
