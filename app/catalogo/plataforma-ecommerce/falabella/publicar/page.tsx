// app/catalogo/plataforma-ecommerce/falabella/publicar/page.tsx

import { Suspense } from "react";
import { FalaPublicarWizardView } from "@/features/catalogo/pages/plataforma-ecommerce/falabella/publicar";

// El wizard usa `useSearchParams()` (Client Component hook) → Next 15 exige
// que la ruta no se prerenderice estática. Toda la app está gateada por
// middleware con cookie de auth, así que el SSG no aporta nada acá.

export default function FalaPublicarPage() {
    return (
        <Suspense fallback={null}>
            <FalaPublicarWizardView channel="fala" />
        </Suspense>
    );
}
