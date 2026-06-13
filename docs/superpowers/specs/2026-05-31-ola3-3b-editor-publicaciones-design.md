# Ola 3 · 3b — Tab "Publicaciones" en el Editor ML · Design

**Fecha:** 2026-05-31
**Estado:** Aprobado (brainstorming) — pendiente de plan de implementación.
**Repos:** `FrontOmsMimbral` (grueso) + `meli-catalog-service`'s pim proxy en `Microservicios/pim-service` (1 cambio chico). NO toca `meli-catalog-service` (3a ya está hecho).

---

## 1. Contexto

El cimiento 1:N (Ola 1) estableció `ml_sku_items` como fuente de verdad: **un SKU puede tener N publicaciones en MercadoLibre** (una clásica/original, posibles de catálogo, y variaciones). En **3a** se expuso ese contrato en meli-catalog:

```
GET /api/pim/canales/mercadolibre/productos/:sku/publicaciones
→ { ok, channel:'mercadolibre', sku, publications:[ { itemId, isPrimary, isCatalogListing,
     catalogProductId, variationId, inventoryId, userProductId, itemStatus, logisticType,
     publishStatus, performance:{score,level}|null } ] }
```

(Spec de 3a: `meli-catalog-service/docs/superpowers/specs/2026-05-30-ola3-3a-contrato-n-publicaciones-design.md`.)

**El gap que cierra 3b:** el **Editor de producto** del front (`features/catalogo/pages/plataforma-ecommerce/shared/editor/`) hoy muestra **un solo** `item_id` (el primario, en el tab Info → "ID marketplace"). Es ciego a las demás publicaciones del SKU. 3b las hace visibles.

### Topología (verificada en código)

```
FrontOms (editor-api, fetch + token)
   └─► pim-service  /api/pim/canales/mercadolibre/productos/:sku/publicaciones   ← FALTA (3b lo agrega)
          └─► meli-catalog  /api/pim/canales/mercadolibre/productos/:sku/publicaciones  ← 3a (hecho)
```

El front **no** llama a meli-catalog directo; pim-service proxea la familia `/canales/...`. Por eso 3b necesita el proxy en pim (sección 3).

---

## 2. Alcance y decisiones

Decidido en brainstorming (con visual companion):

- **Alcance = Opción 1 (lean):** lista de solo lectura + link a ML. La fila **clásica/primaria** tiene "Editar →" que salta al tab **Info** (el editor de hoy). Las de **catálogo / variación / FULL** son solo lectura (ML las bloquea: su ficha sale del catálogo / el stock FULL lo gobierna ML). **Cero escrituras nuevas a ML.**
- **Layout = B:** un **tab nuevo "Publicaciones"** en el editor, con una **lista** (`DataTable`) — calcado del patrón master-list de Ofertas y del tab `EditorLogsTab`. (Se descartó "pills" y el switcher que re-apunta todo el editor.)
- **Solo `mercadolibre`.** Falabella/VTEX no tienen este concepto → el tab no se incluye para esos canales.

### Non-goals (futuros, NO en 3b)
- **Opción 2 (fast-follow):** abrir el detalle in-app de una publicación no-clásica (modal solo lectura vía `/detalle?item_id=…`). Viable (meli-catalog ya resuelve por `MLC…` en `_resolveRawItem`) pero fuera de 3b.
- **Edición por item_id** (precio/stock de catálogo/FULL): implicaría escrituras a ML → prohibido por regla del proyecto.
- **Permalink real de ML** en el contrato 3a (ver §7, se usa link best-effort).

### Restricciones duras
- **NO** POST/PUT/DELETE a ML (la feature es read + link-out). El usuario hace todo el testing real.
- **NO commits** (el usuario maneja git). Los pasos "commit" del plan se reemplazan por verificación.
- **Español neutro** (forma "tú") en toda la UI.
- **Reutilizar componentes existentes** del FrontOms (nada inventado; no "pills").

---

## 3. Backend — pim-service (único cambio de backend)

Proxy del endpoint 3a. Espejo de cómo pim ya proxea `/calidad` y `/publicacion`. Tres piezas:

