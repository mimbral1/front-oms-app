// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/error-map.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// ofertas/helpers/errorMap.ts`. Mapeo de errores ML / backend → mensajes
// humanos en español.
//
// Fuentes:
// - pim-service/CLAUDE.md → "Promociones ML / Errores comunes" (tabla)
// - pim-service/CLAUDE.md → "Trampas críticas" (13 reglas)
// - Backend (MeliCatalog seller-promotions.routes) propaga `code`, `message`
//   y `causes[]` con las shapes reales que devuelve ML.
//
// Uso:
//   try { await api.optInItem(...); }
//   catch (err) { toast(humanizeApiError(err)); }

import type { ApiError } from "../api/ofertas-api";

const ERROR_MAP: Readonly<Record<string, string>> = {
    // ── Rangos de descuento (CLAUDE.md trampa #1, #3) ───────────────────────
    ERROR_CREDIBILITY_DISCOUNTED_PRICE:
        'El precio queda fuera del rango sugerido por Mercado Libre para este producto. Prueba con "Usar sugerido" o ajusta dentro del rango ML.',
    buyer_discount_not_in_range: "El descuento debe estar entre 5% y 80%.",
    best_buyer_discount_not_in_range:
        "El top deal price (loyalty) debe estar entre 5% y 80%.",

    // ── Top deal / loyalty (CLAUDE.md trampa #2) ────────────────────────────
    discount_below_5_percent_difference:
        "El top deal price (loyalty 3-6) debe estar al menos 5% por debajo del descuento general.",
    discount_below_10_percent_difference:
        "Cuando el descuento general supera 35%, el top deal price debe estar al menos 10% por debajo.",
    TOP_DEAL_LOCKED:
        'No puedes cambiar el top deal price porque la campaña ya inició. Esa modificación solo se puede hacer en estado "pending".',

    // ── Plazos (CLAUDE.md trampa #8, #9) ────────────────────────────────────
    CAMPAIGN_TOO_LONG: "La duración máxima permitida es 14 días.",
    PERIOD_EXCEEDS_MAXIMUM: "La duración máxima permitida es 14 días.",

    // ── Reputación / status del item (CLAUDE.md trampa #8) ──────────────────
    REPUTATION_NOT_GREEN:
        "Tu reputación debe estar en verde para inscribirte. Mejora las métricas y vuelve a intentar.",
    ITEM_NOT_ELIGIBLE:
        'El ítem no es elegible: revisa que esté activo, sea condición "nuevo" y no esté en una campaña conflictiva.',

    // ── Conflictos / locks (CLAUDE.md trampa #5, #6) ────────────────────────
    PROMO_CONFLICT:
        "El SKU ya está en otra promoción activa. Quedará en stand-by hasta que termine.",
    ENTITY_LOCKED:
        "Mercado Libre está procesando este ítem. Espera unos segundos y reintenta.",
    PRICE_ONLY_BETTER:
        "Solo puedes mejorar el precio actual (bajarlo). Subir precios en una campaña activa no está permitido.",
    STOCK_INSUFFICIENT:
        "El stock comprometido es menor al mínimo requerido por la campaña.",
    error_credibility_price:
        'El precio del ítem ya tiene un descuento que ML considera "no creíble" — prueba con un descuento mayor o resetea el precio del producto antes.',

    // ── Otros (CLAUDE.md tabla de errores) ──────────────────────────────────
    NAME_DUPLICATED: "Ya existe una campaña con ese nombre. Elige otro.",
    TOO_MANY_REQUESTS: "Demasiadas solicitudes en simultáneo. Reintentando con espera.",
    MISSING_PROMOTION_TYPE:
        "Falta el tipo de promoción. Recarga la página y reintenta.",

    // ── Errores de transporte (proxy / red) ─────────────────────────────────
    UPSTREAM_TIMEOUT:
        "El servicio de promociones tardó demasiado en responder. Reintenta.",
    UPSTREAM_UNREACHABLE:
        "No pudimos contactar el servicio de promociones. Verifica que MeliCatalog (puerto 3013) esté corriendo.",

    // ── Genéricos por status ML ─────────────────────────────────────────────
    ML_400: "Datos inválidos para ML — revisa los campos.",
    ML_401: "Tu sesión con ML expiró — reintenta.",
    ML_403: "No tienes permisos suficientes para esta operación.",
    ML_404: "Recurso no encontrado en ML.",
    ML_422: "Datos inconsistentes — el ítem puede estar pausado, ser usado, etc.",
    ML_423: "El ítem está bloqueado temporalmente. Reintenta en 5-10 segundos.",
    ML_429: "Demasiadas requests. Reintentando con backoff.",
    ML_500:
        "Mercado Libre está devolviendo un error interno para esta campaña. Es un bug conocido del lado de ML — sus propios endpoints se contradicen. Reintenta en unos minutos. Si persiste, contacta a soporte ML con el ID de la campaña.",
};

/**
 * Convierte un ApiError (o cualquier error) en un mensaje humano para toast.
 * - Si el `code` está en el mapa, usa esa traducción.
 * - Si no, busca en `causes[]` el primer code conocido.
 * - Si nada matchea, devuelve el `message` raw del error.
 */
export function humanizeApiError(err: unknown): string {
    if (!err) return "Error desconocido";

    const apiErr = err as ApiError;
    if (apiErr?.code && ERROR_MAP[apiErr.code]) {
        return ERROR_MAP[apiErr.code]!;
    }

    if (Array.isArray(apiErr?.causes)) {
        for (const c of apiErr.causes) {
            if (c?.code && ERROR_MAP[c.code]) {
                return ERROR_MAP[c.code]!;
            }
        }
        const firstWithMsg = apiErr.causes.find((c) => c?.message);
        if (firstWithMsg?.message) return firstWithMsg.message;
    }

    return apiErr?.message || String(err);
}
