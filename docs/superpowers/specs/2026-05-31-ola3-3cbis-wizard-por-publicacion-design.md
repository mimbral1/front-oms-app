# Ola 3 · 3c-bis — Wizard de ofertas por publicación · Design

**Fecha:** 2026-05-31
**Estado:** Aprobado (brainstorming) — pendiente de plan de implementación.
**Repo:** `FrontOmsMimbral` (100% front). NO backend nuevo (reusa endpoints existentes). **Implica writes a ML** (al lanzar la campaña) — el código se escribe y se verifica con `tsc`, pero el **POST/PUT real lo prueba el usuario**.

---

## 1. Contexto

El wizard de crear oferta ML (`NuevaOfertaWizardView` → `WizardStep1Info`/`WizardStep2Skus`/`WizardStep3Review`) hoy selecciona **por SKU** y, al lanzar, inscribe **una** publicación por SKU (la del row del catálogo). Con el cimiento 1:N, un SKU tiene N publicaciones ML (clásica/catálogo/variación) y solo se inscribe la primaria.

**Hallazgo clave (verificado en `NuevaOfertaWizardView.handleSubmit`):** el camino de escritura **ya es per-`item_id`**:
1. `api.createCampaign({ name, promotion_type, start/finish })` → `newPromoId`.
2. `Promise.allSettled(skus.map(s => api.optInItem(s.item_id ?? s.sku, { promotion_id, promotion_type, deal_price, stock })))` con progreso por ítem.
3. Todo detrás del `LaunchConfirmModal` (gate humano: "Acción destructiva en MercadoLibre real" antes del POST).

Por lo tanto **3c-bis NO toca el camino de escritura**: cambia **qué contiene `skus`** (de 1 entrada por SKU → 1 entrada por publicación elegida). El loop `optInItem` y el modal de confirmación quedan intactos.

---

## 2. Alcance y decisiones (brainstorming)

- **A+ (alcance):** el Paso 2 muestra, por publicación, **checkbox + % off + rango creíble** (`min/max/suggested`). **Sin** el panel de alertas de superposición (eso vive en el Explorador 3c). El rango es cohesivo con el input de descuento (no acopla el concern de elegibilidad completo).
- **α (layout):** **fila de SKU expandible** (`DataTableExpandable`): la lista por SKU se mantiene; cada SKU se expande a sub-filas = sus publicaciones. Caso común (SKU con 1 publicación) se comporta como hoy.
- **Write path intacto:** `createCampaign` + loop `optInItem` + `LaunchConfirmModal` no cambian.

### Non-goals (futuros)
- **Validación dura** del % off contra el rango (bloquear submit): NO. Se **muestra** el rango y se marca en rojo si el precio nuevo cae fuera, pero no se bloquea — ML valida y el manejo de error existente (`humanizeApiError`) surfacea el rechazo.
- **Panel de alertas de superposición** en el wizard: NO (es 3c).
- **Flujo de invitaciones** (DEAL/MARKETPLACE desde "Disponibles"): fuera de alcance — esos candidatos ya vienen per-`item_id` de ML; 3c-bis es el flujo `createCampaign` (SELLER_CAMPAIGN/VOLUME/SELLER_COUPON_CAMPAIGN).

### Restricciones duras
- **Writes a ML gateados** por el `LaunchConfirmModal` existente (humano confirma); el usuario hace el testing real del POST/PUT. Yo solo escribo + `tsc`.
- **NO `git commit`** (el usuario maneja git).
- **Español neutro** (forma "tú"), nunca voseo. **Tipografía Inter** heredada del layout.
- **Componentes OMS reales**, sin "pills" (chip de tipo `rounded-md`; rango inline).
- No romper el wizard existente (Step 1, navegación, submit, confirm modal).

---

## 3. Arquitectura / flujo de datos

```
WizardStep2Skus (reescrito)
  ├─ useCatalogoList({status:'activos'})            → filas por SKU (lo de hoy)
  └─ al EXPANDIR / marcar un SKU (lazy, acotado):
       ├─ listPublicaciones(sku)   (3c, /publicaciones de 3b)  → publicaciones del SKU
       └─ por publicación: rango creíble
            ├─ getItemRange(itemId)        (cache del módulo, si ya se vio)
            └─ si no, listItemPromotions(itemId) (3c) → min/max/suggested  (+ cacheItemRangeIfPresent)
  → onChange(SelectedSku[])  // una entrada POR PUBLICACIÓN (keyada por item_id)

NuevaOfertaWizardView.handleSubmit  (INTACTO)
  → createCampaign → optInItem por cada SelectedSku (usa s.item_id) → confirm modal
```

