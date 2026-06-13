type AuthLike = {
    user?: {
        id?: string | number;
        ID?: string | number;
        userId?: string | number;
        usuarioId?: string | number;
    };
    id?: string | number;
    ID?: string | number;
    userId?: string | number;
    usuarioId?: string | number;
};

const parseAuthState = (): AuthLike | null => {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem("authState");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? (parsed as AuthLike) : null;
    } catch {
        return null;
    }
};

export const getLoggedUserId = (): number | undefined => {
    const auth = parseAuthState();
    if (!auth) return undefined;

    const raw =
        auth.user?.id ??
        auth.user?.ID ??
        auth.user?.usuarioId ??
        auth.user?.userId ??
        auth.id ??
        auth.ID ??
        auth.usuarioId ??
        auth.userId;

    const id = Number(raw);
    return Number.isFinite(id) ? id : undefined;
};
