# Ola 3 · 3c — Explorador de elegibilidad de promociones · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una vista nueva en el módulo de ofertas ML donde buscas un SKU / MLC / nombre y ves, por cada publicación, a cuántas promociones puede optar / participa / programadas, con detalle expandible por promo y alertas de superposición. Solo lectura.

**Architecture:** 100% front en `FrontOmsMimbral`. Reusa endpoints existentes (catálogo `search=`, `/publicaciones` de 3b, `listItemPromotions` = `GET …/seller-promotions/items/:item_id`). Tabla con filas expandibles (`DataTableExpandable`). Helper puro `toEligibility` agrupa por status y arma warnings. Cero escrituras a ML.

**Tech Stack:** Next.js 15 + React 18 + MUI + Tailwind + TypeScript. Sin jest → verificación con `tsc --noEmit`. Tipografía Inter heredada del layout.

**Spec:** `docs/superpowers/specs/2026-05-31-ola3-3c-explorador-elegibilidad-design.md`

**⚠️ Restricciones duras:** NO writes a ML (todo GET) · no romper el módulo de ofertas existente · **NO `git commit`** (el usuario maneja git → "commit" se reemplaza por verificación) · **español neutro** (forma "tú", nunca voseo) · reutilizar componentes OMS, **sin pills**.

---

## File Structure

Base = `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/`

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `base/api/ofertas-api.ts` | Modify | extender `RawPromotionItem` (`type?`,`name?`,`sub_type?`); `+ listPublicaciones(sku)`; `+ searchProductos(q)` |
| `base/types/elegibilidad-types.ts` | Create | `OfferPublication`, `ProductMatch`, `PublicationEligibility`, `EligibilityWarning` |
| `base/helpers/elegibilidad.ts` | Create | `toEligibility(pub, promos)` (puro) + warnings |
| `base/hooks/useElegibilidad.ts` | Create | búsqueda → selección → carga de elegibilidad |
| `base/components/PromoStatusBadge.tsx` | Create | badge inline por estado de promo |
| `base/views/ElegibilidadView.tsx` | Create | header + buscador + `DataTableExpandable` |
| `base/index.ts` | Modify | export `ElegibilidadView` |
| `index.ts` (outer) | Modify | alias `MeliElegibilidadView` |
| `base/views/OfertasListView.tsx` | Modify | botón "Elegibilidad" en el header |
| `app/catalogo/plataforma-ecommerce/mercadolibre/ofertas/elegibilidad/page.tsx` | Create | monta `MeliElegibilidadView` |

Orden: 1 (api+tipos) → 2 (helper) → 3 (hook) → 4 (badge) → 5 (view) → 6 (ruta+wiring). Cada tarea cierra con `tsc --noEmit`.

**Comando de verificación (front, sin jest), desde la raíz del repo:**
```bash
cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && node ./node_modules/typescript/bin/tsc --noEmit; echo "TSC_EXIT=$?"
```
Esperado: `TSC_EXIT=0` (sin errores nuevos en los archivos tocados). **No `git commit`.**

---

## Task 1: API (extender RawPromotionItem + listPublicaciones + searchProductos) + tipos

**Files:**
- Modify: `base/api/ofertas-api.ts`
- Create: `base/types/elegibilidad-types.ts`

- [ ] **Step 1: Extender `RawPromotionItem`**

En `base/api/ofertas-api.ts`, en la interface `export interface RawPromotionItem { ... }` (tras `readonly status: ItemStatus;`), agregar 3 campos opcionales:

```ts
    /** Tipo de promo. ML lo incluye en GET /seller-promotions/items/:item_id
     *  (cada entrada es de un tipo distinto). Opcional porque listPromotionItems
     *  (items de UNA campaña) no lo trae por ítem. */
    readonly type?: MLPromotionType;
    readonly name?: string;
    readonly sub_type?: string;
```

(`MLPromotionType` ya está importado en este archivo desde `../types/oferta-types`.)

