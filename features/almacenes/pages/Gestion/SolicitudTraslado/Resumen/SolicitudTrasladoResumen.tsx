// views\Almacen\Gestion\SolicitudTraslado\Resumen\SolicitudTrasladoResumen.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import {
    getMovementById,
} from "@/app/fetchWithAuth/api-traslados/inventory-docs";
import {
    TrasladosFieldsResumen,
    type InventoryDocRecord,
} from "@/features/almacenes/components/solicitud-traslado/SolicitudTrasladoFieldsResumen";

const STATUS_TEXT_MAP: Record<string, string> = {
    pending: "Pendiente",
    queued: "En cola",
    started: "Iniciado",
    ended: "Finalizado",
    posted: "Hecho",
    rejected: "Rechazado",
    canceled: "Cancelado",
    cancelled: "Cancelado",
};

function getStatusVariant(status: string) {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "ended" || normalized === "posted") return "success" as const;
    if (normalized === "pending" || normalized === "queued" || normalized === "started") return "info" as const;
    if (normalized === "rejected" || normalized === "canceled" || normalized === "cancelled") return "error" as const;
    return "info" as const;
}


/* ---------- Página ---------- */
export default function TrasladosResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<InventoryDocRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* ---------- fetch ---------- */
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                setErrorMessage(null);
                const movement = await getMovementById(recordId!);
                if (!mounted) return;

                const movementStatus = String(movement.status || "-");
                const movementType = String(movement.type || "-");
                const movementDate = movement.dateStarted || movement.dateCreated || movement.dateModified || "";
                const sourceWh = movement.source?.warehouseName || movement.source?.warehouseId || null;
                const destinationWh = movement.destination?.warehouseName || movement.destination?.warehouseId || null;
                const skuId = String(movement.content?.skuId || "-");
                const quantity = Number(movement.content?.quantity || 0);

                const mappedRecord: InventoryDocRecord = {
                    header: {
                        id: String(movement.displayId || movement.id || "-"),
                        docType: movementType,
                        fromWarehouseCode: sourceWh,
                        toWarehouseCode: destinationWh,
                        postingDate: movementDate,
                        reference: String(movement.order ?? movement.displayId ?? "—"),
                        metaJson: JSON.stringify({
                            source: movement.source ?? null,
                            destination: movement.destination ?? null,
                            content: movement.content ?? null,
                        }),
                        status: movementStatus,
                        externalRef: String(movement.displayId || movement.id || "—"),
                        sapDocEntry: null,
                        sapDocNum: null,
                        sapSeries: null,
                        createdAt: movement.dateCreated || movementDate,
                        updatedAt: movement.dateModified || movementDate,
                    },
                    lines: [
                        {
                            id: 0,
                            documentId: 0,
                            itemSku: skuId,
                            fromWarehouseCode: sourceWh,
                            toWarehouseCode: destinationWh,
                            quantity,
                            movementId: 0,
                            poDocEntry: null,
                            poLineNum: null,
                            createdAt: movement.dateCreated || movementDate,
                            updatedAt: movement.dateModified || movementDate,
                        },
                    ],
                };

                setRecord(mappedRecord);
            } catch (err: any) {
                console.error(err);

                const msg =
                    err?.message || "No se pudo cargar el traslado.";

                toast.error(msg);
                setErrorMessage(msg);
                setRecord(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (recordId) load();
        return () => {
            mounted = false;
        };
    }, [recordId]);

    /* ---------- acciones header ---------- */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => { router.push("/almacen/gestion/solicitud-traslado"); },
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Solicitud de Traslado
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Resumen
                    </div>
                </div>
            ),
            action: headerActions,
            status: record
                ? {
                    text: STATUS_TEXT_MAP[String(record.header.status || "").toLowerCase()] ?? record.header.status,
                    variant: getStatusVariant(record.header.status),
                }
                : undefined,

        } as unknown as PageHeaderProps),
        [headerActions, record?.header.status]
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="bg-white flex items-center justify-center px-4 py-6 text-center text-gray-500 text-sm">
                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando…
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white">
            {errorMessage && (
                <div
                    className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                    role="alert"
                >
                    <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">
                                Error al cargar el traslado
                            </h3>
                            <p className="mt-2 text-sm">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {record && <TrasladosFieldsResumen record={record} />}
        </div>
    );
}
