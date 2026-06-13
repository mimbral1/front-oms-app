// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/views/EditorView.tsx
//
// Vista raíz del Editor de producto (Fase 7 del MIGRATION_PLAN).
//
// Layout: tabs OMS al tope + contenido por tab. 6 tabs simplificadas match
// al legacy `editar.html` (no las 9 del mockup `ml_producto_editor.html`):
//
//   1. Info        → campos_basicos del backend (titulo/precio/stock/marca/etc)
//   2. Imágenes    → grid (placeholder pending port nativo)
//   3. Descripción → textarea editable
//   4. Atributos   → dynamic fields (placeholder pending port nativo)
//   5. Calidad     → score del endpoint /calidad (placeholder pending)
//   6. Logs        → auditoría desde MELICATALOG_DB.audit_log (al final)
//
// Eliminadas las 4 tabs del mockup que NO existen en el legacy real:
// Plataformas, Relacionado, Comentarios — fueron design ideas que nunca
// llegaron a producción.

"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import {
    CheckCircle,
    Clock,
    FileText,
    Flag,
    Image as ImageIcon,
    Info,
    Layers,
    RefreshCw,
    Save,
    Sparkles,
    Tag,
    X,
} from "lucide-react";

import { ActionButton } from "@/components/ui";
import { SimpleModal } from "@/components/ui/modal";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { resolveMarketplaceKey } from "../../../productos/base/utils/marketplace";
import { EditorResumenTab } from "../tabs/EditorResumenTab";
import { EditorDescripcionSection } from "../tabs/EditorDescripcionSection";
import { EditorImagenesSection } from "../tabs/EditorImagenesSection";
import { EditorAtributosSection } from "../tabs/EditorAtributosSection";
import { EditorCalidadSection } from "../tabs/EditorCalidadSection";
import { EditorLogsTab } from "../tabs/EditorLogsTab";
import { EditorPublicacionesTab } from "../tabs/EditorPublicacionesTab";
import { usePublicaciones } from "../hooks/usePublicaciones";
import { useEditorState } from "../hooks/useEditorState";
import { FeedStatusCard } from "../../../feeds/base/FeedStatusCard";
import { PayloadDrawer } from "../../../publicar/base/components/PayloadDrawer";
import type { EditorTabId } from "../types/editor-types";

const TABS: TabItem[] = [
    { id: "info", label: "Info", icon: Info },
    { id: "imagenes", label: "Imágenes", icon: ImageIcon },
    { id: "descripcion", label: "Descripción", icon: FileText },
    { id: "atributos", label: "Atributos", icon: Tag },
    { id: "calidad", label: "Calidad", icon: Sparkles },
    { id: "logs", label: "Logs", icon: Clock },
];

export interface EditorViewProps {
    /** SKU del producto a editar. Viene del param de la ruta. */
    sku: string;
}

