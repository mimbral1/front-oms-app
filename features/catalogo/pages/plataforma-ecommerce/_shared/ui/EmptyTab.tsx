// features/catalogo/pages/plataforma-ecommerce/_shared/ui/EmptyTab.tsx
//
// Placeholder visual para tabs "Próximamente". OMS look: rounded-xl card + shadow.

import type { ReactNode } from "react";

export interface EmptyTabProps {
    tabName: ReactNode;
    description?: ReactNode;
    /** Ticket o link de seguimiento opcional. */
    ticket?: ReactNode;
    icon?: ReactNode;
}

export function EmptyTab({ tabName, description, ticket, icon }: EmptyTabProps) {
    return (
        <div className="m-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                {icon && (
                    <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-50 grid place-items-center text-blue-700">
                        {icon}
                    </div>
                )}
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Próximamente
                </div>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">{tabName}</h2>
                {description && (
                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                        {description}
                    </p>
                )}
                {ticket && (
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                        {ticket}
                    </div>
                )}
            </div>
        </div>
    );
}
