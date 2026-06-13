// app/views/Operaciones/Solicitudes/New/SolicitudesRmsNuevoView.tsx
"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { SolicitudRms, SolicitudesRmsFields } from "@/features/customers/components/logistica/solicitudesview/SolicitudesRmsFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

/* Registro inicial vacío (mismo patrón que Nuevo de sales-channels) */
const initialRecord: SolicitudRms = {
    transportista: "",
    deadline: "",
    clienteNombre: "",
    clienteApellido: "",
    clienteEmail: "",
    flowName: "",
    permitirSustitucion: false,
    pickearNuevoPedido: false,
    facturarPedido: false,
    solicitarNotaCredito: false,
};

export default function SolicitudesRmsNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<SolicitudRms>({ ...initialRecord });
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    const handleChange = (field: keyof SolicitudRms, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // POST real (cuando tengas endpoint): de momento lo dejamos preparado
    const handleCreate = useCallback(async () => {
        const current = recordRef.current as any;
        const currentUser = userRef.current;

        // Validaciones mínimas según UI
        const errors: string[] = [];
        if (!current?.flowName) errors.push("Falta el nombre del Flow.");
        if (!current?.clienteEmail) errors.push("Falta el email del cliente.");

        if (errors.length) {
            console.warn("Validación antes de POST:", errors);
            return;
        }

        try {
            // ejemplo: await fetchWithAuth("rms-service/requests", { method: "POST", body: JSON.stringify(payload) });
            // MOCK: no llamamos aún
            setRecord({ ...initialRecord }); // limpiar (como en Nuevo de referencia)
        } catch (err: any) {
            console.error("Error creando solicitud RMS:", err?.payload ?? err);
        }
    }, [fetchWithAuth]);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleCreate },
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
                onClick: () => {
                    handleCreate();
                },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/logistica/solicitudes-rms") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Solicitudes RMS</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    ); // Patrón igual al Nuevo de sales-channels. :contentReference[oaicite:5]{index=5}

    return (
        <div className="p-6 bg-white">
            {/* isCreate -> oculta tarjetas de usuario como en el Fields de referencia */}
            <SolicitudesRmsFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
