// Legacy (pre-Janis).
export {
    MeliMapeoCategoriasBrowse as VtexMapeoCategoriasBrowse,
    MeliMapeoCategoriasDetail as VtexMapeoCategoriasDetail,
} from "../../mercadolibre/mapeo-categorias";

export type {
    MeliCategoryMapping as VtexCategoryMapping,
    StoreCategory as VtexStoreCategory,
    MeliCategoryOption as VtexCategoryOption,
} from "../../mercadolibre/mapeo-categorias";

// Nueva view Janis (Fase 4 del MIGRATION_PLAN).
export { MapeoCategoriasView as VtexMapeoCategoriasView } from "../../shared/mapeo-categorias/base";
export type {
    CategoriaNodo as VtexCategoriaNodo,
    MapeoCategoria as VtexMapeoCategoria,
} from "../../shared/mapeo-categorias/base";
