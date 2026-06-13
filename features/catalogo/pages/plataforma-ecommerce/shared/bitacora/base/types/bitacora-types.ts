// features/catalogo/pages/plataforma-ecommerce/shared/bitacora/base/types/bitacora-types.ts
//
// Tipos de la bitácora de publicación Falabella. Espejo del contrato que expone
// fcom (dbo.fal_product_audit) vía PIM:
//   GET /api/pim/productos/:sku/audit?marketplace=falabella   → BitacoraEntry[]
//   GET /api/pim/canales/falabella/publish-activity           → PublishActivity
//
// La asincronía de Falabella se modela con event_type: los eventos síncronos
// (ENCOLADO/FEED_ENVIADO) los emite el publish-flow al instante; los async
// (SINCRONIZADO/RECHAZADO/ADVERTENCIA/TIMEOUT) los descubre el worker de
// FeedStatus minutos después. ACTUALIZADO viene del flujo de edición.

export type BitacoraEventType =
    | "ENCOLADO"
    | "FEED_ENVIADO"
    | "SINCRONIZADO"
    | "RECHAZADO"
    | "ADVERTENCIA"
    | "TIMEOUT"
    | "PAUSADO"
    | "ACTUALIZADO";

/** Una entrada del historial de un SKU (fal_product_audit). */
export interface BitacoraEntry {
    id: number;
    sku: string;
    action: string;
    event_type: BitacoraEventType | null;
    fala_action?: string | null;
    fala_feed_id?: string | null;
    fala_request_id?: string | null;
    fala_status?: string | null;
    fala_error?: string | null;
    user_name?: string | null;
    user_email?: string | null;
    created_at: string;
    // Solo con includePayload=1 (columnas pesadas):
    payload_xml?: string | null;
    response_raw?: string | null;
    values_old?: string | null;
    values_new?: string | null;
}

/** Actividad de publicación agregada para el dashboard. */
export interface PublishActivity {
    /** Cuántos SKUs están pending AHORA (enviados, esperando a Falabella). */
    en_proceso_ahora: number;
    /** Conteo crudo por publish_status de fal_skus. */
    estado_actual: Record<string, number>;
    /** Eventos de HOY (día calendario local Chile) por métrica. */
    hoy: {
        enviados: number;
        sincronizados: number;
        con_error: number;
        advertencias: number;
        actualizados: number;
        por_tipo: Record<string, number>;
    };
    /** Feed reciente del día (linkea a la bitácora por-SKU). */
    recent: Array<{
        id: number;
        sku: string;
        action: string;
        event_type: BitacoraEventType | null;
        fala_feed_id?: string | null;
        fala_status?: string | null;
        fala_error?: string | null;
        user_name?: string | null;
        created_at: string;
    }>;
}
