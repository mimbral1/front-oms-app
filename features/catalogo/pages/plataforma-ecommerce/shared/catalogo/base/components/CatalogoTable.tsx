// features/catalogo/pages/plataforma-ecommerce/shared/catalogo/base/components/CatalogoTable.tsx
//
// Tabla rica del Catálogo. Combina:
//   - Toolbar del shell nuevo Janis/OMS (`CatalogoToolbar`)
//   - Features ricas del legacy `MarketplaceProductosBrowse`:
//       · ImagePreview con hover-zoom (portal-based, evita clipping)
//       · Tooltip para títulos largos
//       · CopyableText para SKU/item_id (un click copia al clipboard)
//       · Stock con colores (rojo <5, amarillo <20, verde sino)
//       · URL columna con icono "abrir en nueva pestaña"
//       · Skeleton loader en filas
//   - Reputación renombrada a "Calidad de publicación" en headers
//
// Es la nueva source-of-truth para listar productos. Reemplaza al legacy.

"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, ImageIcon, Pencil } from "lucide-react";
import { CopyableText } from "@/components/ui";
import { useStatusCatalogs } from "@/features/catalogo/hooks/useStatusCatalogs";
import { computeQualityDetail } from "../hooks/useCatalogoList";
import type { QualityDetail } from "../hooks/useCatalogoList";
import type { MarketplaceProduct } from "../types/catalogo-types";

export interface CatalogoTableProps {
    rows: MarketplaceProduct[];
    loading: boolean;
    error: string | null;
    onRowClick?: (row: MarketplaceProduct) => void;
}

// Alineado a los tokens globales de tabla (`components/ui/table/table.styles.ts`):
// header lavanda `#E8EAF7`, tipografía `text-xs font-medium uppercase tracking-wider`.
const HEADER_CELL = [
    "text-xs uppercase tracking-wider text-gray-500 font-medium",
    "py-3 px-3 bg-[#E8EAF7] border-b border-gray-200 text-left",
].join(" ");

const BODY_CELL = "py-3 px-3 border-b border-gray-100 align-middle";

