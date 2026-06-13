"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps } from "@/components/layout/page-header";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { RutasEntregasTab, type RutaEntregaRow } from "@/features/delivery/components/rutas/listadorutas/RutasEntregasTab";

function mapShippingAddress(shipping: any) {
    const pieces = [
        String(shipping?.dropoffStreet || "").trim(),
        String(shipping?.dropoffNumber || "").trim(),
        String(shipping?.dropoffNeighborhood || "").trim(),
        String(shipping?.dropoffCity || "").trim(),
        String(shipping?.dropoffState || "").trim(),
        String(shipping?.dropoffCountry || "").trim(),
    ].filter(Boolean);
    return pieces.join(", ");
}

export default function RutasEntregasTabView({ routeId }: { routeId: string }) {
    const router = useRouter();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();
    const [rows, setRows] = useState<RutaEntregaRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!routeId) {
            setRows([]);
            setError(null);
            return;
        }

        let mounted = true;
        const loadShippings = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchWithAuthDelivery<any>(
                    `shipping?routeId=${encodeURIComponent(routeId)}`,
                    { method: "GET" }
                );
                const source = Array.isArray(response?.data) ? response.data : [];

                const mapped: RutaEntregaRow[] = source.map((item: any) => ({
                    id: String(item?.id ?? ""),
                    refId: String(item?.refId ?? item?.displayId ?? item?.id ?? "-"),
                    displayId: String(item?.displayId ?? ""),
                    origin: String(item?.senderFullname ?? item?.sender?.fullname ?? "").trim(),
                    type: String(item?.type ?? ""),
                    carrierId: String(item?.carrierId ?? ""),
                    operatorLogisticId: String(item?.senderWarehouseId ?? "").trim(),
                    status: String(item?.status ?? ""),
                    failedDeliveries: Number(item?.failedDeliveries ?? 0),
                    scheduleStart: String(item?.scheduleStart ?? ""),
                    scheduleEnd: String(item?.scheduleEnd ?? ""),
                    senderFullname: String(item?.senderFullname ?? ""),
                    receiverFullname: String(item?.receiverFullname ?? ""),
                    receiverDocument: String(item?.receiverDocument ?? ""),
                    receiverPhone: String(item?.receiverPhone ?? ""),
                    dropoffAddress: mapShippingAddress(item),
                    productQuantity: Number(item?.productQuantity ?? 0),
                    dateCreated: String(item?.dateCreated ?? ""),
                }));

                if (mounted) setRows(mapped);
            } catch (err: any) {
                if (mounted) {
                    setRows([]);
                    setError(err?.message || "No se pudieron cargar las entregas de la ruta.");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadShippings();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuthDelivery, routeId]);

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Rutas de transporte</div>
                    <div className="text-2xl font-semibold text-gray-900">{routeId || "Ruta"} - Entregas</div>
                </div>
            ),
            action: [
                {
                    label: "Volver al listado",
                    variant: "secondary",
                    icon: <XCircleIcon className="h-5 w-5" />,
                    onClick: () => router.push("/delivery/rutas/listado-rutas"),
                },
            ],
        } as PageHeaderProps),
        [routeId, router]
    );

    return (
        <RutasEntregasTab
            rows={rows}
            loading={loading}
            error={error}
            onViewDelivery={(shippingId) => {
                if (!shippingId) return;
                router.push(`/delivery/envios/${encodeURIComponent(shippingId)}`);
            }}
        />
    );
}