- [ ] **Step 2: Crear los tipos del explorador**

Crear `base/types/elegibilidad-types.ts`:

```ts
// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/types/elegibilidad-types.ts
//
// Tipos del Explorador de elegibilidad (Ola 3·3c). Solo lectura.

import type { RawPromotionItem } from "../api/ofertas-api";

/** Una publicación ML de un SKU (del endpoint /publicaciones de 3b). */
export interface OfferPublication {
    itemId: string;
    isPrimary: boolean;
    isCatalogListing: boolean;
    catalogProductId: string | null;
    variationId: string | null;
    inventoryId: string | null;
    userProductId: string | null;
    itemStatus: string | null;   // active | paused | closed | ...
    logisticType: string | null; // fulfillment | self_service | ...
}

/** Resultado de la búsqueda de catálogo (SKU/MLC/nombre). */
export interface ProductMatch {
    sku: string;
    titulo: string;
    itemId?: string;
}

/** Aviso de superposición/operativo (solo reglas documentadas). */
export type EligibilityWarning =
    | { kind: "price_discount_standby" } // DEAL activo + PRICE_DISCOUNT → stand-by
    | { kind: "raise_price_drops" }      // subir precio saca de la oferta activa
    | { kind: "meli_all_auto" };         // PRICE_MATCHING_MELI_ALL (informativo)

/** Elegibilidad de UNA publicación: promos agrupadas por estado + warnings. */
export interface PublicationEligibility {
    publication: OfferPublication;
    puedeOptar: RawPromotionItem[];   // status === 'candidate'
    participa: RawPromotionItem[];    // status === 'started'
    programada: RawPromotionItem[];   // status === 'pending'
    warnings: EligibilityWarning[];
}
```

- [ ] **Step 3: Agregar `listPublicaciones` y `searchProductos` al api**

En `base/api/ofertas-api.ts`:

(a) Importar los tipos nuevos (junto al import de `../types/oferta-types`):
```ts
import type { OfferPublication, ProductMatch } from "../types/elegibilidad-types";
```

(b) Tipo raw del envelope de `/publicaciones` (3b) — agregar junto a los otros shapes raw (p. ej. tras `ProductosListResponse`):
```ts
interface RawPublicationRow {
    readonly itemId: string;
    readonly isPrimary?: boolean;
    readonly isCatalogListing?: boolean;
    readonly catalogProductId?: string | null;
    readonly variationId?: string | null;
    readonly inventoryId?: string | null;
    readonly userProductId?: string | null;
    readonly itemStatus?: string | null;
    readonly logisticType?: string | null;
}
interface PublicacionesResponse {
    readonly ok?: boolean;
    readonly publications?: ReadonlyArray<RawPublicationRow>;
}
```

(c) En la interface `UseOfertasApi`, declarar los 2 métodos nuevos (junto a `listItemPromotions`/`listSellerCatalog`):
```ts
    /** Publicaciones (N item_id) de un SKU — endpoint /publicaciones de 3b. */
    listPublicaciones: (sku: string) => Promise<OfferPublication[]>;
    /** Búsqueda de catálogo por SKU / MLC / nombre (LIKE). Devuelve matches. */
    searchProductos: (query: string) => Promise<ProductMatch[]>;
```