export function CatalogoTable({ rows, loading, error, onRowClick }: CatalogoTableProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.sku));

    const toggleAll = useMemo(() => {
        return () => {
            if (allSelected) {
                setSelected(new Set());
            } else {
                setSelected(new Set(rows.map((r) => r.sku)));
            }
        };
    }, [rows, allSelected]);

    const toggleOne = (sku: string) => {
        const next = new Set(selected);
        if (next.has(sku)) next.delete(sku);
        else next.add(sku);
        setSelected(next);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className={`${HEADER_CELL} pl-4 w-9`}>
                                <input
                                    type="checkbox"
                                    aria-label="Seleccionar todos"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="rounded border-gray-300 accent-blue-700"
                                />
                            </th>
                            <th className={`${HEADER_CELL} w-20`}>Imagen</th>
                            <th className={HEADER_CELL}>Producto</th>
                            <th className={`${HEADER_CELL} w-32`}>Categoría</th>
                            <th className={`${HEADER_CELL} text-right w-28`}>Precio</th>
                            <th className={`${HEADER_CELL} text-center w-20`}>Stock</th>
                            <th className={`${HEADER_CELL} w-36`}>URL</th>
                            <th
                                className={`${HEADER_CELL} text-center w-32`}
                                title="Cuán completa está la publicación (atributos + imágenes + descripción)"
                            >
                                Calidad
                            </th>
                            <th className={`${HEADER_CELL} text-center w-24`}>Estado</th>
                            <th
                                className={`${HEADER_CELL} text-center w-12 pr-4`}
                                aria-label="Acciones"
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <SkeletonRows count={5} />}
                        {!loading && error && (
                            <StateRow colSpan={10} kind="error">
                                Error: {error}
                            </StateRow>
                        )}
                        {!loading && !error && rows.length === 0 && (
                            <StateRow colSpan={10} kind="empty">
                                Sin productos — ajusta los filtros o crea un SKU nuevo.
                            </StateRow>
                        )}
                        {!loading &&
                            !error &&
                            rows.map((row) => (
                                <tr
                                    key={row.sku}
                                    onClick={() => onRowClick?.(row)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td
                                        className={`${BODY_CELL} pl-4`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected.has(row.sku)}
                                            onChange={() => toggleOne(row.sku)}
                                            className="rounded border-gray-300 accent-blue-700"
                                            aria-label={`Seleccionar ${row.sku}`}
                                        />
                                    </td>
                                    <td className={BODY_CELL}>
                                        <ImagePreview
                                            src={row.imagenes?.[0]}
                                            alt={row.titulo || row.sku}
                                        />
                                    </td>
                                    <td
                                        className={BODY_CELL}
                                        onClick={(e) => {
                                            // Permitir copiar SKU/item_id sin disparar onRowClick.
                                            if (
                                                (e.target as HTMLElement).closest("[data-copyable]")
                                            ) {
                                                e.stopPropagation();
                                            }
                                        }}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span data-copyable>
                                                    <CopyableText
                                                        text={row.sku}
                                                        className="font-semibold text-gray-900 text-sm"
                                                    >
                                                        #{row.sku}
                                                    </CopyableText>
                                                </span>
                                                {row.item_id && (
                                                    <span data-copyable>
                                                        <CopyableText
                                                            text={row.item_id}
                                                            className="text-xs font-medium text-gray-600 bg-slate-100 rounded-md px-2 py-0.5"
                                                        >
                                                            {row.item_id}
                                                        </CopyableText>
                                                    </span>
                                                )}
                                            </div>
                                            <Tooltip text={row.titulo || ""}>
                                                <div className="text-sm text-gray-600 truncate max-w-[320px] cursor-default">
                                                    {row.titulo || "—"}
                                                </div>
                                            </Tooltip>
                                        </div>
                                    </td>
                                    <td className={BODY_CELL}>
                                        <CategoryCell row={row} />
                                    </td>
                                    <td className={`${BODY_CELL} text-right`}>
                                        <PriceCell row={row} />
                                    </td>
                                    <td className={`${BODY_CELL} text-center`}>
                                        <StockBadge stock={row.stock} />
                                    </td>
                                    <td className={BODY_CELL}>
                                        <UrlCell row={row} />
                                    </td>
                                    <td className={`${BODY_CELL} text-center`}>
                                        <div className="flex flex-col items-center gap-1">
                                            <QualityBadge detail={computeQualityDetail(row)} />
                                            <QcStatusChip qc={row.qc_status} />
                                        </div>
                                    </td>
                                    <td className={`${BODY_CELL} text-center`}>
                                        <StatusBadge
                                            estado={row.estado}
                                            subStatus={row.sub_status}
                                            tags={row.tags}
                                            stock={row.stock}
                                        />
                                    </td>
                                    <td
                                        className={`${BODY_CELL} text-center pr-4`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onRowClick?.(row)}
                                            aria-label={`Editar ${row.sku}`}
                                            title="Editar producto"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function StateRow({
    colSpan,
    kind,
    children,
}: {
    colSpan: number;
    kind: "loading" | "error" | "empty";
    children: React.ReactNode;
}) {
    const tone =
        kind === "error"
            ? "text-rose-600"
            : kind === "empty"
              ? "text-gray-500"
              : "text-gray-400";
    return (
        <tr>
            <td colSpan={colSpan} className={`py-10 px-4 text-center text-sm ${tone}`}>
                {children}
            </td>
        </tr>
    );
}

/** Skeleton de carga — muestra `count` filas grises animadas. */
function SkeletonRows({ count }: { count: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className={`${BODY_CELL} pl-4`}>
                        <div className="w-4 h-4 rounded bg-gray-200" />
                    </td>
                    <td className={BODY_CELL}>
                        <div className="w-14 h-14 rounded-md bg-gray-200" />
                    </td>
                    <td className={BODY_CELL}>
                        <div className="h-4 w-32 rounded bg-gray-200 mb-1.5" />
                        <div className="h-3 w-48 rounded bg-gray-200" />
                    </td>
                    <td className={BODY_CELL}>
                        <div className="h-5 w-24 rounded-full bg-gray-200" />
                    </td>
                    <td className={`${BODY_CELL} text-right`}>
                        <div className="h-4 w-16 rounded bg-gray-200 ml-auto" />
                    </td>
                    <td className={`${BODY_CELL} text-center`}>
                        <div className="h-6 w-12 rounded-full bg-gray-200 mx-auto" />
                    </td>
                    <td className={BODY_CELL}>
                        <div className="h-4 w-24 rounded bg-gray-200" />
                    </td>
                    <td className={`${BODY_CELL} text-center`}>
                        <div className="h-5 w-16 rounded bg-gray-200 mx-auto" />
                    </td>
                    <td className={`${BODY_CELL} text-center`}>
                        <div className="h-5 w-16 rounded-full bg-gray-200 mx-auto" />
                    </td>
                    <td className={`${BODY_CELL} text-center pr-4`}>
                        <div className="h-8 w-8 rounded-md bg-gray-200 mx-auto" />
                    </td>
                </tr>
            ))}
        </>
    );
}

/** Upgrade resolución de imagen para ML (`-I.jpg` → `-O.jpg`). */
function getHighQualityImageUrl(url: string): string {
    if (!url) return url;
    return url.replace(/-I\.(jpg|jpeg|png|webp)$/i, "-O.$1");
}

/** Image preview con hover-zoom via React Portal — evita clipping del overflow del table. */
function ImagePreview({ src, alt }: { src?: string; alt: string }) {
    const [pos, setPos] = useState<{ x: number; y: number; placeLeft: boolean } | null>(
        null,
    );
    const imgRef = useRef<HTMLImageElement>(null);

    if (!src) {
        return (
            <div className="w-14 h-14 rounded-md bg-gray-100 ring-1 ring-gray-200 grid place-items-center text-gray-400">
                <ImageIcon className="w-5 h-5" />
            </div>
        );
    }

    const previewSrc = getHighQualityImageUrl(src);

    const handleEnter = () => {
        const rect = imgRef.current?.getBoundingClientRect();
        if (!rect) return;

        const previewWidth = 260;
        const gap = 14;
        const safeTop = 24;
        const safeBottom = 24;

        const centerY = rect.top + rect.height / 2;
        const minY = safeTop + previewWidth / 2;
        const maxY = window.innerHeight - safeBottom - previewWidth / 2;
        const clampedY = Math.min(Math.max(centerY, minY), maxY);

        const wouldOverflowRight = rect.right + gap + previewWidth > window.innerWidth - 12;
        const placeLeft = wouldOverflowRight;
        const x = placeLeft ? rect.left - gap : rect.right + gap;

        setPos({ x, y: clampedY, placeLeft });
    };

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading="lazy"
                className="h-14 w-14 object-cover rounded-md border border-gray-200 transition-transform duration-200 hover:scale-105 hover:shadow-md cursor-zoom-in"
                onMouseEnter={handleEnter}
                onMouseLeave={() => setPos(null)}
            />
            {pos &&
                createPortal(
                    <div
                        className="pointer-events-none fixed z-[9999]"
                        style={{
                            left: pos.x,
                            top: pos.y,
                            transform: `translate(${pos.placeLeft ? "-100%" : "0"}, -50%)`,
                        }}
                    >
                        <div className="w-[260px] rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-2 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.45)] backdrop-blur-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewSrc}
                                alt={alt}
                                className="h-[244px] w-full object-contain rounded-xl bg-white/90"
                            />
                            <div className="mt-1 px-1 text-[10px] font-medium tracking-wide text-slate-500">
                                Vista ampliada
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}

/** Tooltip simple para títulos truncados. */
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
    const [show, setShow] = useState(false);
    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && text && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg max-w-md whitespace-normal break-words text-center leading-snug pointer-events-none">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
}

function CategoryCell({ row }: { row: MarketplaceProduct }) {
    // Backend `/api/pim/productos` (listado) devuelve solo `categoria_marketplace`
    // — `mapeo` y `sap` no se incluyen en el list endpoint (requeriría joins
    // adicionales). El nombre humano `categoria_marketplace.nombre` viene cuando
    // el µservice pudo resolver el `category_id` ML contra su cache local.
    const cat = row.categoria_marketplace;
    const mapeoCat = row.mapeo?.categoria_nombre;
    const sap = row.sap;
    const sapFull = sap
        ? [sap.n1_nombre, sap.n2_nombre, sap.n3_nombre].filter(Boolean).join(" > ")
        : null;

    const catName = cat?.nombre;
    const catId = cat?.id;

    if (!mapeoCat && !sapFull && !catName && !catId) {
        return <span className="text-xs text-gray-400">Sin categoría</span>;
    }
    return (
        <div className="flex flex-col gap-1">
            {/* Mapeo aprobado (cuando existe) — prioridad alta */}
            {mapeoCat && (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 max-w-[200px] truncate">
                    {mapeoCat}
                </span>
            )}
            {/* Categoría del marketplace (lo que ML devuelve para esta publicación) */}
            {!mapeoCat && catName && (
                <Tooltip text={catId ? `${catName} (${catId})` : catName}>
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 max-w-[200px] truncate cursor-default">
                        {catName}
                    </span>
                </Tooltip>
            )}
            {/* Solo ID si el backend no resolvió el nombre (cache miss) */}
            {!mapeoCat && !catName && catId && (
                <Tooltip text={`Categoría ${catId} — nombre no resuelto en el cache del backend`}>
                    <code className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[11px] tabular-nums text-gray-500 max-w-[200px] truncate cursor-default ring-1 ring-gray-200">
                        {catId}
                    </code>
                </Tooltip>
            )}
            {/* SAP secundario (cuando el listado lo joinea — hoy no aplica) */}
            {sapFull && (
                <Tooltip text={sapFull}>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 max-w-[200px] truncate cursor-default">
                        SAP: {sap?.n3_nombre || sapFull}
                    </span>
                </Tooltip>
            )}
        </div>
    );
}

function UrlCell({ row }: { row: MarketplaceProduct }) {
    // ML envía `permalink` (mapeado a `url_producto` por el µservice) incluso
    // cuando la publicación está pausada/closed. Solo es `null` cuando el item
    // nunca se publicó en el marketplace.
    //
    // 2026-05-18: antes filtrábamos "Sin URL" para `closed`, pero ML mantiene el
    // permalink — al cerrarlo redirige a una página "Publicación finalizada" que
    // sigue siendo útil para auditoría.
    if (!row.url_producto) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 cursor-not-allowed">
                Sin URL
            </span>
        );
    }
    const closed = row.estado === "closed";
    const paused = row.estado === "paused";
    return (
        <a
            href={row.url_producto}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={
                closed
                    ? "Publicación cerrada — el link redirige a la página de cierre de ML"
                    : paused
                      ? "Publicación pausada — el link sigue accesible"
                      : "Ver publicación en el marketplace"
            }
            className={[
                "inline-flex items-center gap-1 text-xs hover:underline transition-colors",
                closed
                    ? "text-gray-500 hover:text-gray-700"
                    : paused
                      ? "text-amber-700 hover:text-amber-900"
                      : "text-blue-600 hover:text-blue-800",
            ].join(" ")}
        >
            {closed ? "Ver (cerrada)" : paused ? "Ver (pausada)" : "Ver publicación"}
            <ExternalLink className="h-3 w-3" />
        </a>
    );
}

