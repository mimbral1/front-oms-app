// app/catalogo/plataforma-ecommerce/mercadolibre/ofertas/nueva/page.tsx
//
// Wizard de creación de nueva oferta. Acepta query params para pre-rellenar
// desde una invitación ML: `?from=invitation&inviteId=X&type=Y&name=Z`.

import { Suspense } from "react";
import { MeliNuevaOfertaWizardView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas";

// El wizard usa `useSearchParams()` (lee `?from=invitation&inviteId=...`) → Next 15
// exige que la ruta no se prerenderice estática. Toda la app está gateada por
// middleware con cookie de auth, así que el SSG no aporta nada acá.

export default function MeliNuevaOfertaPage() {
    return (
        <Suspense fallback={null}>
            <MeliNuevaOfertaWizardView />
        </Suspense>
    );
}
