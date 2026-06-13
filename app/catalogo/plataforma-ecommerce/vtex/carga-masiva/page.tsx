// app/catalogo/plataforma-ecommerce/vtex/carga-masiva/page.tsx

import { VtexCargaMasivaView } from "@/features/catalogo/pages/plataforma-ecommerce/vtex/carga-masiva";

const ACCOUNT_ID_VTEX = 3;

export default function VtexCargaMasivaPage() {
    return <VtexCargaMasivaView accountId={ACCOUNT_ID_VTEX} />;
}
