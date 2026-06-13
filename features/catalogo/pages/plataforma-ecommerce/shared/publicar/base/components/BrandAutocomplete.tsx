// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/BrandAutocomplete.tsx
//
// Selector de marca Falabella con autocomplete contra el catálogo real
// (GET /api/pim/canales/falabella/marcas → cache fal_brands). Falabella valida
// la marca contra su catálogo: si no existe, el producto se rechaza. Por eso
// mostramos solo marcas válidas + sugerimos "Genérico" cuando no hay match.

"use client";

import { useEffect, useRef, useState } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";

interface FalaBrand {
    brand_id: number;
    name: string;
    global_identifier?: string | null;
}
interface Envelope {
    ok?: boolean;
    data?: FalaBrand[];
}

const INPUT_CLASSES = [
    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
    "text-gray-900 bg-white shadow-sm",
    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
].join(" ");

export interface BrandAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function BrandAutocomplete({ value, onChange, placeholder }: BrandAutocompleteProps) {
    const { fetchWithAuthPim } = useFetchWithAuthPim();
    const [q, setQ] = useState(value ?? "");
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<FalaBrand[]>([]);
    const [loading, setLoading] = useState(false);
    // null = desconocido (sin buscar); true/false = si el texto matchea una marca exacta.
    const [exact, setExact] = useState<boolean | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setQ(value ?? "");
    }, [value]);

    const fetchBrands = (text: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const env = await fetchWithAuthPim<Envelope>(
                    `/api/pim/canales/falabella/marcas?q=${encodeURIComponent(text)}&limit=20`,
                );
                const list = Array.isArray(env?.data) ? env.data : [];
                setItems(list);
                const t = text.trim().toLowerCase();
                setExact(t ? list.some((b) => b.name.toLowerCase() === t) : null);
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        }, 250);
    };

    const handleInput = (text: string) => {
        setQ(text);
        onChange(text);
        setOpen(true);
        fetchBrands(text);
    };

    const select = (name: string) => {
        setQ(name);
        onChange(name);
        setExact(true);
        setOpen(false);
    };

    return (
        <div className="relative">
            <input
                className={INPUT_CLASSES}
                value={q}
                onChange={(e) => handleInput(e.target.value)}
                onFocus={() => {
                    setOpen(true);
                    if (!items.length) fetchBrands(q);
                }}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder={placeholder}
                autoComplete="off"
            />

            {/* Estado de validez de la marca */}
            {q.trim() && exact === false && (
                <div className="text-[11px] text-amber-700 mt-1">
                    &quot;{q}&quot; no está en el catálogo de Falabella → la rechazaría.{" "}
                    <button
                        type="button"
                        className="underline font-medium"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            select("Genérico");
                        }}
                    >
                        Usar &quot;Genérico&quot;
                    </button>
                </div>
            )}
            {q.trim() && exact === true && (
                <div className="text-[11px] text-emerald-700 mt-1">✓ marca válida en Falabella</div>
            )}

            {/* Dropdown de resultados */}
            {open && (loading || items.length > 0) && (
                <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {loading && (
                        <li className="px-3 py-2 text-xs text-gray-400">Buscando…</li>
                    )}
                    {!loading &&
                        items.map((b) => (
                            <li key={b.brand_id}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        select(b.name);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-800 hover:bg-blue-50"
                                >
                                    {b.name}
                                </button>
                            </li>
                        ))}
                    {!loading && q.trim() && !items.some((b) => b.name.toLowerCase() === q.trim().toLowerCase()) && (
                        <li>
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    select("Genérico");
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 border-t border-gray-100"
                            >
                                Usar &quot;Genérico&quot; (sin marca válida)
                            </button>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
