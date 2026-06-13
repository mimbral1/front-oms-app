// views\Customers\Csx\EstadoTickets\Nuevo\Nuevo.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { EstadoTicketsFields, EstadoTicket } from "@/features/customers/components/csx/estadotickets/EstadoTicketsFields";

const initialRecord: EstadoTicket = {
    nombre: "",
    descripcion: "",
    color: "#1882cf",
    statusInicial: true,
    statusFinal: false,
    notificable: true,
    defaultStockout: false,
    mostrarEnReportes: true,
    estado: "Activo",
};

export default function EstadoTicketsNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<EstadoTicket>({ ...initialRecord });
    const recordRef = useRef(record);
    React.useEffect(() => { recordRef.current = record; }, [record]);

    const handleChange = (field: keyof EstadoTicket, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        const errors: string[] = [];
        if (!current?.nombre) errors.push("Falta el nombre.");
        if (errors.length) {
            console.warn("Validación antes de crear:", errors);
            return;
        }
        try {
            // await fetchWithAuth("config/estados-tickets", { method: "POST", body: JSON.stringify(current) });
            console.log("CREATE EstadoTicket (mock):", current);
            setRecord({ ...initialRecord });
        } catch (e) {
            console.error("Error creando estado:", e);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleCreate },
            { label: "Guardar & Crear nuevo", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => handleCreate() },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/estado-tickets") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Estados de tickets</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <EstadoTicketsFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