/**
 * Celda de precio con soporte de oferta.
 *
 * - Sin oferta → precio único en gris-900 + sufijo CLP (idéntico al diseño original).
 * - Con oferta → dos líneas:
 *     · arriba: precio original tachado en gris-400 (más chico).
 *     · abajo:  precio oferta en gris-900 destacado + badge "-N%" en rose.
 *
 * El criterio "hay oferta" es `tiene_oferta=true` y `precio_original > precio`.
 * Si el backend marcó `tiene_oferta` pero los campos no cuadran, caemos al
 * render simple para no mostrar un tachado inválido.
 */
function PriceCell({ row }: { row: MarketplaceProduct }) {
    if (row.precio == null) {
        return <span className="text-gray-400">—</span>;
    }

    const hasOffer =
        row.tiene_oferta === true &&
        row.precio_original != null &&
        row.precio_original > row.precio;

    if (!hasOffer) {
        return (
            <>
                <span className="font-medium text-gray-900 tabular-nums">
                    ${row.precio.toLocaleString("es-CL")}
                </span>
                <span className="ml-1 text-[10px] text-gray-400 font-normal">CLP</span>
            </>
        );
    }

    return (
        <div className="flex flex-col items-end leading-tight">
            <span className="text-[11px] text-gray-400 line-through tabular-nums">
                ${row.precio_original!.toLocaleString("es-CL")}
            </span>
            <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-gray-900 tabular-nums">
                    ${row.precio.toLocaleString("es-CL")}
                </span>
                <span className="text-[10px] text-gray-400 font-normal">CLP</span>
                {row.oferta_pct != null && row.oferta_pct > 0 && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-md px-1.5 py-0.5 tabular-nums">
                        -{row.oferta_pct}%
                    </span>
                )}
            </div>
        </div>
    );
}

