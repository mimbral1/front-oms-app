// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/views/CargaMasivaView.tsx
//
// Vista principal de carga masiva. Wizard de 3 stages (upload → processing →
// preview) con OMS look pleno.
//
// 2026-05-18 — refactor a OMS look pleno (drop `_shared/janis/`):
//   - JanisTopBar      → EcommercePageHeader
//   - JanisStepsHeader → bar inline horizontal (steps controlados por el hook, no clickeables)
//   - PillBtn          → ActionButton
//   - JanisIcon        → lucide-react directo
//
// Patrón visual de referencia: `Mimbral Mercadolibre/carga_masiva.html` (legacy).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Upload,
    X as XIcon,
} from "lucide-react";
import { ActionButton } from "@/components/ui";
import { SimpleModal } from "@/components/ui/modal";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { resolveMarketplaceKey } from "../../../productos/base/utils/marketplace";
import { DropZone } from "../components/DropZone";
import { ProcessingCard } from "../components/ProcessingCard";
import { PreviewTable } from "../components/PreviewTable";
import { useCargaMasivaUpload } from "../hooks/useCargaMasivaUpload";
import type { CargaMasivaStage } from "../types/carga-masiva-types";

interface StageDef {
    id: CargaMasivaStage;
    label: string;
}

const STAGES: ReadonlyArray<StageDef> = [
    { id: "upload", label: "Cargar archivo" },
    { id: "processing", label: "Procesar" },
    { id: "preview", label: "Revisar" },
];

export interface CargaMasivaViewProps {
    /**
     * accountId del marketplace (seller id de ML, o equivalente en
     * Falabella/VTEX). En V2 esto debería venir de un selector real de cuentas
     * — por ahora viene como prop del page que sabe a qué marketplace pertenece.
     */
    accountId: number;
}