(d) Implementar ambos `useCallback` (junto a `listItemPromotions`), respetando el patrón `request(method, path, body?, query?)` del archivo:
```ts
    const listPublicaciones: UseOfertasApi["listPublicaciones"] = useCallback(
        async (sku) => {
            const r = await request<PublicacionesResponse>(
                "GET",
                `${BASE}/canales/mercadolibre/productos/${encodeURIComponent(sku)}/publicaciones`,
            );
            return (r.publications ?? []).map((p) => ({
                itemId: p.itemId,
                isPrimary: Boolean(p.isPrimary),
                isCatalogListing: Boolean(p.isCatalogListing),
                catalogProductId: p.catalogProductId ?? null,
                variationId: p.variationId ?? null,
                inventoryId: p.inventoryId ?? null,
                userProductId: p.userProductId ?? null,
                itemStatus: p.itemStatus ?? null,
                logisticType: p.logisticType ?? null,
            }));
        },
        [request],
    );

    const searchProductos: UseOfertasApi["searchProductos"] = useCallback(
        async (query) => {
            const q = query.trim();
            if (!q) return [];
            const r = await request<ProductosListResponse>(
                "GET",
                `${BASE}/productos`,
                undefined,
                { marketplace: "ml", search: q, page: 1, pageSize: 50, status: "activos" },
            );
            return (r.data ?? []).map((row) => ({
                sku: row.sku ?? "",
                titulo: row.titulo ?? row.sku ?? "",
                itemId: row.item_id ?? undefined,
            }));
        },
        [request],
    );
```

(e) Añadir `listPublicaciones` y `searchProductos` al objeto que retorna `useOfertasApi` (junto a los demás métodos) y, si ese objeto está envuelto en `useMemo`/`useCallback` con array de deps, incluirlos ahí.

