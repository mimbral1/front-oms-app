export function resolveMarketplaceKey(platformName?: string): string {
    const normalized = (platformName || "").toLowerCase();
    if (normalized.includes("falabella")) return "falabella";
    if (normalized.includes("vtex")) return "vtex";
    return "ml";
}
