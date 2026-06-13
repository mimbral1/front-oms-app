"use client";

import React, { useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import {
    ArrowLeftIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import ComentariosBase from "@/components/presets/comentarios/ComentariosBase";
import type { ComentariosBaseRef } from "@/components/presets/comentarios/ComentariosBase";

export default function CommentsPage() {
    const router = useRouter();
    const { id } = useParams();
    const comentariosRef = useRef<ComentariosBaseRef>(null);
    const entityId = Array.isArray(id) ? id[0] : (id ?? "");

    usePageHeader(
        () => ({
            title: `Comments · ${entityId}`,
            action: [
                {
                    label: "Nuevo comentario",
                    icon: <PlusIcon className="h-5 w-5" />,
                    variant: "primary" as const,
                    onClick: () => comentariosRef.current?.openNewComment(),
                },
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

    const loadComments = async (params?: { page?: number; pageSize?: number }) => {
        return { data: [], total: 0 };
    };

    const createComment = async (payload: { comment: string; createdBy: number }) => {
        return {};
    };

    return (
        <div className="p-6">
            <ComentariosBase
                ref={comentariosRef}
                entityId={entityId}
                loadComments={loadComments}
                createComment={createComment}
                emptyText="No hay comentarios para este precio."
                errorText="Error al cargar los comentarios."
            />
        </div>
    );
}
