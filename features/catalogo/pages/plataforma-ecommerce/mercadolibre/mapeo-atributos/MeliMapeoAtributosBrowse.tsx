// features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-atributos/MeliMapeoAtributosBrowse.tsx
//
// Vista de mapeo de atributos por categoría (rediseño Mayo 2026).
//
// Antes era un árbol N1 → N2 → N3 con expand/collapse. Reemplazado por:
//   1) Selector de categoría (dropdown con búsqueda, path completo)
//   2) Tabla de atributos de la categoría activa: Mimbral → ML
//   3) Drawer lateral para elegir atributo ML (search + grupos Required/Opcional)
//
// Estados de fila: solo "Mapeado" / "Sin mapear" (sin Sugerido/Conflicto/Auto-mapear —
// decisión del 2026-05-18: no hay backend para sugerencias por IA).
//
// El backend NO cambió: reuse total de
//   - catalog/getcategorytree (árbol categorías Mimbral)
//   - /api/pim/mapeos-atributos/:marketplace  (read + write)
//   - POST /api/pim/atributos                  (crear atributo de tienda)
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    RefreshCw,
    ChevronDown,
    ChevronsUpDown,
    Search,
    SquarePen,
    PlusCircle,
    X,
    CheckCircle2 as CheckCircleSolid,
} from "lucide-react";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import {
    buildCategoryTreeWithAttrsFromAPI,
    type StoreCategory,
    type StoreAttribute,
    type MeliAttributeOption,
    type MeliAttributeMapping,
    type APICategoryResponse,
} from "./types";
import {
    createMarketplaceAttributeMapping,
    createStoreAttribute,
    deleteMarketplaceAttributeMapping,
    fetchAllMarketplaceAttributeMappings,
    resolveAttributeMarketplace,
    updateMarketplaceAttributeMapping,
    type AttributeMappingNormalizedRow,
} from "../../../../services/marketplaceAttributeMappings";

// ── helpers ────────────────────────────────────────────────────────────────────

/**
 * Aplana el árbol de categorías a un listado plano con path completo
 * ("Herramientas › Taladros › Taladros percutores"). Solo incluye categorías
 * que tienen atributos directos O son hojas — son las únicas seleccionables.
 */
interface CategoryFlat {
    id: string;
    name: string;
    path: string;
    level: number;
    attributeCount: number;
    isLeaf: boolean;
}

function flattenCategories(tree: StoreCategory[]): CategoryFlat[] {
    const out: CategoryFlat[] = [];
    // Dedup por `id` — el árbol del backend a veces trae la misma categoría
    // en múltiples ramas (taxonomías ML con categorías compartidas como
    // "Otros", "Accesorios", etc.). Sin esto, React tira:
    //   "Encountered two children with the same key, `2000064`"
    // en el `.map()` del CategoryDropdown. Tomamos la primera ocurrencia
    // (path más corto / rama principal) y descartamos las repetidas.
    // Si en el futuro queremos resolver por path canónico, refactorizar acá.
    const seen = new Set<string>();

    function walk(nodes: StoreCategory[], parentPath: string[]) {
        for (const node of nodes) {
            const path = [...parentPath, node.name];
            const isLeaf = !node.children?.length;
            // Solo incluyo si es hoja o tiene atributos directos (las intermedias
            // sin atributos no se pueden mapear, no las muestro)
            if ((isLeaf || node.attributes.length > 0) && !seen.has(node.id)) {
                seen.add(node.id);
                out.push({
                    id: node.id,
                    name: node.name,
                    path: path.join(" › "),
                    level: node.level,
                    attributeCount: node.attributes.length,
                    isLeaf,
                });
            }
            if (node.children?.length) walk(node.children, path);
        }
    }
    walk(tree, []);
    return out;
}

