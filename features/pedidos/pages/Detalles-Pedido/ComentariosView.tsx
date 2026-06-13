// app/views/Pedidos/Comentarios/ComentariosView.tsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { getStatusVariant } from "@/features/pedidos/utils/pedido-status";

/* -----------------------------------------------
   MOCKS
------------------------------------------------ */
type Comentario = {
    id: string | number;
    autor: string;
    email: string;
    texto: string;
    destacado: boolean;
    fecha: string; // ISO o string legible
};

const MOCK_COMENTARIOS: Comentario[] = [
    {
        id: 1,
        autor: "Leonardo Gambino",
        email: "leonardo.gambino@janis.im",
        texto:
            "Se requiere llamar al cliente para modificar una nueva fecha de entrega debido a inconvenientes internos.",
        destacado: true,
        fecha: "2025-05-14T14:33:00Z",
    },
];

/* -----------------------------------------------
   VIEW
------------------------------------------------ */
export default function ComentariosView() {
    const router = useRouter();

    // Encabezado
    const pedidoId = "REC #1532091023675-01 - 1023675";
    const pedidoStatus = "Pendiente";

    // Estado
    const [saving, setSaving] = useState(false);
    const [comentarios, setComentarios] = useState<Comentario[]>(MOCK_COMENTARIOS);

    // Composer
    const [tipoMensaje, setTipoMensaje] = useState<"publico" | "privado">("publico");
    const [composerDestacado, setComposerDestacado] = useState(false);
    const [composerTexto, setComposerTexto] = useState("");

    // Acciones (mock)
    const handleSave = useCallback(async () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 900);
    }, []);

    const handleSend = useCallback(() => {
        const texto = composerTexto.trim();
        if (!texto) return;
        const nuevo: Comentario = {
            id: Date.now(),
            autor: "Usuario Actual",
            email: "usuario@mimbral.cl",
            texto: (tipoMensaje === "privado" ? "[Interno] " : "") + texto,
            destacado: composerDestacado,
            fecha: new Date().toISOString(),
        };
        setComentarios((prev) => [nuevo, ...prev]);
        setComposerTexto("");
        setComposerDestacado(false);
    }, [composerTexto, composerDestacado, tipoMensaje]);

    const toggleDestacado = (id: Comentario["id"]) => {
        setComentarios((prev) =>
            prev.map((c) => (c.id === id ? { ...c, destacado: !c.destacado } : c))
        );
    };

    /* -----------------------------------------------
       Header (mismo patrón que usamos en Repack/Resumen)
    ------------------------------------------------ */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/pedidos/listado-pedidos"),
                disabled: saving,
            },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Pedidos</div>
                    <div className="text-2xl font-semibold text-gray-900">{pedidoId}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : { text: pedidoStatus, variant: getStatusVariant(pedidoStatus) },
        } as unknown as PageHeaderProps),
        [headerActions, saving, pedidoId, pedidoStatus]
    );

    /* -----------------------------------------------
       UI helpers
    ------------------------------------------------ */
    const Avatar = ({ name }: { name: string }) => {
        const initials = name
            .split(" ")
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white text-sm font-semibold">
                {initials || "U"}
            </div>
        );
    };

    const Switch = ({
        checked,
        onChange,
    }: {
        checked: boolean;
        onChange: (v: boolean) => void;
    }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-gray-300"
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-1"
                    }`}
            />
        </button>
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            {/* Área scrollable con la lista */}
            <div className="flex-1">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex h-[calc(100vh-180px)] flex-col">
                        {/* LISTA: desplazarla un poco a la derecha como la ref */}
                        <div className="flex-1 overflow-y-auto space-y-5 pl-6 md:pl-12">
                            {comentarios.map((c) => (
                                /* --- tu tarjeta de comentario tal cual --- */
                                <div key={c.id} className="relative rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-100">
                                    <div className="pointer-events-none absolute -right-2 bottom-5 h-0 w-0 border-y-8 border-l-8 border-y-transparent border-l-white" />
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white text-sm font-semibold">
                                            {c.autor.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="text-[13px] font-semibold text-gray-900 leading-4">{c.autor}</div>
                                                    <div className="mt-0.5 text-[12px] text-gray-500">{c.email}</div>
                                                </div>
                                                <div className="flex items-center gap-3 text-[13px] text-gray-700">
                                                    <span>Destacado</span>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={c.destacado}
                                                        onClick={() => toggleDestacado(c.id)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${c.destacado ? "bg-blue-600" : "bg-gray-300"}`}
                                                    >
                                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${c.destacado ? "translate-x-5" : "translate-x-1"}`} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-[13px] leading-5 text-gray-800">{c.texto}</div>
                                            <div className="mt-3 text-right text-[12px] text-gray-500">
                                                {new Date(c.fecha).toLocaleString("es-CL", { hour12: false })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Espaciador para que el composer fijo no tape el final de la lista */}
                            <div className="h-[128px]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* COMPOSER fijo abajo */}
            <div className="sticky bottom-0 z-20 w-full bg-[#e8eaf5]/90 backdrop-blur px-6 pb-8 pt-2">
                <div className="mx-auto max-w-5xl">
                    <div className="relative rounded-xl bg-white px-5 pt-4 pb-5 shadow-sm ring-1 ring-gray-100">
                        {/* Header del composer (avatar + tabs + checkbox) */}
                        <div className="flex items-center gap-6">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white text-sm font-semibold">L</div>
                            <div className="flex gap-8 text-[14px]">
                                <button
                                    className={`pb-1.5 ${tipoMensaje === "publico" ? "border-b-2 border-blue-600 text-blue-700 font-medium" : "text-gray-600"}`}
                                    onClick={() => setTipoMensaje("publico")}
                                >
                                    Mensaje público
                                </button>
                                <button
                                    className={`pb-1.5 ${tipoMensaje === "privado" ? "border-b-2 border-blue-600 text-blue-700 font-medium" : "text-gray-600"}`}
                                    onClick={() => setTipoMensaje("privado")}
                                >
                                    Mensaje privado (interno)
                                </button>
                            </div>
                            <div className="ml-auto flex items-center gap-2 text-[13px] text-gray-700">
                                <span>Mensaje destacado</span>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-blue-600"
                                    checked={composerDestacado}
                                    onChange={(e) => setComposerDestacado(e.target.checked)}
                                />
                            </div>
                        </div>

                        {/* Área de escritura */}
                        <div className="mt-4 flex items-end gap-3">
                            <textarea
                                className="flex-1 border-b border-gray-300 bg-transparent px-0 pb-2 text-[13px] outline-none placeholder:text-gray-400"
                                rows={3}
                                placeholder="Escribe un comentario..."
                                value={composerTexto}
                                onChange={(e) => setComposerTexto(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleSend}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 self-end"
                                title="Enviar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-45" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}
