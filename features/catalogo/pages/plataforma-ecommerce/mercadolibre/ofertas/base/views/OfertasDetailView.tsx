// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/views/OfertasDetailView.tsx
//
// Vista de DETALLE de una oferta/campaña ML. 7 tabs según el mockup
// `campanas-ml.html` y §1.6 del MIGRATION_PLAN:
//   RESUMEN · ÍTEMS · COFINANCIACIÓN · CALENDARIO · PLATAFORMAS · COMENTARIOS · LOGS
//
// Look OMS: EcommercePageHeader + Tabs + ActionButton + EmptyTab.

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import {
    Calendar,
    ChevronLeft,
    DollarSign,
    Globe,
    List,
    RefreshCw,
    Table as TableIcon,
} from "lucide-react";

import { ActionButton } from "@/components/ui";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useOferta } from "../hooks/useOferta";
import { useOfertaItems, type ItemStatusFilter } from "../hooks/useOfertaItems";
import { usePromotionCounts } from "../hooks/usePromotionCounts";
import { useOfertasApi } from "../api/ofertas-api";
import { OfertaResumen } from "../components/OfertaResumen";
import { OfertaItems, type OfertaSearchFound } from "../components/OfertaItems";
import { OfertaCofinanciacion } from "../components/OfertaCofinanciacion";
import { OfertaCalendario } from "../components/OfertaCalendario";
import { OfertaPlataformas } from "../components/OfertaPlataformas";
import { statusOf } from "../helpers/status";
import type { OfertaDetailTab } from "../types/oferta-types";
import { OfertaStatusBadgeSolid } from "../components/OfertaStatusBadge";

const TABS: TabItem[] = [
    { id: "resumen", label: "Resumen", icon: TableIcon },
    { id: "items", label: "Ítems", icon: List },
    { id: "cofinanciacion", label: "Cofinanciación", icon: DollarSign },
    { id: "calendario", label: "Calendario", icon: Calendar },
    { id: "plataformas", label: "Plataformas", icon: Globe },
];

export interface OfertasDetailViewProps {
    ofertaId: string;
    initialTab?: OfertaDetailTab;
}

