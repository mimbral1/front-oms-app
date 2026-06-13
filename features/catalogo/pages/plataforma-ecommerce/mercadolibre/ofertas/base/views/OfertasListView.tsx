// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/views/OfertasListView.tsx
//
// Vista principal del listado de ofertas/campañas ML. 3 sub-tabs:
//   - ACTIVAS: campañas creadas/inscritas con status active|scheduled|paused
//   - FINALIZADAS: campañas con status ended
//   - DISPONIBLES: invitaciones ML que el seller puede aceptar
//
// Look OMS: EcommercePageHeader + Tabs + ActionButton.

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, Flag, Plus, RefreshCw, Sparkles, Target } from "lucide-react";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";

import { ActionButton } from "@/components/ui";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useOfertasList } from "../hooks/useOfertasList";
import { CampaignTable } from "../components/CampaignTable";
import { AvailableInvitationsList } from "../components/AvailableInvitationsList";
import type { OfertasTab, Campaign, MLAvailable } from "../types/oferta-types";

const TABS: TabItem[] = [
    { id: "activas", label: "Activas", icon: Flag },
    { id: "finalizadas", label: "Finalizadas", icon: Clock },
    { id: "disponibles", label: "Disponibles ML", icon: Sparkles },
];

export function OfertasListView() {
    const platform = useEcommercePlatform();
    const router = useRouter();
    // Tab persistente por marketplace — al volver al listado el seller queda
    // en el mismo tab donde estaba (Activas / Finalizadas / Disponibles).
    const [tab, setTab] = useSessionStorageState<OfertasTab>(
        `ofertas.list.tab.${platform.exportPrefix}`,
        "activas",
    );

    const {
        activas,
        finalizadas,
        disponibles,
        failed,
        loading,
        error,
        reload,
    } = useOfertasList();

    const goToDetail = useCallback(
        (camp: Campaign) => {
            router.push(`${platform.basePath}/ofertas/${encodeURIComponent(camp.id)}`);
        },
        [platform.basePath, router],
    );

    const goToNueva = useCallback(() => {
        router.push(`${platform.basePath}/ofertas/nueva`);
    }, [platform.basePath, router]);

    const goToElegibilidad = useCallback(() => {
        router.push(`${platform.basePath}/ofertas/elegibilidad`);
    }, [platform.basePath, router]);

    const handleEnroll = useCallback(
        (inv: MLAvailable) => {
            // Por ahora, la inscripción a una invitación abre el wizard
            // pre-rellenado con el tipo + nombre. En la próxima iteración,
            // se monta un MLEnrollModal específico.
            const q = new URLSearchParams({
                from: "invitation",
                inviteId: inv.id,
                type: inv.type,
                name: inv.name,
            });
            router.push(`${platform.basePath}/ofertas/nueva?${q.toString()}`);
        },
        [platform.basePath, router],
    );

    const totalActivas = activas.length;
    const totalFinalizadas = finalizadas.length;
    const totalDisponibles = disponibles.length + failed.length;

    // Badge counts en los tabs.
    const tabsWithCounts: TabItem[] = TABS.map((t) => ({
        ...t,
        badgeCount:
            t.id === "activas"
                ? totalActivas
                : t.id === "finalizadas"
                  ? totalFinalizadas
                  : t.id === "disponibles"
                    ? totalDisponibles
                    : undefined,
    }));

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Campañas`}
                title="Ofertas"
                badge={
                    loading
                        ? undefined
                        : tab === "activas" && totalActivas > 0
                          ? { label: `${totalActivas} activas`, tone: "live" }
                          : tab === "finalizadas" && totalFinalizadas > 0
                            ? { label: `${totalFinalizadas} finalizadas`, tone: "paused" }
                            : tab === "disponibles" && totalDisponibles > 0
                              ? {
                                    label: `${totalDisponibles} disponibles`,
                                    tone: "draft",
                                }
                              : undefined
                }
                actions={
                    <>
                        <ActionButton variant="secondary" size="sm" onClick={goToElegibilidad}>
                            <Target className="w-4 h-4" />
                            Elegibilidad
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={reload}
                            disabled={loading}
                        >
                            <RefreshCw className="w-4 h-4" />
                            {loading ? "Cargando…" : "Refrescar"}
                        </ActionButton>
                        <ActionButton
                            variant="primary"
                            size="sm"
                            onClick={goToNueva}
                        >
                            <Plus className="w-4 h-4" />
                            Nueva oferta
                        </ActionButton>
                    </>
                }
            />

            <div className="bg-white px-6 border-b border-gray-200">
                <Tabs
                    tabs={tabsWithCounts}
                    value={tab}
                    onChange={(id) => setTab(id as OfertasTab)}
                />
            </div>

            <div className="flex-1 bg-gray-100 px-6 py-6">
                {tab === "activas" && (
                    <CampaignTable
                        rows={activas}
                        loading={loading}
                        error={error}
                        onRowClick={goToDetail}
                    />
                )}
                {tab === "finalizadas" && (
                    <CampaignTable
                        rows={finalizadas}
                        loading={loading}
                        error={error}
                        onRowClick={goToDetail}
                    />
                )}
                {tab === "disponibles" && (
                    <AvailableInvitationsList
                        invitations={disponibles}
                        failed={failed}
                        loading={loading}
                        error={error}
                        onEnroll={handleEnroll}
                        onRetry={() => reload()}
                    />
                )}
            </div>
        </div>
    );
}
