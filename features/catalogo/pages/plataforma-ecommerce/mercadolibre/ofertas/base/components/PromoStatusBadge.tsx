// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/PromoStatusBadge.tsx
"use client";

import type { ReactNode } from "react";

export type PromoStatusKind =
    | "candidate"
    | "started"
    | "pending"
    | "finished"
    | "standby";

const STYLES: Record<PromoStatusKind, string> = {
    candidate: "bg-blue-50 text-blue-700",
    started: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    finished: "bg-gray-100 text-gray-600",
    standby: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

const LABELS: Record<PromoStatusKind, string> = {
    candidate: "Puede optar",
    started: "Participa",
    pending: "Programada",
    finished: "Finalizada",
    standby: "⏸ stand-by",
};

/** Mapea el `status` crudo de ML al kind de UI. */
export function statusToKind(status: string): PromoStatusKind {
    if (status === "started") return "started";
    if (status === "pending" || status === "sync_requested") return "pending";
    if (status === "finished" || status === "restore_requested") return "finished";
    return "candidate";
}

export function PromoStatusBadge({
    kind,
    children,
}: {
    kind: PromoStatusKind;
    children?: ReactNode;
}) {
    return (
        <span
            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium ${STYLES[kind]}`}
        >
            {children ?? LABELS[kind]}
        </span>
    );
}
