// features/catalogo/pages/plataforma-ecommerce/shared/mapeo-categorias/base/index.ts

export { MapeoCategoriasView } from "./views/MapeoCategoriasView";

export { useCategoriasTree } from "./hooks/useCategoriasTree";
export type { UseCategoriasTreeReturn } from "./hooks/useCategoriasTree";

export { useMapeoCategoriasApi } from "./api/mapeo-categorias-api";
export type { UseMapeoCategoriasApi } from "./api/mapeo-categorias-api";

export type {
    CategoriaNodo,
    CategoriaLevel,
    CategoriasArbolResponse,
    MapeoCategoria,
} from "./types/mapeo-categorias-types";
