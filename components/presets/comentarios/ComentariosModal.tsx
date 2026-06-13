// components\comentarios\ComentariosModal.tsx
"use client";

import React from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";

interface ComentariosModalProps {
    open: boolean;
    title?: string;
    value: string;
    loading?: boolean;
    placeholder?: string;
    onChange: (value: string) => void;
    onCancel: () => void;
    onSave: () => void;
}

export default function ComentariosModal({
    open,
    title = "Nuevo comentario",
    value,
    loading = false,
    placeholder = "Escribe un comentario…",
    onChange,
    onCancel,
    onSave,
}: ComentariosModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Textarea */}
                <textarea
                    rows={4}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full resize-none rounded-md border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="rounded-md bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={loading || !value.trim()}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}