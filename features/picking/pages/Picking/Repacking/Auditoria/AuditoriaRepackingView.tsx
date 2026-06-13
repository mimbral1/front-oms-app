"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";

import { RepackingRecord } from "@/features/picking/components/picking/repacking/RepackingFields";

import Card from "@/components/ui/card/Card";
import { ActionButton } from "@/components/ui/button/action-button";

import {
    UserCircleIcon,
    PencilIcon,
    CheckCircleIcon,
    XCircleIcon,
    CloudArrowDownIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface Props {
    record?: RepackingRecord;
}

/* ------------------------------------------------------------
   MOCK 
------------------------------------------------------------ */
const mockRecord: Partial<RepackingRecord> = {
    creadoPor: {
        nombre: "jmolina",
        email: "jmolina@mimbral.cl",
    },
    modificadoPor: {
        nombre: "fpino",
        email: "fpino@mimbral.cl",
    },
    fechaCreacion: "2025-11-25 11:32",
    fechaModificacion: "2025-11-26 09:14",
};

export default function AuditoriasRepackingView({ record }: Props) {
    const router = useRouter();

    // si no viene record usamos mock
    const data = record || mockRecord;

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                onClick: () => console.log("Exportar auditoría"),
                icon: <CloudArrowDownIcon className="h-5 w-5" />,
            },
            {
                label: "Aplicar",
                variant: "secondary",
                disabled: true,
                onClick: () => { },
                icon: <CheckCircleIcon className="h-5 w-5" />,
            },
            {
                label: "Guardar",
                variant: "gray",
                disabled: true,
                onClick: () => { },
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => router.push("/picking/packing/repacking"),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [router]
    );

    usePageHeader(
        () => ({
            title: "Auditoría",
            action: headerActions,
            status: { text: "En revisión", variant: "info" },
        }),
        [headerActions]
    );

    return (
        <div className="p-6 space-y-10 bg-white">

            {/* GRID 2 COLUMNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">

                {/* ===================== IZQUIERDA: ACCIONES ESPECIALES ===================== */}
                <div className="lg:col-span-4">
                    <p className="font-semibold text-gray-700 mb-4">Acciones especiales</p>

                    <div className="flex flex-wrap gap-3">
                        <ActionButton variant="gray" disabled>
                            Split repack
                        </ActionButton>
                        <ActionButton variant="gray" disabled>
                            Merge repack
                        </ActionButton>
                        <ActionButton variant="gray" disabled>
                            Cambiar tipo de paquete
                        </ActionButton>
                        <ActionButton variant="gray" disabled>
                            Reetiquetar / cambiar EAN
                        </ActionButton>
                    </div>
                </div>

                {/* ===================== DERECHA: USUARIO CREADOR ===================== */}
                <div className="lg:col-span-3 space-y-8">

                    <Card
                        title="Usuario creador"
                        icon={UserCircleIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6 bg-white"
                    >
                        <div className="grid grid-cols-12 items-center gap-4">
                            <div className="col-span-9">
                                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                                    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                        {data.creadoPor?.nombre?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{data.creadoPor?.nombre || "—"}</span>
                                        <span className="text-xs text-gray-500">{data.creadoPor?.email || ""}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-3 text-right">
                                <span className="text-xs text-gray-500">
                                    {data.fechaCreacion || "—"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* ===================== ÚLTIMA MODIFICACIÓN ===================== */}
                    <Card
                        title="Última modificación"
                        icon={PencilIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6 bg-white"
                    >
                        <div className="grid grid-cols-12 items-center gap-4">
                            <div className="col-span-9">
                                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                                    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                        {data.modificadoPor?.nombre?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{data.modificadoPor?.nombre || "—"}</span>
                                        <span className="text-xs text-gray-500">{data.modificadoPor?.email || ""}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-3 text-right">
                                <span className="text-xs text-gray-500">
                                    {data.fechaModificacion || "—"}
                                </span>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>

        </div>
    );
}
