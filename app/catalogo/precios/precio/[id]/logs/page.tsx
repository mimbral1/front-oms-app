"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import LogsBase from "@/components/presets/logs/LogsBase";

export default function LogsPage() {
    const router = useRouter();
    const { id } = useParams();
    const entityId = Array.isArray(id) ? id[0] : (id ?? "");

    usePageHeader(
        () => ({
            title: `Logs · ${entityId}`,
            action: [
                {
                    label: "Volver al listado",
                    icon: <ArrowLeftIcon className="h-5 w-5" />,
                    variant: "secondary" as const,
                    onClick: () => router.push("/catalogo/precios/precio"),
                },
            ],
        }),
        [entityId, router]
    );

    const loadLogs = async () => {
        return { data: [], total: 0 };
    };

    return (
        <div className="p-6">
            <LogsBase
                entityId={entityId}
                loadLogs={loadLogs}
                emptyText="No hay logs para este precio."
                errorText="Error al cargar los logs."
            />
        </div>
    );
}
