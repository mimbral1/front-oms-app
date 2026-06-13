// features/catalogo/pages/plataforma-ecommerce/_shared/ui/RemovableChip.tsx
//
// Pill con botón X opcional. OMS look: rounded-md, border, padding cómodo.
// Usado para multi-select de atributos.

import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface RemovableChipProps {
    children: ReactNode;
    onRemove?: () => void;
    tone?: "neutral" | "primary" | "success" | "warning";
    /** Max-width del label (para truncate). Default `180px`. */
    maxWidth?: string;
    className?: string;
}

const TONE_CLASSES: Record<NonNullable<RemovableChipProps["tone"]>, string> = {
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    primary: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
};

export function RemovableChip({
    children,
    onRemove,
    tone = "neutral",
    maxWidth = "180px",
    className,
}: RemovableChipProps) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border",
                TONE_CLASSES[tone],
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <span className="truncate" style={{ maxWidth }}>
                {children}
            </span>
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label="Quitar"
                    className="opacity-60 hover:opacity-100 shrink-0 transition-opacity"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}
