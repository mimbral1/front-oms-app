// app/catalogo/plataforma-ecommerce/mercadolibre/publicar/page.tsx

import { Suspense } from "react";
import { MeliPublicarWizardView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/publicar";

// El wizard usa `useSearchParams()` (Client Component hook) → Next 15 exige
// que la ruta no se prerenderice estática. Toda la app está gateada por
// middleware con cookie de auth, así que el SSG no aporta nada acá.

export default function MeliPublicarPage() {
    return (
        <Suspense fallback={null}>
            <MeliPublicarWizardView channel="ml" />
        </Suspense>
    );
}
