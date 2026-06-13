// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/ProgressSidebar.tsx
//
// Panel lateral derecho del wizard. Muestra:
//   - Lista vertical de los 4 steps (StepIndicator)
//   - Score de calidad (barra horizontal con %)
//   - Canal y cuenta seleccionada
//
// Look OMS: StepIndicator de `_shared/ui/`, secciones con h3 + line, sin Sec/JanisIcon.

"use client";

import { User, Star, Info } from "lucide-react";
import { SectionDivider, StepIndicator } from "../../../../_shared/ui";
import { useCuentaCanal } from "../hooks/useCuentaCanal";
import type {
    CoverageSummary,
    PublicarChannel,
    PublicarStepId,
} from "../types/publicar-types";

export interface ProgressSidebarProps {
    currentStep: PublicarStepId;
    coverage: CoverageSummary;
    channel: PublicarChannel;
    /** Click en un step va a esa sección si está visitada. */
    onJumpToStep?: (s: PublicarStepId) => void;
}

const STEP_LABELS: Record<PublicarStepId, string> = {
    sku: "SKU y categoría",
    obligatorios: "Obligatorios y recomendados",
    imagenes: "Imágenes",
    revisar: "Revisión y publicación",
};

const STEP_ORDER: PublicarStepId[] = ["sku", "obligatorios", "imagenes", "revisar"];

export function ProgressSidebar({
    currentStep,
    coverage,
    channel,
    onJumpToStep,
}: ProgressSidebarProps) {
    const currentIdx = STEP_ORDER.indexOf(currentStep);
    const { cuenta, loading: cuentaLoading } = useCuentaCanal(channel);

    return (
        <div className="border-l border-gray-200 pl-8 space-y-6">
            <section>
                <SectionDivider icon={<User className="w-4 h-4" />}>
                    Progreso
                </SectionDivider>
                <div className="space-y-3">
                    {STEP_ORDER.map((step, i) => {
                        const state =
                            i < currentIdx
                                ? "done"
                                : i === currentIdx
                                  ? "active"
                                  : "pending";
                        return (
                            <button
                                key={step}
                                type="button"
                                onClick={() => i <= currentIdx && onJumpToStep?.(step)}
                                disabled={i > currentIdx}
                                className="w-full text-left disabled:cursor-not-allowed hover:bg-gray-50 rounded-md px-1 py-1 -mx-1 transition-colors"
                            >
                                <StepIndicator
                                    n={i + 1}
                                    label={STEP_LABELS[step]}
                                    state={state}
                                />
                            </button>
                        );
                    })}
                </div>
            </section>

            <section>
                <SectionDivider icon={<Star className="w-4 h-4" />}>
                    Calidad de la publicación
                </SectionDivider>
                <ScoreBar score={coverage.pct} />
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-xs">
                    <span className="text-gray-500">Obligatorios</span>
                    <span className="text-right tabular-nums text-gray-900 font-medium">
                        {coverage.required_filled}/{coverage.required_total}
                    </span>
                    <span className="text-gray-500">Recomendados</span>
                    <span className="text-right tabular-nums text-gray-900 font-medium">
                        {coverage.recommended_filled}/{coverage.recommended_total}
                    </span>
                </div>
                {coverage.missing.length > 0 && (
                    <div className="mt-2 text-xs text-amber-700">
                        Falta:{" "}
                        <strong>{coverage.missing.slice(0, 3).join(", ")}</strong>
                        {coverage.missing.length > 3 &&
                            ` +${coverage.missing.length - 3}`}
                    </div>
                )}
            </section>

            <section>
                <SectionDivider icon={<Info className="w-4 h-4" />}>
                    Cuenta y canal
                </SectionDivider>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Canal</span>
                        <span className="inline-flex items-center gap-1.5">
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    channel === "ml" ? "bg-yellow-400" : "bg-emerald-500"
                                }`}
                            />
                            <span className="text-gray-900">
                                {channel === "ml" ? "MercadoLibre" : "Falabella"}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Cuenta</span>
                        <span className="text-gray-900 text-right">
                            {cuentaLoading
                                ? "…"
                                : cuenta
                                  ? `${cuenta.name}${cuenta.referenceId ? ` · ${cuenta.referenceId}` : ""}`
                                  : "—"}
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ScoreBar({ score }: { score: number }) {
    const tone =
        score >= 80
            ? "bg-emerald-500"
            : score >= 50
              ? "bg-amber-500"
              : "bg-rose-500";
    const textTone =
        score >= 80
            ? "text-emerald-600"
            : score >= 50
              ? "text-amber-600"
              : "text-rose-600";
    return (
        <div>
            <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-gray-500">Score estimado</span>
                <span className={`text-sm font-semibold tabular-nums ${textTone}`}>
                    {score} / 100
                </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${tone} transition-all`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}
