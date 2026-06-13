// app/catalogo/plataforma-ecommerce/mercadolibre/productos-a-publicar/page.tsx
//
// `accountId` hardcoded como 1 (igual que carga-masiva) hasta selector de
// cuentas real. TBD V2: prop dinámica desde `EcommercePlatformConfig`.

import { MeliProductosAPublicarView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/productos-a-publicar";

const ACCOUNT_ID_ML = 1;

export default function MeliProductosAPublicarPage() {
    return <MeliProductosAPublicarView accountId={ACCOUNT_ID_ML} />;
}
