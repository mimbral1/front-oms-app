// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/views/ElegibilidadView.tsx
//
// Explorador de elegibilidad de promociones (Ola 3·3c). Read-only.
// Buscas SKU/MLC/nombre → por publicación, a cuántas promos puede optar/participa,
// con detalle expandible + alertas de superposición.

"use client";

import { useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { DataTableExpandable } from "@/components/ui/table/DataTableExpandable";
import type { Column } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { Alert } from "@/components/ui/alert/Alert";
import { CopyableText } from "@/components/ui/copyable-text/CopyableText";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useElegibilidad } from "../hooks/useElegibilidad";
import { PromoStatusBadge, statusToKind } from "../components/PromoStatusBadge";
import { PublicationTypeChip, tipoKindOf } from "../components/PublicationTypeChip";
import type { RawPromotionItem } from "../api/ofertas-api";
import type {
    PublicationEligibility,
    EligibilityWarning,
} from "../types/elegibilidad-types";

/* ── helpers ───────────────────────────────────────────────── */

const clp = (n: number | undefined | null): string =>
    n == null || !Number.isFinite(Number(n))
        ? "—"
        : new Intl.NumberFormat("es-CL", {
              style: "currency",
              currency: "CLP",
              maximumFractionDigits: 0,
          }).format(Number(n));

function rango(p: RawPromotionItem): string {
    if (p.min_discounted_price != null && p.max_discounted_price != null) {
        const sug =
            p.suggested_discounted_price != null
                ? ` · sug. ${clp(p.suggested_discounted_price)}`
                : "";
        return `rango ${clp(p.min_discounted_price)}–${clp(p.max_discounted_price)}${sug}`;
    }
    if (p.price != null && p.price > 0) return clp(p.price);
    return "";
}

const WARNING_UI: Record<
    EligibilityWarning["kind"],
    { variant: "warning" | "info"; text: string }
> = {
    raise_price_drops: {
        variant: "warning",
        text: "Subir el precio del ítem lo saca automáticamente de las ofertas activas (DEAL/co-fondeadas/PRICE_DISCOUNT/SELLER_CAMPAIGN); en co-fondeadas no se puede re-agregar.",
    },
    price_discount_standby: {
        variant: "warning",
        text: "Hay un DEAL activo: un descuento individual (PRICE_DISCOUNT) queda en stand-by hasta que el DEAL termine.",
    },
    meli_all_auto: {
        variant: "info",
        text: "Esta publicación tiene PRICE_MATCHING_MELI_ALL (100% Mercado Libre, automático). Se gestiona desde el panel de ML.",
    },
};

/* ── detalle por publicación ───────────────────────────────── */

