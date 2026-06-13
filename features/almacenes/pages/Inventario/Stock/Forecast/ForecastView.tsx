// app/views/Inventario/Stock/Detail/tabs/StockForecastTab.tsx
"use client";

/**
 * STOCK > Tab: FORECAST (Mock)
 * - Header con acciones (Aplicar/Guardar/Cancelar/Exportar).
 * - Gráfico de línea "Graph stock movements" (SVG simple, sin libs).
 * - Tabla de movimientos con pills numéricas y fecha formateada.
 * - Paginación 60 por página.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { Avatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader } from "@/components/ui/loader";
import { Pagination } from "@/components/ui/pagination";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { useFetchWithAuth } from "@/lib/http/client";

/* ======================= Tipos ======================= */
interface ForecastRow {
    id: string;
    tipo: string;
    stockPrevio: number;
    stockActual: number;
    fechaCreacion: string; // ISO
    usuarioCreador: string;
}

type JanisStockDetailResponse = {
    id: string;
    sku: string;
};

type CatalogProductResponse = {
    Name?: string | null;
};

type StockMovementApiRow = {
    Id: string;
    SkuId: string;
    PreviousStock: number;
    CurrentStock: number;
    MotiveId: string | null;
    DateCreated: string;
    UserCreated: string | null;
};

/* ======================= API ======================= */
const JANIS_STOCK_URL = `${BASE_WAREHOUSES}/stock`;
const JANIS_STOCK_MOVEMENT_URL = `${BASE_WAREHOUSES}/stock-movement`;

/* ======================= UI helpers ======================= */
const PER_PAGE = 60;

const toneClasses: Record<"yellow" | "blue" | "green" | "red" | "gray", string> = {
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-200 text-gray-700",
};

const PillTone = ({ value, tone }: { value: number | string; tone: keyof typeof toneClasses }) => (
    <span className={`inline-flex min-w-[36px] justify-center items-center rounded-full px-2 py-1 text-xs font-medium ${toneClasses[tone]}`}>
        {value}
    </span>
);

const fmt = (d: string) => {
    try { return new Date(d).toLocaleString("es-CL"); } catch { return "—"; }
};

const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("es-CL"); } catch { return "—"; }
};

const fmtTime = (d: string) => {
    try { return new Date(d).toLocaleTimeString("es-CL"); } catch { return "—"; }
};

