import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import type { SelectionHandlers } from "@/features/pedidos/hooks/usePedidoColumns";

export function SelectCell({
    pedido,
    selection,
}: {
    pedido: Pedido;
    selection?: SelectionHandlers;
}) {
    return (
        <div data-row-click="ignore" className="flex justify-center">
            <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-blue-500"
                checked={selection?.isSelected(pedido) ?? false}
                onChange={(e) => {
                    e.stopPropagation();
                    selection?.toggleOne(pedido);
                }}
            />
        </div>
    );
}
