// app/views/Configuracion/TransicionesTickets/Detail/TransicionesTicketsResumenView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { TransicionesTicketsFields, TransicionTicket } from "@/features/customers/components/csx/transicionestickets/TransicionesTicketsFields";

const EMPTY: TransicionTicket = {
    claimMotive: "",
    nombre: "",
    descripcion: "",
    statusFrom: "",
    statusTo: "",
    color: "",
    permisoRequerido: false,
    statusResolucion: false,
    estado: "Activo",
};

export default function TransicionesTicketsResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<TransicionTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    // Carga MOCK por id (consistente con la lista)
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const idn = Number(recordId);
                const base: (TransicionTicket & { id: number })[] = [
                    {
                        id: 1,
                        claimMotive: "Devolución",
                        nombre: "Cierre",
                        descripcion: "Cierre con éxito",
                        statusFrom: "En progreso",
                        statusTo: "Finalizado con éxito",
                        color: "#10B981",
                        permisoRequerido: true,
                        statusResolucion: true,
                        estado: "Activo",
                    },
                    {
                        id: 2,
                        claimMotive: "Devolución",
                        nombre: "Reapertura",
                        descripcion: "Reabrir caso",
                        statusFrom: "Finalizado con éxito",
                        statusTo: "En progreso",
                        color: "#F59E0B",
                        permisoRequerido: false,
                        statusResolucion: false,
                        estado: "Activo",
                    },
                    {
                        id: 3,
                        claimMotive: "Cambio",
                        nombre: "Escalamiento",
                        descripcion: "Escalar a segundo nivel",
                        statusFrom: "En progreso",
                        statusTo: "Escalado",
                        color: "#3B82F6",
                        permisoRequerido: true,
                        statusResolucion: false,
                        estado: "Inactivo",
                    },
                ];

                const found = base.find((x) => x.id === idn);
                setRecord(found ? found : { ...EMPTY, id: recordId || "" });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId]);

    const handleChange = (field: keyof TransicionTicket, value: any) =>
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        if (!current) return;
        setSaving(true);
        try {
            // await fetchWithAuth(`config/transiciones-tickets/${current.id}`, { method: "PUT", body: JSON.stringify(current) });
            console.log("SAVE Transición (mock):", current);
        } finally {
            setSaving(false);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Guardar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/transiciones-tickets"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Transiciones</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre || "—"}</div>
                </div>
            ),
            action: headerActions,
            status: { text: record?.estado || "Activo", variant: (record?.estado || "Activo") === "Activo" ? "success" : "gray" },
        } as unknown as PageHeaderProps),
        [headerActions, record?.nombre, record?.estado]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró la transición.</div>;

    return (
        <div className="p-6 bg-white">
            <TransicionesTicketsFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