export function OfertasDetailView({
    ofertaId,
    initialTab = "resumen",
}: OfertasDetailViewProps) {
    const router = useRouter();
    const platform = useEcommercePlatform();
    // Tab persistente por oferta — al volver del listado a la misma oferta,
    // el seller queda en el tab donde estaba (ej. "items" o "cofinanciación")
    // en vez de empezar siempre en "resumen".
    const [tab, setTab] = useSessionStorageState<OfertaDetailTab>(
        `ofertas.detail.tab.${platform.exportPrefix}.${ofertaId}`,
        initialTab,
    );

    const { oferta, loading, error, notFound, reload } = useOferta(ofertaId);
    const api = useOfertasApi();

    // `promoId` para listar items / contar; `officialId` para el match de la
    // búsqueda (la promo cruda devuelve ids como `C-MLC…`/`P-MLC…`).
    const promoId = oferta?.official_id ?? oferta?.id ?? null;
    const officialId = oferta?.official_id ?? null;
    const promoType = oferta?.type ?? null;

    // Status server-side de la tab Ítems: Activos / Pausados (default activos).
    const [statusItem, setStatusItem] = useState<ItemStatusFilter>("active");

    // Conteos del header — INDEPENDIENTES de los items cargados (limit=1 cacheado).
    const counts = usePromotionCounts(promoId, promoType);

    // Items se fetchean APARTE — la campaña que devuelve `useOferta` viene con
    // `skus: []` siempre porque `buildCampaignFromEnrollment` solo guarda el
    // count. Este hook pagina server-side por status + cross-ref con catalog.
    const itemsResult = useOfertaItems({
        promoId,
        type: promoType,
        statusItem,
    });

    // ── Búsqueda desacoplada (catálogo → promociones del item) ────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<
        ReadonlyArray<OfertaSearchFound> | null
    >(null);

    const clearSearch = useCallback(() => {
        setSearchResults(null);
        setSearchError(null);
        setSearching(false);
    }, []);

    const handleSearch = useCallback(async () => {
        const q = searchQuery.trim();
        if (!q) {
            clearSearch();
            return;
        }
        setSearching(true);
        setSearchError(null);
        try {
            const matches = await api.searchProductos(q);
            const found: OfertaSearchFound[] = [];
            // Cap a 5 para no quemar llamadas — read-only GET por item.
            for (const match of matches.slice(0, 5)) {
                if (!match.itemId) continue;
                const { results } = await api.listItemPromotions(match.itemId);
                const here = results.find(
                    (p) => p.id === promoId || p.id === officialId,
                );
                if (here) found.push({ match, promo: here });
            }
            setSearchResults(found);
        } catch (e) {
            setSearchError(
                (e as Error)?.message ?? "Error al buscar el producto",
            );
            setSearchResults(null);
        } finally {
            setSearching(false);
        }
    }, [api, searchQuery, promoId, officialId, clearSearch]);

    const handleBack = useCallback(() => {
        router.push(`${platform.basePath}/ofertas`);
    }, [platform.basePath, router]);

    const handleReload = useCallback(async () => {
        await Promise.allSettled([
            reload(),
            itemsResult.reload(),
            counts.reload(),
        ]);
    }, [reload, itemsResult, counts]);

    // NOTA: ML no expone pause/resume/delete a nivel de campaña. Esas acciones
    // deben hacerse por ítem (opt-out con DELETE /seller-promotions/items/:id),
    // y requieren confirmación explícita del usuario por item (regla
    // §"Destructive calls" de pim-service/CLAUDE.md). Los botones se omiten
    // en V1 — ítems individuales se gestionan desde la tab ÍTEMS.

    if (notFound) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-120px)]">
                <EcommercePageHeader
                    eyebrow={`${platform.name} · Campaña`}
                    title="No encontrada"
                    actions={
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={handleBack}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Volver a Ofertas
                        </ActionButton>
                    }
                />
                <div className="flex-1 bg-gray-100 px-6 py-10 text-center">
                    <p className="text-sm text-gray-500">
                        La campaña <code>{ofertaId}</code> no existe o no la pudimos
                        encontrar.
                    </p>
                </div>
            </div>
        );
    }

    const status = oferta ? statusOf(oferta) : "draft";
    const title = oferta?.name ?? (loading ? "Cargando…" : `Campaña ${ofertaId}`);

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Campaña`}
                title={title}
                customBadge={
                    oferta ? <OfertaStatusBadgeSolid status={status} /> : undefined
                }
                actions={
                    <>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={handleBack}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Volver
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={handleReload}
                            disabled={loading || itemsResult.initialLoading}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refrescar
                        </ActionButton>
                    </>
                }
            />

            <div className="bg-white px-6 border-b border-gray-200">
                <Tabs
                    tabs={TABS}
                    value={tab}
                    onChange={(id) => setTab(id as OfertaDetailTab)}
                />
            </div>

            {error && (
                <div className="mx-6 mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="flex-1 bg-gray-100">
                {loading && !oferta && (
                    <div className="px-6 py-10 text-center text-gray-400 text-sm">
                        Cargando campaña…
                    </div>
                )}

                {oferta && tab === "resumen" && <OfertaResumen oferta={oferta} />}
                {oferta && tab === "items" && (
                    <OfertaItems
                        items={itemsResult.items}
                        initialLoading={itemsResult.initialLoading}
                        loadingMore={itemsResult.loadingMore}
                        error={itemsResult.error}
                        hasMore={itemsResult.hasMore}
                        onLoadMore={itemsResult.loadMore}
                        onReload={itemsResult.reload}
                        counts={counts.counts}
                        statusItem={statusItem}
                        onChangeStatus={setStatusItem}
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        onSearchSubmit={handleSearch}
                        onSearchClear={clearSearch}
                        searching={searching}
                        searchError={searchError}
                        searchResults={searchResults}
                    />
                )}
                {oferta && tab === "cofinanciacion" && (
                    <OfertaCofinanciacion
                        oferta={oferta}
                        cofinanciacion={itemsResult.cofinanciacion}
                        loading={itemsResult.initialLoading || itemsResult.loadingMore}
                        error={itemsResult.error}
                    />
                )}
                {oferta && tab === "calendario" && <OfertaCalendario oferta={oferta} />}
                {oferta && tab === "plataformas" && (
                    <OfertaPlataformas
                        oferta={oferta}
                        itemsCount={counts.counts?.inscritos ?? itemsResult.items.length}
                    />
                )}
            </div>
        </div>
    );
}
