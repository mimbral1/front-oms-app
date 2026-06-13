// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/views/AtributosDetailView.tsx
//
// Vista de DETALLE de un atributo. Tabs: SUMMARY · PLATFORMS · COMMENTS · LOGS.
// SUMMARY funcional; el resto monta `<TabPlaceholder/>` con descripción.
//
// El mockup origen es `Mimbral Mercadolibre/atributos.html` (SUMMARY listo, 3
// placeholders). Las tabs M2 (PLATFORMS, COMMENTS, LOGS) se completan después.

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
    Table,
    Layers,
    MessageSquare,
    Clock,
    CheckCircle,
    Save,
    XCircle,
} from "lucide-react";
import {
    JanisTopBar,
    JanisTabs,
    PillBtn,
    TabPlaceholder,
    type JanisTabsItem,
} from "../../../../_shared/janis";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useAtributo } from "../hooks/useAtributo";
import { AtributoSummary } from "../components/AtributoSummary";
import type { AtributoDetailTab } from "../types/atributo-types";

export interface AtributosDetailViewProps {
    /** ID del atributo viene del `[id]` de la ruta dinámica. */
    atributoId: string;
    /** Tab inicial. Default `summary`. */
    initialTab?: AtributoDetailTab;
}

const TABS: JanisTabsItem<AtributoDetailTab>[] = [
    { id: "summary", label: "SUMMARY", icon: <Table className="w-4 h-4" /> },
    { id: "platforms", label: "PLATFORMS", icon: <Layers className="w-4 h-4" /> },
    { id: "comments", label: "COMMENTS", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "logs", label: "LOGS", icon: <Clock className="w-4 h-4" /> },
];

export function AtributosDetailView({
    atributoId,
    initialTab = "summary",
}: AtributosDetailViewProps) {
    const router = useRouter();
    const platform = useEcommercePlatform();
    const [tab, setTab] = useState<AtributoDetailTab>(initialTab);

    const {
        atributo,
        draft,
        dirty,
        loading,
        saving,
        error,
        setField,
        save,
        discard,
    } = useAtributo(atributoId);

    const handleCancel = useCallback(() => {
        if (dirty) {
            const ok = window.confirm("Hay cambios sin guardar. ¿Descartar?");
            if (!ok) return;
            discard();
        }
        router.push(`${platform.basePath}/atributos`);
    }, [dirty, discard, platform.basePath, router]);

    const handleSave = useCallback(async () => {
        const ok = await save();
        if (ok) {
            // No-op visual — el draft se sincroniza con atributo dentro del hook.
            // Podríamos mostrar un toast acá si ya está el ToastProvider montado.
        }
    }, [save]);

    const handleApply = useCallback(async () => {
        await save();
    }, [save]);

    const handleSaveAndNew = useCallback(async () => {
        const ok = await save();
        if (ok) router.push(`${platform.basePath}/atributos/nuevo`);
    }, [platform.basePath, router, save]);

    const title = atributo?.nombre || (loading ? "Cargando…" : `Atributo ${atributoId}`);
    const isActive = atributo?.activo ?? false;

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <JanisTopBar
                eyebrow={`${platform.name} · Atributo`}
                title={title}
                badge={
                    atributo
                        ? isActive
                            ? { label: "Activo", tone: "active" }
                            : { label: "Inactivo", tone: "paused" }
                        : undefined
                }
                actions={
                    <>
                        <PillBtn
                            variant="success-outline"
                            disabled={!dirty || saving}
                            onClick={handleApply}
                            icon={<CheckCircle className="w-4 h-4" />}
                        >
                            {saving ? "Aplicando…" : "Aplicar"}
                        </PillBtn>
                        <PillBtn
                            variant="success"
                            disabled={!dirty || saving}
                            onClick={handleSave}
                            icon={<Save className="w-4 h-4" />}
                        >
                            {saving ? "Guardando…" : "Guardar"}
                        </PillBtn>
                        <PillBtn
                            variant="primary"
                            disabled={!dirty || saving}
                            onClick={handleSaveAndNew}
                        >
                            Guardar & Crear nuevo
                        </PillBtn>
                        <PillBtn
                            variant="ghost"
                            onClick={handleCancel}
                            icon={<XCircle className="w-4 h-4" />}
                        >
                            Cancelar
                        </PillBtn>
                    </>
                }
            />

            <JanisTabs<AtributoDetailTab>
                active={tab}
                onChange={setTab}
                items={TABS}
            />

            {/* Error banner */}
            {error && (
                <div className="mx-6 mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-[12.5px] text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="flex-1 bg-[#f3f4f6]">
                {tab === "summary" && (
                    <AtributoSummary draft={draft} onChange={setField} loading={loading} />
                )}
                {tab === "platforms" && (
                    <TabPlaceholder
                        tabName="PLATFORMS"
                        icon={<Layers className="w-5 h-5" />}
                        description="Mapeos de este atributo en MercadoLibre, Falabella y VTEX. Sustituye el flujo de Mapeos del monolito (atributos.html → tabs Mapeos ML/Falabella/VTEX)."
                        ticket={<>Pendiente · Fase 2 M2</>}
                    />
                )}
                {tab === "comments" && (
                    <TabPlaceholder
                        tabName="COMMENTS"
                        icon={<MessageSquare className="w-5 h-5" />}
                        description="Hilo de comentarios del equipo sobre este atributo. Backend endpoint TBD — pim-service no expone /comentarios todavía."
                        ticket={<>Pendiente · backlog backend</>}
                    />
                )}
                {tab === "logs" && (
                    <TabPlaceholder
                        tabName="LOGS"
                        icon={<Clock className="w-5 h-5" />}
                        description="Auditoría de cambios: quién editó qué y cuándo. Requiere agregar trigger de auditoría en CATALOGO_MAESTRO_DB → tabla atributos."
                        ticket={<>Pendiente · backlog backend</>}
                    />
                )}
            </div>
        </div>
    );
}
