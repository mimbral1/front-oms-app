# Plan de migración — OMS Mimbral 360 + Plataforma_Marketplace

> Documento ejecutable para los próximos 4–6 sprints. Asume el contexto técnico del repo (FrontOmsMimbral, pim-service, mockups Janis) y el puente auth ya integrado (`useFetchWithAuthPim`, `URL_PIM_SERVICE`, `decodeUser`).

---

## Sección 0 — Estado actual (snapshot 2026-05-18)

> Este bloque resume **qué se cerró, qué se descartó y qué queda** respecto al plan original abajo. Las secciones 1-6 quedan como referencia histórica de la decisión inicial; este bloque es la **fuente de verdad operativa** del status hoy.

### Decisiones que cambiaron

| Decisión original | Estado actual |
|---|---|
| Átomos Janis aislados en `_shared/janis/` (sección 3.2) | **REVERTIDA**. Se decidió OMS look pleno → nuevos átomos `_shared/ui/` (EcommercePageHeader, FieldRow, SectionDivider, StepIndicator, MetricCard, Sparkline, EmptyTab, RemovableChip). `_shared/janis/` queda **deprecated**, se elimina a medida que se refactoriza cada feature. Carga-masiva todavía importa de ahí. |
| Editor: estrategia HÍBRIDO INVERTIDO con iframe (decisión 3.1 opción **e**) | **DESCARTADA**. Se reescribieron las 6 tabs nativas en React. Sin iframe a `editar.html?embed=1`. Ver Fase 7 actualizada abajo. |
| Sub-route `?embed=1` en pim-service (riesgo #8 + Fase 7 sub-task) | **YA NO HACE FALTA** — al descartar el iframe, este pre-req queda muerto. |
| Sub-sidebar marketplace (no mencionado en el plan) | **AGREGADO**. `EcommerceSubSidebar` 220px fijo + switcher PNG logos + 3 grupos (canal/operación/integración). |
| Catálogo + Productos como rutas separadas (sección 3.5) | **UNIFICADAS**. `CatalogoView` reemplaza a `MarketplaceProductosBrowse`. Mismo dataset, chrome OMS pleno, edit-icon lápiz inline para entrar al Editor. |

### Estado por fase

| Fase | Estado | Notas |
|---|---|---|
| 0 — Bridge auth | ✅ cerrado | Smoke test verde |
| 1 — Átomos Janis | ✅ cerrado (en **deprecación** post-A3) | Reemplazados por OMS look pleno |
| 1.5 — A3 OMS look pleno (NO planeado) | ✅ cerrado | 8 átomos en `_shared/ui/`, paleta blue-700 |
| 1.6 — Sub-sidebar marketplace (NO planeado) | ✅ cerrado | Fixed 220px + switcher PNG |
| 1.7 — Catálogo unificación (NO planeado) | ✅ cerrado | `MarketplaceProductosBrowse.tsx` eliminado |
| 2 — Carga masiva | ✅ funcional · 🟡 refactor OMS pendiente | Bug snake/camel + polling fixed 2026-05-15. Typecheck limpio. Sigue importando `_shared/janis/`. |
| 3 — Atributos (POC) | 🟡 parcial | TAB 1 SUMMARY listo. TAB 2/3/4/5 (PLATFORMS, COMMENTS, LOGS, etc.) pendientes |
| 4 — Mapeo categorías | ⏳ no iniciado | TIER 4. Re-cableo con `/mapeos/vista?marketplace=mp` |
| 5 — Ofertas | ✅ core cerrado · 🟡 modales pendientes | List view + Detail view con **5 tabs funcionales** (Resumen/Items con `useOfertaItems`/Cofinanciación con agregado meli+seller% por items/Calendario/Plataformas). Comentarios + Logs siguen EmptyTab (backend gap real). `CampaignDetailModal` + `MLEnrollModal` lazy fetch pendientes. |
| 6 — Publicar wizard | ✅ Tier 1 cerrado | 4 steps + helpers + modal + payload builders |
| 7 — Editor producto | 🟡 4/5 fases | **Estrategia híbrida invertida DESCARTADA**. 6 tabs nativos React: Info (✅) / Imágenes (✅) / Descripción (✅) / Atributos (✅) / Calidad (✅) / Logs (pendiente — backend `audit_log` existe pero sin `logAudit()` en handlers del editor). APIs reales: `GET /detalle`, `GET /calidad`, `PUT /:sku` con Idempotency-Key, `POST /ml/imagenes`. Optimistic locking 409 manejado con banner. |
| 8 — Falabella replicar | ⏳ no iniciado | Shared estable, listo para clonar con `Fala*` aliases |
| 9 — VTEX + cleanup | ⏳ no iniciado | Apagar HTMLs del monolito, redirect 410 Gone |

### Backend gaps documentados (no son work del front)

| Gap | Repo | Necesidad |
|---|---|---|
| Editor tab Logs | `Microservicios/meli-catalog-service` | Agregar `logAudit()` en handlers del editor (`items.service.js`, etc.) que escriba a `MELICATALOG_DB.audit_log` |
| Ofertas tab Logs | `Microservicios/meli-catalog-service/src/modules/promotions/` | Agregar `logAudit()` en opt-in / modify / remove de seller-promotions |
| Ofertas tab Comentarios | `Microservicios/meli-catalog-service` | Tabla + endpoint nuevos (`/seller-promotions/:id/comments`). No hay reuse posible |
| Carga masiva — descargar errores / template Excel | `Microservicios/pim-service` | Endpoints `/api/pim/imports/:batchId/errors-export` y `/api/pim/imports/template` no existen aún |

### Consolidación de paths post-2026-05

Los µservicios **de aplicación** (`pim-service`, `meli-catalog-service`, `fcom-catalog-service`, `meli-pricing-service`) ya no son repos sueltos en `Desktop/` — están consolidados bajo `Desktop/Microservicios/<service>/`. Las referencias `../<service>/` viejas en este doc y en el código son obsoletas — usar `../Microservicios/<service>/` desde FrontOmsMimbral.

**Repos que NO se consolidaron** (siguen sueltos en `Desktop/`):
- `Desktop/docker-stack-mimbral/` — orquestador docker compose (dev + prod)
- `Desktop/mimbral-docs/` — docs cross-cutting

Layout final desde el punto de vista de FrontOmsMimbral:

```
Desktop/
├── FrontOmsMimbral/         ← este repo
├── Microservicios/
│   ├── pim-service/
│   ├── meli-catalog-service/
│   ├── fcom-catalog-service/
│   └── meli-pricing-service/
├── docker-stack-mimbral/    ← suelto, NO bajo Microservicios
└── mimbral-docs/            ← suelto, NO bajo Microservicios
```

---

## Sección 1 — Inventario de features

Convenciones de path usadas en las tablas:
- `OMS-APP` = `C:\Users\Camilo Gutierrez\Desktop\FrontOmsMimbral\app\catalogo\plataforma-ecommerce\<mkt>\<feature>`
- `OMS-FEAT` = `C:\Users\Camilo Gutierrez\Desktop\FrontOmsMimbral\features\catalogo\pages\plataforma-ecommerce\<mkt>\<feature>`
- `PIM-SRC` = `C:\Users\Camilo Gutierrez\Desktop\pim-service\Plataforma_Marketplace\src\features\<feature>`
- `JANIS` = `C:\Users\Camilo Gutierrez\Desktop\FrontOmsMimbral\Mimbral Mercadolibre\`

`<mkt>` ∈ { `mercadolibre`, `falabella`, `vtex` }. La columna "ML/Fala/VTEX" indica para qué marketplaces aplica la feature en V1 (la feature termina viviendo bajo `shared/` cuando aplica a varios).

### 1.1 Dashboard

| Campo | Valor |
|---|---|
| Origen mockup | `JANIS/dashboard.html` (259 LOC) |
| Origen lógica existente | `PIM-SRC/dashboard/DashboardApp.tsx` |
| Destino ruta | `OMS-APP/<mkt>/dashboard/page.tsx` |
| Destino vista | `OMS-FEAT/shared/dashboard/base/views/DashboardView.tsx` |
| Chrome Janis (TopBar/Tabs) | Sin tabs (single view). TopBar completa con eyebrow "Mimbral · Marketplace", badge "En vivo", botones "Últimas 24h" / "Nueva publicación" |
| Content Janis | Completo: KPIs, Spark, secciones |
| Backend | `/api/pim/dashboard/*` (a confirmar; revisar `pim-service` para nombre exacto) |
| ML/Fala/VTEX | Sí en los 3 (data parametrizada por canal) |
| Esfuerzo | **2–3 d-p** |

### 1.2 Carga masiva

| Campo | Valor |
|---|---|
| Origen mockup | `JANIS/carga_masiva.html` (254 LOC, 0 placeholders) |
| Origen lógica existente | `PIM-SRC/cargaMasiva/BatchRowEditor.tsx` |
| Destino ruta | `OMS-APP/<mkt>/carga-masiva/page.tsx` |
| Destino vista | `OMS-FEAT/shared/carga-masiva/base/views/CargaMasivaView.tsx` |
| Chrome Janis | Completo: TopBar (badge dinámico Procesando/Listo) + DropZone + tabla resultados |
| Content Janis | Completo (incluye `DropZone`, `ROWS` con sus 3 estados ok/warn/err) |
| Backend | `POST /api/pim/canales/<mkt>/carga-masiva/upload` + `GET .../jobs/:id` (confirmar) |
| ML/Fala/VTEX | Sí en los 3 (validador por canal) |
| Esfuerzo | **2 d-p** |

### 1.3 Categorías (mapeo)

| Campo | Valor |
|---|---|
| Origen mockup | `JANIS/categorias.html` (263 LOC, 1 placeholder) |
| Origen lógica existente | `PIM-SRC/categorias/categorias.ts` (helpers) + scaffold ya existente en `OMS-FEAT/<mkt>/mapeo-categorias/` |
| Destino ruta | `OMS-APP/<mkt>/mapeo-categorias/page.tsx` (ya existe — sólo reemplazar contenido) |
| Destino vista | `OMS-FEAT/shared/mapeo-categorias/base/views/MapeoCategoriasView.tsx` |
| Chrome Janis | Completo: TopBar con "Refrescar árbol ML" + "Nuevo mapeo" |
| Content Janis | Tree N1→N2→N3 funcional; 1 placeholder en panel derecho |
| Backend | `/api/pim/canales/<mkt>/categorias/*` (cascade) |
| ML/Fala/VTEX | Sí (taxonomía por marketplace) |
| Esfuerzo | **3–4 d-p** (reemplaza scaffold actual) |

### 1.4 Catálogo (vista listado de SKUs publicados)

| Campo | Valor |
|---|---|
| Origen mockup | `JANIS/catalogo.html` (226 LOC, 1 placeholder) |
| Origen lógica existente | `PIM-SRC/catalogo/catalogo.ts` + ya integrado parcialmente en `OMS-FEAT/shared/productos/base/views/MarketplaceProductosBrowse.tsx` (~600 LOC, productivo) |
| Destino ruta | `OMS-APP/<mkt>/catalogo/page.tsx` (nuevo) |
| Destino vista | `OMS-FEAT/shared/catalogo/base/views/CatalogoView.tsx` |
| Chrome Janis | Completo: TopBar con Exportar / Importar Excel / Nuevo SKU + Toolbar con filtros |
| Content Janis | Tabla con filtros; 1 placeholder lateral |
| Backend | `/api/pim/productos?canal=<mkt>` (ya consumido por `MarketplaceProductosBrowse`) |
| ML/Fala/VTEX | Sí (la query ya soporta `canal`) |
| Esfuerzo | **3 d-p** (gran parte de la lógica ya vive en `MarketplaceProductosBrowse`, hay que rediseñarla al chrome Janis y crear ruta nueva) |
| Nota | Existe potencial doble entrada: ya está `OMS-APP/<mkt>/productos/` apuntando a `MarketplaceProductosBrowse`. Ver decisión #5 — recomendado renombrar la actual a `catalogo` y dejar `productos` como alias o eliminarla |

### 1.5 Atributos

| Campo | Valor |
|---|---|
| Origen mockup | `JANIS/atributos.html` (250 LOC, 1 placeholder — sólo `SUMMARY` implementado; `PLATFORMS`, `COMMENTS`, `LOGS` pendientes) |
| Origen lógica existente | `PIM-SRC/atributos/atributos.ts` + scaffold en `OMS-FEAT/<mkt>/mapeo-atributos/` |
| Destino ruta | `OMS-APP/<mkt>/atributos/page.tsx` (nuevo) y `OMS-APP/<mkt>/atributos/[id]/page.tsx` |
| Destino vista | `OMS-FEAT/shared/atributos/base/views/{AtributosListView,AtributosDetailView}.tsx` |
| Chrome Janis | Completo: TopBar con "Aplicar/Guardar/Guardar & Crear nuevo/Cancelar" + Tabs `SUMMARY · PLATFORMS · COMMENTS · LOGS` |
| Content Janis | `SUMMARY` ok; `PLATFORMS · COMMENTS · LOGS` por implementar |
| Backend | `/api/pim/atributos/*` |
| ML/Fala/VTEX | Sí en los 3 |
| Esfuerzo | **4–5 d-p** (incluye implementar las 3 tabs faltantes — son las que se usan como **prueba de concepto** del patrón) |

### 1.6 Ofertas / Campañas

| Campo | Valor |
|---|---|
| Origen mockup | `JANIS/campanas-ml.html` (490 LOC, **6 placeholders** — sólo `SUMMARY` listo) |
| Origen JSX intermedio | `JANIS/Ofertas/{app,data,list,wizard}.jsx` (1.791 LOC) |
| Origen lógica existente | `PIM-SRC/ofertas/OfertasApp.tsx` + `list/` (2.220 LOC) + `wizard/` (852 LOC) + `api.ts` (906 LOC), `helpers/`, `data/` con loader real |
| Destino ruta | `OMS-APP/mercadolibre/ofertas/page.tsx` (lista) + `.../ofertas/[id]/page.tsx` (detalle) + `.../ofertas/nueva/page.tsx` (wizard) |
| Destino vista | `OMS-FEAT/mercadolibre/ofertas/base/{views,wizard,list}` (no `shared/` — exclusiva ML) |
| Chrome Janis | TopBar + Tabs `RESUMEN · ÍTEMS · COFINANCIACIÓN · CALENDARIO · PLATAFORMAS · COMENTARIOS · LOGS` — sólo RESUMEN listo |
| Content Janis | Hay que rediseñar las 6 tabs faltantes; lógica del wizard ya está sólida en `PIM-SRC` |
| Backend | `/api/pim/canales/mercadolibre/seller-promotions/*` |
| ML/Fala/VTEX | Solo ML en V1 (Falabella expone una API distinta, planificar V2) |
| Esfuerzo | **10–12 d-p** (la más compleja después de editor) |

### 1.7 Publicar (wizard)

| Campo | Valor |
|---|---|
| Origen mockup | `JANIS/publicar.html` (302 LOC, **9 placeholders** — sólo Step 1 listo) |
| Origen JSX intermedio | `JANIS/Publicar/components/{app,data,pickers,review,steps,ui}.jsx` (2.342 LOC, ojo: usa `style={{}}` inline, **no** está rediseñado al chrome Janis aún) |
| Origen lógica existente | `PIM-SRC/publicar/PublicarApp.tsx` + `components/` (2.150 LOC), `api.ts`, `payloadBuilders.ts`, `coverage.ts`, `preview.ts`, `mlDescription.ts` |
| Destino ruta | `OMS-APP/<mkt>/publicar/page.tsx` |
| Destino vista | `OMS-FEAT/shared/publicar/base/{views,steps,components}` |
| Chrome Janis | TopBar + Steps `1·SKU/Categoría · 2·Obligatorios · 3·Recomendados · 4·Revisar` |
| Content Janis | Step1 listo; **Step2/3/4** + componentes (`AttrInput`, `CategoryPickerModal`, `ImageUploader`, `PayloadDrawer`, `ProductPreview`, `PublishConfirmModal`, `CalculadoraMargenWidget`) por portar/rediseñar |
| Backend | `/api/pim/canales/<mkt>/publicar/*` + `/api/pim/productos/:sku` (SAP lookup) |
| ML/Fala/VTEX | ML + Falabella en V1; VTEX V2 (no tiene wizard equivalente en PIM aún) |
| Esfuerzo | **10–12 d-p** |

### 1.8 Editor de producto (ml_producto_editor)

| Campo | Valor |
|---|---|
| Origen mockup | `JANIS/ml_producto_editor.html` (299 LOC, **8 placeholders** — sólo `RESUMEN` listo) |
| Origen lógica existente | `pim-service/Plataforma_Marketplace/public/editar.html` (HTML inline + JS vanilla, ~3k–4.5k LOC, monolítico) |
| Destino ruta | `OMS-APP/<mkt>/editor/[sku]/page.tsx` |
| Destino vista | `OMS-FEAT/shared/editor/base/{views,tabs}` |
| Chrome Janis | TopBar + Tabs `RESUMEN · IMAGEN · PRECIOS · STOCK · PLATAFORMAS · ATRIBUTOS · RELACIONADO · COMENTARIOS · LOGS` |
| Content Janis | RESUMEN listo; 8 tabs por implementar |
| Backend | `/api/pim/productos/:sku/*` (multi-endpoint) |
| ML/Fala/VTEX | Sí en los 3 (datos comunes + secciones específicas por canal) |
| Esfuerzo | Ver decisión #1. Reescritura completa: **15–20 d-p**. Iframe-bridge: **1 d-p**. Híbrido recomendado: **8–10 d-p** |

---

## Sección 2 — Patrón de migración estandarizado

### 2.1 Estructura de archivos por feature (ejemplo Atributos, aplica análogo al resto)

```
FrontOmsMimbral/
├─ app/catalogo/plataforma-ecommerce/
│  └─ mercadolibre/
│     └─ atributos/
│        ├─ page.tsx                 # server component: <AtributosListView/>
│        └─ [id]/page.tsx            # server component: <AtributosDetailView/>
│
├─ features/catalogo/pages/plataforma-ecommerce/
│  ├─ _shared/                       # NUEVO (átomos visuales Janis comunes a TODA la sección)
│  │  ├─ janis/
│  │  │  ├─ JanisTopBar.tsx          # eyebrow + h1 + status badge + acciones
│  │  │  ├─ JanisTabs.tsx            # underline azul activo, hover gris
│  │  │  ├─ JanisStepsHeader.tsx     # variante con numeración 1·2·3·4
│  │  │  ├─ Sec.tsx                  # divisor SECCIÓN + icono + UPPERCASE + línea
│  │  │  ├─ Field.tsx                # row grid-cols-[160px_1fr]
│  │  │  ├─ UnderlineInput.tsx       # input borderless con border-b
│  │  │  ├─ Sel.tsx                  # select con chevron
│  │  │  ├─ Chip.tsx                 # pill con X
│  │  │  ├─ PillBtn.tsx              # botón rounded-full (variants ghost/primary/success/success-outline)
│  │  │  ├─ ProgressItem.tsx         # checkpoint vertical con estado done/active/pending
│  │  │  └─ Kpi.tsx                  # tarjeta KPI con delta
│  │  ├─ icons/janis-icons.tsx       # set SVG (inline) compartido
│  │  └─ tokens.ts                   # paleta Janis: blue-700 #1d4ed8, pink-500, emerald-500, amber-500
│  │
│  ├─ shared/                        # lógica compartida ML/Fala/VTEX (ya existe; se extiende)
│  │  ├─ atributos/
│  │  │  ├─ base/
│  │  │  │  ├─ views/
│  │  │  │  │  ├─ AtributosListView.tsx
│  │  │  │  │  └─ AtributosDetailView.tsx
│  │  │  │  ├─ components/
│  │  │  │  │  ├─ AtributosTopBar.tsx       # wrap de <JanisTopBar/>
│  │  │  │  │  ├─ AtributosSummary.tsx
│  │  │  │  │  ├─ AtributosPlatforms.tsx
│  │  │  │  │  ├─ AtributosComments.tsx
│  │  │  │  │  └─ AtributosLogs.tsx
│  │  │  │  ├─ hooks/
│  │  │  │  │  └─ useAtributo.ts            # useFetchWithAuthPim + SWR-like
│  │  │  │  ├─ api/
│  │  │  │  │  └─ atributos-api.ts          # wrappers tipados
│  │  │  │  ├─ types/atributo-types.ts
│  │  │  │  └─ index.ts
│  │  │  └─ index.ts
│  │  └─ ...
│  │
│  └─ mercadolibre/
│     └─ atributos/index.ts          # re-export del shared con alias Meli*
```

### 2.2 Convenciones de nombres

- **Vistas top-level**: `<Feature>View.tsx` o `<Feature><Sub>View.tsx` (ej. `OfertasListView`, `OfertasDetailView`, `PublicarWizardView`).
- **Tabs/Steps internos**: `<Feature><Tab>.tsx` (ej. `EditorImagen.tsx`, `EditorPrecios.tsx`, `PublicarStep2Obligatorios.tsx`).
- **Wrappers de chrome**: `<Feature>TopBar.tsx`, `<Feature>Tabs.tsx`.
- **Hooks**: `use<Feature><Acción>.ts` (ej. `usePublicarLookupSku.ts`).
- **API clients**: `<feature>-api.ts` con funciones puras y tipos exportados.
- **Atomos Janis**: nombres en `_shared/janis/` empiezan con `Janis*` para distinguir del `components/ui/` global.

### 2.3 Átomos Janis vs `components/ui/` global

**Decisión vinculante:** los átomos Janis viven en `features/catalogo/pages/plataforma-ecommerce/_shared/janis/`, **no** en `components/ui/` global.

Razones:
1. `components/ui/` (30+ átomos: `button`, `input`, `select`, `tabs`, `tabnav`, etc.) usa la paleta OMS (azul navy `#14365e`, rojo `#c8202d`, helvetica). Mezclar Janis (blue-700 `#1d4ed8`, pink-500 `#ec4899`, Inter) corrompería el sistema global.
2. La paleta Janis es exclusiva del subárbol "plataforma de ecommerce". Otras secciones del OMS (pedidos, almacén, finanzas) no la deben heredar.
3. `components/ui/` tiene foco en formularios densos del OMS; el design language Janis es marketing-ish (eyebrow, h1 grande, pill buttons, underline-fields).

**Excepción:** si un átomo Janis comprobadamente sirve para otra sección del OMS (caso unlikely, ej. `Kpi`), se sube luego a `components/ui/` con flag de variante. No proactivo.

### 2.4 Reutilización del scaffold existente

El subárbol `app/catalogo/plataforma-ecommerce/<mkt>/{productos,mapeo-categorias,mapeo-atributos,configuracion}/` y `features/catalogo/pages/plataforma-ecommerce/{<mkt>,shared}` ya provee el `EcommercePlatformProvider` (`ecommerce-platform-context.tsx`) + `EcommerceSectionTabs` (`ecommerce-tabs.tsx`). Para las features nuevas:

- Las features nuevas se montan **al lado** de las existentes en el mismo `<mkt>/` (no se reorganiza nada). Las tabs visibles arriba del marketplace (PRODUCTOS · MAPEO DE CATEGORÍAS · MAPEO DE ATRIBUTOS · CONFIGURACIÓN) se amplían a incluir DASHBOARD · CATÁLOGO · ATRIBUTOS · PUBLICAR · EDITOR · CARGA MASIVA · OFERTAS (sólo ML). Ver decisión #5.
- El `EcommercePlatformProvider` ya inyecta `name`, `basePath`, `channelKeywords`, `exportPrefix` — todas las features nuevas lo consumen con `useEcommercePlatform()` para parametrizar llamadas API.

### 2.5 Conexión a la API real

Patrón canónico para cada feature (basado en `useFetchWithAuthPim` ya presente en `lib/http/client.ts`):

```ts
// features/.../shared/<feature>/base/api/<feature>-api.ts
import { useFetchWithAuthPim } from "@/lib/http/client";

export function useAtributosApi() {
  const { fetchWithAuthPim } = useFetchWithAuthPim();
  return {
    list: () => fetchWithAuthPim("api/pim/atributos"),
    get:  (id: string) => fetchWithAuthPim(`api/pim/atributos/${id}`),
    save: (id: string, body: unknown) =>
      fetchWithAuthPim(`api/pim/atributos/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  };
}
```

- Toda llamada al monolito pasa por `useFetchWithAuthPim`. **Prohibido** hardcodear `http://localhost:5050` (eso queda en `lib/http/endpoints.ts`).
- Errores: el monolito ya devuelve `{ ok, code, message, causes }` — replicar la `ApiError` que tiene `PIM-SRC/ofertas/api.ts` en `_shared/janis/lib/api-error.ts`.

### 2.6 Mock data vs data real

- Los mockups Janis vienen con `ROWS = [...]`, `TREE = [...]` hardcodeados. Convertirlos en `mocks/<feature>.fixtures.ts` y solo usarlos en Storybook o tests.
- En la vista real, montar con `useState(null)` + `useEffect` que dispara `api.list()`. Mientras carga, usar `<Loader/>` (ya existe en `components/ui/loader`). Si falla, fallback a `<EmptyState/>` con CTA "Reintentar".

### 2.7 Registro en sidebar (`lib/menu-items.tsx`)

El bloque `Plataforma de ecommerce` (líneas 420–457) se extiende. Patrón por marketplace:

```tsx
{
  text: "MercadoLibre",
  route: "/catalogo/plataforma-ecommerce/mercadolibre/dashboard",
  hasSubItems: true,
  subItems: [
    { text: "Dashboard",           route: "/catalogo/plataforma-ecommerce/mercadolibre/dashboard" },
    { text: "Catálogo",            route: "/catalogo/plataforma-ecommerce/mercadolibre/catalogo" },
    { text: "Atributos",           route: "/catalogo/plataforma-ecommerce/mercadolibre/atributos" },
    { text: "Mapeo de categorías", route: "/catalogo/plataforma-ecommerce/mercadolibre/mapeo-categorias" },
    { text: "Publicar",            route: "/catalogo/plataforma-ecommerce/mercadolibre/publicar" },
    { text: "Carga masiva",        route: "/catalogo/plataforma-ecommerce/mercadolibre/carga-masiva" },
    { text: "Ofertas",             route: "/catalogo/plataforma-ecommerce/mercadolibre/ofertas" },
    { text: "Configuración",       route: "/catalogo/plataforma-ecommerce/mercadolibre/configuracion" },
  ],
},
```

- "Editor" no va al sidebar — se accede desde `Catálogo` → click en SKU → `editor/[sku]`.
- "Mapeo de atributos" se renombra a "Atributos" (deprecar el scaffold actual, mover/eliminar). Si hay dudas, agregar "Atributos" como entrada nueva y dejar "Mapeo de atributos" 1 sprint más como redirect.
- Permisos: respetar el patrón jerárquico del `menu-items.tsx` (ya valida `permission_required`).

### 2.8 Definition of Done por feature

Una feature está cerrada cuando todos los criterios verifican:

- [ ] `npm run typecheck` pasa sin nuevos errores.
- [ ] `npm run build` pasa.
- [ ] `npm run lint` sin warnings nuevos.
- [ ] Navegación desde el sidebar (`menu-items.tsx`) llega a la página y monta sin error de consola.
- [ ] Al menos un endpoint real responde con datos (no 404, no 401) usando `useFetchWithAuthPim`.
- [ ] Chrome (TopBar + Tabs/Steps si aplica) idéntico visualmente al mockup Janis (paleta, espaciados, tipografía Inter).
- [ ] Sin warnings de React en consola (`key`, `defaultValue/value`, `htmlFor` faltantes).
- [ ] Cada control interactivo es accesible por teclado (`Tab`/`Enter`/`Esc` en modales).
- [ ] Responsive básico: 1280px, 1024px y 768px sin desbordes horizontales obvios.
- [ ] Todas las tabs/steps con placeholder en el mockup están implementadas O explícitamente marcadas como "Próximamente · backlog" con ticket asociado.
- [ ] El bundle de la ruta no excede 350 KB gzipped en producción (medido con `next build`).

---

## Sección 3 — Decisiones técnicas

### 3.1 Editor de producto (`editar.html` monolítico)

> ⚠️ **DESCARTADA 2026-05** — Ver Sección 0. La opción (e) HÍBRIDO INVERTIDO no se implementó. Se eligió (a) Reescribir todo en React: 6 tabs nativas, sin iframe. Ya hay 5/6 funcionando con APIs reales. La tabla siguiente queda como contexto histórico de qué se evaluó.

| Opción | Pros | Cons | Esfuerzo |
|---|---|---|---|
| (a) Reescribir todo en React | Coherente con el resto. Tipado. Reusa hooks/átomos. Apaga el monolito vanilla. | Riesgo de regresión funcional alto. 9 tabs × lógica heterogénea. Quill (rich text) custom. | 15–20 d-p |
| (b) Iframe a `pim-service/editar.html?sku=...` | Tiempo mínimo. 0 regresión funcional. | Visualmente roto (paleta Mimbral navy vs Janis). Auth duplicada. No se puede cerrar `pim-service` hasta migrar. UX peor (sin breadcrumbs Next, sin keyboard shortcuts integrados). | 0.5–1 d-p |
| (c) `dangerouslySetInnerHTML` con el HTML inline | Ahorra round-trip iframe. | Aún peor que iframe: rompe SSR, contamina globals, Quill se carga 2× si la página tiene rich text. **Descartar.** | — |
| (d) **HÍBRIDO RECOMENDADO**: shell Janis + iframe sólo del `<main>` editable + comunicación postMessage | Visual Janis arriba (TopBar, Tabs, layout OMS). Iframe sólo embebe el form interno del `editar.html`. PostMessage para "Guardar"/"Cancelar"/badge de estado. | Requiere un sub-shell minimal en `pim-service/editar.html?embed=1` que oculte su header. Coordinación postMessage frágil. | 6–8 d-p |
| (e) **HÍBRIDO INVERTIDO RECOMENDADO V2**: reescribir sólo RESUMEN + PRECIOS + STOCK + IMAGEN en React (las 4 tabs más usadas) y dejar PLATAFORMAS/ATRIBUTOS/RELACIONADO/COMENTARIOS/LOGS como iframe a sub-routes del `editar.html` | Mata el monolito por etapas. UX consistente para el 80% de los casos de uso. Permite cerrar el pim-service shell completo en Fase 9 después. | Mantener 2 implementaciones durante meses. Necesita un mini-bridge auth para el iframe. | 8–10 d-p |

**Recomendación: (e) HÍBRIDO INVERTIDO V2.**
- Razón: en 1 sprint cubre la mayoría de uso real (RESUMEN/PRECIOS/STOCK/IMAGEN); las 5 tabs restantes (incluido COMENTARIOS y LOGS, que son read-mostly) son iframe a `pim-service/editar.html?tab=...&embed=1`. Cuando la base estabilice se reescribe el resto. Define un camino claro hacia "apagar el monolito" sin frenar la Fase 8 (Falabella).
- En Fase 9 se mide adopción y se decide si vale la reescritura completa del 20% restante o se mantiene el iframe.

### 3.2 Átomos visuales compartidos

> ⚠️ **REVERTIDA 2026-05 (A3 refactor)** — Ver Sección 0. Después de construir Janis en `_shared/janis/`, se decidió que el subárbol use **OMS look pleno** con `components/ui/` global + un set de átomos específicos en `_shared/ui/` (EcommercePageHeader, FieldRow, SectionDivider, etc.). `_shared/janis/` queda **deprecated** y se elimina a medida que se refactoriza cada feature. La tabla siguiente queda como contexto histórico.

| Opción | Pros | Cons |
|---|---|---|
| `components/ui/` global del OMS | Atomos descubribles para todo el repo. Imports cortos. | Contamina con paleta Janis. Riesgo de que devs usen Janis en pedidos/almacén. |
| **`features/catalogo/pages/plataforma-ecommerce/_shared/janis/` (RECOMENDADO ORIGINAL)** | Aislado por sección. No contamina el OMS. Onboarding más claro: "Janis = ecommerce". | Imports más largos. Si Falabella/VTEX necesitan los átomos hay que importar cross-feature. |

**Recomendación original: `_shared/janis/`.** (Tradeoff de readability vs containment claramente a favor del segundo. Si en 3 meses se demuestra reutilización fuera del subárbol, promover átomos individuales a `components/ui/` con variante `tone="janis"`.) **Resultado real**: se descartó Janis por completo, se hizo refactor a OMS look pleno.

### 3.3 Migración progresiva vs todo-o-nada

| Opción | Pros | Cons |
|---|---|---|
| Todo-o-nada por feature (entregar 100% rediseñada cada una) | Cada release es coherente. No quedan estados Frankenstein en producción. | Más lento para ver progreso. Si una feature se pasa de presupuesto bloquea el roadmap. |
| **Progresiva: chrome primero, internos después (RECOMENDADO)** | El usuario ve el rediseño antes (motivación). Permite paralelizar con backend cuando un endpoint todavía no está listo. Riesgo de bloqueo bajo. | Estados intermedios visibles (TopBar Janis + content viejo) durante 1–2 días. Requiere disciplina en el "Próximamente · backlog". |

**Recomendación: progresiva.** Cada feature pasa por 2 milestones:
1. **M1 — Chrome ready**: `<FeatureTopBar/>` + `<FeatureTabs/>` montados, primera tab con data real, resto con `<TabPlaceholder/>` consistente.
2. **M2 — Feature complete**: todas las tabs/steps implementadas, DoD verde.

La transición M1→M2 puede tardar 1–3 sprints según feature.

### 3.4 Compartir lógica entre ML/Falabella/VTEX

El patrón ya existe (`features/catalogo/pages/plataforma-ecommerce/shared/productos/base/`) y funciona: `MarketplaceProductosBrowse.tsx` recibe `EcommercePlatformConfig` por contexto, y cada `<mkt>/productos/index.ts` re-exporta con alias `Meli*`/`Fala*`/`Vtex*`.

**Recomendación: replicarlo exactamente para todas las features que aplican a varios marketplaces.**

- `shared/atributos/base/` ← consumido por mercadolibre, falabella, vtex.
- `shared/dashboard/base/` ← mismo.
- `shared/catalogo/base/` ← mismo.
- `shared/mapeo-categorias/base/` ← mismo.
- `shared/carga-masiva/base/` ← mismo.
- `shared/publicar/base/` ← ML + Fala en V1, VTEX se omite por ahora.
- `shared/editor/base/` ← ML + Fala + VTEX (data resume con campos comunes; tabs PLATAFORMAS varía).
- `mercadolibre/ofertas/` ← exclusiva, **no va a shared**.

### 3.5 Estado del scaffold existente vs features nuevas

El scaffold `<mkt>/{productos,mapeo-categorias,mapeo-atributos,configuracion}/` (~4.434 LOC productivos) **no se reorganiza**. Las features nuevas se montan al lado:

```
mercadolibre/
├─ productos/          # YA EXISTE — renombrar visualmente a "Catálogo" en menu y deprecar luego
├─ catalogo/           # NUEVA — sustituye productos en V2
├─ atributos/          # NUEVA — reemplaza mapeo-atributos en V2
├─ mapeo-atributos/    # YA EXISTE — alias durante 1 sprint
├─ mapeo-categorias/   # YA EXISTE — rediseñar al chrome Janis
├─ configuracion/      # YA EXISTE — rediseñar al chrome Janis
├─ dashboard/          # NUEVA
├─ publicar/           # NUEVA
├─ editor/[sku]/       # NUEVA
├─ carga-masiva/       # NUEVA
└─ ofertas/            # NUEVA (sólo ML)
```

**Recomendación**: en la Fase 1 sólo se agregan rutas nuevas. En la Fase 9 (limpieza) se deprecan `productos/` y `mapeo-atributos/` después de redirigir desde el sidebar a las nuevas rutas. No tocar el scaffold productivo hasta que las contrapartes nuevas hayan estado en producción ≥1 sprint sin issues.

### 3.6 Calculadora de margen

| Opción | Pros | Cons |
|---|---|---|
| (a) Solo widget embebido en publicar/editor | Cero ruta adicional. Contextual. | No descubrible para usuarios que quieren simular sin abrir un SKU. |
| (b) Solo página standalone | Descubrible. URL compartible. | Duplica componente si también se embebe. |
| **(c) AMBOS RECOMENDADO**: componente único `<CalculadoraMargenWidget/>` (`PIM-SRC/publicar/components/CalculadoraMargenWidget.tsx`, ~530 LOC) usado como widget en publicar step3, en editor tab PRECIOS, y montado en una ruta standalone `<mkt>/calculadora-margen` | Una sola implementación, 3 puntos de entrada. | Necesita prop `mode="embedded" \| "standalone"` para esconder controles innecesarios. |

**Recomendación: (c).** Item de sidebar (debajo de Configuración).

---

## Sección 4 — Plan de fases con dependencias

### Fase 0 — Setup y smoke test del puente (parcial hecho)

- **Objetivo**: el repo OMS puede hablar con `pim-service` autenticado con JWT del id-service.
- **Pre-requisitos**: ninguno.
- **Tareas**:
  - [x] Decode JWT sin verify en `pim-service` (`decodeUser` middleware).
  - [x] `URL_PIM_SERVICE` + `useFetchWithAuthPim` en `FrontOmsMimbral`.
  - [ ] Usuario agrega `NEXT_PUBLIC_URL_PIM_SERVICE=http://localhost:5050` a `.env.local`.
  - [ ] Smoke test: una página dummy de OMS llama `GET /api/pim/health` y muestra el resultado.
- **Riesgos**: CORS si el monolito no permite el origin de Next dev (`http://localhost:3000`). Verificar `cors` en `pim-service/src/app/http/server.js`.
- **DoD**: respuesta 200 visible en la página de smoke. Network tab muestra `Authorization: Bearer ...`.
- **Esfuerzo**: 0.5 d-p (mayoría hecho).

### Fase 1 — Átomos visuales Janis compartidos

- **Objetivo**: tener `_shared/janis/` con todos los átomos referenciables.
- **Pre-requisitos**: Fase 0.
- **Tareas**:
  - [ ] Crear `_shared/janis/` con `JanisTopBar`, `JanisTabs`, `JanisStepsHeader`, `Sec`, `Field`, `UnderlineInput`, `Sel`, `Chip`, `PillBtn`, `ProgressItem`, `Kpi`.
  - [ ] Extraer los SVG iconos de los mockups (`atributos.html`, `dashboard.html`, etc.) a `_shared/janis/icons/janis-icons.tsx` con un `<JanisIcon name="..."/>` o un set de exports individuales.
  - [ ] `tokens.ts` con la paleta (`#1d4ed8` blue-700, `#ec4899` pink-500, `#10b981` emerald, `#f59e0b` amber, `#f3f4f6` bg, etc.).
  - [ ] Página Storybook-like en `app/(dev)/janis-playground/page.tsx` (sólo en dev) que muestre los átomos para QA.
  - [ ] Tipado estricto: cada átomo con `interface` exportada.
- **Riesgos**: Tailwind CDN del mockup usa clases JIT que Tailwind v4 de Next puede no incluir. Validar el `tailwind.config.ts` del repo.
- **DoD**: el playground monta los 11 átomos y la paleta visual coincide pixel-perfect con `dashboard.html`.
- **Esfuerzo**: 3 d-p.

### Fase 2 — Atributos (prueba de concepto)

- **Objetivo**: completar **una** feature end-to-end como referencia canónica del patrón.
- **Pre-requisitos**: Fase 1.
- **Tareas**:
  - [ ] Rutas `app/.../<mkt>/atributos/page.tsx` y `.../[id]/page.tsx`.
  - [ ] `shared/atributos/base/` con views, api, hooks, types.
  - [ ] M1 — Chrome ready: TopBar + Tabs SUMMARY/PLATFORMS/COMMENTS/LOGS. SUMMARY funcional, otras 3 con `<TabPlaceholder/>`.
  - [ ] M2 — implementar PLATFORMS, COMMENTS, LOGS.
  - [ ] Re-export desde `<mkt>/atributos/index.ts` con alias por marketplace.
  - [ ] Item en `menu-items.tsx` línea ~431 (sustituir "Mapeo de atributos").
  - [ ] Migrar lógica desde `PIM-SRC/atributos/atributos.ts`.
- **Riesgos**: endpoints `/api/pim/atributos/*` pueden no existir tal cual — auditar antes con el equipo backend.
- **DoD**: todos los DoD por feature (Sección 2.8). Esta feature es el "golden path" que el resto debe copiar.
- **Esfuerzo**: 5 d-p.

### Fase 3 — Carga masiva + Dashboard (los 2 sin placeholders)

- **Objetivo**: 2 features rápidas que validan el patrón en breadth.
- **Pre-requisitos**: Fase 2 (referencia consolidada).
- **Tareas**:
  - [ ] Carga masiva: `shared/carga-masiva/base/` + ruta `<mkt>/carga-masiva`. Integrar `DropZone` con `react-dropzone` (verificar si ya está como dep; si no, agregarlo). Backend de upload con `multipart/form-data` via `useFetchWithAuthPim`.
  - [ ] Dashboard: `shared/dashboard/base/` + ruta `<mkt>/dashboard`. Sparks SVG simples (no chart lib). KPIs cards.
  - [ ] Para los 2: registrar en `menu-items.tsx` después de la entrada actual del marketplace.
- **Riesgos**: el endpoint de upload puede estar configurado sólo en `pim-service` y no respetar el body limit de `useFetchWithAuthPim`. Validar antes.
- **DoD**: ambos pasan DoD por feature. Smoke test: subir un Excel de 100 filas y ver el resultado tabulado.
- **Esfuerzo**: 4 d-p (2 por feature).

### Fase 4 — Categorías + Catálogo

- **Objetivo**: 2 features con 1 placeholder cada una; reusan endpoints ya consumidos.
- **Pre-requisitos**: Fase 2 + Fase 3.
- **Tareas**:
  - [ ] Mapeo de categorías: rediseñar el scaffold existente al chrome Janis. Migrar lógica de tree N1→N2→N3 desde mockup.
  - [ ] Catálogo: nueva ruta `<mkt>/catalogo`. La lógica de `MarketplaceProductosBrowse.tsx` (en `shared/productos/base/`) se **adapta** al chrome Janis: extraer la table actual y envolverla en `<JanisTopBar/>` + el toolbar de filtros del `catalogo.html` mockup.
  - [ ] Implementar el placeholder lateral de cada uno.
  - [ ] **Decisión de transición**: ¿`catalogo/` reemplaza a `productos/` ya? Recomendado: dejarlas convivir 1 sprint, `menu-items.tsx` apunta a `catalogo/`, `productos/` queda como redirect server-side.
- **Riesgos**: el patrón de re-export en `mercadolibre/productos/index.ts` apunta a `shared/productos`. Si se mueve a `shared/catalogo`, hay que ajustar 6 imports. Hacer una pasada de grep antes.
- **DoD**: ambos DoD. La tabla de catálogo paginable funciona con `/api/pim/productos` real.
- **Esfuerzo**: 6 d-p (3 por feature).

### Fase 5 — Ofertas

- **Objetivo**: la feature más compleja de las "internas" (no editor).
- **Pre-requisitos**: Fase 1, 2, 3.
- **Tareas**:
  - [ ] Crear `mercadolibre/ofertas/{views,list,wizard,api,hooks}` (no en `shared/` — ML only).
  - [ ] Migrar `PIM-SRC/ofertas/api.ts` (906 LOC, ya tipado y robusto con `ApiError`) tal cual a `mercadolibre/ofertas/api/ofertas-api.ts`. Reemplazar `fetch` por `useFetchWithAuthPim` (cuidado: el actual usa `fetch` con paths relativos `/api/pim/...` que asumen el monolito sirve la SPA; en Next esos paths van a Next API, ajustar a usar `URL_PIM_SERVICE`).
  - [ ] Migrar `PIM-SRC/ofertas/list/` (2.220 LOC) — adaptar las tabs Activas/Finalizadas/Disponibles ML al chrome Janis con `<JanisTopBar/>` + tabla.
  - [ ] Migrar `PIM-SRC/ofertas/wizard/` (852 LOC) — Step1Info, Step2Skus (413 LOC, complejo: SKU picker con stock), Step3Review. Wrap en `<JanisStepsHeader/>`.
  - [ ] M1: chrome + RESUMEN.
  - [ ] M2: las 6 tabs faltantes (ÍTEMS, COFINANCIACIÓN, CALENDARIO, PLATAFORMAS, COMENTARIOS, LOGS).
  - [ ] Modal `MLEnrollModal` (905 LOC) — el más grande del paquete. Validar si vale la pena re-escribirlo o portarlo as-is con tweaks visuales.
- **Riesgos**: `PIM-SRC/ofertas/data/loader.ts` cachea catálogo en módulo global (`primeCatalogCache`). En SSR de Next esto **rompe** entre requests. Convertir a `useMemo` o React Context.
- **DoD**: DoD por feature + e2e manual: crear una campaña de prueba, ver ítems, guardar borrador, lanzar.
- **Esfuerzo**: 12 d-p.

### Fase 6 — Publicar

- **Objetivo**: wizard de 4 steps con calculadora embebida.
- **Pre-requisitos**: Fase 1, 2, 5.
- **Tareas**:
  - [ ] `shared/publicar/base/{views,steps,components,api,hooks}`.
  - [ ] Step1 (SKU + categoría) — ya implementado en el mockup; portar y conectar con `/api/pim/productos/:sku` (lookup SAP) + `CategoryPickerModal`.
  - [ ] Step2 (Obligatorios) — usar `AttrInput.tsx` portado desde `PIM-SRC/publicar/components/AttrInput.tsx`. Diferenciar entre ML y Falabella con `channel` prop. Imágenes con `ImageUploader.tsx`.
  - [ ] Step3 (Recomendados) — score widget + lista de atributos opcionales.
  - [ ] Step4 (Revisar + Publicar) — preview con `ProductPreview.tsx`. `PayloadDrawer` para ver el JSON que se enviará. `PublishConfirmModal` para confirmar.
  - [ ] Integrar `CalculadoraMargenWidget` como side-panel en Step3.
  - [ ] Item en `menu-items.tsx`.
- **Riesgos**: `payloadBuilders.ts` construye el JSON final que se envía a ML/Fala; un cambio en cómo se modela el state local del wizard puede romper el builder. Mantener `payloadBuilders.ts` **idéntico** y sólo cambiar la presentación.
- **DoD**: DoD por feature + e2e manual: publicar un SKU de test contra el sandbox de ML.
- **Esfuerzo**: 12 d-p.

### Fase 7 — Editor (estrategia híbrida invertida)

- **Objetivo**: las 4 tabs core en React (RESUMEN, IMAGEN, PRECIOS, STOCK); el resto en iframe a `pim-service/editar.html?tab=...&embed=1`.
- **Pre-requisitos**: Fase 1, 2, 6 (varios componentes ya creados en Publicar — `AttrInput`, `ImageUploader`).
- **Tareas**:
  - [ ] Crear sub-route `?embed=1` en `pim-service/editar.html` que oculta su header/sidebar/cintillo y sólo muestra el `#col-c`.
  - [ ] Bridge auth para el iframe: el OMS pasa el token JWT por query string `?token=...` o por postMessage post-mount.
  - [ ] `shared/editor/base/views/EditorView.tsx`: `<JanisTopBar/>` + `<JanisTabs/>` con 9 tabs. Las 4 primeras montan componentes React (`EditorResumen`, `EditorImagen`, `EditorPrecios`, `EditorStock`). Las 5 restantes montan `<EditorIframeBridge tab="..."/>`.
  - [ ] Implementar las 4 tabs React (reusar `AttrInput`, `Sec`, `Field` etc.).
  - [ ] Cuando el usuario sale de una tab iframe, se hace `postMessage('save-and-close')` desde el iframe para que el chrome React refresque el badge "Activo/Borrador".
  - [ ] Item en `Catálogo` → click en SKU → route `<mkt>/editor/[sku]`.
- **Riesgos**:
  - El `editar.html` usa Quill (Quill.js CDN) que en el iframe puede tardar 1–2s en hidratar. UX: mostrar un loader en el iframe wrapper hasta que el `onLoad` dispare.
  - Quill maneja el body global; si el OMS también va a usar rich text en otra parte, no chocan porque están en frames distintos.
  - CSP: el `pim-service` debe permitir ser embebido en iframe (`Content-Security-Policy: frame-ancestors`).
- **DoD**: DoD por feature. Test manual: editar un SKU, cambiar precio en la tab PRECIOS React, ver que el cambio queda guardado.
- **Esfuerzo**: 10 d-p.

### Fase 8 — Replicar para Falabella

- **Objetivo**: todas las features que aplican a Falabella montan vistas iguales conectadas a sus endpoints.
- **Pre-requisitos**: Fases 2–7 (ML completo).
- **Tareas**:
  - [ ] Por cada feature en `shared/*/base/`, agregar `falabella/<feature>/index.ts` con re-exports y aliases `Fala*`.
  - [ ] En las vistas, ajustar `useEcommercePlatform()` para que `channelKeywords` y `exportPrefix` sean Falabella-specific.
  - [ ] Endpoints: `/api/pim/canales/falabella/*` en lugar de `mercadolibre`. La api de Publicar ya está parametrizada (`channel === 'fala'`).
  - [ ] **No incluir** Ofertas (Falabella tiene API distinta — backlog V2).
  - [ ] Items en `menu-items.tsx` para Falabella.
- **Riesgos**: backend de Falabella puede no tener todos los endpoints implementados. Auditar contra el equipo backend antes de la fase. Si faltan, gate la fase parcialmente.
- **DoD**: DoD por feature, por marketplace. La página de Falabella publica un SKU de test.
- **Esfuerzo**: 6 d-p.

### Fase 9 — VTEX + limpieza

- **Objetivo**: cerrar el subárbol y apagar `pim-service`.
- **Pre-requisitos**: Fases 0–8.
- **Tareas**:
  - [ ] VTEX: replicar dashboard, catálogo, atributos, mapeo-categorías, configuración (no Publicar, no Ofertas, no Editor en V1 — VTEX maneja todo desde su admin).
  - [ ] Deprecar `productos/` y `mapeo-atributos/` (redirect a `catalogo/` y `atributos/`).
  - [ ] Si la Fase 7 ya estabilizó, decidir si reescribimos las 5 tabs iframe-bridge del editor o se mantienen permanentemente.
  - [ ] Apagar el servicio HTML del monolito `pim-service`: dejar `/api/*` activo pero deprecar `/publicar.html`, `/editar.html`, `/ofertas.html`, etc. (servirlos con un 410 Gone + link a la ruta nueva).
  - [ ] Limpieza: borrar `pim-service/Plataforma_Marketplace/src/features/{publicar,ofertas,atributos,catalogo,categorias,dashboard,cargaMasiva}/` después de 2 sprints sin tráfico.
  - [ ] Producción: agregar `pim-service` al `api-gateway/src/config/services.js` con `requireAuth: true`. Apagar el `decodeUser`-only bypass de DEV.
- **DoD global**: Sección 6.
- **Esfuerzo**: 8 d-p.

---

## Sección 5 — Riesgos y mitigaciones

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| 1 | `editar.html` monolítico (~3–4.5k LOC) tiene lógica de negocio sutil (Quill rich text, dependencias entre campos, custom validations) que se pierde en una reescritura. | Alta | Alta | Estrategia híbrida invertida (Decisión #1 opción e): mantener el monolito iframe-embebido para las 5 tabs menos usadas. Auditar uso real con telemetría antes de Fase 9. |
| 2 | Diferencia de paleta entre OMS (navy `#14365e` + rojo `#c8202d`) y Janis (blue-700 `#1d4ed8` + pink-500). El usuario percibe inconsistencia al ir desde "Pedidos" a "Plataforma de ecommerce". | Alta | Media | Documentar explícitamente en `lib/menu-items.tsx` que la sección "Plataforma de ecommerce" usa design language Janis. Considerar agregar un divider visual en el sidebar antes de la entrada. Alinear con diseño si el OMS migrará a Janis eventually. |
| 3 | El scaffold existente (`productos/`, `mapeo-atributos/`) tiene ~4.434 LOC en uso. Reorganizar puede romper imports en archivos no relacionados. | Media | Alta | No mover archivos en Fases 1–8. Sólo agregar nuevas rutas al lado. La limpieza (Fase 9) hace `git mv` con dos sprints de testeo previo. Antes de cualquier rename, `grep -r` de los símbolos exportados (`MarketplaceProductosBrowse`, `MeliProductosBrowse`). |
| 4 | Regresión funcional al pasar de Vite multi-HTML a Next App Router. El Plataforma_Marketplace usa `localStorage` agresivo (`publicar.state`, `publicar.step`, `publicar.channel`); en SSR de Next no existe `localStorage` en primer render. | Alta | Media | Cada uso de `localStorage` en código portado va dentro de `useEffect` (post-mount). Nunca en `useState(() => ...)` que pueda correr en server. Lazy-init pattern: `const [s, setS] = useState(initialState); useEffect(() => setS(restoreFromLS()), []);`. |
| 5 | `lib/menu-items.tsx` con 926 LOC y permisos jerárquicos. Una modificación mal hecha puede ocultar páginas a usuarios. | Media | Alta | Toda edición a `menu-items.tsx` debe acompañarse de captura de `npm run typecheck` + verificación manual del rol más restrictivo. Considerar agregar tests unitarios sobre el shape del menú (cantidad de items, estructura). |
| 6 | Backend `pim-service` sin JWT verify real (sólo decode); en DEV es ok porque el id-service ya validó upstream, pero en PROD requiere `requireAuth: true` en `api-gateway`. Si se olvida, queda hueco de seguridad. | Media | Alta | Documentar en el README del `pim-service` y poner un `console.warn` en arranque cuando `NODE_ENV=production && !process.env.REQUIRE_AUTH`. Validar en Fase 9 antes de PROD release. |
| 7 | Tailwind del repo OMS puede no incluir todas las clases JIT que usan los mockups (ej. `text-[26px]`, `bg-[#1d1f23]`, `tracking-[0.12em]`). | Alta | Baja | Habilitar el `safelist` o, mejor, asegurar que el `content:` de `tailwind.config.ts` incluye `features/catalogo/pages/plataforma-ecommerce/**/*.tsx`. Validar en Fase 1 con el playground. |
| 8 | Sub-route `?embed=1` del `editar.html` no existe; hay que agregarlo en `pim-service` y desplegarlo en paralelo. | Media | Media | Fase 7 incluye este sub-task. Si el equipo del pim-service no puede agregar el embed-mode rápido, fallback temporal: usar la página full y ocultar el header con CSS injected al iframe (frágil). |
| 9 | CORS: `pim-service` debe permitir `http://localhost:3000` (Next dev) y eventualmente el dominio de PROD. | Media | Media | Auditar `pim-service/src/app/http/server.js` antes de Fase 2. Configurar `cors({ origin: [...] })` con whitelist explícita. |
| 10 | El usuario actualiza el `OfertasApp.tsx` o el `PublicarApp.tsx` en `pim-service` después de la migración (porque sigue siendo el "código vivo" hasta Fase 9). Diverge la lógica. | Alta | Media | Tan pronto la ruta nueva sea estable (Fase 5 / 6), apagar **el HTML** correspondiente en `pim-service` (servirlo con un meta refresh a la ruta nueva). El TS sigue siendo la fuente de verdad, pero no se renderiza desde el monolito. |
| 11 | El bundle size del subárbol crece sin control (publicar + editor + ofertas son grandes). Build de Next se vuelve lento, HMR lento. | Media | Media | Cada ruta es un `app/.../page.tsx` separado — Next ya hace code-splitting por ruta. Validar con `next build --analyze` al final de cada fase. Si una ruta supera 350 KB gzipped, refactorizar con `dynamic()` para los modales pesados. |
| 12 | `MLEnrollModal` (905 LOC) trae lógica de matchmaking de ofertas con campañas de ML que casi nadie entiende. Reescritura blind = bug factory. | Media | Alta | Portar **as-is** (sólo wrap visual). Marcar como "no rediseñar internos" en Fase 5. Si visualmente queda raro, gating con feature flag y comparar lado a lado. |

---

## Sección 6 — Definition of Done global

La migración se da por cerrada cuando:

1. **Sidebar 100% funcional**: todas las entradas bajo "Plataforma de ecommerce" en `menu-items.tsx` apuntan a páginas Next que montan sin error, para los 3 marketplaces (MercadoLibre, Falabella, VTEX), respetando permisos.
2. **HTML de `pim-service` apagado**: las rutas `/publicar.html`, `/editar.html`, `/ofertas.html`, `/atributos.html`, `/catalogo.html`, `/categorias.html`, `/dashboard.html`, `/carga_masiva.html` devuelven 410 Gone con redirect al equivalente en Next. La carpeta `pim-service/Plataforma_Marketplace/src/features/` queda sin referencias activas (puede mantenerse en historial git).
3. **Auth real en PROD**: el `api-gateway` proxy a `pim-service` con `requireAuth: true`. El `decodeUser` ya no se usa como única defensa.
4. **Tests E2E mínimos**: 1 happy-path por feature en Playwright/Cypress (login → navegar a la página → ejecutar la acción principal → verificar respuesta). Total: 8 specs ML + ~6 Fala + ~5 VTEX.
5. **Bundle size**: ninguna ruta supera 350 KB gzipped en `next build`. `app/catalogo/plataforma-ecommerce/**` total < 2 MB gzipped.
6. **Sin warnings en consola** en build de producción ni durante navegación de cualquiera de las 22 rutas (3 marketplaces × promedio 7 features + editor).
7. **Documentación interna**: un README en `features/catalogo/pages/plataforma-ecommerce/_shared/janis/README.md` explicando el patrón y cuándo NO usarlo fuera del subárbol.
8. **Telemetría**: cada `/api/pim/*` call traceada con `x-user-id` (decodificado del JWT en `pim-service`) por al menos 1 sprint para confirmar adopción.
9. **Calculadora de margen** disponible como: widget en publicar Step3, widget en editor tab PRECIOS, ruta standalone `<mkt>/calculadora-margen`.
10. **Limpieza de scaffolding deprecated**: `productos/` y `mapeo-atributos/` removidos del menu (las rutas pueden persistir como redirect server-side durante 1 release adicional).

---

## Sección 7 — Estimación y crono

### Suma de esfuerzos

| Fase | Esfuerzo (d-p) |
|---|---|
| 0 — Setup / smoke | 0.5 |
| 1 — Átomos Janis | 3 |
| 2 — Atributos (POC) | 5 |
| 3 — Carga masiva + Dashboard | 4 |
| 4 — Categorías + Catálogo | 6 |
| 5 — Ofertas | 12 |
| 6 — Publicar | 12 |
| 7 — Editor (híbrido) | 10 |
| 8 — Falabella (replicar) | 6 |
| 9 — VTEX + limpieza | 8 |
| **TOTAL** | **66.5 d-p** |

### Cronograma con 1 dev focal al 70%

Capacidad real: 1 d-p efectivo = 1.43 d calendario (1 ÷ 0.7).

- 66.5 d-p × 1.43 = **~95 días calendario** = **~19 semanas hábiles** ≈ **9.5 sprints quincenales** o **6.3 sprints triweekly**.

Distribución sugerida en sprints de 2 semanas:

| Sprint | Fases | Hito de entrega |
|---|---|---|
| S1 | 0 + 1 | Bridge listo · átomos Janis productivos · playground en `(dev)/janis-playground` |
| S2 | 2 | **Atributos completo (POC)** — referencia canónica documentada |
| S3 | 3 + arranque de 4 | Carga masiva + Dashboard productivos · arranque categorías |
| S4 | 4 + arranque de 5 | Catálogo + categorías completos · ofertas RESUMEN |
| S5 | 5 (cont.) | Ofertas list + wizard funcionales |
| S6 | 5 cierre + 6 arranque | Ofertas DoD · Publicar Step1+Step2 funcionales |
| S7 | 6 cierre | Publicar DoD completo |
| S8 | 7 | Editor híbrido — 4 tabs React + iframe bridge |
| S9 | 8 | Falabella replicado en todas las features migradas |
| S10 | 9 | VTEX + apagado del monolito + DoD global |

**Buffer recomendado**: agregar 1 sprint de slack (S11) antes del PROD release para imprevistos (auditoría de bundle size, regresiones, fix de feedback de QA). Crono total con buffer: **~22 semanas calendario** (5–6 meses).

---

## Critical Files for Implementation

- `C:\Users\Camilo Gutierrez\Desktop\FrontOmsMimbral\features\catalogo\pages\plataforma-ecommerce\shared\productos\base\views\MarketplaceProductosBrowse.tsx`
- `C:\Users\Camilo Gutierrez\Desktop\FrontOmsMimbral\app\catalogo\plataforma-ecommerce\_shared\ecommerce-tabs.tsx`
- `C:\Users\Camilo Gutierrez\Desktop\FrontOmsMimbral\lib\http\client.ts`
- `C:\Users\Camilo Gutierrez\Desktop\FrontOmsMimbral\lib\menu-items.tsx`
- `C:\Users\Camilo Gutierrez\Desktop\pim-service\Plataforma_Marketplace\src\features\publicar\PublicarApp.tsx`
