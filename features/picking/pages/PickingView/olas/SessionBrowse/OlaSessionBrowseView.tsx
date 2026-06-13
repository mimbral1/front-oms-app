"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { useFetchWithAuthQA } from "@/lib/http/client";
import {
    ArrowPathIcon,
    XCircleIcon,
    UserGroupIcon,
    DevicePhoneMobileIcon,
    CheckCircleIcon,
    ClockIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { fmtDateTime } from "@/lib/format/date";

interface ApiWaveResponse {
    main?: {
        waveDetail?: {
            status?: string;
        };
    };
    sessionBrowse?: {
        metrics?: {
            pickersWorkingWave?: number;
            activeSessions?: number;
            historicalSessions?: number;
        };
        pickersWorkingCurrently?: Array<{
            id?: string;
            name?: string;
            email?: string;
        }>;
        activeSessions?: ApiSessionBrowseSession[];
        historicalSessions?: ApiSessionBrowseSession[];
    };
}

interface ApiSessionBrowseSession {
    id: string;
    status?: string;
    createdAt?: string;
    startedAt?: string | null;
    finishedAt?: string | null;
    picker?: {
        id?: string;
        name?: string;
        email?: string;
    };
    items?: Array<{
        id?: string;
        requestedQty?: number | null;
        pickedQty?: number | null;
        productName?: string;
        name?: string;
        skuId?: string;
        ean?: string;
        imageUrl?: string;
        image?: string;
    }>;
    totals?: {
        items?: number;
    };
}

type ApiSessionBrowseItem = NonNullable<ApiSessionBrowseSession["items"]>[number];

interface SessionProductRow {
    id: string;
    name: string;
    skuId: string;
    requestedQty: number;
    pickedQty: number;
}

interface SessionRow {
    id: string;
    pickerId: string;
    pickerName: string;
    pickerEmail: string;
    statusLabel: string;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    terminalOrDevice: string;
    processedItems: number;
    totalItems: number;
    products: SessionProductRow[];
}

const statusVariantMap: Record<string, "success" | "warning" | "info" | "default"> = {
    finished: "success",
    active: "info",
    pending: "warning",
};

const statusLabelMap: Record<string, string> = {
    finished: "Finalizada",
    active: "En curso",
    pending: "Pendiente",
};

// fmtDateTime imported from @/lib/format/date

const toSafeNumber = (value: number | null | undefined) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getItemLabel = (item: ApiSessionBrowseItem) => {
    const name = item.productName?.trim() || item.name?.trim();
    if (name) return name;
    if (item.skuId) return `SKU ${item.skuId}`;
    if (item.ean) return `EAN ${item.ean}`;
    if (item.id) return `Item ${item.id}`;
    return "Producto sin nombre";
};

export default function OlaSessionBrowseView() {
    const router = useRouter();
    const params = useParams();
    const olaId = params?.id as string;
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [loading, setLoading] = useState(true);
    const [waveStatusRaw, setWaveStatusRaw] = useState("pending");
    const [activeRows, setActiveRows] = useState<SessionRow[]>([]);
    const [historicRows, setHistoricRows] = useState<SessionRow[]>([]);
    const [metrics, setMetrics] = useState({
        pickersWorkingWave: 0,
        activeSessions: 0,
        historicalSessions: 0,
    });
    const [workingPickers, setWorkingPickers] = useState<Array<{ id: string; name: string; email: string }>>([]);
    const [expandedSessionKeys, setExpandedSessionKeys] = useState<Set<string>>(new Set());

    const getSessionKey = useCallback((tone: "active" | "historical", sessionId: string) => `${tone}-${sessionId}`, []);

    const toggleSessionExpansion = useCallback((sessionKey: string) => {
        setExpandedSessionKeys((prev) => {
            const next = new Set(prev);
            if (next.has(sessionKey)) {
                next.delete(sessionKey);
            } else {
                next.add(sessionKey);
            }
            return next;
        });
    }, []);

    const load = useCallback(async () => {
        if (!olaId) return;
        setLoading(true);
        try {
            const waveJson = await fetchWithAuthQA(`picking-service/waves/${olaId}`);

            const wave: ApiWaveResponse = waveJson;
            setWaveStatusRaw(wave?.main?.waveDetail?.status ?? "pending");

            const sessionBrowse = wave?.sessionBrowse;
            const mappedWorkingPickers = (sessionBrowse?.pickersWorkingCurrently ?? []).map((picker) => ({
                id: picker.id ?? "",
                name: picker.name ?? picker.id ?? "-",
                email: picker.email ?? "",
            }));

            const mapSessionRows = (sessions: ApiSessionBrowseSession[] = []): SessionRow[] =>
                sessions.map((session) => {
                    const items = session.items ?? [];
                    const requestedQty = (session.items ?? []).reduce(
                        (sum, item) => sum + toSafeNumber(item.requestedQty),
                        0
                    );
                    const pickedQty = (session.items ?? []).reduce(
                        (sum, item) => sum + toSafeNumber(item.pickedQty),
                        0
                    );

                    const mappedProducts: SessionProductRow[] = items.map((item) => ({
                        id: item.id ?? "-",
                        name: getItemLabel(item),
                        skuId: item.skuId ?? "-",
                        requestedQty: toSafeNumber(item.requestedQty),
                        pickedQty: toSafeNumber(item.pickedQty),
                    }));

                    return {
                        id: session.id,
                        pickerId: session.picker?.id ?? "-",
                        pickerName: session.picker?.name?.trim() || session.picker?.id || "-",
                        pickerEmail: session.picker?.email ?? "",
                        statusLabel: session.status || "-",
                        createdAt: session.createdAt || "",
                        startedAt: session.startedAt ?? null,
                        finishedAt: session.finishedAt ?? null,
                        terminalOrDevice: "-",
                        processedItems: pickedQty,
                        totalItems: requestedQty,
                        products: mappedProducts,
                    };
                });

            setMetrics({
                pickersWorkingWave: sessionBrowse?.metrics?.pickersWorkingWave ?? 0,
                activeSessions: sessionBrowse?.metrics?.activeSessions ?? 0,
                historicalSessions: sessionBrowse?.metrics?.historicalSessions ?? 0,
            });
            setWorkingPickers(mappedWorkingPickers);
            setActiveRows(mapSessionRows(sessionBrowse?.activeSessions));
            setHistoricRows(mapSessionRows(sessionBrowse?.historicalSessions));
            setExpandedSessionKeys(new Set());
        } catch (err) {
            console.error("Error al cargar session browse de la ola:", err);
            setActiveRows([]);
            setHistoricRows([]);
            setMetrics({ pickersWorkingWave: 0, activeSessions: 0, historicalSessions: 0 });
            setWorkingPickers([]);
            setExpandedSessionKeys(new Set());
        } finally {
            setLoading(false);
        }
    }, [olaId, fetchWithAuthQA]);

    useEffect(() => {
        load();
    }, [load]);

    const actions: Action[] = useMemo(
        () => [
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: load,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/olas/listar-olas"),
            },
        ],
        [router, load]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Olas</div>
                    <div className="text-2xl font-semibold text-gray-900">{olaId}</div>
                </div>
            ),
            action: actions,
            status: {
                text: statusLabelMap[waveStatusRaw] ?? waveStatusRaw,
                variant: statusVariantMap[waveStatusRaw] ?? "default",
            },
        } as PageHeaderProps),
        [actions, olaId, waveStatusRaw]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-gray-500">
                <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                Cargando sesiones de la ola...
            </div>
        );
    }

    const renderTable = (data: SessionRow[], tone: "active" | "historical") => {
        if (data.length === 0) {
            return (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                    Sin sesiones para mostrar.
                </div>
            );
        }

        return (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                            <th className="px-4 py-3 text-left">Sesion</th>
                            <th className="px-4 py-3 text-left">Picker</th>
                            <th className="px-4 py-3 text-left">Estado</th>
                            <th className="px-4 py-3 text-left">Terminal/Dispositivo</th>
                            <th className="px-4 py-3 text-left">Items procesados</th>
                            <th className="px-4 py-3 text-left">Creada</th>
                            <th className="px-4 py-3 text-left">Inicio / Fin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row) => {
                            const sessionKey = getSessionKey(tone, row.id);
                            const isExpanded = expandedSessionKeys.has(sessionKey);

                            return (
                                <React.Fragment key={sessionKey}>
                                    <tr
                                        className="cursor-pointer hover:bg-gray-50/70"
                                        onClick={() => toggleSessionExpansion(sessionKey)}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <span>{row.id}</span>
                                                {isExpanded ? (
                                                    <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-800">{row.pickerName}</div>
                                            <div className="text-xs text-gray-500">{row.pickerEmail || row.pickerId}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone === "active" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {row.statusLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{row.terminalOrDevice}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            <span className="font-semibold text-gray-900">{row.processedItems}</span>
                                            <span className="text-gray-500">/{row.totalItems}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{fmtDateTime(row.createdAt)}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {fmtDateTime(row.startedAt)}
                                            <span className="mx-1 text-gray-300">/</span>
                                            {fmtDateTime(row.finishedAt)}
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={7} className="bg-gray-50 px-4 py-3">
                                                {row.products.length === 0 ? (
                                                    <div className="text-sm text-gray-500">
                                                        Esta sesión no tiene productos para mostrar.
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                                        <table className="min-w-full text-sm">
                                                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left">Producto</th>
                                                                    <th className="px-3 py-2 text-left">SKU</th>
                                                                    <th className="px-3 py-2 text-right">Requested</th>
                                                                    <th className="px-3 py-2 text-right">Picked</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {row.products.map((product) => (
                                                                    <tr key={`${row.id}-${product.id}-${product.skuId}`}>
                                                                        <td className="px-3 py-2 text-gray-800">{product.name}</td>
                                                                        <td className="px-3 py-2 text-gray-700">{product.skuId}</td>
                                                                        <td className="px-3 py-2 text-right text-gray-700">{product.requestedQty}</td>
                                                                        <td className="px-3 py-2 text-right font-medium text-gray-900">{product.pickedQty}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <UserGroupIcon className="h-4 w-4" />
                        Pickers trabajando la ola
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{metrics.pickersWorkingWave}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <ClockIcon className="h-4 w-4" />
                        Sesiones activas
                    </div>
                    <div className="text-2xl font-semibold text-blue-700">{metrics.activeSessions}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <CheckCircleIcon className="h-4 w-4" />
                        Sesiones historicas
                    </div>
                    <div className="text-2xl font-semibold text-gray-800">{metrics.historicalSessions}</div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />
                    Pickers trabajando actualmente
                </div>
                {workingPickers.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay pickers activos en esta ola.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {workingPickers.map((picker) => (
                            <span
                                key={`${picker.name}-${picker.email}`}
                                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                            >
                                {picker.name}
                                {picker.email ? ` (${picker.email})` : ""}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Sesiones activas</h3>
                {renderTable(activeRows, "active")}
            </section>

            <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Sesiones historicas</h3>
                {renderTable(historicRows, "historical")}
            </section>
        </div>
    );
}
