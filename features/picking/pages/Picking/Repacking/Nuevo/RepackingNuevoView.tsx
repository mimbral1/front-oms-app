// views\Picking\Repacking\Nuevo\RepackingNuevoView.tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
    XCircleIcon
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import RepackingFields, {
    RepackingRecord,
    RepackingItem
} from "@/features/picking/components/picking/repacking/RepackingFields";
import { FaPlus } from "react-icons/fa";

/* ============================================================================
   Registro inicial vacío
   ============================================================================ */

const EMPTY_ITEM: RepackingItem = {
    sku: "",
    descripcion: "",
    cantidad: "",
    pesoKg: ""
};

const initialRecord: RepackingRecord = {
    repackId: "",
    orderId: "",
    referenceId: "",
    ean: "",
    tipoPaquete: "",
    retornable: false,
    unidadesTotales: "",
    skusTotales: "",

    warehouse: "",
    posicion: "",
    dimensiones: "",
    pesoTotal: "",
    volumen: "",
    cubing: "",

    items: [{ ...EMPTY_ITEM }, { ...EMPTY_ITEM }, { ...EMPTY_ITEM }],

    paquetesAnidados: "",

    creadoPor: undefined,
    fechaCreacion: undefined,
    modificadoPor: undefined,
    fechaModificacion: undefined
};

/* ============================================================================
   Componente principal
   ============================================================================ */

export default function RepackingNuevoView() {
    const router = useRouter();

    const [record, setRecord] = useState<RepackingRecord>({
        ...initialRecord
    });

    const recordRef = useRef(record);
    recordRef.current = record;

    const handleChange = (field: keyof RepackingRecord, value: any) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    };

    /* ------------------------------------------------------------------------
       Acciones de creación 
    ------------------------------------------------------------------------ */
    const handleCreate = useCallback(async () => {
        const r = recordRef.current;

        // Validaciones básicas (mismo estilo que Perfiles)
        const errors: string[] = [];
        if (!r.repackId.trim()) errors.push("Falta Repack ID");
        if (!r.orderId.trim()) errors.push("Falta Order ID");
        if (!r.ean.trim()) errors.push("Falta EAN");

        if (errors.length > 0) {
            console.warn("Validaciones fallidas en Repacking Nuevo:", errors);
            return;
        }

        console.log("Mock POST Repacking:", r);

        // reset igual que Perfiles
        setRecord({ ...initialRecord });
    }, []);

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
            label: "Guardar",
            variant: "success",
            icon: <SaveOutlined className="h-4 w-4" />,
            onClick: handleApply,
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
                        Nuevo
                    </div>
                </div>
            ),
            action: actions
        } as unknown as PageHeaderProps),
        [actions]
    );

    /* ------------------------------------------------------------------------
       Render
    ------------------------------------------------------------------------ */

    return (
        <div className="p-6 space-y-6 bg-white">
            <RepackingFields
                isSummary={false}
                record={record}
                onChange={handleChange}
            />
        </div>
    );
}
