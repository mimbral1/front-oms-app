# Ola 3 · 3b — Tab "Publicaciones" en el Editor ML · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un tab "Publicaciones" (solo lectura + link a ML) al editor de producto ML, que lista las N publicaciones del SKU desde el endpoint 3a, vía un proxy nuevo en pim-service.

**Architecture:** Backend = proxy fino en pim-service del endpoint 3a de meli-catalog (cliente + handler en el facade + ruta). Front = nuevo tab auto-contenido `EditorPublicacionesTab` (gemelo de `EditorLogsTab`) alimentado por un hook `usePublicaciones`, cableado en `EditorView` solo para canal `mercadolibre`. Cero escrituras a ML (lista read-only + link-out).

**Tech Stack:** pim-service = Node CommonJS + Express + jest + supertest. FrontOms = Next.js 15 + React 18 + MUI + Tailwind + TypeScript (sin jest → verificación con `tsc --noEmit`).

**Spec:** `FrontOmsMimbral/docs/superpowers/specs/2026-05-31-ola3-3b-editor-publicaciones-design.md`

**⚠️ Restricciones duras:** NO POST/PUT/DELETE a ML (esto es read + link). NO romper el editor existente. **NO `git commit`** (el usuario maneja git → cada "commit" se reemplaza por verificación). UI en **español neutro** (forma "tú"). Reutilizar componentes existentes (sin "pills").

---

## File Structure

| # | Repo | Archivo | Acción | Responsabilidad |
|---|---|---|---|---|
| 1 | pim | `src/modules/integrations/meli-catalog/index.js` | Modify | cliente `getPublications(sku)` |
| 2 | pim | `src/routes/channel-facade.controller.js` | Modify | handler `getPublications` (guard canal + passthrough) |
| 2 | pim | `src/routes/canales.routes.js` | Modify | ruta `GET /:channel/productos/:sku/publicaciones` (es el router REALMENTE montado en `routes/index.js`; `channel-products.routes.js` es código muerto) |
| 2 | pim | `src/tests/routes/channel-facade.getPublications.test.js` | Create | test del handler (mock integraciones) |
| 3 | front | `…/editor/base/types/editor-types.ts` | Modify | `EditorPublicacion` + `EditorTabId += "publicaciones"` |
| 4 | front | `…/editor/base/api/editor-api.ts` | Modify | `fetchPublicaciones(sku)` + `CANALES_ML` |
| 5 | front | `…/editor/base/ml-publication-status.ts` | Create | `registerStatusMap("ml", …)` |
| 6 | front | `…/editor/base/hooks/usePublicaciones.ts` | Create | hook de datos (1 fetch, `enabled`) |
| 7 | front | `…/editor/base/tabs/EditorPublicacionesTab.tsx` | Create | tab lista (`DataTable`) |
| 8 | front | `…/editor/base/views/EditorView.tsx` | Modify | wire tab + hook + `badgeCount` |

`…/editor/base/` = `C:\Users\JoaquinRodriguez\Desktop\FrontOmsMimbral\features\catalogo\pages\plataforma-ecommerce\shared\editor\base`
pim raíz = `C:\Users\JoaquinRodriguez\Desktop\Microservicios\pim-service`

**Orden:** Tareas 1-2 (pim, desbloquean el front) → 3-8 (front). El front no compila contra pim en build, así que puede hacerse en paralelo, pero el smoke real necesita pim corriendo.

---

## Task 1: pim-service — cliente `getPublications`

**Files:**
- Modify: `pim-service/src/modules/integrations/meli-catalog/index.js`

- [ ] **Step 1: Agregar la función**

En `meli-catalog/index.js`, JUSTO DESPUÉS de `getPublishStatus` (la fn que hace `${ML}/productos/${sku}/publicacion`), agregar:

