export interface CampoBasico {
    valor: string | number | boolean | null;
    editable: boolean;
    tipo: "text" | "number" | "textarea" | "badge" | "boolean" | string;
    razon?: string;
    advertencia?: string;
}

export interface ProductoAtributo {
    id: string;
    nombre: string;
    valor: string | number | boolean | string[] | null;
    editable: boolean;
    requerido: boolean;
    faltante: boolean;
    tipo: "text" | "number" | "boolean" | "select" | string;
    opciones?: string[] | null;
    prioridad?: string;
    fill_priority?: number;
    es_variante?: boolean;
    multivaluado?: boolean;
    /** Texto de ayuda del marketplace (incluye unidad/ejemplo, ej. "...Example: 34 cm"). */
    descripcion?: string | null;
    /** Ejemplo de valor esperado, si el marketplace lo expone aparte. */
    ejemplo?: string | null;
    /** Advertencia (ej. "Atributo requerido sin completar - afecta content score"). */
    advertencia?: string | null;
}

export interface ProductDetail {
    sku: string;
    marketplace: string;
    item_id: string;
    url_producto?: string;
    seller_sku?: string;
    seller_custom_field?: string;
    campos_basicos: Record<string, CampoBasico>;
    atributos?: ProductoAtributo[];
    /**
     * Config de shipping + dimensiones del paquete (parseadas).
     *
     * El frontend lo necesita para la calculadora de margen — los atributos
     * `SELLER_PACKAGE_*` están filtrados del array `atributos` por el
     * backend (tag `hidden` en ML), entonces la única fuente de dims es
     * este campo que viene de `item.shipping.dimensions` (string "HxWxL,gramos")
     * ya parseado.
     */
    shipping?: {
        mode?: string | null;
        free_shipping?: boolean | null;
        logistic_type?: string | null;
        /** String crudo formato ML: "HxWxL,gramos". Útil para debugging. */
        dimensions_raw?: string | null;
        /** Dimensiones parseadas. `null` si ML no expuso el paquete. */
        dimensions?: {
            largo: number;  // cm
            ancho: number;  // cm
            alto: number;   // cm
            pesoKg: number; // kg (gramos / 1000)
        } | null;
    } | null;
    imagenes?: {
        lista?: string[];
        total?: number;
        maximo?: number;
        minimo_recomendado?: number;
        advertencia?: string;
    };
    meta?: {
        last_updated?: string;
        tiene_ventas?: boolean;
        sold_quantity?: number;
        health?: number;
        category_id?: string;
        // ── Ítem hijo de variación (Gap 1 en normalize-ml.js) ───────────────
        parent_item_id?: string | null;
        variation_id?: string | null;
        es_hijo_variacion?: boolean;
        // ── Oferta activa (Gap 2 en normalize-ml.js) ────────────────────────
        // El backend combina `deal_ids` del item ML + `seller_promotions` para
        // detectar si la publicación tiene una oferta vigente. Estos campos
        // viajan en el response de `/api/pim/productos/:sku/detalle`.
        tiene_oferta?: boolean;
        deal_ids?: string[];
        oferta_nombre?: string | null;
        /** Precio efectivo (lo que paga el comprador con la oferta aplicada). */
        oferta_precio?: number | null;
        /** Precio "tachado" original antes del descuento. */
        oferta_precio_orig?: number | null;
        /** Descuento como porcentaje 0-100. */
        oferta_pct?: number | null;
        /** Fecha inicio (ISO 8601). */
        oferta_inicio?: string | null;
        /** Fecha fin (ISO 8601). */
        oferta_fin?: string | null;
        /** Tipo de oferta: 'DEAL' | 'PRICE_DISCOUNT' | 'SMART' | etc. */
        oferta_tipo?: string | null;
    };
    /**
     * Moderación oficial de Mercado Libre cuando la publicación está en
     * `under_review`, `paused` por penalidad, `closed` por moderación o
     * `active` con `poor_quality_thumbnail`.
     *
     * Viene del endpoint oficial `/moderations/last_moderation/{itemId}-ITM`
     * con `reason` y `remedy` ya traducidos al idioma del seller. Si el ítem
     * no tiene moderación activa, el campo es `undefined`.
     */
    moderation?: {
        /** Código interno de la regla (ej. `WATERMARK`, `POOR_QUALITY_THUMBNAIL`). */
        name?: string | null;
        /** ID de la moderación. Cambia cuando se resuelve. */
        id?: string | null;
        /** Fecha de creación de la moderación. Formato ISO 8601. */
        date_created?: string | null;
        /** Texto explicativo del motivo, en español/portugués. */
        reason?: string | null;
        /** Texto con la acción recomendada al vendedor. */
        remedy?: string | null;
        /** Evidencias específicas detectadas (sección + texto). */
        evidences?: Array<{
            text_matched?: string;
            section_name?: string;
        }>;
    };
    /**
     * Optimistic locking: versión actual de la fila (`fal_skus.version` /
     * `ml_skus.version`). El editor la lee del detalle y la manda como
     * `expected_version` en el PUT para detectar ediciones concurrentes (409).
     * Falabella la expone siempre (`sanitizeFalaDetalleResponse`); ML según el
     * detalle. Si falta, el backend cae al comportamiento legacy (último gana).
     */
    version?: number;
}
