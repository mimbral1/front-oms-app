import { UserIcon } from "@heroicons/react/24/outline";
import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import { CopyableText } from "@/components/ui/copyable-text";

const MAX_CLIENT_NAME = 50;

function truncateClientName(name: string) {
    if (name.length <= MAX_CLIENT_NAME) return name;
    return `${name.slice(0, MAX_CLIENT_NAME)}...`;
}

export function CustomerCell({ pedido: p }: { pedido: Pedido }) {
    const fullClientName = p.cliente.nombre ?? "";
    const shortClientName = truncateClientName(fullClientName);
    const shouldShowHoverModal = fullClientName.length > MAX_CLIENT_NAME;

    return (
        <div className="flex flex-col min-h-[80px] min-w-0 text-xs lg:text-sm text-gray-500 gap-0.5">
            <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div className="group relative min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                        {shortClientName}
                    </p>

                    {shouldShowHoverModal && (
                        <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden min-w-[280px] max-w-[420px] rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium text-gray-800 shadow-xl group-hover:block">
                            {fullClientName}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-0.5 pl-7 min-w-0">
                <CopyableText text={p.cliente.rut ?? ""} className="text-sm text-gray-500">
                    {p.cliente.rut}
                </CopyableText>
                <p className="text-sm text-gray-500 truncate">{p.cliente.telefono}</p>
                <p className="text-sm text-gray-500 truncate">{p.cliente.email}</p>
            </div>
        </div>
    );
}
