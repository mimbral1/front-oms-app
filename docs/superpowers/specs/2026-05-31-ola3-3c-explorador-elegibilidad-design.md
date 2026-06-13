# Ola 3 · 3c — Explorador de elegibilidad de promociones (por SKU) · Design

**Fecha:** 2026-05-31
**Estado:** Aprobado (brainstorming) — pendiente de plan de implementación.
**Repo:** `FrontOmsMimbral` (100% front). NO toca backend (reusa endpoints existentes). NO toca meli-catalog ni pim (salvo que el proxy de 3b ya esté desplegado).

---

## 1. Contexto y pedido

El equipo de e-commerce pidió: **"una búsqueda por SKU que diga a cuántas promociones puede optar ese producto"**, contemplando además las **superposiciones de ofertas**. Con el cimiento 1:N, un SKU tiene N publicaciones ML (clásica/catálogo/variación), y las promociones de ML son **por `item_id`** (por publicación). Por eso el explorador trabaja por publicación.

3c es una vista de **SOLO LECTURA**. No crea ni modifica ofertas (eso implica writes a ML; queda para 3c-bis, ver §2).

### Reglas de dominio ML (verificadas contra `Mimbral-docs/promociones/`)
- **Elegibilidad por ítem:** `GET /seller-promotions/items/:item_id` devuelve **todas** las promos del ítem, cada una con `status`:
  - `candidate` = elegible, **puede optar** · `started` = participa · `pending` = programada · `finished` = terminó.
  - Trae por promo: `type`, `original_price`, `price`, `min_discounted_price`, `max_discounted_price`, `suggested_discounted_price`, y según tipo `meli_percentage`/`seller_percentage`, `stock` (DOD/LIGHTNING).
  - "¿A cuántas puede optar?" = contar `candidate`. (fuente: `promciones_ml.md` "Consultar promociones del ítem".)
- **Superposiciones:** un ítem **puede estar en varias promos a la vez** (carriles independientes). La **única regla de precedencia documentada** es **DEAL > PRICE_DISCOUNT**: el descuento individual queda **en stand-by** mientras haya un DEAL activo (`Descuento individual.md`). **NO inventar** otras precedencias/exclusiones — el resto se muestra como coexistencia factual.
- **Alerta operativa clave (Mimbral sincroniza precios desde SAP/MV):** subir el precio del ítem lo **saca automáticamente** de MARKETPLACE_CAMPAIGN / VOLUME / PRICE_DISCOUNT / SELLER_CAMPAIGN (en co-fondeadas no se puede re-agregar) (`camapañas-coofondeadas.md`, `Descuento individual.md`).
- **PRICE_MATCHING_MELI_ALL** nunca tiene `candidate` (ML lo activa solo) → es informativo, no "optable".
- **DOD/LIGHTNING** exigen stock (LIGHTNING mandatorio).

---

## 2. Alcance y non-goals

### Alcance (3c)
- Vista nueva en el módulo de ofertas ML: **buscador (SKU / MLC item_id / nombre LIKE)** → resultado por **publicación** con: a cuántas promos **puede optar**, en cuáles **participa**, **programadas**, y al expandir el detalle de cada promo (estado, rango de precio creíble) + **alertas de superposición**.
- Layout aprobado: **Opción A — tabla con filas expandibles** (`DataTableExpandable`).
- **Read-only. Cero escrituras a ML.** Todas las llamadas son GET.

### Non-goals (futuros)
- **3c-bis (Opción A del wizard):** elegir qué publicaciones inscribir al crear una oferta (writes a ML). Diferido.
- Acciones desde el explorador (optar/quitar oferta) — son writes; fuera de 3c.
- Carga masiva de elegibilidad de N SKUs a la vez (ver §4: se trabaja **un producto por vez** para no disparar N×M llamadas).

### Restricciones duras
- **NO** POST/PUT/DELETE a ML (todo GET). El usuario hace el testing real contra endpoints reales; yo verifico con `tsc` + smoke.
- **NO `git commit`** (el usuario maneja git).
- **Español neutro** (forma "tú"), nunca voseo.
- **Tipografía: Inter** (`next/font/google`), aplicada global en `app/layout.tsx` (`<body className={inter.className}>`) → la vista la **hereda**, no se configura nada.
- **Reutilizar componentes del OMS** (Janis-derived); **sin "pills" inventadas**.

