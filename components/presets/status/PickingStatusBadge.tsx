// components/presets/status/PickingStatusBadge.tsx
// Preset badge for picking-related statuses.

"use client";

import { FC } from "react";

const defaultColorMap: Record<string, string> = {
    Pickeada: "bg-green-500",
    Activo: "bg-green-500",
    Entregada: "bg-green-500",
    Preparado: "bg-emerald-500",
    "En curso": "bg-blue-500",
    Preparando: "bg-yellow-500",
    Pendiente: "bg-gray-400",
    Inactivo: "bg-gray-400",
};

export interface PickingStatusBadgeProps {
    status: string;
    colorMap?: Record<string, string>;
}

export const PickingStatusBadge: FC<PickingStatusBadgeProps> = ({
    status,
    colorMap,
}) => {
    const map = colorMap ?? defaultColorMap;
    const bg = map[status] ?? "bg-gray-400";

    return (
        <span
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${bg}`}
        >
            {status}
        </span>
    );
};
