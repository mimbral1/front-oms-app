// Boundary público del feature de Campañas de ofertas Falabella.
// (Falabella no usa la base compartida de ofertas ML: el backend es distinto —
// precio especial por SKU vs. seller-promotions de ML.)

export { CampanasListView as FalaOfertasListView } from "./base/views/CampanasListView";
export { CampanaDetailView as FalaOfertaDetailView } from "./base/views/CampanaDetailView";
export { useCampanasApi } from "./base/api/campanas-api";
export * from "./base/types/campana-types";
