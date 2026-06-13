# Ola 3 · 3c-bis — Wizard de ofertas por publicación · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el Paso 2 del wizard de crear oferta ML seleccione **por publicación** (un SKU se expande a sus N publicaciones clásica/catálogo/variación, con checkbox + % off + rango creíble por cada una), manteniendo intacto el camino de escritura existente (`createCampaign` + loop `optInItem` + `LaunchConfirmModal`).

**Architecture:** 100% front (`FrontOmsMimbral`). Cero backend nuevo: reusa `listPublicaciones`/`listItemPromotions`/`getItemRange` (Ola 3·3c) + `useCatalogoList` + `priceFromDiscount`. El modelo `SelectedSku[]` pasa de una entrada por SKU a una entrada **por publicación** (keyada por `item_id`); el contrato del componente con el padre (`selected`/`onChange`/`globalDiscount`) NO cambia, solo su granularidad. Las publicaciones + rangos se traen **lazy** solo de los SKUs con los que el usuario interactúa (expandir/marcar) → llamadas acotadas. Layout α = `DataTableExpandable` (fila de SKU expandible).

**Tech Stack:** Next.js 15 (App Router) + React 18 + MUI/Tailwind + TypeScript. Tipografía **Inter** heredada del `app/layout.tsx` (NO configurar fuente). **Sin jest** en el front → verificación con `tsc --noEmit`.

---

## Restricciones duras (recordatorio del usuario — aplican a TODA tarea)

- **NO se ejecutan POST/PUT/DELETE a ML reales.** Este plan NO toca el camino de escritura (`createCampaign`/`optInItem`); el `LaunchConfirmModal` sigue siendo el gate humano. **El POST/PUT real lo prueba el usuario.** Los subagentes solo escriben código + corren `tsc --noEmit`.
- **NO `git commit`** (el usuario maneja 100% de git). Cada "verificación" reemplaza al commit del template.
- **Español neutro (forma "tú"), NUNCA voseo** (usa: usa/tienes/recuerda/aquí/haz; nunca vos/acá/recordá/fijate/dale). Aplica al texto user-facing del front Y a los mensajes del agente.
- **Componentes OMS reales, SIN "pills"** (chip de tipo `rounded-md border`; rango inline). Reusar lo existente, no inventar patrones.
- **No romper el wizard existente** (Step 1, navegación, submit, confirm modal) ni el Explorador 3c.

## Adaptación de TDD (el front no tiene jest)

El template de writing-plans asume TDD con tests que fallan primero. **El front de `FrontOmsMimbral` no tiene runner de tests** (verificado: 3b y 3c se verificaron con `tsc --noEmit`). Las instrucciones del usuario + el spec mandan `tsc`-only, y eso tiene prioridad. Por lo tanto:

- Los **helpers puros** (`rangeFromPromotions`, `isPriceInRange`, `priceForPublication`) se escriben con una **tabla de casos esperados** documentada en el paso (el implementador razona la corrección contra ella). Si algún día entra jest, esos helpers son el target natural.
- La verificación de cada tarea es **`node ./node_modules/typescript/bin/tsc --noEmit`** desde la raíz del repo (`C:\Users\JoaquinRodriguez\Desktop\FrontOmsMimbral`), confirmando **cero errores nuevos** en los archivos tocados.
- No se scaffoldea jest ni se inventan tests.

---

## File structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `…/ofertas/base/helpers/wizard-publicaciones.ts` | **Create** | helpers puros: derivar rango (`rangeFromPromotions`), precio base (`priceForPublication`), chequeo de rango (`isPriceInRange`) |
| `…/ofertas/base/hooks/useSkuPublicaciones.ts` | **Create** | caché lazy por SKU `{ publications, ranges, loading, error }` + `ensureLoaded` (idempotente, deduplicado) |
| `…/ofertas/base/components/PublicationTypeChip.tsx` | **Create** | chip de tipo de publicación (Clásica/Catálogo/Variación + ★ primaria), idiom compartido |
| `…/ofertas/base/views/ElegibilidadView.tsx` | **Modify** (mínimo) | usar `PublicationTypeChip`/`tipoKindOf` en vez del `tipoOf` inline (DRY; sin cambiar comportamiento) |
| `…/ofertas/base/components/WizardStep2Skus.tsx` | **Modify** (reescritura del picker) | selección por publicación: SKU expandible (`DataTableExpandable`) → sub-filas con checkbox + % off + rango |
| `…/ofertas/base/components/WizardStep3Review.tsx` | **Modify** | tabla por publicación (`key=item_id`, chip de tipo, item_id) |
| `…/ofertas/base/views/NuevaOfertaWizardView.tsx` | **(sin cambios)** | enroll loop + confirm modal intactos |
| `…/ofertas/base/api/ofertas-api.ts` | **(sin cambios)** | `listPublicaciones`/`listItemPromotions`/`getItemRange` ya existen (3c) |

