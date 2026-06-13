// views\MonitoreoView\AdmModulosEndpoints\Resumen\MatchSubmoduloEndpoitView.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import MatchSubmoduloEndpoitFields, { MatchForm, EndpointRow } from "@/features/monitoreo/components/admmodulosendpoints/MatchSubmoduloEndpoitFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { toast } from "react-hot-toast";

const LIST_PATH = "/monitoreo/adm-modulos-endpoints"; // ruta de listado general

const blankEndpoint = (): EndpointRow => ({
    metodoHttp: "GET",
    path: "",
    target: "",
    activo: true,
});

const initialMatch: MatchForm = {
    subModuloId: "",
    endpoints: [blankEndpoint()], // fila por defecto
};

export default function MatchSubmoduloEndpoitView() {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const moduloId = Number(params?.id ?? 0);

    const { fetchWithAuth } = useFetchWithAuth();

    const [matchForm, setMatchForm] = useState<MatchForm>({ ...initialMatch });
    const [saving, setSaving] = useState(false);

    // opciones de submódulos (selector)
    const [submodOptions, setSubmodOptions] = useState<{ label: string; value: string }[]>([]);
    const [submodSearch, setSubmodSearch] = useState("");
    const [loadingSubmods, setLoadingSubmods] = useState(false);

    const matchRef = useRef(matchForm);
    useEffect(() => { matchRef.current = matchForm; }, [matchForm]);

    // Cargar submódulos del módulo actual
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!moduloId) return;
            try {
                setLoadingSubmods(true);
                const res = await fetchWithAuth<{ submodulos: any[] }>(`idservice/detalle/${moduloId}?view=submodulos`);
                const list = Array.isArray(res?.submodulos) ? res.submodulos : [];
                if (!mounted) return;
                setSubmodOptions([
                    { label: "Seleccione submódulo…", value: "" },
                    ...list.map((s) => ({
                        label: `${s?.nombre ?? ""} (${s?.codigo ?? ""}) — ${s?.ruta ?? ""}`,
                        value: String(s?.id ?? ""),
                    })),
                ]);
            } finally {
                if (mounted) setLoadingSubmods(false);
            }
        };
        void load();
        return () => { mounted = false; };
    }, [fetchWithAuth, moduloId]);

    // POST por cada fila creada
    const createEndpoints = useCallback(async () => {
        const f = matchRef.current;
        const errors: string[] = [];
        if (!f.subModuloId) errors.push("Falta Submódulo.");
        if (!f.endpoints.length) errors.push("Agrega al menos un endpoint.");
        if (errors.length) {
            toast.error("Completa el submódulo y agrega al menos un endpoint válido");
            return false;
        }

        try {
            for (const e of f.endpoints) {
                await fetchWithAuth("idservice/endpoints/post", {
                    method: "POST",
                    body: JSON.stringify({
                        subModuloId: Number(f.subModuloId),
                        metodoHttp: e.metodoHttp,
                        path: e.path,
                        target: e.target,
                        activo: !!e.activo,
                    }),
                });
            }
        } catch (err) {
            toast.error("Ocurrió un error al crear uno de los endpoints");
            return false;
        }

        return true;
    }, [fetchWithAuth]);

    const handleSave = useCallback(
        async ({ stay }: { stay: boolean }) => {
            setSaving(true);
            try {
                const ok = await createEndpoints();
                if (!ok) return;

                toast.success("Endpoints creados correctamente");

                if (stay) {
                    // Mantener submódulo seleccionado, limpiar filas y dejar 1 vacía
                    setMatchForm((prev) => ({ subModuloId: prev.subModuloId, endpoints: [blankEndpoint()] }));
                } else {
                    router.push(LIST_PATH);
                }
            } finally {
                setSaving(false);
            }
        },
        [createEndpoints, router]
    );

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => { void handleSave({ stay: true }); },
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-5 w-5" />,
                onClick: () => { void handleSave({ stay: false }); },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push(LIST_PATH),
            },
        ],
        [router, handleSave]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Administración</div>
                    <div className="text-2xl font-semibold text-gray-900">Match Submódulo → Endpoint(s) </div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="space-y-6">
            <div id="panel-match" className="p-6 bg-white rounded-xl border">
                <MatchSubmoduloEndpoitFields
                    matchForm={matchForm}
                    onMatchChange={setMatchForm}
                    isCreate
                    // selector de submódulos
                    submodOptions={submodOptions}
                    submodSearch={submodSearch}
                    onSubmodSearch={setSubmodSearch}
                    loadingSubmods={loadingSubmods}
                />
            </div>
        </div>
    );
}
