// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorCalidadSection.tsx
//
// Card "Calidad" del editor — match al legacy editar.html (sec-calidad, renderCalidad).
//
// Renderiza:
//   - Score numérico grande con barra de progreso y color por nivel
//   - Nivel ("Excelente"/"Bueno"/etc) como badge
//   - Problemas detectados con icon + mensaje + botón "Ir a sección" (pendiente)
//   - Checks OK con icon verde + label enriquecido (Fala: con métricas/puntos)
//   - Botón "Actualizar" para reloadCalidad
//
// Shape ML vs Falabella:
//   ML usa `score` + `checks_ok` con labels humanos.
//   Falabella usa `content_score_falabella` + `checks_ok` con shape técnico
//   (label="title", puntos=45, metrica={valor,unidad}) que enriquecemos para
//   que se muestre como "title — 27 caracteres (+45 pts)".

"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";
import { SectionDivider } from "../../../../_shared/ui";
import type {
    EditorCalidad,
    EditorCalidadCheck,
} from "../types/editor-types";

export interface EditorCalidadSectionProps {
    calidad: EditorCalidad | null;
    loading: boolean;
    onRefresh: () => void;
}

/** Color (Tailwind classes) según score 0-100. */
function scoreClasses(score: number) {
    if (score >= 80)
        return {
            text: "text-emerald-600",
            bg: "bg-emerald-500",
            bgSoft: "bg-emerald-50",
            border: "border-emerald-200",
            ring: "ring-emerald-200",
        };
    if (score >= 50)
        return {
            text: "text-amber-600",
            bg: "bg-amber-500",
            bgSoft: "bg-amber-50",
            border: "border-amber-200",
            ring: "ring-amber-200",
        };
    return {
        text: "text-rose-600",
        bg: "bg-rose-500",
        bgSoft: "bg-rose-50",
        border: "border-rose-200",
        ring: "ring-rose-200",
    };
}

/**
 * Enriquece el label de un check OK. Para Falabella saca info de `metrica`
 * y `puntos` (label viene técnico "title", queremos "title — 27 caracteres
 * (+45 pts)"). Para ML el label ya viene humano y no se modifica.
 */
function checkLabel(check: EditorCalidadCheck): string {
    if (check == null) return "";
    if (typeof check === "string") return check;

    let label = check.label || check.mensaje || check.text || "";
    if (check.metrica && typeof check.metrica === "object") {
        const m = check.metrica;
        const pieces: string[] = [];
        if (m.valor != null) {
            pieces.push(`${m.valor}${m.unidad ? ` ${m.unidad}` : ""}`);
        }
        if (pieces.length > 0) label += ` — ${pieces.join(", ")}`;
    }
    if (check.puntos != null) {
        label += ` (+${check.puntos} pts)`;
    }
    return label;
}

export function EditorCalidadSection({
    calidad,
    loading,
    onRefresh,
}: EditorCalidadSectionProps) {
    if (loading && !calidad) {
        return (
            <Card title="Calidad">
                <SectionDivider icon={<Sparkles className="w-4 h-4" />}>
                    Score de la publicación
                </SectionDivider>
                <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Cargando calidad…
                </div>
            </Card>
        );
    }

    if (!calidad) {
        return (
            <Card title="Calidad">
                <SectionDivider icon={<Sparkles className="w-4 h-4" />}>
                    Score de la publicación
                </SectionDivider>
                <div className="text-sm text-gray-500 mb-3">
                    Sin datos de calidad para este producto.
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Cargar calidad
                </button>
            </Card>
        );
    }

    // ML usa `score`, Fala usa `content_score_falabella`. Fallback a 0.
    const score = useMemo(
        () =>
            calidad.score ??
            calidad.content_score_falabella ??
            0,
        [calidad],
    );
    const cls = scoreClasses(score);
    const problemas = calidad.problemas || [];
    const checksOk = (calidad.checks_ok || [])
        .map((c) => checkLabel(c))
        .filter((s) => s.length > 0);

    return (
        <Card title="Calidad de la publicación">
            <SectionDivider icon={<Sparkles className="w-4 h-4" />}>
                Score{calidad.nivel ? ` · ${calidad.nivel}` : ""}
            </SectionDivider>

            {/* Score grande + barra */}
            <div className="text-center mb-3">
                <div
                    className={`text-5xl font-semibold tabular-nums ${cls.text}`}
                >
                    {score}
                    <span className="text-xl opacity-50">/100</span>
                </div>
                {calidad.nivel && (
                    <div className="mt-2">
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${cls.bgSoft} ${cls.text} ring-1 ring-inset ${cls.ring}`}
                        >
                            {calidad.nivel}
                        </span>
                    </div>
                )}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                    className={`h-full ${cls.bg} transition-all`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
            </div>

            {/* Problemas */}
            {problemas.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Problemas detectados ({problemas.length})
                    </div>
                    <ul className="space-y-2">
                        {problemas.map((p, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-sm rounded-md bg-amber-50 border border-amber-200 px-3 py-2"
                            >
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <span className="text-amber-800 flex-1">
                                    {p.mensaje}
                                </span>
                                {p.seccion && (
                                    <span className="text-[10px] uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                                        {p.seccion}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Checks OK */}
            {checksOk.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Correcto ({checksOk.length})
                    </div>
                    <ul className="space-y-1.5">
                        {checksOk.map((txt, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-gray-700"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="flex-1">{txt}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Refresh button */}
            <div className="pt-3 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw
                        className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                    />
                    {loading ? "Actualizando…" : "Actualizar calidad"}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                    El score se recalcula del backend tras los cambios. Tras
                    guardar, haz refresh aquí para ver el nuevo score.
                </p>
            </div>
        </Card>
    );
}
