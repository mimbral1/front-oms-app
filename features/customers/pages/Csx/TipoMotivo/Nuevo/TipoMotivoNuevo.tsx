// views\Customers\Csx\TipoMotivo\Nuevo\Nuevo.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { TipoMotivoFields, TipoMotivo } from "@/features/customers/components/csx/tipomotivo/TipoMotivoFields";

/* Patrón de tus pantallas “Nuevo” (acciones y header). :contentReference[oaicite:5]{index=5} :contentReference[oaicite:6]{index=6} */
const initialRecord: TipoMotivo = {
    claimMotive: "Devolución",
    parent: "Devolución",
    nombre: "",
    descripcion: "",
    logistica: false,
    defaultStockout: false,
    items: false,
    pedidos: false,
    area: "Operación",
    procesosAfectados: "",
    compensaciones: "",
    sla: 48,
    unidad: "Hours",
    prioridad: "Media",
    estado: "Activo",
};

export default function TipoMotivoNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<TipoMotivo>({ ...initialRecord });
    const recordRef = useRef(record);
    React.useEffect(() => { recordRef.current = record; }, [record]);

    const handleChange = (field: keyof TipoMotivo, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        // Validaciones mínimas
        const errors: string[] = [];
        if (!current?.nombre) errors.push("Falta el nombre.");
        if (!current?.claimMotive) errors.push("Falta el Claim motive.");
        if (errors.length) {
            console.warn("Validación antes de crear:", errors);
            return;
        }
        try {
            // await fetchWithAuth("config/tipos-motivo", { method: "POST", body: JSON.stringify(current) });
            console.log("CREATE TipoMotivo (mock):", current);
            setRecord({ ...initialRecord }); // limpiar para “crear otro”
        } catch (e) {
            console.error("Error creando tipo de motivo:", e);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleCreate },
            { label: "Guardar & Crear nuevo", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => handleCreate() },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/tipo-motivo") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Tipo de motivo</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <TipoMotivoFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
