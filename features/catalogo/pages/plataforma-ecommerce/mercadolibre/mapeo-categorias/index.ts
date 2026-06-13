// Legacy (pre-Janis). Sigue exportado para no romper imports externos hasta
// que se elimine en Fase 9.
export { MeliMapeoCategoriasBrowse } from "./MeliMapeoCategoriasBrowse";
export { MeliMapeoCategoriasDetail } from "./MeliMapeoCategoriasDetail";
export type { MeliCategoryMapping, StoreCategory, MeliCategoryOption } from "./types";

// Nueva view Janis (Fase 4 del MIGRATION_PLAN). El page.tsx la monta como
// default. La legacy queda accesible via `MeliMapeoCategoriasBrowse` para
// rollback rápido si hace falta.
export { MapeoCategoriasView as MeliMapeoCategoriasView } from "../../shared/mapeo-categorias/base";
export type {
    CategoriaNodo as MeliCategoriaNodo,
    MapeoCategoria as MeliMapeoCategoria,
} from "../../shared/mapeo-categorias/base";
