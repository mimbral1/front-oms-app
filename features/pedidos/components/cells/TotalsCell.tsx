import { DocumentTextIcon } from "@heroicons/react/24/outline";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import { clp } from "@/lib/format/money";

export function TotalsCell({ pedido: p }: { pedido: Pedido }) {
    const methods = Array.isArray((p as any)?.totales?.metodos)
        ? (p as any).totales.metodos
        : (p as any)?.totales?.metodo
            ? [(p as any).totales.metodo]
            : [];

    return (
        <div className="flex flex-col gap-0.5 min-w-0 text-xs lg:text-sm">
            <div className="flex items-center gap-2">
                <CalculateOutlinedIcon className="h-4 w-4 lg:h-6 lg:w-6" />
                <span className="text-xs lg:text-sm truncate">
                    {clp.format(p.totales.total)}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-gray-500 bg-white" />
                <span className="font-inter text-sm leading-6 text-[#7E7F8DFF] font-medium">
                    {p.totales.documento}
                </span>
            </div>
            {methods.length > 0 ? (
                <div className="pl-8 flex flex-col gap-1">
                    {methods.map((m: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 w-fit">
                            {m}
                        </span>
                    ))}
                </div>
            ) : (
                <div className="pl-8">
                    <span className="text-xs text-gray-400 italic">Sin método de pago</span>
                </div>
            )}
        </div>
    );
}