Raíz de paths: `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/`.

`SelectedSku` (exportado desde `WizardStep2Skus.tsx`) gana dos campos **opcionales/aditivos**: `item_id` (ya existe como opcional; el modelo lo trata como key) y `pubKind?: PublicationKind` (para el chip del Step3). Ambos no rompen a los consumidores existentes (`NuevaOfertaWizardView`, `WizardStep3Review`).

---

## Task 1: Helpers puros de rango/precio

**Files:**
- Create: `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/wizard-publicaciones.ts`

**Contexto:** el rango creíble (`min/max/sug` + `original_price`) de una publicación viene en las entradas que devuelve `listItemPromotions(itemId)` (cada `RawPromotionItem` repite los campos de rango a nivel ítem). **OJO:** `cacheItemRangeIfPresent` de `ofertas-api.ts` es module-private (NO exportado), así que NO se puede llamar desde afuera — derivamos el rango directo de los resultados. `getItemRange(itemId)` SÍ está exportado y sirve como fast-path de caché (puede estar poblado si el usuario visitó el listado de ofertas antes en la misma sesión SPA).

- [ ] **Step 1: Escribir los helpers puros**

```ts
// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/wizard-publicaciones.ts
//
// Helpers puros para el Paso 2 del wizard por publicación (Ola 3·3c-bis).
// Derivan el rango creíble (min/max/sug) de una publicación a partir de las
// promos que ML devuelve por ítem, y chequean si un precio cae dentro.

import type { MlItemRange } from "../types/oferta-types";
import type { RawPromotionItem } from "../api/ofertas-api";

/**
 * Deriva el rango creíble (item-level) de una publicación a partir de las
 * entradas de `listItemPromotions(itemId)`. ML repite los campos de rango
 * (original_price + min/max/sug discounted) en cada promo del ítem; tomamos
 * la primera entrada que los traiga completos. `null` si ninguna los tiene.
 */
export function rangeFromPromotions(
    results: ReadonlyArray<RawPromotionItem>,
): MlItemRange | null {
    for (const it of results) {
        if (
            typeof it.original_price === "number" &&
            it.original_price > 0 &&
            typeof it.min_discounted_price === "number" &&
            typeof it.max_discounted_price === "number"
        ) {
            return {
                original_price: it.original_price,
                min_discounted_price: it.min_discounted_price,
                max_discounted_price: it.max_discounted_price,
                suggested_discounted_price:
                    typeof it.suggested_discounted_price === "number"
                        ? it.suggested_discounted_price
                        : null,
            };
        }
    }
    return null;
}

/**
 * Precio base de la publicación para calcular el descuento: `original_price`
 * del rango si lo conocemos, si no el precio del SKU (fallback del catálogo).
 */
export function priceForPublication(
    range: MlItemRange | null,
    fallbackPrice: number,
): number {
    return range && range.original_price > 0 ? range.original_price : fallbackPrice;
}

/**
 * ¿El precio nuevo cae dentro del rango creíble [min, max]?
 * Sin rango → `true` (no marcamos en rojo lo que no podemos verificar; ML valida
 * al inscribir). Función pura, no bloquea el submit (solo alimenta el flag visual).
 */
export function isPriceInRange(
    newPrice: number,
    range: MlItemRange | null,
): boolean {
    if (!range) return true;
    return (
        newPrice >= range.min_discounted_price &&
        newPrice <= range.max_discounted_price
    );
}
```

- [ ] **Step 2: Verificar la corrección contra la tabla de casos**

Razonar (no hay jest) que los helpers cumplen:

