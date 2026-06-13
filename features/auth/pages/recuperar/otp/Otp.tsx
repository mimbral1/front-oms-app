"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithAuthSinToken } from "@/lib/http/client";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const FRIENDLY_OTP_ERROR = "El código es inválido o ha expirado. Intenta nuevamente.";

function prettyApiMessage(raw: string): string {
    if (!raw) return "";
    const txt = raw.trim();

    if ((txt.startsWith("{") && txt.endsWith("}")) || (txt.startsWith("[") && txt.endsWith("]"))) {
        try {
            const data = JSON.parse(txt);

            if (data && Array.isArray(data.issues) && data.issues.length) {
                return data.issues.map((i: any) => i?.message).filter(Boolean).join("\n");
            }
            if (Array.isArray(data) && data.length) {
                const msgs = data
                    .map((it) => (it && typeof it === "object" ? it.message : String(it)))
                    .filter(Boolean);
                if (msgs.length) return msgs.join("\n");
            }
            if (data && typeof data === "object") {
                const m = (data.message || data.error || data.detail);
                if (typeof m === "string" && m.trim()) return m.trim();
            }
        } catch { /* noop */ }
    }

    if (/^HTTP\b/i.test(txt) || /\bstatus\s*:\s*\d{3}\b/i.test(txt)) return "";
    return txt;
}

function isOtpOk(payload: any): boolean {
    if (!payload) return false;
    if (payload.valid === true) return true;
    if (typeof payload.valid === "string" && payload.valid.toLowerCase() === "true") return true;
    const msg = String(payload.message ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    if (msg.includes("valido")) return true;
    if (payload.ok === true) return true;
    const status = String(payload.status ?? "").toLowerCase();
    if (status === "ok" || status === "success") return true;
    return false;
}

export default function VerifyOtp() {
    const router = useRouter();
    const params = useSearchParams();
    const emailParam = params.get("email") || "";

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!emailParam) router.replace("/login/recuperar");
    }, [emailParam, router]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!code || code.length !== 6) {
            return setError("Ingresa el código de 6 dígitos.");
        }

        try {
            setLoading(true);
            const correo = emailParam.trim().toLowerCase();

            const data = await fetchWithAuthSinToken<any>("idservice/auth/verificar-otp", {
                method: "POST",
                body: JSON.stringify({ correo, codigoOtp: code }),
            });

            if (!isOtpOk(data)) {
                throw new Error(FRIENDLY_OTP_ERROR);
            }

            router.push(
                `/login/recuperar/nueva?email=${encodeURIComponent(correo)}&otp=${encodeURIComponent(code)}`
            );
        } catch (err: any) {
            const raw = typeof err?.message === "string" ? err.message.trim() : "";
            const pretty = prettyApiMessage(raw);
            const looksHttpOnly = /^HTTP\s*\d+$/i.test(raw);
            setError((pretty && !looksHttpOnly) ? pretty : FRIENDLY_OTP_ERROR);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-page-bg px-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900">Mimbral 360</h2>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 rounded-md bg-white p-6 shadow">
                    <div>
                        <p className="text-center block text-sm font-bold">Introduce el código de seguridad</p>
                        <p className="text-center text-sm text-gray-600 mt-1">
                            Código de 6 dígitos enviado a {emailParam}
                        </p>
                        <br />
                        <label className="block text-sm font-medium text-gray-700">Código (6 dígitos)</label>
                        <input
                            inputMode="numeric"
                            maxLength={6}
                            pattern="[0-9]*"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm tracking-widest"
                            placeholder="______"
                            required
                        />
                    </div>

                    {/* MISMO estilo de alerta que Login */}
                    {error && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 text-red-600" />
                                <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
                    >
                        {loading ? "Verificando..." : "Continuar"}
                    </button>

                    <div className="text-center">
                        <a href="/login" className="text-sm text-gray-500 hover:underline">
                            ↍ Volver a iniciar sesión
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
