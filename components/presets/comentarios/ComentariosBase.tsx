// components\comentarios\ComentariosBase.tsx
"use client";

import React, {
    useEffect,
    useMemo,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";
import { DataTable, type Column } from "@/components/ui/table";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import ComentariosModal from "./ComentariosModal";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";

/* ──────────────────────────────
   Tipos
────────────────────────────── */
export interface CommentItem {
    id: string;
    comment: string;
    createdAtCL: string;
    userName: string;
    userEmail: string;
    avatar?: string;
}

export interface ComentariosBaseRef {
    openNewComment: () => void;
}

interface ComentariosBaseProps {
    entityId: string;

    loadComments: (params?: {
        page?: number;
        pageSize?: number;
    }) => Promise<any>;

    createComment: (payload: {
        comment: string;
        createdBy: number;
    }) => Promise<any>;

    emptyText: string;
    errorText?: string;
}

/* ──────────────────────────────
   Vista genérica
────────────────────────────── */
const ComentariosBase = forwardRef<
    ComentariosBaseRef,
    ComentariosBaseProps
>(
    (
        {
            entityId,
            loadComments,
            createComment,
            emptyText,
            errorText = "No se pudieron cargar los comentarios.",
        },
        ref
    ) => {
        const { user } = useAuth();

        const [data, setData] = useState<CommentItem[]>([]);
        const [loading, setLoading] = useState(false);
        const [errorMessage, setErrorMessage] = useState<string | null>(null);

        const PER_PAGE = 10;
        const [page, setPage] = useState(1);

        const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
        const shown = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

        const clamp = (n: number, min: number, max: number) =>
            Math.max(min, Math.min(n, max));

        const [showNewModal, setShowNewModal] = useState(false);
        const [newComment, setNewComment] = useState("");
        const [saving, setSaving] = useState(false);

        /* ──────────────────────────────
           Exposed methods (PageHeader)
        ────────────────────────────── */
        useImperativeHandle(ref, () => ({
            openNewComment: () => {
                setShowNewModal(true);
            },
        }));

        /* ──────────────────────────────
           Columns (idénticas en todos lados)
        ────────────────────────────── */
        const columns: Column<CommentItem>[] = useMemo(
            () => [
                {
                    header: "Comentario",
                    accessorKey: "comment",
                    cell: (r) => (
                        <div className="max-w-[700px] whitespace-pre-wrap text-sm">
                            {r.comment}
                        </div>
                    ),
                },
                {
                    header: "Usuario",
                    accessorKey: "userName",
                    cell: (r) => {
                        if (!r.userName || r.userName === "—") {
                            return (
                                <span className="text-sm text-gray-600">—</span>
                            );
                        }

                        return (
                            <div className="flex items-center gap-2">
                                {r.avatar && (
                                    <img
                                        src={r.avatar}
                                        alt=""
                                        className="h-7 w-7 rounded-full object-cover"
                                    />
                                )}
                                <span className="text-sm">{r.userName}</span>
                            </div>
                        );
                    },
                },
                {
                    header: "Fecha",
                    accessorKey: "createdAtCL",
                    cell: (r) => (
                        <span className="text-sm text-gray-600">
                            {r.createdAtCL}
                        </span>
                    ),
                },
            ],
            []
        );

        /* ──────────────────────────────
           Load
        ────────────────────────────── */
        const load = async () => {
            setLoading(true);
            setErrorMessage(null);

            try {
                const res = await loadComments({
                    page,
                    pageSize: PER_PAGE,
                });

                const mapped: CommentItem[] = (res?.items ?? []).map((c: any) => {
                    const profile = c.createdByUser?.profile;

                    return {
                        id: c.id,
                        comment: c.comment,
                        createdAtCL: new Date(c.createdAt).toLocaleString(
                            "es-CL"
                        ),
                        userName: profile
                            ? `${profile.nombres} ${profile.apellidos}`
                            : "—",
                        userEmail: profile?.email ?? "—",
                        avatar: profile?.urlImagenPerfil,
                    };
                });

                setData(mapped);
                setPage(1);
            } catch (e: any) {
                console.error("Error cargando comentarios:", e);
                setErrorMessage(e?.message || errorText);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            if (entityId) load();
        }, [entityId]);

        /* ──────────────────────────────
           Guardar comentario
        ────────────────────────────── */
        const handleSaveComment = async () => {
            if (!newComment.trim() || !user) return;

            setSaving(true);

            try {
                await createComment({
                    comment: newComment,
                    createdBy: Number(user.id),
                });

                setNewComment("");
                setShowNewModal(false);
                load();
            } finally {
                setSaving(false);
            }
        };

        /* ──────────────────────────────
           Estados
        ────────────────────────────── */
        if (loading) {
            return (
                <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                    <table className="min-w-full text-sm">
                        <tbody>
                            <tr>
                                <td className="px-4 py-6 text-center text-gray-500">
                                    <ArrowPathIcon className="inline h-5 w-5 animate-spin mr-2" />
                                    Cargando comentarios…
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        }

        if (errorMessage) {
            return (
                <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                    <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">
                                Error al cargar comentarios
                            </h3>
                            <p className="mt-2 text-sm">{errorMessage}</p>
                            <div className="mt-4">
                                <button
                                    onClick={load}
                                    className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
                <div className="flex-1">
                    <div className="bg-[#e8eaf5] rounded-md">
                        {data.length === 0 ? (
                            <div className="p-6 bg-white rounded-md text-center text-gray-500">
                                {emptyText}
                            </div>
                        ) : (
                            <>
                                <DataTable
                                    data={shown}
                                    columns={columns}
                                    dataType="General"
                                    showStatusBorder={false}
                                    rowPaddingY={12}
                                    rowBgClass="bg-white"
                                />

                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={page}
                                        totalRecords={data.length}
                                        pageSize={PER_PAGE}
                                        onPageChange={setPage}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Modal nuevo comentario */}
                {showNewModal && (
                    <ComentariosModal
                        open={showNewModal}
                        value={newComment}
                        loading={saving}
                        onChange={setNewComment}
                        onCancel={() => setShowNewModal(false)}
                        onSave={handleSaveComment}
                    />
                )}
            </div>
        );
    }
);

export default ComentariosBase;