---

## 3. Arquitectura y flujo de datos

```
[Buscador SKU/MLC/nombre]
   └─► catálogo: GET /api/pim/productos?search=<q>&marketplace=ml   (ya filtra sku/ml_item_id/titulo)
          └─► producto(s) que matchean
                 └─► (al seleccionar UN producto)
                       ├─► GET /api/pim/canales/mercadolibre/productos/:sku/publicaciones   (3b)  → N item_id
                       └─► por cada item_id: GET …/seller-promotions/items/:item_id  (listItemPromotions)
                              └─► normalizar → por publicación { puedeOptar[], participa[], programada[] } + flags
```

**Acotación de llamadas (importante):** la búsqueda por nombre puede traer muchos productos. Para no disparar N×M llamadas, el explorador resuelve **un producto a la vez**: la búsqueda lista los productos que matchean (barato, una sola llamada de catálogo); al **seleccionar** uno (o si hay match exacto por SKU/MLC, auto-seleccionar), recién ahí se cargan sus publicaciones + la elegibilidad de cada una (un puñado de GETs). Las filas (publicaciones) ya traen sus promos cargadas → expandir es instantáneo.

**Backend:** NINGÚN cambio nuevo. Reusa: búsqueda de catálogo (`/api/pim/productos?search=`), `/publicaciones` (proxy de 3b en pim), `…/seller-promotions/items/:item_id` (ya cableado como `listItemPromotions`).

---

## 4. Front — piezas

Todo bajo `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/` salvo la ruta y el registro de status.

### 4.1 API (`api/ofertas-api.ts`)
- **Reusa** `listItemPromotions(itemId)` (ya existe: `GET …/seller-promotions/items/:item_id` → `{ results: RawPromotionItem[] }`).
- **Agregar** `listPublicaciones(sku)` → `GET ${BASE}/canales/mercadolibre/productos/:sku/publicaciones` (el endpoint de 3b) → mapea `json.publications` a un tipo local `OfferPublication { itemId, isPrimary, isCatalogListing, variationId, itemStatus, logisticType, ... }`. Mismo patrón `request(...)` del archivo.
- **Reusa** `listSellerCatalog({ search })` (o `useCatalogoList`) para la búsqueda SKU/MLC/nombre.

### 4.2 Tipos (`types/oferta-types.ts` o nuevo `types/elegibilidad-types.ts`)
- `RawPromotionItem` (ya existe en el módulo) — confirmar que cubre: `id?`, `type`, `status`, `original_price`, `price`, `min_discounted_price`, `max_discounted_price`, `suggested_discounted_price`, `meli_percentage?`, `seller_percentage?`, `stock?`, `sub_type?`. Extender si falta algún campo usado.
- `PublicationEligibility` (nuevo):
  ```ts
  interface PublicationEligibility {
    publication: OfferPublication;     // itemId, tipo, estado, precio…
    puedeOptar: RawPromotionItem[];    // status === 'candidate'
    participa: RawPromotionItem[];     // status === 'started'
    programada: RawPromotionItem[];    // status === 'pending'
    warnings: EligibilityWarning[];    // ver helper
  }
  type EligibilityWarning =
    | { kind: 'price_discount_standby' }            // hay DEAL activo + PRICE_DISCOUNT candidate/started
    | { kind: 'raise_price_drops' }                 // hay alguna promo started que se cae al subir precio
    | { kind: 'meli_all_auto' };                    // PRICE_MATCHING_MELI_ALL presente (informativo)
  ```

