// features/pedidos/services/status.ts
// Re-export desde utils/pedido-status para cumplir la estructura services/.
// La fuente de verdad de estados vive en features/pedidos/utils/pedido-status.ts.
export {
    getStatusVariant,
    getRemainingTime,
    getPedidoStatusVariant,
    getItemStatusVariant,
} from "@/features/pedidos/utils/pedido-status";
