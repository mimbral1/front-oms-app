// views\Picking\Repacking\Resumen\RepackingResumenView.tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
    XCircleIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import RepackingFields, {
    RepackingRecord
} from "@/features/picking/components/picking/repacking/RepackingFields";

/* ============================================================================
   Mock data inicial 
   ============================================================================ */
const mockRecord: RepackingRecord = {
    repackId: "PKG-0001",
    orderId: "ORD-10001",
    referenceId: "OL-10001-1",
    ean: "7801234560001",
    tipoPaquete: "Caja mediana",
    retornable: false,
    unidadesTotales: 12,
    skusTotales: 4,

    warehouse: "CD-TALCA",
    posicion: "RACK-A2-N3",
    dimensiones: "40 x 30 x 25 cm",
    pesoTotal: 8.5,
    volumen: "30000 cm³",
    cubing: "30x25x40",

    items: [
        { sku: "TALADRO-18V", descripcion: "Taladro Inalámbrico 18V", cantidad: 2, pesoKg: 1.8 },
        { sku: "BROCA-SET10", descripcion: "Set 10 Brocas Madera", cantidad: 3, pesoKg: 0.6 },
        { sku: "DISCO-115", descripcion: "Disco Corte 115mm", cantidad: 5, pesoKg: 0.9 },
        { sku: "GUANTES-PRO", descripcion: "Guantes Protección Pro", cantidad: 2, pesoKg: 0.4 },
    ],

    paquetesAnidados: "No hay paquetes anidados en este repack.",

    creadoPor: { nombre: "jmolina", email: "jmolina@mimbral.cl" },
    fechaCreacion: "2025-11-25 11:32",

    modificadoPor: { nombre: "fpino", email: "fpino@mimbral.cl" },
    fechaModificacion: "2025-11-26 09:14"
};

/* ============================================================================
   Componente principal
   ============================================================================ */

export default function RepackingResumenView() {
    const router = useRouter();

    const [record, setRecord] = useState<RepackingRecord>(mockRecord);

    const recordRef = useRef(record);
    recordRef.current = record;

    const handleChange = (field: keyof RepackingRecord, value: any) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    };

    /* ------------------------------------------------------------------------
       Guardar cambios 
    ------------------------------------------------------------------------ */
    const handleSave = useCallback(async () => {
        console.log("Mock PUT Repacking:", recordRef.current);
    }, []);

    /* ------------------------------------------------------------------------
       Aplicar cambios 
    ------------------------------------------------------------------------ */
    const handleApply = useCallback(async () => {
        console.log("Aplicar cambios de Repacking:", recordRef.current);
    }, []);

    /* ------------------------------------------------------------------------
       Acciones del Header
    ------------------------------------------------------------------------ */
    const actions = useMemo<Action[]>(() => [
        {
            label: "Aplicar",
            variant: "success",
            icon: <CheckCircleIcon className="h-5 w-5" />,
            onClick: handleApply,
        },
        {
            label: "Guardar",
            variant: "success",
            icon: <SaveOutlined className="h-4 w-4" />,
            onClick: handleSave,
        },
        {
            label: "Volver al listado",
            variant: "secondary",
            icon: <XCircleIcon className="h-5 w-5" />,
            onClick: () => router.push("/picking/packing/repacking"),
        },
    ], [handleApply, handleSave, router]);
    /* ------------------------------------------------------------------------
       PageHeader 
    ------------------------------------------------------------------------ */
    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Repacking
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record.repackId || "--"}
                    </div>
                </div>
            ),
            action: actions
        } as unknown as PageHeaderProps),
        [actions, record.repackId]
    );

    /* ------------------------------------------------------------------------
       Render
    ------------------------------------------------------------------------ */
    return (
        <div className="p-6 space-y-10 bg-white">

            {/* Campos principales */}
            <RepackingFields
                isSummary={true}
                record={record}
                onChange={handleChange}
            />

        </div>
    );
}
