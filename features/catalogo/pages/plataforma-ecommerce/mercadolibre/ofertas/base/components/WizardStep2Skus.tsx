// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/WizardStep2Skus.tsx
//
// Wizard Step 2 (Ola 3·3c-bis): picker por PUBLICACIÓN.
// La lista sigue por SKU (useCatalogoList); cada SKU se expande a sus
// publicaciones ML (lazy) y se elige CUÁLES inscribir, con % off + rango
// creíble por publicación. El modelo `selected` lleva UNA entrada por
// publicación (keyada por item_id). Un SKU con 1 publicación se comporta
// como antes (marcar el SKU = inscribir esa publicación).
//
// Look OMS: container white rounded-xl + DataTableExpandable + ActionButton.

"use client";

import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { DataTableExpandable } from "@/components/ui/table/DataTableExpandable";
import type { Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text/CopyableText";
import { useCatalogoList } from "../../../../shared/catalogo/base";
import type { MarketplaceProduct } from "../../../../shared/catalogo/base";
import { priceFromDiscount } from "../helpers/pricing";
import { isPriceInRange, priceForPublication } from "../helpers/wizard-publicaciones";
import { useSkuPublicaciones } from "../hooks/useSkuPublicaciones";
import {
    PublicationTypeChip,
    tipoKindOf,
    type PublicationKind,
} from "./PublicationTypeChip";
import type { MlItemRange } from "../types/oferta-types";
import type { OfferPublication } from "../types/elegibilidad-types";

export interface SelectedSku {
    sku: string;
    item_id?: string;
    name: string;
    price: number;
    stock: number;
    /** % off por publicación. Si null/undefined, usa el `globalDiscount` del Step1. */
    discount?: number;
    stock_committed?: number | null;
    /** Tipo de publicación (para el chip del Step3). */
    pubKind?: PublicationKind;
}

export interface WizardStep2SkusProps {
    /** Publicaciones seleccionadas (controlado por la view). */
    selected: ReadonlyArray<SelectedSku>;
    /**
     * Acepta valor o updater funcional (igual que un setState). Los toggles
     * usan el updater para componer sobre el estado más reciente y no perder
     * selecciones cuando hay cargas lazy concurrentes de distintos SKUs.
     */
    onChange: (
        next:
            | ReadonlyArray<SelectedSku>
            | ((prev: ReadonlyArray<SelectedSku>) => ReadonlyArray<SelectedSku>),
    ) => void;
    /** Default discount del Step1. Se aplica al agregar nuevas publicaciones. */
    globalDiscount: number;
}

const clp = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

/** Checkbox con estado indeterminate (no existe nativo en React → ref). */
function TristateCheckbox({
    checked,
    indeterminate,
    disabled,
    onChange,
}: {
    checked: boolean;
    indeterminate: boolean;
    disabled?: boolean;
    onChange: () => void;
}) {
    return (
        <input
            type="checkbox"
            ref={(el) => {
                if (el) el.indeterminate = indeterminate;
            }}
            checked={checked}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
            onChange={onChange}
            className="accent-blue-700"
        />
    );
}

export function WizardStep2Skus({
    selected,
    onChange,
    globalDiscount,
}: WizardStep2SkusProps) {
    const { filteredRows, loading, error, filters, setFilters } = useCatalogoList({
        pageSize: 50,
        status: "activos",
    });
    const { bySku, ensureLoaded } = useSkuPublicaciones();
    const [showOnlySelected, setShowOnlySelected] = useState(false);
    const [expandedSku, setExpandedSku] = useState<string | null>(null);

    // Selección keyada por item_id (una entrada por publicación).
    const selectedByItem = useMemo(() => {
        const m = new Map<string, SelectedSku>();
        for (const s of selected) if (s.item_id) m.set(s.item_id, s);
        return m;
    }, [selected]);

    // Set de SKUs con ≥1 publicación seleccionada (para "Solo seleccionados").
    const selectedSkuSet = useMemo(() => {
        const set = new Set<string>();
        for (const s of selected) set.add(s.sku);
        return set;
    }, [selected]);

    const visible = useMemo(() => {
        if (!showOnlySelected) return filteredRows;
        return filteredRows.filter((r) => selectedSkuSet.has(r.sku));
    }, [filteredRows, selectedSkuSet, showOnlySelected]);

    // Construye la entrada SelectedSku de una publicación con su rango ya resuelto.
    const makeEntry = useCallback(
        (
            row: MarketplaceProduct,
            pub: OfferPublication,
            ranges: Record<string, MlItemRange | null>,
        ): SelectedSku => {
            const range = ranges[pub.itemId] ?? null;
            return {
                sku: row.sku,
                item_id: pub.itemId,
                name: row.titulo,
                price: priceForPublication(range, row.precio),
                stock: row.stock,
                discount: globalDiscount,
                pubKind: tipoKindOf(pub),
            };
        },
        [globalDiscount],
    );

    // Toggle de UNA publicación (desde la sub-tabla expandida). Updater
    // funcional para componer sobre el estado más reciente.
    const togglePublication = useCallback(
        (row: MarketplaceProduct, pub: OfferPublication) => {
            const ranges = bySku[row.sku]?.ranges ?? {};
            onChange((prev) =>
                prev.some((s) => s.item_id === pub.itemId)
                    ? prev.filter((s) => s.item_id !== pub.itemId)
                    : [...prev, makeEntry(row, pub, ranges)],
            );
        },
        [bySku, makeEntry, onChange],
    );

    // Toggle del SKU (tristate): si hay alguna seleccionada → quitar todas;
    // si no hay ninguna → cargar (lazy) y agregar todas. SKU de 1 publicación
    // = se comporta como antes. La decisión se computa dentro del updater
    // (sobre `prev`) para no perder selecciones con cargas lazy concurrentes.
    const toggleSku = useCallback(
        async (row: MarketplaceProduct) => {
            const { publications, ranges } = await ensureLoaded(row.sku);
            if (publications.length === 0) return;
            const itemIds = new Set(publications.map((p) => p.itemId));
            onChange((prev) => {
                const someSelected = publications.some((p) =>
                    prev.some((s) => s.item_id === p.itemId),
                );
                if (someSelected) {
                    return prev.filter((s) => !s.item_id || !itemIds.has(s.item_id));
                }
                const have = new Set(
                    prev.flatMap((s) => (s.item_id ? [s.item_id] : [])),
                );
                const toAdd = publications
                    .filter((p) => !have.has(p.itemId))
                    .map((p) => makeEntry(row, p, ranges));
                return [...prev, ...toAdd];
            });
        },
        [ensureLoaded, makeEntry, onChange],
    );

    const setPublicationDiscount = useCallback(
        (itemId: string, discount: number) => {
            onChange((prev) =>
                prev.map((s) => (s.item_id === itemId ? { ...s, discount } : s)),
            );
        },
        [onChange, selected],
    );

    const clearAll = useCallback(() => onChange([]), [onChange]);

    const onToggleRow = useCallback(
        (row: MarketplaceProduct) => {
            setExpandedSku((cur) => (cur === row.sku ? null : row.sku));
            void ensureLoaded(row.sku); // idempotente/deduplicado
        },
        [ensureLoaded],
    );

    // ── Columnas (SKU) ───────────────────────────────────────────────
    const columns: Column<MarketplaceProduct>[] = [
        {
            header: "",
            accessorKey: "sku",
            cell: (row) => {
                const st = bySku[row.sku];
                const pubs = st?.publications ?? [];
                const total = pubs.length;
                const selCount = pubs.filter((p) => selectedByItem.has(p.itemId)).length;
                return (
                    <TristateCheckbox
                        checked={total > 0 && selCount === total}
                        indeterminate={selCount > 0 && selCount < total}
                        disabled={st?.loading}
                        onChange={() => void toggleSku(row)}
                    />
                );
            },
        },
        {
            header: "SKU / Producto",
            accessorKey: "sku",
            cell: (row) => (
                <div>
                    <div className="font-medium text-gray-900 tabular-nums">
                        {row.sku}
                    </div>
                    <div
                        className="text-xs text-gray-500 truncate max-w-[280px]"
                        title={row.titulo}
                    >
                        {row.titulo}
                    </div>
                </div>
            ),
        },
        {
            header: "Precio",
            accessorKey: "precio",
            cell: (row) => (
                <span className="tabular-nums">{clp(row.precio)}</span>
            ),
        },
        {
            header: "Pubs",
            accessorKey: "sku",
            cell: (row) => {
                const st = bySku[row.sku];
                if (st?.loading) return <span className="text-gray-400 text-xs">…</span>;
                if (!st) return <span className="text-gray-300 text-xs">—</span>;
                const sel = st.publications.filter((p) =>
                    selectedByItem.has(p.itemId),
                ).length;
                return (
                    <span className="tabular-nums text-xs text-gray-600">
                        {sel}/{st.publications.length}
                    </span>
                );
            },
        },
        {
            header: "",
            accessorKey: "sku",
            cell: (row) => (
                <span className="text-gray-400">
                    {expandedSku === row.sku ? "▼" : "▶"}
                </span>
            ),
        },
    ];

    // ── Detalle (publicaciones del SKU) ──────────────────────────────
    const renderDetail = useCallback(
        (row: MarketplaceProduct) => {
            const st = bySku[row.sku];
            if (!st || st.loading) {
                return (
                    <div className="px-4 py-3 text-sm text-gray-500">
                        Cargando publicaciones…
                    </div>
                );
            }
            if (st.error) {
                return (
                    <div className="px-4 py-3 text-sm text-rose-600">
                        {st.error}{" "}
                        <button
                            className="underline"
                            onClick={() => void ensureLoaded(row.sku)}
                        >
                            Reintentar
                        </button>
                    </div>
                );
            }
            if (st.publications.length === 0) {
                return (
                    <div className="px-4 py-3 text-sm text-gray-500">
                        Este SKU no tiene publicaciones en MercadoLibre.
                    </div>
                );
            }
            return (
                <div className="px-4 py-3 space-y-1.5">
                    {st.publications.map((pub) => {
                        const sel = selectedByItem.get(pub.itemId);
                        const isSel = !!sel;
                        const range = st.ranges[pub.itemId] ?? null;
                        const basePrice = priceForPublication(range, row.precio);
                        const discount = sel?.discount ?? globalDiscount;
                        const newPrice = priceFromDiscount(basePrice, discount);
                        const inRange = isPriceInRange(newPrice, range);
                        return (
                            <div
                                key={pub.itemId}
                                className="flex items-center gap-3 py-1.5 text-[13px]"
                            >
                                <input
                                    type="checkbox"
                                    checked={isSel}
                                    onChange={() => togglePublication(row, pub)}
                                    className="accent-blue-700"
                                />
                                <PublicationTypeChip
                                    kind={tipoKindOf(pub)}
                                    isPrimary={pub.isPrimary}
                                />
                                <CopyableText
                                    text={pub.itemId}
                                    className="text-sm text-gray-700"
                                >
                                    <code className="tabular-nums">{pub.itemId}</code>
                                </CopyableText>
                                <div className="ml-auto flex items-center gap-2">
                                    {isSel ? (
                                        <>
                                            <span className="text-xs text-gray-500">% off</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={80}
                                                value={discount}
                                                onChange={(e) =>
                                                    setPublicationDiscount(
                                                        pub.itemId,
                                                        Number(e.target.value) || 0,
                                                    )
                                                }
                                                className="w-16 px-2 h-8 text-sm tabular-nums bg-white border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <span className="font-semibold text-blue-700 tabular-nums">
                                                → {clp(newPrice)}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-gray-400 text-xs">
                                            sin inscribir
                                        </span>
                                    )}
                                    <span
                                        className={`text-xs tabular-nums ${
                                            inRange
                                                ? "text-gray-500"
                                                : "text-rose-600 font-semibold"
                                        }`}
                                        title="Rango creíble de precio con descuento (ML)"
                                    >
                                        {range
                                            ? inRange
                                                ? `rango ${clp(range.min_discounted_price)}–${clp(range.max_discounted_price)}`
                                                : `⚠ fuera de rango ${clp(range.min_discounted_price)}–${clp(range.max_discounted_price)}`
                                            : "sin rango"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        },
        [
            bySku,
            ensureLoaded,
            globalDiscount,
            selectedByItem,
            setPublicationDiscount,
            togglePublication,
        ],
    );

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-800">
                        SKUs del catálogo
                    </h3>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-gray-500 tabular-nums">
                            {selected.length.toLocaleString("es-CL")} publicaciones
                            seleccionadas
                        </span>
                        <ActionButton
                            variant="text"
                            size="sm"
                            onClick={clearAll}
                            disabled={selected.length === 0}
                        >
                            Limpiar
                        </ActionButton>
                    </div>
                </div>

                {/* Filters bar */}
                <div className="px-5 py-2.5 border-b border-gray-200 flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <input
                            type="search"
                            value={filters.search ?? ""}
                            onChange={(e) => setFilters({ search: e.target.value })}
                            placeholder="Buscar SKU, nombre o item id…"
                            className="w-72 pl-9 pr-3 h-9 text-sm bg-white border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnlySelected}
                            onChange={(e) => setShowOnlySelected(e.target.checked)}
                            className="accent-blue-700"
                        />
                        Solo seleccionados
                    </label>

                    {error && (
                        <span className="ml-auto text-xs text-rose-600">
                            Error: {error}
                        </span>
                    )}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                        Cargando catálogo…
                    </div>
                ) : visible.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                        {showOnlySelected
                            ? "Aún no has seleccionado ninguna publicación"
                            : "Sin productos visibles con este filtro"}
                    </div>
                ) : (
                    <DataTableExpandable
                        data={visible}
                        columns={columns}
                        expandedId={expandedSku}
                        onToggle={onToggleRow}
                        renderDetail={renderDetail}
                        getRowId={(row) => row.sku}
                        showStatusBorder={false}
                        rowPaddingY={10}
                        rowBgClass="bg-white"
                    />
                )}
            </div>
        </div>
    );
}
