"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { UserIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import SlotsDespachoFields, { SlotDespacho } from "./SlotsDespachoFields";

/*
  Tab "SLOTS DE DESPACHO" para el Resumen de Almacenes.
  - Header con acciones (igual patrón que otras tabs).
  - Layout 12 columnas: contenido (8) + panel meta (4) como en la captura.
  - Mock local hasta conectar API (fetch-with-auth).
*/

const INITIAL_SLOTS: SlotDespacho[] = [
    { id: "s1", transportista: "Andreani", desde: "05:00", hasta: "07:00" },
];

type MetaInfo = {
    creadorFecha: string;
    ultimaModFecha: string;
};

const INITIAL_META: MetaInfo = {
    creadorFecha: "12/09/2022 19:18:53",
    ultimaModFecha: "26/06/2024 14:20:26",
};

export default function SlotsDespacho() {
    const router = useRouter();
    const [slots, setSlots] = useState<SlotDespacho[]>(INITIAL_SLOTS);
    const [meta] = useState<MetaInfo>(INITIAL_META);

    const setField = (idx: number, field: keyof SlotDespacho, value: any) => {
        setSlots((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    };

    const addRow = () => {
        setSlots((prev) => [
            ...prev,
            {
                id: crypto.randomUUID?.() ?? `tmp_${Date.now()}`,
                transportista: "",
                desde: "",
                hasta: "",
            },
        ]);
    };

    const removeRow = (idx: number) => {
        setSlots((prev) => prev.filter((_, i) => i !== idx));
    };

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-4 w-4" />, onClick: () => console.log("Aplicar", slots) },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("Guardar", slots) },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-4 w-4" />, onClick: () => router.push("/almacen/almacenes") },
        ],
        [router, slots]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Almacenes</div>
                    <div className="text-2xl font-semibold text-gray-900">Slots de despacho</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <div className="grid grid-cols-12 gap-6">
                {/* Contenido principal */}
                <div className="col-span-12 lg:col-span-8">
                    <SlotsDespachoFields
                        slots={slots}
                        onChange={setField}
                        onAdd={addRow}
                        onRemove={removeRow}
                        carriersOptions={["Andreani", "Ocasa", "Correo Argentino", "DHL", "Otros"]}
                    />
                </div>

                {/* Panel lateral: Usuario creador / Última modificación */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* USUARIO CREADOR */}
                    <div className="rounded-xl p-6 bg-white shadow-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                            <UserIcon className="h-5 w-5" />
                            <div className="uppercase text-xs font-semibold tracking-wider">Usuario creador</div>
                            <div className="ml-2 flex-1 border-b border-gray-300" />
                        </div>
                        <div className="mt-8 text-right text-sm text-gray-500">{meta.creadorFecha}</div>
                    </div>

                    {/* ÚLTIMA MODIFICACIÓN */}
                    <div className="rounded-xl p-6 bg-white shadow-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                            <PencilSquareIcon className="h-5 w-5" />
                            <div className="uppercase text-xs font-semibold tracking-wider">Última modificación</div>
                            <div className="ml-2 flex-1 border-b border-gray-300" />
                        </div>
                        <div className="mt-8 text-right text-sm text-gray-500">{meta.ultimaModFecha}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
