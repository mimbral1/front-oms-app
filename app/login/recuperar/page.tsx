import RecoverStart from "@/features/auth/pages/recuperar/RecuperarContrasena";
import { Suspense } from "react";

export default function RecoverPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <RecoverStart />;
        </Suspense>
    )
}



