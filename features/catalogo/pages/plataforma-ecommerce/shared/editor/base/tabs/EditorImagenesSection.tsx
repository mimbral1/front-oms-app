// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorImagenesSection.tsx
//
// Card "Imágenes" del editor — match al legacy editar.html (sec-imgs, líneas 2006-2120).
//
// Features:
//   - Grid de thumbs con badge "Portada" en el primero
//   - Click en X para eliminar (con modal interno)
//   - Drop zone para arrastrar archivos o click para seleccionar
//   - Upload secuencial con preview optimista (base64 dataUrl) hasta que el
//     backend devuelva secure_url del CDN ML
//   - Max 12 imágenes (constraint ML, también respeta `imagenes.maximo`
//     del backend si está)
//   - Warning si <6 imágenes (recomendación ML)
//   - Status text durante uploads (1/3, 2/3, etc) + errores
//
// Sin drag-drop reorder en V1. Si se necesita, port del legacy
// (`imgDs`/`imgDo`/`imgDp`/`imgDe`).

"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { ActionButton, Card } from "@/components/ui";
import { SimpleModal } from "@/components/ui/modal";
import { SectionDivider } from "../../../../_shared/ui";
import { useEditorApi } from "../api/editor-api";
import type { EditorProduct } from "../types/editor-types";
import type { ImageDiagnostic } from "../../../publicar/base/types/publicar-types";

export interface EditorImagenesSectionProps {
    product: EditorProduct;
    editImagenes: string[];
    onChange: (urls: string[]) => void;
}

const ACCEPT = "image/jpeg,image/png";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const DEFAULT_MAX = 12; // ML constraint
const MIN_RECOMMENDED = 6;
const ML_MIN_IMAGE_SIZE = 500;

interface PendingUpload {
    id: string;
    /** Base64 dataURL — persiste entre re-renders, no se revoca. */
    dataUrl: string;
    filename: string;
}

/** Lee un File como base64 dataURL. */
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
        reader.readAsDataURL(file);
    });
}

/** Lee dimensiones reales para cortar antes del upload imágenes que ML rechaza. */
function readImageSize(file: File): Promise<{ w: number; h: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ w: 0, h: 0 });
        };
        img.src = url;
    });
}

