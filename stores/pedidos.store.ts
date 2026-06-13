// stores/pedidos.store.ts
// Root-level re-export of all Pedidos stores.

export {
    useOrderStore,
    useOrdersStore,
    useOrderItemsStore,
    useShipmentsStore,
    useHistoryStore,
    useDetallePedidoStore,
    useBultosStore,
} from "@/features/pedidos/stores/detalle-pedidos";

export { useFaltantesStore } from "@/features/pedidos/stores/faltantes";
export { usePedidosStore } from "@/features/pedidos/stores/lista-pedidos";
export { useNuevoPedidoStore } from "@/features/pedidos/stores/nuevo-pedido";