export function CargaMasivaView({ accountId }: CargaMasivaViewProps) {
    const platform = useEcommercePlatform();
    const router = useRouter();
    // "Productos a publicar" (la bandeja) está habilitada para ML y Falabella.
    // En esos marketplaces carga masiva es solo intake: subir → revisar
    // (SKU/nombre/margen) → ir a la bandeja a publicar 1×1. En el resto (p. ej.
    // VTEX, sin bandeja) se mantiene "Aplicar N OK".
    const marketplaceKey = resolveMarketplaceKey(platform.name);
    const usaBandeja = marketplaceKey === "ml" || marketplaceKey === "falabella";
    const [confirmOpen, setConfirmOpen] = useState(false);

    const {
        stage,
        error,
        file,
        batch,
        rows,
        progressNote,
        busy,
        pickFile,
        submitFile,
        reset,
        publishAll,
        downloadTemplate,
    } = useCargaMasivaUpload({ accountId });

    const title = batch?.filename ? `Lote · ${batch.filename}` : "Nuevo lote";
    const badge =
        stage === "processing"
            ? { label: "Procesando", tone: "draft" as const }
            : stage === "preview"
              ? { label: "Listo para aplicar", tone: "active" as const }
              : undefined;

    const okCount = rows.filter((r) => r.status === "ok").length;

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Carga masiva`}
                title={title}
                badge={badge}
                actions={
                    <>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver
                        </ActionButton>
                        {stage === "preview" && (
                            <>
                                {usaBandeja ? (
                                    // ML / Falabella: intake-only. Finalizar cierra el
                                    // intake y vuelve a la lista de lotes. Publicar se
                                    // hace 1×1 desde "Productos a publicar" (la bandeja,
                                    // accesible desde el menú lateral).
                                    <ActionButton
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            // Finalizador: limpiamos el wizard (para que la
                                            // próxima carga masiva empiece fresca) y volvemos
                                            // a la lista de lotes.
                                            reset();
                                            router.push(`${platform.basePath}/carga-masiva`);
                                        }}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Finalizar
                                    </ActionButton>
                                ) : (
                                    <ActionButton
                                        variant="success"
                                        size="sm"
                                        onClick={() => setConfirmOpen(true)}
                                        disabled={busy || okCount === 0}
                                        loading={busy}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {busy
                                            ? "Aplicando…"
                                            : `Aplicar ${okCount.toLocaleString("es-CL")} OK`}
                                    </ActionButton>
                                )}
                            </>
                        )}
                        {stage !== "upload" && (
                            <ActionButton
                                variant="secondary"
                                size="sm"
                                onClick={reset}
                            >
                                <XIcon className="w-4 h-4" />
                                Cancelar
                            </ActionButton>
                        )}
                        {stage === "upload" && file && (
                            <ActionButton
                                variant="primary"
                                size="sm"
                                onClick={submitFile}
                                disabled={busy || !file}
                                loading={busy}
                            >
                                <Upload className="w-4 h-4" />
                                {busy ? "Subiendo…" : "Subir y validar"}
                            </ActionButton>
                        )}
                    </>
                }
            />

            <WizardStepsBar stages={STAGES} active={stage} />

            {/* Error banner */}
            {error && (
                <div className="mx-6 mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="flex-1 bg-gray-100 px-6 py-6">
                {stage === "upload" && (
                    <DropZone
                        file={file}
                        onPick={pickFile}
                        disabled={busy}
                        onDownloadTemplate={() => {
                            // Descarga el .xlsx con auth (blob) — el endpoint pim
                            // rutea por marketplace (ml → meli-catalog, falabella →
                            // fcom). El hook ya captura el error y lo muestra en el
                            // banner; no lo tragamos acá.
                            void downloadTemplate();
                        }}
                    />
                )}

                {stage === "processing" && (
                    <ProcessingCard
                        progressNote={progressNote ?? "Validando lote…"}
                        title={
                            batch?.totalRows
                                ? `Procesando ${batch.totalRows.toLocaleString("es-CL")} filas…`
                                : "Procesando lote…"
                        }
                    />
                )}

                {stage === "preview" && (
                    <PreviewTable
                        rows={rows}
                        processedAtIso={batch?.uploadedAt}
                        batchId={batch?.batchId}
                    />
                )}
            </div>

            {/* Confirm modal de seguridad antes de publicar el lote completo
                (acción real e irreversible sobre el marketplace). */}
            <SimpleModal
                open={confirmOpen}
                title="Confirmar publicación"
                onClose={() => setConfirmOpen(false)}
                maxWidth="sm:max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                        Vas a publicar{" "}
                        <strong>{okCount.toLocaleString("es-CL")}</strong>{" "}
                        productos en <strong>{platform.name}</strong>{" "}
                        <span className="font-semibold text-rose-600">(real)</span>.
                        Esta acción es irreversible.
                    </p>
                    <div className="flex justify-end gap-2">
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmOpen(false)}
                        >
                            <XIcon className="w-4 h-4" />
                            Cancelar
                        </ActionButton>
                        <ActionButton
                            variant="success"
                            size="sm"
                            onClick={() => {
                                setConfirmOpen(false);
                                void publishAll();
                            }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirmar y publicar
                        </ActionButton>
                    </div>
                </div>
            </SimpleModal>
        </div>
    );
}

/**
 * Bar horizontal de stages del wizard.
 *
 * Read-only: los stages se controlan desde el hook (`useCargaMasivaUpload`)
 * según el flujo upload → processing → preview. No se permite click libre
 * porque saltar de stages adelantadas rompería la state machine.
 *
 * Visual: número (o check si done) + label. Stages previas al activo se
 * marcan en emerald; el activo en blue-700; las pendientes en gray.
 */
function WizardStepsBar({
    stages,
    active,
}: {
    stages: ReadonlyArray<StageDef>;
    active: CargaMasivaStage;
}) {
    const activeIdx = stages.findIndex((s) => s.id === active);

    return (
        <div className="bg-white px-6 border-b border-gray-200">
            <div className="flex items-center gap-2 h-12 overflow-x-auto">
                {stages.map((s, i) => {
                    const isActive = s.id === active;
                    const isDone = i < activeIdx;
                    const circleCls = isActive
                        ? "bg-blue-700 text-white border-blue-700"
                        : isDone
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-gray-400 border-gray-300";
                    const labelCls = isActive
                        ? "text-blue-700 font-semibold"
                        : isDone
                          ? "text-emerald-700"
                          : "text-gray-500";
                    return (
                        <div key={s.id} className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-2 py-1">
                                <div
                                    className={[
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold shrink-0 transition-colors",
                                        circleCls,
                                    ].join(" ")}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : (
                                        i + 1
                                    )}
                                </div>
                                <span
                                    className={[
                                        "text-xs uppercase tracking-wider whitespace-nowrap",
                                        labelCls,
                                    ].join(" ")}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {i < stages.length - 1 && (
                                <div className="w-8 h-px bg-gray-200" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


