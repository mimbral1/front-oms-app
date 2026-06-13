"use client";

import { useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Action, PageHeaderProps } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { XCircleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useApiSectoresPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/sectores-picking/api-sectores-picking";
import ComentariosBase from "@/components/presets/comentarios/ComentariosBase";
import type { ComentariosBaseRef } from "@/components/presets/comentarios/ComentariosBase";

export default function ComentariosSectoresPicking() {

    const commentsRef = useRef<ComentariosBaseRef>(null);

    const router = useRouter();
    const params = useParams();
    const zoneId = String(params?.id ?? "");

    const { getZoneComments, createZoneComment } = useApiSectoresPicking();

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo comentario",
                variant: "success",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () => commentsRef.current?.openNewComment(),
            },
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
                        Comentarios
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <ComentariosBase
            ref={commentsRef}
            entityId={zoneId}
            loadComments={(params) => getZoneComments(zoneId, params)}
            createComment={(payload) => createZoneComment(zoneId, payload)}
            emptyText="No hay comentarios registrados para este sector."
            errorText="No se pudieron cargar los comentarios del sector de picking."
        />
    );
}