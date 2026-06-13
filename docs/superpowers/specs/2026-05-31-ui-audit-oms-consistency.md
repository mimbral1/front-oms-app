# Auditoría + consolidación visual del módulo e-commerce (OMS look)

**Fecha:** 2026-05-31 · **Repo:** FrontOmsMimbral (Next.js + Tailwind + TS) · **Verificación:** `npx tsc --noEmit` (no hay jest en el front) · **Sin git, sin escrituras a ML.**

## Marco (el hallazgo que reencuadra todo)
El módulo arrastra una **migración de sistema de diseño a medio terminar**. Conviven dos lenguajes:
- **OMS look** = el estándar real y mayoritario (~10 vistas): `EcommercePageHeader` + `ActionButton` + `Tabs` global + **lucide-react**. Mejor terminadas: **Ofertas** y **Catálogo** (`CatalogoTable`) → la **referencia**.
- **Janis legacy** = en retirada (3 secciones): `JanisTopBar` + `PillBtn` + `JanisIcon` (`_shared/janis/`) → **Dashboard**, Atributos, Mapeo categorías.

**Objetivo:** terminar de migrar los holdouts al OMS look, **eliminar pills** (`rounded-full` en badges/labels) y **unificar iconografía**.

## Decisiones aprobadas (usuario, 2026-05-31)
1. **Aplicar/Guardar del wizard** (hoy placeholders idénticos) → **consolidar en un solo "Guardar borrador"** que persiste en `localStorage` (lo que ya pasa). Quitar el duplicado. **Front-only, sin backend `/drafts`.**
2. **Iconos** → estandarizar **todo a lucide-react** (reemplazar Heroicons incl. sidebar, JanisIcon, MUI).
3. **Alcance** → ejecutar **W1→W5 en orden**, con review del usuario entre cada wave.

## Reglas duras
- **Nada de pills** (`rounded-full` en badges/estados/tipos → `rounded-md`, conservando colores/tamaños).
- Componentes **reales** del sistema OMS; no inventar; **no "pills"**.
- **Español neutro** (forma "tú"); corregir voseo encontrado.
- **No** PUT/POST/DELETE a ML; **no** git. Verificar con `tsc`.

## Fuera de alcance (follow-ups, NO en estas waves)
- Gestión por-ítem de campañas (opt-out/precio): la API existe (`removeItemFromPromotion`, `modifyItem`) pero es feature nueva (UI + flujo) → backlog.
- Backend de borradores `/drafts` (descartado: usamos localStorage).
- Tabs "Comentarios"/"Logs" de oferta y "Descargar errores": **se ocultan** (sin backend), no se implementan.

---

## Roadmap de waves

### W1 — Quick wins + matar pills
**Estrategia pills:** flip `rounded-full → rounded-md` **a nivel de componente** (arregla todos los consumidores de una) + las inline sueltas. Conservar colores/tamaños/ring.
- Componentes badge (flip interno): `RowStatusPill.tsx:49`, `mercadolibre/ofertas/.../OfertaStatusBadge.tsx:49,70`, `mercadolibre/ofertas/.../PromoStatusBadge.tsx:46`, `CampanaStatusPill.tsx:26` (Fala), `_shared/janis/StatusBadge.tsx:29`, `_shared/janis/Chip.tsx:53` (deja el botón close circular).
- Inline sueltas: `CatalogoTable.tsx` (420,427,443,541,562,602,612,649,673,899), `MeliMapeoCategoriasBrowse.tsx:506,808`, `MeliMapeoAtributosBrowse.tsx:909`, `EditorLogsTab.tsx:70,91,300`, `EditorCalidadSection.tsx:157`, `MarketplaceProductosDetail.tsx:550`, `PublicarWizardView.tsx:312` (badge "Borrador" del header — además quitar el `bg-yellow-100` hardcodeado, usar tono del sistema).
- **NO tocar:** círculos puros (avatar/spinner/step `rounded-full` con h=w), progress bars lineales, el close `×` de Chip.
- Quick wins: voseo `BatchListView.tsx:104` ("creá"→"crea"); emojis crudos del wizard (`✓`, `{ }`) → icono lucide (`Check`, `Braces`/`Code`); Export/Import en `CatalogoView.tsx:124,132` con iconos distintos (`Download`/`Upload`); ocultar tabs "Comentarios"/"Logs" (`OfertasDetailView.tsx:204,225`) y botón "Descargar errores" (`CargaMasivaView.tsx:100-114`).
- **Aplicar/Guardar:** consolidar en "Guardar borrador" (`PublicarWizardView.tsx:130-148,355-369`): un solo botón con `handleGuardarBorrador` (toast + persistencia local ya existente); quitar el segundo.
- **Acceptance:** `tsc` 0 errores; cero `rounded-full` en badges de color del módulo (salvo círculos puros); 1 solo botón de borrador; sin voseo; tabs muertas ocultas.

### W2 — Header unificado
- Migrar **Dashboard** (`DashboardView.tsx:45-68`, hoy `JanisTopBar`) y **wizard Publicar** (`PublicarWizardView.tsx:302-394`, markup a mano) a **`EcommercePageHeader`** (eyebrow + título + badge por `tone` + `actions`).
- Resultado: 3 headers → 1.
- **Acceptance:** ambos usan `EcommercePageHeader`; `tsc` ok; sin markup de header duplicado.

### W3 — Dashboard
- `Kpi` (Janis) → **`MetricCard`** (`_shared/ui/MetricCard.tsx`, con icono lucide por KPI).
- Quitar KPI muerto **"Acciones pendientes"** (siempre 0) o reemplazar por una métrica real.
- Eliminar la tarjeta **"Pendiente backend"** con jerga (`/api/pim/dashboard/*`, `dashboard.html`) → empty-state limpio o nada.
- Chips de estado ad-hoc (`BatchesList`, `RecentProductsList`) → badge del sistema.
- Agregar **skeletons** de carga (el módulo ya tiene patrón en `CatalogoTable`).
- **Acceptance:** dashboard en OMS look, sin métrica muerta ni jerga, con loading state; `tsc` ok.

### W4 — Tablas compartidas
- Extraer/usar un componente de tabla con **skeleton + empty + error** (base: `CatalogoTable`/`DataTable`) y aplicarlo en `BatchListView`, `BatchDetailView`, `ProductosAPublicarView` (hoy `<table>` caseros pelados).
- Unificar tabs ad-hoc (BatchDetail, ProductosAPublicar) → `Tabs` global con badge counts (como Ofertas).
- Header de tabla: unificar lavanda `#E8EAF7` (token) entre `CampaignTable` (`bg-gray-50`) y `CatalogoTable`.
- **Acceptance:** las 3 vistas con tabla compartida (loading/empty/error); tabs unificadas; `tsc` ok.

### W5 — Iconos
- Estandarizar en **lucide-react**: reemplazar Heroicons (incl. sidebar `_shared/ecommerce-tabs.tsx:5-16`), `JanisIcon`, MUI por equivalentes lucide.
- Acciones de fila de tablas con icono (consistencia "tabla con iconos").
- **Acceptance:** una sola librería de iconos en el módulo; `tsc` ok; sin imports de heroicons/@mui/react-icons en el subárbol e-commerce.

---

## Verificación por wave
- `npx tsc --noEmit` desde la raíz del front → sin errores nuevos en los archivos tocados.
- Smoke visual del usuario entre waves (review gate).
- Sin commit (git del usuario).