- [ ] **Step 4: Verificar tipos (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && node ./node_modules/typescript/bin/tsc --noEmit; echo "TSC_EXIT=$?"`
Expected: `TSC_EXIT=0` (sin errores en `ofertas-api.ts` ni `elegibilidad-types.ts`).

---

## Task 2: Helper puro `toEligibility`

**Files:**
- Create: `base/helpers/elegibilidad.ts`

- [ ] **Step 1: Crear el helper**

Crear `base/helpers/elegibilidad.ts`:

```ts
// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/elegibilidad.ts
//
// Normalización pura: promos de un ítem → buckets por estado + warnings.
// Warnings SOLO con reglas documentadas (ver spec §1). NO inventar precedencias.

import type { RawPromotionItem } from "../api/ofertas-api";
import type {
    OfferPublication,
    PublicationEligibility,
    EligibilityWarning,
} from "../types/elegibilidad-types";

/** Tipos que se caen automáticamente si el seller sube el precio del ítem. */
const RAISE_PRICE_DROPS = new Set<string>([
    "MARKETPLACE_CAMPAIGN",
    "VOLUME",
    "PRICE_DISCOUNT",
    "SELLER_CAMPAIGN",
]);

export function toEligibility(
    publication: OfferPublication,
    promotions: RawPromotionItem[],
): PublicationEligibility {
    const puedeOptar = promotions.filter((p) => p.status === "candidate");
    const participa = promotions.filter((p) => p.status === "started");
    const programada = promotions.filter((p) => p.status === "pending");

    const warnings: EligibilityWarning[] = [];

    const dealActivo = promotions.some(
        (p) => p.type === "DEAL" && (p.status === "started" || p.status === "pending"),
    );
    const priceDiscountPresente = promotions.some(
        (p) =>
            p.type === "PRICE_DISCOUNT" &&
            (p.status === "candidate" || p.status === "started"),
    );
    if (dealActivo && priceDiscountPresente) {
        warnings.push({ kind: "price_discount_standby" });
    }

    const tieneActivaQueCae = promotions.some(
        (p) => p.status === "started" && p.type != null && RAISE_PRICE_DROPS.has(p.type),
    );
    if (tieneActivaQueCae) warnings.push({ kind: "raise_price_drops" });

    if (promotions.some((p) => p.type === "PRICE_MATCHING_MELI_ALL")) {
        warnings.push({ kind: "meli_all_auto" });
    }

    return { publication, puedeOptar, participa, programada, warnings };
}
```

- [ ] **Step 2: Verificar tipos (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && node ./node_modules/typescript/bin/tsc --noEmit; echo "TSC_EXIT=$?"`
Expected: `TSC_EXIT=0`.

---

## Task 3: Hook `useElegibilidad`

**Files:**
- Create: `base/hooks/useElegibilidad.ts`

- [ ] **Step 1: Crear el hook**

Crear `base/hooks/useElegibilidad.ts`:

```ts
// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/hooks/useElegibilidad.ts
//
// Estado del Explorador: búsqueda (SKU/MLC/nombre) → seleccionar un producto →
// cargar publicaciones + elegibilidad de cada una. Read-only.

"use client";

import { useCallback, useState } from "react";
import { useOfertasApi } from "../api/ofertas-api";
import { toEligibility } from "../helpers/elegibilidad";
import type {
    ProductMatch,
    PublicationEligibility,
} from "../types/elegibilidad-types";

export interface UseElegibilidadReturn {
    query: string;
    setQuery: (q: string) => void;
    results: ProductMatch[];
    selectedSku: string | null;
    selectedTitulo: string | null;
    searching: boolean;
    loading: boolean;
    error: string | null;
    eligibility: PublicationEligibility[];
    search: () => Promise<void>;
    selectProduct: (m: ProductMatch) => Promise<void>;
    reload: () => Promise<void>;
}

export function useElegibilidad(): UseElegibilidadReturn {
    const api = useOfertasApi();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ProductMatch[]>([]);
    const [selectedSku, setSelectedSku] = useState<string | null>(null);
    const [selectedTitulo, setSelectedTitulo] = useState<string | null>(null);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eligibility, setEligibility] = useState<PublicationEligibility[]>([]);

    const selectProduct = useCallback(
        async (m: ProductMatch) => {
            setSelectedSku(m.sku);
            setSelectedTitulo(m.titulo);
            setLoading(true);
            setError(null);
            setEligibility([]);
            try {
                const pubs = await api.listPublicaciones(m.sku);
                const settled = await Promise.allSettled(
                    pubs.map(async (pub) => {
                        const { results } = await api.listItemPromotions(pub.itemId);
                        return toEligibility(pub, [...results]);
                    }),
                );
                const rows: PublicationEligibility[] = settled.map((s, i) =>
                    s.status === "fulfilled" ? s.value : toEligibility(pubs[i], []),
                );
                setEligibility(rows);
            } catch (e) {
                setError(
                    e instanceof Error ? e.message : "No se pudo cargar la elegibilidad.",
                );
            } finally {
                setLoading(false);
            }
        },
        [api],
    );

    const search = useCallback(async () => {
        const q = query.trim();
        if (!q) return;
        setSearching(true);
        setError(null);
        setResults([]);
        setSelectedSku(null);
        setEligibility([]);
        try {
            const matches = await api.searchProductos(q);
            setResults(matches);
            if (matches.length === 1) await selectProduct(matches[0]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo buscar.");
        } finally {
            setSearching(false);
        }
    }, [api, query, selectProduct]);

    const reload = useCallback(async () => {
        if (selectedSku) await selectProduct({ sku: selectedSku, titulo: selectedTitulo ?? selectedSku });
    }, [selectedSku, selectedTitulo, selectProduct]);

    return {
        query, setQuery, results, selectedSku, selectedTitulo,
        searching, loading, error, eligibility, search, selectProduct, reload,
    };
}
```

- [ ] **Step 2: Verificar tipos (NO commit)** — `tsc --noEmit` → `TSC_EXIT=0`.

---

## Task 4: Componente `PromoStatusBadge`

**Files:**
- Create: `base/components/PromoStatusBadge.tsx`

- [ ] **Step 1: Crear el badge inline**

Crear `base/components/PromoStatusBadge.tsx` (idiom `ActionBadge` de `EditorLogsTab` — inline suave, NO la `StatusBadge` solid):

```tsx
// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/PromoStatusBadge.tsx
"use client";

import type { ReactNode } from "react";

export type PromoStatusKind =
    | "candidate"
    | "started"
    | "pending"
    | "finished"
    | "standby";

const STYLES: Record<PromoStatusKind, string> = {
    candidate: "bg-blue-50 text-blue-700",
    started: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    finished: "bg-gray-100 text-gray-600",
    standby: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

const LABELS: Record<PromoStatusKind, string> = {
    candidate: "Puede optar",
    started: "Participa",
    pending: "Programada",
    finished: "Finalizada",
    standby: "⏸ stand-by",
};

/** Mapea el `status` crudo de ML al kind de UI. */
export function statusToKind(status: string): PromoStatusKind {
    if (status === "started") return "started";
    if (status === "pending" || status === "sync_requested") return "pending";
    if (status === "finished" || status === "restore_requested") return "finished";
    return "candidate";
}

export function PromoStatusBadge({
    kind,
    children,
}: {
    kind: PromoStatusKind;
    children?: ReactNode;
}) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STYLES[kind]}`}
        >
            {children ?? LABELS[kind]}
        </span>
    );
}
```

- [ ] **Step 2: Verificar tipos (NO commit)** — `tsc --noEmit` → `TSC_EXIT=0`.

---

## Task 5: Vista `ElegibilidadView`

**Files:**
- Create: `base/views/ElegibilidadView.tsx`

- [ ] **Step 1: Crear la vista**

Crear `base/views/ElegibilidadView.tsx`:

```tsx
// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/views/ElegibilidadView.tsx
//
// Explorador de elegibilidad de promociones (Ola 3·3c). Read-only.
// Buscas SKU/MLC/nombre → por publicación, a cuántas promos puede optar/participa,
// con detalle expandible + alertas de superposición.

