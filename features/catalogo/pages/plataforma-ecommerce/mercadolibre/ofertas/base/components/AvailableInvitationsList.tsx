// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/AvailableInvitationsList.tsx
//
// Grid de cards para campañas disponibles ML (invitaciones).
//
// Look OMS: cards bordered con header padding + ActionButton.

"use client";

import { CheckCircle, Plus, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { asDate, type MLAvailable, type MLFailedInvitation } from "../types/oferta-types";
import { TypeChip } from "./TypeChip";

export interface AvailableInvitationsListProps {
    invitations: ReadonlyArray<MLAvailable>;
    failed: ReadonlyArray<MLFailedInvitation>;
    loading: boolean;
    error: string | null;
    onEnroll?: (invitation: MLAvailable) => void;
    onRetry?: (failed: MLFailedInvitation) => void;
}

export function AvailableInvitationsList({
    invitations,
    failed,
    loading,
    error,
    onEnroll,
    onRetry,
}: AvailableInvitationsListProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm shadow-sm">
                Cargando invitaciones…
            </div>
        );
    }
    if (error) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-rose-600 text-sm shadow-sm">
                Error: {error}
            </div>
        );
    }
    if (invitations.length === 0 && failed.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm shadow-sm">
                Sin invitaciones disponibles en este momento.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Invitaciones disponibles */}
            {invitations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {invitations.map((inv) => (
                        <InvitationCard
                            key={inv.id}
                            invitation={inv}
                            onEnroll={() => onEnroll?.(inv)}
                        />
                    ))}
                </div>
            )}

            {/* Invitaciones con error */}
            {failed.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-rose-700 mb-2">
                        Invitaciones con error de fetch
                    </h3>
                    <div className="space-y-2">
                        {failed.map((f) => (
                            <div
                                key={f.id}
                                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">
                                                {f.name}
                                            </span>
                                            <TypeChip type={f.type} />
                                        </div>
                                        <div className="text-xs text-rose-700 mt-1">
                                            {f.errorCode ? `${f.errorCode}: ` : ""}
                                            {f.errorMessage}
                                        </div>
                                    </div>
                                    <ActionButton
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onRetry?.(f)}
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Reintentar
                                    </ActionButton>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function InvitationCard({
    invitation: inv,
    onEnroll,
}: {
    invitation: MLAvailable;
    onEnroll: () => void;
}) {
    const start = asDate(inv.start_date);
    const end = asDate(inv.end_date);
    const eligible = inv.eligible_skus?.length ?? 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <TypeChip type={inv.type} />
                        {inv.enrolled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Inscrita
                            </span>
                        )}
                        {inv.locked_after_start && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200">
                                No editable post-inicio
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                        {inv.name}
                    </h3>
                    {inv.desc && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {inv.desc}
                        </p>
                    )}
                </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-3">
                <dt className="text-gray-500">Descuento</dt>
                <dd className="text-gray-900 tabular-nums text-right">
                    {inv.min_discount}% – {inv.max_discount}%
                </dd>

                <dt className="text-gray-500">Período</dt>
                <dd className="text-gray-900 tabular-nums text-right">
                    {start ? start.toLocaleDateString("es-CL") : "—"}
                    {" → "}
                    {end ? end.toLocaleDateString("es-CL") : "—"}
                </dd>

                <dt className="text-gray-500">SKUs elegibles</dt>
                <dd className="text-gray-900 tabular-nums text-right">
                    {eligible.toLocaleString("es-CL")}
                </dd>

                {inv.requires_stock && inv.min_stock_required != null && (
                    <>
                        <dt className="text-gray-500">Stock mínimo</dt>
                        <dd className="text-gray-900 tabular-nums text-right">
                            {inv.min_stock_required}
                        </dd>
                    </>
                )}
            </dl>

            <div className="mt-4 flex justify-end">
                <ActionButton
                    variant={inv.enrolled ? "secondary" : "primary"}
                    size="sm"
                    onClick={onEnroll}
                    disabled={eligible === 0}
                >
                    {inv.enrolled ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                        <Plus className="w-3.5 h-3.5" />
                    )}
                    {inv.enrolled ? "Ver inscripción" : "Inscribirme"}
                </ActionButton>
            </div>
        </div>
    );
}
