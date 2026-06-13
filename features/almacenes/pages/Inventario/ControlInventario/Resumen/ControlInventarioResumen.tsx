"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { ControlInventarioFields, StockControl } from "@/features/almacenes/components/inventario/controlinventario/ControlInventarioFields";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";

type ApiStockControlDetail = {
    id: string;
    warehouseId: string;
    displayId: string;
    assigneeId: string | null;
    reviewerId: string | null;
    items: Array<{
        ean?: string | null;
        countedQuantity?: number | null;
        positionId?: string | null;
        positionKey?: string | null;
        skuId?: string | null;
        skuReferenceId?: string | null;
        systemQuantity?: number | null;
        differenceQuantity?: number | null;
    }>;
    skuCount: number | null;
    itemCount: number | null;
    positionCount: number | null;
    status: string;
    dateCreated: string;
    dateModified: string;
    userCreated: string | null;
    userModified: string | null;
};

const STOCK_CONTROL_URL = `${BASE_WAREHOUSES}/stock-control`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});

const toDatetimeLocal = (raw?: string | null) => {
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const mapEstado = (status?: string): StockControl["estado"] => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "pendingconfirmation" || normalized === "pending_confirmation") return "Pendiente de confirmación";
    if (normalized === "inprogress" || normalized === "in_progress" || normalized === "started") return "En progreso";
    if (normalized === "confirmed" || normalized === "completed" || normalized === "done") return "Completado";
    if (normalized === "rejected") return "Rechazado";
    return "Pendiente de confirmación";
};

const countUnique = (values: Array<string | null | undefined>) =>
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)).size;

export default function ControlInventarioResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<StockControl | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const recordRef = useRef(record);

    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    useEffect(() => {
        let mounted = true;

        const loadDetail = async () => {
            setLoading(true);
            setErrorMessage(null);

            try {
                if (!recordId) {
                    if (mounted) setRecord(null);
                    return;
                }

                const [detail, warehouses] = await Promise.all([
                    fetch(`${STOCK_CONTROL_URL}/${encodeURIComponent(recordId)}`, {
                        method: "GET",
                        headers: JANIS_HEADERS,
                    }).then(async (response) => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return (await response.json()) as ApiStockControlDetail;
                    }),
                    warehousesAll(),
                ]);

                const items = Array.isArray(detail.items) ? detail.items : [];
                const warehouseNameById = new Map<string, string>();

                for (const warehouse of warehouses.items ?? []) {
                    warehouseNameById.set(warehouse.id, warehouse.name || warehouse.referenceId || warehouse.id);
                }

                const next: StockControl = {
                    id: detail.displayId || detail.id,
                    inventario: warehouseNameById.get(detail.warehouseId) ?? detail.warehouseId,
                    warehouseId: detail.warehouseId,
                    backendStatus: detail.status as StockControl["backendStatus"],
                    payloadItems: items.map((item) => ({
                        skuId: String(item.skuId || item.skuReferenceId || item.ean || ""),
                        skuReferenceId: String(item.skuReferenceId || item.skuId || ""),
                        positionId: String(item.positionId || ""),
                        countedQuantity: Number(item.countedQuantity ?? 0),
                        positionKey: String(item.positionKey || ""),
                        ean: String(item.ean || ""),
                    })),
                    asignado: { username: detail.assigneeId ?? "—", email: detail.assigneeId ?? "" },
                    reviewer: { username: detail.reviewerId ?? "—", email: detail.reviewerId ?? "" },
                    items: Number(detail.itemCount ?? items.length),
                    posiciones: Number(detail.positionCount ?? countUnique(items.map((item) => item.positionId || item.positionKey))),
                    productos: Number(detail.skuCount ?? countUnique(items.map((item) => item.skuId || item.skuReferenceId || item.ean))),
                    estado: mapEstado(detail.status),
                    usuario: { username: detail.userModified ?? "—", email: detail.userModified ?? "" },
                    fecha: toDatetimeLocal(detail.dateModified || detail.dateCreated),
                    created: {
                        username: detail.userCreated ?? "—",
                        email: detail.userCreated ?? "",
                        date: detail.dateCreated ? new Date(detail.dateCreated).toLocaleString("es-CL") : "",
                    },
                };

                if (mounted) setRecord(next);
            } catch (error: any) {
                if (mounted) {
                    console.error("Error cargando control inventario:", error);
                    setRecord(null);
                    setErrorMessage(error?.message || "No se pudo cargar el control de inventario");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadDetail();

        return () => {
            mounted = false;
        };
    }, [recordId]);

    const handleSave = useCallback(async () => {
        if (!recordRef.current) return;
        setSaving(true);
        try {
            console.log("[MOCK] Guardar control inventario:", recordRef.current);
        } finally {
            setSaving(false);
        }
    }, []);

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
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/inventario/control-de-inventario"),
                disabled: saving,
            },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Control de inventario</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.id || recordId}</div>
                </div>
            ),
            action: headerActions,
            status: record
                ? { text: record.estado, variant: record.estado === "Completado" ? "success" : "warning" }
                : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, record, recordId]
    );

    if (loading) return <div className="p-6 bg-white">Cargando…</div>;
    if (!record) return <div className="p-6 bg-white text-sm text-red-600">{errorMessage || "No se encontró el control de inventario."}</div>;

    return (
        <div className="p-6 bg-white">
            <ControlInventarioFields
                record={record}
                readOnly={false}
                onChange={(key, value) => setRecord((prev) => (prev ? { ...prev, [key]: value } : prev))}
            />
        </div>
    );
}
