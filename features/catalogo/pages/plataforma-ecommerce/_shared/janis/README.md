# `_shared/janis/` — átomos visuales del rediseño Janis

Set de componentes-átomo que implementan el **design language Janis** del subárbol `Catálogo > Plataforma de ecommerce` del OMS Mimbral 360.

## ¿Por qué viven acá y no en `components/ui/` global?

El OMS usa la paleta institucional Mimbral (`navy #14365e` + `rojo #c8202d`, Helvetica). El subárbol "Plataforma de ecommerce" usa la paleta **Janis** (`blue-700 #1d4ed8` + `pink-500 #ec4899`, Inter). Mezclar las dos en `components/ui/` corrompería el sistema global.

**Decisión vinculante** (`docs/MIGRATION_PLAN.md` §3.2): los átomos Janis viven solo en este path. Si en el futuro se demuestra que algún átomo (ej. `Kpi`) sirve para otra sección del OMS, se promueve **uno a uno** a `components/ui/` con variante `tone="janis"`.

## Inventario

| Átomo | Función | Mockup origen |
|---|---|---|
| `JanisTopBar` | Eyebrow + h1 + status badge + acciones | dashboard.html, atributos.html |
| `JanisTabs` | Barra de tabs horizontal con underline azul | atributos.html |
| `JanisStepsHeader` | Variante de tabs para wizards (1·2·3·4 + estado done) | publicar.html |
| `Sec` | Divisor "SECCIÓN" con icono + UPPERCASE + línea | todos |
| `Field` | Row label + control (`160px 1fr`) | atributos.html, publicar.html |
| `UnderlineInput` | Input borderless con border-b azul en focus | publicar.html |
| `Sel` | Select-like presentacional (valor + chevron) | publicar.html |
| `Chip` | Pill removable con X | publicar.html |
| `PillBtn` | Botón rounded-full (5 variantes: primary, success, success-outline, ghost, danger) | publicar.html |
| `ProgressItem` | Checkpoint vertical con 3 estados (done/active/pending) | publicar.html |
| `Kpi` | Tarjeta KPI con label, valor, delta opcional | dashboard.html |
| `Card` | Wrapper con shadow sutil y border-radius Janis | uso general |
| `StatusBadge` | Pill de estado con tonos predefinidos (live/draft/paused/error) | uso general |
| `JanisIcon` | Wrapper SVG con set de ~30 iconos por nombre | uso general |

## Tokens

`tokens.ts` exporta los colores, tipografía, radios y mapeos de clases. Usar SIEMPRE estos valores en código nuevo — no hardcodear hex en JSX.

## Playground

`app/(dev)/janis-playground/page.tsx` monta todos los átomos en una galería visual para QA. Solo accesible en dev (route group `(dev)`).

## Convenciones

1. **Naming**: todos empiezan con `Janis*` cuando son cabecera/chrome (TopBar, Tabs, StepsHeader, Icon). El resto son nombres genéricos (Sec, Field, ...) porque su rol es claro dentro del subárbol.
2. **Props mínimas**: cada átomo expone solo las props imprescindibles. Si una página necesita más control, componer en vez de extender el átomo.
3. **No estilos hardcoded en consumers**: si necesitas un color/tamaño que no está, agregar el token primero y consumirlo desde ahí.
4. **Server components-safe**: los átomos que NO usan handlers (Sec, Field, Card, StatusBadge, ProgressItem, Kpi, JanisIcon) NO tienen `"use client"` y se pueden renderizar en server. Los que sí (TopBar/Tabs/StepsHeader/PillBtn/Sel/Chip/UnderlineInput) llevan el directive porque toman onClick/onChange.

## Cuándo NO usar estos átomos

- **En el resto del OMS** (Pedidos, Almacén, Finanzas, etc.) → usar `components/ui/` global.
- **En el sidebar global** o en cualquier layout fuera de `app/catalogo/plataforma-ecommerce/**` → mismo: `components/ui/`.
- **En un app standalone** (Storybook, herramientas de mantenimiento) que no comparta paleta con la marca Mimbral.

## Referencias

- Plan completo: `docs/MIGRATION_PLAN.md`
- Mockups origen: `Mimbral Mercadolibre/*.html`
- Decisión #2 (containment): `docs/MIGRATION_PLAN.md` §3.2
