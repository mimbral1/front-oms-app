// features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-categorias/MeliMapeoCategoriasBrowse.tsx
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Search,
    X,
    Eye,
    Tag,
    SquarePen,
    Clipboard,
    Filter,
    CheckCircle2 as CheckCircleSolid,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useAuth } from "@/app/context/auth/AuthContext";
import { URL_MIMBRAL_MAPEOS } from "@/lib/http/endpoints";
import type {
    CategoriaNode,
    CategoriasAPIResponse,
    MapeoVistaEntry,
    MapeoVistaAPIResponse,
    TipoMapping,
} from "./types";

const CATEGORIAS_API = `${URL_MIMBRAL_MAPEOS}/api/categorias`;
const MAPEOS_VISTA_API = `${URL_MIMBRAL_MAPEOS}/api/mapeos/vista`;

// ── helpers ────────────────────────────────────────────────────────────────────

function isLeaf(node: CategoriaNode): boolean {
    return !node.subcategorias || node.subcategorias.length === 0;
}

function collectAllIds(nodes: CategoriaNode[]): Set<string> {
    const ids = new Set<string>();
    function walk(list: CategoriaNode[]) {
        for (const n of list) {
            ids.add(String(n.id));
            if (n.subcategorias) walk(n.subcategorias);
        }
    }
    walk(nodes);
    return ids;
}

function filterTree(nodes: CategoriaNode[], query: string): CategoriaNode[] {
    const q = query.toLowerCase();
    function matches(node: CategoriaNode): CategoriaNode | null {
        const nameMatch = node.nombre.toLowerCase().includes(q);
        const tipoMatch = node.tipos?.some((t) =>
            t.nombre.toLowerCase().includes(q)
        );
        const childMatches = node.subcategorias
            ?.map(matches)
            .filter(Boolean) as CategoriaNode[] | undefined;
        if (nameMatch || tipoMatch || (childMatches && childMatches.length > 0)) {
            return {
                ...node,
                subcategorias: childMatches?.length ? childMatches : node.subcategorias,
            };
        }
        return null;
    }
    return nodes.map(matches).filter(Boolean) as CategoriaNode[];
}

function filterUnmapped(
    nodes: CategoriaNode[],
    mapeos: Record<string, MapeoVistaEntry>
): CategoriaNode[] {
    const result: CategoriaNode[] = [];
    for (const n of nodes) {
        if (isLeaf(n)) {
            if (!mapeos[String(n.id)]?.mercadolibre?.mapeado) result.push(n);
        } else {
            const children = filterUnmapped(n.subcategorias || [], mapeos);
            if (children.length > 0) {
                result.push({ ...n, subcategorias: children });
            }
        }
    }
    return result;
}

function countLeaves(nodes: CategoriaNode[]): number {
    let count = 0;
    function walk(list: CategoriaNode[]) {
        for (const n of list) {
            if (isLeaf(n)) count++;
            else if (n.subcategorias) walk(n.subcategorias);
        }
    }
    walk(nodes);
    return count;
}

/** Build all store tree paths: one line per tipo (path > tipo) */
function buildStorePaths(nodes: CategoriaNode[], ancestors: string[] = []): string[] {
    const lines: string[] = [];
    for (const n of nodes) {
        const path = [...ancestors, n.nombre];
        if (isLeaf(n)) {
            if (n.tipos && n.tipos.length > 0) {
                for (const t of n.tipos) {
                    lines.push([...path, t.nombre].join(" > "));
                }
            } else {
                lines.push(path.join(" > "));
            }
        } else if (n.subcategorias) {
            lines.push(...buildStorePaths(n.subcategorias, path));
        }
    }
    return lines;
}

