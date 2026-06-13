// features/catalogo/pages/plataforma-ecommerce/shared/mapeo-categorias/base/components/CategoriasTree.tsx
//
// Tree N1 → N2 → N3 con expand/collapse de N2 y selección de N3.
// Patrón visual de `Mimbral Mercadolibre/categorias.html` (función `Tree`).

"use client";

import type { CategoriaNodo } from "../types/mapeo-categorias-types";

export interface CategoriasTreeProps {
    nodes: CategoriaNodo[];
    expanded: Set<string>;
    selectedN3Id: string | null;
    onToggle: (n2Id: string) => void;
    onSelect: (n3Id: string) => void;
    loading?: boolean;
    error?: string | null;
}

export function CategoriasTree({
    nodes,
    expanded,
    selectedN3Id,
    onToggle,
    onSelect,
    loading,
    error,
}: CategoriasTreeProps) {
    if (loading) {
        return (
            <div className="px-3 py-4 text-[12px] text-gray-400">
                Cargando árbol…
            </div>
        );
    }
    if (error) {
        return (
            <div className="mx-3 my-2 rounded bg-rose-50 border border-rose-200 px-3 py-2 text-[12px] text-rose-700">
                {error}
            </div>
        );
    }
    if (nodes.length === 0) {
        return (
            <div className="px-3 py-4 text-[12px] text-gray-400">
                Sin categorías
            </div>
        );
    }

    return (
        <div className="text-[12.5px]">
            {nodes.map((n1) => (
                <N1Block
                    key={String(n1.id)}
                    n1={n1}
                    expanded={expanded}
                    selectedN3Id={selectedN3Id}
                    onToggle={onToggle}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

function N1Block({
    n1,
    expanded,
    selectedN3Id,
    onToggle,
    onSelect,
}: {
    n1: CategoriaNodo;
    expanded: Set<string>;
    selectedN3Id: string | null;
    onToggle: (n2Id: string) => void;
    onSelect: (n3Id: string) => void;
}) {
    const n2s = n1.subcategorias ?? [];
    return (
        <div>
            <div className="flex items-center gap-2 px-3 h-8 text-[11px] uppercase tracking-wide font-semibold text-gray-500">
                <span className="rotate-90 text-gray-400">
                    <Caret />
                </span>
                <span className="truncate flex-1">{n1.nombre}</span>
                {typeof n1.count === "number" && (
                    <span className="text-gray-400 tabular-nums">{n1.count}</span>
                )}
            </div>
            {n2s.map((n2) => {
                const n2Id = String(n2.id);
                const isOpen = expanded.has(n2Id);
                const n3s = n2.subcategorias ?? [];
                return (
                    <div key={n2Id}>
                        <button
                            type="button"
                            onClick={() => onToggle(n2Id)}
                            className="w-full flex items-center gap-2 pl-9 pr-3 h-7 text-gray-700 font-medium text-left hover:bg-gray-50 transition-colors"
                        >
                            <span
                                className={[
                                    "transition-transform inline-flex",
                                    isOpen ? "rotate-90 text-gray-700" : "text-gray-400",
                                ].join(" ")}
                            >
                                <Caret />
                            </span>
                            <span className="truncate flex-1">{n2.nombre}</span>
                            {typeof n2.count === "number" && (
                                <span className="text-[11px] text-gray-400 tabular-nums">
                                    {n2.count}
                                </span>
                            )}
                        </button>
                        {isOpen &&
                            n3s.map((n3) => {
                                const n3Id = String(n3.id);
                                const sel = selectedN3Id === n3Id;
                                return (
                                    <button
                                        key={n3Id}
                                        type="button"
                                        onClick={() => onSelect(n3Id)}
                                        className={[
                                            "w-full flex items-center gap-2 pl-14 pr-3 h-7 text-left transition-colors",
                                            sel
                                                ? "bg-blue-50 text-blue-700 font-medium"
                                                : "text-gray-600 hover:bg-gray-100",
                                        ].join(" ")}
                                        aria-current={sel ? "true" : undefined}
                                    >
                                        <span
                                            className={[
                                                "w-1.5 h-1.5 rounded-full shrink-0",
                                                n3.mapeado
                                                    ? "bg-emerald-500"
                                                    : "bg-amber-500",
                                            ].join(" ")}
                                            aria-label={n3.mapeado ? "Mapeada" : "Sin mapear"}
                                        />
                                        <span className="truncate flex-1">{n3.nombre}</span>
                                    </button>
                                );
                            })}
                    </div>
                );
            })}
        </div>
    );
}

function Caret() {
    return (
        <svg
            className="w-3 h-3"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path d="M4.5 3l3 3-3 3" />
        </svg>
    );
}