/* ======================= Columnas ======================= */
function getColumns(): Column<ForecastRow>[] {
    return [
        {
            header: <div className="w-full text-center">Tipo</div>,
            accessorKey: "tipo",
            cell: (r) => {
                const isEmpty = !r.tipo || r.tipo === "-";
                return (
                    <div className="flex w-full justify-center">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isEmpty ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"
                                }`}
                        >
                            {isEmpty ? "Sin motivo" : r.tipo}
                        </span>
                    </div>
                );
            },
        },
        {
            header: <div className="w-full text-center">Stock previo</div>,
            accessorKey: "stockPrevio",
            cell: (r) => (
                <div className="flex w-full justify-center">
                    <PillTone value={r.stockPrevio} tone="gray" />
                </div>
            ),
        },
        {
            header: <div className="w-full text-center">Stock actual</div>,
            accessorKey: "stockActual",
            cell: (r) => {
                const delta = r.stockActual - r.stockPrevio;
                const tone: keyof typeof toneClasses = delta > 0 ? "green" : delta < 0 ? "red" : "gray";
                return (
                    <div className="flex w-full items-center justify-center gap-2">
                        <PillTone value={r.stockActual} tone={tone} />
                        <span className="text-xs text-slate-500">{delta === 0 ? "" : delta > 0 ? `+${delta}` : delta}</span>
                    </div>
                );
            },
        },
        {
            header: <div className="w-full text-center">Creación</div>,
            accessorKey: "fechaCreacion",
            cell: (r) => (
                <div className="w-full text-center leading-tight">
                    <div className="text-sm font-medium text-slate-800">{fmtDate(r.fechaCreacion)}</div>
                    <div className="text-xs text-slate-500">{fmtTime(r.fechaCreacion)}</div>
                </div>
            ),
        },
        {
            header: <div className="w-full text-center">Usuario creador</div>, accessorKey: "usuarioCreador", cell: (row: ForecastRow) => (
                <div className="flex w-full justify-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-sm text-gray-700">
                        <Avatar
                            name={row.usuarioCreador || "-"}
                            alt={row.usuarioCreador || "-"}
                            className="h-8 w-8"
                        />
                        <div className="flex flex-col">
                            <span>{row.usuarioCreador}</span>
                        </div>
                    </div>
                </div>
            ),
        },
    ];
}

/* ======================= Gráfico SVG simple ======================= */
function LineChart({
    data,
    width = 1100,
    height = 280,
    padding = 32,
}: {
    data: { date: string; stock: number }[];
    width?: number;
    height?: number;
    padding?: number;
}) {
    if (!data.length) return <div className="h-[280px] rounded-xl bg-white" />;

    const xs = data.map((d) => new Date(d.date).getTime());
    const ys = data.map((d) => d.stock);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const rawMinY = Math.min(...ys);
    const rawMaxY = Math.max(...ys);
    const minY = rawMinY === rawMaxY ? rawMinY - 1 : Math.min(rawMinY, 0);
    const maxY = rawMinY === rawMaxY ? rawMaxY + 1 : rawMaxY;
    const w = width - padding * 2;
    const h = height - padding * 2;

    const points = data
        .map((d) => {
            const x = padding + ((new Date(d.date).getTime() - minX) / (maxX - minX || 1)) * w;
            const y = padding + (1 - (d.stock - minY) / ((maxY - minY) || 1)) * h;
            return `${x},${y}`;
        })
        .join(" ");

    const pointCoords = data.map((d) => {
        const x = padding + ((new Date(d.date).getTime() - minX) / (maxX - minX || 1)) * w;
        const y = padding + (1 - (d.stock - minY) / ((maxY - minY) || 1)) * h;
        return { x, y };
    });

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[280px] rounded-xl bg-white">
            {/* grid horizontal leve */}
            {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} x1={padding} x2={width - padding} y1={padding + (i * h) / 4} y2={padding + (i * h) / 4} className="stroke-gray-200" />
            ))}
            {/* eje X/Y */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-gray-300" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stroke-gray-300" />
            {/* línea */}
            <polyline points={points} fill="none" stroke="currentColor" className="text-blue-600" strokeWidth={2} />
            {/* puntos */}
            {pointCoords.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r={3} className="fill-blue-600" />
            ))}
            {/* leyenda mínima */}
            <text x={width - padding - 60} y={padding + 16} className="text-xs fill-gray-700">Stock</text>
            <text x={width / 2} y={height - 6} textAnchor="middle" className="text-xs fill-gray-600">Fechas</text>
            <text x={12} y={height / 2} transform={`rotate(-90 12 ${height / 2})`} className="text-xs fill-gray-600">Stock</text>
        </svg>
    );
}

/* ======================= Vista ======================= */
export default function StockForecastTab() {
    // header y acciones (mismo patrón que otras tabs)
    const router = useRouter();
    const { id } = useParams<{ id: string | string[] }>();
    const idParam = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuth } = useFetchWithAuth();
    const [headerName, setHeaderName] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = useCallback(async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 350));
        setSaving(false);
    }, []);

    const [allRows, setAllRows] = useState<ForecastRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const columns = useMemo(() => getColumns(), []);

    const resolveSku = useCallback(async (value: string) => {
        if (!value) return "";

        const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        if (!looksLikeUuid) return value;

        const detailRes = await fetch(`${JANIS_STOCK_URL}/${encodeURIComponent(value)}`, {
            method: "GET",
            headers: withAuthPlatformHeaders({
                "janis-api-key": "test-key",
                "janis-api-secret": "test-secret",
                "janis-client": "test-client",
                "Content-Type": "application/json",
            }),
            cache: "no-store",
        });

        if (!detailRes.ok) {
            throw new Error(`No se pudo resolver SKU desde stockId (${detailRes.status})`);
        }

        const detail = (await detailRes.json()) as JanisStockDetailResponse;
        return detail.sku || "";
    }, []);

    const fetchList = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const resolvedSku = await resolveSku(String(idParam || ""));
            if (!resolvedSku) {
                setAllRows([]);
                setTotalRecords(0);
                return;
            }

            const url = `${JANIS_STOCK_MOVEMENT_URL}?filters[sku]=${encodeURIComponent(resolvedSku)}`;
            const res = await fetch(url, {
                method: "GET",
                headers: withAuthPlatformHeaders({
                    "janis-api-key": "test-key",
                    "janis-api-secret": "test-secret",
                    "janis-client": "test-client",
                    "Content-Type": "application/json",
                }),
                cache: "no-store",
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` - ${body}` : ""}`);
            }

            const payload = (await res.json()) as StockMovementApiRow[];
            const normalized = (payload || [])
                .map<ForecastRow>((row) => ({
                    id: row.Id,
                    tipo: row.MotiveId || "-",
                    stockPrevio: row.PreviousStock ?? 0,
                    stockActual: row.CurrentStock ?? 0,
                    fechaCreacion: row.DateCreated || "",
                    usuarioCreador: row.UserCreated || "Sistema",
                }))
                .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

            setAllRows(normalized);
            setCurrentPage(1);
        } catch (e: any) {
            setAllRows([]);
            setErrorMessage(e?.message || "Error al cargar movimientos de stock.");
        } finally {
            setLoading(false);
        }
    }, [idParam, resolveSku]);

    useEffect(() => { fetchList(); }, [fetchList]);

    useEffect(() => {
        if (!idParam || typeof idParam !== "string") {
            setHeaderName("");
            return;
        }

        let cancelled = false;

        const loadHeader = async () => {
            try {
                const product = await fetchWithAuth<CatalogProductResponse>(
                    `catalog/products/${encodeURIComponent(idParam)}`,
                    { method: "GET" }
                );

                if (!cancelled) {
                    setHeaderName((product?.Name || "").trim());
                }
            } catch {
                if (!cancelled) {
                    setHeaderName("");
                }
            }
        };

        loadHeader();

        return () => {
            cancelled = true;
        };
    }, [idParam, fetchWithAuth]);

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return allRows.slice(start, start + PER_PAGE);
    }, [allRows, currentPage]);

    useEffect(() => {
        setTotalRecords(allRows.length);
    }, [allRows]);

    const chartSeries = useMemo(() => {
        return [...allRows]
            .sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime())
            .map((r) => ({ date: r.fechaCreacion, stock: r.stockActual }));
    }, [allRows]);

    const latestMovement = useMemo(() => {
        if (!allRows.length) return "—";
        return fmt(allRows[0].fechaCreacion);
    }, [allRows]);

    const handleExport = useCallback(() => {
        const headers = [
            "Tipo", "Stock previo", "Stock actual", "Creación", "Usuario creador",
        ];
        const data = allRows.map((r) => [
            r.tipo, r.stockPrevio, r.stockActual, fmt(r.fechaCreacion), r.usuarioCreador,
        ]);
        exportToCsv("forecast-stock.csv", [headers, ...data]);
    }, [allRows]);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Exportar", variant: "primary", icon: <ArrowDownTrayIcon className="h-5 w-5" />, onClick: handleExport },
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: true,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: true,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/almacen/inventario/stock"), disabled: saving },
        ],
        [saving, handleSave, router, handleExport]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Stock</div>
                    <div className="text-2xl font-semibold text-gray-900">{headerName || (idParam ? String(idParam) : "Stock")}</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions, headerName, idParam]
    );

    return (
        <div className="min-h-screen bg-[#e8eaf5]">
            <div className="px-4 pt-4 space-y-4">
                {/* Gráfico */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">Grafico de movimientos de stock</h3>
                            <p className="text-xs text-slate-500">Evolucion de stock actual por fecha de creacion</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                Movimientos: {totalRecords}
                            </span>
                            <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                                Ultimo: {latestMovement}
                            </span>
                        </div>
                    </div>
                    <LineChart data={chartSeries} />
                </div>

                {/* Tabla */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-800">Movimientos</h3>
                    </div>

                    {loading ? (
                        <Loader label="Cargando forecast..." className="py-10" />
                    ) : errorMessage ? (
                        <p className="text-sm text-red-700">{errorMessage}</p>
                    ) : !pagedRows.length ? (
                        <EmptyState
                            title="Sin movimientos de stock"
                            description="No hay datos para el SKU consultado."
                        />
                    ) : (
                        <>
                            <DataTable
                                data={pagedRows}
                                columns={columns}
                                dataType="General2"
                                rowPaddingY={18}
                                rowBgClass="bg-white"
                                showStatusBorder={false}
                            />
                            <div className="mt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalRecords={totalRecords}
                                    pageSize={PER_PAGE}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
