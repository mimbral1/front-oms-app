// features/catalogo/pages/plataforma-ecommerce/shared/bitacora/base/components/bitacora-format.tsx
//
// Metadata presentacional por event_type: label humano, tono de color e ícono.
// Centralizado acá para que timeline (detalle/wizard) y widget (dashboard) usen
// la misma semántica visual.

import {
    Inbox,
    Send,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    TimerOff,
    PauseCircle,
    Pencil,
    Circle,
} from "lucide-react";
import type { ComponentType } from "react";
import type { BitacoraEventType } from "../types/bitacora-types";

export interface EventMeta {
    label: string;
    /** Clases Tailwind para el chip/ícono. */
    dot: string;
    text: string;
    ring: string;
    Icon: ComponentType<{ className?: string }>;
}

const META: Record<BitacoraEventType, EventMeta> = {
    ENCOLADO: {
        label: "Encolado",
        dot: "bg-gray-400",
        text: "text-gray-600",
        ring: "ring-gray-300",
        Icon: Inbox,
    },
    FEED_ENVIADO: {
        label: "Enviado a Falabella",
        dot: "bg-blue-500",
        text: "text-blue-700",
        ring: "ring-blue-300",
        Icon: Send,
    },
    SINCRONIZADO: {
        label: "Sincronizado",
        dot: "bg-emerald-500",
        text: "text-emerald-700",
        ring: "ring-emerald-300",
        Icon: CheckCircle2,
    },
    RECHAZADO: {
        label: "Rechazado",
        dot: "bg-rose-500",
        text: "text-rose-700",
        ring: "ring-rose-300",
        Icon: XCircle,
    },
    ADVERTENCIA: {
        label: "Advertencia",
        dot: "bg-amber-500",
        text: "text-amber-700",
        ring: "ring-amber-300",
        Icon: AlertTriangle,
    },
    TIMEOUT: {
        label: "Timeout",
        dot: "bg-orange-500",
        text: "text-orange-700",
        ring: "ring-orange-300",
        Icon: TimerOff,
    },
    PAUSADO: {
        label: "Pausado",
        dot: "bg-slate-400",
        text: "text-slate-600",
        ring: "ring-slate-300",
        Icon: PauseCircle,
    },
    ACTUALIZADO: {
        label: "Actualizado",
        dot: "bg-indigo-500",
        text: "text-indigo-700",
        ring: "ring-indigo-300",
        Icon: Pencil,
    },
};

const FALLBACK: EventMeta = {
    label: "Evento",
    dot: "bg-gray-300",
    text: "text-gray-500",
    ring: "ring-gray-200",
    Icon: Circle,
};

/** Devuelve la metadata visual de un event_type (con fallback para nulos/legacy). */
export function eventMeta(
    eventType: BitacoraEventType | null | undefined,
    action?: string,
): EventMeta {
    if (eventType && META[eventType]) return META[eventType];
    // Filas legacy sin event_type: inferir algo del action grueso.
    if (action) {
        const a = action.toUpperCase();
        if (a === "PUBLISH") return META.FEED_ENVIADO;
        if (a === "UPDATE") return META.ACTUALIZADO;
    }
    return FALLBACK;
}

/** Formatea created_at (hora local Chile) a "26 may, 14:49". */
export function formatBitacoraDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("es-CL", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}