"use client";

import { useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { DataTableExpandable, type Column } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { Alert } from "@/components/ui/alert/Alert";
import { CopyableText } from "@/components/ui/copyable-text/CopyableText";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useElegibilidad } from "../hooks/useElegibilidad";
import { PromoStatusBadge, statusToKind } from "../components/PromoStatusBadge";
import type { RawPromotionItem } from "../api/ofertas-api";
import type {
    OfferPublication,
    PublicationEligibility,
    EligibilityWarning,
} from "../types/elegibilidad-types";

/* ── helpers ───────────────────────────────────────────────── */

function tipoOf(p: OfferPublication): { label: string; cls: string } {
    if (p.isCatalogListing)
        return { label: "Catálogo", cls: "bg-white text-emerald-700 border-emerald-200" };
    if (p.variationId)
        return { label: "Variación", cls: "bg-white text-orange-700 border-orange-200" };
    return { label: "Clásica", cls: "bg-white text-indigo-700 border-indigo-200" };
}

const clp = (n: number | undefined | null): string =>
    n == null || !Number.isFinite(Number(n))
        ? "—"
        : new Intl.NumberFormat("es-CL", {
              style: "currency",
              currency: "CLP",
              maximumFractionDigits: 0,
          }).format(Number(n));

/** Rango creíble / sugerido de una promo (cuando ML lo entrega). */
function rango(p: RawPromotionItem): string {
    if (p.min_discounted_price != null && p.max_discounted_price != null) {
        const sug =
            p.suggested_discounted_price != null
                ? ` · sug. ${clp(p.suggested_discounted_price)}`
                : "";
        return `rango ${clp(p.min_discounted_price)}–${clp(p.max_discounted_price)}${sug}`;
    }
    if (p.price != null && p.price > 0) return clp(p.price);
    return "";
}

const WARNING_UI: Record<
    EligibilityWarning["kind"],
    { variant: "warning" | "info"; text: string }
> = {
    raise_price_drops: {
        variant: "warning",
        text: "Subir el precio del ítem lo saca automáticamente de las ofertas activas (DEAL/co-fondeadas/PRICE_DISCOUNT/SELLER_CAMPAIGN); en co-fondeadas no se puede re-agregar.",
    },
    price_discount_standby: {
        variant: "warning",
        text: "Hay un DEAL activo: un descuento individual (PRICE_DISCOUNT) queda en stand-by hasta que el DEAL termine.",
    },
    meli_all_auto: {
        variant: "info",
        text: "Esta publicación tiene PRICE_MATCHING_MELI_ALL (100% Mercado Libre, automático). Se gestiona desde el panel de ML.",
    },
};

