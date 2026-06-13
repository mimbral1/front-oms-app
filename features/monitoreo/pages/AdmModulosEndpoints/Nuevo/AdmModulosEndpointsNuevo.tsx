// views\MonitoreoView\AdmModulosEndpoints\Nuevo\Nuevo.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import {
    AdmModulosEndpointsFields,
    FormMode,
    ModuloForm,
    SubmoduloForm,
} from "@/features/monitoreo/components/admmodulosendpoints/AdmModulosEndpointsFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { toast } from "react-hot-toast";

/* ===== Constantes ===== */
const LIST_PATH = "/monitoreo/adm-modulos-endpoints";

const initialModulo: ModuloForm = { plataformaId: "", nombre: "", codigo: "", ruta: "", descripcion: "" };
const initialSubmodulo: SubmoduloForm = { moduloId: "", nombre: "", codigo: "", descripcion: "", ruta: "" };

export default function AdmModulosEndpointsNuevo() {
    const router = useRouter();
    const { fetchWithAuth } = useFetchWithAuth();

    const [mode, setMode] = useState<FormMode>("modulo");
    const [moduloForm, setModuloForm] = useState<ModuloForm>({ ...initialModulo });
    const [submoduloForm, setSubmoduloForm] = useState<SubmoduloForm>({ ...initialSubmodulo });
    const [saving, setSaving] = useState(false);

    const moduloRef = useRef(moduloForm);
    const submoduloRef = useRef(submoduloForm);
    React.useEffect(() => {
        moduloRef.current = moduloForm;
    }, [moduloForm]);
    React.useEffect(() => {
        submoduloRef.current = submoduloForm;
    }, [submoduloForm]);

    /* ===== Handlers de “create” por formulario ===== */
    const createModulo = useCallback(async () => {
        const f = moduloRef.current;
        const errors: string[] = [];
        if (!f.plataformaId) errors.push("Falta plataforma.");
        if (!f.nombre?.trim()) errors.push("Falta nombre.");
        if (!f.codigo?.trim()) errors.push("Falta código.");
        if (!f.ruta?.trim()) errors.push("Falta ruta.");
        if (errors.length) {
            toast.error("Completa todos los campos del módulo antes de guardar");
            return false;
        }

        await fetchWithAuth("idservice/modulos/modulos-plataforma", {
            method: "POST",
            body: JSON.stringify({
                plataformaId: Number(f.plataformaId),
                nombre: f.nombre,
                codigo: f.codigo,
                ruta: f.ruta,
                descripcion: f.descripcion || "",
            }),
        });
        return true;
    }, [fetchWithAuth]);

    const createSubmodulo = useCallback(async () => {
        const f = submoduloRef.current;
        const errors: string[] = [];
        if (!f.moduloId) errors.push("Falta módulo.");
        if (!f.nombre?.trim()) errors.push("Falta nombre.");
        if (!f.codigo?.trim()) errors.push("Falta código.");
        if (!f.ruta?.trim()) errors.push("Falta ruta.");
        if (errors.length) {
            toast.error("Completa todos los campos del submódulo antes de guardar");
            return false;
        }

        await fetchWithAuth("idservice/submodulos", {
            method: "POST",
            body: JSON.stringify({
                moduloId: Number(f.moduloId),
                nombre: f.nombre,
                codigo: f.codigo,
                descripcion: f.descripcion || "",
                ruta: f.ruta,
            }),
        });
        return true;
    }, [fetchWithAuth]);

    const handleSaveActive = useCallback(
        async ({ stay }: { stay: boolean }) => {
            setSaving(true);
            try {
                let ok = false;
                if (mode === "modulo") ok = await createModulo();
                if (mode === "submodulo") ok = await createSubmodulo();

                if (ok) {
                    toast.success(
                        mode === "modulo"
                            ? "Módulo creado correctamente"
                            : "Submódulo creado correctamente"
                    );
                    if (stay) {
                        // reset solo el form actual
                        if (mode === "modulo") setModuloForm({ ...initialModulo });
                        if (mode === "submodulo") setSubmoduloForm({ ...initialSubmodulo });
                    } else {
                        router.push(LIST_PATH);
                    }
                }
            } finally {
                setSaving(false);
            }
        },
        [mode, createModulo, createSubmodulo, router]
    );

    /* ===== Header (aplica al formulario activo) ===== */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => {
                    void handleSaveActive({ stay: true });
                }, // aplicar = guardar y quedarse
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-5 w-5" />,
                onClick: () => {
                    void handleSaveActive({ stay: false });
                }, // guardar = ir al listado
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push(LIST_PATH),
            },
        ],
        [router, handleSaveActive]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Administración</div>
                    <div className="text-2xl font-semibold text-gray-900">Módulos y Endpoints · Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    /* ===== Selector de formulario (tabs) ===== */
    const stepDefs: { key: FormMode; label: string }[] = [
        { key: "modulo", label: "1) Crear Módulo" },
        { key: "submodulo", label: "2) Crear Submódulo" },
    ];

    const handleStepKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const idx = stepDefs.findIndex((s) => s.key === mode);
        if (e.key === "ArrowRight") {
            const next = stepDefs[(idx + 1) % stepDefs.length].key;
            setMode(next);
        }
        if (e.key === "ArrowLeft") {
            const prev = stepDefs[(idx - 1 + stepDefs.length) % stepDefs.length].key;
            setMode(prev);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toolbar superior (tabs) */}
            <div role="tablist" aria-label="Selecciona formulario" onKeyDown={handleStepKeyDown} className="flex flex-wrap items-center gap-2">
                {stepDefs.map((s) => {
                    const active = mode === s.key;
                    return (
                        <button
                            key={s.key}
                            role="tab"
                            aria-selected={active}
                            aria-controls={`panel-${s.key}`}
                            className={[
                                "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60",
                                active ? "border-blue-500 bg-white text-blue-700" : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                            ].join(" ")}
                            onClick={() => setMode(s.key)}
                            disabled={saving}
                        >
                            <span className={["inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all", active ? "bg-blue-600 ring-blue-600" : "bg-white ring-gray-300 group-hover:ring-blue-400"].join(" ")} />
                            <span className="whitespace-nowrap">{s.label}</span>
                        </button>
                    );
                })}
            </div>

            <div id={`panel-${mode}`} className="p-6 bg-white rounded-xl border">
                <AdmModulosEndpointsFields
                    mode={mode}
                    moduloForm={moduloForm}
                    submoduloForm={submoduloForm}
                    onModuloChange={(k, v) => setModuloForm((p) => ({ ...p, [k]: v }))}
                    onSubmoduloChange={(k, v) => setSubmoduloForm((p) => ({ ...p, [k]: v }))}
                    isCreate
                />
            </div>
        </div>
    );
}
