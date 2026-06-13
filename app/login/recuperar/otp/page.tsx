import VerifyOtp from "@/features/auth/pages/recuperar/otp/Otp";
import { Suspense } from "react";

export default function OtpPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <VerifyOtp />;
        </Suspense>
    )
}