### 4.3 Helper de normalización + warnings (`helpers/elegibilidad.ts`, nuevo)
- `toEligibility(publication, promotions: RawPromotionItem[]): PublicationEligibility`:
  - Agrupa por `status` en `puedeOptar`/`participa`/`programada`.
  - **Warnings (solo reglas documentadas):**
    - `price_discount_standby`: si hay un `DEAL` con status `started`/`pending` **y** un `PRICE_DISCOUNT` `candidate`/`started`.
    - `raise_price_drops`: si hay ≥1 promo `started` de tipo MARKETPLACE_CAMPAIGN/VOLUME/PRICE_DISCOUNT/SELLER_CAMPAIGN.
    - `meli_all_auto`: si hay `PRICE_MATCHING_MELI_ALL`.
  - **No** inventar precedencias fuera de éstas.
- Funciones puras → testeables (aunque el front no tenga jest, quedan aisladas y type-checkeadas).

### 4.4 Hook (`hooks/useElegibilidad.ts`, nuevo)
- `useElegibilidad()` → `{ query, setQuery, results, selected, selectProduct, eligibility, loading, error, reload }`.
  - `results`: productos que matchean la búsqueda (catálogo).
  - `selectProduct(sku)`: carga `listPublicaciones(sku)` + por cada publicación `listItemPromotions(itemId)` (en paralelo, `Promise.allSettled`) → `eligibility: PublicationEligibility[]`.
  - Estados `loading`/`error` como los hooks existentes del módulo (`useOfertaItems`/`useOfertasList`).

### 4.5 Registro de estados (badge + tabla)
- **Estado de publicación** (columna "Estado") → `StatusBadge domain="ml"` (el dominio `ml` ya se registró en 3b; si no estuviera, registrarlo).
- **Estado por promo** (candidate/started/pending/finished en el detalle) → componente local `PromoStatusBadge` siguiendo el **idiom `ActionBadge` de `EditorLogsTab`** (badge inline suave `rounded-full px-2.5 py-0.5 text-[11px]`): candidate→azul, started→verde, pending→ámbar, finished→gris, + variante `stand-by`. (Es un idiom existente del repo para celdas densas; no es la `StatusBadge` solid para no recargar el detalle.)
- **Borde de estado de fila** (`DataTableExpandable` usa `table-status-registry` vía `resolveTableColor(status, dataType)`): registrar un `dataType` (p. ej. `"elegibilidad"`) en `components/ui/table/table-status-registry` mapeando el `itemStatus` de la publicación a color, **o** pasar `showStatusBorder={false}`. (Decisión menor; el plan elige.)

### 4.6 UI
- **Ruta:** `app/catalogo/plataforma-ecommerce/mercadolibre/ofertas/elegibilidad/page.tsx` → monta `ElegibilidadView`. Acceso: un link/botón **"Elegibilidad"** (o "Buscar promociones") en el toolbar de `OfertasListView` (y/o el sub-sidebar de e-commerce).
- **`views/ElegibilidadView.tsx`** (nuevo):
  - `EcommercePageHeader` (eyebrow "MercadoLibre · Ofertas", título "Elegibilidad de promociones").
  - Buscador: input estilo wizard (`type="search"`, clases OMS) — placeholder "Buscar SKU, MLC o nombre…". Debounced; resuelve vía catálogo. Si hay varios matches, lista compacta para elegir; match exacto SKU/MLC → auto-selecciona.
  - Resultado del producto seleccionado: banda `SKU · nombre` + **`DataTableExpandable`**.
- **Tabla (`DataTableExpandable`)** — `Column<PublicationEligibility>[]`:
  | Columna | Contenido |
  |---|---|
  | Publicación | chip tipo OMS (Clásica/Catálogo/Variación, ★ si `isPrimary`) + `item_id` (`CopyableText`) |
  | Estado | `StatusBadge domain="ml"` |
  | Precio | `original_price` formateado CLP |
  | Puede optar | conteo `puedeOptar.length` (número azul) |
  | Participa | conteo `participa.length` (número verde) |
  - `renderDetail(item)` → lista de promos (`[...participa, ...puedeOptar, ...programada]`): por fila `PromoStatusBadge` + `type` + rango `min–max` / `suggested` (+ `stock` o co-fondeo según tipo) + tag `⏸ stand-by` cuando aplique; abajo, un **`Alert variant="warning"`** por cada warning (raise_price_drops, price_discount_standby) y `Alert variant="info"` para `meli_all_auto`.
