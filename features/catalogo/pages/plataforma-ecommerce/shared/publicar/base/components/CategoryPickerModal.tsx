// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/CategoryPickerModal.tsx
//
// Modal de búsqueda de categoría marketplace. Search en backend con debounce,
// click selecciona y cierra. Cubre escritura libre (path completo) y autocomplete.
//
// Look OMS: SimpleModal + ActionButton + lucide Search icon.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { SimpleModal } from "@/components/ui/modal";
import { ActionButton } from "@/components/ui";
import { usePublicarApi } from "../api/publicar-api";
import type {
    MarketplaceCategory,
    PublicarChannel,
} from "../types/publicar-types";

export interface CategoryPickerModalProps {
    open: boolean;
    onClose: () => void;
    channel: PublicarChannel;
    onSelect: (cat: MarketplaceCategory) => void;
    /** Categoría actualmente seleccionada — para resaltarla en la lista. */
    current?: MarketplaceCategory | null;
}

const DEBOUNCE_MS = 300;

export function CategoryPickerModal({
    open,
    onClose,
    channel,
    onSelect,
    current,
}: CategoryPickerModalProps) {
    const api = usePublicarApi();
    const [q, setQ] = useState("");
    const [results, setResults] = useState<ReadonlyArray<MarketplaceCategory>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            if (q.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const res = await api.searchCategorias(q.trim(), channel);
                setResults(res);
            } catch (e) {
                setError((e as Error)?.message ?? "Error en búsqueda");
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [api, channel, open, q]);

    const handleSelect = useCallback(
        (cat: MarketplaceCategory) => {
            onSelect(cat);
            onClose();
        },
        [onClose, onSelect],
    );

    return (
        <SimpleModal
            open={open}
            onClose={onClose}
            title={`Buscar categoría · ${channel === "ml" ? "MercadoLibre" : "Falabella"}`}
            maxWidth="sm:max-w-2xl"
        >
            <div className="space-y-4">
                {/* Search input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                        autoFocus
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nombre o ID (ej. MLC1648, taladros, clavos…)"
                        className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Results list */}
                <div className="max-h-96 overflow-y-auto -mx-2">
                    {q.trim().length < 2 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">
                            Escribe al menos 2 caracteres para buscar.
                        </div>
                    ) : loading ? (
                        <div className="py-10 text-center text-gray-400 text-sm">
                            Buscando…
                        </div>
                    ) : error ? (
                        <div className="py-10 text-center text-rose-600 text-sm">
                            Error: {error}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 text-sm">
                            Sin resultados. Intenta con otros términos o usa el ID
                            directo del marketplace.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {results.map((cat) => {
                                const sel = current?.id === cat.id;
                                return (
                                    <li key={cat.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(cat)}
                                            className={[
                                                "w-full text-left px-3 py-3 rounded-md transition-colors",
                                                sel
                                                    ? "bg-blue-50 ring-1 ring-blue-200"
                                                    : "hover:bg-gray-50",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 tabular-nums">
                                                    {cat.id}
                                                </span>
                                                {cat.suggested && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                                        Sugerida
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-900 mt-1">
                                                {cat.path || cat.nombre}
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 -mx-2 px-2">
                    <ActionButton variant="secondary" size="sm" onClick={onClose}>
                        Cancelar
                    </ActionButton>
                </div>
            </div>
        </SimpleModal>
    );
}
