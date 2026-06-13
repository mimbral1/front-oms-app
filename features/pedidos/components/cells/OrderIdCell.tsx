import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import { CopyableText } from "@/components/ui/copyable-text";

export function OrderIdCell({ pedido: p }: { pedido: Pedido }) {
    return (
        <div className="cursor-pointer flex flex-col flex-[1.3] min-h-[80px] min-w-0 text-xs lg:text-sm text-gray-500">
            <div className="flex items-center gap-2">
                <CopyableText
                    text={String(p.id)}
                    className="font-semibold text-gray-900 hover:underline hover:text-black"
                >
                    {p.salesChannelReferenceId}-{p.id}
                </CopyableText>
            </div>
            {p.showExternalPackageId && p.externalPackageId ? (
                <div className="mt-1 text-gray-500">
                    <CopyableText text={String(p.externalPackageId)} className="text-gray-500">
                        {p.externalPackageId}
                    </CopyableText>
                </div>
            ) : null}
            <div className="flex flex-col mt-1">
                <CopyableText text={String(p.folionum)} className="text-gray-500">
                    {p.folionum}
                </CopyableText>
                <span>{p.fechaCreacion}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>{p.seller}</span>
            </div>
        </div>
    );
}
