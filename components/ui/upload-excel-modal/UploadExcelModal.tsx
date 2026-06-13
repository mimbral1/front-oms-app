import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/ui/button/action-button";
import { FolderIcon, XMarkIcon } from "@heroicons/react/24/outline";

type UploadExcelModalProps = {
    open: boolean;
    onClose: () => void;
    targetLabel?: string | null;
    onConfirm?: (file: File) => void | boolean | Promise<void | boolean>;
    maxFileSizeMB?: number;
    uploadProgress?: number | null;
    isUploading?: boolean;
};

const DEFAULT_MAX_FILE_SIZE_MB = 50;

export function UploadExcelModal({
    open,
    onClose,
    targetLabel,
    onConfirm,
    maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
    uploadProgress = null,
    isUploading = false,
}: UploadExcelModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const isValidExcelFile = (file: File) => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    };

    const formatFileSize = (size: number) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const resetLocalState = () => {
        setSelectedFile(null);
        setIsDragOver(false);
        setError("");
    };

    const handleFileSelection = (file: File | null) => {
        if (!file) return;
        if (!isValidExcelFile(file)) {
            setSelectedFile(null);
            setError("Archivo invalido. Solo se permiten archivos .xls o .xlsx.");
            return;
        }
        if (file.size > maxFileSizeBytes) {
            setSelectedFile(null);
            setError(`El archivo supera el maximo de ${maxFileSizeMB} MB.`);
            return;
        }

        setSelectedFile(file);
        setError("");
    };

    const handleClose = () => {
        resetLocalState();
        onClose();
    };

    const handleConfirm = async () => {
        if (!selectedFile) {
            setError("Debes seleccionar un archivo Excel para continuar.");
            return;
        }
        setError("");
        const shouldClose = await onConfirm?.(selectedFile);
        if (shouldClose !== false) {
            handleClose();
        }
    };

    const progressValue = Math.max(0, Math.min(100, uploadProgress ?? 0));

    useEffect(() => {
        if (!open) {
            resetLocalState();
            return;
        }

        modalRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={handleClose} aria-hidden="true">
            <div
                ref={modalRef}
                className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl outline-none"
                role="dialog"
                aria-modal="true"
                aria-label="Modal de carga de Excel"
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-end">
                    <button
                        type="button"
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Cerrar modal"
                        onClick={handleClose}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-5 text-center">
                    <h2 className="text-3xl font-semibold text-slate-900">Sube tu archivo</h2>
                    <p className="mt-1 text-sm text-slate-500">{targetLabel ?? "para adjuntar a un proyecto"}</p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    className="hidden"
                    onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
                />

                <div
                    className={`rounded-xl border border-dashed p-10 text-center transition ${isDragOver ? "border-blue-300 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(event) => {
                        event.preventDefault();
                        setIsDragOver(false);
                        handleFileSelection(event.dataTransfer.files?.[0] ?? null);
                    }}
                >
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <FolderIcon className="h-10 w-10" />
                    </div>
                    <p className="text-sm text-slate-700">
                        Arrastra y suelta tu archivo aquí o {" "}
                        <button
                            type="button"
                            className="font-medium text-blue-600 underline-offset-2 hover:underline"
                            onClick={() => inputRef.current?.click()}
                        >
                            selecciona un archivo
                        </button>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{maxFileSizeMB} MB tamaño máximo de archivo</p>
                </div>

                <div className="mt-4 min-h-5 text-sm">{error && <p className="text-red-600">{error}</p>}</div>

                {selectedFile && (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">{selectedFile.name}</p>
                                <p className="text-xs text-slate-500">
                                    {isUploading ? `${progressValue}% cargado` : formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Quitar archivo"
                                onClick={() => setSelectedFile(null)}
                                disabled={isUploading}
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                        {isUploading && (
                            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                                <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progressValue}%` }} />
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <ActionButton variant="secondary" onClick={handleClose} disabled={isUploading}>
                        Cancelar
                    </ActionButton>
                    <ActionButton variant="primary" onClick={handleConfirm} disabled={!selectedFile || isUploading}>
                        Cargar
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}
