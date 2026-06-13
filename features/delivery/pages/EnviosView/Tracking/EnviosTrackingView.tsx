"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/format/date";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import Card from "@/components/ui/card/Card";
import { StatusPill } from "@/components/ui/status-pill/StatusPill";
import { DocumentDuplicateIcon, XCircleIcon } from "@heroicons/react/24/outline";

type TrackingEvent = {
    status: string;
    date: string;
    receiver?: string;
};

type TrackingBlock = {
    trackingNumber: string;
    events: TrackingEvent[];
    signatureUrl: string;
};

type ApiShippingResponse = {
    status?: string | null;
    displayId?: string | null;
    id?: string | null;
};

type ApiTrackingEvent = {
    status?: string | null;
    date?: string | null;
    dateCreated?: string | null;
    createdAt?: string | null;
    receiver?: string | null;
    receivedBy?: string | null;
    signatureUrl?: string | null;
    signature?: string | null;
};

type ApiTrackingItem = {
    trackingNumber?: string | null;
    refId?: string | null;
    events?: ApiTrackingEvent[] | null;
    signatureUrl?: string | null;
    signature?: string | null;
};

type ApiTrackingResponse = {
    data?: ApiTrackingItem[] | ApiTrackingItem | ApiTrackingEvent[] | null;
};

const TRACKING_ENDPOINT = `${BASE_DELIVERY_SERVICE}/shipping`;

function toDash(value: unknown) {
    const text = String(value ?? "").trim();
    return text || "-";
}

function toDateTime(value?: string | null) {
    if (!value) return "-";
    const parts = formatDateTime(value, { locale: "es-CL", timeZone: "America/Santiago" });
    const date = parts?.date && parts.date !== "Sin datos" && parts.date !== "Fecha no válida" ? parts.date : "-";
    const timeRaw = parts?.time && parts.time !== "Sin datos" && parts.time !== "Fecha no válida" ? parts.time : "";
    const time = timeRaw ? timeRaw.slice(0, 5) : "";
    return `${date}${time ? ` ${time}` : ""}`;
}

function mapStatus(raw?: string | null) {
    const s = String(raw ?? "").trim().toLowerCase();
    if (s === "created") return "Creada";
    if (s === "scheduled") return "Programada";
    if (s === "started" || s === "in_progress" || s === "inprogress") return "Iniciado";
    if (s === "arrived") return "Arribado";
    if (s === "delivered") return "Entregado";
    return "Creada";
}

function mapStatusVariant(raw?: string | null): "success" | "warning" | "info" | "error" {
    const s = String(raw ?? "").trim().toLowerCase();
    if (s === "delivered") return "success";
    if (s === "scheduled" || s === "started" || s === "in_progress") return "warning";
    if (s === "cancelled") return "error";
    return "info";
}

function normalizeTracking(payload: ApiTrackingResponse | ApiTrackingItem[] | ApiTrackingItem | ApiTrackingEvent[] | null | undefined, fallbackTrackingNumber: string): TrackingBlock {
    const body: any = payload as any;
    const source = body && Object.prototype.hasOwnProperty.call(body, "data") ? body.data : body;

    if (Array.isArray(source) && source.length > 0 && Object.prototype.hasOwnProperty.call(source[0], "status")) {
        const events = (source as ApiTrackingEvent[]).map((ev) => ({
            status: mapStatus(ev.status),
            date: toDateTime(ev.date ?? ev.dateCreated ?? ev.createdAt),
            receiver: toDash(ev.receiver ?? ev.receivedBy),
        }));
        if (!events.length) {
            return { trackingNumber: toDash(fallbackTrackingNumber), events: [], signatureUrl: "" };
        }
        return { trackingNumber: fallbackTrackingNumber, events, signatureUrl: "" };
    }

    const items = Array.isArray(source) ? source : source ? [source] : [];
    const first = (items[0] ?? {}) as ApiTrackingItem;
    const events = (Array.isArray(first.events) ? first.events : []).map((ev) => ({
        status: mapStatus(ev.status),
        date: toDateTime(ev.date ?? ev.dateCreated ?? ev.createdAt),
        receiver: toDash(ev.receiver ?? ev.receivedBy),
    }));

    const normalized: TrackingBlock = {
        trackingNumber: toDash(first.trackingNumber ?? first.refId ?? fallbackTrackingNumber),
        events,
        signatureUrl: String(first.signatureUrl ?? first.signature ?? "").trim(),
    };

    return normalized;
}

