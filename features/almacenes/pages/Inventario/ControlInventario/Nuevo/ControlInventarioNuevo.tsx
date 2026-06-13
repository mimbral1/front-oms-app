"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { CopyableText } from "@/components/ui/copyable-text";
import { useFetchWithAuth } from "@/lib/http/client";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { getLoggedUserId } from "@/lib/auth/logged-user";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
const STOCK_CONTROLS_URL = `${BASE_WAREHOUSES}/stock-control?filters[reviewerId][$null]=true`;
const USERS_BASE = "idservice/usuarios";
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});

type StockControlResponseItem = {
    id: string;
    displayId?: string;
    warehouseId?: string;
    warehouseName?: string;
    dateCreated?: string;
    items?: Array<{
        skuId?: string;
        skuReferenceId?: string;
    }>;
};

type StockControlOption = {
    id: string;
    label: string;
};

type ReviewerResponseItem = {
    id?: string | number;
    ID?: string | number;
    usuarioId?: string | number;
    userId?: string | number;
    username?: string;
    userName?: string;
    FIRSTNAME?: string;
    LASTNAME?: string;
    nombre?: string;
    name?: string;
    email?: string;
    EMAIL?: string;
};

type ReviewerOption = {
    id: string;
    label: string;
};

const toLocalDate = (raw?: string) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("es-CL");
};

const getSkuLabel = (items?: StockControlResponseItem["items"]) => {
    const skuValues = Array.from(
        new Set(
            (items || [])
                .map((item) => String(item?.skuId ?? item?.skuReferenceId ?? "").trim())
                .filter(Boolean)
        )
    );

    return skuValues.length ? skuValues.join(", ") : "Sin SKU";
};

const normalizeReviewer = (user: ReviewerResponseItem): ReviewerOption | null => {
    const id = String(user.id ?? user.ID ?? user.usuarioId ?? user.userId ?? "").trim();
    const fullName = `${String(user.FIRSTNAME ?? "").trim()} ${String(user.LASTNAME ?? "").trim()}`.trim();
    const username = String(user.username ?? user.userName ?? user.nombre ?? user.name ?? fullName).trim();
    const email = String(user.email ?? user.EMAIL ?? "").trim();
    if (!id) return null;

    const labelBase = username || email || id;
    const label = email && username ? `${username} (${email})` : labelBase;
    return { id, label };
};