| Función | Entrada | Salida esperada |
|---|---|---|
| `rangeFromPromotions` | `[]` | `null` |
| `rangeFromPromotions` | `[{id,status, original_price:0, min:..., max:...}]` (original_price 0) | `null` (salta esa entrada) |
| `rangeFromPromotions` | `[{… sin min/max}, {original_price:1000, min_discounted_price:700, max_discounted_price:900}]` | `{original_price:1000, min:700, max:900, suggested:null}` (toma la 2ª) |
| `rangeFromPromotions` | `[{original_price:1000, min:700, max:900, suggested_discounted_price:820}]` | `{…, suggested_discounted_price:820}` |
| `priceForPublication` | `(null, 1000)` | `1000` |
| `priceForPublication` | `({original_price:1200,…}, 1000)` | `1200` |
| `isPriceInRange` | `(800, null)` | `true` |
| `isPriceInRange` | `(800, {min:700,max:900,…})` | `true` |
| `isPriceInRange` | `(650, {min:700,max:900,…})` | `false` |
| `isPriceInRange` | `(950, {min:700,max:900,…})` | `false` |

- [ ] **Step 3: Verificar tipos (reemplaza commit)**

Run (desde `C:\Users\JoaquinRodriguez\Desktop\FrontOmsMimbral`): `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores nuevos referidos a `helpers/wizard-publicaciones.ts`.

---

## Task 2: Hook `useSkuPublicaciones` (caché lazy por SKU)

**Files:**
- Create: `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/hooks/useSkuPublicaciones.ts`

**Contexto:** este hook trae, **solo para los SKUs que el usuario expande o marca**, sus publicaciones (`listPublicaciones`) + el rango de cada publicación (`getItemRange` fast-path, si no `listItemPromotions` + `rangeFromPromotions`). Deduplica cargas concurrentes del mismo SKU (expandir + marcar pueden dispararse casi a la vez) con un `Map` de promesas en vuelo (ref). Idempotente: si ya está cargado (sin error), devuelve lo cacheado sin volver a pegar.

- [ ] **Step 1: Escribir el hook**

```ts
// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/hooks/useSkuPublicaciones.ts
//
// Caché lazy por SKU de sus publicaciones + rango creíble por publicación.
// Se llena al expandir o marcar un SKU en el Paso 2 del wizard (Ola 3·3c-bis).
// Acota llamadas: solo trae publicaciones/rangos de los SKUs con los que
// interactúas (no de todo el catálogo).

"use client";

import { useCallback, useRef, useState } from "react";
import { useOfertasApi, getItemRange } from "../api/ofertas-api";
import { rangeFromPromotions } from "../helpers/wizard-publicaciones";
import type { MlItemRange } from "../types/oferta-types";
import type { OfferPublication } from "../types/elegibilidad-types";

/** Datos cargados de un SKU (lo que `ensureLoaded` resuelve). */
export interface SkuPubData {
    publications: OfferPublication[];
    /** Rango creíble por itemId. `null` = sin rango (ML no lo expone). */
    ranges: Record<string, MlItemRange | null>;
}

export interface SkuPubState extends SkuPubData {
    loading: boolean;
    error: string | null;
}

export interface UseSkuPublicacionesReturn {
    /** Estado por SKU (undefined = nunca tocado). */
    bySku: Record<string, SkuPubState>;
    /** Carga (si hace falta) las publicaciones + rangos de un SKU. Idempotente y deduplicado. */
    ensureLoaded: (sku: string) => Promise<SkuPubData>;
}

const EMPTY: SkuPubData = { publications: [], ranges: {} };

