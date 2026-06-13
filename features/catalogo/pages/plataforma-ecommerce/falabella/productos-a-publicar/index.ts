// features/catalogo/pages/plataforma-ecommerce/falabella/productos-a-publicar/index.ts
//
// Re-export del shared con alias Fala* (mirror de mercadolibre/productos-a-publicar).
// La vista es la MISMA `ProductosAPublicarView` compartida; resuelve el
// marketplace desde el contexto de plataforma (layout falabella) — no se
// duplica lógica.

export { ProductosAPublicarView as FalaProductosAPublicarView } from "../../shared/carga-masiva/base";
export type { ProductosAPublicarViewProps as FalaProductosAPublicarViewProps } from "../../shared/carga-masiva/base";
