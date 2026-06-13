// hooks/useSessionStorageState.ts
//
// Versión de `useState` que persiste en `sessionStorage` con la `key` dada.
//
// Útil para preservar filtros / paginación / wizard state entre navegaciones
// internas: cuando el usuario navega de Catálogo a Publicar y vuelve, el state
// del componente se reinicia (Next App Router desmonta y vuelve a montar la
// página), pero el contenido de `sessionStorage` sobrevive.
//
// Implementación (rewrite 2026-05-20 — fix hydration):
//   - **mounted flag**: el primer render (SSR y primer render del cliente)
//     retornan `defaultValue` SIEMPRE. Después del `useEffect` inicial (que
//     solo corre en cliente) se hidrata desde `sessionStorage` y se setea
//     `mounted=true`. Esto garantiza que el HTML del server matchee el del
//     primer render del cliente — sin hydration mismatch.
//   - Trade-off conocido: hay un "flash" del defaultValue por ~1 frame en el
//     cliente antes de que se hidrate desde storage. Para filtros / paginación
//     / wizard state es imperceptible. Si tu caso de uso necesita NO mostrar
//     el defaultValue (ej. password remember), usar otro hook.
//   - SSR-safe: en server retorna `defaultValue` (no hay window).
//   - Tolerante a JSON inválido o claves vacías — cae al default y limpia.
//
// Historia del fix (2026-05-20):
//   La versión anterior usaba `useState` con lazy initializer (`useState(() =>
//   readFromStorage(...))`). En el servidor leía defaultValue, en el cliente
//   leía sessionStorage. Si difieren, Next App Router lanza un Hydration Error.
//   Apareció primero en `CatalogoView` → `CatalogoPagination` cuando los
//   filtros guardados hacían `isSearchActive=true` en client pero `false` en
//   server (o viceversa).

"use client";

import { useCallback, useEffect, useState } from "react";

function readFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    try {
        const stored = window.sessionStorage.getItem(key);
        if (stored != null) {
            return JSON.parse(stored) as T;
        }
    } catch {
        // JSON corrupto: limpiar para no propagar el error.
        try {
            window.sessionStorage.removeItem(key);
        } catch {
            /* ignore */
        }
    }
    return defaultValue;
}

export function useSessionStorageState<T>(
    key: string,
    defaultValue: T,
): [T, (next: T | ((prev: T) => T)) => void] {
    // Primer render (SSR y client) SIEMPRE retornan defaultValue.
    // Eso garantiza que el HTML del server == HTML del primer render del client.
    const [value, setValue] = useState<T>(defaultValue);
    const [hydrated, setHydrated] = useState(false);

    // Effect que solo corre en el cliente, una sola vez tras el mount.
    // Lee storage y hidrata el state. A partir de acá, el state vive su
    // ciclo normal (cambios → persistir).
    useEffect(() => {
        const stored = readFromStorage(key, defaultValue);
        setValue(stored);
        setHydrated(true);
        // No incluimos `defaultValue` en deps: el caller suele pasarlo
        // inline ({...}) y eso causaría re-hidratación infinita. La key
        // sí se respeta — si cambia, volvemos a leer storage.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    // Persistir cambios en sessionStorage, pero SOLO después de hidratar.
    // Sin este guard, el primer render escribiría `defaultValue` al storage
    // pisando el valor existente — exactamente el bug que tenía la versión
    // anterior con doble useEffect.
    useEffect(() => {
        if (!hydrated) return;
        if (typeof window === "undefined") return;
        try {
            if (value === null || value === undefined) {
                window.sessionStorage.removeItem(key);
            } else {
                window.sessionStorage.setItem(key, JSON.stringify(value));
            }
        } catch {
            /* quota llena u otro error: ignorar — el state local sigue funcionando */
        }
    }, [key, value, hydrated]);

    // Wrapper estable de `setValue` (mantiene el contrato de `useState`).
    const setValueStable = useCallback(
        (next: T | ((prev: T) => T)) => {
            setValue(next);
        },
        [],
    );

    return [value, setValueStable];
}
