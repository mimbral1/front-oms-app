// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/steps/Step3Imagenes.tsx
//
// Step 3 — Imágenes (Mayo 2026).
//
// Antes: la sección "Imágenes" era una Card más dentro de Step2Obligatorios.
// Decisión UX: separarla en step propio para darle el peso que merece (la
// primera imagen es la portada, hay reglas ML específicas para imágenes,
// etc.) y para que el step Obligatorios quede más enfocado en data del
// producto.
//
// El componente es deliberadamente simple: solo monta `ImageUploader` con
// el state compartido del wizard. Las imágenes viajan en ambos payloads
// (ML + Falabella) — el state es uno solo.

"use client";

import { Card } from "@/components/ui";
import { ImageUploader } from "../components/ImageUploader";
import { ProgressSidebar } from "../components/ProgressSidebar";
import type { UsePublicarWizardReturn } from "../hooks/usePublicarWizard";
import type { PublicarStepId } from "../types/publicar-types";

export interface Step3ImagenesProps {
    wizard: UsePublicarWizardReturn;
    onJumpToStep: (s: PublicarStepId) => void;
}

export function Step3Imagenes({ wizard, onJumpToStep }: Step3ImagenesProps) {
    const { state, update } = wizard;
    const channel = state.channel;

    // Conteo de imágenes con avisos de calidad del diagnóstico ML (Fase 1).
    const conAvisos = state.images.filter(
        (i) => i.diagnostic?.action === "diagnostic",
    ).length;

    return (
        <div className="px-6 pt-6 pb-10">
            <div className="grid grid-cols-[1fr_360px] gap-6">
                <div className="space-y-4 min-w-0">
                    <Card title="Imágenes de la publicación">
                        {channel === "fala" ? (
                            <p className="text-xs text-gray-500 mb-3">
                                JPG o PNG · 300×300 a 2000×2000 px · máximo 8
                                imágenes · la primera es la portada · al
                                republicar, las imágenes reemplazan a las
                                anteriores. Recomendado ≥800×800 px para mejor
                                calidad.
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 mb-3">
                                La primera imagen es la portada del producto en el
                                marketplace. Sube entre 3 y 12 imágenes para que ML
                                considere la publicación como completa
                                (afecta el score de calidad).
                            </p>
                        )}
                        {channel !== "fala" && conAvisos > 0 && (
                            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                ⚠ {conAvisos} foto{conAvisos > 1 ? "s" : ""} con avisos de
                                calidad. Pasa el mouse sobre cada una para ver cómo
                                corregir. Puedes publicar igual.
                            </div>
                        )}
                        <ImageUploader
                            images={state.images}
                            onChange={(next) =>
                                update((prev) => ({
                                    ...prev,
                                    images: next as never,
                                }))
                            }
                            // Falabella topea en 8 imágenes (regla dura del canal).
                            // Para ML: la categoría expone `settings.max_pictures_per_item`,
                            // pero hoy NO viaja en el wizard — ni `MarketplaceCategory` ni
                            // el preview (`/vista-previa` → `categoria`) lo traen. Dejamos el
                            // default 12 de ML. Para hacerlo por categoría habría que
                            // exponerlo desde meli (`getMarketplaceCategorySpec`) y
                            // propagarlo en `normalizeVistaPrevia`. No se hace ahora:
                            // el diagnóstico + el tamaño mínimo son lo de alto valor.
                            max={channel === "fala" ? 8 : 12}
                            channel={channel}
                            categoryId={channel === "ml" ? state.category?.id : undefined}
                            title={state.ml?.title}
                        />

                        {/* Hint inferior */}
                        <div className="mt-4 text-[11px] text-gray-400 leading-relaxed">
                            <strong className="text-gray-500">Tip:</strong>{" "}
                            {channel === "fala" ? (
                                <>
                                    las imágenes se comparten entre ML y Falabella —
                                    súbelas una sola vez. Falabella acepta JPG o PNG,
                                    entre 300×300 y 2000×2000 px, hasta 8 imágenes.
                                    Recomendado ≥800×800 px para mejor calidad.
                                </>
                            ) : (
                                <>
                                    las imágenes se comparten entre ML y Falabella —
                                    súbelas una sola vez. Mínimo 500x500 px para ML;
                                    recomendado fondo blanco y ≥800x800 px para evitar
                                    moderación.
                                </>
                            )}
                        </div>
                    </Card>
                </div>

                <ProgressSidebar
                    currentStep="imagenes"
                    coverage={wizard.coverage}
                    channel={channel}
                    onJumpToStep={onJumpToStep}
                />
            </div>
        </div>
    );
}
