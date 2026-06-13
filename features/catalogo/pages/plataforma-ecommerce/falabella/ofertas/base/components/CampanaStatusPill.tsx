// Pill de estado de campaña / item. Estilo soft/translúcido, consistente con el
// resto del catálogo Falabella.

import React from "react";
import type { CampanaStatus, ItemApplyStatus } from "../types/campana-types";

const CAMPANA_TONE: Record<CampanaStatus, { label: string; cls: string }> = {
    draft:     { label: "Borrador",   cls: "bg-gray-400/20 text-gray-600 ring-gray-500/20" },
    scheduled: { label: "Programada", cls: "bg-blue-500/15 text-blue-700 ring-blue-600/20" },
    active:    { label: "Activa",     cls: "bg-green-500/15 text-green-700 ring-green-600/20" },
    finishing: { label: "Finalizando",cls: "bg-amber-500/15 text-amber-700 ring-amber-600/20" },
    finished:  { label: "Finalizada", cls: "bg-gray-400/20 text-gray-600 ring-gray-500/20" },
    cancelled: { label: "Cancelada",  cls: "bg-gray-400/20 text-gray-600 ring-gray-500/20" },
    error:     { label: "Con error",  cls: "bg-red-500/15 text-red-700 ring-red-600/20" },
};

const ITEM_TONE: Record<ItemApplyStatus, { label: string; cls: string }> = {
    pending:  { label: "Pendiente", cls: "bg-gray-400/20 text-gray-600 ring-gray-500/20" },
    applied:  { label: "Aplicado",  cls: "bg-green-500/15 text-green-700 ring-green-600/20" },
    error:    { label: "Error",     cls: "bg-red-500/15 text-red-700 ring-red-600/20" },
    warning:  { label: "Advertencia", cls: "bg-amber-500/15 text-amber-700 ring-amber-600/20" },
    expired:  { label: "Expirado",  cls: "bg-gray-400/20 text-gray-600 ring-gray-500/20" },
    skipped:  { label: "Omitido",   cls: "bg-gray-400/20 text-gray-600 ring-gray-500/20" },
};

const BASE = "inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold ring-1 ring-inset";

export function CampanaStatusPill({ status }: { status: CampanaStatus }) {
    const m = CAMPANA_TONE[status] ?? CAMPANA_TONE.draft;
    return <span className={`${BASE} ${m.cls}`}>{m.label}</span>;
}

export function ItemStatusPill({ status }: { status: ItemApplyStatus }) {
    const m = ITEM_TONE[status] ?? ITEM_TONE.pending;
    return <span className={`${BASE} ${m.cls}`}>{m.label}</span>;
}
