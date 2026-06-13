// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/OfertaPlataformas.tsx
//
// Tab "PLATAFORMAS" del detail view. En V1 solo ML.
//
// Información mostrada:
//   - Canal (Mercado Libre Chile, fijo — el subárbol es MLC-only)
//   - Estado de sincronización derivado de `statusOf(oferta)` (no hardcoded)
//   - Official campaign ID de ML
//   - SKUs inscritos (con count si se cargaron los items)
//
// Falabella + VTEX se mantienen como placeholders porque tienen flows propios.
//
// Cambio respecto a la versión anterior: ya no hay hardcodes de cuenta
// ("Mimbral SpA · #3214") ni de status ("Sincronizado con ML"). Todo se deriva.

import { Card } from "@/components/ui";
import { FieldRow } from "../../../../_shared/ui";
import { statusOf } from "../helpers/status";
import { STATUS_LABEL } from "../helpers/status";
import type { Campaign, CampaignStatus } from "../types/oferta-types";

export interface OfertaPlataformasProps {
    oferta: Campaign;
    /** Cantidad real de ítems inscritos (del hook `useOfertaItems`). */
    itemsCount?: number;
}

/**
 * Cómo se mapea el status de la campaña al chip de sincronización del canal.
 *
 * - active / scheduled  → "Sincronizado con ML"     (verde)
 * - paused              → "Pausada en ML"           (ámbar)
 * - ended               → "Finalizada en ML"        (gris)
 * - draft               → "No publicada todavía"    (gris)
 */
function syncBadge(status: CampaignStatus): { label: string; cls: string } {
    if (status === "active" || status === "scheduled") {
        return {
            label: "Sincronizado con ML",
            cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        };
    }
    if (status === "paused") {
        return {
            label: "Pausada en ML",
            cls: "bg-amber-50 text-amber-700 ring-amber-200",
        };
    }
    if (status === "ended") {
        return {
            label: "Finalizada en ML",
            cls: "bg-gray-100 text-gray-700 ring-gray-200",
        };
    }
    return {
        label: "No publicada todavía",
        cls: "bg-gray-100 text-gray-700 ring-gray-200",
    };
}

export function OfertaPlataformas({ oferta, itemsCount }: OfertaPlataformasProps) {
    const status = statusOf(oferta);
    const badge = syncBadge(status);
    const skusInscritos = itemsCount ?? oferta.skus_count ?? 0;

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            {/* MercadoLibre — siempre presente */}
            <Card title="MercadoLibre">
                <FieldRow label="Canal">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-gray-900">Mercado Libre Chile</span>
                    </div>
                </FieldRow>
                <FieldRow label="Estado">
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${badge.cls}`}
                    >
                        {badge.label}
                    </span>
                </FieldRow>
                <FieldRow label="Status interno">
                    <span className="text-xs uppercase tracking-wider text-gray-500">
                        {STATUS_LABEL[status]}
                    </span>
                </FieldRow>
                {oferta.official_id && (
                    <FieldRow label="Official campaign ID">
                        <code className="text-xs text-gray-700 tabular-nums">
                            {oferta.official_id}
                        </code>
                    </FieldRow>
                )}
                <FieldRow label="SKUs inscritos">
                    <span className="tabular-nums text-gray-900">
                        {skusInscritos.toLocaleString("es-CL")}
                    </span>
                </FieldRow>
            </Card>

            {/* Falabella — placeholder (V2) */}
            <Card title="Falabella">
                <div className="text-gray-500 text-sm">
                    Falabella tiene un sistema de campañas distinto al de ML. El
                    soporte multi-canal de campañas es <strong>backlog V2</strong>{" "}
                    según el plan (§1.6).
                </div>
            </Card>

            {/* VTEX — placeholder (managed) */}
            <Card title="VTEX">
                <div className="text-gray-500 text-sm">
                    VTEX gestiona sus promociones desde su propio admin. Esta vista
                    no aplica para ese canal.
                </div>
            </Card>
        </div>
    );
}
