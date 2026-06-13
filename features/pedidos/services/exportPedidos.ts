// features/pedidos/services/exportPedidos.ts
// Servicio de exportación CSV para el listado de pedidos.

import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import { exportToCsv } from "@/components/presets/export/export";

const HEADERS = [
    "ID Pedido",
    "Cliente",
    "Fecha Creación",
    "Fecha Entrega",
    "Picking",
    "Prioridad",
    "Estado",
];

export function exportPedidosCsv(pedidos: Pedido[]) {
    const rows = pedidos.map((p) => [
        p.id,
        p.cliente.nombre,
        p.fechaCreacion,
        p.fechaEntrega,
        `${p.picking?.items ?? 0}/${p.picking?.unidades ?? 0}`,
        p.prioridad,
        p.estado,
    ]);

    exportToCsv("pedidos.csv", [HEADERS, ...rows]);
}
