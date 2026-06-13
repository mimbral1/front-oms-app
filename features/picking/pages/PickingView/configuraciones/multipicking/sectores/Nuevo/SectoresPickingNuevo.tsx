// views\PickingView\configuraciones\multipicking\sectores\Nuevo\SectoresPickingNuevo.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    XCircleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";

import SectoresPickingFields, {
    SectorPicking,
} from "@/features/picking/components/pickingview/configuraciones/multipicking/sectores/SectoresPickingFields";
import { useApiSectoresPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/sectores-picking/api-sectores-picking";
import { useAuth } from "@/app/context/auth/AuthContext";

export default function SectoresPickingNuevo() {
    const router = useRouter();
    const { user } = useAuth();
    const { createZone } = useApiSectoresPicking();

    /* =======================
       Initial correcto
       ======================= */
    const initial: SectorPicking = {
        name: "",
        categoryIds: [],
        skuIds: [],
        maxQuantityOrders: 0,
        maxQuantityItems: 0,
    };

    const [record, setRecord] = useState<SectorPicking>(initial);
    const [saving, setSaving] = useState(false);

    const handle = <K extends keyof SectorPicking>(
        field: K,
        value: SectorPicking[K]
    ) => setRecord((p) => ({ ...p, [field]: value }));

    /* =======================
       Guardar
       ======================= */
    const handleSave = async (goBack = false, resetAfter = false) => {
        setSaving(true);

        try {
            await createZone({
                name: record.name,
                categoryIds: record.categoryIds,
                skuIds: record.skuIds,
                maxQuantityOrders: record.maxQuantityOrders,
                maxQuantityItems: record.maxQuantityItems,
                createdBy: Number(user?.id ?? 0),
            });

            toast.success("Sector de picking creado correctamente");

            if (resetAfter) {
                setRecord(initial);
            } else if (goBack) {
                router.push("/picking/configuraciones/multipicking/sectores");
            }
        } catch (error: any) {
            const message =
                error?.message ||
                "Ocurrió un error al crear el sector de picking";

            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    /* =======================
       PageHeader
       ======================= */
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => handleSave(true, false),
                disabled: saving,
            },
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
                onClick: () => handleSave(false, true),
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/configuraciones/multipicking/sectores"),
            },
        ],
        [saving, record]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Sectores de Picking</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    /* =======================
       Render
       ======================= */
    return (
        <div className="p-6 bg-white">
            <SectoresPickingFields
                record={record}
                readOnly={false}
                onChange={handle}
            />
        </div>
    );
}