### 3.1 Cliente — `Microservicios/pim-service/src/modules/integrations/meli-catalog/index.js`
Agregar (junto a `getPublishStatus`), usando la constante existente `const ML = '/api/pim/canales/mercadolibre';`:

```js
// Las N publicaciones del SKU (junction ml_sku_items, vía 3a). unwrap=false: el
// endpoint devuelve el envelope entero { ok, channel, sku, publications:[...] }.
async function getPublications(sku) {
  return requestJson('GET', `${ML}/productos/${encodeURIComponent(sku)}/publicaciones`, undefined, { unwrap: false });
}
```
Y exportarla en `module.exports`.

### 3.2 Facade — `Microservicios/pim-service/src/routes/channel-facade.controller.js`
El facade hoy NO importa la integración meli-catalog. Agregar el require y el handler (consistente con `getQuality`/`getPublishStatus`, que son GET reads en el facade):

```js
const { meliCatalog } = require('../modules/integrations');   // arriba

const getPublications = asyncHandler(async (req, res) => {
  const channel = req.params.channel?.toLowerCase();
  if (channel !== 'mercadolibre') {
    return res.status(400).json({ ok: false, code: 'NOT_SUPPORTED',
      message: 'Listar publicaciones solo está disponible para mercadolibre' });
  }
  const { sku } = req.params;
  const result = await meliCatalog.getPublications(sku);   // { ok, channel, sku, publications }
  res.json(result);   // passthrough del envelope de meli-catalog (ya viene normalizado)
});
```
Agregar `getPublications` a `module.exports`.

### 3.3 Ruta — `Microservicios/pim-service/src/routes/channel-products.routes.js`
Junto a las otras GET de productos:
```js
router.get('/:channel/productos/:sku/publicaciones', asyncHandler(channelCtl.getPublications));
```

### 3.4 Tests (pim)
- Test del controller `getPublications` (mock de `../modules/integrations` → `meliCatalog.getPublications`): (a) canal `mercadolibre` → passthrough del envelope; (b) canal `falabella` → 400 `NOT_SUPPORTED` sin llamar al client. Seguir el estilo y el runner de los tests existentes de pim (el plan confirma carpeta/exacto runner; si pim no tuviera jest, basta `node --check` + boot-smoke).
- `node --check` de los 3 archivos + boot-smoke del router (`require('./src/routes/channel-products.routes')`).

---

## 4. Front — capa de datos

### 4.1 Tipo — `…/shared/editor/base/types/editor-types.ts`
Agregar (camelCase, idéntico al contrato 3a):
```ts
export interface EditorPublicacion {
  itemId: string;
  isPrimary: boolean;
  isCatalogListing: boolean;
  catalogProductId: string | null;
  variationId: string | null;
  inventoryId: string | null;
  userProductId: string | null;
  itemStatus: string | null;     // active | paused | closed | under_review | ...
  logisticType: string | null;   // fulfillment | self_service | cross_docking | ...
  publishStatus: string | null;
  performance: { score: number; level: string | null } | null;
}
```

### 4.2 API — `…/shared/editor/base/api/editor-api.ts`
El endpoint vive bajo `/api/pim/canales/...`, distinto del `API_BASE` actual (`/api/pim/productos`). Definir:
```ts
const CANALES_ML = `${URL_PIM_SERVICE}/api/pim/canales/mercadolibre/productos`;
```
y agregar al hook `useEditorApi` una fn (mismo patrón fetch + `pickToken` que `fetchProduct`):
```ts
fetchPublicaciones: async (sku: string): Promise<EditorPublicacion[]> => {
  const url = `${CANALES_ML}/${encodeURIComponent(sku)}/publicaciones`;
  const t = pickToken(token);
  const r = await fetch(url, { method:'GET', cache:'no-store',
    headers: { 'Content-Type':'application/json', ...(t ? { Authorization:`Bearer ${t}` } : {}) } });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) { const err = new Error(json?.message || `HTTP ${r.status}`) as EditorApiError; err.status = r.status; err.code = json?.code; throw err; }
  return Array.isArray(json?.publications) ? json.publications as EditorPublicacion[] : [];
},
```
Declararla también en la interface `EditorApi`.

