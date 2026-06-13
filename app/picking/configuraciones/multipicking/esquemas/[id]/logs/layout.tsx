"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { XCircleIcon } from "@heroicons/react/24/outline";

import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

export default function LogsEsquemasPickingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/configuraciones/multipicking/esquemas"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Esquemas de Picking
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Logs</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return children;
}
