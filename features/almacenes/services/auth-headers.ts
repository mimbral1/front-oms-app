const X_PLATAFORMA_ID = "1";

function readCookieToken(): string {
    if (typeof document === "undefined") return "";

    const match = document.cookie.match(/(?:^|;\s*)authToken=([^;]+)/);
    if (!match?.[1]) return "";

    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

function readStorageToken(): string {
    if (typeof window === "undefined") return "";

    try {
        const raw = window.localStorage.getItem("authState") || "{}";
        const parsed = JSON.parse(raw);
        if (parsed?.token) return String(parsed.token);
    } catch {
        // ignore parse/storage errors
    }

    return "";
}

export function getAlmacenesToken(): string {
    return readStorageToken() || readCookieToken();
}

function getJanisEnvHeaders(): Record<string, string> {
    const apiKey = process.env.NEXT_PUBLIC_JANIS_API_KEY?.trim();
    const apiSecret = process.env.NEXT_PUBLIC_JANIS_API_SECRET?.trim();
    const client = process.env.NEXT_PUBLIC_JANIS_CLIENT?.trim();

    return {
        ...(apiKey ? { "janis-api-key": apiKey } : {}),
        ...(apiSecret ? { "janis-api-secret": apiSecret } : {}),
        ...(client ? { "janis-client": client } : {}),
    };
}

export function withPlatformHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
        ...getJanisEnvHeaders(),
        ...headers,
        "x-plataforma-id": X_PLATAFORMA_ID,
    };
}

export function withAuthPlatformHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = getAlmacenesToken();

    return {
        ...withPlatformHeaders(headers),
        Authorization: token ? `Bearer ${token}` : "",
    };
}
