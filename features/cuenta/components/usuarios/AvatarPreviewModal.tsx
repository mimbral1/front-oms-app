// views\Cuenta\Usuarios\components\AvatarPreviewModal.tsx
"use client";

import { useEffect } from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";

export default function AvatarPreviewModal({
    open,
    imageUrl,
    onClose,
}: {
    open: boolean;
    imageUrl?: string;
    onClose: () => void;
}) {
    // cerrar con ESC
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={onClose}
            aria-modal
            role="dialog"
        >
            <div
                className="relative bg-white rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute -top-3 -right-3 bg-white rounded-full shadow hover:bg-gray-100"
                >
                    <XCircleIcon className="h-8 w-8 text-gray-600 hover:text-gray-900" />
                </button>

                {/* Imagen */}
                <img
                    src={imageUrl}
                    alt="Avatar usuario"
                    className="
                    max-h-[85vh]
                    max-w-[90vw]
                    object-contain
                    rounded-xl
                "
                />
            </div>
        </div>
    );

}
