// components\modal-logs\DetalleLogModal.tsx
"use client";

import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface DetalleLogModalProps {
    log: {
        diff?: any;
        beforeState?: any;
        afterState?: any;
    };
    activeTab: "diff" | "before" | "after";
    onTabChange: (tab: "diff" | "before" | "after") => void;
    onClose: () => void;
}

export default function DetalleLogModal({
    log,
    activeTab,
    onTabChange,
    onClose,
}: DetalleLogModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl rounded-xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                        Detalle del cambio
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b px-4 py-2">
                    <Tab
                        label="Cambios"
                        active={activeTab === "diff"}
                        onClick={() => onTabChange("diff")}
                    />
                    <Tab
                        label="Antes"
                        active={activeTab === "before"}
                        onClick={() => onTabChange("before")}
                    />
                    <Tab
                        label="Después"
                        active={activeTab === "after"}
                        onClick={() => onTabChange("after")}
                    />
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-auto p-4">
                    {activeTab === "diff" && (
                        <JsonBlock data={log.diff} />
                    )}

                    {activeTab === "before" && (
                        <JsonBlock data={log.beforeState} />
                    )}

                    {activeTab === "after" && (
                        <JsonBlock data={log.afterState} />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────
   Helpers internos
────────────────────────────── */

function Tab({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "rounded-md px-3 py-1.5 text-sm font-medium",
                active
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100",
            ].join(" ")}
        >
            {label}
        </button>
    );
}

function JsonBlock({ data }: { data: any }) {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="text-sm text-gray-500">
                No hay información para mostrar.
            </div>
        );
    }

    return (
        <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 text-xs text-gray-800">
            {JSON.stringify(data, null, 2)}
        </pre>
    );
}