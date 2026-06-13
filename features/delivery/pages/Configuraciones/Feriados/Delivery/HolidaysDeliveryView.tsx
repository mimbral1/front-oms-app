// views\Delivery\Configuraciones\Feriados\Delivery\HolidaysDeliveryView.tsx
"use client";

/* === Delivery ===
    - Trae detalle desde GET /holiday/{id} (base delivery service)
    - Usa cache en sessionStorage (si viene del tab Resumen) y luego refresca con GET
    - timeSlots: listado con estado por slot desde response
   - Acciones:
      • Revertir (cuando status !== "Reverted")
      • Reaplicar (cuando status === "Reverted")
     Ambas con barra de confirmación inline (sin alert) y simulación de proceso.
*/

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    TruckIcon,
    ClipboardDocumentListIcon,
    FunnelIcon,
    ArrowPathIcon,
    XCircleIcon,
    ArrowUturnLeftIcon,
    ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/outline";
import Card from "@/components/ui/card/Card";
import { useFetchWithAuth } from "@/lib/http/client";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";

const HOLIDAY_ENDPOINT = `${BASE_DELIVERY_SERVICE}/holiday`;

type DeliveryStatus = "Done" | "Reverted";

interface HolidayLite {
    id: string;
    name: string;
    day: string; // YYYY-MM-DD
    scope?: { carrierIds?: (number | string)[]; carrierReferenceIds?: (number | string)[] } | null;
}

interface TimeSlot {
    id: string;
    status: DeliveryStatus;
}

interface ApiHolidayTimeSlot {
    id?: number | string;
    holidayId?: string;
    timeSlotId?: string;
    processingStatus?: string;
}

interface ApiHolidayDetail {
    id?: string;
    name?: string;
    day?: string;
    status?: string;
    scope?: { carrierIds?: (number | string)[]; carrierReferenceIds?: (number | string)[] } | null;
    timeSlots?: ApiHolidayTimeSlot[];
}

function formatDayFromApi(day: string) {
    if (!day) return "—";
    const safe = day.substring(0, 10);
    const [yyyy, mm, dd] = safe.split("-");
    return yyyy && mm && dd ? `${yyyy}/${mm}/${dd}` : day;
}

function mapToDeliveryStatus(value?: string): DeliveryStatus {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized.includes("revert") || normalized === "inactive" || normalized === "cancelled") {
        return "Reverted";
    }
    return "Done";
}

