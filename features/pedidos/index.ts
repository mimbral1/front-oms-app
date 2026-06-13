// ─── Pedidos Feature – Public API ───────────────────────────────────────────

// Components
export { default as PedidoActions } from "./components/PedidoActions";
export { default as CancelOrderAlert } from "./components/CancelOrderAlert";
export { default as ChangeStoreForm } from "./components/ChangeStoreForm";
export { default as OrderCard } from "./components/OrderCard";
export { ShipmentSummary } from "./components/resumen-envio/resumen";

// Express sub-feature components
export { default as ExpressPedidoActions } from "./components/express/PedidoActions";
export { default as ExpressCancelOrderAlert } from "./components/express/CancelOrderAlert";

// Pickup sub-feature components
export { default as PickupPedidoActions } from "./components/pickup/PedidoActions";
export { default as PickupCancelOrderAlert } from "./components/pickup/CancelOrderAlert";

// Hooks
export { useFetchPedidos, useFetchPedidosOms } from "./hooks/useFetchPedidos";
export { useFetchDetallePedido } from "./hooks/useFetchDetallePedido";
export { useFetchDetallePedidoItems } from "./hooks/useFetchDetallePedidoItems";
export { useIssueSummary } from "./hooks/useIssueSummary";
export { useFetchBultos } from "./hooks/useFetchBultos";
export { useFetchHistorialPedido } from "./hooks/useFetchHistoryStore";

// Stores
export {
    useOrderStore,
    useOrdersStore,
    useOrderItemsStore,
    useShipmentsStore,
    useHistoryStore,
    useDetallePedidoStore,
    useBultosStore,
} from "./stores/detalle-pedidos";
export { useFaltantesStore } from "./stores/faltantes";
export { usePedidosStore } from "./stores/lista-pedidos";
export { useNuevoPedidoStore } from "./stores/nuevo-pedido";

// Types
export type {
    OrderItem,
    BultosItem,
    Order,
    Shipment,
    DetallePedido,
    DetalleItem,
    HistorialPedido,
    DetallePedidoStore,
} from "./types/detalle-pedido";
export type { ItemFaltante, FaltantesFilters, FaltantesStore } from "./types/faltantes";
export type { Pedido, PedidoFilters, PedidosStore } from "./types/lista-pedidos";
export type { Pedido as PedidoDomain, PedidoStatus } from "./types/pedido";
export type { PedidoInlineFilters } from "./types/filters";
export type { NuevoPedido, NuevoPedidoStore } from "./types/nuevo-pedido";
export type { IssueSummaryResponse } from "./types/resumen-pedidos";
export type { ResumenEnvio } from "./types/resumenenvio";
