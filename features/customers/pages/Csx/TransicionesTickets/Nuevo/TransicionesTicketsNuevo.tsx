// app/views/Configuracion/TransicionesTickets/New/TransicionesTicketsNuevoView.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { TransicionesTicketsFields, TransicionTicket } from "@/features/customers/components/csx/transicionestickets/TransicionesTicketsFields";

const initialRecord: TransicionTicket = {
    claimMotive: "Devolución",
    nombre: "",
    descripcion: "",
    statusFrom: "En progreso",
    statusTo: "Finalizado con éxito",
    color: "",
    permisoRequerido: true,
    statusResolucion: true,
    estado: "Activo",
};

export default function TransicionesTicketsNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<TransicionTicket>({ ...initialRecord });
    const recordRef = useRef(record);
    React.useEffect(() => { recordRef.current = record; }, [record]);

    const handleChange = (field: keyof TransicionTicket, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        const errors: string[] = [];
        if (!current?.nombre) errors.push("Falta el nombre.");
        if (!current?.claimMotive) errors.push("Falta el Claim motive.");
        if (!current?.statusFrom) errors.push("Falta Status from.");
        if (!current?.statusTo) errors.push("Falta Status to.");
        if (errors.length) {
            console.warn("Validación antes de crear:", errors);
            return;
        }
        try {
            // await fetchWithAuth("config/transiciones-tickets", { method: "POST", body: JSON.stringify(current) });
            console.log("CREATE Transición (mock):", current);
            setRecord({ ...initialRecord });
        } catch (e) {
            console.error("Error creando transición:", e);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleCreate },
            { label: "Guardar & Crear nuevo", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => handleCreate() },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/transiciones-tickets") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Transiciones</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <TransicionesTicketsFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
