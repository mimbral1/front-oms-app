"use client";

import React from "react";
import {
    PlusCircleIcon,
    LockClosedIcon,
} from "@heroicons/react/24/outline";

interface OlaPedidosToolbarProps {
    selectedCount: number;
    isCreating: boolean;
    isBlocked: boolean;
    isBlocking: boolean;
    onCreateSession: () => void;
    onBlockWave: () => void;
}

/**
 * Action toolbar shown above the orders accordion.
 * Displays selected-items count and action buttons (create session / block wave).
 */
export default function OlaPedidosToolbar({
    selectedCount,
    isCreating,
    isBlocked,
    isBlocking,
    onCreateSession,
    onBlockWave,
}: OlaPedidosToolbarProps) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-700">
                Items seleccionados para recolectar: <strong>{selectedCount}</strong>
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onCreateSession}
                    disabled={selectedCount === 0 || isCreating}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    <span className="inline-flex items-center gap-2">
                        <PlusCircleIcon className="h-5 w-5" />
                        {isCreating ? "Creando sesion..." : "Crear sesion"}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={onBlockWave}
                    disabled={isBlocked || isBlocking}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="inline-flex items-center gap-2">
                        <LockClosedIcon className="h-5 w-5" />
                        {isBlocking ? "Bloqueando..." : "Bloquear ola"}
                    </span>
                </button>
            </div>
        </div>
    );
}
