// app/catalogo/plataforma-ecommerce/mercadolibre/calculadora-margen/page.tsx

import { Suspense } from "react";
import { MeliCalculadoraMargenView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/publicar";

// El view usa `useSearchParams()` (Client Component hook) → Next 15 exige
// que la ruta no se prerenderice estática. Toda la app está gateada por
// middleware con cookie de auth, así que el SSG no aporta nada acá.

export default function MeliCalculadoraMargenPage() {
    return (
        <Suspense fallback={null}>
            <MeliCalculadoraMargenView mode="standalone" />
        </Suspense>
    );
}