function findCategoryById(tree: StoreCategory[], id: string): StoreCategory | null {
    for (const node of tree) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findCategoryById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

function mergeMappingRows(
    mappedRows: AttributeMappingNormalizedRow[],
    unmappedRows: AttributeMappingNormalizedRow[]
): AttributeMappingNormalizedRow[] {
    const merged = new Map<string, AttributeMappingNormalizedRow>();
    for (const row of [...unmappedRows, ...mappedRows]) {
        const key = `${row.storeCategoryId || "none"}::${row.storeAttributeId}`;
        const prev = merged.get(key);
        if (!prev) {
            merged.set(key, row);
            continue;
        }
        const prevHasMapping = Boolean(prev.marketplaceAttributeId);
        const currentHasMapping = Boolean(row.marketplaceAttributeId);
        if (!prevHasMapping && currentHasMapping) {
            merged.set(key, row);
        }
    }
    return Array.from(merged.values());
}

function mergeAttributesIntoTree(
    tree: StoreCategory[],
    rows: AttributeMappingNormalizedRow[]
): StoreCategory[] {
    const attributesByCategory = new Map<string, StoreAttribute[]>();
    const seen = new Set<string>();

    for (const row of rows) {
        if (!row.storeAttributeId) continue;
        const categoryId = String(row.storeCategoryId || row.n3Id || "");
        if (!categoryId) continue;

        const dedupeKey = `${categoryId}::${row.storeAttributeId}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const attr: StoreAttribute = {
            id: row.storeAttributeId,
            name: row.storeAttributeName || row.storeAttributeId,
            type: row.storeAttributeType,
            categoryId,
            categoryName: row.storeCategoryName || categoryId,
            apiId: row.apiId,
        };

        if (!attributesByCategory.has(categoryId)) {
            attributesByCategory.set(categoryId, []);
        }
        attributesByCategory.get(categoryId)!.push(attr);
    }

    function walk(nodes: StoreCategory[]): StoreCategory[] {
        return nodes.map((node) => {
            const attrs = attributesByCategory.get(String(node.id)) || [];
            return {
                ...node,
                attributes: attrs,
                children: node.children ? walk(node.children) : [],
            };
        });
    }

    return walk(tree);
}

function buildFallbackTreeFromMappings(rows: AttributeMappingNormalizedRow[]): StoreCategory[] {
    const nodeByCategory = new Map<string, StoreCategory>();
    const seenAttr = new Set<string>();

    for (const row of rows) {
        if (!row.storeAttributeId) continue;
        const categoryId = String(row.storeCategoryId || row.n3Id || "sin-categoria");
        const categoryName = row.storeCategoryName || `Categoria ${categoryId}`;

        if (!nodeByCategory.has(categoryId)) {
            nodeByCategory.set(categoryId, {
                id: categoryId,
                name: categoryName,
                parentId: null,
                level: 0,
                children: [],
                attributes: [],
            });
        }

        const dedupeKey = `${categoryId}::${row.storeAttributeId}`;
        if (seenAttr.has(dedupeKey)) continue;
        seenAttr.add(dedupeKey);

        nodeByCategory.get(categoryId)!.attributes.push({
            id: row.storeAttributeId,
            name: row.storeAttributeName || row.storeAttributeId,
            type: row.storeAttributeType,
            categoryId,
            categoryName,
            apiId: row.apiId,
        });
    }

    return Array.from(nodeByCategory.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildMappingsByAttribute(rows: AttributeMappingNormalizedRow[]): Map<string, MeliAttributeMapping> {
    const map = new Map<string, MeliAttributeMapping>();
    for (const row of rows) {
        if (!row.storeAttributeId || !row.marketplaceAttributeId) continue;
        map.set(row.storeAttributeId, {
            storeAttributeId: row.storeAttributeId,
            meliAttributeId: row.marketplaceAttributeId,
            meliAttributeName: row.marketplaceAttributeName || row.marketplaceAttributeId,
            meliRequired: row.marketplaceRequired,
            apiId: row.apiId,
            n3Id: row.n3Id || row.storeCategoryId,
            validado: row.validado,
        });
    }
    return map;
}

function buildMeliOptions(rows: AttributeMappingNormalizedRow[]): MeliAttributeOption[] {
    const optionsMap = new Map<string, MeliAttributeOption>();
    for (const row of rows) {
        if (!row.marketplaceAttributeId) continue;
        if (optionsMap.has(row.marketplaceAttributeId)) continue;
        optionsMap.set(row.marketplaceAttributeId, {
            id: row.marketplaceAttributeId,
            name: row.marketplaceAttributeName || row.marketplaceAttributeId,
            required: row.marketplaceRequired,
            valueType: row.storeAttributeType,
            categoryId: row.storeCategoryId || String(row.n3Id || "*"),
        });
    }
    return Array.from(optionsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function mergeMeliOption(prev: MeliAttributeOption[], next: MeliAttributeOption): MeliAttributeOption[] {
    if (prev.some((opt) => opt.id === next.id)) return prev;
    return [next, ...prev].sort((a, b) => a.name.localeCompare(b.name));
}

// ── status badge (solo Mapeado / Sin mapear) ──────────────────────────────────

function StatusBadge({ mapped }: { mapped: boolean }) {
    if (mapped) {
        return (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Mapeado
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Sin mapear
        </span>
    );
}

// ── dropdown de categoría con búsqueda ────────────────────────────────────────

function CategoryDropdown({
    categories,
    selectedId,
    onSelect,
    disabled = false,
}: {
    categories: CategoryFlat[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const selected = useMemo(
        () => categories.find((c) => c.id === selectedId) || null,
        [categories, selectedId]
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories.filter(
            (c) =>
                c.path.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q) ||
                c.id.toLowerCase().includes(q)
        );
    }, [categories, search]);

    return (
        <div ref={ref} className="relative w-full">
            <div className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-gray-500 mb-1.5">
                Categoría
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                className={`w-full h-10 px-3 inline-flex items-center justify-between rounded-lg border bg-white text-[13px] text-left ${disabled
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : open
                        ? "border-indigo-500 ring-1 ring-indigo-500"
                        : "border-gray-300 text-gray-900 hover:border-gray-400"
                    }`}
            >
                <span className="truncate">
                    {selected ? selected.path : "Elige una categoría…"}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            </button>

            {open && !disabled && (
                <div className="absolute z-30 mt-1 w-full max-h-96 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden flex flex-col">
                    <div className="relative border-b border-gray-100 px-3 py-2">
                        <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar categoría por nombre o path…"
                            className="w-full h-8 pl-7 pr-3 rounded-md border border-gray-200 bg-white text-[12.5px] outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                        />
                    </div>
                    <div className="overflow-auto flex-1">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-center text-[12.5px] text-gray-400">
                                Sin resultados
                            </div>
                        ) : (
                            filtered.map((c) => {
                                const isCurrent = c.id === selectedId;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(c.id);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        className={`w-full text-left px-4 py-2 flex items-center justify-between gap-3 border-l-2 ${isCurrent
                                            ? "border-indigo-600 bg-indigo-50/40"
                                            : "border-transparent hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-medium text-gray-900 truncate">
                                                {c.name}
                                            </div>
                                            <div className="text-[10.5px] text-gray-500 truncate mt-0.5">
                                                {c.path}
                                            </div>
                                        </div>
                                        <span className="text-[10.5px] text-gray-400 tabular-nums shrink-0">
                                            {c.attributeCount} attr
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── drawer lateral para elegir atributo ML ────────────────────────────────────

function MlPickerDrawer({
    attribute,
    currentMapping,
    options,
    platformName,
    onClose,
    onPick,
    saving,
}: {
    attribute: StoreAttribute;
    currentMapping: MeliAttributeMapping | undefined;
    options: MeliAttributeOption[];
    platformName: string;
    onClose: () => void;
    onPick: (option: MeliAttributeOption | null) => void;
    saving: boolean;
}) {
    const [search, setSearch] = useState("");

    // Esc cierra el drawer (UX estándar)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, saving]);

    const filtered = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter(
            (o) =>
                o.name.toLowerCase().includes(q) ||
                o.id.toLowerCase().includes(q)
        );
    }, [options, search]);

    // Agrupamos por Required / Opcional. Cuando el endpoint /esquema-mapeo se
    // conecte directo, podríamos agrupar por el `group_name` que ML provee
    // (Identificación, Eléctrico, Performance…) pero por ahora es lo único
    // confiable que tenemos del shape MeliAttributeOption.
    const grouped = useMemo(() => {
        const required: MeliAttributeOption[] = [];
        const optional: MeliAttributeOption[] = [];
        for (const opt of filtered) {
            if (opt.required) required.push(opt);
            else optional.push(opt);
        }
        return { required, optional };
    }, [filtered]);

    return (
        <>
            <div className="fixed inset-0 bg-gray-900/20 z-40" onClick={() => !saving && onClose()} />
            <div className="fixed top-0 right-0 bottom-0 w-[440px] bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-indigo-600">
                                Mapear atributo
                            </div>
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span className="text-[18px] font-semibold text-gray-900">
                                    {attribute.name}
                                </span>
                                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 6l-3 4 3 4M13 6l3 4-3 4M4 10h12" /></svg>
                                <span className="text-[13px] text-gray-500">
                                    elige atributo de {platformName}
                                </span>
                            </div>
                            <div className="text-[11.5px] text-gray-500 mt-1">
                                Atributo Mimbral · {attribute.type}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="w-8 h-8 grid place-items-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0 disabled:opacity-40"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative mt-4">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Buscar atributo de ${platformName} por nombre o ID…`}
                            className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 bg-white text-[13px] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                        />
                    </div>
                </div>

                {/* Listado agrupado */}
                <div className="flex-1 overflow-auto py-2">
                    {filtered.length === 0 ? (
                        <div className="px-5 py-8 text-center text-[12.5px] text-gray-500">
                            Sin resultados
                        </div>
                    ) : (
                        <>
                            {grouped.required.length > 0 && (
                                <GroupSection
                                    title="Requeridos"
                                    items={grouped.required}
                                    currentId={currentMapping?.meliAttributeId}
                                    onPick={onPick}
                                />
                            )}
                            {grouped.optional.length > 0 && (
                                <GroupSection
                                    title="Opcionales"
                                    items={grouped.optional}
                                    currentId={currentMapping?.meliAttributeId}
                                    onPick={onPick}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onPick(null)}
                        disabled={saving || !currentMapping}
                        className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-[12.5px] font-medium text-rose-700 bg-white ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Desmapear
                    </button>
                    <div className="flex items-center gap-2">
                        {saving && (
                            <span className="text-[11px] text-gray-500">Guardando…</span>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="h-9 px-3 rounded-lg text-[12.5px] font-medium text-gray-600 bg-white ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function GroupSection({
    title,
    items,
    currentId,
    onPick,
}: {
    title: string;
    items: MeliAttributeOption[];
    currentId?: string;
    onPick: (option: MeliAttributeOption) => void;
}) {
    return (
        <div className="mb-2">
            <div className="px-5 py-1.5 text-[10.5px] font-semibold tracking-[0.12em] uppercase text-gray-500 bg-gray-50/60">
                {title}
            </div>
            {items.map((a) => {
                const isCurrent = currentId === a.id;
                return (
                    <button
                        key={a.id}
                        type="button"
                        onClick={() => onPick(a)}
                        className={`w-full text-left px-5 py-2.5 flex items-center justify-between gap-3 border-l-2 ${isCurrent
                            ? "border-indigo-600 bg-indigo-50/40"
                            : "border-transparent hover:bg-gray-50"
                            }`}
                    >
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[13.5px] font-medium text-gray-900 truncate">
                                    {a.name}
                                </span>
                                {a.required && (
                                    <span className="text-[10px] font-semibold text-rose-700">obligatorio</span>
                                )}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate mt-0.5">
                                <span className="tabular-nums">{a.id}</span>
                                <span className="mx-1.5">·</span>
                                <span>{a.valueType}</span>
                            </div>
                        </div>
                        {isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 shrink-0">
                                <CheckCircleSolid className="w-3.5 h-3.5" />
                                actual
                            </span>
                        ) : (
                            <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5l5 5-5 5" /></svg>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ── componente principal ──────────────────────────────────────────────────────

export function MeliMapeoAtributosBrowse() {
    const platform = useEcommercePlatform();
    const marketplace = useMemo(
        () => resolveAttributeMarketplace(platform.name),
        [platform.name]
    );

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "mapped" | "unmapped">("all");
    const [pickerRow, setPickerRow] = useState<StoreAttribute | null>(null);
    const [showAddAttribute, setShowAddAttribute] = useState(false);

    const [mappings, setMappings] = useState<Map<string, MeliAttributeMapping>>(new Map());
    const [categoryTree, setCategoryTree] = useState<StoreCategory[]>([]);
    const [meliOptions, setMeliOptions] = useState<MeliAttributeOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingAttributeIds, setSavingAttributeIds] = useState<Set<string>>(new Set());
    const [refreshTick, setRefreshTick] = useState(0);

    const { token, user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    // ── carga categorías + mapeos ─────────────────────────────────────────────

    useEffect(() => {
        if (!token) return;
        let cancelled = false;

        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                // Timeout defensivo de 30s (igual que la versión anterior — el OMS
                // catalog service a veces se cae)
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error(
                            "Timeout (30s) — el OMS catalog service (qaprodmimbral1.loclx.io) " +
                            "no respondió a /catalog/getcategorytree. Verifica que el túnel QA esté arriba."
                        )),
                        30_000,
                    ),
                );

                const first = await Promise.race([
                    fetchWithAuth<APICategoryResponse>(
                        "catalog/getcategorytree?page=1&pageSize=200"
                    ),
                    timeoutPromise,
                ]) as APICategoryResponse;

                const allItems = [...first.data];

                const mappedRowsPromise = fetchAllMarketplaceAttributeMappings({
                    marketplace,
                    token,
                    query: { compacto: true },
                    maxPages: 25,
                });

                const unmappedRowsPromise = fetchAllMarketplaceAttributeMappings({
                    marketplace,
                    token,
                    query: { soloSinMapeo: true, compacto: true },
                    maxPages: 5,
                }).catch(() => [] as AttributeMappingNormalizedRow[]);

                if (first.totalPages > 1) {
                    const maxCategoryPages = Math.min(Number(first.totalPages) || 1, 25);
                    const pagePromises: Promise<APICategoryResponse>[] = [];
                    for (let p = 2; p <= maxCategoryPages; p++) {
                        pagePromises.push(
                            fetchWithAuth<APICategoryResponse>(
                                `catalog/getcategorytree?page=${p}&pageSize=200`
                            )
                        );
                    }
                    const pageResults = await Promise.all(pagePromises);
                    for (const pageData of pageResults) {
                        allItems.push(...pageData.data);
                    }
                }

                const [mappedRows, unmappedRows] = await Promise.all([
                    mappedRowsPromise,
                    unmappedRowsPromise,
                ]);

                const rows = mergeMappingRows(mappedRows, unmappedRows);
                let nextTree = mergeAttributesIntoTree(
                    buildCategoryTreeWithAttrsFromAPI(allItems),
                    rows
                );

                // Fallback: si no salió ningún atributo del cruce, armamos el
                // árbol directo desde los mapeos (sin jerarquía)
                const totalAttrsCount = countAllAttributes(nextTree);
                if (totalAttrsCount === 0 && rows.length > 0) {
                    nextTree = buildFallbackTreeFromMappings(rows);
                }

                if (cancelled) return;

                setCategoryTree(nextTree);
                setMappings(buildMappingsByAttribute(rows));
                setMeliOptions(buildMeliOptions(rows));
            } catch (err: any) {
                 
                console.error("[mapeo-atributos] loadData failed:", err);
                if (!cancelled) {
                    setError(err?.message || "Error al cargar mapeo de atributos");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, [token, fetchWithAuth, marketplace, refreshTick]);

    // ── memos derivados ───────────────────────────────────────────────────────

    const flatCategories = useMemo(
        () => flattenCategories(categoryTree),
        [categoryTree]
    );

    const selectedCategory = useMemo(
        () => (selectedCategoryId ? findCategoryById(categoryTree, selectedCategoryId) : null),
        [categoryTree, selectedCategoryId]
    );

    // Auto-seleccionar la primera categoría con atributos cuando carga
    useEffect(() => {
        if (!selectedCategoryId && flatCategories.length > 0) {
            const firstWithAttrs = flatCategories.find((c) => c.attributeCount > 0);
            if (firstWithAttrs) {
                setSelectedCategoryId(firstWithAttrs.id);
            }
        }
    }, [flatCategories, selectedCategoryId]);

    const filteredAttributes = useMemo(() => {
        if (!selectedCategory) return [];
        const q = searchQuery.trim().toLowerCase();
        return selectedCategory.attributes.filter((attr) => {
            // filtro de búsqueda
            if (q) {
                const matchName = attr.name.toLowerCase().includes(q);
                const matchId = attr.id.toLowerCase().includes(q);
                const mapping = mappings.get(attr.id);
                const matchMl = mapping
                    ? mapping.meliAttributeName.toLowerCase().includes(q) ||
                    mapping.meliAttributeId.toLowerCase().includes(q)
                    : false;
                if (!matchName && !matchId && !matchMl) return false;
            }
            // filtro de estado
            const isMapped = mappings.has(attr.id);
            if (statusFilter === "mapped" && !isMapped) return false;
            if (statusFilter === "unmapped" && isMapped) return false;
            return true;
        });
    }, [selectedCategory, searchQuery, statusFilter, mappings]);

    const counts = useMemo(() => {
        if (!selectedCategory) return { total: 0, mapped: 0 };
        const total = selectedCategory.attributes.length;
        const mapped = selectedCategory.attributes.reduce(
            (acc, attr) => acc + (mappings.has(attr.id) ? 1 : 0),
            0
        );
        return { total, mapped };
    }, [selectedCategory, mappings]);

    // ── handlers ──────────────────────────────────────────────────────────────

    const handlePickAttribute = useCallback(
        async (option: MeliAttributeOption | null) => {
            if (!pickerRow || !token) return;

            const storeAttributeId = pickerRow.id;
            const currentMapping = mappings.get(storeAttributeId);

            setSavingAttributeIds((prev) => new Set(prev).add(storeAttributeId));
            setError(null);

            try {
                if (!option) {
                    // Desmapear
                    if (currentMapping?.apiId !== undefined && currentMapping.apiId !== null) {
                        await deleteMarketplaceAttributeMapping({
                            marketplace,
                            token,
                            userId: user?.id,
                            mappingId: currentMapping.apiId,
                        });
                    }
                    setMappings((prev) => {
                        const next = new Map(prev);
                        next.delete(storeAttributeId);
                        return next;
                    });
                    setPickerRow(null);
                    return;
                }

                if (currentMapping?.apiId !== undefined && currentMapping.apiId !== null) {
                    // Update mapping existente
                    await updateMarketplaceAttributeMapping({
                        marketplace,
                        token,
                        userId: user?.id,
                        mappingId: currentMapping.apiId,
                        marketplaceAttributeId: option.id,
                        marketplaceAttributeName: option.name,
                        validado: true,
                    });
                    setMappings((prev) => {
                        const next = new Map(prev);
                        next.set(storeAttributeId, {
                            storeAttributeId,
                            meliAttributeId: option.id,
                            meliAttributeName: option.name,
                            meliRequired: option.required,
                            apiId: currentMapping.apiId,
                            n3Id: currentMapping.n3Id || pickerRow.categoryId,
                            validado: true,
                        });
                        return next;
                    });
                } else {
                    // Crear mapping nuevo
                    const n3Id = pickerRow.categoryId || currentMapping?.n3Id;
                    if (!n3Id) {
                        throw new Error("No se pudo resolver n3_id para crear el mapeo.");
                    }
                    const createdId = await createMarketplaceAttributeMapping({
                        marketplace,
                        token,
                        userId: user?.id,
                        n3Id,
                        storeAttributeId,
                        marketplaceAttributeId: option.id,
                        marketplaceAttributeName: option.name,
                        validado: true,
                    });
                    setMappings((prev) => {
                        const next = new Map(prev);
                        next.set(storeAttributeId, {
                            storeAttributeId,
                            meliAttributeId: option.id,
                            meliAttributeName: option.name,
                            meliRequired: option.required,
                            apiId: createdId,
                            n3Id,
                            validado: true,
                        });
                        return next;
                    });
                }
                setMeliOptions((prev) => mergeMeliOption(prev, option));
                setPickerRow(null);
            } catch (err: any) {
                setError(err?.message || "No se pudo guardar el mapeo");
            } finally {
                setSavingAttributeIds((prev) => {
                    const next = new Set(prev);
                    next.delete(storeAttributeId);
                    return next;
                });
            }
        },
        [pickerRow, mappings, marketplace, token, user?.id]
    );

    // ── render ────────────────────────────────────────────────────────────────

    const currentPickerMapping = pickerRow ? mappings.get(pickerRow.id) : undefined;
    const isPickerSaving = pickerRow ? savingAttributeIds.has(pickerRow.id) : false;

    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            {/* TopBar */}
            <div className="bg-white px-8 pt-6 pb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                        <div className="text-[11px] font-semibold tracking-[0.14em] text-blue-700 uppercase">
                            {platform.name} · Marketplace
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <h1 className="text-[28px] leading-tight font-semibold text-gray-900 whitespace-nowrap">
                                Mapeo de atributos
                            </h1>
                            {selectedCategory && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200 tabular-nums">
                                    {counts.mapped} / {counts.total} mapeados
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            title="Refrescar"
                            onClick={() => setRefreshTick((t) => t + 1)}
                            disabled={loading}
                            className="w-10 h-10 grid place-items-center rounded-lg text-gray-600 bg-white ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddAttribute(true)}
                            disabled={!selectedCategory}
                            className="h-10 px-4 inline-flex items-center gap-2 rounded-lg text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            title={selectedCategory ? `Crear atributo en ${selectedCategory.name}` : "Elige una categoría primero"}
                        >
                            <PlusCircle className="w-4 h-4" />
                            Nuevo atributo
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white px-8 pb-5 border-b border-gray-200">
                <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                        <div className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-gray-500 mb-1.5">
                            Buscar
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Atributo, ID Mimbral, ID ML…"
                                className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 bg-white text-[13px] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="w-[320px]">
                        <CategoryDropdown
                            categories={flatCategories}
                            selectedId={selectedCategoryId}
                            onSelect={setSelectedCategoryId}
                            disabled={loading || flatCategories.length === 0}
                        />
                    </div>
                    <div className="w-[160px]">
                        <div className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-gray-500 mb-1.5">
                            Estado
                        </div>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value as typeof statusFilter)
                                }
                                className="w-full h-10 px-3 pr-9 rounded-lg border border-gray-300 bg-white text-[13px] text-gray-900 appearance-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                            >
                                <option value="all">Todos</option>
                                <option value="mapped">Mapeados</option>
                                <option value="unmapped">Sin mapear</option>
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-[12px] text-gray-500 tabular-nums">
                        {selectedCategory ? (
                            <>
                                {filteredAttributes.length} de {counts.total} atributos
                                {searchQuery || statusFilter !== "all" ? " (filtrado)" : ""}
                                {" · "}
                                <span className="text-gray-700">
                                    {flatCategories.find((c) => c.id === selectedCategoryId)?.path}
                                </span>
                            </>
                        ) : (
                            "Elige una categoría para ver sus atributos"
                        )}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
                        <svg className="animate-spin h-6 w-6 text-indigo-500 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm text-gray-500">Cargando categorías y mapeos…</span>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                        {error}
                    </div>
                ) : !selectedCategory ? (
                    <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
                        <div className="text-sm text-gray-500">
                            Elige una categoría del filtro superior para ver sus atributos.
                        </div>
                    </div>
                ) : filteredAttributes.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
                        <div className="text-sm text-gray-500">
                            {counts.total === 0
                                ? <>La categoría <strong>{selectedCategory.name}</strong> no tiene atributos asignados. Usa <strong>Nuevo atributo</strong> para crear uno.</>
                                : "No hay atributos que coincidan con el filtro actual."}
                        </div>
                    </div>
                ) : (
                    <AttributesTable
                        attributes={filteredAttributes}
                        mappings={mappings}
                        savingIds={savingAttributeIds}
                        onOpenPicker={setPickerRow}
                        platformName={platform.name}
                    />
                )}
            </div>

            {/* Drawer ML picker */}
            {pickerRow && (
                <MlPickerDrawer
                    attribute={pickerRow}
                    currentMapping={currentPickerMapping}
                    options={meliOptions}
                    platformName={platform.name}
                    onClose={() => setPickerRow(null)}
                    onPick={handlePickAttribute}
                    saving={isPickerSaving}
                />
            )}

            {/* Modal Nuevo atributo */}
            {showAddAttribute && selectedCategory && (
                <AddAttributeModal
                    category={selectedCategory}
                    token={token}
                    onClose={() => setShowAddAttribute(false)}
                    onCreated={() => {
                        setShowAddAttribute(false);
                        setRefreshTick((t) => t + 1);
                    }}
                />
            )}
        </div>
    );
}

// ── tabla de atributos ────────────────────────────────────────────────────────

function AttributesTable({
    attributes,
    mappings,
    savingIds,
    onOpenPicker,
    platformName,
}: {
    attributes: StoreAttribute[];
    mappings: Map<string, MeliAttributeMapping>;
    savingIds: Set<string>;
    onOpenPicker: (attr: StoreAttribute) => void;
    platformName: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header de tabla */}
            <div className="grid grid-cols-[1fr_72px_24px_1fr_72px_120px_140px_40px] gap-4 items-center px-5 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-gray-500">
                    Atributo Mimbral
                </span>
                <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-gray-500">
                    Tipo
                </span>
                <span />
                <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-gray-500">
                    Atributo {platformName}
                </span>
                <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-gray-500">
                    Tipo
                </span>
                <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-gray-500">
                    Requerido
                </span>
                <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-gray-500">
                    Estado
                </span>
                <span />
            </div>

            {/* Filas */}
            {attributes.map((attr, i) => {
                const mapping = mappings.get(attr.id);
                const isMapped = !!mapping;
                const isSaving = savingIds.has(attr.id);
                const isLast = i === attributes.length - 1;

                return (
                    <div
                        key={attr.id}
                        className={`grid grid-cols-[1fr_72px_24px_1fr_72px_120px_140px_40px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors ${!isLast ? "border-b border-gray-100" : ""
                            } ${isSaving ? "opacity-60" : ""}`}
                    >
                        {/* Atributo Mimbral */}
                        <button
                            type="button"
                            onClick={() => onOpenPicker(attr)}
                            className="min-w-0 text-left group"
                        >
                            <div className="text-[13.5px] font-medium text-gray-900 group-hover:text-indigo-700 truncate">
                                {attr.name}
                            </div>
                            <div className="text-[10.5px] text-gray-400 tabular-nums truncate">
                                {attr.id}
                            </div>
                        </button>

                        {/* Tipo Mimbral */}
                        <div>
                            <span className="text-[11.5px] text-gray-500">{attr.type}</span>
                        </div>

                        {/* Flecha */}
                        <div className="text-gray-300 grid place-items-center">
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M7 6l-3 4 3 4M13 6l3 4-3 4M4 10h12" />
                            </svg>
                        </div>

                        {/* Atributo ML */}
                        <button
                            type="button"
                            onClick={() => onOpenPicker(attr)}
                            className="min-w-0 text-left group"
                        >
                            {mapping ? (
                                <>
                                    <div className="text-[13.5px] font-medium text-gray-900 group-hover:text-indigo-700 truncate">
                                        {mapping.meliAttributeName}
                                    </div>
                                    <div className="text-[10.5px] text-gray-400 tabular-nums truncate">
                                        {mapping.meliAttributeId}
                                    </div>
                                </>
                            ) : (
                                <span className="text-[12.5px] text-indigo-700 font-medium group-hover:underline">
                                    Elegir atributo de {platformName}…
                                </span>
                            )}
                        </button>

                        {/* Tipo ML */}
                        <div>
                            {mapping && (
                                <span className="text-[11.5px] text-gray-500">{attr.type}</span>
                            )}
                        </div>

                        {/* Requerido */}
                        <div>
                            {mapping?.meliRequired ? (
                                <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-rose-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Obligatorio
                                </span>
                            ) : (
                                <span className="text-[11.5px] text-gray-400">Opcional</span>
                            )}
                        </div>

                        {/* Estado */}
                        <div>
                            <StatusBadge mapped={isMapped} />
                        </div>

                        {/* Editar */}
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => onOpenPicker(attr)}
                                className="w-7 h-7 grid place-items-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                                title="Editar mapeo"
                            >
                                <SquarePen className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── modal de creación de atributo de tienda (sin cambios desde la versión previa) ──

function AddAttributeModal({
    category,
    token,
    onClose,
    onCreated,
}: {
    category: StoreCategory;
    token: string | null;
    onClose: () => void;
    onCreated: (newId: number) => void;
}) {
    const [nombre, setNombre] = useState("");
    const [tipoDato, setTipoDato] = useState<"string" | "number" | "list" | "boolean">("string");
    const [esObligatorio, setEsObligatorio] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !submitting) onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, submitting]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!nombre.trim()) {
            setError("El nombre del atributo es obligatorio");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const newId = await createStoreAttribute({
                nombre: nombre.trim(),
                tipoDato,
                categoriaId: category.id,
                esObligatorio,
                token,
            });
            onCreated(newId);
        } catch (err: any) {
            setError(err?.message || "Error al crear el atributo");
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900/40 grid place-items-center z-50"
            onClick={() => !submitting && onClose()}
        >
            <div
                className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-4 border-b border-gray-200">
                        <div className="text-[11px] uppercase tracking-widest text-indigo-600 font-semibold">
                            Agregar atributo de tienda
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">
                            {category.name}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                            El atributo se va a crear en <code>maestro_atributos</code> y
                            se asocia a esta categoría. Después puedes mapearlo a un
                            atributo de MercadoLibre.
                        </p>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Nombre del atributo
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej. Tipo de alimento, Sabor, Peso neto…"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                autoFocus
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Tipo de dato
                            </label>
                            <select
                                value={tipoDato}
                                onChange={(e) =>
                                    setTipoDato(e.target.value as typeof tipoDato)
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                disabled={submitting}
                            >
                                <option value="string">Texto (string)</option>
                                <option value="number">Número (number)</option>
                                <option value="list">Lista (list)</option>
                                <option value="boolean">Sí/No (boolean)</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={esObligatorio}
                                onChange={(e) => setEsObligatorio(e.target.checked)}
                                className="rounded border-gray-300 accent-indigo-600"
                                disabled={submitting}
                            />
                            <span className="text-sm text-gray-700">
                                Es obligatorio en esta categoría
                            </span>
                        </label>

                        {error && (
                            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50/50">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !nombre.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? "Creando…" : "Crear atributo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── utility para contar atributos del árbol entero ────────────────────────────

function countAllAttributes(tree: StoreCategory[]): number {
    let count = 0;
    function walk(nodes: StoreCategory[]) {
        for (const node of nodes) {
            count += node.attributes.length;
            if (node.children) walk(node.children);
        }
    }
    walk(tree);
    return count;
}