function DetallePublicacion({ row }: { row: PublicationEligibility }) {
    const promos: RawPromotionItem[] = [
        ...row.participa,
        ...row.puedeOptar,
        ...row.programada,
    ];
    const standby = row.warnings.some((w) => w.kind === "price_discount_standby");
    return (
        <div className="px-4 pt-2 pb-3">
            {promos.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">
                    Esta publicación no tiene promociones asociadas.
                </div>
            ) : (
                <div className="divide-y divide-dashed divide-gray-100">
                    {promos.map((p, i) => (
                        <div
                            key={`${p.id ?? p.type ?? "promo"}-${i}`}
                            className="flex items-center gap-2.5 py-2 text-[13px]"
                        >
                            <span className="font-semibold text-gray-800 min-w-[190px]">
                                {p.type ?? "—"}
                            </span>
                            <PromoStatusBadge kind={statusToKind(p.status)} />
                            {standby && p.type === "PRICE_DISCOUNT" && (
                                <PromoStatusBadge kind="standby" />
                            )}
                            <span className="ml-auto text-gray-600 text-xs tabular-nums">
                                {rango(p)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-3 space-y-2">
                {row.warnings.map((w) => {
                    const ui = WARNING_UI[w.kind];
                    return (
                        <Alert key={w.kind} variant={ui.variant}>
                            {ui.text}
                        </Alert>
                    );
                })}
            </div>
        </div>
    );
}

/* ── vista ─────────────────────────────────────────────────── */

export function ElegibilidadView() {
    const platform = useEcommercePlatform();
    const {
        query, setQuery, results, selectedSku, selectedTitulo,
        searching, loading, error, eligibility, search, selectProduct, reload,
    } = useElegibilidad();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const columns: Column<PublicationEligibility>[] = [
        {
            header: "Publicación",
            accessorKey: "publication",
            cell: (r) => {
                return (
                    <span className="inline-flex items-center gap-2">
                        <PublicationTypeChip
                            kind={tipoKindOf(r.publication)}
                            isPrimary={r.publication.isPrimary}
                        />
                        <CopyableText text={r.publication.itemId} className="text-sm text-gray-700">
                            <code className="tabular-nums">{r.publication.itemId}</code>
                        </CopyableText>
                    </span>
                );
            },
        },
        {
            header: "Estado",
            accessorKey: "publication",
            cell: (r) => (
                <StatusBadge status={r.publication.itemStatus ?? "inactive"} domain="ml" />
            ),
        },
        {
            header: "Puede optar",
            accessorKey: "puedeOptar",
            cell: (r) => (
                <span className="font-extrabold text-base text-blue-700 tabular-nums">
                    {r.puedeOptar.length}
                </span>
            ),
        },
        {
            header: "Participa",
            accessorKey: "participa",
            cell: (r) => (
                <span
                    className={`font-extrabold text-base tabular-nums ${
                        r.participa.length > 0 ? "text-emerald-700" : "text-gray-300"
                    }`}
                >
                    {r.participa.length}
                </span>
            ),
        },
        {
            header: "",
            accessorKey: "publication",
            cell: (r) => (
                <span className="text-gray-400">
                    {expandedId === r.publication.itemId ? "▼" : "▶"}
                </span>
            ),
        },
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Ofertas`}
                title="Elegibilidad de promociones"
                actions={
                    selectedSku ? (
                        <ActionButton variant="secondary" size="sm" onClick={reload} disabled={loading}>
                            <RefreshCw className="w-4 h-4" />
                            {loading ? "Cargando…" : "Refrescar"}
                        </ActionButton>
                    ) : undefined
                }
            />

            <div className="flex-1 bg-gray-100 px-6 pt-6 pb-10 space-y-4">
                <form
                    onSubmit={(e) => { e.preventDefault(); void search(); }}
                    className="flex items-center gap-2"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar SKU, MLC o nombre…"
                            className="w-96 pl-9 pr-3 h-9 text-sm bg-white border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <ActionButton variant="primary" size="sm" type="submit" disabled={searching}>
                        {searching ? "Buscando…" : "Buscar"}
                    </ActionButton>
                </form>

                {error && (
                    <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                        <strong>Error:</strong> {error}{" "}
                        {selectedSku && (
                            <button onClick={() => void reload()} className="underline ml-1">Reintentar</button>
                        )}
                    </div>
                )}

                {!selectedSku && results.length > 1 && (
                    <div className="bg-white rounded-xl border border-gray-200 divide-y">
                        {results.map((m) => (
                            <button
                                key={m.sku}
                                onClick={() => void selectProduct(m)}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <code className="text-sm text-blue-700 tabular-nums">{m.sku}</code>
                                <span className="text-sm text-gray-700 truncate">{m.titulo}</span>
                            </button>
                        ))}
                    </div>
                )}

                {!selectedSku && !searching && results.length === 0 && query.trim() !== "" && (
                    <div className="text-sm text-gray-500">Sin coincidencias para "{query.trim()}".</div>
                )}

                {selectedSku && (
                    <>
                        <div className="text-sm text-gray-600">
                            <strong className="text-gray-900 tabular-nums">{selectedSku}</strong>
                            {selectedTitulo ? ` · ${selectedTitulo}` : ""} —{" "}
                            {eligibility.length} publicación{eligibility.length !== 1 ? "es" : ""}
                        </div>
                        {loading ? (
                            <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                                <RefreshCw className="w-5 h-5 inline animate-spin mr-2" />
                                Cargando elegibilidad…
                            </div>
                        ) : eligibility.length === 0 ? (
                            <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-sm text-gray-500">
                                Este SKU no tiene publicaciones en MercadoLibre.
                            </div>
                        ) : (
                            <DataTableExpandable
                                data={eligibility}
                                columns={columns}
                                expandedId={expandedId}
                                onToggle={(item) =>
                                    setExpandedId((cur) =>
                                        cur === item.publication.itemId ? null : item.publication.itemId,
                                    )
                                }
                                renderDetail={(item) => <DetallePublicacion row={item} />}
                                getRowId={(item) => item.publication.itemId}
                                showStatusBorder={false}
                                rowPaddingY={12}
                                rowBgClass="bg-white"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
