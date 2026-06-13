import { useEffect, useMemo, useRef, useState } from "react";

type Options = {
    /** Cada cuánto verificar (ms). Por defecto, 60s */
    intervalMs?: number;
    /** Umbral para “está por expirar” (segundos). Por defecto, 10 min */
    warnBeforeSeconds?: number;
    /** Prefijo para el log en consola */
    consolePrefix?: string;
};

/**
 * Hook para verificar el tiempo restante del token y loguearlo en consola.
 * - Lee el token desde:
 *   1) localStorage.authState.token (si existe)
 *   2) localStorage.token (fallback)
 *   3) cookie "authToken" (fallback)
 * - Devuelve segundos restantes, banderas útiles y un formateo mm:ss
 * - Loguea en consola el tiempo restante cada intervalo
 */
export function useVerificarExpiracionToken(options: Options = {}) {
    const {
        intervalMs = 60_000,
        warnBeforeSeconds = 600,
        consolePrefix = "[Sesion]",
    } = options;

    const [secondsLeft, setSecondsLeft] = useState<number>(() =>
        getSecondsLeftSafe()
    );
    const intervalRef = useRef<number | null>(null);

    // Derivados útiles para UI
    const isExpired = secondsLeft <= 0;
    const isExpiringSoon = secondsLeft > 0 && secondsLeft <= warnBeforeSeconds;
    const mmss = useMemo(() => formatMMSS(secondsLeft), [secondsLeft]);

    // Tick inicial + intervalo
    useEffect(() => {
        // Tick inmediato (por si intervalMs es alto)
        tick();

        // Intervalo
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
        }
        intervalRef.current = window.setInterval(tick, intervalMs);

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs]);

    // Función para forzar un recalculo manual
    const refreshNow = () => tick();

    function tick() {
        const s = getSecondsLeftSafe();
        setSecondsLeft(s);
        // Log amigable en consola (incluye mm:ss y segundos crudos)
         
        console.log(
            `${consolePrefix} Faltan ${formatMMSS(s)} (${Math.max(0, s)}s) para que expire el token`
        );
    }

    return {
        secondsLeft,
        isExpired,
        isExpiringSoon,
        mmss,
        refreshNow,
    };
}

/* ------------------------ Helpers internos ------------------------ */

function getSecondsLeftSafe(): number {
    if (typeof window === "undefined") return 0;

    const token =
        getTokenFromAuthState() ||
        localStorage.getItem("token") ||
        getCookie("authToken");

    if (!token) return 0;

    try {
        const payload = decodeJwtPayload(token);
        const exp = typeof payload?.exp === "number" ? payload.exp : 0; // exp en segundos UNIX
        const ahora = Math.floor(Date.now() / 1000);
        return Math.max(0, exp - ahora);
    } catch {
        return 0;
    }
}

function getTokenFromAuthState(): string | null {
    try {
        const raw = localStorage.getItem("authState");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const token = parsed?.token ?? null;
        return typeof token === "string" ? token : null;
    } catch {
        return null;
    }
}

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const prefix = `${name}=`;
    const parts = document.cookie.split("; ");
    for (const part of parts) {
        if (part.startsWith(prefix)) {
            return decodeURIComponent(part.substring(prefix.length));
        }
    }
    return null;
}

// Decodifica el payload de un JWT (Base64URL) de forma segura en cliente
function decodeJwtPayload(token: string): any {
    const parts = token.split(".");
    if (parts.length < 2) throw new Error("Token inválido");
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // agrega padding si falta
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const json = typeof atob !== "undefined" ? atob(padded) : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json);
}

function formatMMSS(s: number): string {
    const safe = Math.max(0, s | 0);
    const mm = Math.floor(safe / 60);
    const ss = safe % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
