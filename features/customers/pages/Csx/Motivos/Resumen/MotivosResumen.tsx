// views\Customers\Csx\Motivos\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { MotivosFields, Motivo, Estado } from "@/features/customers/components/csx/motivos/MotivosFields";

const EMPTY: Motivo = {
    id: "",
    nombre: "",
    descripcion: "",
    logistica: false,
    defaultStockout: false,
    estado: "Activo",
    creador: { nombre: "—", email: "—", fecha: "—" },
};

export default function MotivosResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<Motivo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Refs estables
    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    // Cargar detalle (MOCK desde el listado)
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                // Mock by ID (sin API aún)
                const idn = Number(recordId);
                const base = [
                    { id: 1, nombre: "Devolución", descripcion: "Devolución de mercadería", logistica: true, defaultStockout: false, estado: "Activo" as Estado, creado: "07/06/2023 12:01:42", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "07/06/2023 12:01:42" } },
                    { id: 2, nombre: "Cambio", descripcion: "Cambio por talla/color", logistica: false, defaultStockout: false, estado: "Activo" as Estado, creado: "02/05/2023 09:15:10", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "02/05/2023 09:15:10" } },
                    { id: 3, nombre: "Stockout", descripcion: "Falta de stock", logistica: false, defaultStockout: true, estado: "Inactivo" as Estado, creado: "18/04/2023 16:44:20", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "18/04/2023 16:44:20" } },
                    { id: 4, nombre: "Daño", descripcion: "Producto dañado", logistica: true, defaultStockout: false, estado: "Activo" as Estado, creado: "12/03/2023 11:03:00", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "12/03/2023 11:03:00" } },
                    { id: 5, nombre: "Pedido", descripcion: "Pedido del cliente", logistica: false, defaultStockout: false, estado: "Inactivo" as Estado, creado: "25/02/2023 08:22:31", creador: { nombre: "Manuel Vilche", email: "manuel.vilche@...", fecha: "25/02/2023 08:22:31" } },
                ];

                const found = base.find((x) => x.id === idn);
                const mapped: Motivo = found
                    ? {
                        id: found.id,
                        nombre: found.nombre,
                        descripcion: found.descripcion,
                        logistica: found.logistica,
                        defaultStockout: found.defaultStockout,
                        estado: found.estado,
                        creador: found.creador,
                    }
                    : { ...EMPTY, id: recordId || "" };

                if (!mounted) return;
                setRecord(mapped);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (recordId) load();
        return () => {
            mounted = false;
        };
    }, [recordId]);

    const handleChange = (field: keyof Motivo, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        if (!current) return;
        setSaving(true);
        try {
            // await fetchWithAuth("config/motivos/{id}", { method: "PUT", body: JSON.stringify(current) });
            console.log("SAVE Motivo (mock):", current);
        } finally {
            setSaving(false);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/motivos"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Motivos</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre || "—"}</div>
                </div>
            ),
            action: headerActions,
            status: { text: record?.estado || "Activo", variant: record?.estado === "Activo" ? "success" : "gray" },
        } as unknown as PageHeaderProps),
        [headerActions, record?.nombre, record?.estado]
    );


    if (!record) return <div className="p-6 text-red-600">No se encontró el motivo.</div>;

    return (
        <div className="p-6 bg-white">
            <MotivosFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
