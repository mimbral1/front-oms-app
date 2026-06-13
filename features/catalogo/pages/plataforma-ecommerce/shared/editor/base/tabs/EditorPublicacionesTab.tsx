// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorPublicacionesTab.tsx
//
// Tab "Publicaciones" del editor ML — lista las N publicaciones del SKU
// (clásica / catálogo / variación) en solo lectura. La primaria tiene "Editar →"
// que salta al tab Info; el resto enlaza a ML. Cero escrituras.
//
// Gemelo de EditorLogsTab: tab auto-contenido, DataTable + estados loading/error/empty.

"use client";

import { useMemo } from "react";
import { ExternalLink, Pencil, RefreshCw, AlertTriangle } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { CopyableText } from "@/components/ui/copyable-text/CopyableText";
import type { EditorPublicacion } from "../types/editor-types";
import "../ml-publication-status"; // efecto secundario: registra el dominio "ml"

/* ── helpers ───────────────────────────────────────────────── */

/** Tipo de publicación (chip rounded-md con borde, idiom OMS — NO pill). */
function tipoOf(p: EditorPublicacion): { label: string; cls: string } {
    if (p.isCatalogListing)
        return { label: "Catálogo", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (p.variationId)
        return { label: "Variación", cls: "bg-orange-50 text-orange-700 border-orange-200" };
    return { label: "Clásica", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
}

const LOGISTICA: Record<string, string> = {
    fulfillment: "FULL",
    self_service: "Flex",
    cross_docking: "Colecta",
    drop_off: "Acordado",
    xd_drop_off: "Acordado",
};
function logisticaLabel(t: string | null): string {
    return t ? LOGISTICA[t] ?? t : "—";
}

/** URL pública best-effort: ML redirige MLC-<dígitos> al permalink real. */
function mlUrl(itemId: string): string {
    return `https://articulo.mercadolibre.cl/MLC-${itemId.replace(/^MLC/i, "")}`;
}

/* ── props ─────────────────────────────────────────────────── */

export interface EditorPublicacionesTabProps {
    publications: EditorPublicacion[];
    loading: boolean;
    error: string | null;
    reload: () => void;
    /** Salta al tab Info (editar la publicación primaria, que es la que carga el editor). */
    onEditarPrimaria: () => void;
}

export function EditorPublicacionesTab({
    publications,
    loading,
    error,
    reload,
    onEditarPrimaria,
}: EditorPublicacionesTabProps) {
    const columns: Column<EditorPublicacion>[] = useMemo(
        () => [
            {
                header: "Tipo",
                accessorKey: "isCatalogListing",
                cell: (p) => {
                    const t = tipoOf(p);
                    return (
                        <span className="inline-flex items-center gap-1.5">
                            <span
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${t.cls}`}
                            >
                                {t.label}
                            </span>
                        </span>
                    );
                },
            },
            {
                header: "Publicación",
                accessorKey: "itemId",
                cell: (p) => (
                    <CopyableText text={p.itemId} className="text-sm text-gray-700">
                        <code className="tabular-nums">{p.itemId}</code>
                    </CopyableText>
                ),
            },
            {
                header: "Estado",
                accessorKey: "itemStatus",
                cell: (p) => (
                    <StatusBadge status={p.itemStatus ?? "inactive"} domain="ml" />
                ),
            },
            {
                header: "Logística",
                accessorKey: "logisticType",
                cell: (p) => (
                    <span className="text-sm text-gray-700">
                        {logisticaLabel(p.logisticType)}
                    </span>
                ),
            },
            {
                header: "Performance",
                accessorKey: "performance",
                cell: (p) =>
                    p.performance ? (
                        <span
                            title={p.performance.level ?? undefined}
                            className="text-sm font-semibold text-emerald-700 tabular-nums"
                        >
                            {p.performance.score}
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400">—</span>
                    ),
            },
            {
                header: "Acción",
                accessorKey: "itemId",
                cell: (p) =>
                    // Guard de editabilidad: solo la primaria QUE NO sea catálogo
                    // ofrece "Editar". Una ficha de catálogo es de solo lectura (la
                    // gestiona ML), aunque por alguna razón quedara marcada primaria.
                    // NO se usa !variationId: una clásica con variaciones tiene
                    // variationId y debe seguir mostrando "Editar".
                    p.isPrimary && !p.isCatalogListing ? (
                        <button
                            type="button"
                            onClick={onEditarPrimaria}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                        >
                            <Pencil className="h-4 w-4" />
                            Editar
                        </button>
                    ) : (
                        <a
                            href={mlUrl(p.itemId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                        >
                            Ver en ML
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    ),
            },
        ],
        [onEditarPrimaria],
    );

    if (loading) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                    <RefreshCw className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando publicaciones…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="bg-rose-50 border-l-4 border-rose-400 p-4 text-rose-700 rounded-md">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-rose-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">
                                Error al cargar las publicaciones
                            </h3>
                            <p className="mt-1 text-sm">{error}</p>
                            <button
                                onClick={reload}
                                className="mt-3 rounded-md bg-rose-100 px-2 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-200"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (publications.length === 0) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-sm text-gray-500">
                    Este SKU no tiene publicaciones en MercadoLibre.
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            <DataTable
                data={publications}
                columns={columns}
                dataType="Publicaciones"
                statusKey="itemStatus"
                rowPaddingY={12}
                rowBgClass="bg-white"
            />
        </div>
    );
}