### 4.3 Hook — `…/shared/editor/base/hooks/usePublicaciones.ts` (nuevo)
Un solo fetch, consumible por `EditorView` (para el badge) y el tab (presentational, sin re-fetch):
```ts
export function usePublicaciones(sku: string, opts: { enabled: boolean }) {
  // returns { publications: EditorPublicacion[], loading, error: string|null, reload }
  // - fetch sólo si opts.enabled (marketplaceKey === 'ml') && sku
  // - usa api.fetchPublicaciones; loading/error como useEditorState.reload
}
```

### 4.4 Registry de estados ML — `…/shared/editor/base/ml-publication-status.ts` (nuevo)
El `status-registry` global solo trae Activo/Inactivo. Registrar (merge idempotente) un dominio `ml` para los estados de item ML, importado por el tab:
```ts
import { registerStatusMap } from "@/components/ui/badge/status-registry";
registerStatusMap("ml", {
  active:        { variant: "active",   label: "Activo" },
  paused:        { variant: "inactive", label: "Pausado" },
  closed:        { variant: "error",    label: "Cerrado" },
  under_review:  { variant: "review",   label: "En revisión" },
  inactive:      { variant: "inactive", label: "Inactivo" },
});
```
(Si ya existiera un dominio `ml`, este `registerStatusMap` mergea sin romper.)

---

## 5. Front — UI

### 5.1 `EditorPublicacionesTab.tsx` (nuevo, gemelo de `EditorLogsTab`)
`…/shared/editor/base/tabs/EditorPublicacionesTab.tsx`. Presentational: recibe los datos del hook desde `EditorView`.

**Props:**
```ts
interface EditorPublicacionesTabProps {
  publications: EditorPublicacion[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Salta al tab Info (editar la publicación primaria, que es la que carga el editor). */
  onEditarPrimaria: () => void;
}
```

**Render:** `DataTable` (de `@/components/ui/table`) con columnas:
| Columna | Contenido |
|---|---|
| **Tipo** | chip inline (idiom de `ActionBadge` en `EditorLogsTab`): `isCatalogListing` → "Catálogo"; si no y `variationId` → "Variación"; si no → "Clásica". Si `isPrimary`, anteponer ★. |
| **Publicación** | `item_id` con `CopyableText` (`@/components/ui/copyable-text`). |
| **Estado** | `<StatusBadge status={itemStatus ?? 'inactive'} domain="ml" />`. |
| **Logística** | `fulfillment` → "FULL"; otro → el valor o "—". |
| **Performance** | `performance.score` (title = `level`) o "—". |
| **Acción** | si `isPrimary` → botón "Editar →" `onClick={onEditarPrimaria}` (el editor ya carga la primaria); si no → link "Ver en ML ↗" (target _blank). |

Arriba, un `Alert variant="info"`: *"Las publicaciones de catálogo y las variaciones son de solo lectura — su ficha se gestiona en MercadoLibre. La publicación clásica se edita en la pestaña Información."*

Estados (calcados de `EditorLogsTab`): `loading` → spinner; `error` → caja rosa + "Reintentar" (`reload`); vacío → "Este SKU no tiene publicaciones en MercadoLibre."

