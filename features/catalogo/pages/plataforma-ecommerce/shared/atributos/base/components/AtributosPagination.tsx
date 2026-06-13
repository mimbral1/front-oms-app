// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/components/AtributosPagination.tsx

"use client";

import { ChevronRight } from "lucide-react";
import { PillBtn } from "../../../../_shared/janis";

export interface AtributosPaginationProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function AtributosPagination({
    page,
    pageSize,
    total,
    onPageChange,
}: AtributosPaginationProps) {
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="flex items-center justify-between bg-white px-6 py-3 border-t border-gray-200">
            <span className="text-[11.5px] text-gray-500 tabular-nums">
                {total === 0 ? "0 atributos" : `${from}–${to} de ${total.toLocaleString("es-CL")}`}
            </span>
            <div className="flex items-center gap-2">
                <PillBtn
                    variant="ghost"
                    disabled={page <= 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    icon={
                        <span style={{ transform: "rotate(180deg)" }}>
                            <ChevronRight className="w-[14px] h-[14px]" />
                        </span>
                    }
                >
                    Anterior
                </PillBtn>
                <span className="text-[11.5px] text-gray-500 tabular-nums px-1">
                    Página {page} / {lastPage}
                </span>
                <PillBtn
                    variant="ghost"
                    disabled={page >= lastPage}
                    onClick={() => onPageChange(Math.min(lastPage, page + 1))}
                    icon={<ChevronRight className="w-[14px] h-[14px]" />}
                >
                    Siguiente
                </PillBtn>
            </div>
        </div>
    );
}
