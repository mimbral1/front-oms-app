// features/catalogo/pages/plataforma-ecommerce/_shared/janis/JanisStepsHeader.tsx
//
// Variante de tabs para wizards: muestra "1 · LABEL · 2 · LABEL ..." con
// estado `done` (verde) para los pasos previos al activo. Sigue el patrón de
// `Mimbral Mercadolibre/publicar.html`.

"use client";

import type { ReactNode } from "react";

export interface JanisStepItem<StepId extends string = string> {
    id: StepId;
    /** Label uppercase. El numeral "1 · " se prepende automáticamente si `numberPrefix` no es false. */
    label: ReactNode;
    icon?: ReactNode;
    /** Si true, ignora hover/click. */
    disabled?: boolean;
}

export interface JanisStepsHeaderProps<StepId extends string = string> {
    steps: JanisStepItem<StepId>[];
    active: StepId;
    onChange: (id: StepId) => void;
    /**
     * Si `true` (default), las steps previas al activo se renderizan en verde
     * (`text-emerald-700`). Si `false`, todas las inactivas son gris.
     */
    completePreviousAsDone?: boolean;
    /**
     * Si `true` (default), prepende "N · " al label (donde N es 1, 2, 3...).
     * Si `false`, deja el label tal cual.
     */
    numberPrefix?: boolean;
    className?: string;
}

export function JanisStepsHeader<StepId extends string = string>({
    steps,
    active,
    onChange,
    completePreviousAsDone = true,
    numberPrefix = true,
    className,
}: JanisStepsHeaderProps<StepId>) {
    const activeIdx = steps.findIndex((s) => s.id === active);

    return (
        <div
            className={[
                "bg-white px-6 border-b border-gray-200",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="flex items-center gap-1 overflow-x-auto">
                {steps.map((s, i) => {
                    const isActive = active === s.id;
                    const isDone = completePreviousAsDone && activeIdx > i;
                    const stateClass = s.disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : isActive
                          ? "text-blue-700"
                          : isDone
                            ? "text-emerald-700 hover:text-emerald-800"
                            : "text-gray-500 hover:text-gray-800";
                    return (
                        <button
                            key={s.id}
                            type="button"
                            disabled={s.disabled}
                            onClick={() => !s.disabled && onChange(s.id)}
                            className={[
                                "relative inline-flex items-center gap-2 px-3 h-11",
                                "text-[11.5px] tracking-[0.08em] uppercase font-semibold whitespace-nowrap",
                                "transition-colors",
                                stateClass,
                            ].join(" ")}
                            aria-current={isActive ? "step" : undefined}
                        >
                            {s.icon && <span className="inline-flex shrink-0">{s.icon}</span>}
                            <span>
                                {numberPrefix && (
                                    <span className="tabular-nums">{i + 1} · </span>
                                )}
                                {s.label}
                            </span>
                            {isActive && (
                                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-blue-700 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
