# FrontOmsMimbral

Aplicación de escritorio para la gestión de pedidos, picking, clientes y delivery.

## Estructura del Proyecto

```
src/
  app/                                # Next.js (si usas App Router)
    (routes...)

  components/
    ui/
      button/
        Button.tsx
        button.styles.ts
        index.ts

      icon-button/
        IconButton.tsx
        index.ts

      badge/
        StatusBadge.tsx
        statusBadge.styles.ts
        index.ts

      tabs/
        Tabs.tsx
        tabs.styles.ts
        index.ts

      pagination/
        Pagination.tsx
        usePaginationRange.ts
        index.ts

      page-header/
        PageHeader.tsx
        index.ts

      toolbar/
        Toolbar.tsx
        index.ts

      table/
        DataTable.tsx               # si tu DataTable es genérica y reutilizable
        index.ts

      modal/
        Modal.tsx
        index.ts

      alert/
        Alert.tsx
        index.ts

      empty-state/
        EmptyState.tsx
        index.ts

    presets/
      buttons/
        NewButton.tsx
        ExportButton.tsx
        FiltersButton.tsx
        ApplyButton.tsx
        SaveButton.tsx
        SaveAndNewButton.tsx
        CancelButton.tsx
        index.ts

      status/
        OrderStatusBadge.tsx
        PickingStatusBadge.tsx
        index.ts

    ui.ts                             # barrel export global (opcional)
    presets.ts                        # barrel export global (opcional)

  features/
    pedidos/
      pages/
        ListadoPedidosView.tsx

      components/
        PedidosHeader.tsx
        PedidosInlineFilters.tsx
        PedidosTable.tsx
        BulkActionsModal.tsx

        columns/
          pedidos.columns.tsx

        cells/
          OrderIdCell.tsx
          CustomerCell.tsx
          DeliveryCell.tsx
          PickingCell.tsx
          TotalsCell.tsx
          StatusCell.tsx

      hooks/
        usePedidosListController.ts
        useOrderStatusOptions.ts
        useSalesChannelOptions.ts
        useWarehousesMap.ts

      services/
        exportPedidosCsv.ts
        status.ts                     # normaliza + mapea a tone
        filters.ts                    # UI filters -> ApiFilters
        selection.ts                  # helpers de selección (si aplica)

      types/
        pedido.ts                     # tipos de dominio (Pedido)
        filters.ts                    # tipos de filtros UI

      index.ts                        # exports públicos del feature

    picking/
      pages/
        ListadoRondasView.tsx
      components/
        PickingHeader.tsx
        PickingTable.tsx
        columns/
        cells/
      hooks/
      services/
      types/
      index.ts

  stores/
    pedidos.store.ts                  # si usas zustand, etc.

  lib/
    http/
      client.ts                       # fetchWithAuth / interceptors
    format/
      money.ts
      date.ts

  utils/
    (helpers genéricos si no son de un feature)
```

## Características Principales

### Módulo de Pedidos

- **Lista de Pedidos**

  - Visualización y filtrado de pedidos
  - Estados: Pendiente, En Proceso, Completado, Cancelado
  - Información detallada: cliente, items, fechas, prioridad

- **Nuevo Pedido**

  - Formulario de creación con validaciones
  - Gestión de información del cliente
  - Agregar/eliminar items
  - Configuración de entrega

- **Faltantes**
  - Seguimiento de productos faltantes
  - Priorización y estados
  - Reportes y exportación

### Módulo de Picking

- **Rondas de Picking**

  - Asignación de pickers
  - Seguimiento de progreso
  - Estados y métricas

- **Olas de Picking**

  - Creación y gestión de olas
  - Agrupación de pedidos
  - Control de inventario

- **Productividad**
  - Métricas por picker
  - Tiempos y eficiencia
  - Reportes detallados

### Módulo de Delivery

- **Rutas**

  - Planificación de rutas
  - Asignación de transportistas
  - Seguimiento en tiempo real

- **Envíos**

  - Control de estado
  - Información de entrega
  - Gestión de incidencias

- **Transportistas**
  - Registro y gestión
  - Configuración de disponibilidad
  - Métricas de rendimiento

## Tecnologías

- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Shadcn UI
- React Query

## Instalación

1. Clonar el repositorio:

```bash
git clone [URL_DEL_REPOSITORIO]
```

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar en desarrollo:

```bash
npm run dev
```

## Variables de Entorno

- `NEXT_PUBLIC_URL_BASE` y `NEXT_PUBLIC_URL_BASE_QA`: base principal del gateway/API.
- `NEXT_PUBLIC_URL_BASE_WAREHOUSES`: base de warehouses sin el sufijo `/api`.
- `NEXT_PUBLIC_JANIS_API_KEY`, `NEXT_PUBLIC_JANIS_API_SECRET`, `NEXT_PUBLIC_JANIS_CLIENT`: credenciales Janis leídas desde entorno. No deben quedar hardcodeadas en pantallas ni helpers.

## Convenciones

- Nombres de archivos en kebab-case
- Componentes en PascalCase
- Hooks prefijados con 'use'
- Tipos y interfaces en PascalCase

## Estructura de Módulos

Cada módulo sigue una estructura consistente:

```
features/
  modulo/
    pages/        # pantallas del módulo; componen la vista y conectan componentes + hooks
    components/   # componentes propios del módulo
    hooks/        # hooks del módulo; manejan estado, controller y lógica de interacción
    services/     # llamadas API, mapeos, helpers de negocio y lógica pura del módulo
    types/        # tipos e interfaces del dominio del módulo
    index.ts      # punto de entrada público del módulo; exporta lo que se permite usar desde fuera
```

## Contribución

1. Crear una rama para la feature
2. Implementar cambios siguiendo las convenciones
3. Asegurar que el código pase el linting
4. Crear un Pull Request con descripción detallada

## Scripts Disponibles

- `npm run dev`: Desarrollo local
- `npm run build`: Compilación
- `npm run start`: Producción
- `npm run lint`: Verificación de código con ESLint
- `npm run typecheck`: Verificación de tipos con TypeScript
- `npm run format:check`: Verificación de formato con Prettier
