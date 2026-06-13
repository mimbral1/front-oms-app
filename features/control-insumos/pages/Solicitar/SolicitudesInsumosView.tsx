// views\ControlInsumos\Solicitar\SolicitarInsumosView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

// componentes existentes
import { SolicitarInsumosFields } from "@/features/control-insumos/components/solicitar/SolicitarInsumosView";
import { SolicitarInsumosItemsTable } from "@/features/control-insumos/components/solicitar/ItemsAgregadosTable";
import MisSolicitudesView from "@/features/control-insumos/components/solicitar/MisSolicitudesView";

// auth
import { useAuth } from "@/app/context/auth/AuthContext";

/* ────────────────────────────────────────────────────────────────
   MODOS DEL SELECTOR
   ──────────────────────────────────────────────────────────────── */
type ViewMode = "solicitar" | "historial";

export default function SolicitudesInsumosView() {
    const router = useRouter();
    const { user } = useAuth();

    const [mode, setMode] = useState<ViewMode>("solicitar");

    /* ────────────────────────────────────────────────────────────────
       ESTADO DEL FORMULARIO (Solicitar)
       ──────────────────────────────────────────────────────────────── */
    const [record, setRecord] = useState({
        colaborador: "",
        departamento: "",
        insumo: "",
        cantidad: "",
        motivo: "",
    });

    const [items, setItems] = useState<
        Array<{ id: string; nombre: string; cantidad: number }>
    >([]);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const handleChange = (field: keyof typeof record, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const agregarItem = () => {
        setErrorMessage(null);

        if (!record.insumo || !record.cantidad) {
            setErrorMessage("Debe seleccionar un insumo y su cantidad.");
            return;
        }

        const nuevo = {
            id: String(Date.now()),
            nombre: record.insumo,
            cantidad: Number(record.cantidad),
        };

        setItems((prev) => [...prev, nuevo]);

        // limpiar todos los campos 
        setRecord({
            colaborador: "",
            departamento: "",
            insumo: "",
            cantidad: "",
            motivo: "",
        });
    };

    const eliminarItem = (id: string) =>
        setItems((prev) => prev.filter((i) => i.id !== id));

    const enviarSolicitud = useCallback(async () => {
        if (items.length === 0) {
            setErrorMessage("Debe agregar al menos un ítem.");
            return;
        }

        setSending(true);
        setErrorMessage(null);

        try {
            console.log("Solicitud enviada:", { record, items });

            setItems([]);
            setRecord({
                colaborador: user?.nombre ?? "—",
                departamento: user?.role ?? "—",
                insumo: "",
                cantidad: "",
                motivo: "",
            });
        } catch (err) {
            setErrorMessage("No se pudo enviar la solicitud.");
        } finally {
            setSending(false);
        }
    }, [items, record, user]);

    /* ────────────────────────────────────────────────────────────────
       HEADER DINÁMICO
       ──────────────────────────────────────────────────────────────── */
    const headerActions = useMemo<Action[]>(() => [
        {
            label: "Actualizar",
            variant: "secondary",
            icon: <ArrowPathIcon className="h-5 w-5" />,
            onClick: () => window.location.reload(),
        },
    ], []);

    const title =
        mode === "solicitar"
            ? "Control de insumos · Solicitar"
            : "Control de insumos · Mis solicitudes";

    const description =
        mode === "solicitar"
            ? "Aquí puedes solicitar insumos"
            : "Aquí puedes revisar el estado e historial de tus solicitudes";

    usePageHeader(
        () =>
        ({
            title,
            description,
            action: headerActions,
        } as PageHeaderProps),
        [headerActions, mode]
    );

    /* ────────────────────────────────────────────────────────────────
       SELECTOR/TABS 
       ──────────────────────────────────────────────────────────────── */
    const tabs = [
        { key: "solicitar", label: "Solicitar Insumos" },
        { key: "historial", label: "Mis Solicitudes" },
    ] as const;

    return (
        <div className="space-y-6 p-6 bg-[#e8eaf5] min-h-screen">

            {/* SELECTOR SUPERIOR */}
            <div
                role="tablist"
                aria-label="Selector vista control insumos"
                className="flex flex-wrap items-center gap-2"
            >
                {tabs.map((t) => {
                    const active = mode === t.key;
                    return (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={active}
                            aria-controls={`panel-${t.key}`}
                            className={[
                                "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-blue-200",
                                active
                                    ? "border-blue-500 bg-white text-blue-700"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                            ].join(" ")}
                            onClick={() => setMode(t.key as ViewMode)}
                        >
                            <span
                                className={[
                                    "inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all",
                                    active
                                        ? "bg-blue-600 ring-blue-600"
                                        : "bg-white ring-gray-300 group-hover:ring-blue-400",
                                ].join(" ")}
                            />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* PANEL DE VISTAS */}
            <div className=" rounded-xl shadow-sm" id={`panel-${mode}`}>

                {/* ─────────────────────────────────────────────── */}
                {/*                VISTA: SOLICITAR                */}
                {/* ─────────────────────────────────────────────── */}
                {mode === "solicitar" && (
                    <div className="space-y-6 bg-white">

                        {errorMessage && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-3 text-red-700 rounded-md">
                                {errorMessage}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

                            <div className="lg:col-span-4 rounded-xl p-6 shadow-sm">
                                <SolicitarInsumosFields
                                    record={record}
                                    onChange={handleChange}
                                    onAgregarItem={agregarItem}
                                />
                            </div>

                            <div className="lg:col-span-3 rounded-xl p-6 shadow-sm">
                                <SolicitarInsumosItemsTable
                                    items={items}
                                    onDelete={eliminarItem}
                                />
                            </div>
                        </div>

                        <div className="mt-8 pb-10 flex justify-center">
                            <button
                                onClick={enviarSolicitud}
                                disabled={sending}
                                className="px-20 py-3 rounded-md bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50"
                            >
                                {sending ? "Enviando..." : "Enviar solicitud a jefatura"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────── */}
                {/*             VISTA: MIS SOLICITUDES             */}
                {/* ─────────────────────────────────────────────── */}
                {mode === "historial" && (
                    <div>
                        <MisSolicitudesView />
                    </div>
                )}
            </div>
        </div>
    );
}
