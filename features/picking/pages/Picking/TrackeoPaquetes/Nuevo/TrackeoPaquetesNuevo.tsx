// views\Picking\TrackeoPaquetes\Nuevo\TrackeoPaquetesNuevo.tsx

"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { XCircleIcon } from "@heroicons/react/24/outline";
import {
    TrackeoPaquete,
    TrackeoPaquetesFields,
} from "@/features/picking/components/picking/trackeopaquetes/TrackeoPaquetesFields";

/* ---------- Registro inicial ---------- */
const initialRecord: TrackeoPaquete = {
    tipo: "",
    material: "",
    codigoBarras: "",
    precio: "",
    pedido: "",
    ancho: "",
    altura: "",
    largo: "",
    volumen: "",
    peso: "",
};

export default function TrackeoPaquetesNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<TrackeoPaquete>({ ...initialRecord });

    const handleChange = (field: keyof TrackeoPaquete, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const headerActions = useMemo<Action[]>(
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
                        <SaveOutlined className="h-4 w-4 text-current" />
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
                onClick: () => router.push("/picking/packing/trackeo-de-paquetes"),
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
                        Trackeo de paquetes
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Nuevo
                    </div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <TrackeoPaquetesFields record={record} onChange={handleChange} />
        </div>
    );
}