function StockBadge({ stock }: { stock: number | null | undefined }) {
    if (stock == null) {
        return <span className="text-gray-400 text-sm">—</span>;
    }
    // Soft/translúcido: fondo tintado a baja opacidad + texto del color + anillo sutil.
    // Paleta alineada a `statusVariants`: verde=ok, ámbar=bajo, rojo=crítico/sin stock.
    let color = "bg-green-500/15 text-green-700 ring-green-600/20";
    if (stock === 0) color = "bg-red-500/15 text-red-700 ring-red-600/20";
    else if (stock < 5) color = "bg-red-500/15 text-red-700 ring-red-600/20";
    else if (stock < 20) color = "bg-amber-500/15 text-amber-700 ring-amber-600/20";
    return (
        <span
            className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold tabular-nums min-w-[2.5rem] ring-1 ring-inset ${color}`}
        >
            {stock}
        </span>
    );
}

/**
 * Badge de calidad — muestra el nivel OFICIAL de ML mapeado a labels simples:
 *
 *   ML level → UI label  (mapping universal, no per-site)
 *   ─────────   ────────
 *   "Good"   → "Buena"        (verde)
 *   "Medium" → "Regular"      (ámbar)
 *   "Bad"    → "Mala"         (rojo)
 *   null + isCatalogListing → "Catálogo"  (azul — content de la ficha ML, no del seller)
 *   null + !catalog        → "Sin score" (gris — ML no calculó aún)
 *
 * El score numérico solo aparece en el tooltip al hover, no en el badge.
 * Cuando el seller abre el SKU en el Editor, ve el detalle completo
 * (score, level_wording oficial, buckets) — el catalog list es solo
 * un overview rápido.
 *
 * Fuente de datos: `ml_skus.performance_*` + `ml_skus.is_catalog_listing` (migration 019)
 * que actualiza:
 *   - el worker periódico cada 6h
 *   - lazy refresh cuando el seller abre un SKU en el Editor
 *   - post-publish refresh cuando se publica/edita un item desde el PIM
 */
function QualityBadge({ detail }: { detail: QualityDetail }) {
    // Sin score → 2 sub-casos según si es catálogo o no.
    if (detail.level == null || detail.score == null) {
        // Sub-caso: publicación de catálogo (content de la ficha compartida ML,
        // no del seller). ML no calcula performance del listing porque Mimbral
        // no controla el content — el score "del producto" se calcula a nivel
        // catalog product compartido entre sellers, no es del listing.
        if (detail.isCatalogListing) {
            return (
                <span
                    title="Publicación de catálogo. El content (título, fotos, atributos) viene de la ficha compartida de ML — el score del listing no aplica. Para mejorar tu posición competí en precio, premium o envío gratis."
                    className="inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold cursor-default ring-1 ring-inset bg-blue-500/15 text-blue-700 ring-blue-600/20"
                >
                    Catálogo
                </span>
            );
        }
        // Sub-caso: clásica sin score (paused, closed, recién publicado, sin tráfico).
        return (
            <span
                title="ML aún no calculó el score para este ítem (publicación reciente o sin tráfico). Se actualiza cuando el seller activo recibe visitas."
                className="inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold cursor-default ring-1 ring-inset bg-gray-400/20 text-gray-600 ring-gray-500/20"
            >
                Sin score
            </span>
        );
    }

    // Soft/translúcido alineado a la paleta global (`statusVariants`).
    const map = {
        green: { label: "Buena", bg: "bg-green-500/15 text-green-700 ring-green-600/20" },
        yellow: { label: "Regular", bg: "bg-amber-500/15 text-amber-700 ring-amber-600/20" },
        red: { label: "Mala", bg: "bg-red-500/15 text-red-700 ring-red-600/20" },
    } as const;
    const m = map[detail.level];
    const scoreLabel = detail.kind === "fala" ? "Content score" : "Score ML";
    // Falabella: mostramos el número EN el badge (es la métrica accionable —
    // define aprobación/revisión/rechazo). ML: solo el nivel (número en tooltip).
    const badgeLabel =
        detail.kind === "fala" ? `${m.label} · ${detail.score}` : m.label;

    // Tooltip: score numérico + cuándo se sincronizó. Para el detalle completo
    // (pendientes, acciones), el seller abre el SKU en el Editor.
    const titleParts: string[] = [`${m.label} · ${scoreLabel}: ${detail.score}/100`];
    if (detail.calculatedAt) {
        titleParts.push(
            `Calculado por ML: ${new Date(detail.calculatedAt).toLocaleString("es-CL")}`,
        );
    }
    if (detail.syncedAt) {
        titleParts.push(
            `Sincronizado: ${new Date(detail.syncedAt).toLocaleString("es-CL")}`,
        );
    }

    return (
        <span
            title={titleParts.join(" · ")}
            className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold cursor-default ring-1 ring-inset ${m.bg}`}
        >
            {badgeLabel}
        </span>
    );
}

