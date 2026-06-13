// views\Cuenta\Trace\ImportarLogs\Resumen\Resumen.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import {
    ImportarLogsFieldsResumen,
    type ImportLogResumenFields,
} from "@/features/cuenta/components/trace/importarlogs/ImportarLogsFieldsResumen";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";

const MOCK = {
    id: "625f0d9ebcd30700090b24c4",
    servicio: "commerce",
    entidad: "api",
    idEntidad: "-",
    motivo: "-",
    fechaDesde: "11/08/2020 00:00:00",
    fechaHasta: "15/08/2020 23:59:59",
    athenaId: "2a257e8f-db16-4650-8867-f0c84b785cde",
    cantidad: 10,
    tamano: "0 GB",
    tiempo: "2.33 secs",
    createdBy: { initials: "FP", name: "Franco Pilafis", email: "franco.pilafis@janis.com", date: "—" },
};

export default function ImportarLogsResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState<ImportLogResumenFields | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                // const res = await fetchWithAuth(`tools/import-logs/${recordId}`);
                const mapped: ImportLogResumenFields = { ...MOCK, id: String(recordId ?? MOCK.id) };
                if (!mounted) return;
                setRecord(mapped);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [recordId, fetchWithAuth]);

    const handleChange = useCallback((field: keyof ImportLogResumenFields, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    }, []);

    const handleSave = useCallback(async () => {
        if (!record) return;
        const payload = {
            Service: record.servicio,
            Entity: record.entidad,
            EntityId: record.idEntidad || null,
            Reason: record.motivo || null,
            From: record.fechaDesde,
            To: record.fechaHasta,
            AthenaId: record.athenaId,
            Count: Number(record.cantidad ?? 0),
            Size: record.tamano,
            ExecTime: record.tiempo,
            UserModified: Number(user?.id ?? 0),
        };
        try {
            // await fetchWithAuth(`tools/import-logs/${record.id}`, { method: "PUT", body: JSON.stringify(payload) });
        } catch (e) {
            console.error("Error guardando Importar Logs:", e);
        }
    }, [record, user, fetchWithAuth]);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: handleSave },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleSave },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/trace/importar-logs") },
        ],
        [router, handleSave]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Importar logs</div>
                    <div className="text-2xl font-semibold text-gray-900">#{recordId}</div>
                </div>
            ),
            action: headerActions,
            status: { text: "Completado", variant: "success" },
        } as PageHeaderProps),
        [recordId, headerActions]
    );

    if (loading || !record) return <div className="p-6">Cargando…</div>;

    return (
        <div className="p-6 bg-white">
            <ImportarLogsFieldsResumen record={record} onChange={handleChange} />
        </div>
    );
}
