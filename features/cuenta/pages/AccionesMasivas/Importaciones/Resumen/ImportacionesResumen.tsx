// app/views/Operaciones/Importaciones/Detail/ImportacionesResumenView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { ImportacionesFields, type Importacion } from "@/features/cuenta/components/accionesmasivas/importaciones/ImportacionesFields";

/* --------------------------------------------------------------------------
   Mocks (reflejan exactamente lo de las capturas)
--------------------------------------------------------------------------- */
const MOCKS: Record<string, Importacion> = {
    "1": {
        id: "1",
        service: "catalog",
        entity: "category",
        fileName: "category-batch.json",
        size: "0.0002MB",
        mimeType: "application/json",
        startDate: "17/11/2021 19:25",
        endDate: "17/11/2021 19:25",
        viewLink: "/catalog/category/browse",
        total: 2,
        created: 0,
        updated: 2,
        notModified: 0,
        error: 0,
        status: "Processed",
        createdBy: { username: "Juan Hapes", email: "juan@fizzmod.c…", date: "17/11/2021 19:25:33" },
        lastModified: { date: "17/11/2021 19:25:44" },
    },
};

export default function ImportacionesResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<Importacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Mantener refs estables para evitar loops en header
    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    /* cargar (mock) */
    useEffect(() => {
        setLoading(true);
        const r = MOCKS[String(recordId)] ?? null;
        setRecord(r);
        setLoading(false);
    }, [recordId]);

    /* handlers */
    const handleChange = (field: keyof Importacion, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        if (!current) return;
        setSaving(true);
        try {
            // Aquí iría el PUT real (cuando exista API)
            // await fetchWithAuth(...)
            console.log("Guardado (mock):", current);
        } finally {
            setSaving(false);
        }
    }, []);

    /* header */
    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Guardar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />, onClick: handleSave, disabled: saving },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/acciones-masivas/importaciones"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Importación</div>
                    <div className="text-2xl font-semibold text-gray-900">Resumen</div>
                </div>
            ),
            action: headerActions,
            status: record
                ? { text: record.status === "Processed" ? "Procesado" : record.status === "Processing" ? "Procesando" : "Error", variant: record.status === "Processed" ? "success" : record.status === "Processing" ? "info" : "danger" }
                : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, record?.status]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró la importación.</div>;

    return (
        <div className="p-6 bg-white">
            {/* En Resumen NO pasamos isCreate para mostrar tarjetas de usuario */}
            <ImportacionesFields record={record} onChange={handleChange} />
        </div>
    );
}
