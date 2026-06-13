// features/catalogo/pages/plataforma-ecommerce/mercadolibre/carga-masiva/index.ts
//
// Re-exports del shared con alias `Meli*`.

export { CargaMasivaView as MeliCargaMasivaView } from "../../shared/carga-masiva/base";
export { BatchListView as MeliBatchListView } from "../../shared/carga-masiva/base";
export { BatchDetailView as MeliBatchDetailView } from "../../shared/carga-masiva/base";
export type {
    CargaMasivaViewProps as MeliCargaMasivaViewProps,
    BatchListViewProps as MeliBatchListViewProps,
    BatchDetailViewProps as MeliBatchDetailViewProps,
    BatchSummary as MeliBatchSummary,
    BulkRow as MeliBulkRow,
} from "../../shared/carga-masiva/base";
