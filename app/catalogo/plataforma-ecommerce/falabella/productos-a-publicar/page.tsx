// app/catalogo/plataforma-ecommerce/falabella/productos-a-publicar/page.tsx
//
// Monta la MISMA bandeja compartida `ProductosAPublicarView` (vía alias Fala*).
// `accountId` hardcoded como 2 (igual que falabella/carga-masiva) hasta el
// selector de cuentas real. La vista resuelve el marketplace desde el contexto
// de plataforma del layout falabella.

import { FalaProductosAPublicarView } from "@/features/catalogo/pages/plataforma-ecommerce/falabella/productos-a-publicar";

const ACCOUNT_ID_FALA = 2;

export default function FalaProductosAPublicarPage() {
    return <FalaProductosAPublicarView accountId={ACCOUNT_ID_FALA} />;
}
