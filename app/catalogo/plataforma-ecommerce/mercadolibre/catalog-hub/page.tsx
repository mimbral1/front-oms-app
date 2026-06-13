// app/catalogo/plataforma-ecommerce/mercadolibre/catalog-hub/page.tsx
// Catalog Hub · Pieza A — lista de Flujos de Trabajo (ML). accountId hardcoded (TBD selector).
import { MeliFlujosView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/catalog-hub";

const ACCOUNT_ID_ML = 1;

export default function MeliCatalogHubPage() {
  return <MeliFlujosView accountId={ACCOUNT_ID_ML} />;
}
