// app/views/Productos/Grupos/Detail/GruposProductoResumenView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { GruposProductoFields, ProductGroup } from "@/features/catalogo/components/configuraciones-catalogo/grupos-de-productos/GruposProductoFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";

/* ---------- estado inicial ---------- */
const EMPTY: ProductGroup = {
    id: "",
    nombre: "",
    refId: "",
    icono: "",
    estado: "Activo",
    created: { username: "—", email: "—", date: "—" },
};

const comparableRecord = (record: ProductGroup | null) => {
    if (!record) return null;
    return {
        nombre: record.nombre,
        refId: record.refId,
        icono: record.icono,
        estado: record.estado,
        eanComienzaCon: record.eanComienzaCon ?? "",
        refIdComienzaCon: record.refIdComienzaCon ?? "",
        categorias: record.categorias ?? [],
        canalesVenta: record.canalesVenta ?? [],
        canalesVentaIds: record.canalesVentaIds ?? [],
        unidadMedida: record.unidadMedida ?? "",
        skusExcluidos: record.skusExcluidos ?? [],
        inventario: record.inventario ?? "",
        esquemaBarcode: record.esquemaBarcode ?? "",
        umbralInferior: record.umbralInferior ?? null,
        umbralSuperior: record.umbralSuperior ?? null,
        loteRequerido: record.loteRequerido ?? false,
        loteVencimiento: record.loteVencimiento ?? false,
        autoPicking: record.autoPicking ?? false,
        requierePreparacion: record.requierePreparacion ?? false,
        tipoCandidato: record.tipoCandidato ?? "",
        omsComportamientos: record.omsComportamientos ?? "",
        omsComplementanIds: record.omsComplementanIds ?? "",
        tiposPaquete: record.tiposPaquete ?? "",
        diasPreparacion: record.diasPreparacion ?? null,
        umFacturacion: record.umFacturacion ?? "",
        almacenesPrioritarios: record.almacenesPrioritarios ?? [],
        modalidadEntrega: record.modalidadEntrega ?? "",
        metodosEntrega: record.metodosEntrega ?? [],
    };
};