```js
// Las N publicaciones del SKU (junction ml_sku_items, vía 3a en meli-catalog).
// unwrap=false: el endpoint devuelve el envelope entero { ok, channel, sku, publications:[...] }
// y el facade lo hace passthrough al front (no desempaquetar .data).
async function getPublications(sku) {
  return requestJson('GET', `${ML}/productos/${encodeURIComponent(sku)}/publicaciones`, undefined, { unwrap: false });
}
```

- [ ] **Step 2: Exportarla**

En el `module.exports` del mismo archivo, agregar `getPublications,` justo después de `getPublishStatus,`:

```js
module.exports = {
  listProductos,
  getProductoBySku,
  getProductoDetalle,
  getProductoCalidad,
  getPublishStatus,
  getPublications,
  publish,
  // … (resto sin cambios)
```

- [ ] **Step 3: Verificar sintaxis (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/Microservicios/pim-service && node --check src/modules/integrations/meli-catalog/index.js`
Expected: sin output (OK).

---

## Task 2: pim-service — handler facade + ruta + test (TDD)

**Files:**
- Create: `pim-service/src/tests/routes/channel-facade.getPublications.test.js`
- Modify: `pim-service/src/routes/channel-facade.controller.js`
- Modify: `pim-service/src/routes/canales.routes.js` (router montado; NO `channel-products.routes.js`, que está huérfano)

- [ ] **Step 1: Escribir el test que falla**

Crear `pim-service/src/tests/routes/channel-facade.getPublications.test.js`:

```js
'use strict';

// El facade hace `const { meliCatalog } = require('../modules/integrations')`.
// Mockeamos la barra entera; solo getPublications nos interesa.
jest.mock('../../modules/integrations', () => ({
  meliCatalog: { getPublications: jest.fn() },
}));

const channelCtl = require('../../routes/channel-facade.controller');
const { meliCatalog } = require('../../modules/integrations');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.clearAllMocks());

