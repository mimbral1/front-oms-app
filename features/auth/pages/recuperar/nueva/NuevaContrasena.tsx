"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithAuthSinToken } from "@/lib/http/client";
import { IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const FRIENDLY_SAVE_ERROR =
    "No pudimos actualizar tu contraseña. Código OTP inválido, expirado o ya usado.";

// mismo parser que usamos en Login/Recuperar/OTP
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

export default function SetNewPassword() {
    const router = useRouter();
    const params = useSearchParams();

    const emailParam = params.get("email") || "";
    const otp = params.get("otp") || "";

    const [pwd, setPwd] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    // ojo para visibilizar contrasena
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (!emailParam || !otp) router.replace("/login/recuperar");
    }, [emailParam, otp, router]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setOkMsg(null);

        if (pwd.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
        if (pwd !== confirm) return setError("Las contraseñas no coinciden.");

        try {
            setLoading(true);

            const correo = emailParam.trim().toLowerCase();

            await fetchWithAuthSinToken<{ message: string }>("idservice/auth/cambiar-contrasena", {
                method: "POST",
                body: JSON.stringify({
                    correo,
                    codigoOtp: otp,
                    // claves exactas del contrato (con ñ)
                    ["nuevaContraseña"]: pwd,
                    ["confirmarContraseña"]: confirm,
                }),
            });

            setOkMsg("Contraseña actualizada");
            setTimeout(() => router.push("/login"), 900);
        } catch (err: any) {
            const raw = typeof err?.message === "string" ? err.message : "";
            const pretty = prettyApiMessage(raw);
            // Si el backend entregó un mensaje claro -> úsalo; si no, friendly
            setError(pretty || FRIENDLY_SAVE_ERROR);
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
                        <p className="text-center block text-sm font-bold">Elige una contraseña nueva</p>
                        <p className="text-center text-sm text-gray-600 mt-1">
                            Mínimo 6 caracteres. Recomendada con números y signos.
                        </p>
                        <br />
                        <label className="block text-sm font-medium text-gray-700">Contraseña nueva</label>
                        <div className="relative">
                            <input
                                type={showPwd ? "text" : "password"}
                                value={pwd}
                                onChange={(e) => setPwd(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="••••••••"
                                required
                            />
                            <IconButton
                                onClick={() => setShowPwd(!showPwd)}
                                edge="end"
                                size="small"
                                sx={{ position: "absolute", right: "10px", top: "2px" }}
                            >
                                {showPwd ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="••••••••"
                                required
                            />
                            <IconButton
                                onClick={() => setShowConfirm(!showConfirm)}
                                edge="end"
                                size="small"
                                sx={{ position: "absolute", right: "10px", top: "2px" }}
                            >
                                {showConfirm ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                        </div>
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

                    {okMsg && (
                        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <p className="text-sm text-green-800">{okMsg}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
                    >
                        {loading ? "Guardando..." : "Continuar"}
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
