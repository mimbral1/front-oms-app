const carrierCache = new Map<string, unknown>();
const STORAGE_KEY = "delivery.transportistas.carrier-cache.v1";

let hydratedFromStorage = false;

const normalizeKey = (carrierId: string): string => String(carrierId || "").trim();

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const canUseStorage = (): boolean => typeof window !== "undefined" && !!window.sessionStorage;

const hydrateFromStorage = (): void => {
    if (hydratedFromStorage) return;
    hydratedFromStorage = true;

    if (!canUseStorage()) return;

    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as Record<string, unknown>;
        Object.entries(parsed || {}).forEach(([key, value]) => {
            const normalized = normalizeKey(key);
            if (!normalized) return;
            carrierCache.set(normalized, value);
        });
    } catch {
        // Ignore corrupted storage payloads and continue with in-memory cache.
    }
};

const persistToStorage = (): void => {
    if (!canUseStorage()) return;

    try {
        const serialized = Object.fromEntries(carrierCache.entries());
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch {
        // Best-effort persistence only.
    }
};

export const getCarrierCache = <T>(carrierId: string): T | undefined => {
    hydrateFromStorage();

    const key = normalizeKey(carrierId);
    if (!key) return undefined;

    const cached = carrierCache.get(key);
    if (cached == null) return undefined;

    return clone(cached as T);
};

export const setCarrierCache = <T>(carrierId: string, payload: T): void => {
    hydrateFromStorage();

    const key = normalizeKey(carrierId);
    if (!key) return;

    carrierCache.set(key, clone(payload));
    persistToStorage();
};

export const mergeCarrierCache = <T extends Record<string, any>>(carrierId: string, payload: Partial<T>): void => {
    hydrateFromStorage();

    const key = normalizeKey(carrierId);
    if (!key) return;

    const current = (carrierCache.get(key) as Record<string, any> | undefined) || {};
    const incoming = clone(payload);

    const merged: Record<string, any> = {
        ...current,
        ...incoming,
    };

    if (current.coverageAreaData || incoming.coverageAreaData) {
        merged.coverageAreaData = {
            ...(current.coverageAreaData || {}),
            ...(incoming.coverageAreaData || {}),
        };
    }

    carrierCache.set(key, merged);
    persistToStorage();
};
