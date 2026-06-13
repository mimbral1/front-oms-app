// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/hooks/useCargaMasivaUpload.ts
//
// Hook que orquesta el flujo de carga masiva. State persistente vive en el
// store global `useCargaMasivaStore` (Zustand + sessionStorage). Este hook
// solo provee las acciones (upload, polling, publishAll, reset) y conecta
// con el store.
//
// Rediseño Mayo 2026:
//   - Antes: useState local + useSessionStorageState + restore manual con
//     useEffect + refs + cancellation logic. ~340 LOC con race conditions.
//   - Ahora: useCargaMasivaStore (Zustand) maneja el state. El hook solo tiene
//     las acciones (sin restore — el state ya vive en el store entre
//     navegaciones). ~140 LOC sin race conditions.
//
// Por qué Zustand: el wizard de publicar y carga masiva son rutas distintas.
// Al navegar entre ellas, Next desmonta el componente y el state local muere.
// El store global vive fuera de los componentes, no se desmonta.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useCargaMasivaApi } from "../api/carga-masiva-api";
import { useCargaMasivaStore } from "../store/carga-masiva.store";
import type {
    BulkRow,
    CargaMasivaStage,
    BatchSummary,
} from "../types/carga-masiva-types";

const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 90; // 3 minutos a 2s/poll

/**
 * Estados de batch que indican que ya no hay más procesamiento pendiente y
 * la UI puede pasar a stage="preview".
 */
const TERMINAL_STATUSES = new Set(["ready", "done", "archived"]);

export interface UseCargaMasivaUploadOptions {
    accountId: number;
}

export interface UseCargaMasivaUploadReturn {
    stage: CargaMasivaStage;
    error: string | null;
    file: File | null;
    batch: BatchSummary | null;
    rows: BulkRow[];
    publishSummary: Record<string, number>;
    progressNote: string | null;
    busy: boolean;
    pickFile: (f: File | null) => void;
    submitFile: () => Promise<void>;
    reset: () => void;
    publishAll: () => Promise<void>;
    reloadQueue: () => Promise<void>;
    downloadTemplate: () => Promise<void>;
}

