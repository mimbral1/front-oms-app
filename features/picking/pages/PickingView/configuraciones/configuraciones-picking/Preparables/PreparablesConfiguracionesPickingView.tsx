// views\PickingView\configuraciones\configuraciones-picking\Preparables\PreparablesConfiguracionesPickingView.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import Card from "@/components/ui/card/Card";
import {
    CheckCircleIcon,
    XCircleIcon,
    Cog6ToothIcon,
    ClockIcon,
    TruckIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import {
    getPreparableSettings,
    updatePreparableSettings,
} from "@/app/fetchWithAuth/picking/configuraciones/api-preparables/api-preparables";
import { FilterIcon, PackageOpenIcon, UserIcon } from "lucide-react";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { toast } from "react-hot-toast";
import { OMS_ORDER_STATUS_API } from "@/lib/http/endpoints";

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
   INTERFACE NORMALIZADA
╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
interface PreparablesConfig {
    requierePagoAprobado: boolean;
    requiereComprobante: boolean;
    permiteFraudePendiente: boolean;
    permiteSaldoPendiente: boolean;

    ventanaDesdeHoras: number;
    ventanaFutura: {
        habilitado: boolean;
        dias: number;
    };
    permiteVencidos: boolean;

    tiposPedidoSeleccionados: string[];
    estadosOMSSeleccionados: string[];

    reglasEntrega: {
        despacho: { habilitado: boolean; horasAntes: number };
        retiro: { habilitado: boolean; horasAntes: number };
    };

    filtrosExclusion: Record<string, boolean>;
}

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
   OPCIONES (MULTISELECT)
╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
const TIPOS_PEDIDO_OPTIONS = [
    { label: "Venta web B2C", value: "VENTA_B2C" },
    { label: "Venta empresas B2B", value: "VENTA_B2B" },
    { label: "Marketplace (VTEX, MLC, etc.)", value: "MARKETPLACE" },
    { label: "Venta tienda con despacho a domicilio", value: "TIENDA_DESPACHO" },
    { label: "Click & Collect / Retiro en tienda", value: "CLICK_COLLECT" },
    { label: "Full / fulfillment externo", value: "FULL" },
];

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
   TOGGLE
╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
const Toggle = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onClick}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-gray-300"
            }`}
    >
        <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"
                }`}
        />
    </button>
);

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
   VISTA COMPLETA (UN SOLO ARCHIVO)
╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
export default function PreparablesConfiguracionesPickingView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [config, setConfig] = useState<PreparablesConfig | null>(null);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [usuarioModificador, setUsuarioModificador] = useState<{
        nombre: string;
        email: string;
        avatar?: string;
        updatedAtCL: string;
    } | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const data = await getPreparableSettings();

                const omsRes = await fetch(
                    OMS_ORDER_STATUS_API
                );
                const omsData = await omsRes.json();

                setEstadosOmsOptions(
                    omsData.map((s: any) => ({
                        label: s.statusCode,
                        value: String(s.orderStatusID),
                    }))
                );

                if (!mounted) return;

                setMeta(data);

                setConfig({
                    requierePagoAprobado: data.generalConditions.requirePaymentApproved,
                    requiereComprobante: data.generalConditions.requireReceiptGenerated,
                    permiteFraudePendiente: data.generalConditions.allowFraudPending,
                    permiteSaldoPendiente: data.generalConditions.allowBalancePending,

                    ventanaDesdeHoras: data.preparation.windowHoursBeforeSLA,
                    ventanaFutura: {
                        habilitado: data.preparation.allowFutureOrders.enabled,
                        dias: data.preparation.allowFutureOrders.days,
                    },
                    permiteVencidos: data.preparation.allowExpiredOrders,

                    tiposPedidoSeleccionados: data.preparableOrderTypes,
                    estadosOMSSeleccionados: data.omsStatusesThatEnablePreparation,

                    reglasEntrega: {
                        despacho: {
                            habilitado: data.deliveryRules.homeDelivery.enabled,
                            horasAntes:
                                data.deliveryRules.homeDelivery.prepareUntilHoursBeforeCutoff,
                        },
                        retiro: {
                            habilitado: data.deliveryRules.pickupPoint.enabled,
                            horasAntes:
                                data.deliveryRules.pickupPoint.prepareUntilHoursBeforeCutoff,
                        },
                    },

                    filtrosExclusion: {
                        "Excluir pedidos solo de servicios":
                            data.exclusionFilters.excludeServiceOrders,
                        "Excluir pedidos con ítems digitales":
                            data.exclusionFilters.excludeDigitalItems,
                        "Excluir pedidos con observaciones especiales":
                            data.exclusionFilters.excludeOrdersWithNotes,
                        "Excluir pedidos de valor < $10.000":
                            data.exclusionFilters.lowValue.enabled,
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
    }, []);

    const change = (field: keyof PreparablesConfig, value: any) => {
        if (!config) return;
        setConfig({ ...config, [field]: value });
    };

    const nested = (sec: keyof PreparablesConfig, sub: string, v: any) => {
        if (!config) return;
        setConfig({
            ...config,
            [sec]: {
                ...(config as any)[sec],
                [sub]: v,
            },
        });
    };

    const handleSave = useCallback(async () => {
        if (!config || !meta) return;

        setSaving(true);
        try {
            const resp = await updatePreparableSettings({
                updatedBy: Number(user?.id ?? 0),
                generalConditions: {
                    requirePaymentApproved: config.requierePagoAprobado,
                    requireReceiptGenerated: config.requiereComprobante,
                    allowFraudPending: config.permiteFraudePendiente,
                    allowBalancePending: config.permiteSaldoPendiente,
                },
                preparation: {
                    windowHoursBeforeSLA: config.ventanaDesdeHoras,
                    allowFutureOrders: {
                        enabled: config.ventanaFutura.habilitado,
                        days: config.ventanaFutura.dias,
                    },
                    allowExpiredOrders: config.permiteVencidos,
                },
                preparableOrderTypes: config.tiposPedidoSeleccionados,
                omsStatusesThatEnablePreparation: config.estadosOMSSeleccionados,
                deliveryRules: {
                    homeDelivery: {
                        enabled: config.reglasEntrega.despacho.habilitado,
                        prepareUntilHoursBeforeCutoff:
                            config.reglasEntrega.despacho.horasAntes,
                    },
                    pickupPoint: {
                        enabled: config.reglasEntrega.retiro.habilitado,
                        prepareUntilHoursBeforeCutoff:
                            config.reglasEntrega.retiro.horasAntes,
                    },
                },
                exclusionFilters: {
                    excludeServiceOrders:
                        config.filtrosExclusion["Excluir pedidos solo de servicios"],
                    excludeDigitalItems:
                        config.filtrosExclusion["Excluir pedidos con ítems digitales"],
                    excludeOrdersWithNotes:
                        config.filtrosExclusion["Excluir pedidos con observaciones especiales"],
                    lowValue: {
                        enabled:
                            config.filtrosExclusion["Excluir pedidos de valor < $10.000"],
                        thresholdAmount: 11000, // backend fijo (único valor disponible)
                    },
                },
            });
            toast.success("Configuración de preparables actualizada correctamente");

            if (resp?.data?.updatedByUser) {
                const nombreCompleto = [
                    resp.data.updatedByUser.nombres,
                    resp.data.updatedByUser.apellidos,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                setUsuarioModificador({
                    nombre: nombreCompleto || "—",
                    email: resp.data.updatedByUser.email || "—",
                    avatar: resp.data.updatedByUser.urlImagenPerfil || undefined,
                    updatedAtCL: resp.data.updatedAtCL,
                });
            }

        } catch (err) {
            toast.error("Ocurrió un error al guardar la configuración de preparables");
        } finally {
            setSaving(false);
        }
    }, [config, meta]);

    /* ───────────── HEADER SUPERIOR ───────────── */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
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
                disabled: saving,
            },
        ],
        [handleSave, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Configuración
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Preparables
                    </div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : "",
        } as PageHeaderProps),
        [headerActions, saving]
    );

    /* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
       ESTADOS LOCALES PARA MULTISELECT (como Usuarios)
    ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
    const [tiposSearch, setTiposSearch] = useState("");
    const [estadosSearch, setEstadosSearch] = useState("");
    const [estadosOmsOptions, setEstadosOmsOptions] = useState<
        { label: string; value: string }[]
    >([]);

    if (loading || !config) {
        return (
            <div className="overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                    <tbody>
                        <tr>
                            <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                Cargando preparables…
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    /* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
       RENDER COMPLETO
    ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
    return (
        <div className="p-6 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

                {/* ======= IZQUIERDA (col-span-4) ======= */}
                <div className="lg:col-span-4 space-y-6">

                    {/* CONDICIONES GENERALES */}
                    <Card
                        title="CONDICIONES GENERALES"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {/* (no modifico comentarios ni estructura) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {[
                                { k: "requierePagoAprobado", l: "Requiere pago aprobado" },
                                { k: "requiereComprobante", l: "Requiere comprobante generado" },
                                { k: "permiteFraudePendiente", l: "Permitir pedidos con revisión de fraude pendiente" },
                                { k: "permiteSaldoPendiente", l: "Permitir pedidos con saldo pendiente" },
                            ].map(({ k, l }) => (
                                <label key={k} className="flex items-center gap-3">
                                    <Toggle
                                        checked={(config as any)[k]}
                                        onClick={() => change(k as any, !(config as any)[k])}
                                    />
                                    <span>{l}</span>
                                </label>
                            ))}
                        </div>
                    </Card>

                    {/* VENTANA DE PREPARACIÓN */}
                    <Card
                        title="VENTANA DE PREPARACIÓN"
                        icon={ClockIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="space-y-6 text-sm">
                            {/* (comentarios intactos) */}
                            <div className="flex items-center gap-2">
                                <span>Desde</span>
                                <input
                                    type="number"
                                    className="w-20 border-b border-gray-300 text-center bg-transparent outline-none"
                                    value={config.ventanaDesdeHoras}
                                    onChange={(e) =>
                                        change("ventanaDesdeHoras", Number(e.target.value))
                                    }
                                />
                                <span>horas antes del SLA</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Toggle
                                    checked={config.ventanaFutura.habilitado}
                                    onClick={() =>
                                        change("ventanaFutura", {
                                            ...config.ventanaFutura,
                                            habilitado: !config.ventanaFutura.habilitado,
                                        })
                                    }
                                />
                                <span>Permitir pedidos con fecha futura hasta</span>
                                <input
                                    type="number"
                                    className="w-20 border-b border-gray-300 text-center bg-transparent outline-none"
                                    value={config.ventanaFutura.dias}
                                    disabled={!config.ventanaFutura.habilitado}
                                    onChange={(e) =>
                                        change("ventanaFutura", {
                                            ...config.ventanaFutura,
                                            dias: Number(e.target.value),
                                        })
                                    }
                                />
                                <span>días</span>
                            </div>

                            <label className="flex items-center gap-3">
                                <Toggle
                                    checked={config.permiteVencidos}
                                    onClick={() => change("permiteVencidos", !config.permiteVencidos)}
                                />
                                <span>Permitir pedidos vencidos</span>
                            </label>
                        </div>
                    </Card>

                    {/* REGLAS DE ENTREGA */}
                    <Card
                        title="REGLAS DE ENTREGA"
                        icon={TruckIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            {Object.entries(config.reglasEntrega).map(([tipo, val]) => (
                                <div key={tipo} className="border rounded-md p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Toggle
                                            checked={val.habilitado}
                                            onClick={() =>
                                                nested("reglasEntrega", tipo, {
                                                    ...val,
                                                    habilitado: !val.habilitado,
                                                })
                                            }
                                        />
                                        <span className="font-medium text-gray-700">
                                            {tipo === "despacho"
                                                ? "Despacho a domicilio"
                                                : "Retiro en tienda"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span>Preparar hasta</span>
                                        <input
                                            type="number"
                                            className="w-20 border-b border-gray-300 text-center bg-transparent outline-none"
                                            value={val.horasAntes}
                                            onChange={(e) =>
                                                nested("reglasEntrega", tipo, {
                                                    ...val,
                                                    horasAntes: Number(e.target.value),
                                                })
                                            }
                                        />
                                        <span>horas antes del corte</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* FILTROS */}
                    <Card
                        title="FILTROS DE EXCLUSIÓN"
                        icon={FilterIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
                            {Object.entries(config.filtrosExclusion).map(([key, val]) => (
                                <label key={key} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="accent-blue-500 h-4 w-4"
                                        checked={val}
                                        onChange={(e) =>
                                            nested("filtrosExclusion", key, e.target.checked)
                                        }
                                    />
                                    <span>{key}</span>
                                </label>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* ======= DERECHA (col-span-3) ======= */}
                <div className="lg:col-span-3 space-y-6">

                    {/* TIPOS DE PEDIDO */}
                    <Card
                        title="TIPOS DE PEDIDO PREPARABLES"
                        icon={PackageOpenIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <SelectSearchInline
                            id="tiposPedido"
                            label="Tipos de pedido"
                            value=""
                            options={TIPOS_PEDIDO_OPTIONS}
                            searchQuery={tiposSearch}
                            onSearch={setTiposSearch}
                            onChange={(value) => {
                                if (!value) return;
                                if (config.tiposPedidoSeleccionados.includes(value)) return;
                                change("tiposPedidoSeleccionados", [...config.tiposPedidoSeleccionados, value]);
                            }}
                        />

                        <div className="mt-2 flex flex-wrap gap-2">
                            {config.tiposPedidoSeleccionados.map((v) => {
                                const label =
                                    TIPOS_PEDIDO_OPTIONS.find((o) => o.value === v)?.label || v;

                                return (
                                    <span
                                        key={v}
                                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                                    >
                                        {label}
                                        <button
                                            type="button"
                                            className="ml-2 text-gray-500 hover:text-gray-800"
                                            onClick={() =>
                                                change(
                                                    "tiposPedidoSeleccionados",
                                                    config.tiposPedidoSeleccionados.filter((x) => x !== v)
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </Card>

                    {/* ESTADOS OMS */}
                    <Card
                        title="ESTADOS OMS QUE HABILITAN PREPARACIÓN"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <SelectSearchInline
                            id="estadosOMS"
                            label="Estados OMS"
                            value=""
                            options={estadosOmsOptions}
                            searchQuery={estadosSearch}
                            onSearch={setEstadosSearch}
                            onChange={(value) => {
                                if (!value) return;
                                if (config.estadosOMSSeleccionados.includes(value)) return;
                                change("estadosOMSSeleccionados", [...config.estadosOMSSeleccionados, value]);
                            }}
                        />

                        <div className="mt-2 flex flex-wrap gap-2">
                            {config.estadosOMSSeleccionados.map((v) => {
                                const label =
                                    estadosOmsOptions.find((o) => o.value === v)?.label || v;

                                return (
                                    <span
                                        key={v}
                                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                                    >
                                        {label}
                                        <button
                                            type="button"
                                            className="ml-2 text-gray-500 hover:text-gray-800"
                                            onClick={() =>
                                                change(
                                                    "estadosOMSSeleccionados",
                                                    config.estadosOMSSeleccionados.filter((x) => x !== v)
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </Card>

                    {/* ÚLTIMA MODIFICACIÓN */}
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
