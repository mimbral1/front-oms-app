// app/delivery/slots/nuevo/page.tsx
"use client";
import { DELIVERY_API_BASE } from "@/lib/delivery-api";

/* ---------- Nuevo Slot (acciones y header igual a tu patrón) ---------- */
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { SlotsFields, SlotForm } from "@/features/delivery/components/transportistas/slots/SlotsFields";

/* Registro inicial VACÍO (como pediste) */
const initialRecord: SlotForm = {
    carrierId: "",
    dateStart: "",
    dateEnd: "",
    locked: false,
    comment: false,
    maxShippingQuantity: "",
    maxPackageQuantity: "",
    maxProductQuantity: "",
    extraDeliveryCost: "",
    inventoryId: "",
    inventoryName: "",
    slotCode: "",
    skuId: "",
    skuName: "",
    isDefault: false,
    minUnits: "",
    maxUnits: "",
};

export default function SlotsNuevoView() {
    const router = useRouter();

    const [record, setRecord] = useState<SlotForm>({ ...initialRecord });
    const handleChange = (field: keyof SlotForm, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    const toIsoStringOrEmpty = (value?: string) => {
        if (!value) return "";
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return "";
        return dt.toISOString();
    };

    const handleCreate = useCallback(async (createAnother = false) => {
        const current = recordRef.current as SlotForm;

        // Validaciones mínimas
        const errors: string[] = [];
        if (!current.carrierId) errors.push("Falta seleccionar Transportista.");
        if (!current.dateStart) errors.push("Falta la Fecha inicio.");
        if (!current.dateEnd) errors.push("Falta la Fecha fin.");
        if (errors.length) {
            console.warn("Validación antes de POST:", errors);
            return;
        }

        const body = {
            carrierId: String(current.carrierId || ""),
            dateStart: toIsoStringOrEmpty(current.dateStart),
            dateEnd: toIsoStringOrEmpty(current.dateEnd),
            locked: Boolean(current.locked),
            comment: Boolean(current.comment),
            maxShippingQuantity: Number(current.maxShippingQuantity || 0),
            maxPackageQuantity: Number(current.maxPackageQuantity || 0),
            maxProductQuantity: Number(current.maxProductQuantity || 0),
            extraDeliveryCost: Number(current.extraDeliveryCost || 0),
        };

        const response = await fetch(`${DELIVERY_API_BASE}/time-slot`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status} ${errorText}`);
        }

        if (createAnother) {
            setRecord({ ...initialRecord }); // limpiar para crear uno nuevo
            return;
        }

        router.push("/delivery/transportistas/slots");
    }, [router]);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => handleCreate(false) },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => {
                    handleCreate(true);
                },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/transportistas/slots") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Slot</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <SlotsFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
