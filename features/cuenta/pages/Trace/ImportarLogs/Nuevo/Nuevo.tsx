// views\Cuenta\Trace\ImportarLogs\Nuevo\Nuevo.tsx

"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { ImportarLogsFieldsNuevo, type ImportLogNuevo } from "@/features/cuenta/components/trace/importarlogs/ImportarLogsFieldsNuevo";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

/* Estado inicial */
const today = () => new Date().toISOString().slice(0, 10);
const initialRecord: ImportLogNuevo = {
    servicio: "wms",
    entidad: "sku_position",
    idEntidad: "",
    motivo: "new",
    fechaDesdeDate: today(),
    fechaDesdeTime: "00:00",
    fechaHastaDate: today(),
    fechaHastaTime: "23:59",
};

export default function ImportarLogsNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<ImportLogNuevo>({ ...initialRecord });
    const handleChange = (field: keyof ImportLogNuevo, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    const handleCreate = useCallback(async () => {
        const r = recordRef.current;
        const currentUser = userRef.current;

        const payload = {
            Service: r.servicio,
            Entity: r.entidad,
            EntityId: r.idEntidad || null,
            Reason: r.motivo || null,
            From: `${r.fechaDesdeDate} ${r.fechaDesdeTime}:00`,
            To: `${r.fechaHastaDate} ${r.fechaHastaTime}:59`,
            UserCreated: Number(currentUser?.id ?? 0),
        };

        try {
            // await fetchWithAuth("tools/import-logs/Crear", { method: "POST", body: JSON.stringify(payload) });
            setRecord({ ...initialRecord });
        } catch (err: any) {
            console.error("Error creando importación de logs:", err?.payload ?? err);
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
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/trace/importar-logs") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Importar logs</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <ImportarLogsFieldsNuevo record={record} onChange={handleChange} />
        </div>
    );
}
