// views\MonitoreoView\AdmModulosEndpoints\Resumen\ResumenModulosView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, CheckCircleIcon, ClipboardDocumentListIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import Card from "@/components/ui/card/Card";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";
import { toast } from "react-hot-toast";

/* ===== Tipos ===== */
type ApiModuloDetalle = {
    modulo: {
        id: number;
        plataformaId: number;
        nombre: string;
        codigo: string;
        ruta: string;
        descripcion: string | null;
        plataforma?: { id: number; nombre: string; codigo: string };
    };
};

type ModuloForm = {
    id?: number;
    plataformaId?: string;
    nombre: string;
    codigo: string;
    ruta: string;
    descripcion: string;
};

const LIST_PATH = "/monitoreo/adm-modulos-endpoints";

export default function ResumenModulosView() {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const moduloId = Number(params?.id ?? 0);

    const { fetchWithAuth } = useFetchWithAuth();

    const [form, setForm] = useState<ModuloForm>({
        id: moduloId,
        plataformaId: "",
        nombre: "",
        codigo: "",
        ruta: "",
        descripcion: "",
    });
    const formRef = useRef(form);
    useEffect(() => { formRef.current = form; }, [form]);

    /* ===== Carga de opciones (plataformas) ===== */
    const [platformOptions, setPlatformOptions] = useState<{ label: string; value: string }[]>([]);
    const [platformSearch, setPlatformSearch] = useState("");
    const [loadingPlatforms, setLoadingPlatforms] = useState(false);

    useEffect(() => {
        let mounted = true;
        const loadPlatforms = async () => {
            try {
                setLoadingPlatforms(true);
                const res = await fetchWithAuth<any>("idservice/plataformas/obtener");
                const list: any[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
                if (!mounted) return;
                setPlatformOptions(
                    list.map((p) => ({
                        label: `${String(p?.NOMBRE ?? "")} (${String(p?.CODIGO ?? "")})`.trim(),
                        value: String(p?.ID ?? ""),
                    }))
                );
            } catch {
                setPlatformOptions([]);
                toast.error("No se pudieron cargar las plataformas");
            } finally {
                if (mounted) setLoadingPlatforms(false);
            }
        };
        void loadPlatforms();
        return () => { mounted = false; };
    }, [fetchWithAuth]);

    const filteredPlatforms = useMemo(() => {
        const q = platformSearch.toLowerCase();
        const base = [{ label: "Seleccione plataforma…", value: "" }, ...platformOptions];
        if (!q) return base;
        return base.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [platformOptions, platformSearch]);

    /* ===== Fetch detalle (solo resumen) ===== */
    const [loading, setLoading] = useState(true);

    const fetchResumen = useCallback(async () => {
        if (!moduloId) return;
        setLoading(true);
        try {
            const res = await fetchWithAuth<ApiModuloDetalle>(`idservice/detalle/${moduloId}?view=resumen`);
            const m = res?.modulo;
            setForm({
                id: m?.id,
                plataformaId: String(m?.plataformaId ?? ""),
                nombre: m?.nombre ?? "",
                codigo: m?.codigo ?? "",
                ruta: m?.ruta ?? "",
                descripcion: m?.descripcion ?? "",
            });
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuth, moduloId]);

    useEffect(() => { void fetchResumen(); }, [fetchResumen]);

    /* ===== Guardar (placeholder hasta confirmar endpoint PUT) ===== */
    const handleSave = useCallback(async ({ stay }: { stay: boolean }) => {
        const f = formRef.current;
        const errors: string[] = [];
        if (!f.plataformaId) errors.push("Falta plataforma.");
        if (!f.nombre?.trim()) errors.push("Falta nombre.");
        if (!f.codigo?.trim()) errors.push("Falta código.");
        if (!f.ruta?.trim()) errors.push("Falta ruta.");
        if (errors.length) {
            toast.error("Completa todos los campos obligatorios antes de guardar");
            return;
        }

        // Falta conectar endpoint de actualización cuando esté listo (PUT/PATCH)
        console.warn("[ResumenModulosView] Falta endpoint de actualización. Datos listos:", f);
        toast.success("Datos del módulo validados correctamente");

        if (stay) {
            await fetchResumen();
        } else {
            router.push(LIST_PATH);
        }
    }, [fetchResumen, router]);

    /* ===== Header  ===== */
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
                    <div className="text-2xl font-semibold text-gray-900">Módulo #{moduloId}</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl border">
                <Card icon={ClipboardDocumentListIcon} title="Resumen del Módulo" noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                    {loading ? (
                        <table className="w-full border-collapse">
                            <thead className="sr-only">
                                <tr><th>Cargando…</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                        <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                        Cargando…
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div className="grid grid-cols-6 gap-4">
                            {/* Plataforma */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Plataforma</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="plataforma"
                                    label="Plataforma"
                                    value={form.plataformaId || ""}
                                    options={filteredPlatforms}
                                    searchQuery={platformSearch}
                                    loading={loadingPlatforms}
                                    onSearch={setPlatformSearch}
                                    onChange={(val) => setForm((p) => ({ ...p, plataformaId: val }))}
                                    placeholderFromDefault
                                />
                            </div>

                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={form.nombre}
                                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                                    placeholder="Ej: PICKING"
                                />
                            </div>

                            {/* Código */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Código</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={form.codigo}
                                    onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                                    placeholder="Ej: OMS-PI"
                                />
                            </div>

                            {/* Ruta */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ruta (Front)</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={form.ruta}
                                    onChange={(e) => setForm((p) => ({ ...p, ruta: e.target.value }))}
                                    placeholder="Ej: /picking"
                                />
                            </div>

                            {/* Descripción */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                            <div className="col-span-5">
                                <textarea
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    rows={3}
                                    value={form.descripcion}
                                    onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                                    placeholder="Descripción del módulo"
                                />
                            </div>
                        </div>
                    )}

                </Card>
            </div>
        </div>
    );
}