export function useSkuPublicaciones(): UseSkuPublicacionesReturn {
    const api = useOfertasApi();
    const [bySku, setBySku] = useState<Record<string, SkuPubState>>({});
    // Promesas en vuelo por SKU para deduplicar expand + check concurrentes.
    const inFlight = useRef<Map<string, Promise<SkuPubData>>>(new Map());
    // Lectura del estado más reciente sin recrear el callback en cada render.
    const stateRef = useRef<Record<string, SkuPubState>>({});
    stateRef.current = bySku;

    const ensureLoaded = useCallback(
        (sku: string): Promise<SkuPubData> => {
            const cached = stateRef.current[sku];
            if (cached && !cached.loading && !cached.error) {
                return Promise.resolve({
                    publications: cached.publications,
                    ranges: cached.ranges,
                });
            }
            const existing = inFlight.current.get(sku);
            if (existing) return existing;

            const p = (async (): Promise<SkuPubData> => {
                setBySku((prev) => ({
                    ...prev,
                    [sku]: {
                        publications: prev[sku]?.publications ?? [],
                        ranges: prev[sku]?.ranges ?? {},
                        loading: true,
                        error: null,
                    },
                }));
                try {
                    const publications = await api.listPublicaciones(sku);
                    const ranges: Record<string, MlItemRange | null> = {};
                    await Promise.allSettled(
                        publications.map(async (pub) => {
                            const cachedRange = getItemRange(pub.itemId);
                            if (cachedRange) {
                                ranges[pub.itemId] = cachedRange;
                                return;
                            }
                            try {
                                const { results } = await api.listItemPromotions(pub.itemId);
                                ranges[pub.itemId] = rangeFromPromotions(results);
                            } catch {
                                ranges[pub.itemId] = null;
                            }
                        }),
                    );
                    setBySku((prev) => ({
                        ...prev,
                        [sku]: { publications, ranges, loading: false, error: null },
                    }));
                    return { publications, ranges };
                } catch (e) {
                    setBySku((prev) => ({
                        ...prev,
                        [sku]: {
                            publications: [],
                            ranges: {},
                            loading: false,
                            error:
                                e instanceof Error
                                    ? e.message
                                    : "No se pudieron cargar las publicaciones.",
                        },
                    }));
                    return EMPTY;
                } finally {
                    inFlight.current.delete(sku);
                }
            })();

            inFlight.current.set(sku, p);
            return p;
        },
        [api],
    );

    return { bySku, ensureLoaded };
}
```

- [ ] **Step 2: Verificar tipos**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores nuevos. Confirmar que `getItemRange` se importa de `../api/ofertas-api` (es export module-level, no parte del hook `useOfertasApi`).

---

## Task 3: `PublicationTypeChip` + reuso en `ElegibilidadView`

**Files:**
- Create: `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/PublicationTypeChip.tsx`
- Modify: `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/views/ElegibilidadView.tsx`

**Contexto:** 3c definió el idiom del chip de tipo inline (`tipoOf` + `<span rounded-md border …>`) dentro de `ElegibilidadView`. 3c-bis lo necesita también en el wizard. Para no duplicar, lo extraemos a un componente compartido y hacemos que la vista de 3c lo consuma (cambio mínimo, mismo render). **No es refactor no relacionado** — el chip es parte central del UI nuevo y la regla del proyecto es reusar componentes.

- [ ] **Step 1: Crear el componente del chip**

```tsx
// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/PublicationTypeChip.tsx
//
// Chip de tipo de publicación ML (Clásica / Catálogo / Variación), estilo OMS
// (rounded-md border, SIN "pills"). Idiom compartido por el Explorador (3c) y
// el wizard por publicación (3c-bis).

import type { OfferPublication } from "../types/elegibilidad-types";

export type PublicationKind = "clasica" | "catalogo" | "variacion";

/** Deriva el tipo de una publicación. Catálogo > Variación > Clásica. */
export function tipoKindOf(p: OfferPublication): PublicationKind {
    if (p.isCatalogListing) return "catalogo";
    if (p.variationId) return "variacion";
    return "clasica";
}

const KIND_UI: Record<PublicationKind, { label: string; cls: string }> = {
    catalogo: { label: "Catálogo", cls: "bg-white text-emerald-700 border-emerald-200" },
    variacion: { label: "Variación", cls: "bg-white text-orange-700 border-orange-200" },
    clasica: { label: "Clásica", cls: "bg-white text-indigo-700 border-indigo-200" },
};

export interface PublicationTypeChipProps {
    kind: PublicationKind;
    isPrimary?: boolean;
    className?: string;
}