/**
 * Chip de QC status Falabella (`GetProducts.QCStatus`): approved / pending /
 * rejected. Complementa el content score — un producto puede tener buen score
 * pero estar rechazado por QC. ML no expone QC → el chip no se monta (null).
 */
function QcStatusChip({ qc }: { qc?: string | null }) {
    if (!qc) return null;
    const v = String(qc).toLowerCase();
    const map: Record<string, { label: string; cls: string }> = {
        approved: { label: "QC aprobado", cls: "bg-green-500/15 text-green-700 ring-green-600/20" },
        pending: { label: "QC pendiente", cls: "bg-orange-500/15 text-orange-700 ring-orange-600/20" },
        rejected: { label: "QC rechazado", cls: "bg-red-500/15 text-red-700 ring-red-600/20" },
    };
    const m = map[v];
    if (!m) return null;
    return (
        <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${m.cls}`}
        >
            {m.label}
        </span>
    );
}

/**
 * Diccionario de sub-estados ML → texto humano para el seller.
 *
 * Los códigos vienen tal cual de la API ML (`sub_status[]` del item). Los textos
 * están alineados con la guía oficial "Gestionar Moderaciones" de Mercado Libre
 * (`/moderations/last_moderation/{itemId}-ITM`) para que el seller vea el mismo
 * wording que en el panel ML. Si llega un código desconocido, lo presentamos
 * capitalizado en vez de exponer el snake_case crudo.
 */
const SUB_STATUS_LABEL: Record<string, string> = {
    // Inhabilitaciones / bloqueos por moderación
    forbidden: "Ítem inhabilitado por Mercado Libre",
    held: "Inactiva. En revisión por Mercado Libre",
    suspended: "Suspendida por riesgo de operaciones fraudulentas",
    suspended_for_prevention: "Suspendida por prevención de fraude",
    pending_documentation: "Denuncia de Brand Protection Program",
    // Acción esperada del vendedor
    waiting_for_patch: "Pausada por infracciones — modifícala para reactivar",
    bad_description: "La descripción no cumple los requisitos",
    bad_picture: "Las imágenes no cumplen los requisitos",
    manufacturing_time_required: "Falta declarar tiempo de fabricación",
    payment_required: "Pago pendiente",
    pending_visit: "Esperando visita técnica",
    // Procesando imagen subida por URL (ML usa ambas variantes de spelling)
    picture_download_pending: "La foto se está procesando o no se pudo descargar",
    picture_downloading_pending: "La foto se está procesando o no se pudo descargar",
    // Revisión activa
    pending_review: "Mercado Libre está revisando la publicación",
    under_review: "Mercado Libre está revisando la publicación",
    warning: "Con una advertencia de moderación",
    // Inventario / ciclo de vida
    out_of_stock: "Sin stock disponible",
    expired: "Publicación expirada",
    freeze: "Publicación congelada por Mercado Libre",
    deleted: "Borrada por el vendedor",
    inactive: "Inactiva",
    // Otros / legacy
    incorrect_category: "Estaba en una categoría incorrecta",
    infringes_rules: "Infringe las reglas de publicación",
    infraction: "Con infracción reportada",
    infringement: "Con infracción reportada",
    error: "La publicación tiene un error reportado por Mercado Libre",
};

/**
 * Tags ML relevantes para moderación. El resto de tags (calidad de listado,
 * envío, catálogo, etc.) se ignora porque no aportan info de estado.
 */
const TAGS_LABEL: Record<string, string> = {
    moderation_penalty: "Penalizada por Mercado Libre (cambio inusual de precio o ítem sin ventas)",
    poor_quality_thumbnail: "Foto de portada de baja calidad",
};

/**
 * Convierte un código ML desconocido (`snake_case`) en algo presentable:
 *   `waiting_for_payment` → "Waiting for payment"
 * No es ideal, pero evita exponer un identificador interno crudo al seller.
 */
function prettifyUnknownCode(code: string): string {
    const spaced = code.replace(/_/g, " ").trim();
    if (!spaced) return code;
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Combina sub_status y tags relevantes en un único texto para el tooltip.
 * Filtra los tags ML que no aportan info de moderación.
 */
function buildStatusReason(
    subStatus: string[] | undefined | null,
    tags: string[] | undefined | null,
): string | null {
    const parts: string[] = [];

    if (subStatus?.length) {
        for (const code of subStatus) {
            parts.push(SUB_STATUS_LABEL[code] ?? prettifyUnknownCode(code));
        }
    }
    if (tags?.length) {
        for (const tag of tags) {
            const label = TAGS_LABEL[tag];
            if (label) parts.push(label);
        }
    }

    return parts.length ? parts.join(" · ") : null;
}

/**
 * Algunos estados ML son ambiguos sin su sub_status / tag. Cuando detectamos
 * un sub_status o tag de moderación claro, hacemos relabel del badge para que
 * el seller vea de un vistazo el motivo real (vs un "En revisión" genérico).
 */
function reinterpretBadge(
    estado: string,
    subStatus: string[] | undefined,
    tags: string[] | undefined,
): { label: string; bg: string } | null {
    const sub = subStatus ?? [];
    const tg  = tags ?? [];

    // under_review + sub_status específico
    if (estado === "under_review") {
        if (sub.includes("forbidden") || sub.includes("incorrect_category")) {
            return { label: "Bloqueada", bg: "bg-red-500/15 text-red-700 ring-red-600/20" };
        }
        if (sub.includes("held")) {
            return { label: "Retenida", bg: "bg-red-500/15 text-red-700 ring-red-600/20" };
        }
        if (sub.includes("suspended") || sub.includes("suspended_for_prevention")) {
            return { label: "Suspendida", bg: "bg-red-600/15 text-red-700 ring-red-600/25" };
        }
        if (sub.includes("pending_documentation")) {
            return { label: "Brand Protection", bg: "bg-red-500/15 text-red-700 ring-red-600/20" };
        }
        if (sub.includes("waiting_for_patch")) {
            return { label: "Acción requerida", bg: "bg-orange-500/15 text-orange-700 ring-orange-600/20" };
        }
        if (sub.includes("picture_download_pending") || sub.includes("picture_downloading_pending")) {
            return { label: "Imagen pendiente", bg: "bg-orange-500/15 text-orange-700 ring-orange-600/20" };
        }
        if (sub.includes("out_of_stock")) {
            return { label: "Sin stock", bg: "bg-gray-500/15 text-gray-600 ring-gray-500/20" };
        }
    }

    // paused + tag de moderación / sub_status
    if (estado === "paused") {
        if (tg.includes("moderation_penalty")) {
            return { label: "Pausada por ML", bg: "bg-gray-500/15 text-gray-600 ring-gray-500/20" };
        }
        if (sub.includes("picture_download_pending") || sub.includes("picture_downloading_pending")) {
            return { label: "Imagen pendiente", bg: "bg-orange-500/15 text-orange-700 ring-orange-600/20" };
        }
    }

    // closed + tag → ML cerró por penalidad
    if (estado === "closed" && tg.includes("moderation_penalty")) {
        return { label: "Cerrada por ML", bg: "bg-red-500/15 text-red-700 ring-red-600/20" };
    }

    return null;
}

function StatusBadge({
    estado,
    subStatus,
    tags,
    stock,
}: {
    estado: string | undefined;
    subStatus?: string[];
    tags?: string[];
    stock?: number | null;
}) {
    // Follow-up Item 2 auditoría: estados ML vienen del lookup `ml_item_status`
    // (migration 030) en lugar de mapeo hardcoded. Si el lookup no está
    // hidratado todavía (primer render), caemos al fallback hardcoded para
    // que la UI nunca se vea vacía.
    const s = (estado ?? "").toLowerCase();
    const { itemStatus } = useStatusCatalogs();

    // Soft/translúcido alineado a `statusVariants` global (success/inactive/error/review).
    const fallbackMap: Record<string, { label: string; bg: string }> = {
        active:       { label: "Activo",      bg: "bg-green-500/15 text-green-700 ring-green-600/20"   },
        paused:       { label: "Pausado",     bg: "bg-gray-400/20 text-gray-600 ring-gray-500/20"      },
        closed:       { label: "Inactivo",    bg: "bg-gray-400/20 text-gray-600 ring-gray-500/20"      },
        error:        { label: "Con error",   bg: "bg-red-500/15 text-red-700 ring-red-600/20"         },
        under_review: { label: "En revisión", bg: "bg-orange-500/15 text-orange-700 ring-orange-600/20" },
    };

    const reinterpreted = reinterpretBadge(s, subStatus, tags);

    // Build meta: usar lookup si está hidratado, sino fallback hardcoded.
    let meta: { label: string; bg?: string; style?: React.CSSProperties };
    if (reinterpreted) {
        meta = reinterpreted;
    } else if (itemStatus[s]) {
        const lookup = itemStatus[s];
        meta = {
            label: lookup.labelEs,
            // Soft/translúcido: el hex de marca como texto + fondo a ~15% alpha +
            // color del anillo (--tw-ring-color) vía el hex. El ancho del anillo
            // lo pone el className base (ring-1 ring-inset).
            style: lookup.colorHex
                ? {
                      backgroundColor: `${lookup.colorHex}26`,
                      color: lookup.colorHex,
                      ["--tw-ring-color" as any]: `${lookup.colorHex}59`,
                  }
                : undefined,
            bg: lookup.colorHex ? undefined : "bg-gray-400/20 text-gray-600 ring-gray-500/20",
        };
    } else if (fallbackMap[s]) {
        meta = fallbackMap[s];
    } else {
        meta = { label: estado ?? "—", bg: "bg-gray-400/20 text-gray-600 ring-gray-500/20" };
    }

    // Agotado: listing activo pero sin stock (Falabella lo muestra como "se
    // agotó"; ML como out_of_stock). Solo si no hubo reinterpretación por
    // moderación — esos estados tienen prioridad sobre "Agotado".
    const soldOut = !reinterpreted && (s === "active" || s === "activo") && stock === 0;
    if (soldOut) {
        meta = { label: "Agotado", bg: "bg-orange-500/15 text-orange-700 ring-orange-600/20" };
    }

    const reason = soldOut
        ? "Publicación activa pero sin stock — el comprador la ve como agotada."
        : buildStatusReason(subStatus, tags);
    // Mostramos tooltip cuando hay info de moderación o cuando el estado no es
    // un "Activo limpio" (active sin tags de moderación).
    const showTooltip = soldOut
        ? true
        : !!reason && (s !== "active" || (tags?.some((t) => TAGS_LABEL[t]) ?? false));

    const badge = (
        <span
            className={`inline-flex items-center justify-center rounded-md px-4 py-1.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${meta.bg ?? ""}`.trim()}
            style={meta.style}
        >
            {meta.label}
        </span>
    );

    if (showTooltip && reason) {
        return <Tooltip text={reason}>{badge}</Tooltip>;
    }
    return badge;
}
