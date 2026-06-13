// views\Delivery\Configuraciones\Feriados\Nuevo\Nuevo.tsx
"use client";

/* === Nuevo Holiday (POST) ===
   - POST /holidays
   - Header: Guardar / Guardar & Crear nuevo / Cancelar
   - Pasa isCreate al Fields para ocultar tarjetas de usuarios
*/

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { HolidaysFields, HolidayRecord } from "@/features/delivery/components/configuraciones/feriados/HolidaysFields";
import { useFetchWithAuth } from "@/lib/http/client";

const INITIAL: HolidayRecord = {
    name: "",
    day: "",
    status: "active",
    target: { delivery: false },
    scope: { carrierIds: [], carrierReferenceIds: [] },
    description: "",
};

export default function HolidaysNuevoView() {
    const router = useRouter();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<HolidayRecord>({ ...INITIAL });

    const handleChange = (field: keyof HolidayRecord, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const ref = useRef(record);
    useEffect(() => {
        ref.current = record;
    }, [record]);

    const create = useCallback(async () => {
        const current = ref.current;
        const payload = {
            name: (current?.name || "").trim(),
            day: current?.day || "",
            status: current?.status || "active",
            target: { delivery: !!current?.target?.delivery },
            scope: {
                carrierIds: current?.scope?.carrierIds ?? [],
                carrierReferenceIds: current?.scope?.carrierReferenceIds ?? [],
            },
            description: current?.description ?? "",
            user: "JCS01",
        };

        const errors: string[] = [];
        if (!payload.name) errors.push("Falta el nombre.");
        if (!payload.day) errors.push("Falta la fecha.");

        if (errors.length) {
            console.warn("Validación:", errors);
            return;
        }

        try {
            const resp = await fetchWithAuth<any>("comerce-service/holidays", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            console.log(resp?.message ?? "Holiday creada.");
            setRecord({ ...INITIAL });
        } catch (e) {
            console.error("POST holiday error:", e);
        }
    }, [fetchWithAuth]);

    const actions: Action[] = useMemo(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-5 w-5" />,
                onClick: async () => {
                    await create();     // 1) guarda
                    router.push("/delivery/configuraciones/feriados");          // 2) vuelve al listado
                },
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
                onClick: create,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/configuraciones/feriados") },
        ],
        [router, create]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Feriados</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: actions,
        } as unknown as PageHeaderProps),
        [actions]
    );

    return (
        <div className="p-6 bg-white">
            <HolidaysFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
