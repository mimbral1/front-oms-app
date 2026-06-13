// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/index.ts
//
// Re-exports de la feature Ofertas (exclusiva ML — Falabella tiene API distinta,
// VTEX maneja todo desde su admin). Aliases `Meli*` para consistencia con el
// resto del subárbol.

export {
    OfertasListView as MeliOfertasListView,
    OfertasDetailView as MeliOfertasDetailView,
    NuevaOfertaWizardView as MeliNuevaOfertaWizardView,
    ElegibilidadView as MeliElegibilidadView,
} from "./base";

export type {
    Campaign as MeliCampaign,
    CampaignSku as MeliCampaignSku,
    MLPromotionType as MeliPromotionType,
    OfertasDetailViewProps as MeliOfertasDetailViewProps,
} from "./base";