describe('channel-facade.controller getPublications', () => {
  it('mercadolibre → passthrough del envelope de meli-catalog', async () => {
    const envelope = {
      ok: true, channel: 'mercadolibre', sku: '048003122',
      publications: [{ itemId: 'MLC1', isPrimary: true }],
    };
    meliCatalog.getPublications.mockResolvedValueOnce(envelope);
    const req = { params: { channel: 'mercadolibre', sku: '048003122' } };
    const res = mockRes();

    await channelCtl.getPublications(req, res, jest.fn());

    expect(meliCatalog.getPublications).toHaveBeenCalledWith('048003122');
    expect(res.json).toHaveBeenCalledWith(envelope);
  });

  it('canal != mercadolibre → 400 NOT_SUPPORTED, sin llamar al client', async () => {
    const req = { params: { channel: 'falabella', sku: 'X' } };
    const res = mockRes();

    await channelCtl.getPublications(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false, code: 'NOT_SUPPORTED' }));
    expect(meliCatalog.getPublications).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test → debe FALLAR**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/Microservicios/pim-service && npx jest src/tests/routes/channel-facade.getPublications.test.js`
Expected: FAIL — `channelCtl.getPublications is not a function`.

- [ ] **Step 3: Implementar el handler**

En `channel-facade.controller.js`:

(a) Agregar el require de integraciones junto a los otros requires del tope (después de `const productosCtl = require('../modules/products/http/products.controller');`):

```js
const { meliCatalog } = require('../modules/integrations');
```

(b) Agregar el handler JUSTO ANTES de `module.exports` (espejo del guard de `/moderacion` y del passthrough de meli-catalog):

```js
const getPublications = asyncHandler(async (req, res) => {
  const channel = req.params.channel?.toLowerCase();
  if (channel !== 'mercadolibre') {
    return res.status(400).json({
      ok: false,
      code: 'NOT_SUPPORTED',
      message: 'Listar publicaciones solo está disponible para mercadolibre',
    });
  }
  const { sku } = req.params;
  // meli-catalog 3a ya devuelve el envelope normalizado { ok, channel, sku, publications:[...] }.
  const result = await meliCatalog.getPublications(sku);
  res.json(result);
});
```

(c) Agregar `getPublications` al `module.exports`:

```js
module.exports = {
  listProducts,
  getProduct,
  getQuality,
  publish,
  retry,
  getPublishStatus,
  getPublications,
};
```

- [ ] **Step 4: Correr el test → debe PASAR**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/Microservicios/pim-service && npx jest src/tests/routes/channel-facade.getPublications.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Registrar la ruta (en el router MONTADO)**

⚠️ El router que `routes/index.js` monta en `/canales` es **`canales.routes.js`** (no `channel-products.routes.js`, que quedó huérfano tras la consolidación del 28-may y NO se requiere en ningún lado). `canales.routes.js` ya importa `channelCtl = require('./channel-facade.controller')` y define ahí `/productos/:sku/calidad` (línea ~162). Agregar JUSTO DESPUÉS de esa línea de `/calidad`:

```js
// Ola 3·3b — las N publicaciones del SKU (junction ml_sku_items, solo lectura). Hermana de /publicacion.
router.get('/:channel/productos/:sku/publicaciones', asyncHandler(channelCtl.getPublications));
```

- [ ] **Step 6: Verificar (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/Microservicios/pim-service && node --check src/routes/channel-facade.controller.js && node --check src/routes/channel-products.routes.js`
Expected: sin output (OK ambos).

Run (boot-smoke del router): `cd /c/Users/JoaquinRodriguez/Desktop/Microservicios/pim-service && node -e "require('./src/routes/channel-products.routes'); console.log('routes OK')"`
Expected: imprime `routes OK`.

Run (regresión): `cd /c/Users/JoaquinRodriguez/Desktop/Microservicios/pim-service && npx jest src/tests/routes/channel-facade.getPublications.test.js`
Expected: 2 passed. **No `git commit`.**

---

## Task 3: front — tipo `EditorPublicacion` + `EditorTabId`

**Files:**
- Modify: `…/editor/base/types/editor-types.ts`

- [ ] **Step 1: Extender `EditorTabId`**

En `editor-types.ts`, reemplazar la unión `EditorTabId` para incluir `"publicaciones"`:

```ts
export type EditorTabId =
    | "info"
    | "imagenes"
    | "descripcion"
    | "atributos"
    | "calidad"
    | "publicaciones"
    | "logs";
```

- [ ] **Step 2: Agregar la interface `EditorPublicacion`**

En `editor-types.ts`, agregar (al final del archivo, o junto a los demás exports):

```ts
/**
 * Una publicación ML de un SKU (junction ml_sku_items, contrato 3a).
 * GET /api/pim/canales/mercadolibre/productos/:sku/publicaciones → { publications: EditorPublicacion[] }
 */
export interface EditorPublicacion {
    itemId: string;
    isPrimary: boolean;
    isCatalogListing: boolean;
    catalogProductId: string | null;
    variationId: string | null;
    inventoryId: string | null;
    userProductId: string | null;
    itemStatus: string | null;    // active | paused | closed | under_review | inactive
    logisticType: string | null;  // fulfillment | self_service | cross_docking | ...
    publishStatus: string | null;
    performance: { score: number; level: string | null } | null;
}
```

- [ ] **Step 3: Verificar tipos (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && npx tsc --noEmit`
Expected: sin errores NUEVOS en `editor-types.ts` (ignorar errores preexistentes en archivos no tocados, si los hubiera).

---

## Task 4: front — `fetchPublicaciones` en `editor-api.ts`

**Files:**
- Modify: `…/editor/base/api/editor-api.ts`

- [ ] **Step 1: Importar el tipo**

En `editor-api.ts`, agregar `EditorPublicacion` al import de tipos existente desde `../types/editor-types`:

```ts
import type {
    EditorAuditEntry,
    EditorCalidad,
    EditorProduct,
    EditorPublicacion,
    EditorSavePatch,
    EditorSaveResult,
} from "../types/editor-types";
```

- [ ] **Step 2: Agregar la base de canales**

Justo después de `const API_BASE = …` (línea ~46), agregar:

```ts
/** Base de la familia /canales (proxy pim → meli-catalog). El endpoint de
 *  publicaciones (3b) vive acá, no bajo /productos. */
const CANALES_ML = `${URL_PIM_SERVICE}/api/pim/canales/mercadolibre/productos`;
```

- [ ] **Step 3: Declarar el método en la interface `EditorApi`**

En la interface `EditorApi`, agregar (después de `fetchAuditLog`):

```ts
    /**
     * GET /api/pim/canales/mercadolibre/productos/:sku/publicaciones — las N
     * publicaciones ML del SKU (clásica + catálogo + variaciones). Solo lectura.
     */
    fetchPublicaciones: (sku: string) => Promise<EditorPublicacion[]>;
```

- [ ] **Step 4: Implementar el método**

Dentro del objeto que retorna `useEditorApi` (junto a `fetchAuditLog`), agregar:

```ts
            fetchPublicaciones: async (sku: string) => {
                const url = `${CANALES_ML}/${encodeURIComponent(sku)}/publicaciones`;
                const t = pickToken(token);
                const r = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(t ? { Authorization: `Bearer ${t}` } : {}),
                    },
                    cache: "no-store",
                });
                const json = await r.json().catch(() => ({}));
                if (!r.ok) {
                    const err = new Error(
                        json?.message || `HTTP ${r.status} ${r.statusText}`,
                    ) as EditorApiError;
                    err.status = r.status;
                    err.code = json?.code;
                    throw err;
                }
                // Envelope 3a: { ok, channel, sku, publications:[...] }
                return Array.isArray(json?.publications)
                    ? (json.publications as EditorPublicacion[])
                    : [];
            },
