"use client";

import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface BlockWaveModalProps {
    open: boolean;
    blocking: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * Confirmation dialog for blocking a wave.
 * Prevents new item assignments until the wave is unblocked.
 */
export default function BlockWaveModal({
    open,
    blocking,
    onClose,
    onConfirm,
}: BlockWaveModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => !blocking && onClose()}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Bloquear ola</h3>
                <p className="mt-1 text-sm text-gray-600">
                    ¿Seguro que quieres bloquear esta ola? Esta acción impedirá nuevas
                    asignaciones hasta que se vuelva a habilitar.
                </p>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={blocking}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={blocking}
                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                        {blocking ? "Bloqueando..." : "Sí, bloquear ola"}
                    </button>
                </div>
            </div>
        </div>
    );
}