**Acotación de llamadas:** publicaciones + rangos se traen **lazy, solo de los SKUs con los que interactúas** (expandir/marcar), no de todo el catálogo. Bounded.

**Backend:** ningún cambio. Reusa `listPublicaciones`/`listItemPromotions`/`getItemRange` (3c) + `useCatalogoList` + `createCampaign`/`optInItem`/`priceFromDiscount` (existentes).

---

## 4. Modelo de selección

`WizardStep2Skus` recibe/emite el mismo contrato (`selected: ReadonlyArray<SelectedSku>`, `onChange`, `globalDiscount`) — **el contrato con el padre no cambia**. Lo que cambia es la **granularidad**: cada `SelectedSku` ahora representa **una publicación**:
- `{ sku, item_id, name, price, stock, discount }` — `item_id` pasa a estar siempre presente (es la key).
- `selectedMap` se keya por **`item_id`** (no por `sku`), para que varias publicaciones del mismo SKU coexistan.
- `% off` (`discount`) es **por publicación** (default = `globalDiscount` del Paso 1).

**Checkbox del SKU (tristate):** refleja/controla todas las publicaciones del SKU — checked (todas), indeterminate (algunas), unchecked (ninguna). Marcar el SKU **carga sus publicaciones si hace falta** y selecciona todas; desmarcar las quita. Un SKU con **1 publicación** se comporta como hoy (marcar el SKU = inscribir esa publicación, sin necesidad de expandir).

`NuevaOfertaWizardView` y su `handleSubmit` no cambian: `canStep2 = skus.length > 0` ahora cuenta publicaciones; el loop `optInItem(s.item_id ?? s.sku, …)` inscribe cada publicación.

---

## 5. Front — piezas

Todo bajo `features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/`.

### 5.1 `components/WizardStep2Skus.tsx` (reescritura del picker)
- Reemplaza la `<table>` plana por **`DataTableExpandable`** (`@/components/ui/table/DataTableExpandable`).
- **Filas (SKU)** desde `useCatalogoList`: checkbox tristate del SKU + `sku`/`titulo` + `precio` + conteo de publicaciones (cuando se conoce) + chevron.
- **`renderDetail(sku)`** (expandido): sub-tabla de publicaciones del SKU (lazy `listPublicaciones`): por fila → checkbox + chip de tipo OMS (Clásica/Catálogo/Variación, ★ si `isPrimary`) + `item_id` (`CopyableText`) + input `% off` + `precio nuevo` (`priceFromDiscount`) + **rango creíble** `min–max` (sug.), en rojo si el precio nuevo cae fuera de `[min,max]`.
- Estado interno: un hook/util `useSkuPublicaciones` (o estado local) que cachea por SKU `{ publications, ranges, loading, error }` y se llena lazy al expandir/marcar.
- Conserva acciones útiles: "Limpiar" (vacía `selected`); "Solo seleccionados" (filtra SKUs con ≥1 publicación seleccionada). "Agregar visibles" se reinterpreta o se quita (decidir en plan; no inflar).

### 5.2 `helpers/wizard-publicaciones.ts` (nuevo, opcional)
- `rangeForItem(itemId): MlItemRange | null` — lee `getItemRange`, y si no hay, deja que el hook dispare `listItemPromotions` + `cacheItemRangeIfPresent` (que ya existe en `ofertas-api`).
- `isPriceInRange(newPrice, range): boolean` — para el flag rojo. Función pura.
(Si es trivial, puede vivir inline; el plan decide.)

### 5.3 `components/WizardStep3Review.tsx` (ajuste)
- La tabla de "SKUs a inscribir" pasa a **publicaciones**: `key={s.item_id}`, agrega chip de tipo + `item_id`. Stats por publicación (total = publicaciones). El resto (cards de meta) igual.

### 5.4 `views/NuevaOfertaWizardView.tsx` (INTACTO)
- Sin cambios. El `LaunchConfirmModal` ya dice "Se inscribirán N ítems"; con 3c-bis `N` cuenta publicaciones — el texto sigue siendo correcto.

---