export default function ControlInventarioNuevoView() {
    const router = useRouter();
    const { fetchWithAuth, token } = useFetchWithAuth();
    const [stockControlOptions, setStockControlOptions] = useState<StockControlOption[]>([]);
    const [reviewerOptions, setReviewerOptions] = useState<ReviewerOption[]>([]);
    const [selectedStockControlId, setSelectedStockControlId] = useState("");
    const [selectedReviewerId, setSelectedReviewerId] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            try {
                const [controlsRes, usersResp, warehousesResp] = await Promise.all([
                    fetch(STOCK_CONTROLS_URL, {
                        method: "GET",
                        headers: JANIS_HEADERS,
                    }),
                    fetchWithAuth<any>(`${USERS_BASE}?page=1&pageSize=500`, {
                        method: "GET",
                    }),
                    warehousesAll().catch(() => ({ items: [], total: 0 })),
                ]);

                if (!controlsRes.ok) throw new Error(`Controles sin reviewer: HTTP ${controlsRes.status}`);

                const controls = (await controlsRes.json()) as StockControlResponseItem[];
                const users = (Array.isArray(usersResp?.data) ? usersResp.data : usersResp) as ReviewerResponseItem[];
                const warehouseNameById = new Map<string, string>();
                for (const warehouse of warehousesResp?.items || []) {
                    if (warehouse?.id) {
                        warehouseNameById.set(String(warehouse.id), String(warehouse.name || warehouse.referenceId || warehouse.id));
                    }
                }

                if (!mounted) return;

                const controlOptions: StockControlOption[] = (controls || [])
                    .filter((item) => item?.id)
                    .map((item) => ({
                        id: String(item.id),
                        label: `${item.warehouseName || warehouseNameById.get(String(item.warehouseId || "")) || item.warehouseId || "Sin warehouse"} | SKU: ${getSkuLabel(item.items)}`,
                    }));

                const reviewers = (users || [])
                    .map(normalizeReviewer)
                    .filter((reviewer): reviewer is ReviewerOption => Boolean(reviewer));

                const uniqueReviewers = Array.from(new Map(reviewers.map((r) => [r.id, r])).values());

                setStockControlOptions(controlOptions);
                setReviewerOptions(uniqueReviewers);
            } catch (e: any) {
                if (mounted) {
                    setStockControlOptions([]);
                    setReviewerOptions([]);
                    setError(e?.message || "No se pudieron cargar controles o reviewers.");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth, token]);

    const handleAssignReviewer = useCallback(async () => {
        if (!selectedStockControlId || !selectedReviewerId) return;
        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const assignUrl = `${BASE_WAREHOUSES}/stock-control/${encodeURIComponent(selectedStockControlId)}/assign`;
            const response = await fetch(assignUrl, {
                method: "POST",
                headers: {
                    ...JANIS_HEADERS,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reviewerId: selectedReviewerId,
                    usuarioCreadorId: getLoggedUserId(),
                }),
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const errorPayload = await response.json();
                    message =
                        String(errorPayload?.message || errorPayload?.error || errorPayload?.detail || "").trim() || message;
                } catch {
                    // ignore parse error and keep HTTP status
                }
                throw new Error(message);
            }

            setSuccessMessage("Reviewer asignado correctamente.");
            setStockControlOptions((prev) => prev.filter((option) => option.id !== selectedStockControlId));
            setSelectedStockControlId("");
        } catch (e: any) {
            setError(e?.message || "No se pudo asignar el reviewer.");
        }

        setSubmitting(false);
    }, [selectedReviewerId, selectedStockControlId]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Asignar reviewer",
                variant: "success",
                icon: submitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: handleAssignReviewer,
                disabled: submitting || !selectedStockControlId || !selectedReviewerId,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/almacen/inventario/control-de-inventario") },
        ],
        [router, handleAssignReviewer, selectedReviewerId, selectedStockControlId, submitting]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Control de inventario</div>
                    <div className="text-2xl font-semibold text-gray-900">Asignar reviewer</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <div className="mx-auto max-w-3xl space-y-6 rounded-xl border border-gray-200 p-6">
                {loading ? (
                    <div className="flex items-center text-sm text-gray-600">
                        <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" /> Cargando controles y usuarios...
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <div className="flex items-center">
                            <ExclamationTriangleIcon className="mr-2 h-4 w-4" /> {error}
                        </div>
                    </div>
                ) : (
                    <>
                        {successMessage && (
                            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                <div className="flex items-center">
                                    <CheckCircleIcon className="mr-2 h-4 w-4" /> {successMessage}
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Control de inventario</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={selectedStockControlId}
                                onChange={(e) => setSelectedStockControlId(e.target.value)}
                            >
                                <option value="">Selecciona un control</option>
                                {stockControlOptions.map((control) => (
                                    <option key={control.id} value={control.id}>
                                        {control.label}
                                    </option>
                                ))}
                            </select>
                            {selectedStockControlId && (
                                <div className="mt-2 text-xs text-gray-500">
                                    ID: <CopyableText text={selectedStockControlId}>{selectedStockControlId}</CopyableText>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Supervisor</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={selectedReviewerId}
                                onChange={(e) => setSelectedReviewerId(e.target.value)}
                            >
                                <option value="">Selecciona un supervisor</option>
                                {reviewerOptions.map((reviewer) => (
                                    <option key={reviewer.id} value={reviewer.id}>
                                        {reviewer.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
