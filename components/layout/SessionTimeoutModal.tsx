"use client";

import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";
import { useCallback, useMemo, useState } from "react";

// añadidos para el ojo (igual que en Login/NuevaContrasena)
import { IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function SessionTimeoutModal() {
    const {
        applyRenewedSession,
        logout,
        showSessionModal,
        setShowSessionModal,
        expiraEn,
        token,
        user,
        secondsLeft,
        // Si en tu contexto aún no existe, no pasa nada: se usa solo si está.
        // (Lo agregamos como fallback temporal cuando /auth/renovar daba 500)
        forceReLoginWithPassword,
    } = useAuth();

    const { fetchWithAuth } = useFetchWithAuth();

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [renewError, setRenewError] = useState<string | null>(null);
    const [renewOk, setRenewOk] = useState<string | null>(null);

    // estado de ver/ocultar password (igual que en Login)
    const [showPwd, setShowPwd] = useState(false);

    // helpers de mensajes (mismo criterio que Login/NuevaContrasena)
    const FRIENDLY_CREDENCIALES = "Credenciales inválidas.";
    const FRIENDLY_ERROR = "Se produjo un error inesperado.";

    function prettyApiMessage(raw: any): string {
        if (!raw) return "";

        // Si ya es objeto
        if (typeof raw === "object") {
            try {
                // Si es un objeto con estructura { error: { message: "..."} }
                if (raw.error && typeof raw.error === "object" && raw.error.message) {
                    return String(raw.error.message);
                }

                if (raw.message) return String(raw.message);
                if (raw.error) return String(raw.error);
                if (raw.detail) return String(raw.detail);

                return JSON.stringify(raw); // fallback: muestra JSON
            } catch {
                return String(raw);
            }
        }

        const txt = String(raw).trim();

        // Si parece JSON en texto
        if ((txt.startsWith("{") && txt.endsWith("}")) || (txt.startsWith("[") && txt.endsWith("]"))) {
            try {
                const data = JSON.parse(txt);

                // Caso { error: { message: "..." } }
                if (data?.error?.message) {
                    return String(data.error.message);
                }

                // Caso Zod issues
                if (Array.isArray(data?.issues) && data.issues.length) {
                    return data.issues.map((i: any) => i?.message).filter(Boolean).join("\n");
                }

                // Caso array de errores
                if (Array.isArray(data) && data.length) {
                    const msgs = data.map((it) =>
                        (it && typeof it === "object" ? it.message : String(it))
                    ).filter(Boolean);
                    if (msgs.length) return msgs.join("\n");
                }

                // Caso genérico con message/error/detail
                if (data && typeof data === "object") {
                    const m = data.message || data.error || data.detail;
                    if (typeof m === "string" && m.trim()) return m.trim();
                }
            } catch {
                // Ignorar parseo fallido
            }
        }

        // Si trae info de HTTP en crudo
        if (/^HTTP\b/i.test(txt) || /\bstatus\s*:\s*\d{3}\b/i.test(txt)) return "";

        return txt;
    }



    // helper para extraer status desde err.message
    const parseStatus = (err: any) => {
        const m = /status:\s*(\d{3})/i.exec(String(err?.message || ""));
        return m ? Number(m[1]) : (typeof err?.status === "number" ? err.status : 0);
    };

    // estado de minimizado
    const [minimized, setMinimized] = useState(false);

    // --- helpers JWT/tiempo (solo locales en este archivo) ---
    const decodeExpFromJWT = useCallback((t: string): number => {
        try {
            const part = t.split(".")[1];
            if (!part) return 0;
            const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64.padEnd(
                base64.length + ((4 - (base64.length % 4)) % 4),
                "="
            );
            const payload = JSON.parse(atob(padded));
            return Number(payload?.exp) || 0; // segundos UNIX
        } catch {
            return 0;
        }
    }, []);

    const toEpochSeconds = useCallback((value?: number | null): number => {
        if (value == null || isNaN(Number(value))) return 0;
        const v = Number(value);
        if (v > 1e12) return Math.floor(v / 1000); // epoch ms -> seg
        if (v > 1e9) return Math.floor(v); // epoch seg
        return Math.floor(Date.now() / 1000) + Math.floor(v); // duración -> now + v
    }, []);

    const getSecondsLeft = useCallback(() => {
        const now = Math.floor(Date.now() / 1000);
        if (typeof expiraEn === "number" && expiraEn > 0) {
            return Math.max(0, expiraEn - now);
        }
        const fromCtx = token || undefined;
        const fromLS = (() => {
            try {
                return JSON.parse(localStorage.getItem("authState") || "{}")
                    ?.token as string | undefined;
            } catch {
                return undefined;
            }
        })();
        const fromKey = localStorage.getItem("token") || undefined;
        const fromCookie =
            document.cookie
                .split("; ")
                .find((c) => c.startsWith("authToken="))
                ?.split("=")[1] || undefined;

        const t = fromCtx || fromLS || fromKey || fromCookie;
        if (!t) return 0;

        const exp = decodeExpFromJWT(t);
        return Math.max(0, exp - now);
    }, [expiraEn, token, decodeExpFromJWT]);

    // // contador en tiempo real (se muestra en modal y mini-modal)
    // const [secondsLeft, setSecondsLeft] = useState<number>(0);
    // useEffect(() => {
    //     const tick = () => setSecondsLeft(getSecondsLeft());
    //     tick();
    //     const id = setInterval(tick, 1000);
    //     return () => clearInterval(id);
    // }, [getSecondsLeft]);

    const isExpired = secondsLeft <= 0;
    const mmss = useMemo(() => {
        const s = Math.max(0, secondsLeft | 0);
        const hh = String(Math.floor(s / 3600)).padStart(2, "0");
        const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
    }, [secondsLeft]);

    // === minimizar y restaurar ===
    const handleMinimize = () => {
        setMinimized(true);
        // No cerramos el modal en contexto; solo dejamos de mostrar el overlay.
        // Así mantenemos el ciclo de renovación activo.
    };

    const handleRestore = () => {
        setMinimized(false);
        setShowSessionModal(true);
    };

    const handleGoLogin = async () => {
        await logout();
    };

    // === RENOVAR con patrón useFetchWithAuth + manejo de errores "pretty" ===
    const handleRenew = async () => {
        if (loading || !password.trim()) return;
        setLoading(true);
        setRenewError(null);

        try {
            // 1) intento normal: /auth/renovar con body { password }
            const resp = await fetchWithAuth<{ token: string; expiraEn?: number }>(
                "idservice/auth/renovar",
                {
                    method: "POST",
                    body: JSON.stringify({ password: password.trim() }), // SOLO password
                }
            );

            const newToken = String(resp?.token || "");
            if (!newToken) throw new Error("Renovar: respuesta sin token");

            const expFromJwt = decodeExpFromJWT(newToken);
            const finalExp = expFromJwt || toEpochSeconds(resp?.expiraEn);

            applyRenewedSession(newToken, finalExp);

            // Mantiene el modal visible 2s para que se vea el mensaje de éxito y luego se cierra
            setRenewError(null);
            setRenewOk("Sesión renovada correctamente.");  // <-- muestra alerta verde

            // Mantiene el modal visible por 2s para que se vea el mensaje de éxito
            setShowSessionModal(true);
            setTimeout(() => {
                setRenewOk(null);                // limpia mensaje
                setShowSessionModal(false);      // cierra modal
            }, 2000);


            setPassword("");
        } catch (e1: any) {
            const status = parseStatus(e1);

            // En vez de String(...), pasamos el objeto crudo para que prettyApiMessage lo lea bien
            const payload = e1?.message ?? e1 ?? "";
            const pretty = prettyApiMessage(payload.error);

            if (status === 401 || status === 403) {
                setRenewError(pretty || FRIENDLY_CREDENCIALES);
            } else {
                setRenewError(pretty || FRIENDLY_ERROR);
            }
        } finally {
            setLoading(false);
        }

    };

    // === RENDER ===
    // Si no hay sesión próxima a vencer ni minimizado, no mostramos nada
    if (!showSessionModal && !minimized) return null;

    // --- Estilos base ---
    const backdropStyle: React.CSSProperties = {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    };
    const cardStyle: React.CSSProperties = {
        background: "#fff",
        borderRadius: 12,
        width: "100%",
        maxWidth: 480,
        padding: 22,
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        position: "relative",
    };
    const titleStyle: React.CSSProperties = {
        margin: 0,
        marginBottom: 8,
        fontSize: 18,
        fontWeight: 700,
    };
    const textStyle: React.CSSProperties = { margin: "0 0 14px", color: "#444" };
    const monoStyle: React.CSSProperties = {
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        fontWeight: 700,
    };
    const actionsStyle: React.CSSProperties = {
        display: "flex",
        gap: 8,
        justifyContent: "flex-end",
    };
    const primaryBtnStyle: React.CSSProperties = {
        padding: "10px 14px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        background: "#2563eb",
        color: "#fff",
        fontWeight: 600,
    };
    const secondaryBtnStyle: React.CSSProperties = {
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        cursor: "pointer",
        background: "#f9fafb",
        color: "#111827",
        fontWeight: 500,
    };
    const dangerBtnStyle: React.CSSProperties = {
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        cursor: "pointer",
        background: "#fff",
        color: "#111827",
        fontWeight: 500,
    };
    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        outline: "none",
    };

    // Estilos del botón X (minimizar)
    const closeXStyle: React.CSSProperties = {
        position: "absolute",
        top: 5,
        right: 10,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 30,
        lineHeight: 1,
        color: "#6b7280",
    };

    // --- MINI MODAL (bottom-left) ---
    const miniWrapStyle: React.CSSProperties = {
        position: "fixed",
        left: 80,
        bottom: 10,
        zIndex: 9999,
    };
    const miniCardStyle: React.CSSProperties = {
        background: "#111827",
        color: "#fff",
        borderRadius: 12,
        maxWidth: 320,
        padding: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    };
    const miniTitle: React.CSSProperties = {
        margin: 0,
        fontSize: 14,
        fontWeight: 700,
    };
    const miniTimer: React.CSSProperties = {
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        fontWeight: 700,
        fontSize: 13,
        padding: "2px 6px",
        borderRadius: 6,
        background: "#1f2937",
    };
    const miniRow: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
    };
    const miniInput: React.CSSProperties = {
        flex: 1,
        background: "#0b1220",
        border: "1px solid #374151",
        color: "#fff",
        borderRadius: 8,
        padding: "2px 4px",
        outline: "none",
    };
    const miniActions: React.CSSProperties = {
        display: "flex",
        gap: 6,
        justifyContent: "flex-end",
        marginTop: 8,
    };
    const miniBtn: React.CSSProperties = {
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #374151",
        background: "#1f2937",
        color: "#fff",
        cursor: "pointer",
        fontSize: 12,
    };
    const miniPrimary: React.CSSProperties = {
        ...miniBtn,
        background: "#2563eb",
        border: "none",
    };
    const miniGhost: React.CSSProperties = {
        ...miniBtn,
        background: "transparent",
    };

    // --- FULL MODAL ---
    const fullModal = (
        <div style={backdropStyle} aria-modal aria-hidden={false} role="dialog">
            <div style={cardStyle}>
                {/* X para minimizar */}
                <button
                    aria-label="Minimizar"
                    title="Minimizar"
                    onClick={handleMinimize}
                    style={closeXStyle}
                >
                    ×
                </button>

                {!isExpired ? (
                    <>
                        <h2 style={titleStyle}>Tu sesión está por vencer</h2>
                        <p style={textStyle}>
                            Quedan <span style={monoStyle}>{mmss}</span> para que tu sesión expire.
                        </p>

                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: 12,
                                    color: "#374151",
                                    marginBottom: 6,
                                }}
                            >
                                Ingresa tu contraseña
                            </label>

                            {/* contenedor relativo para el IconButton como en Login */}
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPwd ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    style={inputStyle}
                                />
                                <IconButton
                                    onClick={() => setShowPwd(!showPwd)}
                                    edge="end"
                                    size="small"
                                    sx={{ position: "absolute", right: "6px", top: "2px" }}
                                >
                                    {showPwd ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                            </div>
                            {/* renovado con exito */}
                            {renewOk && (
                                <div
                                    role="alert"
                                    style={{
                                        marginTop: 10,
                                        borderRadius: 8,
                                        padding: 12,
                                        border: "1px solid #bbf7d0",   // green-200
                                        background: "#f0fdf4",          // green-50
                                        color: "#166534",               // green-700
                                        fontSize: 14,
                                        whiteSpace: "pre-line",
                                    }}
                                >
                                    {renewOk}
                                </div>
                            )}

                            {/* error */}
                            {renewError && (
                                <div
                                    role="alert"
                                    style={{
                                        marginTop: 10,
                                        borderRadius: 8,
                                        padding: 12,
                                        border: "1px solid #fecaca",     // red-200
                                        background: "#fef2f2",            // red-50
                                        color: "#991b1b",                 // red-800
                                        fontSize: 14,
                                        whiteSpace: "pre-line",
                                    }}
                                >
                                    {renewError}
                                </div>
                            )}
                        </div>

                        <div style={actionsStyle}>
                            <button
                                onClick={handleRenew}
                                disabled={loading || !password.trim()}
                                style={primaryBtnStyle}
                            >
                                {loading ? "Renovando..." : "Renovar sesión"}
                            </button>
                            <button onClick={handleGoLogin} style={dangerBtnStyle}>
                                Cerrar sesión
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={titleStyle}>Tu sesión se cerró</h2>
                        <p style={textStyle}>
                            Por seguridad se cerró tu sesión. Inicia sesión nuevamente.
                        </p>
                        <div style={actionsStyle}>
                            <button onClick={handleGoLogin} style={primaryBtnStyle}>
                                Ir a login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    // --- MINI MODAL ---
    const miniModal = (
        <div style={{ position: "fixed", left: 80, bottom: 10, zIndex: 9999 }}>
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "1px 8px",
                    borderRadius: 10,
                    background: "#111827",
                    color: "#fff",
                    boxShadow: "0 8px 20px rgba(0,0,0,.25)",
                }}
            >
                <span
                    aria-label="Tiempo restante"
                    style={{
                        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
                        fontWeight: 700,
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "#1f2937",
                    }}
                >
                    {mmss}
                </span>

                <button
                    onClick={handleRestore}
                    title="Ampliar"
                    aria-label="Ampliar"
                    style={{
                        border: "none",
                        color: "#fff",
                        fontWeight: 600,
                        padding: "6px 8px",
                        borderRadius: 8,
                        cursor: "pointer",
                    }}
                >
                    ⤢
                </button>
            </div>
        </div>
    );

    // --- RENDER CONDICIONAL ---
    if (!showSessionModal && !minimized) return null;
    if (minimized) return miniModal;
    if (showSessionModal) return fullModal;
    return null;
}
