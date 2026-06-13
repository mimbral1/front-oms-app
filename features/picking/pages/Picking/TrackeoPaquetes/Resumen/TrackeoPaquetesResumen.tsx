// views\Picking\TrackeoPaquetes\Resumen\TrackeoPaquetesResumen.tsx

"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { XCircleIcon } from "@heroicons/react/24/outline";
import {
    TrackeoPaquete,
    TrackeoPaquetesFields,
} from "@/features/picking/components/picking/trackeopaquetes/TrackeoPaquetesFields";

/* ---------- Mock ---------- */
const mockRecord: TrackeoPaquete = {
    tipo: "Palet",
    material: "Madera",
    codigoBarras: "XOYHJXIKJHUVO",
    precio: "9,46 ARS",
    pedido: "1330860521768-01",
    ancho: "120 cm",
    altura: "10 cm",
    largo: "80 cm",
    volumen: "96000 cm³",
    peso: "1 gr",
};

export default function TrackeoPaquetesResumenView() {
    const router = useRouter();
    const [record, setRecord] = useState<TrackeoPaquete>({ ...mockRecord });

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
                        Resumen
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