export function PublicationTypeChip({ kind, isPrimary, className }: PublicationTypeChipProps) {
    const ui = KIND_UI[kind];
    return (
        <span
            className={["inline-flex items-center gap-1.5", className]
                .filter(Boolean)
                .join(" ")}
        >
            {isPrimary && (
                <span title="Primaria" className="text-amber-500">
                    ★
                </span>
            )}
            <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${ui.cls}`}
            >
                {ui.label}
            </span>
        </span>
    );
}
```

- [ ] **Step 2: Reemplazar el `tipoOf` inline en `ElegibilidadView` por el componente compartido**

En `views/ElegibilidadView.tsx`:

1. Agregar el import (junto a los demás imports de componentes):

```tsx
import { PublicationTypeChip, tipoKindOf } from "../components/PublicationTypeChip";
```

2. Borrar la función local `tipoOf` (el bloque completo):

```tsx
function tipoOf(p: OfferPublication): { label: string; cls: string } {
    if (p.isCatalogListing)
        return { label: "Catálogo", cls: "bg-white text-emerald-700 border-emerald-200" };
    if (p.variationId)
        return { label: "Variación", cls: "bg-white text-orange-700 border-orange-200" };
    return { label: "Clásica", cls: "bg-white text-indigo-700 border-indigo-200" };
}
```

3. En la columna "Publicación", reemplazar el bloque que usaba `tipoOf` + el `<span>` del chip por `<PublicationTypeChip …>`. El `cell` queda:

```tsx
            cell: (r) => {
                return (
                    <span className="inline-flex items-center gap-2">
                        <PublicationTypeChip
                            kind={tipoKindOf(r.publication)}
                            isPrimary={r.publication.isPrimary}
                        />
                        <CopyableText text={r.publication.itemId} className="text-sm text-gray-700">
                            <code className="tabular-nums">{r.publication.itemId}</code>
                        </CopyableText>
                    </span>
                );
            },
```

4. Si `OfferPublication` queda sin uso tras borrar `tipoOf`, dejar el import de tipos como está si todavía se referencia (`PublicationEligibility`, `EligibilityWarning` siguen usándose); quitar `OfferPublication` del import de tipos **solo si** `tsc` reporta que quedó sin uso (regla `noUnusedLocals` puede no estar activa — verificar con tsc, no asumir).

- [ ] **Step 3: Verificar tipos + que la vista 3c no cambió de comportamiento**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores nuevos. El render de la columna "Publicación" en el Explorador 3c queda visualmente idéntico (mismo ★ + chip + item_id copiable).

---

## Task 4: Reescribir `WizardStep2Skus` — selección por publicación

**Files:**
- Modify (reescritura completa): `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/WizardStep2Skus.tsx`

**Contexto:** es la pieza grande. La lista sigue por SKU (`useCatalogoList`), pero ahora cada SKU se expande (`DataTableExpandable`) a sus publicaciones; el checkbox del SKU es tristate (todas/algunas/ninguna) y carga lazy; cada publicación tiene su checkbox + % off + precio nuevo + rango (rojo si fuera de rango, **no bloqueante**). El modelo `selected` lleva una entrada **por publicación** keyada por `item_id`. `SelectedSku` gana `pubKind?` (aditivo). **`item_id` se trata como la key del modelo** (sigue opcional en el tipo, pero toda entrada creada acá lo trae).

**Decisión de alcance (spec §5.1):** se **quita "Agregar visibles"**. En el modelo por publicación implicaría cargar publicaciones + rangos de TODOS los SKUs visibles (hasta 50 → ráfaga de `listPublicaciones` + N×`listItemPromotions`), lo que rompe la acotación lazy y rara vez es la intención. Se conservan **"Limpiar"** y **"Solo seleccionados"**. (Sin caps silenciosos: queda documentado aquí.)

- [ ] **Step 1: Reescribir el archivo completo**

```tsx
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
    onChange: (next: ReadonlyArray<SelectedSku>) => void;
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

    // Toggle de UNA publicación (desde la sub-tabla expandida).
    const togglePublication = useCallback(
        (row: MarketplaceProduct, pub: OfferPublication) => {
            if (selectedByItem.has(pub.itemId)) {
                onChange(selected.filter((s) => s.item_id !== pub.itemId));
            } else {
                const ranges = bySku[row.sku]?.ranges ?? {};
                onChange([...selected, makeEntry(row, pub, ranges)]);
            }
        },
        [bySku, makeEntry, onChange, selected, selectedByItem],
    );

    // Toggle del SKU (tristate): si hay alguna seleccionada → quitar todas;
    // si no hay ninguna → cargar (lazy) y agregar todas. SKU de 1 publicación
    // = se comporta como antes.
    const toggleSku = useCallback(
        async (row: MarketplaceProduct) => {
            const { publications, ranges } = await ensureLoaded(row.sku);
            if (publications.length === 0) return;
            const itemIds = new Set(publications.map((p) => p.itemId));
            const someSelected = publications.some((p) => selectedByItem.has(p.itemId));
            if (someSelected) {
                onChange(selected.filter((s) => !s.item_id || !itemIds.has(s.item_id)));
            } else {
                const toAdd = publications
                    .filter((p) => !selectedByItem.has(p.itemId))
                    .map((p) => makeEntry(row, p, ranges));
                onChange([...selected, ...toAdd]);
            }
        },
        [ensureLoaded, makeEntry, onChange, selected, selectedByItem],
    );

    const setPublicationDiscount = useCallback(
        (itemId: string, discount: number) => {
            onChange(
                selected.map((s) => (s.item_id === itemId ? { ...s, discount } : s)),
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
                            ? "Aún no seleccionaste ninguna publicación"
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
```

- [ ] **Step 2: Verificar tipos**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores nuevos. Puntos a confirmar:
- `Column<MarketplaceProduct>` acepta `accessorKey: "sku"`/`"precio"` (claves reales de `MarketplaceProduct`).
- `DataTableExpandable` recibe `expandedId: string | null`, `getRowId: (row) => row.sku`, sin `statusKey` (default no aplica porque `showStatusBorder={false}`; el Explorador 3c lo llama igual sin `statusKey`).
- `SelectedSku` sigue exportado (lo importan `WizardStep3Review` y `NuevaOfertaWizardView`).

- [ ] **Step 3: Confirmar que el contrato con el padre no cambió**

Verificar (lectura, sin editar) `views/NuevaOfertaWizardView.tsx`: sigue pasando `selected={skus}`, `onChange={setSkus}`, `globalDiscount={info.global_discount}` y su `handleSubmit` usa `s.item_id ?? s.sku`, `s.price`, `s.discount`, `s.stock_committed`. No requiere cambios. `canStep2 = skus.length > 0` ahora cuenta publicaciones — correcto.

---

## Task 5: `WizardStep3Review` por publicación

**Files:**
- Modify: `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/WizardStep3Review.tsx`

**Contexto:** la tabla "SKUs a inscribir" pasa a listar **publicaciones** (`key={s.item_id ?? s.sku}`, chip de tipo + item_id). Las stats (total, desc. prom., stock, cobertura) ya funcionan sobre `skus` y ahora cuentan publicaciones — no cambian de fórmula.

- [ ] **Step 1: Agregar el import del chip**

Junto a los imports existentes:

```tsx
import { PublicationTypeChip } from "./PublicationTypeChip";
```

(Mantener el import existente de `TypeChip` — ese es el chip del tipo de **campaña** `info.type`, distinto del de publicación.)

- [ ] **Step 2: Cambiar el encabezado del bloque de tabla**

Reemplazar el título:

```tsx
                        <h3 className="text-sm font-semibold text-gray-800">
                            SKUs a inscribir ({skus.length})
                        </h3>
```

por:

```tsx
                        <h3 className="text-sm font-semibold text-gray-800">
                            Publicaciones a inscribir ({skus.length})
                        </h3>
```

- [ ] **Step 3: Reescribir el `<thead>` y el `<tbody>` por publicación**

Reemplazar el `<thead>`:

```tsx
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className={HEADER}>SKU</th>
                                    <th className={HEADER}>Producto</th>
                                    <th className={HEADER + " text-right w-24"}>
                                        Precio
                                    </th>
                                    <th className={HEADER + " text-right w-20"}>
                                        Desc.
                                    </th>
                                    <th className={HEADER + " text-right w-28"}>
                                        Nuevo precio
                                    </th>
                                </tr>
                            </thead>
```

por:

```tsx
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className={HEADER}>Publicación</th>
                                    <th className={HEADER}>Producto</th>
                                    <th className={HEADER + " text-right w-24"}>
                                        Precio
                                    </th>
                                    <th className={HEADER + " text-right w-20"}>
                                        Desc.
                                    </th>
                                    <th className={HEADER + " text-right w-28"}>
                                        Nuevo precio
                                    </th>
                                </tr>
                            </thead>
```

Reemplazar el `<tbody>` completo:

```tsx
                            <tbody>
                                {skus.map((s) => {
                                    const d = s.discount ?? info.global_discount;
                                    const newPrice = Math.round(s.price * (1 - d / 100));
                                    return (
                                        <tr
                                            key={s.sku}
                                            className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        >
                                            <td className="py-2 px-3 font-medium text-gray-900 tabular-nums">
                                                {s.sku}
                                            </td>
                                            <td
                                                className="py-2 px-3 text-gray-700 truncate max-w-[320px]"
                                                title={s.name}
                                            >
                                                {s.name}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                ${s.price.toLocaleString("es-CL")}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                {d}%
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums font-semibold text-blue-700">
                                                ${newPrice.toLocaleString("es-CL")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
```

por:

```tsx
                            <tbody>
                                {skus.map((s) => {
                                    const d = s.discount ?? info.global_discount;
                                    const newPrice = Math.round(s.price * (1 - d / 100));
                                    return (
                                        <tr
                                            key={s.item_id ?? s.sku}
                                            className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        >
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <PublicationTypeChip
                                                        kind={s.pubKind ?? "clasica"}
                                                    />
                                                    <code className="text-xs text-gray-700 tabular-nums">
                                                        {s.item_id ?? s.sku}
                                                    </code>
                                                </div>
                                                <div className="text-[11px] text-gray-400 tabular-nums">
                                                    SKU {s.sku}
                                                </div>
                                            </td>
                                            <td
                                                className="py-2 px-3 text-gray-700 truncate max-w-[320px]"
                                                title={s.name}
                                            >
                                                {s.name}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                ${s.price.toLocaleString("es-CL")}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                {d}%
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums font-semibold text-blue-700">
                                                ${newPrice.toLocaleString("es-CL")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
```

También actualizar el texto del estado vacío para que sea coherente:

```tsx
                    <div className="py-8 text-center text-sm text-rose-600">
                        ⚠ No hay SKUs seleccionados. Vuelve al Step 2 antes de
                        confirmar.
                    </div>
```

por:

```tsx
                    <div className="py-8 text-center text-sm text-rose-600">
                        ⚠ No hay publicaciones seleccionadas. Vuelve al paso de SKUs
                        antes de confirmar.
                    </div>
```

- [ ] **Step 4: Verificar tipos**

Run: `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores nuevos. `s.pubKind` es opcional → el fallback `?? "clasica"` cubre entradas legacy sin tipo. La etiqueta "SKUs" del card de Resumen (stat `stats.total`) puede quedar como está (cuenta publicaciones); opcionalmente relabelar a "Publicaciones" si se considera más claro — **no** es obligatorio.

---

## Task 6: Verificación final + self-review

**Files:** (ninguno — verificación)

- [ ] **Step 1: `tsc --noEmit` global**

Run (desde `C:\Users\JoaquinRodriguez\Desktop\FrontOmsMimbral`): `node ./node_modules/typescript/bin/tsc --noEmit`
Expected: sin errores nuevos en ninguno de los archivos tocados (helpers, hook, chip, ElegibilidadView, WizardStep2Skus, WizardStep3Review).

- [ ] **Step 2: Confirmar que NO se tocó el camino de escritura**

Verificar (lectura) que `views/NuevaOfertaWizardView.tsx` y `api/ofertas-api.ts` **no fueron modificados**. El `LaunchConfirmModal`, el `createCampaign`, el loop `optInItem` y el `removeItemFromPromotion` quedan idénticos. (Grep rápido para confirmar que no hay nuevas llamadas a `optInItem`/`createCampaign`/`modifyItem`/`removeItemFromPromotion` fuera de las preexistentes.)

- [ ] **Step 3: Self-review checklist**

- [ ] Español neutro en todo el texto user-facing nuevo (sin voseo: revisar "Cargando…", "Reintentar", "sin inscribir", "fuera de rango", "Publicaciones a inscribir", "Vuelve…").
- [ ] Sin "pills" — el chip de tipo usa `rounded-md border` (no `rounded-full`); el rango es inline.
- [ ] Componentes OMS reales (`DataTableExpandable`, `CopyableText`, `ActionButton`) — nada inventado.
- [ ] Llamadas acotadas: publicaciones/rangos solo se cargan lazy al expandir/marcar (no hay fetch masivo; "Agregar visibles" removido).
- [ ] El flag de fuera-de-rango es visual y **no** bloquea el submit.
- [ ] `SelectedSku` solo ganó campos opcionales (`pubKind`); `item_id` sigue opcional en el tipo pero es la key del modelo.

- [ ] **Step 4: Smoke visual (manual, con app + pim + meli-catalog levantados)**

Guion (NO confirmar el POST en el `LaunchConfirmModal` salvo que se quiera tocar ML real — eso lo decide/ejecuta el usuario):
1. Ir al wizard de nueva oferta → Paso 2.
2. Buscar un SKU con varias publicaciones → expandir (▶/▼) → ver clásica/catálogo/variación con su rango.
3. Marcar publicaciones individuales; ajustar % off → ver "→ precio nuevo" y el rango (rojo si cae fuera).
4. Marcar el checkbox del SKU (tristate): selecciona todas; al volver a clic, las quita; indeterminate cuando hay selección parcial.
5. SKU de 1 publicación: marcar el SKU lo inscribe sin necesidad de expandir.
6. "Solo seleccionados" filtra a SKUs con ≥1 publicación elegida; "Limpiar" vacía.
7. Paso 3 lista las publicaciones (chip de tipo + item_id + SKU); el contador del header y del confirm modal cuentan publicaciones.
8. SKU sin publicaciones / publicación sin rango → mensajes "no tiene publicaciones" / "sin rango" sin romper la tabla.

- [ ] **Step 5: SIN commit.** Reportar el diff al usuario para que él maneje git y haga el testing real del POST/PUT.

---

## Self-Review del plan (autor)

**Cobertura del spec:**
- A+ (rango por publicación, sin panel de alertas) → Task 4 (sub-tabla con rango + flag) ✓; alertas de superposición NO se agregan ✓.
- α (SKU expandible, `DataTableExpandable`) → Task 4 ✓.
- Write path intacto → Tasks 4/6 explícitamente no tocan `NuevaOfertaWizardView`/`ofertas-api` ✓.
- Modelo `SelectedSku[]` keyado por `item_id`, contrato con el padre igual → Task 4 ✓.
- Rango no bloqueante (rojo si fuera) → Task 1 (`isPriceInRange`) + Task 4 (flag) ✓.
- Reuso de `listPublicaciones`/`listItemPromotions`/`getItemRange` → Tasks 1/2 ✓ (con la corrección: `cacheItemRangeIfPresent` es privado → derivamos con `rangeFromPromotions`).
- Helpers puros + hook lazy → Tasks 1/2 ✓.
- Step3 por publicación → Task 5 ✓.

**Consistencia de tipos/firmas:** `SelectedSku` (con `pubKind?`) se exporta desde `WizardStep2Skus` y se consume igual en Step3/View; `ensureLoaded` resuelve `SkuPubData` (publications + ranges) y `toggleSku`/`makeEntry` lo usan; `PublicationKind`/`tipoKindOf`/`PublicationTypeChip` definidos en Task 3 y usados en Tasks 4/5 y en la vista 3c. `MlItemRange`/`RawPromotionItem`/`OfferPublication`/`MarketplaceProduct`/`Column` importados de sus paths verificados.

**Placeholders:** ninguno — todo el código está completo.

**Decisión documentada (sin cap silencioso):** se quita "Agregar visibles" (incompatible con la carga lazy por publicación).

---

## Execution Handoff

Plan completo y guardado en `docs/superpowers/plans/2026-05-31-ola3-3cbis-wizard-por-publicacion.md`. Agrupación sugerida para subagent-driven-development (fresh subagent + review por unidad, **sin commits**):

- **Unit A — Fundaciones:** Task 1 (helpers) + Task 2 (hook) + Task 3 (chip + swap en ElegibilidadView).
- **Unit B — Picker:** Task 4 (reescritura de `WizardStep2Skus`, la pieza grande — sola).
- **Unit C — Review + cierre:** Task 5 (`WizardStep3Review`) + Task 6 (tsc final + self-review + smoke).

Dos opciones de ejecución:
1. **Subagent-Driven (recomendado)** — un subagente fresco por unidad + review de dos etapas (spec compliance → code quality). El controller aplica fixes menores de review directo (sin commits).
2. **Inline (executing-plans)** — ejecución por lotes con checkpoints.
