// app/delivery/slots/[id]/page.tsx
"use client";
import { DELIVERY_API_BASE } from "@/lib/delivery-api";

/* ---------- Resumen Slot (misma base que tus resúmenes) ---------- */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, ClipboardDocumentListIcon, TruckIcon, UserIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { SlotForm } from "@/features/delivery/components/transportistas/slots/SlotsFields";
import Card from "@/components/ui/card/Card";
import { Toggle } from "@/components/ui/togle/togle";

type TimeSlotDetail = {
    id?: string;
    displayId?: string;
    carrierId?: string;
    carrierName?: string;
    dateStart?: string;
    dateEnd?: string;
    closingTime?: string | null;
    status?: string;
    capacityMaxShippingQtyValue?: number | null;
    capacityMaxShippingQtyDefault?: number | null;
    capacityMaxShippingQtyEffective?: number | null;
    totalShippings?: number | null;
    totalProducts?: number | null;
    totalPackages?: number | null;
    deliveryCost?: number | null;
    isLocked?: boolean | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
};

/* Estado base */
const EMPTY: SlotForm = {
    inventoryId: "",
    inventoryName: "",
    slotCode: "",
    skuId: "",
    skuName: "",
    isDefault: false,
    minUnits: "",
    maxUnits: "",
};

export default function SlotsResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<SlotForm | null>(null);
    const [detail, setDetail] = useState<TimeSlotDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    const fmtDateTime = (value?: string | null) => {
        if (!value) return "-";
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return "-";
        return dt.toLocaleString();
    };

    const fmtNumber = (value?: number | null) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
        return Number(value).toLocaleString();
    };

    const fmtCurrency = (value?: number | null) => {
        if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(Number(value));
    };

    const statusLabel = (status?: string | null) => {
        const current = String(status || "").trim().toLowerCase();
        if (current === "finished") return "Finalizada";
        if (current === "inprogress") return "En curso";
        if (current === "pending") return "Pendiente";
        if (current === "cancelled") return "Cancelada";
        return status || "Pendiente";
    };

    /* ---------- Carga de detalle (endpoint real) ---------- */
    useEffect(() => {
        if (!recordId) return;
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);

                const response = await fetch(`${DELIVERY_API_BASE}/time-slot/${encodeURIComponent(String(recordId))}`, {
                    method: "GET",
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const a = (await response.json()) as TimeSlotDetail;

                const mapped: SlotForm = {
                    ...EMPTY,
                    inventoryId: String(a.carrierId || ""),
                    inventoryName: String(a.carrierName || a.carrierId || ""),
                    slotCode: String(a.displayId || a.id || ""),
                    skuId: String(a.id || ""),
                    skuName: statusLabel(a.status),
                    isDefault: !Boolean(a.isLocked),
                    minUnits: Number(a.capacityMaxShippingQtyDefault ?? "") || "",
                    maxUnits: Number(a.capacityMaxShippingQtyEffective ?? a.capacityMaxShippingQtyValue ?? "") || "",
                };

                if (!mounted) return;
                setRecord(mapped);
                setDetail(a);
            } catch (err) {
                console.error("Error cargando Slot:", (err as any)?.payload ?? err);
                setRecord({ ...EMPTY });
                setDetail(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [recordId]);

    /* ---------- Guardar ---------- */
    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;
        if (!current) return;

        const body: any = {
            InventoryId: current.inventoryId || "",
            SlotCode: (current.slotCode || "").trim(),
            SkuId: current.skuId || "",
            IsDefault: current.isDefault ? 1 : 0,
            MinUnits: Number(current.minUnits || 0),
            MaxUnits: Number(current.maxUnits || 0),
            UserModified: Number(currentUser?.id ?? 0),
        };

        setSaving(true);
        try {
            // await fetchWithAuth(`delivery/slots/${recordId}`, { method: "PUT", body: JSON.stringify(body) });
            console.log("Payload (PUT) Slots:", body);
        } catch (err) {
            console.error("Error al guardar Slot:", (err as any)?.payload ?? err);
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth, recordId]);

    /* ---------- Acciones header ---------- */
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
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/transportistas/slots"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Slot</div>
                    <div className="text-2xl font-semibold text-gray-900">{detail?.displayId || id}</div>
                </div>
            ),
            action: headerActions,
            status: saving ? { text: "Guardando…", variant: "info" } : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, detail?.displayId, id]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el slot.</div>;

    const row = (label: string, value: React.ReactNode) => (
        <div className="grid grid-cols-1 gap-y-1 py-1 sm:grid-cols-[180px,1fr] sm:items-center sm:gap-x-3 sm:gap-y-0">
            <span className="text-sm font-semibold text-gray-700">{label}:</span>
            <span className="break-words text-sm font-medium text-gray-900">{value}</span>
        </div>
    );

    return (
        <div className="p-6">
            {detail && (
                <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <div className="xl:col-span-8">
                        <Card
                            title="Detalle"
                            icon={TruckIcon}
                            hasTitleDivider
                            noDefaultStyles
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="space-y-3 text-gray-700">
                                {row("Carrier", detail.carrierName || detail.carrierId || "-")}
                                {row(
                                    "Estado",
                                    <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        {statusLabel(detail.status)}
                                    </span>
                                )}
                                {row("Costo de delivery", fmtCurrency(detail.deliveryCost))}
                                {row(
                                    "Bloqueado",
                                    <div className="inline-flex items-center gap-2">
                                        <Toggle
                                            checked={Boolean(detail.isLocked)}
                                            onCheckedChange={() => { }}
                                            disabled
                                            aria-label="Bloqueado"
                                        />
                                    </div>
                                )}
                                {row("Inicio", fmtDateTime(detail.dateStart))}
                                {row("Fin", fmtDateTime(detail.dateEnd))}
                                {row("Cierre", fmtDateTime(detail.closingTime))}
                            </div>
                        </Card>
                    </div>

                    <div className="xl:col-span-4 space-y-6">
                        <Card
                            title="CAPACIDADES"
                            icon={ClipboardDocumentListIcon}
                            hasTitleDivider
                            noDefaultStyles
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="space-y-3 text-gray-700">
                                {row("Shippings default", fmtNumber(detail.capacityMaxShippingQtyDefault))}
                                {row("Shippings value", fmtNumber(detail.capacityMaxShippingQtyValue))}
                                {row("Shippings effective", fmtNumber(detail.capacityMaxShippingQtyEffective))}
                                {row("Total shippings", fmtNumber(detail.totalShippings ?? 0))}
                                {row("Total products", fmtNumber(detail.totalProducts ?? 0))}
                                {row("Total packages", fmtNumber(detail.totalPackages ?? 0))}
                            </div>
                        </Card>

                        <Card
                            title="AUDITORIA"
                            icon={UserIcon}
                            hasTitleDivider
                            noDefaultStyles
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="space-y-3 text-gray-700">
                                {row("Display ID", detail.displayId || "-")}
                                {row("Creado por", detail.userCreated || "-")}
                                {row("Creado", fmtDateTime(detail.dateCreated))}
                                {row("Modificado por", detail.userModified || "-")}
                                {row("Modificado", fmtDateTime(detail.dateModified))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
