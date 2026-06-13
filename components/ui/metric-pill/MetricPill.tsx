import React from "react";

interface MetricPillProps {
    value: number | null;
    icon: React.ReactNode;
    className?: string;
}

export function MetricPill({ value, icon, className = "" }: MetricPillProps) {
    const display = value === null ? "-" : String(value);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-[#c9cfdb] bg-[#f5f7fb] px-3 py-1 text-xs font-medium text-[#6f7684] ${className}`}
        >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#9ca5b3] text-[#6f7684]">
                {icon}
            </span>
            <span className="tabular-nums">{display}</span>
        </span>
    );
}
