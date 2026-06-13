"use client";

import { FC } from "react";

const defaultThresholds: Record<string, string> = {
    Simple: "border-green-500 text-green-600",
    Medio: "border-yellow-500 text-yellow-600",
    Complejo: "border-red-500 text-red-600",
};

interface ComplejidadBadgeProps {
    value: string;
    thresholds?: Record<string, string>;
}

export const ComplejidadBadge: FC<ComplejidadBadgeProps> = ({
    value,
    thresholds,
}) => {
    const map = thresholds ?? defaultThresholds;
    const cls = map[value] ?? "border-gray-400 text-gray-600";

    return (
        <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs ${cls}`}>
            {value}
        </span>
    );
};
