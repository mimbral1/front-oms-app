// Tipos del módulo de Campañas de ofertas Falabella.
// Una "campaña" es un constructo nuestro: precio especial (SpecialPrice) con
// vigencia por SKU, orquestado como campaña al estilo ML. El backend (fcom)
// expone /campaigns/*; pim lo proxea en /api/pim/canales/falabella/campanas/*.

export type CampanaStatus =
    | "draft"
    | "scheduled"
    | "active"
    | "finishing"
    | "finished"
    | "cancelled"
    | "error";

export interface Campana {
    id: number;
    nombre: string;
    descripcion: string | null;
    discount_pct: number | null;
    starts_at: string;
    ends_at: string;
    status: CampanaStatus;
    operator_code: string;
    created_by: number | null;
    created_by_name: string | null;
    created_at: string;
    updated_at: string;
    items_count?: number;
}

export type ItemApplyStatus =
    | "pending"
    | "applied"
    | "error"
    | "warning"
    | "expired"
    | "skipped";

export interface CampanaItem {
    id: number;
    campaign_id: number;
    sku: string;
    base_price: number | null;
    special_price: number | null;
    is_override: boolean | number;
    apply_status: ItemApplyStatus;
    feed_id: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface CampanaDetail extends Campana {
    items: CampanaItem[];
}

export interface CampanaConflict {
    sku: string;
    campaign_id: number;
    campaign_nombre: string;
    status: CampanaStatus;
    starts_at: string;
    ends_at: string;
}

export interface AddItemsResult {
    needsConfirmation?: boolean;
    added: number;
    skipped: { sku: string; reason: string }[];
    conflicts: CampanaConflict[];
}

export interface ParsedItems {
    items: { sku: string; precio_oferta?: number }[];
    errors: { row: number; message: string }[];
    total: number;
}

export interface PreviewItem {
    sku: string;
    base_price: number | null;
    special_price: number | null;
    is_override: boolean;
    descuento_pct: number | null;
    base_desconocido: boolean;
}

export interface PreviewResult {
    campaign_id: number;
    discount_pct: number | null;
    items: PreviewItem[];
}

export interface ApplyResult {
    campaign_id: number;
    dry_run: boolean;
    total: number;
    applied?: number;
    expired?: number;
    errors: number;
    results: Array<{
        sku: string;
        status: string;
        feed_id?: string | null;
        special_price?: number;
        error?: string;
        would_send?: Record<string, unknown>;
    }>;
}

export interface NuevaCampanaInput {
    nombre: string;
    descripcion?: string;
    discount_pct?: number | null;
    starts_at: string;
    ends_at: string;
}