/** Build all MeLi tree paths: meliCatPath > tipoMeliName per tipo */
function buildMeliPaths(
    nodes: CategoriaNode[],
    mapeos: Record<string, MapeoVistaEntry>
): string[] {
    const lines: string[] = [];
    function walk(list: CategoriaNode[]) {
        for (const n of list) {
            if (isLeaf(n)) {
                const mapeo = mapeos[String(n.id)]?.mercadolibre;
                if (!mapeo?.mapeado) continue;
                const basePath = mapeo.categoria.nombre;
                if (n.tipos && n.tipos.length > 0) {
                    for (const t of n.tipos) {
                        const tm = mapeo.tipos?.[t.nombre];
                        if (tm?.nombre) {
                            lines.push(`${basePath} > ${tm.nombre}`);
                        } else {
                            lines.push(`${basePath} > (sin mapear)`);
                        }
                    }
                } else {
                    lines.push(basePath);
                }
            } else if (n.subcategorias) {
                walk(n.subcategorias);
            }
        }
    }
    walk(nodes);
    return lines;
}

// ── tiny confidence dot ───────────────────────────────────────────────────────

function ConfidenceDot({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color =
        pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500";
    return (
        <span
            className={`inline-block h-2 w-2 rounded-full ${color}`}
            title={`${pct}% confianza`}
        />
    );
}

// ── inline input ──────────────────────────────────────────────────────────────

function InlineInput({
    value,
    onChange,
    placeholder,
    className = "",
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`rounded border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${className}`}
        />
    );
}

// ── edit form type ────────────────────────────────────────────────────────────

interface EditFormData {
    categoria: { id: string; nombre: string };
    tipos: Record<string, TipoMapping>;
}

// ── component ─────────────────────────────────────────────────────────────────

