// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/ImageUploader.tsx
//
// Uploader de imágenes para la publicación. Drag-drop + click + grid de thumbs.
//
// UX: preview optimista — cuando el seller selecciona un archivo, mostramos
// inmediatamente un dataURL base64 mientras el upload sube. Cuando el backend
// responde con `secureUrl` (URL pública en mlstatic.com), reemplazamos el
// preview por el real.
//
// Look OMS: ActionButton ghost para "Quitar todas", lucide-react para íconos.

"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, Plus, Trash2 } from "lucide-react";

import { ActionButton } from "@/components/ui";
import { usePublicarApi } from "../api/publicar-api";
import type { ImageDiagnostic, UploadedImage, PublicarChannel } from "../types/publicar-types";

export interface ImageUploaderProps {
    images: ReadonlyArray<UploadedImage>;
    onChange: (next: ReadonlyArray<UploadedImage>) => void;
    /** Cantidad máxima (ML acepta hasta 12). */
    max?: number;
    /** Canal de la publicación. Falabella sube a Cloudinary (host neutral);
     *  ML a su upload propio. Default ML si no se pasa. */
    channel?: PublicarChannel;
    /** Categoría ML (para el diagnóstico). */
    categoryId?: string;
    /** Título de la publicación (contexto del diagnóstico). */
    title?: string;
}

/** Item temporal mostrado durante upload. Guardamos dataUrl (base64) en vez
 *  de blob URL para que persista entre re-mounts del componente y no se
 *  pierda si el seller navega entre steps. */
interface PendingUpload {
    id: string;
    dataUrl: string;
    filename: string;
}

/** Lee el File como base64 dataURL — formato persistente (no se revoca, sobrevive
 *  re-mounts y navegación entre steps del wizard). */
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
        reader.readAsDataURL(file);
    });
}

/** Lee las dimensiones reales del File en el browser (para la validación de
 *  tamaño mínimo, ML y Falabella). Degrada a 0×0 si la imagen no se puede decodificar. */
function readImageSize(file: File): Promise<{ w: number; h: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = URL.createObjectURL(file);
    });
}

export function ImageUploader({ images, onChange, max = 12, channel, categoryId, title }: ImageUploaderProps) {
    const api = usePublicarApi();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [hover, setHover] = useState(false);
    const [pending, setPending] = useState<PendingUpload[]>([]);
    const [error, setError] = useState<string | null>(null);

    // ML no acepta webp; Falabella sí. Calculado por canal (Task 7).
    const accept = channel === "fala"
        ? "image/jpeg,image/png,image/webp"
        : "image/jpeg,image/png"; // ML: solo JPG/PNG

    const upload = useCallback(
        async (files: File[]) => {
            setError(null);
            const slots = Math.max(0, max - images.length - pending.length);
            if (slots <= 0) {
                setError(`Máximo ${max} imágenes.`);
                return;
            }
            const toUpload = files.slice(0, slots);

            // 1. Generar pending items con dataUrl base64 (persistente).
            const newPending: PendingUpload[] = await Promise.all(
                toUpload.map(async (f) => ({
                    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    dataUrl: await fileToDataUrl(f),
                    filename: f.name,
                })),
            );
            setPending((prev) => [...prev, ...newPending]);

            // 2. Upload secuencial (ML rate-limits agresivo).
            const successes: UploadedImage[] = [];
            for (let i = 0; i < toUpload.length; i++) {
                const f = toUpload[i]!;
                const pendingItem = newPending[i]!;
                // Validación local de tamaño mínimo. ML es más estricto que Fala:
                // si no llega al mínimo del canal, no subimos ese archivo y seguimos
                // con el resto del set.
                const { w, h } = await readImageSize(f);
                const minSize = channel === "fala" ? 300 : 500;
                if (w < minSize || h < minSize) {
                    setError(`${f.name}: mínimo ${minSize}×${minSize} px`);
                    continue;
                }
                try {
                    const img = await api.uploadImagen(f, channel);
                    // Diagnóstico de calidad ML (solo ML, no bloquea — corre y se
                    // adjunta al item exitoso). Degrada graceful si falla.
                    let diagnostic: ImageDiagnostic | undefined;
                    // Diagnóstico oficial de ML por URL (Cloudinary). diagnosePicture acepta
                    // picture_url; mantiene fondo blanco / tamaño / logo / marca de agua.
                    if (channel !== "fala" && (img.secureUrl || img.url)) {
                        const isPrimary = images.length + successes.length === 0; // 1ª imagen del set total
                        diagnostic = await api.diagnosticarImagen({
                            pictureUrl: img.secureUrl || img.url,
                            categoryId,
                            title,
                            pictureType: isPrimary ? "thumbnail" : "other",
                        });
                    }
                    successes.push({
                        ...img,
                        dataUrl: pendingItem.dataUrl,
                        diagnostic,
                    });
                } catch (e) {
                    setError(
                        `Error al subir ${f.name}: ${(e as Error)?.message ?? "(sin detalle)"}`,
                    );
                    successes.push({
                        dataUrl: pendingItem.dataUrl,
                    });
                }
            }

            // 3. Reemplazar pending por uploaded
            setPending((prev) =>
                prev.filter((p) => !newPending.some((n) => n.id === p.id)),
            );
            if (successes.length > 0) {
                onChange([...images, ...successes]);
            }
        },
        [api, images, max, onChange, pending.length, channel, categoryId, title],
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) void upload(files);
            e.target.value = "";
        },
        [upload],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setHover(false);
            const files = Array.from(e.dataTransfer?.files ?? []);
            if (files.length) void upload(files);
        },
        [upload],
    );

    const removeAt = useCallback(
        (idx: number) => {
            onChange(images.filter((_, i) => i !== idx));
        },
        [images, onChange],
    );

    return (
        <div>
            {/* Grid + drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setHover(true);
                }}
                onDragLeave={() => setHover(false)}
                onDrop={handleDrop}
                className={[
                    "rounded-lg border-2 border-dashed transition-colors p-3",
                    hover
                        ? "border-blue-500 bg-blue-50/60"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30",
                ].join(" ")}
            >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {images.map((img, i) => (
                        <ImageTile
                            key={img.id ?? img.pictureId ?? img.secureUrl ?? img.url ?? i}
                            image={img}
                            primary={i === 0}
                            onRemove={() => removeAt(i)}
                        />
                    ))}
                    {pending.map((p) => (
                        <PendingTile key={p.id} dataUrl={p.dataUrl} filename={p.filename} />
                    ))}
                    {images.length + pending.length < max && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="aspect-square rounded-md border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 grid place-items-center text-blue-700 transition-colors"
                            aria-label="Agregar imagen"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <Plus className="w-5 h-5" />
                                <span className="text-xs font-medium">Agregar</span>
                            </div>
                        </button>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={handleChange}
                    className="hidden"
                    aria-label="Seleccionar imágenes"
                />
            </div>

            {/* Info + errores */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>
                    {images.length} / {max} imágenes ·{" "}
                    {channel === "fala" ? "JPG, PNG o WebP" : "JPG o PNG"} · máx 10 MB
                    {pending.length > 0 && (
                        <span className="ml-2 text-blue-700">
                            ({pending.length} subiendo…)
                        </span>
                    )}
                </span>
                {error && (
                    <span className="text-rose-600">
                        <strong>Error:</strong> {error}
                    </span>
                )}
            </div>

            {/* Acciones rápidas */}
            {images.length > 0 && (
                <div className="mt-3 flex items-center justify-end gap-2">
                    <ActionButton
                        variant="text"
                        size="sm"
                        onClick={() => onChange([])}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Quitar todas
                    </ActionButton>
                </div>
            )}
        </div>
    );
}

