import SetNewPassword from "@/features/auth/pages/recuperar/nueva/NuevaContrasena";
import { Suspense } from "react";

export default function NuevaPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <SetNewPassword />;
        </Suspense>
    )
}
