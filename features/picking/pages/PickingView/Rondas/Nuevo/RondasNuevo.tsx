"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { RondasFields, Ronda } from "@/features/picking/components/pickingview/rondas/RondasFields";

const initialRecord: Ronda = {
    id: "",
    pickerId: "",
    pickerNombre: "",
    pickerEmail: "",
    pickingPoint: "Palermo",
    olaDisplay: "250724-47VX62",
    olaInicio: "2025/07/24 09:00",
    olaFin: "2025/07/24 11:00",
    completado: false,
    itemsRepickeados: false,
    itemsSalteados: false,
    hasItemsCandidate: false,
    status: "Pendiente",
};

export default function RondasNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<Ronda>({ ...initialRecord });

    const handleChange = <K extends keyof Ronda>(field: K, value: Ronda[K]) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const actions: Action[] = useMemo(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => { },
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => setRecord({ ...initialRecord }),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/rondas"),
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
                        Rondas
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: actions,
        } as PageHeaderProps),
        [actions]
    );

    return (
        <div className="p-6 bg-white">
            <RondasFields record={record} onChange={handleChange} isCreate />
        </div>
    );
}