export function MeliMapeoCategoriasBrowse() {
    const platform = useEcommercePlatform();
    const router = useRouter();
    const { user } = useAuth();
    const BASE_ROUTE = `${platform.basePath}/mapeo-categorias`;

    const [searchQuery, setSearchQuery] = useState("");
    const [showUnmappedOnly, setShowUnmappedOnly] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [categorias, setCategorias] = useState<CategoriaNode[]>([]);
    const [mapeos, setMapeos] = useState<Record<string, MapeoVistaEntry>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── inline editing state ──────────────────────────────────────────────────
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditFormData | null>(null);
    const [saving, setSaving] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [expandedTipos, setExpandedTipos] = useState<Set<string>>(new Set());

    // ── fetch data ────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        async function loadData() {
            try {
                setLoading(true);
                setError(null);
                const [catRes, mapRes] = await Promise.all([
                    fetch(CATEGORIAS_API),
                    fetch(`${MAPEOS_VISTA_API}?marketplace=mercadolibre`),
                ]);
                if (!catRes.ok) throw new Error(`Error cargando categorías: HTTP ${catRes.status}`);
                if (!mapRes.ok) throw new Error(`Error cargando mapeos: HTTP ${mapRes.status}`);
                const catJson: CategoriasAPIResponse = await catRes.json();
                const mapJson: MapeoVistaAPIResponse = await mapRes.json();
                if (cancelled) return;
                const cats = catJson.categorias || [];
                setCategorias(cats);
                setMapeos(mapJson.data || {});
                setExpanded(new Set());
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Error al cargar datos");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadData();
        return () => { cancelled = true; };
    }, []);

    // ── tree expand/collapse ──────────────────────────────────────────────────

    const filteredTree = useMemo(() => {
        let tree = categorias;
        if (searchQuery.trim()) {
            tree = filterTree(tree, searchQuery);
        }
        if (showUnmappedOnly) {
            tree = filterUnmapped(tree, mapeos);
        }
        return tree;
    }, [categorias, searchQuery, showUnmappedOnly, mapeos]);

    const effectiveExpanded = useMemo(() => {
        if (searchQuery.trim() || showUnmappedOnly) return collectAllIds(filteredTree);
        return expanded;
    }, [searchQuery, showUnmappedOnly, filteredTree, expanded]);

    const toggleExpand = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => setExpanded(collectAllIds(categorias)), [categorias]);
    const collapseAll = useCallback(() => setExpanded(new Set()), []);

    const toggleTipos = useCallback((id: string) => {
        setExpandedTipos((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // ── copy helper ───────────────────────────────────────────────────────────
    const copyToClipboard = useCallback((text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    }, []);

    // ── stats ─────────────────────────────────────────────────────────────────
    const totalLeaves = useMemo(() => countLeaves(categorias), [categorias]);
    const mappedCount = useMemo(() => {
        let count = 0;
        function walk(nodes: CategoriaNode[]) {
            for (const n of nodes) {
                if (isLeaf(n) && mapeos[String(n.id)]?.mercadolibre?.mapeado) count++;
                if (n.subcategorias) walk(n.subcategorias);
            }
        }
        walk(categorias);
        return count;
    }, [categorias, mapeos]);

    // ── inline edit helpers ───────────────────────────────────────────────────

    const startEdit = useCallback(
        (catId: string, node: CategoriaNode) => {
            const mapeo = mapeos[catId]?.mercadolibre;
            const tipos: Record<string, TipoMapping> = {};
            if (node.tipos) {
                for (const t of node.tipos) {
                    const existing = mapeo?.tipos?.[t.nombre];
                    tipos[t.nombre] = existing
                        ? { ...existing }
                        : { id: "", nombre: "", confianza: 0, validado: false };
                }
            }
            setEditForm({
                categoria: mapeo?.categoria
                    ? { ...mapeo.categoria }
                    : { id: "", nombre: "" },
                tipos,
            });
            setEditingId(catId);
        },
        [mapeos]
    );

    const cancelEdit = useCallback(() => {
        setEditingId(null);
        setEditForm(null);
    }, []);

    const handleSave = useCallback(async () => {
        if (!editingId || !editForm) return;
        try {
            setSaving(true);
            const body = {
                marketplace: "mercadolibre",
                category_id: Number(editingId),
                mercadolibre: {
                    mapeado: true,
                    categoria: editForm.categoria,
                    tipos: editForm.tipos,
                },
                // Auditoría — patrón estándar del proyecto.
                userId: Number(user?.id) || null,
                userName: user?.nombre ?? null,
                userEmail: user?.email ?? null,
            };
            const res = await fetch(`${URL_MIMBRAL_MAPEOS}/api/mapeos`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // Update local state
            setMapeos((prev) => ({
                ...prev,
                [editingId]: {
                    mercadolibre: {
                        mapeado: true,
                        categoria: editForm.categoria,
                        tipos: editForm.tipos,
                    },
                },
            }));
            setEditingId(null);
            setEditForm(null);
        } catch (err: any) {
            setError(`Error al guardar: ${err?.message ?? String(err)}`);
        } finally {
            setSaving(false);
        }
    }, [editingId, editForm, user?.id, user?.nombre, user?.email]);

    const updateEditCat = useCallback(
        (field: "id" | "nombre", value: string) => {
            setEditForm((prev) =>
                prev ? { ...prev, categoria: { ...prev.categoria, [field]: value } } : prev
            );
        },
        []
    );

    const updateEditTipo = useCallback(
        (tipoName: string, field: keyof TipoMapping, value: string | number | boolean) => {
            setEditForm((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tipos: {
                        ...prev.tipos,
                        [tipoName]: { ...prev.tipos[tipoName], [field]: value },
                    },
                };
            });
        },
        []
    );

    // ── recursive row renderer ────────────────────────────────────────────────

    function renderNode(node: CategoriaNode, level: number, ancestors: string[] = []): React.ReactNode[] {
        const id = String(node.id);
        const nodePath = [...ancestors, node.nombre];
        const leaf = isLeaf(node);
        const isExp = effectiveExpanded.has(id);
        const mapeo = mapeos[id]?.mercadolibre;
        const isMapped = !!mapeo?.mapeado;
        const tiposCount = node.tipos?.length || 0;
        const isEditing = editingId === id;
        const rows: React.ReactNode[] = [];

        // ── branch row (non-leaf) ────────────────────────────────────────────
        if (!leaf) {
            rows.push(
                <div
                    key={`cat-${id}`}
                    className="grid grid-cols-[1fr_1.4fr_100px] gap-4 items-center px-5 py-2.5 transition-colors hover:bg-gray-50/60 cursor-pointer"
                    onClick={() => toggleExpand(id)}
                >
                    <div
                        className="flex items-center gap-2 min-w-0"
                        style={{ paddingLeft: `${level * 24}px` }}
                    >
                        <span className="flex-shrink-0 p-0.5">
                            {isExp ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                        </span>
                        <span className="truncate text-sm font-semibold text-gray-900">
                            {node.nombre}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs text-gray-400 italic">
                            {node.subcategorias?.length || 0} subcategorías
                        </span>
                    </div>
                    <div />
                </div>
            );
            if (isExp && node.subcategorias) {
                for (const child of node.subcategorias) {
                    rows.push(...renderNode(child, level + 1, nodePath));
                }
            }
            return rows;
        }

        // ── leaf row ─────────────────────────────────────────────────────────
        rows.push(
            <div
                key={`cat-${id}`}
                className={`grid grid-cols-[1fr_1.4fr_100px] gap-4 items-start px-5 py-3 transition-colors hover:bg-gray-50/60 ${isEditing ? "bg-indigo-50/40 ring-1 ring-indigo-200" : ""
                    }`}
            >
                {/* LEFT: store category + store tipos */}
                <div
                    className="min-w-0"
                    style={{ paddingLeft: `${level * 24}px` }}
                >
                    <div className="flex items-center gap-2">
                        <span className="w-5 flex-shrink-0" />
                        {isMapped ? (
                            <CheckCircleSolid className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                            <CheckCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className="truncate text-sm font-medium text-gray-700">
                            {node.nombre}
                        </span>
                        {tiposCount === 0 && (() => {
                            const storeCatPath = nodePath.join(" > ");
                            const copyKey = `store-${id}`;
                            return (
                                <button
                                    onClick={() => copyToClipboard(storeCatPath, copyKey)}
                                    className="flex-shrink-0"
                                    title={storeCatPath}
                                >
                                    {copiedKey === copyKey ? (
                                        <CheckCircleSolid className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <Clipboard className="h-3.5 w-3.5 text-gray-400 hover:text-indigo-500" />
                                    )}
                                </button>
                            );
                        })()}
                        {tiposCount > 0 && (
                            <button
                                onClick={() => toggleTipos(id)}
                                className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                                {expandedTipos.has(id) ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                                <Tag className="h-3 w-3" />
                                {tiposCount}
                            </button>
                        )}
                    </div>
                    {/* Store tipos list */}
                    {tiposCount > 0 && node.tipos && expandedTipos.has(id) && (
                        <div className="ml-11 mt-1.5 space-y-0.5">
                            {node.tipos.map((t, i) => {
                                const storeFullPath = [...nodePath, t.nombre].join(" > ");
                                const copyKey = `store-${id}-${t.nombre}`;
                                return (
                                    <div
                                        key={t.nombre}
                                        className="flex items-center gap-1.5 text-sm text-gray-500 group/store"
                                    >
                                        <span className="text-gray-300">
                                            {i === node.tipos!.length - 1 ? "└" : "├"}
                                        </span>
                                        <Tag className="h-3.5 w-3.5 text-indigo-300 flex-shrink-0" />
                                        <span className="truncate">{t.nombre}</span>
                                        <button
                                            onClick={() => copyToClipboard(storeFullPath, copyKey)}
                                            className="flex-shrink-0"
                                            title={storeFullPath}
                                        >
                                            {copiedKey === copyKey ? (
                                                <CheckCircleSolid className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <Clipboard className="h-3 w-3 text-gray-400 hover:text-indigo-500" />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* CENTER: MeLi tree — read or edit mode */}
                <div className="min-w-0">
                    {isEditing && editForm ? (
                        /* ── EDIT MODE ──────────────────────────────────── */
                        <div className="space-y-2">
                            {/* MeLi category */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold uppercase text-indigo-500 w-8">Cat</span>
                                <InlineInput
                                    value={editForm.categoria.id}
                                    onChange={(v) => updateEditCat("id", v)}
                                    placeholder="MLC1234"
                                    className="w-24"
                                />
                                <InlineInput
                                    value={editForm.categoria.nombre}
                                    onChange={(v) => updateEditCat("nombre", v)}
                                    placeholder="Nombre categoría MeLi"
                                    className="flex-1"
                                />
                            </div>
                            {/* MeLi tipos */}
                            {node.tipos && node.tipos.length > 0 && expandedTipos.has(id) && (
                                <div className="space-y-1.5 border-l-2 border-indigo-200 pl-3 ml-1">
                                    {node.tipos.map((t) => {
                                        const tm = editForm.tipos[t.nombre];
                                        if (!tm) return null;
                                        return (
                                            <div key={t.nombre} className="space-y-1">
                                                <span className="text-[10px] font-medium text-gray-500 truncate block">
                                                    {t.nombre}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <InlineInput
                                                        value={tm.id}
                                                        onChange={(v) => updateEditTipo(t.nombre, "id", v)}
                                                        placeholder="MLC…"
                                                        className="w-24"
                                                    />
                                                    <InlineInput
                                                        value={tm.nombre}
                                                        onChange={(v) => updateEditTipo(t.nombre, "nombre", v)}
                                                        placeholder="Nombre MeLi"
                                                        className="flex-1"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateEditTipo(t.nombre, "validado", !tm.validado)
                                                        }
                                                        className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${tm.validado
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-gray-100 text-gray-500"
                                                            }`}
                                                    >
                                                        {tm.validado ? "✓ Val" : "No val"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── READ MODE ──────────────────────────────────── */
                        <div>
                            {isMapped ? (
                                <div className="space-y-1">
                                    {/* MeLi category header */}
                                    <div className="flex items-start gap-1.5">
                                        <div className="min-w-0 flex-1">
                                            <span
                                                className="block text-sm font-medium text-gray-800 truncate"
                                                title={mapeo.categoria.nombre}
                                            >
                                                {mapeo.categoria.nombre}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {mapeo.categoria.id}
                                            </span>
                                        </div>
                                        {tiposCount === 0 && (() => {
                                            const meliCatPath = mapeo.categoria.nombre;
                                            const copyKey = `meli-${id}`;
                                            return (
                                                <button
                                                    onClick={() => copyToClipboard(meliCatPath, copyKey)}
                                                    className="flex-shrink-0 mt-0.5"
                                                    title={meliCatPath}
                                                >
                                                    {copiedKey === copyKey ? (
                                                        <CheckCircleSolid className="h-3.5 w-3.5 text-green-500" />
                                                    ) : (
                                                        <Clipboard className="h-3.5 w-3.5 text-gray-400 hover:text-indigo-500" />
                                                    )}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                    {/* MeLi tipos tree */}
                                    {node.tipos && node.tipos.length > 0 && expandedTipos.has(id) && (
                                        <div className="border-l-2 border-gray-200 pl-3 ml-1 space-y-1 mt-1">
                                            {node.tipos.map((t, i) => {
                                                const tm = mapeo.tipos?.[t.nombre];
                                                const meliFullPath = tm?.nombre
                                                    ? `${mapeo.categoria.nombre} > ${tm.nombre}`
                                                    : "";
                                                const copyKey = `meli-${id}-${t.nombre}`;
                                                return (
                                                    <div
                                                        key={t.nombre}
                                                        className="flex items-start gap-1.5 group/meli"
                                                    >
                                                        <span className="text-gray-300 text-sm leading-5 flex-shrink-0">
                                                            {i === node.tipos!.length - 1 ? "└" : "├"}
                                                        </span>
                                                        {tm ? (
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <ConfidenceDot value={tm.confianza} />
                                                                    <span
                                                                        className="text-sm text-gray-700 truncate"
                                                                        title={tm.nombre}
                                                                    >
                                                                        {tm.nombre}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                                        {tm.id}
                                                                    </span>
                                                                    {tm.validado && (
                                                                        <CheckCircleSolid className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                                    )}
                                                                    <button
                                                                        onClick={() => copyToClipboard(meliFullPath, copyKey)}
                                                                        className="flex-shrink-0"
                                                                        title={meliFullPath}
                                                                    >
                                                                        {copiedKey === copyKey ? (
                                                                            <CheckCircleSolid className="h-3 w-3 text-green-500" />
                                                                        ) : (
                                                                            <Clipboard className="h-3 w-3 text-gray-400 hover:text-indigo-500" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">
                                                                sin mapear
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400 italic">
                                    Sin mapear
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: actions */}
                <div className="flex flex-col items-center gap-1.5 pt-0.5">
                    {isEditing ? (
                        <>
                            <button
                                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "…" : "Guardar"}
                            </button>
                            <button
                                className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                                onClick={cancelEdit}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                onClick={() => startEdit(id, node)}
                            >
                                <SquarePen className="h-3.5 w-3.5" />
                                Editar
                            </button>
                            <button
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                                onClick={() => router.push(`${BASE_ROUTE}/${id}`)}
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Detalle
                            </button>
                        </>
                    )}
                </div>
            </div>
        );

        return rows;
    }

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            {/* header */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-5 shadow-sm">
                <h1 className="text-lg font-semibold text-gray-900">
                    Mapeo de Categorías — {platform.name}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Árbol de categorías con su mapeo a {platform.name}.
                    Edite directamente o vea el detalle de cada categoría.
                </p>

                {/* toolbar */}
                <div className="mt-4 space-y-3">
                    {/* Row 1: progress bar + stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">
                                    Progreso de mapeo
                                </span>
                                <span className="text-xs font-semibold tabular-nums text-gray-700">
                                    {mappedCount}
                                    <span className="text-gray-400 font-normal"> / {totalLeaves}</span>
                                    {totalLeaves > 0 && (
                                        <span className="ml-1.5 text-gray-400 font-normal">
                                            ({Math.round((mappedCount / totalLeaves) * 100)}%)
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${mappedCount === totalLeaves && totalLeaves > 0
                                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                            : "bg-gradient-to-r from-indigo-400 to-indigo-600"
                                        }`}
                                    style={{
                                        width: totalLeaves > 0 ? `${(mappedCount / totalLeaves) * 100}%` : "0%",
                                    }}
                                />
                            </div>
                        </div>
                        {mappedCount === totalLeaves && totalLeaves > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 whitespace-nowrap">
                                <CheckCircleSolid className="h-3.5 w-3.5" />
                                Completo
                            </span>
                        )}
                    </div>

                    {/* Row 2: search + filters + expand/collapse */}
                    <div className="flex items-center gap-2.5">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-9 h-[36px] text-sm placeholder-gray-400 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-colors"
                                placeholder="Buscar categorías o tipos…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-gray-200 transition-colors"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X className="h-3.5 w-3.5 text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Separator */}
                        <span className="w-px h-6 bg-gray-200" />

                        {/* Unmapped filter */}
                        <button
                            onClick={() => setShowUnmappedOnly((v) => !v)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 h-[36px] text-xs font-medium transition-all ${showUnmappedOnly
                                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-300 shadow-sm"
                                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
                                }`}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            No mapeadas
                            {!showUnmappedOnly && totalLeaves > 0 && (
                                <span className="ml-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-gray-500">
                                    {totalLeaves - mappedCount}
                                </span>
                            )}
                        </button>

                        {/* Separator */}
                        <span className="w-px h-6 bg-gray-200" />

                        {/* Expand / Collapse group */}
                        <div className="inline-flex items-center rounded-lg ring-1 ring-gray-200 bg-white overflow-hidden shadow-sm">
                            <button
                                className="flex items-center gap-1.5 px-3 h-[36px] text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                onClick={expandAll}
                                title="Expandir todas las categorías"
                            >
                                <ChevronDown className="h-3.5 w-3.5" />
                                Expandir
                            </button>
                            <span className="w-px h-5 bg-gray-200" />
                            <button
                                className="flex items-center gap-1.5 px-3 h-[36px] text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                                onClick={collapseAll}
                                title="Colapsar todas las categorías"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                                Colapsar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* tree body */}
            <div className="flex-1 p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                            <span className="text-sm text-gray-500">Cargando categorías…</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
                            {error}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        {/* table header */}
                        <div className="grid grid-cols-[1fr_1.4fr_100px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Categoría Tienda
                            </span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Categoría {platform.name}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                                Acción
                            </span>
                        </div>

                        {filteredTree.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-gray-400">
                                No se encontraron categorías
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredTree.flatMap((node) => renderNode(node, 0))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
