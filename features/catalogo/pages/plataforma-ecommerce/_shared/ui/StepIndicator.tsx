// features/catalogo/pages/plataforma-ecommerce/_shared/ui/StepIndicator.tsx
//
// Item de un checklist vertical de pasos (usado en sidebars de wizards).
// OMS look: círculo más grande + tipografía sans estándar.
//
// Estados:
//   - done    → verde lleno con check
//   - active  → azul lleno con número, label en azul semibold
//   - pending → blanco con border gray, label en gris

import type { ReactNode } from "react";
import { Check } from "lucide-react";

export interface StepIndicatorProps {
    n: number | string;
    label: ReactNode;
    state: "done" | "active" | "pending";
    className?: string;
}

const STATE_CIRCLE: Record<StepIndicatorProps["state"], string> = {
    done: "bg-emerald-500 text-white border-emerald-500",
    active: "bg-blue-700 text-white border-blue-700",
    pending: "bg-white text-gray-400 border-gray-300",
};

const STATE_LABEL: Record<StepIndicatorProps["state"], string> = {
    done: "text-emerald-700",
    active: "text-blue-700 font-semibold",
    pending: "text-gray-500",
};

export function StepIndicator({ n, label, state, className }: StepIndicatorProps) {
    return (
        <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
            <div
                className={[
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold shrink-0",
                    STATE_CIRCLE[state],
                ].join(" ")}
            >
                {state === "done" ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                    n
                )}
            </div>
            <span className={["text-sm", STATE_LABEL[state]].join(" ")}>{label}</span>
        </div>
    );
}
