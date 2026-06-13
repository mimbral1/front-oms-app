// app/catalogo/plataforma-ecommerce/mercadolibre/carga-masiva/nueva/page.tsx
//
// Wizard de subir un lote nuevo (CARGAR ARCHIVO → PROCESAR → REVISAR). Se llega
// desde el botón "Nueva carga masiva" de la lista de lotes.

import { MeliCargaMasivaView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/carga-masiva";

const ACCOUNT_ID_ML = 1;

export default function MeliCargaMasivaNuevaPage() {
    return <MeliCargaMasivaView accountId={ACCOUNT_ID_ML} />;
}