export default function EnviosTrackingView() {
    const params = useParams<{ id?: string; envioId?: string }>();
    const shippingId = params?.id ?? params?.envioId ?? "";
    const router = useRouter();
    const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [tracking, setTracking] = useState<TrackingBlock>({
        trackingNumber: "-",
        events: [],
        signatureUrl: "",
    });
    const [shippingHeader, setShippingHeader] = useState<{ titleId: string; statusText: string; statusVariant: "success" | "warning" | "info" | "error" }>({
        titleId: shippingId || "-",
        statusText: "Creada",
        statusVariant: "info",
    });

    useEffect(() => {
        if (!token || !shippingId) return;
        let mounted = true;

        const load = async () => {
            if (mounted) {
                setLoading(true);
                setError("");
            }

            try {
                if (!BASE_DELIVERY_SERVICE) {
                    throw new Error("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
                }

                const [shippingRes, trackingRes] = await Promise.all([
                    fetchWithAuthDelivery<ApiShippingResponse>(`shipping/${shippingId}`, { method: "GET" }),
                    fetchWithAuthDelivery<ApiTrackingResponse>(`${TRACKING_ENDPOINT}/${shippingId}/tracking`, { method: "GET" }),
                ]);

                const titleId = toDash(shippingRes?.displayId ?? shippingRes?.id ?? shippingId);
                const normalized = normalizeTracking(trackingRes, titleId);

                if (mounted) {
                    setShippingHeader({
                        titleId,
                        statusText: mapStatus(shippingRes?.status),
                        statusVariant: mapStatusVariant(shippingRes?.status),
                    });
                    setTracking(normalized);
                }
            } catch (e) {
                console.error("Error cargando seguimiento:", e);
                if (mounted) {
                    setError("No se pudo cargar el seguimiento.");
                    setTracking({
                        trackingNumber: toDash(shippingId || "-"),
                        events: [],
                        signatureUrl: "",
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
    }, [fetchWithAuthDelivery, token, shippingId]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/envios"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: `Entrega ${shippingHeader.titleId}`,
            action: headerActions,
            status: { text: shippingHeader.statusText, variant: shippingHeader.statusVariant },
        } as PageHeaderProps),
        [shippingHeader.titleId, shippingHeader.statusText, shippingHeader.statusVariant, headerActions]
    );

    return (
        <div className="flex-1">
            {loading ? (
                <div className="rounded-xl bg-white p-6 text-sm text-gray-500">Cargando seguimiento...</div>
            ) : error ? (
                <div className="rounded-xl bg-white p-6 text-sm text-red-500">{error}</div>
            ) : (
                <Card title="SEGUIMIENTO" icon={DocumentDuplicateIcon} hasTitleDivider roundedClass="rounded-none">
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Tracking #</span>
                        <span className="text-sm font-semibold text-gray-900">{tracking.trackingNumber}</span>
                    </div>
                    <hr className="border-t border-gray-200" />

                    {tracking.events.length === 0 ? (
                        <div className="py-4 text-sm text-gray-500">
                            Este envio no tiene eventos de seguimiento.
                        </div>
                    ) : (
                        tracking.events.map((ev, idx) => (
                            <div key={`${ev.status}-${ev.date}-${idx}`} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Estado</span>
                                    <StatusPill status={ev.status} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-600">Fecha</span>
                                    <span className="text-sm text-gray-500">{ev.date}</span>
                                </div>
                                {ev.receiver && ev.receiver !== "-" && (
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-gray-600">Receptor</span>
                                        <span className="text-sm text-gray-500">{ev.receiver}</span>
                                    </div>
                                )}
                                {idx !== tracking.events.length - 1 && <hr className="border-t border-gray-100" />}
                            </div>
                        ))
                    )}

                    <hr className="border-t border-gray-200" />

                    <div className="mt-4 flex flex-col">
                        <span className="text-sm font-medium text-gray-600">Firma</span>
                        {tracking.signatureUrl ? (
                            <img src={tracking.signatureUrl} alt="Firma" className="w-full h-24 mt-2 object-contain" />
                        ) : (
                            <span className="mt-2 text-sm text-gray-500">-</span>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
