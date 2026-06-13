// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/components/AtributosListToolbar.tsx
//
// Toolbar de la lista: search input + selects de filtros + 2 toggles + selector
// de pageSize. Construido con átomos Janis cuando aplica, fallback a HTML
// nativo para selects/checkboxes (con clases tailwind acordes a la paleta).

"use client";

import type { AtributosListFilters } from "../types/atributo-types";
import { Search } from "lucide-react";

export interface AtributosListToolbarProps {
    filters: AtributosListFilters;
    pageSize: number;
    onChangeFilter: (next: Partial<AtributosListFilters>) => void;
    onChangePageSize: (size: number) => void;
    /** Texto a la derecha — usualmente el contador "X–Y de Z". */
    rightSummary?: React.ReactNode;
}

const SELECT_CLASSES = [
    "h-9 px-2.5 pr-7 bg-white border border-gray-200 rounded-md",
    "text-[12.5px] text-gray-900 outline-none",
    "hover:border-gray-300 focus:border-blue-700",
    "appearance-none cursor-pointer",
    "bg-[url('data:image/svg+xml;utf8,<svg fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%221.6%22 viewBox=%220 0 20 20%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M5 8l5 5 5-5%22/></svg>')] bg-no-repeat bg-[right_8px_center] bg-[length:14px]",
].join(" ");

const CHECKBOX_LABEL_CLASSES =
    "inline-flex items-center gap-1.5 text-[12.5px] text-gray-600 cursor-pointer select-none";

export function AtributosListToolbar({
    filters,
    pageSize,
    onChangeFilter,
    onChangePageSize,
    rightSummary,
}: AtributosListToolbarProps) {
    return (
        <div className="bg-white px-6 py-3 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="search"
                        value={filters.buscar ?? ""}
                        onChange={(e) => onChangeFilter({ buscar: e.target.value })}
                        placeholder="Buscar atributo…"
                        className="h-9 pl-8 pr-3 w-64 bg-white border border-gray-200 rounded-md text-[12.5px] outline-none hover:border-gray-300 focus:border-blue-700"
                    />
                </div>

                {/* Tipo de dato */}
                <select
                    value={filters.tipo_dato ?? ""}
                    onChange={(e) => onChangeFilter({ tipo_dato: e.target.value })}
                    className={SELECT_CLASSES}
                    aria-label="Tipo de dato"
                >
                    <option value="">Todos los tipos</option>
                    <option value="string">Texto</option>
                    <option value="number">Número</option>
                    <option value="boolean">Booleano</option>
                    <option value="date">Fecha</option>
                    <option value="list">Lista (1 valor)</option>
                    <option value="multi_list">Lista (múltiples)</option>
                    <option value="number_unit">Número con unidad</option>
                </select>

                {/* Obligatorio */}
                <select
                    value={filters.obligatorio ?? ""}
                    onChange={(e) =>
                        onChangeFilter({
                            obligatorio: e.target.value as "" | "true" | "false",
                        })
                    }
                    className={SELECT_CLASSES}
                    aria-label="Obligatorio"
                >
                    <option value="">Obligatorio (todos)</option>
                    <option value="true">Solo obligatorios</option>
                    <option value="false">Solo opcionales</option>
                </select>

                {/* Herencia */}
                <select
                    value={filters.herencia ?? ""}
                    onChange={(e) =>
                        onChangeFilter({
                            herencia: e.target.value as "" | "global" | "categoria" | "sku",
                        })
                    }
                    className={SELECT_CLASSES}
                    aria-label="Nivel de herencia"
                >
                    <option value="">Herencia (todos)</option>
                    <option value="global">Global</option>
                    <option value="categoria">Por categoría</option>
                    <option value="sku">Por SKU</option>
                </select>

                {/* Toggles */}
                <label className={CHECKBOX_LABEL_CLASSES}>
                    <input
                        type="checkbox"
                        checked={filters.solo_en_uso === "true"}
                        onChange={(e) =>
                            onChangeFilter({
                                solo_en_uso: e.target.checked ? "true" : "",
                                solo_sin_uso: "",
                            })
                        }
                        className="accent-blue-700"
                    />
                    Solo en uso
                </label>
                <label className={CHECKBOX_LABEL_CLASSES}>
                    <input
                        type="checkbox"
                        checked={filters.solo_sin_uso === "true"}
                        onChange={(e) =>
                            onChangeFilter({
                                solo_sin_uso: e.target.checked ? "true" : "",
                                solo_en_uso: "",
                            })
                        }
                        className="accent-blue-700"
                    />
                    Sin uso
                </label>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right summary */}
                {rightSummary && (
                    <span className="text-[11.5px] text-gray-500 tabular-nums">
                        {rightSummary}
                    </span>
                )}

                {/* Page size */}
                <select
                    value={pageSize}
                    onChange={(e) => onChangePageSize(Number(e.target.value))}
                    className={SELECT_CLASSES}
                    aria-label="Tamaño de página"
                >
                    <option value="20">20 / pag</option>
                    <option value="50">50 / pag</option>
                    <option value="100">100 / pag</option>
                </select>
            </div>
        </div>
    );
}
