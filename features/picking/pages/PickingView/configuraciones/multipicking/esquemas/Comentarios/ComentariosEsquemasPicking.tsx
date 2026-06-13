// views\PickingView\configuraciones\multipicking\esquemas\Comentarios\ComentariosEsquemasPicking.tsx
"use client";

import { useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Action, PageHeaderProps } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { XCircleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useApiEsquemasPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/esquemas-picking/api-esquemas-picking";
import ComentariosBase, {
    ComentariosBaseRef,
} from "@/components/presets/comentarios/ComentariosBase";
/* ──────────────────────────────
   Vista
────────────────────────────── */
export default function ComentariosEsquemasPicking() {
    const router = useRouter();
    const params = useParams();
    const schemaId = String(params?.id ?? "");

    const comentariosRef = useRef<ComentariosBaseRef>(null);

    const {
        getPickingSchemaComments,
        createPickingSchemaComment,
    } = useApiEsquemasPicking();

    /* ──────────────────────────────
       PageHeader
    ────────────────────────────── */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo comentario",
                variant: "success",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () =>
                    comentariosRef.current?.openNewComment(),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () =>
                    router.push(
                        "/picking/configuraciones/multipicking/esquemas"
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
                        Esquemas de Picking
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

    /* ──────────────────────────────
       Render
    ────────────────────────────── */
    return (
        <ComentariosBase
            ref={comentariosRef}
            entityId={schemaId}
            loadComments={(params) =>
                getPickingSchemaComments(schemaId, params)
            }
            createComment={(payload) =>
                createPickingSchemaComment(schemaId, payload)
            }
            emptyText="No hay comentarios registrados para este esquema."
            errorText="No se pudieron cargar los comentarios del esquema de picking."
        />
    );
}