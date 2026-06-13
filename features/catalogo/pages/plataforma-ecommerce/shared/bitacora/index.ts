// features/catalogo/pages/plataforma-ecommerce/shared/bitacora/index.ts
//
// Bitácora de publicación Falabella — boundary del módulo compartido.
// Reutilizado por: wizard de publicar, detalle del producto y dashboard.

export { BitacoraTimeline } from "./base/components/BitacoraTimeline";
export { PublishActivityWidget } from "./base/components/PublishActivityWidget";
export { useBitacora } from "./base/hooks/useBitacora";
export { usePublishActivity } from "./base/hooks/usePublishActivity";
export { useBitacoraApi } from "./base/api/bitacora-api";
export type {
    BitacoraEntry,
    BitacoraEventType,
    PublishActivity,
} from "./base/types/bitacora-types";
