// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/components/DropZone.tsx
//
// Drop zone para Excel — usa `<input type="file">` nativo + handlers de
// `dragover/dragleave/drop` para no agregar `react-dropzone` como dep.
//
// 2026-05-18 — refactor a OMS look pleno (drop `_shared/janis/`):
//   - JanisIcon → lucide-react directo
//   - PillBtn   → ActionButton
//
// Patrón visual de referencia: `Mimbral Mercadolibre/carga_masiva.html` (función DropZone).

"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Upload, X as XIcon } from "lucide-react";
import { ActionButton } from "@/components/ui";

export interface DropZoneProps {
    /** Callback con el archivo elegido (o null al cancelar). */
    onPick: (file: File | null) => void;
    /** Archivo ya seleccionado (preview). */
    file: File | null;
    /** Si true, deshabilita interacción. */
    disabled?: boolean;
    /** Texto descargar plantilla — opcional. */
    onDownloadTemplate?: () => void;
}

const ACCEPT = ".xlsx,.xls";

export function DropZone({ onPick, file, disabled, onDownloadTemplate }: DropZoneProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [hover, setHover] = useState(false);

    const openPicker = useCallback(() => {
        if (disabled) return;
        inputRef.current?.click();
    }, [disabled]);

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (disabled) return;
            setHover(true);
        },
        [disabled],
    );

    const handleDragLeave = useCallback(() => setHover(false), []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setHover(false);
            if (disabled) return;
            const f = e.dataTransfer?.files?.[0];
            if (f) onPick(f);
        },
        [disabled, onPick],
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0] ?? null;
            onPick(f);
            // reset para permitir re-seleccionar el mismo archivo
            e.target.value = "";
        },
        [onPick],
    );

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !disabled) {
                    e.preventDefault();
                    openPicker();
                }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
                "block border-2 border-dashed rounded-lg bg-white p-10 text-center cursor-pointer transition-all",
                "outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
                hover && !disabled
                    ? "border-blue-500 bg-blue-50/60"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30",
                disabled ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
            aria-disabled={disabled}
        >
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleChange}
                className="hidden"
                aria-label="Seleccionar archivo Excel"
            />

            <Upload className="w-10 h-10 text-blue-600 mx-auto mb-3" />

            {file ? (
                <>
                    <div className="text-sm font-semibold text-gray-900">
                        {file.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 tabular-nums">
                        {formatBytes(file.size)} · listo para subir
                    </div>
                </>
            ) : (
                <>
                    <div className="text-sm font-semibold text-gray-900">
                        Arrastra tu Excel o haz click para seleccionar
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Formato .xlsx — máximo 20 MB por archivo
                    </div>
                </>
            )}

            <div className="mt-4 flex items-center justify-center gap-3">
                {file && (
                    <ActionButton
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPick(null);
                        }}
                    >
                        <XIcon className="w-3.5 h-3.5" />
                        Quitar
                    </ActionButton>
                )}
                {onDownloadTemplate && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownloadTemplate();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Descargar plantilla
                    </button>
                )}
            </div>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