export function EditorImagenesSection({
    product,
    editImagenes,
    onChange,
}: EditorImagenesSectionProps) {
    const api = useEditorApi();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [hover, setHover] = useState(false);
    const [pending, setPending] = useState<PendingUpload[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    // Diagnóstico ML por imagen (keyed por secure_url). Solo visual — NO se
    // guarda en el producto; el modelo de guardado sigue siendo `editImagenes`.
    const [diagnostics, setDiagnostics] = useState<Record<string, ImageDiagnostic>>({});

    /** Max permitido — del backend si lo expone, sino default ML. */
    const maxAllowed = product.imagenes?.maximo ?? DEFAULT_MAX;
    const minRecommended = product.imagenes?.minimo_recomendado ?? MIN_RECOMMENDED;

    const upload = useCallback(
        async (files: File[]) => {
            setError(null);
            const slotsLeft = Math.max(
                0,
                maxAllowed - editImagenes.length - pending.length,
            );
            if (slotsLeft <= 0) {
                setError(`Máximo ${maxAllowed} imágenes alcanzado.`);
                return;
            }
            const toUpload = files.slice(0, slotsLeft);
            if (files.length > slotsLeft) {
                setStatus(
                    `Subiendo solo ${slotsLeft} (límite ${maxAllowed} total)…`,
                );
            }

            // 1. Validar tamaños + crear pending items con dataUrl optimistic.
            const validFiles: File[] = [];
            for (const f of toUpload) {
                if (f.size > MAX_FILE_SIZE) {
                    setError(`${f.name}: > 10 MB, descartado.`);
                    continue;
                }
                if (!/^image\/(jpeg|png)$/.test(f.type)) {
                    setError(`${f.name}: tipo inválido. Solo JPG/PNG.`);
                    continue;
                }
                const { w, h } = await readImageSize(f);
                if (w < ML_MIN_IMAGE_SIZE || h < ML_MIN_IMAGE_SIZE) {
                    setError(`${f.name}: mínimo ${ML_MIN_IMAGE_SIZE}×${ML_MIN_IMAGE_SIZE} px.`);
                    continue;
                }
                validFiles.push(f);
            }
            if (validFiles.length === 0) return;

            const newPending: PendingUpload[] = await Promise.all(
                validFiles.map(async (f) => ({
                    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    dataUrl: await fileToDataUrl(f),
                    filename: f.name,
                })),
            );
            setPending((prev) => [...prev, ...newPending]);

            // 2. Upload secuencial. Después de cada exitoso, agregamos al
            //    `editImagenes` y removemos del pending.
            const succeeded: string[] = [];
            const newDiagnostics: Record<string, ImageDiagnostic> = {};
            const isMl = api.marketplaceKey === "ml";
            const tituloValor = product.campos_basicos?.titulo?.valor;
            const tituloCtx =
                typeof tituloValor === "string" ? tituloValor : undefined;
            let done = 0;
            let failed = 0;
            for (let i = 0; i < validFiles.length; i++) {
                const f = validFiles[i]!;
                const pendingItem = newPending[i]!;
                setStatus(
                    `Subiendo ${done + 1}/${validFiles.length}: ${f.name}…`,
                );
                try {
                    const result = await api.uploadImage(f);
                    if (!result?.secure_url) {
                        throw new Error("respuesta sin secure_url");
                    }
                    succeeded.push(result.secure_url);
                    done++;
                    // Diagnóstico de calidad ML (no bloqueante). Replica el flujo
                    // de publicar: valida fondo blanco / tamaño / texto-logo /
                    // marca de agua ANTES de que el seller guarde, para evitar
                    // moderaciones. Solo ML; degrada graceful si falla.
                    if (isMl) {
                        const isPrimary =
                            editImagenes.length + succeeded.length - 1 === 0;
                        setStatus(`Validando ${f.name} con ML…`);
                        const diag = await api.diagnosticarImagen({
                            pictureUrl: result.secure_url,
                            categoryId: product.meta?.category_id,
                            title: tituloCtx,
                            pictureType: isPrimary ? "thumbnail" : "other",
                        });
                        newDiagnostics[result.secure_url] = diag;
                    }
                } catch (e) {
                    failed++;
                    if (process.env.NODE_ENV !== "production") {
                        console.warn("[editor.uploadImage]", f.name, e);
                    }
                }
                // Limpiar el pending item correspondiente.
                setPending((prev) => prev.filter((p) => p.id !== pendingItem.id));
            }

            // 3. Append los exitosos al draft + guardar sus diagnósticos.
            if (succeeded.length > 0) {
                onChange([...editImagenes, ...succeeded]);
            }
            if (Object.keys(newDiagnostics).length > 0) {
                setDiagnostics((prev) => ({ ...prev, ...newDiagnostics }));
            }

            // 4. Status final.
            setStatus(
                `✓ ${done} subida${done !== 1 ? "s" : ""}${failed ? ` · ${failed} con error` : ""}`,
            );
            setTimeout(() => setStatus(null), 4000);
        },
        [api, editImagenes, maxAllowed, onChange, pending.length, product],
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) void upload(files);
            e.target.value = ""; // permite re-seleccionar el mismo archivo
        },
        [upload],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setHover(false);
            const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
                /^image\/(jpeg|png)$/.test(f.type),
            );
            if (files.length) void upload(files);
        },
        [upload],
    );

    const requestRemoveImage = useCallback(
        (idx: number) => {
            setDeleteIndex(idx);
        },
        [],
    );

    const confirmRemoveImage = useCallback(
        () => {
            if (deleteIndex == null) return;
            onChange(editImagenes.filter((_, i) => i !== deleteIndex));
            setDeleteIndex(null);
        },
        [deleteIndex, editImagenes, onChange],
    );

    const moveImage = useCallback(
        (idx: number, direction: -1 | 1) => {
            const target = idx + direction;
            if (target < 0 || target >= editImagenes.length) return;
            const next = [...editImagenes];
            [next[idx], next[target]] = [next[target]!, next[idx]!];
            onChange(next);
        },
        [editImagenes, onChange],
    );

    const totalCount = editImagenes.length + pending.length;
    const isFull = totalCount >= maxAllowed;
    const needsMore = editImagenes.length < minRecommended;

    return (
        <Card title="Imágenes">
            <SectionDivider icon={<ImageIcon className="w-4 h-4" />}>
                Galería del producto
            </SectionDivider>

            <p className="text-xs text-gray-500 mb-3">
                La primera imagen es la portada. JPG o PNG · máx 10 MB ·
                hasta {maxAllowed} imágenes.
            </p>

            {needsMore && (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 mb-3">
                    ⚠ Se recomiendan al menos {minRecommended} imágenes. Tienes{" "}
                    {editImagenes.length}.
                </div>
            )}

            {/* Grid de thumbs + pending */}
            {(editImagenes.length > 0 || pending.length > 0) && (
                <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2 tabular-nums">
                        {totalCount} / {maxAllowed} imágenes
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {editImagenes.map((url, i) => (
                            <ImageTile
                                key={url + i}
                                url={url}
                                index={i}
                                isFirst={i === 0}
                                isLast={i === editImagenes.length - 1}
                                diagnostic={diagnostics[url]}
                                onRemove={() => requestRemoveImage(i)}
                                onMoveUp={() => moveImage(i, -1)}
                                onMoveDown={() => moveImage(i, 1)}
                            />
                        ))}
                        {pending.map((p) => (
                            <PendingTile
                                key={p.id}
                                dataUrl={p.dataUrl}
                                filename={p.filename}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!isFull) setHover(true);
                }}
                onDragLeave={() => setHover(false)}
                onDrop={handleDrop}
                onClick={() => !isFull && inputRef.current?.click()}
                className={[
                    "rounded-lg border-2 border-dashed transition-colors p-6 text-center",
                    isFull
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed text-gray-400"
                        : hover
                          ? "border-blue-500 bg-blue-50/60 cursor-pointer"
                          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer",
                ].join(" ")}
            >
                <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <div className="text-sm font-medium text-gray-700">
                    {isFull
                        ? "Has alcanzado el máximo de imágenes"
                        : "Arrastra imágenes o haz click para seleccionar"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    JPG o PNG · máx 10 MB · hasta {maxAllowed} imágenes · la primera es la portada
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                onChange={handleChange}
                className="hidden"
                aria-label="Seleccionar imágenes"
            />

            {/* Status text */}
            {status && (
                <div className="mt-2 text-xs text-gray-500">{status}</div>
            )}
            {error && (
                <div className="mt-2 text-xs text-rose-600">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <SimpleModal
                open={deleteIndex != null}
                title="Eliminar imagen"
                onClose={() => setDeleteIndex(null)}
                maxWidth="sm:max-w-md"
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            ¿Eliminar imagen {deleteIndex != null ? deleteIndex + 1 : ""}?
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            La imagen se quitará de la galería local. El cambio se enviará a MercadoLibre cuando guardes el producto.
                        </p>
                    </div>

                    {deleteIndex != null && editImagenes[deleteIndex] && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                            <img
                                src={editImagenes[deleteIndex]}
                                alt={`Imagen ${deleteIndex + 1}`}
                                className="mx-auto max-h-40 rounded-md object-contain"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setDeleteIndex(null)}
                        >
                            Cancelar
                        </ActionButton>
                        <ActionButton
                            variant="danger"
                            size="sm"
                            onClick={confirmRemoveImage}
                        >
                            Eliminar
                        </ActionButton>
                    </div>
                </div>
            </SimpleModal>
        </Card>
    );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function ImageTile({
    url,
    index,
    isFirst,
    isLast,
    diagnostic,
    onRemove,
    onMoveUp,
    onMoveDown,
}: {
    url: string;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    diagnostic?: ImageDiagnostic;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const avisos =
        diagnostic?.action === "diagnostic" ? diagnostic.detections : [];
    return (
        <div className="relative aspect-square rounded-md overflow-hidden ring-1 ring-gray-200 group bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt={`Imagen ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23eee"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="%23999" font-size="10">no img</text></svg>';
                }}
            />
            {isFirst && (
                <span className="absolute top-1 left-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-blue-700 text-white">
                    Portada
                </span>
            )}
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Quitar imagen ${index + 1}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-gray-900/80 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
            >
                <Trash2 className="w-3 h-3" />
            </button>
            {/* Move up/down buttons (bottom) */}
            <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={onMoveUp}
                    disabled={isFirst}
                    aria-label="Mover atrás"
                    className="w-6 h-6 rounded bg-gray-900/80 text-white grid place-items-center disabled:opacity-30 hover:bg-gray-900 text-xs"
                    title="Mover atrás (la primera es portada)"
                >
                    ←
                </button>
                <button
                    type="button"
                    onClick={onMoveDown}
                    disabled={isLast}
                    aria-label="Mover adelante"
                    className="w-6 h-6 rounded bg-gray-900/80 text-white grid place-items-center disabled:opacity-30 hover:bg-gray-900 text-xs"
                    title="Mover adelante"
                >
                    →
                </button>
            </div>
            {/* Badge de avisos del diagnóstico ML. Visible en reposo; se oculta
                en hover para no tapar los controles de mover. Portada en rose
                (más visible), resto en amber. */}
            {avisos.length > 0 && (
                <div
                    className={[
                        "absolute bottom-0 inset-x-0 text-white text-[9px] leading-tight px-1 py-0.5 group-hover:opacity-0 transition-opacity",
                        isFirst ? "bg-rose-500/90" : "bg-amber-500/90",
                    ].join(" ")}
                    title={avisos.map((d) => d.message).join("\n")}
                >
                    ⚠ {avisos.length} aviso{avisos.length > 1 ? "s" : ""}
                </div>
            )}
        </div>
    );
}

function PendingTile({ dataUrl, filename }: { dataUrl: string; filename: string }) {
    return (
        <div
            className="relative aspect-square rounded-md overflow-hidden ring-1 ring-blue-300"
            title={`Subiendo ${filename}…`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={dataUrl}
                alt=""
                className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-blue-900/20 grid place-items-center">
                <div className="w-6 h-6 rounded-full border-2 border-white/70 border-t-white animate-spin" />
            </div>
        </div>
    );
}