```

- [ ] **Step 5: Verificar tipos (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && npx tsc --noEmit`
Expected: sin errores nuevos en `editor-api.ts`.

---

## Task 5: front — registry de estados ML

**Files:**
- Create: `…/editor/base/ml-publication-status.ts`

- [ ] **Step 1: Crear el archivo de registro**

Crear `…/editor/base/ml-publication-status.ts`:

```ts
// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/ml-publication-status.ts
//
// Registra el dominio "ml" en el status-registry global para los estados de
// item de MercadoLibre. Import con efecto secundario desde EditorPublicacionesTab.
// registerStatusMap mergea (idempotente) — si otro módulo ya registró "ml", esto suma.

import { registerStatusMap } from "@/components/ui/badge/status-registry";

registerStatusMap("ml", {
    active:       { variant: "active",   label: "Activo" },
    paused:       { variant: "inactive", label: "Pausado" },
    closed:       { variant: "error",    label: "Cerrado" },
    under_review: { variant: "review",   label: "En revisión" },
    inactive:     { variant: "inactive", label: "Inactivo" },
});
```

(Las keys se guardan en minúscula y `StatusBadge` resuelve con `status.toLowerCase()`, así que matchean los valores crudos de ML `active`/`paused`/etc.)

- [ ] **Step 2: Verificar tipos (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && npx tsc --noEmit`
Expected: sin errores nuevos.

---

## Task 6: front — hook `usePublicaciones`

**Files:**
- Create: `…/editor/base/hooks/usePublicaciones.ts`

- [ ] **Step 1: Crear el hook**

Crear `…/editor/base/hooks/usePublicaciones.ts`:

```ts
// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/hooks/usePublicaciones.ts
//
// Hook de datos del tab "Publicaciones" — un solo fetch del endpoint 3a (vía pim).
// EditorView lo consume para el badgeCount del tab y le pasa los datos al tab
// (que es presentacional, sin re-fetch). Sólo dispara si `enabled` (canal ML).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorApi } from "../api/editor-api";
import type { EditorPublicacion } from "../types/editor-types";

export interface UsePublicacionesReturn {
    publications: EditorPublicacion[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function usePublicaciones(
    sku: string,
    opts: { enabled: boolean },
): UsePublicacionesReturn {
    const api = useEditorApi();
    const enabled = opts.enabled;
    const [publications, setPublications] = useState<EditorPublicacion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const skuRef = useRef(sku);
    useEffect(() => {
        skuRef.current = sku;
    }, [sku]);

    const reload = useCallback(async () => {
        if (!enabled || !skuRef.current) return;
        setLoading(true);
        setError(null);
        try {
            const rows = await api.fetchPublicaciones(skuRef.current);
            setPublications(rows);
        } catch (e) {
            setError(
                (e as Error)?.message || "No se pudieron cargar las publicaciones.",
            );
            setPublications([]);
        } finally {
            setLoading(false);
        }
    }, [api, enabled]);

    useEffect(() => {
        if (enabled && sku) void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sku, enabled]);

    return { publications, loading, error, reload };
}
```

- [ ] **Step 2: Verificar tipos (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && npx tsc --noEmit`
Expected: sin errores nuevos.

---

## Task 7: front — `EditorPublicacionesTab`

**Files:**
- Create: `…/editor/base/tabs/EditorPublicacionesTab.tsx`

- [ ] **Step 1: Crear el componente**

Crear `…/editor/base/tabs/EditorPublicacionesTab.tsx`:

```tsx
// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorPublicacionesTab.tsx
//
// Tab "Publicaciones" del editor ML — lista las N publicaciones del SKU
// (clásica / catálogo / variación) en solo lectura. La primaria tiene "Editar →"
// que salta al tab Info; el resto enlaza a ML. Cero escrituras.
//
// Gemelo de EditorLogsTab: tab auto-contenido, DataTable + estados loading/error/empty.

"use client";

import { useMemo } from "react";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ExternalLink, Pencil } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { Alert } from "@/components/ui/alert/Alert";
import { CopyableText } from "@/components/ui/copyable-text/CopyableText";
import type { EditorPublicacion } from "../types/editor-types";
import "../ml-publication-status"; // efecto secundario: registra el dominio "ml"

/* ── helpers ───────────────────────────────────────────────── */

/** Tipo de publicación (chip rounded-md con borde, idiom OMS — NO pill). */
function tipoOf(p: EditorPublicacion): { label: string; cls: string } {
    if (p.isCatalogListing)
        return { label: "Catálogo", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (p.variationId)
        return { label: "Variación", cls: "bg-orange-50 text-orange-700 border-orange-200" };
    return { label: "Clásica", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
}

const LOGISTICA: Record<string, string> = {
    fulfillment: "FULL",
    self_service: "Flex",
    cross_docking: "Colecta",
    drop_off: "Acordado",
    xd_drop_off: "Acordado",
};
function logisticaLabel(t: string | null): string {
    return t ? LOGISTICA[t] ?? t : "—";
}

/** URL pública best-effort: ML redirige MLC-<dígitos> al permalink real. */
function mlUrl(itemId: string): string {
    return `https://articulo.mercadolibre.cl/MLC-${itemId.replace(/^MLC/i, "")}`;
}

/* ── props ─────────────────────────────────────────────────── */

export interface EditorPublicacionesTabProps {
    publications: EditorPublicacion[];
    loading: boolean;
    error: string | null;
    reload: () => void;
    /** Salta al tab Info (editar la publicación primaria, que es la que carga el editor). */
    onEditarPrimaria: () => void;
}

export function EditorPublicacionesTab({
    publications,
    loading,
    error,
    reload,
    onEditarPrimaria,
}: EditorPublicacionesTabProps) {
    const columns: Column<EditorPublicacion>[] = useMemo(
        () => [
            {
                header: "Tipo",
                accessorKey: "isCatalogListing",
                cell: (p) => {
                    const t = tipoOf(p);
                    return (
                        <span className="inline-flex items-center gap-1.5">
                            {p.isPrimary && (
                                <span title="Publicación primaria" className="text-amber-500">
                                    ★
                                </span>
                            )}
                            <span
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${t.cls}`}
                            >
                                {t.label}
                            </span>
                        </span>
                    );
                },
            },
            {
                header: "Publicación",
                accessorKey: "itemId",
                cell: (p) => (
                    <CopyableText text={p.itemId} className="text-sm text-gray-700">
                        <code className="tabular-nums">{p.itemId}</code>
                    </CopyableText>
                ),
            },
            {
                header: "Estado",
                accessorKey: "itemStatus",
                cell: (p) => (
                    <StatusBadge status={p.itemStatus ?? "inactive"} domain="ml" />
                ),
            },
            {
                header: "Logística",
                accessorKey: "logisticType",
                cell: (p) => (
                    <span className="text-sm text-gray-700">
                        {logisticaLabel(p.logisticType)}
                    </span>
                ),
            },
            {
                header: "Performance",
                accessorKey: "performance",
                cell: (p) =>
                    p.performance ? (
                        <span
                            title={p.performance.level ?? undefined}
                            className="text-sm font-semibold text-emerald-700 tabular-nums"
                        >
                            {p.performance.score}
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400">—</span>
                    ),
            },
            {
                header: "Acción",
                accessorKey: "itemId",
                cell: (p) =>
                    p.isPrimary ? (
                        <button
                            type="button"
                            onClick={onEditarPrimaria}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                        >
                            <Pencil className="h-4 w-4" />
                            Editar
                        </button>
                    ) : (
                        <a
                            href={mlUrl(p.itemId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                        >
                            Ver en ML
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    ),
            },
        ],
        [onEditarPrimaria],
    );

    // ── loading ──
    if (loading) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando publicaciones…
                </div>
            </div>
        );
    }

    // ── error ──
    if (error) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="bg-rose-50 border-l-4 border-rose-400 p-4 text-rose-700 rounded-md">
                    <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-rose-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">
                                Error al cargar las publicaciones
                            </h3>
                            <p className="mt-1 text-sm">{error}</p>
                            <button
                                onClick={reload}
                                className="mt-3 rounded-md bg-rose-100 px-2 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-200"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── empty ──
    if (publications.length === 0) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-sm text-gray-500">
                    Este SKU no tiene publicaciones en MercadoLibre.
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            <Alert variant="info" title="Publicaciones del SKU en MercadoLibre">
                Las publicaciones de catálogo y las variaciones son de solo lectura — su
                ficha se gestiona en MercadoLibre. La publicación clásica se edita en la
                pestaña Información.
            </Alert>
            <DataTable
                data={publications}
                columns={columns}
                dataType="Publicaciones"
                rowPaddingY={12}
                rowBgClass="bg-white"
            />
        </div>
    );
}
```

- [ ] **Step 2: Verificar tipos (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && npx tsc --noEmit`
Expected: sin errores nuevos en `EditorPublicacionesTab.tsx`. Si `DataTable`/`Column` exigen props extra, ajustar mirando `EditorLogsTab.tsx` (mismo uso) — NO cambiar la firma de `DataTable`.

---

## Task 8: front — wire en `EditorView`

**Files:**
- Modify: `…/editor/base/views/EditorView.tsx`

- [ ] **Step 1: Imports**

(a) Agregar `useMemo` al import de React:
```tsx
import { useCallback, useMemo, useState } from "react";
```
(b) Agregar `Layers` al import de `lucide-react` (junto a los demás iconos):
```tsx
    Image as ImageIcon,
    Info,
    Layers,
    RefreshCw,
```
(c) Agregar los imports del tab y el hook (junto a los otros tabs/hook):
```tsx
import { EditorPublicacionesTab } from "../tabs/EditorPublicacionesTab";
import { usePublicaciones } from "../hooks/usePublicaciones";
```

- [ ] **Step 2: Resolver canal + llamar al hook**

Dentro de `EditorView`, después de `const [tab, setTab] = useSessionStorageState…`, agregar:

```tsx
    const mlKey = resolveMarketplaceKey(platform.name);
    const {
        publications,
        loading: pubsLoading,
        error: pubsError,
        reload: pubsReload,
    } = usePublicaciones(sku, { enabled: mlKey === "ml" });
```

(`resolveMarketplaceKey` ya está importado y usado más abajo; reusar la misma fn.)

- [ ] **Step 3: Construir el array de tabs condicional**

El `const TABS: TabItem[]` actual es módulo-level (sin "publicaciones"). Dejarlo como base y construir el array mostrado dentro del componente, justo antes del `return`:

```tsx
    // Tab "Publicaciones" solo para ML; se inserta antes de "Logs" con el conteo.
    const tabs = useMemo<TabItem[]>(() => {
        if (mlKey !== "ml") return TABS;
        const out = [...TABS];
        const logsIdx = out.findIndex((t) => t.id === "logs");
        const pubTab: TabItem = {
            id: "publicaciones",
            label: "Publicaciones",
            icon: Layers,
            badgeCount: publications.length,
        };
        if (logsIdx >= 0) out.splice(logsIdx, 0, pubTab);
        else out.push(pubTab);
        return out;
    }, [mlKey, publications.length]);
```

- [ ] **Step 4: Usar `tabs` en el `<Tabs>`**

Cambiar el render del tab bar (dentro del `<div className="bg-white px-6 border-b …">`) de `tabs={TABS}` a `tabs={tabs}`:

```tsx
                <Tabs
                    tabs={tabs}
                    value={tab}
                    onChange={(id) => setTab(id as EditorTabId)}
                />
```

- [ ] **Step 5: Agregar el branch de contenido**

En la zona de contenido por tab (junto a `{tab === "logs" && …}`), agregar el branch de publicaciones (antes o después de logs):

```tsx
                {tab === "publicaciones" && (
                    <EditorPublicacionesTab
                        publications={publications}
                        loading={pubsLoading}
                        error={pubsError}
                        reload={pubsReload}
                        onEditarPrimaria={() => setTab("info")}
                    />
                )}
```

- [ ] **Step 6: Verificar tipos + build mental (NO commit)**

Run: `cd /c/Users/JoaquinRodriguez/Desktop/FrontOmsMimbral && npx tsc --noEmit`
Expected: sin errores nuevos en `EditorView.tsx`.

---

## Verificación de éxito (todo el plan)
- pim: `npx jest src/tests/routes/channel-facade.getPublications.test.js` → 2 passed; `node --check` OK en los 3 archivos; boot-smoke del router OK.
- front: `npx tsc --noEmit` sin errores nuevos en los 6 archivos tocados.
- Cero cambios en meli-catalog (3a intacto). Cero escrituras a ML. **Sin `git commit`.**
- **Smoke visual (manual, con pim + front + meli-catalog corriendo):**
  1. Abrir el editor de un SKU ML con varias publicaciones → aparece el tab "Publicaciones · N".
  2. La lista muestra Tipo (Clásica/Catálogo/Variación, ★ en la primaria), `item_id` copiable, Estado (badge), Logística, Performance.
  3. "Editar →" en la primaria salta al tab Info; "Ver en ML ↗" abre la publicación.
  4. SKU sin publicaciones → empty-state. Canal Falabella/VTEX → el tab NO aparece.

---

## Notas de implementación
- **Sin jest en el front:** el ciclo TDD red→green aplica solo a pim (Task 2). Las tareas de front se validan con `tsc --noEmit` + el smoke visual final.
- **`tsc --noEmit`** puede listar errores preexistentes en archivos no tocados; el criterio es **no introducir errores nuevos** en los archivos de este plan.
- Si `DataTable`/`Column` o `StatusBadge`/`Alert`/`CopyableText` exponen sus props desde un barrel distinto al usado acá, alinear el import con el de `EditorLogsTab.tsx` / `EditorResumenTab.tsx` — sin cambiar las firmas de los componentes compartidos.
