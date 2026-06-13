// app/catalogo/plataforma-ecommerce/mercadolibre/carga-masiva/page.tsx
//
// Landing del panel de carga masiva = LISTA de lotes (ya no abre en "subir").
// El wizard de subir un lote nuevo vive en `/carga-masiva/nueva`; el detalle de
// un lote en `/carga-masiva/[batchId]`.
//
// `accountId` hardcoded como 1 mientras no haya selector de cuentas real (TBD V2).

import { MeliBatchListView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/carga-masiva";

const ACCOUNT_ID_ML = 1;

export default function MeliCargaMasivaPage() {
    return <MeliBatchListView accountId={ACCOUNT_ID_ML} />;
}