export function useCargaMasivaUpload({
    accountId,
}: UseCargaMasivaUploadOptions): UseCargaMasivaUploadReturn {
    const api = useCargaMasivaApi();
    const { user } = useAuth();
    const userId = Number(user?.id) || 0;

    // State persistente desde el store global. Sobrevive desmontajes de la vista.
    const stage = useCargaMasivaStore((s) => s.stage);
    const batch = useCargaMasivaStore((s) => s.batch);
    const rows = useCargaMasivaStore((s) => s.rows);
    const publishSummary = useCargaMasivaStore((s) => s.publishSummary);
    const progressNote = useCargaMasivaStore((s) => s.progressNote);
    const error = useCargaMasivaStore((s) => s.error);
    const setStage = useCargaMasivaStore((s) => s.setStage);
    const setBatch = useCargaMasivaStore((s) => s.setBatch);
    const setRows = useCargaMasivaStore((s) => s.setRows);
    const setPublishSummary = useCargaMasivaStore((s) => s.setPublishSummary);
    const setProgressNote = useCargaMasivaStore((s) => s.setProgressNote);
    const setError = useCargaMasivaStore((s) => s.setError);
    const resetStore = useCargaMasivaStore((s) => s.reset);

    // State local (transitorio, no se persiste):
    //   - file: no es serializable (File API).
    //   - busy: flag de operaciones en curso (upload, publish-all).
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);

    const pollAttemptsRef = useRef(0);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearPoll = useCallback(() => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        pollAttemptsRef.current = 0;
    }, []);

    const reset = useCallback(() => {
        clearPoll();
        setFile(null);
        setBusy(false);
        resetStore();
    }, [clearPoll, resetStore]);

    /** Carga la queue completa (rows + summary + batch refresh). */
    const loadQueueInto = useCallback(
        async (batchId: string) => {
            const queue = await api.getQueue(batchId);
            setRows(queue.rows);
            setPublishSummary(queue.publishSummary);
            if (queue.batch?.batchId) setBatch(queue.batch);
        },
        [api, setRows, setPublishSummary, setBatch],
    );

    /** Loop de polling del batch. */
    const pollBatch = useCallback(
        async (batchId: string) => {
            try {
                const fresh = await api.getBatch(batchId);
                setBatch(fresh);

                const status = fresh.status ?? "validating";

                if (status === "error") {
                    setError(`El backend reportó error al validar el lote ${batchId}.`);
                    setStage("upload");
                    clearPoll();
                    return;
                }

                if (TERMINAL_STATUSES.has(status)) {
                    setProgressNote("Cargando resultado…");
                    await loadQueueInto(batchId);
                    setStage("preview");
                    setProgressNote(null);
                    clearPoll();
                    return;
                }

                pollAttemptsRef.current += 1;
                if (pollAttemptsRef.current > POLL_MAX_ATTEMPTS) {
                    setError(
                        "El backend está tardando demasiado. Refresca la página o revisa el job manualmente.",
                    );
                    setStage("upload");
                    clearPoll();
                    return;
                }
                const okSoFar = fresh.okRows ?? 0;
                const total = fresh.totalRows ?? 0;
                setProgressNote(
                    total > 0
                        ? `Validando contra ML · ${okSoFar}/${total}`
                        : "Validando…",
                );
                pollTimerRef.current = setTimeout(
                    () => pollBatch(batchId),
                    POLL_INTERVAL_MS,
                );
            } catch (e) {
                setError((e as Error)?.message ?? "Error polling batch");
                setStage("upload");
                clearPoll();
            }
        },
        [api, clearPoll, loadQueueInto, setBatch, setError, setProgressNote, setStage],
    );

    const submitFile = useCallback(async () => {
        if (!file) {
            setError("Selecciona un archivo antes de subir.");
            return;
        }
        if (!userId) {
            setError("No se pudo identificar el usuario actual (JWT vacío).");
            return;
        }
        if (!accountId) {
            setError("Falta el accountId del marketplace.");
            return;
        }
        setBusy(true);
        setError(null);
        setStage("processing");
        setProgressNote("Subiendo archivo…");
        try {
            const created = await api.upload({
                file,
                accountId,
                uploadedBy: userId,
            });
            setBatch(created);

            const isTerminal = TERMINAL_STATUSES.has(created.status ?? "");
            if (isTerminal) {
                setProgressNote("Cargando resultado…");
                await loadQueueInto(created.batchId);
                setStage("preview");
                setProgressNote(null);
            } else {
                setProgressNote("Validando…");
                pollAttemptsRef.current = 0;
                pollBatch(created.batchId);
            }
        } catch (e) {
            setError((e as Error)?.message ?? "Error subiendo el archivo");
            setStage("upload");
            setProgressNote(null);
        } finally {
            setBusy(false);
        }
    }, [accountId, api, file, loadQueueInto, pollBatch, setBatch, setError, setProgressNote, setStage, userId]);

    const publishAll = useCallback(async () => {
        if (!batch?.batchId) return;
        setBusy(true);
        try {
            await api.publishAll(batch.batchId);
            await loadQueueInto(batch.batchId);
        } catch (e) {
            setError((e as Error)?.message ?? "Error aplicando los OK");
        } finally {
            setBusy(false);
        }
    }, [api, batch?.batchId, loadQueueInto, setError]);

    const downloadTemplate = useCallback(async () => {
        try {
            setError(null);
            await api.downloadTemplate();
        } catch (e) {
            setError(
                (e as Error)?.message ?? "No se pudo descargar la plantilla",
            );
        }
    }, [api, setError]);

    const reloadQueue = useCallback(async () => {
        if (!batch?.batchId) return;
        try {
            await loadQueueInto(batch.batchId);
        } catch (e) {
            setError((e as Error)?.message ?? "Error recargando la cola");
        }
    }, [batch?.batchId, loadQueueInto, setError]);

    // Cleanup del polling al desmontar.
    useEffect(() => () => clearPoll(), [clearPoll]);

    // Scope por accountId: si el seller cambia de cuenta (raro hoy, pero
    // posible en V2), reseteamos.
    const lastAccountIdRef = useRef(accountId);
    useEffect(() => {
        if (lastAccountIdRef.current !== accountId) {
            reset();
            lastAccountIdRef.current = accountId;
        }
    }, [accountId, reset]);

    // Scope por userId: si en el mismo browser cambia la sesión (Joaquín
    // logout → Rodrigo login), reseteamos el store para no exponer el draft
    // del usuario anterior. El check pasa por el store directamente (no por
    // ref) para que se persista entre reloads y se evalúe al hidratar.
    const storedLastUserId = useCargaMasivaStore((s) => s.lastUserId);
    const resetForUserSwitch = useCargaMasivaStore((s) => s.resetForUserSwitch);
    const setLastUserId = useCargaMasivaStore((s) => s.setLastUserId);
    useEffect(() => {
        if (!userId) return; // no autenticado todavía → esperar
        if (storedLastUserId === null) {
            // primera vez que el store ve un user → solo marcar
            setLastUserId(userId);
            return;
        }
        if (storedLastUserId !== userId) {
            // cambio de usuario en el mismo browser → reset completo
            resetForUserSwitch(userId);
        }
    }, [userId, storedLastUserId, resetForUserSwitch, setLastUserId]);

    return {
        stage,
        error,
        file,
        batch,
        rows,
        publishSummary,
        progressNote,
        busy,
        pickFile: setFile,
        submitFile,
        reset,
        publishAll,
        reloadQueue,
        downloadTemplate,
    };
}
