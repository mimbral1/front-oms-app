// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/store/carga-masiva.store.ts
//
// Store global de carga masiva. Vive FUERA del ciclo de vida de los
// componentes — sobrevive a desmontajes de CargaMasivaView al navegar al
// wizard de publicar y volver.
//
// Por qué un store global y no useState:
//   El wizard de publicar (`/.../publicar`) y carga masiva (`/.../carga-masiva`)
//   son rutas DISTINTAS de Next App Router. Al navegar entre ellas, Next
//   desmonta el componente origen y monta el destino. Cualquier `useState`
//   local se pierde. Antes intentábamos restaurar desde sessionStorage + fetch
//   al backend, pero eso producía race conditions, loadings innecesarios y
//   estados inconsistentes. Con un store global, el state simplemente NUNCA
//   se desmonta.
//
// Persistencia:
//   `persist` middleware guarda el store en `sessionStorage` automáticamente.
//   Si el seller refresca la página (F5), el store se hidrata desde el storage.
//   Si abre una pestaña nueva, empieza limpio (sessionStorage es por-pestaña).
//
// Lo que vive acá:
//   - stage: en qué paso del wizard de carga masiva está
//   - batch: meta-info del lote (filename, totalRows, status, etc.)
//   - rows: filas validadas del lote
//   - publishSummary: contadores publish_status
//   - progressNote: mensaje de feedback
//   - error: mensaje de error de UI
//
// Lo que NO vive acá:
//   - `file: File`: no es serializable, se queda en useState local del DropZone.
//   - `busy`: flag transitorio durante upload/publish, useState local.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
    BatchSummary,
    BulkRow,
    CargaMasivaStage,
} from "../types/carga-masiva-types";

export interface CargaMasivaState {
    stage: CargaMasivaStage;
    batch: BatchSummary | null;
    rows: BulkRow[];
    publishSummary: Record<string, number>;
    progressNote: string | null;
    error: string | null;
    // Scope por usuario: si en el mismo browser cambia la sesión (Joaquín
    // logout → Rodrigo login), comparamos este id con el actual y reseteamos
    // el store para no exponer el draft del usuario anterior al nuevo.
    lastUserId: number | null;

    setStage: (stage: CargaMasivaStage) => void;
    setBatch: (batch: BatchSummary | null) => void;
    setRows: (rows: BulkRow[]) => void;
    setPublishSummary: (summary: Record<string, number>) => void;
    setProgressNote: (note: string | null) => void;
    setError: (error: string | null) => void;
    setLastUserId: (id: number | null) => void;

    /** Reset al estado inicial (mantiene lastUserId para que el scope siga). */
    reset: () => void;
    /** Reset completo incluyendo lastUserId — usar en logout. */
    resetForUserSwitch: (newUserId: number) => void;
}

const INITIAL_DATA = {
    stage: "upload" as CargaMasivaStage,
    batch: null,
    rows: [],
    publishSummary: {},
    progressNote: null,
    error: null,
};

export const useCargaMasivaStore = create<CargaMasivaState>()(
    persist(
        (set, get) => ({
            ...INITIAL_DATA,
            lastUserId: null,
            setStage: (stage) => set({ stage }),
            setBatch: (batch) => set({ batch }),
            setRows: (rows) => set({ rows }),
            setPublishSummary: (publishSummary) => set({ publishSummary }),
            setProgressNote: (progressNote) => set({ progressNote }),
            setError: (error) => set({ error }),
            setLastUserId: (lastUserId) => set({ lastUserId }),
            reset: () =>
                set({ ...INITIAL_DATA, lastUserId: get().lastUserId }),
            resetForUserSwitch: (newUserId) =>
                set({ ...INITIAL_DATA, lastUserId: newUserId }),
        }),
        {
            name: "carga-masiva-store",
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                stage: state.stage,
                batch: state.batch,
                rows: state.rows,
                publishSummary: state.publishSummary,
                lastUserId: state.lastUserId,
            }),
        },
    ),
);