/* ── detalle por publicación ───────────────────────────────── */

function DetallePublicacion({ row }: { row: PublicationEligibility }) {
    const promos: RawPromotionItem[] = [
        ...row.participa,
        ...row.puedeOptar,
        ...row.programada,
    ];
    const standby = row.warnings.some((w) => w.kind === "price_discount_standby");
    return (
        <div className="px-4 pt-2 pb-3">
            {promos.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">
                    Esta publicación no tiene promociones asociadas.
                </div>
            ) : (
                <div className="divide-y divide-dashed divide-gray-100">
                    {promos.map((p, i) => (
                        <div
                            key={`${p.id ?? p.type ?? "promo"}-${i}`}
                            className="flex items-center gap-2.5 py-2 text-[13px]"
                        >
                            <span className="font-semibold text-gray-800 min-w-[190px]">
                                {p.type ?? "—"}
                            </span>
                            <PromoStatusBadge kind={statusToKind(p.status)} />
                            {standby && p.type === "PRICE_DISCOUNT" && (
                                <PromoStatusBadge kind="standby" />
                            )}
                            <span className="ml-auto text-gray-600 text-xs tabular-nums">
                                {rango(p)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-3 space-y-2">
                {row.warnings.map((w) => {
                    const ui = WARNING_UI[w.kind];
                    return (
                        <Alert key={w.kind} variant={ui.variant}>
                            {ui.text}
                        </Alert>
                    );
                })}
            </div>
        </div>
    );
}

/* ── vista ─────────────────────────────────────────────────── */

export function ElegibilidadView() {
    const platform = useEcommercePlatform();
    const {
        query, setQuery, results, selectedSku, selectedTitulo,
        searching, loading, error, eligibility, search, selectProduct, reload,
    } = useElegibilidad();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const columns: Column<PublicationEligibility>[] = [
        {
            header: "Publicación",
            accessorKey: "publication",
            cell: (r) => {
                const t = tipoOf(r.publication);
                return (
                    <span className="inline-flex items-center gap-2">
                        {r.publication.isPrimary && (
                            <span title="Primaria" className="text-amber-500">★</span>
                        )}
                        <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${t.cls}`}
                        >
                            {t.label}
                        </span>
                        <CopyableText text={r.publication.itemId} className="text-sm text-gray-700">
                            <code className="tabular-nums">{r.publication.itemId}</code>
                        </CopyableText>
                    </span>
                );
            },
        },
        {
            header: "Estado",
            accessorKey: "publication",
            cell: (r) => (
                <StatusBadge status={r.publication.itemStatus ?? "inactive"} domain="ml" />
            ),
        },
        {
            header: "Puede optar",
            accessorKey: "puedeOptar",
            cell: (r) => (
                <span className="font-extrabold text-base text-blue-700 tabular-nums">
                    {r.puedeOptar.length}
                </span>
            ),
        },
        {
            header: "Participa",
            accessorKey: "participa",
            cell: (r) => (
                <span
                    className={`font-extrabold text-base tabular-nums ${
                        r.participa.length > 0 ? "text-emerald-700" : "text-gray-300"
                    }`}
                >
                    {r.participa.length}
                </span>
            ),
        },
        {
            header: "",
            accessorKey: "publication",
            cell: (r) => (
                <span className="text-gray-400">
                    {expandedId === r.publication.itemId ? "▼" : "▶"}
                </span>
            ),
        },
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Ofertas`}
                title="Elegibilidad de promociones"
                actions={
                    selectedSku ? (
                        <ActionButton variant="secondary" size="sm" onClick={reload} disabled={loading}>
                            <RefreshCw className="w-4 h-4" />
                            {loading ? "Cargando…" : "Refrescar"}
                        </ActionButton>
                    ) : undefined
                }
            />

            <div className="flex-1 bg-gray-100 px-6 pt-6 pb-10 space-y-4">
                {/* Buscador */}
                <form
                    onSubmit={(e) => { e.preventDefault(); void search(); }}
                    className="flex items-center gap-2"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar SKU, MLC o nombre…"
                            className="w-96 pl-9 pr-3 h-9 text-sm bg-white border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <ActionButton variant="primary" size="sm" type="submit" disabled={searching}>
                        {searching ? "Buscando…" : "Buscar"}
                    </ActionButton>
                </form>

                {error && (
                    <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                        <strong>Error:</strong> {error}{" "}
                        {selectedSku && (
                            <button onClick={() => void reload()} className="underline ml-1">Reintentar</button>
                        )}
                    </div>
                )}

                {/* Selector de producto (varios matches) */}
                {!selectedSku && results.length > 1 && (
                    <div className="bg-white rounded-xl border border-gray-200 divide-y">
                        {results.map((m) => (
                            <button
                                key={m.sku}
                                onClick={() => void selectProduct(m)}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <code className="text-sm text-blue-700 tabular-nums">{m.sku}</code>
                                <span className="text-sm text-gray-700 truncate">{m.titulo}</span>
                            </button>
                        ))}
                    </div>
                )}

                {!selectedSku && !searching && results.length === 0 && query.trim() !== "" && (
                    <div className="text-sm text-gray-500">Sin coincidencias para "{query.trim()}".</div>
                )}

                {/* Resultado del producto seleccionado */}
                {selectedSku && (
                    <>
                        <div className="text-sm text-gray-600">
                            <strong className="text-gray-900 tabular-nums">{selectedSku}</strong>
                            {selectedTitulo ? ` · ${selectedTitulo}` : ""} —{" "}
                            {eligibility.length} publicación{eligibility.length !== 1 ? "es" : ""}
                        </div>
                        {loading ? (
                            <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                                <RefreshCw className="w-5 h-5 inline animate-spin mr-2" />
                                Cargando elegibilidad…
                            </div>
                        ) : eligibility.length === 0 ? (
                            <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-sm text-gray-500">
                                Este SKU no tiene publicaciones en MercadoLibre.
                            </div>
                        ) : (
                            <DataTableExpandable
                                data={eligibility}
                                columns={columns}
                                expandedId={expandedId}
                                onToggle={(item) =>
                                    setExpandedId((cur) =>
                                        cur === item.publication.itemId ? null : item.publication.itemId,
                                    )
                                }
                                renderDetail={(item) => <DetallePublicacion row={item} />}
                                getRowId={(item) => item.publication.itemId}
                                showStatusBorder={false}
                                rowPaddingY={12}
                                rowBgClass="bg-white"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verificar tipos (NO commit)** — `tsc --noEmit` → `TSC_EXIT=0`. Si `StatusBadge`/`Alert`/`CopyableText`/`DataTableExpandable` resuelven desde otro path, alinear el import con `EditorPublicacionesTab.tsx`/`EditorLogsTab.tsx` (3b) — sin cambiar firmas.

---

## Task 6: Ruta + wiring (índices + link en la lista)

**Files:**
- Modify: `base/index.ts`
- Modify: `index.ts` (outer, el de `ofertas/`)
- Modify: `base/views/OfertasListView.tsx`
- Create: `app/catalogo/plataforma-ecommerce/mercadolibre/ofertas/elegibilidad/page.tsx`

- [ ] **Step 1: Exportar `ElegibilidadView` desde `base/index.ts`**

En `base/index.ts`, junto a los exports de views existentes (`OfertasListView`, `OfertasDetailView`, `NuevaOfertaWizardView`), agregar:
```ts
export { ElegibilidadView } from "./views/ElegibilidadView";
```

- [ ] **Step 2: Alias `MeliElegibilidadView` en el index externo**

En `index.ts` (el de `ofertas/`), dentro del bloque `export { ... } from "./base";`, agregar la línea:
```ts
    ElegibilidadView as MeliElegibilidadView,
```
(Queda junto a `OfertasListView as MeliOfertasListView, …`.)

- [ ] **Step 3: Crear la ruta**

Crear `app/catalogo/plataforma-ecommerce/mercadolibre/ofertas/elegibilidad/page.tsx`:
```tsx
// app/catalogo/plataforma-ecommerce/mercadolibre/ofertas/elegibilidad/page.tsx
import { MeliElegibilidadView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas";

export const dynamic = "force-dynamic";

export default function MeliElegibilidadPage() {
    return <MeliElegibilidadView />;
}
```

- [ ] **Step 4: Botón "Elegibilidad" en `OfertasListView`**

En `base/views/OfertasListView.tsx`:

(a) Agregar `Target` al import de `lucide-react` (junto a `Clock, Flag, Plus, RefreshCw, Sparkles`):
```ts
import { Clock, Flag, Plus, RefreshCw, Sparkles, Target } from "lucide-react";
```
(b) Agregar el callback de navegación (junto a `goToNueva`):
```ts
    const goToElegibilidad = useCallback(() => {
        router.push(`${platform.basePath}/ofertas/elegibilidad`);
    }, [platform.basePath, router]);
```
(c) En el `actions` del `EcommercePageHeader`, agregar un `ActionButton` ANTES del botón "Refrescar" (dentro del `<>...</>`):
```tsx
                        <ActionButton variant="secondary" size="sm" onClick={goToElegibilidad}>
                            <Target className="w-4 h-4" />
                            Elegibilidad
                        </ActionButton>
```

- [ ] **Step 5: Verificación final (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && node ./node_modules/typescript/bin/tsc --noEmit; echo "TSC_EXIT=$?"`
Expected: `TSC_EXIT=0` (sin errores nuevos en ninguno de los archivos tocados).

**Smoke visual (manual, con app + pim + meli-catalog corriendo):**
1. Ir a Ofertas ML → botón "Elegibilidad" → abre el explorador.
2. Buscar un SKU con varias publicaciones → tabla con "Puede optar / Participa" por publicación.
3. Expandir una fila → detalle de promos (estado, rango) + alertas (stand-by, subir precio).
4. Buscar por MLC y por nombre (LIKE) → resuelve igual; varios matches → lista para elegir.
5. SKU sin publicaciones → empty-state; publicación sin promos → "no tiene promociones asociadas".

**No `git commit`** — el usuario revisa y commitea.

---

## Verificación de éxito (todo el plan)
- `tsc --noEmit` → `TSC_EXIT=0` (sin errores nuevos en los archivos tocados).
- Cero escrituras a ML (todas las llamadas del flujo son GET). Cero backend nuevo.
- No se rompe el módulo de ofertas existente (cambios aditivos; `RawPromotionItem` solo gana campos opcionales; `ofertas-api` solo gana métodos; `OfertasListView` solo gana un botón).
- Español neutro, sin pills, componentes OMS reales. **Sin commits.**

## Notas
- `RawPromotionItem` gana `type?`/`name?`/`sub_type?` (opcionales) → no rompe a `listPromotionItems` (que no los usa por ítem). El JSON de `listItemPromotions` ya los trae.
- Se trabaja **un producto a la vez** (búsqueda barata → al seleccionar, carga publicaciones + promos con `Promise.allSettled`) → sin batch masivo, sin riesgo de cuota.
- `showStatusBorder={false}` en la tabla (el estado va en su columna con `StatusBadge`); evita registrar un dataType nuevo en `table-status-registry`.
- Deep-link `?sku=` desde el tab Publicaciones (3b) queda como mejora futura (no en 3c).