## 6. Rango + validación (no bloqueante)
- Mostrar por publicación: `% off → precio nuevo` + `rango min–max` (+ `sug.` si viene).
- Si `precio_nuevo < min` o `> max` → marcar el rango en rojo con "⚠ bajo el mín / sobre el máx". **No se bloquea** el submit. ML valida en el `optInItem` y el rechazo se surfacea por el `progress.failed` + `submitError` existentes (`humanizeApiError`). Validación dura = mejora futura.

---

## 7. Manejo de errores / estados
- Expandir/marcar un SKU: `loading`/`error` por SKU; si `listPublicaciones` falla, la fila del SKU muestra el error con retry, sin tumbar el resto.
- Si `listItemPromotions` de una publicación falla, esa publicación se muestra **sin rango** (no bloquea seleccionarla; ML validará el precio).
- El gate destructivo (`LaunchConfirmModal`) y el manejo de fallos per-ítem del enroll (`Promise.allSettled` + `progress.failed`) quedan intactos.

---

## 8. Componentes reutilizados (verificados)
`DataTableExpandable` + `Column` (`@/components/ui/table` / `/table/DataTableExpandable`); `CopyableText`; el input `% off` y los estilos de tabla del `WizardStep2Skus` actual; `useCatalogoList`; `priceFromDiscount` (`helpers/pricing`); `listPublicaciones`/`listItemPromotions`/`getItemRange`/`cacheItemRangeIfPresent` (`ofertas-api`, de 3c); chip de tipo `rounded-md` (idiom de 3b/3c). Tipografía Inter heredada.

---

## 9. Testing / verificación
- **Front sin jest** → `npx tsc --noEmit` (desde la raíz, `node ./node_modules/typescript/bin/tsc --noEmit`; sin errores nuevos en los archivos tocados).
- Si se extraen helpers puros (`isPriceInRange`), son el target natural si más adelante hay jest.
- **El POST/PUT real (createCampaign + optInItem) lo prueba el usuario** — el `LaunchConfirmModal` ya es el gate humano.
- **Smoke visual** (con app + pim + meli-catalog): buscar un SKU con varias publicaciones → expandir → marcar publicaciones + % off → ver rango (y el flag rojo fuera de rango) → Paso 3 lista las publicaciones → "Lanzar campaña…" abre el confirm (NO confirmar en pruebas salvo que quieras tocar ML real).
- **Sin commits.**

---

## 10. File structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `…/ofertas/base/components/WizardStep2Skus.tsx` | Modify (reescritura del picker) | selección por publicación: SKU expandible (`DataTableExpandable`) → publicaciones con checkbox + % off + rango |
| `…/ofertas/base/components/WizardStep3Review.tsx` | Modify | tabla por publicación (`key=item_id`, chip tipo, item_id) |
| `…/ofertas/base/helpers/wizard-publicaciones.ts` | Create (opcional) | `rangeForItem` / `isPriceInRange` (puras) |
| `…/ofertas/base/hooks/useSkuPublicaciones.ts` | Create (si aplica) | cache lazy por SKU `{publications, ranges, loading, error}` |
| `…/ofertas/base/api/ofertas-api.ts` | (sin cambios) | `listPublicaciones`/`listItemPromotions`/`getItemRange` ya existen (3c) |
| `…/ofertas/base/views/NuevaOfertaWizardView.tsx` | (sin cambios) | enroll loop + confirm modal intactos |

`SelectedSku` (en `WizardStep2Skus.tsx`) gana `item_id` efectivamente requerido (ya es opcional en el tipo; el modelo lo trata como key).

---

## 11. Orden de implementación sugerido
1. Helpers puros (`isPriceInRange`, `rangeForItem`) + hook `useSkuPublicaciones` (lazy por SKU).
2. `WizardStep2Skus` reescrito (DataTableExpandable + sub-filas de publicaciones + % off + rango).
3. `WizardStep3Review` por publicación.
4. `tsc --noEmit` + smoke visual (sin confirmar el POST en pruebas).

## 12. Notas
- El enroll y el gate destructivo ya existen y no se tocan → el riesgo de 3c-bis es de UI/selección, no de escritura nueva.
- `listPublicaciones` + `listItemPromotions` + `getItemRange` ya están (3c) → reuso directo, sin backend.
- Deep-link futuro: desde el Explorador (3c) "inscribir esta publicación" podría abrir el wizard pre-seleccionado — fuera de 3c-bis.
