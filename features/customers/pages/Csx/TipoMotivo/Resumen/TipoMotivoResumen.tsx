// views\Customers\Csx\TipoMotivo\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { TipoMotivoFields, TipoMotivo } from "@/features/customers/components/csx/tipomotivo/TipoMotivoFields";

/* Estado inicial (patrón Resumen) */  // header/acciones igual que tus vistas. :contentReference[oaicite:3]{index=3}
const EMPTY: TipoMotivo = {
    claimMotive: "",
    parent: "",
    nombre: "",
    descripcion: "",
    logistica: false,
    defaultStockout: false,
    items: false,
    pedidos: false,
    area: "",
    procesosAfectados: "",
    compensaciones: "",
    sla: 48,
    unidad: "Hours",
    prioridad: "Media",
    estado: "Activo",
};

export default function TipoMotivoResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<TipoMotivo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    // Carga MOCK por id consistente con el listado (mismo approach que usas en Views) :contentReference[oaicite:4]{index=4}
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const idn = Number(recordId);
                const base = [
                    {
                        id: 1,
                        claimMotive: "Devolución",
                        parent: "Devolución",
                        nombre: "Talle incorrecto",
                        descripcion: "Cliente compró talle incorrecto",
                        logistica: false,
                        defaultStockout: false,
                        items: true,
                        pedidos: true,
                        area: "Operación",
                        procesosAfectados: "Reingreso de mercadería",
                        compensaciones: "Giftcard a cliente",
                        sla: 48,
                        unidad: "Hours" as const,
                        prioridad: "Media" as const,
                        estado: "Activo" as const,
                    },
                    {
                        id: 2,
                        claimMotive: "Devolución",
                        parent: "Devolución",
                        nombre: "Producto dañado",
                        descripcion: "Producto viene con daño",
                        logistica: true,
                        defaultStockout: false,
                        items: true,
                        pedidos: false,
                        area: "Calidad",
                        procesosAfectados: "Revisión técnica",
                        compensaciones: "Cambio sin costo",
                        sla: 24,
                        unidad: "Hours" as const,
                        prioridad: "Alta" as const,
                        estado: "Activo" as const,
                    },
                    {
                        id: 3,
                        claimMotive: "Stockout",
                        parent: "Stockout",
                        nombre: "Falta de stock",
                        descripcion: "No hay stock disponible",
                        logistica: false,
                        defaultStockout: true,
                        items: false,
                        pedidos: true,
                        area: "Operación",
                        procesosAfectados: "Cancelación de pedido",
                        compensaciones: "Devolución de dinero",
                        sla: 72,
                        unidad: "Hours" as const,
                        prioridad: "Media" as const,
                        estado: "Inactivo" as const,
                    },
                ];

                const found = base.find((x) => x.id === idn);
                const mapped: TipoMotivo = found ? { ...found } : { ...EMPTY, nombre: "—" };
                if (!mounted) return;
                setRecord(mapped);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId]);

    const handleChange = (field: keyof TipoMotivo, value: any) =>
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        if (!current) return;
        setSaving(true);
        try {
            // await fetchWithAuth(`config/tipos-motivo/${current.id}`, { method: "PUT", body: JSON.stringify(current) });
            console.log("SAVE TipoMotivo (mock):", current);
        } finally {
            setSaving(false);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Guardar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/tipo-motivo"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Tipo de motivo</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre || "—"}</div>
                </div>
            ),
            action: headerActions,
            status: { text: record?.estado || "Activo", variant: (record?.estado || "Activo") === "Activo" ? "success" : "gray" },
        } as unknown as PageHeaderProps),
        [headerActions, record?.nombre, record?.estado]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el tipo de motivo.</div>;

    return (
        <div className="p-6 bg-white">
            <TipoMotivoFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