export default function GruposProductoResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<ProductGroup | null>(null);
    const [initialRecord, setInitialRecord] = useState<ProductGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveFeedback, setSaveFeedback] = useState<"idle" | "success" | "error">("idle");
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    /* refs estables (igual que en Resumen de SalesChannels) */
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    /* ---------- cargar detalle desde API (mock si no hay) ---------- */
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setLoadError(null);
                // const res = await fetchWithAuth<{ ok: boolean; data: any }>(`product-service/product-group/${recordId}`);
                // const a = res?.data || {};
                const a: any = {
                    Id: recordId,
                    Name: "Pesable Calcesur",
                    ReferenceId: "QxKg",
                    Icon: "scale",
                    IsActive: 0,
                    CreatedAt: new Date().toISOString(),
                    UserCreated: "Ariel Mikowski",
                }; // mock

                if (!mounted) return;
                const mapped: ProductGroup = {
                    id: String(a?.Id ?? recordId ?? ""),
                    nombre: a?.Name ?? "",
                    refId: a?.ReferenceId ?? "",
                    icono: a?.Icon ?? "",
                    estado: a?.IsActive ? "Activo" : "Inactivo",
                    created: {
                        username: a?.UserCreated ?? "",
                        email: "",
                        date: a?.CreatedAt ? new Date(a.CreatedAt).toLocaleString("es-CL") : "—",
                    },
                };
                setRecord(mapped);
                setInitialRecord(mapped);
            } catch (err) {
                console.error("Error cargando grupo de producto:", (err as any)?.payload ?? err);
                setLoadError("No fue posible cargar el grupo de producto.");
                const fallback = { ...EMPTY, id: String(recordId ?? "") };
                setRecord(fallback);
                setInitialRecord(fallback);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (recordId) load();
        return () => {
            mounted = false;
        };
    }, [recordId, fetchWithAuth]);

    /* ---------- handlers ---------- */
    const handleChange = (field: keyof ProductGroup, value: any) => {
        if (saveFeedback !== "idle") setSaveFeedback("idle");
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const hasChanges = useMemo(() => {
        return JSON.stringify(comparableRecord(record)) !== JSON.stringify(comparableRecord(initialRecord));
    }, [record, initialRecord]);

    const handleDiscardChanges = useCallback(() => {
        if (!initialRecord) return;
        setRecord(initialRecord);
        setSaveFeedback("idle");
    }, [initialRecord]);

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;
        if (!current) return;

        const body: any = {
            Name: current.nombre,
            ReferenceId: current.refId,
            Icon: current.icono,
            IsActive: current.estado === "Activo" ? 1 : 0,
            UserModified: Number(currentUser?.id ?? 0),
        };

        setSaving(true);
        try {
            // const resp = await fetchWithAuth<{ ok: boolean; message?: string }>(`product-service/product-group/${current.id}`, { method: "PUT", body: JSON.stringify(body) });
            // console.log("Actualizado:", resp?.message ?? "OK");
            console.log("PUT mock product-group:", body);
            setInitialRecord(current);
            setSaveFeedback("success");
            setLastSavedAt(new Date().toLocaleString("es-CL"));
        } catch (err) {
            console.error("Error al guardar:", (err as any)?.payload ?? err);
            setSaveFeedback("error");
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

    /* ---------- acciones header (calcadas) ---------- */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving || !hasChanges,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving || !hasChanges,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/configuraciones-catalogo/grupos-de-productos"),
                disabled: saving,
            },
        ],
        [router, handleSave, saving, hasChanges]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Grupos de producto</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre || "Sin nombre"}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : saveFeedback === "success"
                    ? { text: "Guardado", variant: "success" }
                    : saveFeedback === "error"
                        ? { text: "Error al guardar", variant: "warning" }
                        : hasChanges
                            ? { text: "Cambios pendientes", variant: "warning" }
                            : record
                                ? { text: record.estado!, variant: record.estado === "Activo" ? "success" : "warning" }
                                : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, saveFeedback, hasChanges, record]
    );

    /* ---------- render ---------- */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f7ff] p-6">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-slate-600">
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        <span className="font-medium">Cargando grupo de producto...</span>
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="min-h-screen bg-[#f5f7ff] p-6">
                <div className="w-full rounded-2xl border border-red-200 bg-white p-6 text-red-700 shadow-sm">
                    No se encontró el grupo.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="w-full space-y-4">
                {(hasChanges || loadError || saveFeedback !== "idle") && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                            {hasChanges && !saving && (
                                <button
                                    type="button"
                                    onClick={handleDiscardChanges}
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    <ArrowUturnLeftIcon className="h-4 w-4" />
                                    Descartar cambios
                                </button>
                            )}
                        </div>

                        {loadError && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                {loadError}
                            </div>
                        )}

                        {saveFeedback === "success" && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                <CheckCircleIcon className="h-4 w-4" />
                                Cambios guardados correctamente.
                            </div>
                        )}

                        {saveFeedback === "error" && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                Ocurrio un error guardando los cambios.
                            </div>
                        )}
                    </div>
                )}

                <div className="border border-slate-200 bg-white p-4 shadow-sm">
                    {/* En Resumen NO pasamos isCreate, así Ref ID es read-only y se muestran tarjetas de usuario */}
                    <GruposProductoFields record={record} readOnly={false} onChange={handleChange} />
                </div>

                {hasChanges && (
                    <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-md">
                        <div className="text-sm text-amber-800">
                            Tienes cambios sin guardar en este grupo.
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDiscardChanges}
                                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                            >
                                Descartar
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                            >
                                {saving ? "Guardando..." : "Guardar ahora"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


