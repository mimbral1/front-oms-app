import DeliveryDiningOutlinedIcon from "@mui/icons-material/DeliveryDiningOutlined";
import type { Pedido } from "@/features/pedidos/types/lista-pedidos";

function formatDeliveryDateTime(rawValue?: string | null) {
    const raw = String(rawValue ?? "").trim();
    if (!raw) return "—";

    // Examples supported: "2026-06-02 15:21:33", "2026-06-02T15:21:33", "02/06/2026 15:21:33"
    const normalized = raw.replace("T", " ");
    const [datePart, timePart] = normalized.split(" ");

    if (!datePart) return raw;
    if (!timePart) return datePart;

    const timeWithoutSeconds = timePart.split(":").slice(0, 2).join(":");
    return timeWithoutSeconds ? `${datePart} ${timeWithoutSeconds}` : datePart;
}

export function DeliveryCell({
    pedido: p,
    formatWhsName,
}: {
    pedido: Pedido;
    formatWhsName: (code?: string | null) => string;
}) {
    return (
        <div className="flex flex-col gap-0.5 min-h-[80px] min-w-0 text-xs lg:text-sm text-gray-600">
            <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-gray-400">
                    <DeliveryDiningOutlinedIcon className="!h-5 !w-5" />
                </span>
                <span className="font-inter text-gray-700 font-semibold">
                    {p.entrega.transportista || "Transportista no disponible"}
                </span>
            </div>
            <div className="flex items-start gap-2 pl-7">
                <span className="font-inter text-gray-600">{p.entrega.type}</span>
            </div>
            <p className="font-inter text-xs text-gray-600 pl-7">
                {formatWhsName(p?.entrega?.whscode) || p?.entrega?.whscode || "—"}
            </p>
            <p className="font-inter text-xs text-gray-500 pl-7">
                {formatDeliveryDateTime((p as any)?.fechaEntrega)}
            </p>
        </div>
    );
}
