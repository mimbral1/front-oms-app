// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/components/ProcessingCard.tsx
//
// Card del stage `processing` — spinner + título + subtítulo.
//
// 2026-05-18 — refactor a OMS look pleno: el Card global requiere `title` prop,
// que en este caso sería redundante con `title` propio del componente. Por eso
// usamos un div con el mismo look OMS (rounded-xl + border + shadow-sm) en
// lugar del Card átomo.

export interface ProcessingCardProps {
    /** Subtítulo ej. "Validando contra ML · 8/12" */
    progressNote?: string | null;
    /** Título principal — default "Procesando lote…" */
    title?: string;
}

export function ProcessingCard({
    progressNote,
    title = "Procesando lote…",
}: ProcessingCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <div className="text-base font-semibold text-gray-900">{title}</div>
                {progressNote && (
                    <div className="text-xs text-gray-500 mt-1 tabular-nums">
                        {progressNote}
                    </div>
                )}
            </div>
        </div>
    );
}
