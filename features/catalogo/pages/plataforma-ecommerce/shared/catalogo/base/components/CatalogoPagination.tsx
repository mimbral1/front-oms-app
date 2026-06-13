// features/catalogo/pages/plataforma-ecommerce/shared/catalogo/base/components/CatalogoPagination.tsx
//
// Pagination numerada estilo Janis: botón << activo + nums sliding + "..." + último.

"use client";

import { useMemo } from "react";

export interface CatalogoPaginationProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

const BTN_BASE =
    "h-7 min-w-[28px] px-2 grid place-items-center rounded border border-gray-200 text-[11.5px] transition-colors";
const BTN_ACTIVE = "bg-blue-700 text-white font-medium border-blue-700";
const BTN_DISABLED = "text-gray-400 cursor-not-allowed";
const BTN_NORMAL = "text-gray-700 hover:bg-gray-50";

export function CatalogoPagination({
    page,
    pageSize,
    total,
    onPageChange,
}: CatalogoPaginationProps) {
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    const pages = useMemo(() => buildPageList(page, lastPage), [lastPage, page]);

    return (
        <div className="bg-white px-4 py-2.5 border-t border-gray-200 flex items-center gap-3 text-[11.5px] text-gray-600">
            <span className="tabular-nums">
                {total === 0
                    ? "0 ítems"
                    : `${from.toLocaleString("es-CL")}–${to.toLocaleString("es-CL")} de ${total.toLocaleString("es-CL")}`}
            </span>
            <div className="ml-auto flex items-center gap-1">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    className={[
                        BTN_BASE,
                        page <= 1 ? BTN_DISABLED : BTN_NORMAL,
                    ].join(" ")}
                    aria-label="Página anterior"
                >
                    ‹
                </button>
                {pages.map((p, i) =>
                    p === "..." ? (
                        <span
                            key={`gap-${i}`}
                            className="px-1 text-gray-400"
                            aria-hidden
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={[
                                BTN_BASE,
                                p === page ? BTN_ACTIVE : BTN_NORMAL,
                            ].join(" ")}
                            aria-current={p === page ? "page" : undefined}
                        >
                            {p}
                        </button>
                    ),
                )}
                <button
                    type="button"
                    disabled={page >= lastPage}
                    onClick={() => onPageChange(Math.min(lastPage, page + 1))}
                    className={[
                        BTN_BASE,
                        page >= lastPage ? BTN_DISABLED : BTN_NORMAL,
                    ].join(" ")}
                    aria-label="Página siguiente"
                >
                    ›
                </button>
            </div>
        </div>
    );
}

/**
 * Devuelve la lista de páginas a mostrar.
 * Estrategia: 1 · 2 · 3 (current ± 1) · … · last
 */
function buildPageList(page: number, last: number): Array<number | "..."> {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }
    const set = new Set<number>([1, 2, last - 1, last, page - 1, page, page + 1]);
    const sorted = Array.from(set)
        .filter((n) => n >= 1 && n <= last)
        .sort((a, b) => a - b);
    const out: Array<number | "..."> = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("...");
        out.push(sorted[i]);
    }
    return out;
}