- **Estados:** loading (spinner OMS), error (caja + "Reintentar"→reload), vacío ("Sin coincidencias" / "Esta publicación no tiene promociones asociadas").

---

## 5. Componentes reutilizados (verificados)
`EcommercePageHeader`, input search del wizard, **`DataTableExpandable`** (`components/ui/table`, props `data/columns/expandedId/onToggle/renderDetail/statusKey/dataType/getRowId`), `Column<T>`, `StatusBadge` + `status-registry` (dominio `ml`), `CopyableText`, `Alert`, idiom chip tipo `rounded-md` (3b) y idiom badge inline `ActionBadge` (`EditorLogsTab`). Tipografía Inter heredada del layout.

---

## 6. Manejo de errores / cuota
- Cada `listItemPromotions` puede fallar individualmente → `Promise.allSettled`; una publicación que falla muestra su fila con "no se pudo cargar elegibilidad" + retry, sin tumbar el resto.
- Trabajar **un producto por vez** acota las llamadas (1 producto × N publicaciones); no hay batch masivo → sin riesgo de cuota.
- `423_ENTITY_LOCKED` / errores ML → el cliente ya normaliza; mostrar mensaje y permitir reintento.

---

## 7. Testing / verificación
- **Front sin jest** → `npx tsc --noEmit` (sin errores nuevos en los archivos tocados) + **smoke visual** con la app + pim + meli-catalog corriendo: buscar un SKU con varias publicaciones → ver conteos "Puede optar/Participa" → expandir → detalle de promos + alertas; buscar por MLC y por nombre (LIKE); SKU sin promos → empty-state.
- El helper `toEligibility` es función pura: si más adelante se agrega jest al front, es lo primero a cubrir (incl. los 3 warnings).
- **Sin commits.**

---

## 8. File structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `app/catalogo/plataforma-ecommerce/mercadolibre/ofertas/elegibilidad/page.tsx` | Create | ruta → monta `ElegibilidadView` |
| `…/ofertas/base/views/ElegibilidadView.tsx` | Create | header + buscador + tabla |
| `…/ofertas/base/hooks/useElegibilidad.ts` | Create | búsqueda → producto → publicaciones → promos |
| `…/ofertas/base/helpers/elegibilidad.ts` | Create | `toEligibility` (buckets + warnings) |
| `…/ofertas/base/components/PromoStatusBadge.tsx` | Create | badge inline por estado de promo (idiom ActionBadge) |
| `…/ofertas/base/types/elegibilidad-types.ts` | Create | `PublicationEligibility`, `OfferPublication`, `EligibilityWarning` (+ reusar `RawPromotionItem`) |
| `…/ofertas/base/api/ofertas-api.ts` | Modify | `+ listPublicaciones(sku)` (reusa `listItemPromotions`) |
| `…/ofertas/base/views/OfertasListView.tsx` | Modify | link/botón "Elegibilidad" en el toolbar |
| `…/ofertas/base/index.ts` | Modify | export de `ElegibilidadView` |
| `components/ui/table/table-status-registry.*` | Modify (opcional) | `dataType "elegibilidad"` para borde de fila (o `showStatusBorder=false`) |

---

## 9. Orden de implementación sugerido
1. Tipos + `listPublicaciones` en `ofertas-api.ts` + helper `toEligibility` (funciones puras, type-check).
2. `useElegibilidad` (búsqueda → selección → carga).
3. `PromoStatusBadge` + (opcional) dataType de tabla.
4. `ElegibilidadView` (header + buscador + `DataTableExpandable` + `renderDetail`).
5. Ruta `elegibilidad/page.tsx` + link en `OfertasListView` + export en `index.ts`.
6. `tsc --noEmit` + smoke visual.

---

## 10. Notas
- "Buscar SKU, MLC o nombre" ya está soportado por `/api/pim/productos?search=` (filtra sku/ml_item_id/titulo) — el wizard ya lo usa. Sin backend nuevo.
- El explorador es la base de lectura sobre la que después se monta 3c-bis (elegir publicaciones para inscribir, con writes).
