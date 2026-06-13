// app/catalogo/plataforma-ecommerce/falabella/calculadora-margen/page.tsx

import { Suspense } from "react";
import { FalaCalculadoraMargenView } from "@/features/catalogo/pages/plataforma-ecommerce/falabella/publicar";

// El view usa `useSearchParams()` (Client Component hook) → Next 15 exige
// que la ruta no se prerenderice estática. Toda la app está gateada por
// middleware con cookie de auth, así que el SSG no aporta nada acá.

export default function FalaCalculadoraMargenPage() {
    return (
        <Suspense fallback={null}>
            <FalaCalculadoraMargenView mode="standalone" />
        </Suspense>
    );
}