**Link "Ver en ML"** (best-effort, ver §7):
```ts
const mlUrl = (itemId: string) => `https://articulo.mercadolibre.cl/MLC-${itemId.replace(/^MLC/i, "")}`;
```

### 5.2 Wire — `…/shared/editor/base/views/EditorView.tsx`
- Importar `Layers` de `lucide-react`, el tab y el hook.
- `const mlKey = resolveMarketplaceKey(platform.name);`
- `const { publications, loading: pubsLoading, error: pubsError, reload: pubsReload } = usePublicaciones(sku, { enabled: mlKey === 'ml' });`
- Construir `TABS` condicional: si `mlKey === 'ml'`, insertar `{ id:"publicaciones", label:"Publicaciones", icon: Layers, badgeCount: publications.length }` **después de "calidad" y antes de "logs"**. (`badgeCount` arranca en 0 mientras carga y se actualiza al resolver el fetch.)
- Branch de contenido:
```tsx
{tab === "publicaciones" && (
  <EditorPublicacionesTab
    publications={publications} loading={pubsLoading} error={pubsError}
    reload={pubsReload} onEditarPrimaria={() => setTab("info")} />
)}
```
- `EditorTabId` (en editor-types) agrega `"publicaciones"`.

---

## 6. Manejo de errores
- **pim:** `requestJson` propaga `statusCode`/`code` desde meli-catalog → handler global de pim. Canal≠mercadolibre → 400 `NOT_SUPPORTED` (en el facade, sin pegarle al client).
- **front:** `fetchPublicaciones` lanza con `.status`; el hook captura → `error` → caja "Reintentar" (idéntico a `EditorLogsTab`). SKU sin filas → `publications:[]` → empty-state. Canal≠ml → el tab no existe.

---

## 7. Detalle conocido — link "Ver en ML"
El contrato 3a **no** devuelve la URL pública, solo `item_id`. 3b construye el link best-effort client-side: `https://articulo.mercadolibre.cl/MLC-<dígitos>` (ML redirige al permalink real). **Simplificación aceptada.** Si más adelante se quiere el permalink exacto, se agrega `permalink` al SELECT de `getMlSkuItems` en meli-catalog (cambio chico en 3a) y al tipo — fuera de 3b.

---

## 8. Testing / verificación
- **pim-service:** jest del controller `getPublications` (passthrough + guard 400) + `node --check` (3 archivos) + boot-smoke del router. **Sin commit.**
- **FrontOms:** no hay jest en el front → `npx tsc --noEmit` (type-check) de los archivos tocados + smoke visual con el server arriba (abrir el editor de un SKU con varias publicaciones, ver el tab, la lista, badges, link, "Editar →"; abrir un SKU sin publicaciones → empty; canal Falabella → tab ausente). **Sin commit.**

---

## 9. File structure

| Repo | Archivo | Acción | Responsabilidad |
|---|---|---|---|
| pim-service | `src/modules/integrations/meli-catalog/index.js` | Modify | `getPublications(sku)` client |
| pim-service | `src/routes/channel-facade.controller.js` | Modify | handler `getPublications` + require integración |
| pim-service | `src/routes/channel-products.routes.js` | Modify | ruta `/:channel/productos/:sku/publicaciones` |
| pim-service | `src/tests/...channel...test.js` | Create | test del controller (mock client) |
| FrontOms | `…/editor/base/types/editor-types.ts` | Modify | tipo `EditorPublicacion` + `EditorTabId += "publicaciones"` |
| FrontOms | `…/editor/base/api/editor-api.ts` | Modify | `fetchPublicaciones(sku)` + `CANALES_ML` |
| FrontOms | `…/editor/base/hooks/usePublicaciones.ts` | Create | hook de datos (1 fetch, enabled) |
| FrontOms | `…/editor/base/ml-publication-status.ts` | Create | `registerStatusMap("ml", …)` |
| FrontOms | `…/editor/base/tabs/EditorPublicacionesTab.tsx` | Create | tab lista (DataTable) |
| FrontOms | `…/editor/base/views/EditorView.tsx` | Modify | wire tab + hook + badgeCount |

Componentes reutilizados (verificados): `Tabs`/`TabItem` (`badgeCount`), `DataTable`+`Column`, `Pagination` (si la lista crece), `StatusBadge`+`registerStatusMap`, `Alert`, `CopyableText`, idiom `ActionBadge` para el chip de tipo. Nada nuevo, sin pills.

---

## 10. Orden de implementación sugerido
1. pim-service: client + facade + ruta + test + node --check (desbloquea el front).
2. front: tipo + `fetchPublicaciones` + `usePublicaciones` + `ml-publication-status`.
3. front: `EditorPublicacionesTab`.
4. front: wire en `EditorView` (+ `EditorTabId`).
5. `tsc --noEmit` + smoke visual.