function ImageTile({
    image,
    primary,
    onRemove,
}: {
    image: UploadedImage;
    primary: boolean;
    onRemove: () => void;
}) {
    // Orden de preferencia: secureUrl (CDN ML) > url (legacy) > dataUrl (preview local).
    const src = image.secureUrl ?? image.url ?? image.dataUrl;
    return (
        <div className="relative aspect-square rounded-md overflow-hidden ring-1 ring-gray-200 group bg-gray-100">
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full grid place-items-center text-gray-300">
                    <ImageIcon className="w-7 h-7" />
                </div>
            )}
            {primary && (
                <span className="absolute top-1 left-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wide bg-blue-700 text-white">
                    Portada
                </span>
            )}
            <button
                type="button"
                onClick={onRemove}
                aria-label="Quitar imagen"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-900/80 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <svg
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="w-2.5 h-2.5"
                >
                    <path d="M3 3l4 4M7 3l-4 4" />
                </svg>
            </button>
            {image.diagnostic?.action === "diagnostic" && image.diagnostic.detections.length > 0 && (
                <div
                    className={[
                        "absolute bottom-0 inset-x-0 text-white text-[9px] leading-tight px-1 py-0.5",
                        // La portada usa rose (más visible); el resto amber.
                        primary ? "bg-rose-500/90" : "bg-amber-500/90",
                    ].join(" ")}
                    title={image.diagnostic.detections.map((d) => d.message).join("\n")}
                >
                    ⚠ {image.diagnostic.detections.length} aviso
                    {image.diagnostic.detections.length > 1 ? "s" : ""}
                </div>
            )}
        </div>
    );
}

/** Tile mientras la imagen está subiendo — muestra la imagen local (base64
 *  dataURL persistente) con un overlay de spinner. Cuando el upload termina,
 *  este tile se reemplaza por un `ImageTile` con la URL del CDN. */
function PendingTile({ dataUrl, filename }: { dataUrl: string; filename: string }) {
    return (
        <div
            className="relative aspect-square rounded-md overflow-hidden ring-1 ring-blue-300"
            title={`Subiendo ${filename}…`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-blue-900/20 grid place-items-center">
                <div className="w-6 h-6 rounded-full border-2 border-white/70 border-t-white animate-spin" />
            </div>
        </div>
    );
}