export default function HolidaysDeliveryView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuth } = useFetchWithAuth();

    // --- base ---
    const [holiday, setHoliday] = useState<HolidayLite | null>(null);
    const [loading, setLoading] = useState(true);

    const [status, setStatus] = useState<DeliveryStatus>("Done");
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

    // confirm + progressing
    const [showConfirm, setShowConfirm] = useState<null | "revertir" | "reaplicar">(null);
    const [processing, setProcessing] = useState(false);

    // cargar detalle desde cache + API
    useEffect(() => {
        let mounted = true;

        const cacheKey = `holiday-detail:${String(recordId ?? "")}`;

        const applyDetail = (data: ApiHolidayDetail) => {
            const mappedHoliday: HolidayLite = {
                id: String(data?.id ?? recordId ?? ""),
                name: String(data?.name ?? ""),
                day: String(data?.day ?? ""),
                scope: data?.scope ?? null,
            };

            const mappedTimeSlots: TimeSlot[] = Array.isArray(data?.timeSlots)
                ? data.timeSlots
                    .map((ts) => {
                        const slotId = String(ts?.timeSlotId ?? ts?.id ?? "").trim();
                        if (!slotId) return null;
                        return {
                            id: slotId,
                            status: mapToDeliveryStatus(ts?.processingStatus),
                        };
                    })
                    .filter(Boolean) as TimeSlot[]
                : [];

            if (!mounted) return;
            setHoliday(mappedHoliday);
            setStatus(mapToDeliveryStatus(data?.status));
            setTimeSlots(mappedTimeSlots);
        };

        const load = async () => {
            try {
                setLoading(true);

                if (!BASE_DELIVERY_SERVICE) {
                    throw new Error("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
                }

                // 1) Cache local entre tabs (opcional)
                try {
                    const raw = sessionStorage.getItem(cacheKey);
                    if (raw) {
                        const cached = JSON.parse(raw) as ApiHolidayDetail;
                        applyDetail(cached);
                    }
                } catch {
                    // ignore cache read errors
                }

                // 2) Refresco desde API de delivery
                const res = await fetchWithAuth<ApiHolidayDetail>(`${HOLIDAY_ENDPOINT}/${recordId}`);
                applyDetail(res || {});

                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(res || {}));
                } catch {
                    // ignore cache write errors
                }
            } catch (e) {
                console.error("GET holiday error:", e);
                if (mounted) setHoliday({ id: String(recordId ?? ""), name: "", day: "" });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (recordId) load();
        return () => {
            mounted = false;
        };
    }, [recordId, fetchWithAuth]);

    // acciones mock
    const doRevert = useCallback(async () => {
        if (!recordId) return;
        setProcessing(true);
        try {
            await fetchWithAuth(`${HOLIDAY_ENDPOINT}/${recordId}/revert`, {
                method: "POST",
            });

            setStatus("Reverted");
            setTimeSlots((arr) => arr.map((s) => ({ ...s, status: "Reverted" })));
            setShowConfirm(null);
        } catch (error) {
            console.error("POST holiday revert error:", error);
        } finally {
            setProcessing(false);
        }
    }, [fetchWithAuth, recordId]);

    const doReapply = useCallback(async () => {
        if (!recordId) return;
        setProcessing(true);
        try {
            await fetchWithAuth(`${HOLIDAY_ENDPOINT}/${recordId}/reapply`, {
                method: "POST",
            });

            setStatus("Done");
            setTimeSlots((arr) => arr.map((s) => ({ ...s, status: "Done" })));
            setShowConfirm(null);
        } catch (error) {
            console.error("POST holiday reapply error:", error);
        } finally {
            setProcessing(false);
        }
    }, [fetchWithAuth, recordId]);

    // header actions
    const actions: Action[] = useMemo(() => {
        const baseCancel: Action = {
            label: "Volver al listado",
            variant: "secondary",
            icon: <XCircleIcon className="h-5 w-5" />,
            onClick: () => router.push("/delivery/configuraciones/feriados"),
            disabled: processing,
        };

        const revertBtn: Action = {
            label: "Revertir",
            variant: "error",
            icon: processing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ArrowUturnLeftIcon className="h-5 w-5" />,
            onClick: () => setShowConfirm("revertir"),
            disabled: processing || status === "Reverted",
        };

        const reapplyBtn: Action = {
            label: "Reaplicar",
            variant: "primary",
            icon: processing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ArrowPathRoundedSquareIcon className="h-5 w-5" />,
            onClick: () => setShowConfirm("reaplicar"),
            disabled: processing || status !== "Reverted",
        };

        // Mostrar uno u otro según status
        return status === "Reverted" ? [reapplyBtn, baseCancel] : [revertBtn, baseCancel];
    }, [router, processing, status]);

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Feriados</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {holiday?.name || "—"}{" "}
                        {holiday?.day ? <span className="text-blue-600 text-lg align-middle">{formatDayFromApi(holiday.day)}</span> : null}
                    </div>
                </div>
            ),
            action: actions,
        } as unknown as PageHeaderProps),
        [actions, holiday?.name, holiday?.day]
    );

    if (loading) return <div className="p-6">Cargando…</div>;

    return (
        <div className="p-6 bg-white">
            {/* Confirmación inline (sin alert) */}
            {showConfirm && (
                <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 p-4 text-blue-900">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            {showConfirm === "revertir" ? (
                                <ArrowUturnLeftIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                            ) : (
                                <ArrowPathRoundedSquareIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                            )}
                            <div>
                                <div className="font-semibold">
                                    {showConfirm === "revertir" ? "Confirmar revertir" : "Confirmar reaplicar"}
                                </div>
                                <div className="text-sm text-blue-800">
                                    Esta acción actualizará el estado en Delivery y los Time Slots asociados para el feriado{" "}
                                    <strong>{holiday?.name || `#${holiday?.id}`}</strong>.
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {showConfirm === "revertir" ? (
                                <button
                                    onClick={doRevert}
                                    disabled={processing}
                                    className={`rounded-md px-4 py-2 text-sm font-medium text-white ${processing ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    {processing ? "Procesando…" : "Revertir"}
                                </button>
                            ) : (
                                <button
                                    onClick={doReapply}
                                    disabled={processing}
                                    className={`rounded-md px-4 py-2 text-sm font-medium text-white ${processing ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    {processing ? "Procesando…" : "Reaplicar"}
                                </button>
                            )}
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLE */}
                    <Card title="DETALLE" icon={ClipboardDocumentListIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <div className="text-sm">{holiday?.name || "—"}</div>
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Día</span>
                            <div className="col-span-5">
                                <div className="text-sm">{holiday?.day ? formatDayFromApi(holiday.day) : "—"}</div>
                            </div>

                            {/* Status (mock) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <span
                                    className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-medium text-white ${status === "Reverted" ? "bg-green-600" : "bg-blue-600"
                                        }`}
                                >
                                    {status}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* TIME SLOTS */}
                    <Card title="TIME SLOTS" icon={TruckIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            {timeSlots.length === 0 ? (
                                <>
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Slots</span>
                                    <div className="col-span-5 text-sm text-gray-500">No hay time slots registrados.</div>
                                </>
                            ) : (
                                timeSlots.map((ts, idx) => (
                                    <React.Fragment key={ts.id}>
                                        <span className={`col-span-1 ${idx === 0 ? "" : "invisible"}`}></span>
                                        <div className="col-span-5 flex items-center justify-between">
                                            <a className="text-blue-600 hover:underline text-sm" href="#" onClick={(e) => e.preventDefault()}>
                                                {ts.id}
                                            </a>
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white ${ts.status === "Reverted" ? "bg-green-600" : "bg-blue-600"
                                                    }`}
                                            >
                                                {ts.status}
                                            </span>
                                        </div>
                                    </React.Fragment>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* SCOPE (simple, tomando lo que traiga el GET) */}
                    <Card title="Scope" icon={FunnelIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Transportistas</span>
                            <div className="col-span-5 text-sm">
                                {holiday?.scope?.carrierReferenceIds?.length
                                    ? (holiday.scope.carrierReferenceIds as (string | number)[]).join(", ")
                                    : holiday?.scope?.carrierIds?.length
                                        ? (holiday.scope.carrierIds as (string | number)[]).join(", ")
                                        : "—"}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
