// views\PickingView\configuraciones\multipicking\esquemas\Nuevo\EsquemasPickingNuevo.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { EsquemasPickingFields, type PickingScheme } from "@/features/picking/components/pickingview/configuraciones/multipicking/esquemas/EsquemasPickingFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { toast } from "react-hot-toast";
import { useApiEsquemasPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/esquemas-picking/api-esquemas-picking";

/* =======================
   Estado inicial
======================= */
const EMPTY_RECORD: PickingScheme = {
    nombre: "",
    pickingZones: [],
    default: false,
    estado: "Activo",
};

export default function EsquemasPickingNuevo() {
    const router = useRouter();
    const { user } = useAuth();
    const { createPickingSchema } = useApiEsquemasPicking();

    const [record, setRecord] = useState<PickingScheme>(EMPTY_RECORD);
    const [saving, setSaving] = useState(false);

    const recordRef = useRef(record);
    const createPickingSchemaRef = useRef(createPickingSchema);

    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    useEffect(() => {
        createPickingSchemaRef.current = createPickingSchema;
    }, [createPickingSchema]);

    const handle = <K extends keyof PickingScheme>(
        field: K,
        value: PickingScheme[K]
    ) => setRecord((p) => ({ ...p, [field]: value }));

    /* =======================
       POST esquema
    ======================= */
    const handleSave = useCallback(async (goBack = false, resetAfter = false) => {
        const currentRecord = recordRef.current;

        if (!currentRecord.nombre?.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }

        setSaving(true);

        try {
            await createPickingSchemaRef.current({
                name: currentRecord.nombre,
                isDefault: currentRecord.default,
                pickingZoneIds: currentRecord.pickingZones,
                status: currentRecord.estado === "Activo" ? "active" : "inactive",
                userCreated: Number(user?.id),
            });

            toast.success("Esquema de picking creado correctamente");

            if (resetAfter) {
                setRecord(EMPTY_RECORD);
            } else if (goBack) {
                router.push("/picking/configuraciones/multipicking/esquemas");
            }
        } catch (e: any) {
            toast.error(
                e?.message || "Ocurrió un error al crear el esquema de picking"
            );
        } finally {
            setSaving(false);
        }
    }, [user?.id, router]);

    /* =======================
       Header
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
                variant: "success",
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
                onClick: () => router.push("/picking/configuraciones/multipicking/esquemas"),
            },
        ],
        [saving, handleSave]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Esquemas de Picking
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Nuevo
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <EsquemasPickingFields
                record={record}
                readOnly={false}
                onChange={handle}
            />
        </div>
    );
}