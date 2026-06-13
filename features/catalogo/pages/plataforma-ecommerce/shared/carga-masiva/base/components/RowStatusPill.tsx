// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/components/RowStatusPill.tsx
//
// Pill compacta con dot + label para los 3 estados de una fila.
// Replica `StatusPill` del mockup `carga_masiva.html`.

import type { RowStatus } from "../types/carga-masiva-types";

export interface RowStatusPillProps {
    status: RowStatus;
    className?: string;
}

interface ToneClasses {
    wrap: string;
    dot: string;
    label: string;
}

const TONE_MAP: Record<"ok" | "warn" | "err", ToneClasses> = {
    ok: {
        wrap: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        dot: "bg-emerald-500",
        label: "OK",
    },
    warn: {
        wrap: "bg-amber-50 text-amber-700 ring-amber-200",
        dot: "bg-amber-500",
        label: "Aviso",
    },
    err: {
        wrap: "bg-rose-50 text-rose-700 ring-rose-200",
        dot: "bg-rose-500",
        label: "Error",
    },
};

export function RowStatusPill({ status, className }: RowStatusPillProps) {
    const tone =
        status === "ok"
            ? TONE_MAP.ok
            : status === "warn"
              ? TONE_MAP.warn
              : status === "err"
                ? TONE_MAP.err
                : TONE_MAP.ok;
    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ring-inset",
                tone.wrap,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <span className={["w-1.5 h-1.5 rounded-full", tone.dot].join(" ")} />
            {tone.label}
        </span>
    );
}
