"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Action, PageHeaderProps } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { useApiSectoresPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/sectores-picking/api-sectores-picking";
import LogsBase from "@/components/presets/logs/LogsBase";

export default function LogsSectoresPicking() {
    const router = useRouter();
    const params = useParams();
    const zoneId = String(params?.id ?? "");

    const { getZoneById } = useApiSectoresPicking();

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () =>
                    router.push(
                        "/picking/configuraciones/multipicking/sectores"
                    ),
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
                        Sectores de Picking
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Logs
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <LogsBase
            entityId={zoneId}
            loadLogs={() => getZoneById(`${zoneId}/audit`)}
            emptyText="No hay logs registrados para este sector."
            errorText="No se pudieron cargar logs del sector de picking."
        />
    );
}