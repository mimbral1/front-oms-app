// Legacy (pre-Janis).
export {
    MeliMapeoCategoriasBrowse as FalabellaMapeoCategoriasBrowse,
    MeliMapeoCategoriasDetail as FalabellaMapeoCategoriasDetail,
} from "../../mercadolibre/mapeo-categorias";

export type {
    MeliCategoryMapping as FalabellaCategoryMapping,
    StoreCategory as FalabellaStoreCategory,
    MeliCategoryOption as FalabellaCategoryOption,
} from "../../mercadolibre/mapeo-categorias";

// Nueva view Janis (Fase 4 del MIGRATION_PLAN).
export { MapeoCategoriasView as FalaMapeoCategoriasView } from "../../shared/mapeo-categorias/base";
export type {
    CategoriaNodo as FalaCategoriaNodo,
    MapeoCategoria as FalaMapeoCategoria,
} from "../../shared/mapeo-categorias/base";