export function EditorView({ sku }: EditorViewProps) {
    const router = useRouter();
    const platform = useEcommercePlatform();
    // Tab persistente por SKU + marketplace — al volver del listado al mismo
    // SKU, el seller queda en el tab donde estaba (ej. "atributos") en vez
    // de empezar siempre en "info".
    const [tab, setTab] = useSessionStorageState<EditorTabId>(
        `editor.tab.${platform.exportPrefix}.${sku}`,
        "info",
    );

    const mlKey = resolveMarketplaceKey(platform.name);
    const {
        publications,
        loading: pubsLoading,
        error: pubsError,
        reload: pubsReload,
    } = usePublicaciones(sku, { enabled: mlKey === "ml" });

    const {
        product,
        calidad,
        calidadLoading,
        editFields,
        editAttrs,
        editImagenes,
        loading,
        saving,
        error,
        saveError,
        dirty,
        draftPayload,
        reloadCalidad,
        updateField,
        updateAttr,
        setImagenes,
        save,
        reset,
    } = useEditorState(sku);

    /** feed_id del último ProductUpdate Falabella (async) → FeedStatusCard. */
    const [savedFeedId, setSavedFeedId] = useState<string | null>(null);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [payloadOpen, setPayloadOpen] = useState(false);

    const handleGuardar = useCallback(async () => {
        setSavedFeedId(null);
        const result = await save();
        // Falabella devuelve feed_id (async). ML/VTEX no → la card no se monta.
        if (result?.feed_id) setSavedFeedId(String(result.feed_id));
    }, [save]);

    const handleGuardarYNuevo = useCallback(async () => {
        const result = await save();
        if (result) {
            router.push(`${platform.basePath}/catalogo`);
        }
    }, [platform.basePath, router, save]);

    const handleCancelar = useCallback(() => {
        if (dirty) {
            setCancelConfirmOpen(true);
            return;
        }
        router.push(`${platform.basePath}/catalogo`);
    }, [dirty, platform.basePath, router]);

    const confirmCancelar = useCallback(() => {
        reset();
        setCancelConfirmOpen(false);
        router.push(`${platform.basePath}/catalogo`);
    }, [platform.basePath, reset, router]);

    // Tab "Publicaciones" solo para ML; se inserta antes de "Logs" con el conteo.
    // Declarado junto al resto de hooks (antes de los early-return) para no
    // violar las Rules of Hooks — no depende de `product`.
    const tabs = useMemo<TabItem[]>(() => {
        if (mlKey !== "ml") return TABS;
        const out = [...TABS];
        const logsIdx = out.findIndex((t) => t.id === "logs");
        const pubTab: TabItem = {
            id: "publicaciones",
            label: "Publicaciones",
            icon: Layers,
            badgeCount: publications.length,
        };
        if (logsIdx >= 0) out.splice(logsIdx, 0, pubTab);
        else out.push(pubTab);
        return out;
    }, [mlKey, publications.length]);

    // ── Loading state ────────────────────────────────────────────
    if (loading && !product) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-120px)]">
                <EcommercePageHeader
                    eyebrow={`${platform.name} · Editor`}
                    title="Cargando producto…"
                />
                <div className="flex-1 bg-gray-100 grid place-items-center text-sm text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
            </div>
        );
    }

    // ── Error state — no se pudo cargar ──────────────────────────
    if (!product) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-120px)]">
                <EcommercePageHeader
                    eyebrow={`${platform.name} · Editor`}
                    title="Producto no encontrado"
                    actions={
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`${platform.basePath}/catalogo`)}
                        >
                            Volver al catálogo
                        </ActionButton>
                    }
                />
                <div className="flex-1 bg-gray-100 px-6 py-10">
                    <div className="bg-white rounded-xl border border-rose-200 px-4 py-3 text-sm text-rose-700 max-w-xl mx-auto">
                        <strong>Error:</strong> {error ?? `SKU ${sku} no existe`}
                        <div className="mt-2 text-xs text-rose-600">
                            Endpoint:{" "}
                            <code>
                                GET /api/pim/productos/{sku}/detalle?marketplace=
                                {platform.name.toLowerCase()}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Header data — leer del draft o snapshot ──────────────────
    const tituloDraft = String(
        editFields.titulo ?? product.campos_basicos?.titulo?.valor ?? "",
    );
    const estadoDraft = String(
        editFields.estado ?? product.campos_basicos?.estado?.valor ?? "",
    ).toLowerCase();
    const isActive =
        estadoDraft.includes("activ") ||
        estadoDraft === "active" ||
        estadoDraft === "y";

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`SKU ${product.sku}`}
                title={tituloDraft || `Producto ${sku}`}
                badge={{
                    label: isActive ? "Activo" : "Inactivo",
                    tone: isActive ? "active" : "paused",
                }}
                actions={
                    <>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setPayloadOpen(true)}
                            disabled={!draftPayload || saving}
                        >
                            <FileText className="w-4 h-4" />
                            Ver payload
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={handleGuardar}
                            disabled={!dirty || saving}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Aplicar
                        </ActionButton>
                        <ActionButton
                            variant="success"
                            size="sm"
                            onClick={handleGuardar}
                            disabled={!dirty || saving}
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Guardando…" : "Guardar"}
                        </ActionButton>
                        <ActionButton
                            variant="primary"
                            size="sm"
                            onClick={handleGuardarYNuevo}
                            disabled={!dirty || saving}
                        >
                            <Flag className="w-4 h-4" />
                            Guardar & nuevo
                        </ActionButton>
                        <ActionButton
                            variant="text"
                            size="sm"
                            onClick={handleCancelar}
                        >
                            <X className="w-4 h-4" />
                            Cancelar
                        </ActionButton>
                    </>
                }
            />

            <div className="bg-white px-6 border-b border-gray-200">
                <Tabs
                    tabs={tabs}
                    value={tab}
                    onChange={(id) => setTab(id as EditorTabId)}
                />
            </div>

            {/* Save error inline — 409 optimistic locking, etc. */}
            {saveError && (
                <div className="mx-6 mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <strong>No se pudo guardar:</strong> {saveError.message}
                    {saveError.current_version != null && (
                        <span className="ml-2">
                            (versión actual: {saveError.current_version}, la tuya:{" "}
                            {saveError.your_version})
                        </span>
                    )}
                </div>
            )}

            {/* Feed status Falabella — el ProductUpdate es async; polleamos el feed Sellercenter. */}
            {savedFeedId && (
                <div className="mx-6 mt-3">
                    <FeedStatusCard feedId={savedFeedId} />
                </div>
            )}

            {/* Reload error inline */}
            {error && (
                <div className="mx-6 mt-3 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="flex-1 bg-gray-100">
                {tab === "info" && (
                    <EditorResumenTab
                        product={product}
                        editFields={editFields}
                        onUpdateField={updateField}
                        marketplace={mlKey === "falabella" ? "fala" : "ml"}
                    />
                )}
                {tab === "imagenes" && (
                    <div className="px-6 pt-6 pb-10">
                        <EditorImagenesSection
                            product={product}
                            editImagenes={editImagenes}
                            onChange={setImagenes}
                        />
                    </div>
                )}
                {tab === "descripcion" && (
                    <div className="px-6 pt-6 pb-10">
                        <EditorDescripcionSection
                            product={product}
                            editFields={editFields}
                            onUpdateField={updateField}
                        />
                    </div>
                )}
                {tab === "atributos" && (
                    <div className="px-6 pt-6 pb-10">
                        <EditorAtributosSection
                            product={product}
                            editAttrs={editAttrs}
                            onUpdateAttr={updateAttr}
                        />
                    </div>
                )}
                {tab === "calidad" && (
                    <div className="px-6 pt-6 pb-10">
                        <EditorCalidadSection
                            calidad={calidad}
                            loading={calidadLoading}
                            onRefresh={reloadCalidad}
                        />
                    </div>
                )}
                {tab === "publicaciones" && (
                    <EditorPublicacionesTab
                        publications={publications}
                        loading={pubsLoading}
                        error={pubsError}
                        reload={pubsReload}
                        onEditarPrimaria={() => setTab("info")}
                    />
                )}
                {tab === "logs" && (
                    <EditorLogsTab
                        sku={sku}
                        marketplaceKey={mlKey}
                    />
                )}
            </div>

            <SimpleModal
                open={cancelConfirmOpen}
                title="Descartar cambios"
                onClose={() => setCancelConfirmOpen(false)}
                maxWidth="sm:max-w-md"
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            Hay cambios sin guardar.
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            Si cancelas ahora, se descartarán los cambios locales y volverás al catálogo.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setCancelConfirmOpen(false)}
                        >
                            Seguir editando
                        </ActionButton>
                        <ActionButton
                            variant="danger"
                            size="sm"
                            onClick={confirmCancelar}
                        >
                            Descartar y volver
                        </ActionButton>
                    </div>
                </div>
            </SimpleModal>

            <PayloadDrawer
                open={payloadOpen}
                onClose={() => setPayloadOpen(false)}
                payload={draftPayload ?? { marketplace: mlKey, cambios: {} }}
                channel={mlKey === "falabella" ? "fala" : mlKey}
                endpointLabel={`Payload · PUT /api/pim/productos/${sku}`}
            />
        </div>
    );
}
