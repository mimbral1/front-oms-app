// views\PickingView\configuraciones\configuraciones-picking\OlasPicking\OlasConfiguracionesPickingView.tsx

"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import {
    Squares2X2Icon,
    Cog6ToothIcon,
    AdjustmentsHorizontalIcon,
    BellIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { UserIcon } from "lucide-react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth, useFetchWithAuthQA } from "@/lib/http/client";
import { toast } from "react-hot-toast";

/* ======================================================
   VIEW
====================================================== */

export default function OlasConfiguracionesPickingView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [state, setState] = useState<any>(null);
    const [meta, setMeta] = useState<any>(null);

    const [usuarioModificador, setUsuarioModificador] = useState<{
        nombre: string;
        email: string;
        avatar?: string;
        updatedAtCL: string;
    } | null>(null);

    /* =======================
       LOAD
    ======================= */

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);

                const response = await fetchWithAuthQA<any>(
                    "picking-service/waves/settings",
                    { method: "GET" }
                );
                const data = response?.data;
                if (!mounted) return;

                setMeta(data);

                setState({
                    olas: data.waves.enabled,
                    olasAutomaticas: data.waves.modes.auto,
                    olasManuales: data.waves.modes.manual,
                    frecuencia: data.generation.evaluationIntervalMinutes,
                    ordenesMax: data.waveCutoffCriteria.maxOrdersPerWave,
                    itemsMax: data.waveCutoffCriteria.maxItemsPerWave,
                    tiempoMax: data.waveCutoffCriteria.maxOpenMinutes,
                    pesoMax: data.waveCutoffCriteria.maxWeightKg,
                    reglas: {
                        "Por zona de almacén": data.orderGroupingRules.byZone,
                        "Por tipo de entrega": data.orderGroupingRules.byShippingType,
                        "Por almacén": data.orderGroupingRules.byWarehouse,
                        "Por tipo de pedido (B2B / B2C)": data.orderGroupingRules.byOrderType,
                        "Por marketplace / seller": data.orderGroupingRules.byMarketplace,
                    },
                    asignacionAutomatica: data.autoAssignment.enabled,
                    prioridadAsignacion: data.autoAssignment.pickerStrategy,
                    prioridad: data.wavePriority.strategy,
                    gestion: {
                        "Permitir reabrir olas": data.additionalControls.allowReopenWaves,
                        "Permitir dividir olas": data.additionalControls.allowSplitWaves,
                        "Permitir fusionar olas": data.additionalControls.allowMergeWaves,
                    },
                    composicion: {
                        "Permitir olas de un solo pedido": data.additionalControls.allowSingleOrderWaves,
                        "Permitir olas mixtas (múltiples zonas)": data.additionalControls.allowMixedZones,
                        "Permitir olas con stock parcial": data.additionalControls.allowPartialStock,
                    },
                    notificaciones: {
                        "Ola lista para iniciar": data.notifications.waveReady,
                        "Ola detenida por falta de stock": data.notifications.waveStopped,
                        "Ola finalizada por el picker": data.notifications.waveFinished,
                    },
                });

                if (data.updatedByUser) {
                    const nombreCompleto = [data.updatedByUser.nombres, data.updatedByUser.apellidos]
                        .filter(Boolean)
                        .join(" ")
                        .trim();

                    setUsuarioModificador({
                        nombre: nombreCompleto || "—",
                        email: data.updatedByUser.email || "—",
                        avatar: data.updatedByUser.urlImagenPerfil || undefined,
                        updatedAtCL: data.updatedAtCL,
                    });
                }

            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuthQA]);

    /* =======================
       SAVE
    ======================= */

    const handleSave = useCallback(async () => {
        if (!state || !meta) return;

        setSaving(true);
        try {
            const resp = await fetchWithAuthQA<any>("picking-service/waves/settings", {
                method: "PATCH",
                body: JSON.stringify({
                    updatedBy: Number(user?.id ?? 0),
                    waves: {
                        enabled: state.olas,
                        modes: {
                            auto: state.olasAutomaticas,
                            manual: state.olasManuales,
                        },
                    },
                    generation: {
                        evaluationIntervalMinutes: state.frecuencia,
                    },
                    waveCutoffCriteria: {
                        maxOrdersPerWave: state.ordenesMax,
                        maxItemsPerWave: state.itemsMax,
                        maxOpenMinutes: state.tiempoMax,
                        maxWeightKg: state.pesoMax,
                    },
                    orderGroupingRules: {
                        byZone: state.reglas["Por zona de almacén"],
                        byShippingType: state.reglas["Por tipo de entrega"],
                        byWarehouse: state.reglas["Por almacén"],
                        byOrderType: state.reglas["Por tipo de pedido (B2B / B2C)"],
                        byMarketplace: state.reglas["Por marketplace / seller"],
                    },
                    additionalControls: {
                        allowReopenWaves: state.gestion["Permitir reabrir olas"],
                        allowSplitWaves: state.gestion["Permitir dividir olas"],
                        allowMergeWaves: state.gestion["Permitir fusionar olas"],
                        allowSingleOrderWaves: state.composicion["Permitir olas de un solo pedido"],
                        allowMixedZones: state.composicion["Permitir olas mixtas (múltiples zonas)"],
                        allowPartialStock: state.composicion["Permitir olas con stock parcial"],
                    },
                    autoAssignment: {
                        enabled: state.asignacionAutomatica,
                        pickerStrategy: meta.autoAssignment.pickerStrategy,
                    },
                    wavePriority: {
                        strategy: meta.wavePriority.strategy,
                    },
                    notifications: {
                        waveReady: state.notificaciones["Ola lista para iniciar"],
                        waveStopped: state.notificaciones["Ola detenida por falta de stock"],
                        waveFinished: state.notificaciones["Ola finalizada por el picker"],
                    },
                }),
            });

            toast.success("Configuración de olas actualizada correctamente");

            const perfil = await fetchUsuarioModificador(user!.id);

            setUsuarioModificador({
                ...perfil,
                updatedAtCL: resp?.data?.updatedAtCL ?? usuarioModificador?.updatedAtCL ?? "—",
            });

        } catch (err) {
            toast.error("Ocurrió un error al guardar la configuración de olas");
        } finally {
            setSaving(false);
        }
    }, [state, meta, user?.id, fetchWithAuthQA, fetchWithAuth, usuarioModificador?.updatedAtCL]);

    // helper usuario modificador 
    const fetchUsuarioModificador = async (userId: string) => {
        try {
            const perfil = await fetchWithAuth<any>(`idservice/perfiles/${userId}`, {
                method: "GET",
            });

            const nombreCompleto = [perfil?.Nombres, perfil?.Apellidos]
                .filter(Boolean)
                .join(" ")
                .trim();

            return {
                nombre: nombreCompleto || "—",
                email: perfil?.Email ?? "—",
                avatar: perfil?.URLImagenPerfil ?? undefined,
            };
        } catch {
            return {
                nombre: user?.nombre || "—",
                email: user?.email || "—",
                avatar: undefined,
            };
        }
    };

    /* =======================
       HEADER
    ======================= */

    const actions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving
                    ? <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/configuraciones/configuraciones-picking"),
            },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
            ({
                title: (
                    <>
                        <div className="text-xs font-semibold uppercase text-blue-600">
                            Configuración
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                            Olas de Picking
                        </div>
                    </>
                ),
                action: actions,
                status: saving
                    ? { text: "Guardando…", variant: "info" }
                    : "",
            }) as PageHeaderProps,
        [actions, saving]
    );

    if (loading || !state) {
        return (
            <div className="overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                    <tbody>
                        <tr>
                            <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                Cargando olas…
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white">
            <div className="grid grid-cols-2 gap-8">

                {/* ===================== COLUMNA IZQUIERDA ===================== */}
                <div className="space-y-6">
                    <Card
                        title="Olas"
                        icon={Squares2X2Icon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <FieldRow label="Olas">
                            <Toggle
                                on={state.olas}
                                onChange={(v) => setState({ ...state, olas: v })}
                            />
                        </FieldRow>
                    </Card>

                    <Card
                        title="Habilitación"
                        icon={Cog6ToothIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <FieldRow
                            label="Habilitar olas automáticas"
                            description="Genera olas de picking en base a reglas de negocio sin intervención manual."
                        >
                            <Toggle
                                on={state.olasAutomaticas}
                                onChange={(v) => setState({ ...state, olasAutomaticas: v })}
                            />
                        </FieldRow>

                        <FieldRow
                            label="Habilitar olas manuales"
                            description="Permite que el supervisor cree y lance olas desde el módulo de almacén."
                        >
                            <Toggle
                                on={state.olasManuales}
                                onChange={(v) => setState({ ...state, olasManuales: v })}
                            />
                        </FieldRow>
                    </Card>

                    <Card
                        title="Frecuencia de generación de olas"
                        icon={AdjustmentsHorizontalIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <FieldRow
                            label=""
                            description="Define cada cuánto tiempo se evalúan órdenes para crear una nueva ola."
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={state.frecuencia}
                                    onChange={(e) =>
                                        setState({ ...state, frecuencia: Number(e.target.value) })
                                    }
                                    className="w-20 border-b border-gray-300 bg-transparent text-sm outline-none"
                                />
                                <span className="text-sm text-gray-500">minutos</span>
                                <select className="border-b border-gray-300 bg-transparent text-sm outline-none">
                                    <option>Usar intervalo fijo</option>
                                </select>
                            </div>
                        </FieldRow>
                    </Card>

                    <Card
                        title="Criterios de corte de ola"
                        icon={Squares2X2Icon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <span className="text-xs text-gray-500">
                            Cuando se cumple alguno de estos parámetros, la ola se cierra y queda lista para preparar.
                        </span>

                        <FieldRow label="Órdenes máx.">
                            <input
                                type="number"
                                value={state.ordenesMax}
                                onChange={(e) =>
                                    setState({ ...state, ordenesMax: Number(e.target.value) })
                                }
                                className="w-20 border-b border-gray-300 bg-transparent text-sm outline-none"
                            />
                        </FieldRow>

                        <FieldRow label="Ítems máx.">
                            <input
                                type="number"
                                value={state.itemsMax}
                                onChange={(e) =>
                                    setState({ ...state, itemsMax: Number(e.target.value) })
                                }
                                className="w-20 border-b border-gray-300 bg-transparent text-sm outline-none"
                            />
                        </FieldRow>

                        <FieldRow label="Tiempo máx. abierta">
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={state.tiempoMax}
                                    onChange={(e) =>
                                        setState({ ...state, tiempoMax: Number(e.target.value) })
                                    }
                                    className="w-20 border-b border-gray-300 bg-transparent text-sm outline-none"
                                />
                                <span className="text-sm text-gray-500">min</span>
                            </div>
                        </FieldRow>

                        <FieldRow label="Peso máx. (kg)">
                            <input
                                type="number"
                                value={state.pesoMax}
                                onChange={(e) =>
                                    setState({ ...state, pesoMax: Number(e.target.value) })
                                }
                                className="w-20 border-b border-gray-300 bg-transparent text-sm outline-none"
                            />
                        </FieldRow>
                    </Card>
                    <Card
                        title="Asignación automática de olas"
                        icon={AdjustmentsHorizontalIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <FieldRow
                            label=""
                            description="Asigna las olas al picker según la estrategia seleccionada."
                        >
                            <div className="flex items-center gap-4">
                                <Toggle
                                    on={state.asignacionAutomatica}
                                    onChange={(v) => setState({ ...state, asignacionAutomatica: v })}
                                />
                                <select
                                    value={state.prioridadAsignacion}
                                    onChange={(e) =>
                                        setState({ ...state, prioridadAsignacion: e.target.value })
                                    }
                                    className="border-b border-gray-300 bg-transparent text-sm outline-none"
                                >
                                    <option value="AVAILABLE_PICKER_PRIORITY_QUEUE">
                                        Picker disponible (prioridad cola)
                                    </option>
                                </select>

                            </div>
                        </FieldRow>
                    </Card>
                    <Card
                        title="Prioridad de olas"
                        icon={AdjustmentsHorizontalIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <FieldRow
                            label=""
                            description="Orden en el que se priorizan las olas para ser preparadas."
                        >
                            <select
                                value={state.prioridad}
                                onChange={(e) =>
                                    setState({ ...state, prioridad: e.target.value })
                                }
                                className="border-b border-gray-300 bg-transparent text-sm outline-none"
                            >
                                <option value="DELIVERY_SLA">
                                    SLA de entrega (hora de compromiso)
                                </option>
                            </select>

                        </FieldRow>
                    </Card>

                </div>

                {/* ===================== COLUMNA DERECHA ===================== */}
                <div className="space-y-6">
                    <Card
                        title="Reglas de agrupación de pedidos"
                        icon={Squares2X2Icon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <span className="text-xs text-gray-500">
                            Define cómo se agrupan los pedidos dentro de una ola para optimizar recorridos.
                        </span>
                        {Object.entries(state.reglas as Record<string, boolean>).map(([label, value]) => (
                            <FieldRow key={label} label={label}>
                                <Toggle
                                    on={value}
                                    onChange={(v) =>
                                        setState({
                                            ...state,
                                            reglas: { ...state.reglas, [label]: v },
                                        })
                                    }
                                />
                            </FieldRow>
                        ))}
                    </Card>

                    <Card
                        title="Controles adicionales"
                        icon={Cog6ToothIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <span className="text-xs text-gray-500">
                            Opciones avanzadas para manejo operativo de las olas de picking.
                        </span>

                        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                            Gestión de ola
                        </div>

                        {Object.entries(state.gestion as Record<string, boolean>).map(([label, value]) => (
                            <FieldRow key={label} label={label}>
                                <Toggle
                                    on={value}
                                    onChange={(v) =>
                                        setState({
                                            ...state,
                                            gestion: { ...state.gestion, [label]: v },
                                        })
                                    }
                                />
                            </FieldRow>
                        ))}

                        <div className="text-xs font-semibold text-gray-500 uppercase mt-6 mb-3">
                            Composición
                        </div>

                        {Object.entries(state.composicion as Record<string, boolean>).map(([label, value]) => (
                            <FieldRow key={label} label={label}>
                                <Toggle
                                    on={value}
                                    onChange={(v) =>
                                        setState({
                                            ...state,
                                            composicion: { ...state.composicion, [label]: v },
                                        })
                                    }
                                />
                            </FieldRow>
                        ))}
                    </Card>

                    <Card
                        title="Notificaciones"
                        icon={BellIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <span className="text-xs text-gray-500">
                            Alertas al supervisor cuando cambie el estado de una ola.
                        </span>
                        {Object.entries(state.notificaciones as Record<string, boolean>).map(([label, value]) => (
                            <FieldRow key={label} label={label}>
                                <Toggle
                                    on={value}
                                    onChange={(v) =>
                                        setState({
                                            ...state,
                                            notificaciones: { ...state.notificaciones, [label]: v },
                                        })
                                    }
                                />
                            </FieldRow>
                        ))}
                    </Card>

                    <Card
                        title="USUARIO MODIFICADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {usuarioModificador?.avatar ? (
                                    <img
                                        src={usuarioModificador.avatar}
                                        className="h-7 w-7 rounded-full object-cover"
                                        alt=""
                                    />
                                ) : (
                                    <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                                        {(usuarioModificador?.nombre?.match(/\b\w/g) || [])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase() || "US"}
                                    </div>
                                )}

                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                        {usuarioModificador?.nombre || "—"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {usuarioModificador?.email || "—"}
                                    </span>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 whitespace-nowrap">
                                {usuarioModificador?.updatedAtCL || "—"}
                            </div>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}

/* ======================================================
   HELPERS (SIN CAMBIOS)
====================================================== */

const FieldRow = ({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) => (
    <div className="grid grid-cols-[260px_1fr] items-center gap-6">
        <div>
            <div className="text-sm font-medium text-gray-900">{label}</div>
            {description && (
                <span className="text-xs text-gray-500">{description}</span>
            )}
        </div>
        <div>{children}</div>
    </div>
);

const Toggle = ({
    on,
    onChange,
}: {
    on: boolean;
    onChange: (v: boolean) => void;
}) => (
    <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${on ? "bg-blue-500" : "bg-gray-300"
            }`}
    >
        <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"
                }`}
        />
    </button>
);
