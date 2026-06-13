// views\Customers\Csx\EstadoTickets\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { EstadoTicketsFields, EstadoTicket } from "@/features/customers/components/csx/estadotickets/EstadoTicketsFields";

const EMPTY: EstadoTicket = {
    nombre: "",
    descripcion: "",
    color: "",
    statusInicial: false,
    statusFinal: false,
    notificable: false,
    defaultStockout: false,
    mostrarEnReportes: false,
    estado: "Activo",
    creador: { nombre: "—", email: "—", fecha: "—" },
};

export default function EstadoTicketsResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<EstadoTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    // Cargar detalle MOCK (campos completos como en la imagen)
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const idn = Number(recordId);
                const base: EstadoTicket[] = [
                    { id: 1, nombre: "Inicio", descripcion: "", color: "#1882cf", statusInicial: true, statusFinal: false, notificable: true, defaultStockout: false, mostrarEnReportes: true, estado: "Activo", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "07/06/2023 12:20:12" } },
                    { id: 2, nombre: "En progreso", descripcion: "Asignado", color: "#F59E0B", statusInicial: false, statusFinal: false, notificable: true, defaultStockout: false, mostrarEnReportes: true, estado: "Activo", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "07/06/2023 12:20:12" } },
                    { id: 3, nombre: "Resuelto", descripcion: "Solución aplicada", color: "#34D399", statusInicial: false, statusFinal: true, notificable: true, defaultStockout: false, mostrarEnReportes: true, estado: "Activo", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "07/06/2023 12:20:12" } },
                    { id: 4, nombre: "Cerrado", descripcion: "Cierre", color: "#6B7280", statusInicial: false, statusFinal: true, notificable: false, defaultStockout: true, mostrarEnReportes: false, estado: "Inactivo", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "07/06/2023 12:20:12" } },
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

    const handleChange = (field: keyof EstadoTicket, value: any) =>
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        if (!current) return;
        setSaving(true);
        try {
            // await fetchWithAuth(`config/estados-tickets/${current.id}`, { method: "PUT", body: JSON.stringify(current) });
            console.log("SAVE EstadoTicket (mock):", current);
        } finally {
            setSaving(false);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Guardar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/estado-tickets"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Estados de tickets</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre || "—"}</div>
                </div>
            ),
            action: headerActions,
            status: { text: record?.estado || "Activo", variant: (record?.estado || "Activo") === "Activo" ? "success" : "gray" },
        } as unknown as PageHeaderProps),
        [headerActions, record?.nombre, record?.estado]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el estado.</div>;

    return (
        <div className="p-6 bg-white">
            <EstadoTicketsFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
