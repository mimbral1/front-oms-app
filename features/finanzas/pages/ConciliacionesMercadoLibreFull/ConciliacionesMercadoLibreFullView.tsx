"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowRightIcon,
    ArrowUpTrayIcon,
    DocumentTextIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { Action, PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/ui/button/action-button";
import Select from "@/components/ui/select";
import { useAuth } from "@/app/context/auth/AuthContext";
import { getLoggedUserId } from "@/lib/auth/logged-user";
import {
    FINANCE_WAVES_API,
    FINANCE_WAVES_MANUAL_ASSIGNMENTS_STAGE_API,
} from "@/lib/http/endpoints";

type ApiWave = {
    semana?: Array<{
        displayId?: string | null;
        waveId?: string | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
    }>;
    estado?: Array<{
        status?: string | null;
        descripcion?: string | null;
    }>;
    diferencias?: Array<{
        pendientes?: number | null;
        descripcion?: string | null;
    }>;
    documentoSap?: Array<{
        status?: string | null;
        code?: string | null;
    }>;
    totalMl?: Array<{
        total?: number | null;
    }>;
    totalOms?: Array<{
        total?: number | null;
    }>;
    accion?: string | null;
};

type ApiWavesResponse = {
    ok?: boolean;
    total?: number;
    page?: number;
    pageSize?: number;
    pages?: number;
    waves?: ApiWave[];
};

type ViewStatus = "processing" | "blocked" | "readySap" | "sentSap" | "errorSap";

type WaveRow = {
    id: string;
    displayId: string;
    startDate: string | null;
    endDate: string | null;
    status: ViewStatus;
    rawStatus: string;
    statusDescription: string;
    pendingDifferences: number;
    differencesDescription: string;
    sapStatus: string;
    sapCode: string | null;
    totalMl: number;
    totalOms: number;
};

type FilterValue = "all" | ViewStatus;

const WAVES_URL = FINANCE_WAVES_API;
const WAVE_STAGE_URL = FINANCE_WAVES_MANUAL_ASSIGNMENTS_STAGE_API;
const PER_PAGE = 10;

const STATUS_META: Record<ViewStatus, { label: string; subLabel: string; text: string; border: string; button: string }> = {
    processing: {
        label: "Procesando",
        subLabel: "comparando archivo",
        text: "text-blue-600",
        border: "border-l-blue-500",
        button: "Ver progreso",
    },
    blocked: {
        label: "Bloqueada",
        subLabel: "requiere revision",
        text: "text-red-600",
        border: "border-l-red-500",
        button: "Resolver diferencias",
    },
    readySap: {
        label: "Lista para SAP",
        subLabel: "puede cerrarse",
        text: "text-emerald-700",
        border: "border-l-amber-500",
        button: "Enviar a SAP",
    },
    sentSap: {
        label: "Enviada SAP",
        subLabel: "cierre completado",
        text: "text-blue-600",
        border: "border-l-emerald-500",
        button: "Ver documentos SAP",
    },
    errorSap: {
        label: "Error SAP",
        subLabel: "requiere reintento",
        text: "text-red-600",
        border: "border-l-red-500",
        button: "Revisar error SAP",
    },
};

const FILTERS: Array<{ label: string; value: FilterValue }> = [
    { label: "Todas", value: "all" },
    { label: "Procesando", value: "processing" },
    { label: "Bloqueadas", value: "blocked" },
    { label: "Listas para SAP", value: "readySap" },
    { label: "Enviadas SAP", value: "sentSap" },
    { label: "Error SAP", value: "errorSap" },
];

const formatDate = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatMoneyCompact = (value: number) => {
    if (!value) return "$0";
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })}M`;
    if (abs >= 1_000) return `$${(value / 1_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })}K`;
    return `$${value.toLocaleString("es-CL")}`;
};

const parseResolved = (description: string) => {
    const match = /(\d+)\s+resuelta/i.exec(description);
    return match ? Number(match[1]) : 0;
};

const translateStatusToSpanish = (value?: string | null) => {
    const raw = String(value || "").trim();
    if (!raw) return "--";

    const normalized = raw
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .toLowerCase();

    const translations: Record<string, string> = {
        blocked: "Bloqueado",
        billed: "Facturada",
        closed: "Cerrado",
        completed: "Completado",
        en_sap: "En SAP",
        error: "Error",
        error_sap: "Error SAP",
        locked: "Bloqueado",
        open: "Abierta",
        pending: "Pendiente",
        pending_review: "Pendiente de revision",
        processing: "Procesando",
        ready: "Lista",
        ready_sap: "Lista para SAP",
        sent: "Enviado",
        sent_sap: "Enviado a SAP",
        sin_proyectar: "Sin proyectar",
    };

    if (translations[normalized]) return translations[normalized];

    return raw
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const mapStatus = (rawStatus?: string | null, sapStatus?: string | null, pending = 0): ViewStatus => {
    const status = String(rawStatus || "").toLowerCase();
    const sap = String(sapStatus || "").toLowerCase();

    if (status.includes("error") || sap.includes("error")) return "errorSap";
    if (status.includes("block") || status.includes("locked")) return "blocked";
    if (status.includes("billed")) return "sentSap";
    if (status.includes("sent") || status.includes("closed") || status.includes("completed")) return "sentSap";
    if (status.includes("ready") || status.includes("pending_review")) return "readySap";
    if (pending > 0) return "blocked";
    if (sap === "en sap" && pending === 0) return "sentSap";
    return "processing";
};

const mapWave = (wave: ApiWave): WaveRow => {
    const week = wave.semana?.[0] ?? {};
    const estado = wave.estado?.[0] ?? {};
    const diferencias = wave.diferencias?.[0] ?? {};
    const documentoSap = wave.documentoSap?.[0] ?? {};
    const totalMl = Number(wave.totalMl?.[0]?.total ?? 0);
    const pendingDifferences = Number(diferencias.pendientes ?? 0);

    return {
        id: String(week.waveId || week.displayId || crypto.randomUUID()),
        displayId: String(week.displayId || "--"),
        startDate: week.fechaInicio ?? null,
        endDate: week.fechaFin ?? null,
        status: mapStatus(estado.status, documentoSap.status, pendingDifferences),
        rawStatus: String(estado.status || ""),
        statusDescription: String(estado.descripcion || ""),
        pendingDifferences,
        differencesDescription: String(diferencias.descripcion || `${pendingDifferences} pendientes`),
        sapStatus: String(documentoSap.status || "sin proyectar"),
        sapCode: documentoSap.code ? String(documentoSap.code) : null,
        totalMl,
        totalOms: Number(wave.totalOms?.[0]?.total ?? 0),
    };
};

export default function ConciliacionesMercadoLibreFullView() {
    const router = useRouter();
    const { token, user } = useAuth();
    const [rows, setRows] = useState<WaveRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterValue>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const loadWaves = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);

            const response = await fetch(WAVES_URL, { method: "GET" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const payload = (await response.json()) as ApiWavesResponse;
            if (!Array.isArray(payload.waves)) throw new Error("Respuesta invalida: waves no es un arreglo");

            setRows(payload.waves.map(mapWave));
            setCurrentPage(1);
        } catch (error: any) {
            setRows([]);
            setErrorMessage(error?.message || "No se pudieron cargar las conciliaciones");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadWaves();
    }, [loadWaves]);

    const filteredRows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return rows.filter((row) => {
            if (filter !== "all" && row.status !== filter) return false;
            if (!normalizedQuery) return true;

            return [
                row.displayId,
                row.id,
                STATUS_META[row.status].label,
                row.rawStatus,
                row.statusDescription,
                String(row.pendingDifferences),
                row.differencesDescription,
                row.sapCode ?? "",
                row.sapStatus,
            ]
                .join(" ")
                .toLowerCase()
                .includes(normalizedQuery);
        });
    }, [filter, query, rows]);

    const stats = useMemo(() => {
        const detected = filteredRows.reduce((acc, row) => acc + row.pendingDifferences + parseResolved(row.differencesDescription), 0);
        const resolved = filteredRows.reduce((acc, row) => acc + parseResolved(row.differencesDescription), 0);
        const pending = filteredRows.reduce((acc, row) => acc + row.pendingDifferences, 0);

        return {
            detected,
            resolved,
            pending,
            readySap: filteredRows.filter((row) => row.status === "readySap").length,
            blocked: filteredRows.filter((row) => row.status === "blocked").length,
            sentSap: filteredRows.filter((row) => row.status === "sentSap").length,
        };
    }, [filteredRows]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [currentPage, filteredRows]);

    const handleExport = () => {
        const headers = ["Semana", "Fecha inicio", "Fecha fin", "Estado", "Diferencias", "Documento SAP", "Total ML"];
        const data = filteredRows.map((row) => [
            row.displayId,
            formatDate(row.startDate),
            formatDate(row.endDate),
            `${translateStatusToSpanish(row.rawStatus)} - ${row.statusDescription || "--"}`,
            `${row.pendingDifferences} - ${row.differencesDescription || "--"}`,
            `${translateStatusToSpanish(row.sapStatus)} - ${row.sapCode || "--"}`,
            formatMoneyCompact(row.totalMl),
        ]);

        exportToCsv("conciliaciones-mercadolibre-full.csv", [headers, ...data]);
    };

    const filtersConfig = useMemo(
        () => [
            {
                id: "query",
                label: "",
                type: "text" as const,
                value: query,
                placeholder: "Buscar por semana, archivo o ID ML",
            },
        ],
        [query]
    );

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Subir archivo ML",
                variant: "success",
                icon: <ArrowUpTrayIcon className="h-5 w-5" />,
                onClick: () => setIsUploadModalOpen(true),
            },
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: handleExport,
                disabled: filteredRows.length === 0,
            },
        ],
        [filteredRows.length]
    );

    const handleFilterChange = (id: string, value: string) => {
        setCurrentPage(1);
        if (id === "query") {
            setQuery(value);
            return;
        }

    };

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Conciliación Mercado Libre Full"
                description="Revisa semanas conciliadas, resuelve diferencias y envia documentos a SAP."
                filters={filtersConfig}
                onFilterChange={handleFilterChange}
                action={headerActions}
                filtersGridClassName="lg:grid-cols-[minmax(0,1fr)] lg:pr-[860px]"
                filtersRight={
                    <div className="hidden xl:flex items-center gap-2">
                        {FILTERS.map((item) => {
                            const active = filter === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                        setCurrentPage(1);
                                        setFilter(item.value);
                                    }}
                                    className={`h-10 rounded-md border px-3 text-sm font-medium transition ${active
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            aria-label="Filtros avanzados"
                        >
                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                        </button>
                    </div>
                }
            />

            <div className="flex-1 p-6">
                {errorMessage ? (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                {loading ? (
                    <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Cargando conciliaciones...</div>
                ) : (
                    <>
                        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                            <StatCard color="border-l-blue-600" title="Diferencias detectadas" value={stats.detected} subtitle="movimientos con alerta" />
                            <StatCard color="border-l-emerald-600" title="Diferencias resueltas" value={stats.resolved} subtitle="aprobadas o corregidas" />
                            <StatCard color="border-l-red-500" title="Diferencias pendientes" value={stats.pending} subtitle="bloquean cierre" />
                            <StatCard color="border-l-blue-600" title="Listas para SAP" value={stats.readySap} subtitle="semana lista" />
                            <StatCard color="border-l-red-500" title="Bloqueadas" value={stats.blocked} subtitle="semana bloqueada" />
                            <StatCard color="border-l-blue-600" title="Enviadas a SAP" value={stats.sentSap} subtitle="esta semana" />
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-[1.2fr_1fr_1fr_1.1fr_0.7fr_1.6fr] bg-[#E8EAF7] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <span>Semana</span>
                                <span>Estado</span>
                                <span>Diferencias</span>
                                <span>Documentos SAP</span>
                                <span>Total ML</span>
                                <span>Acción</span>
                            </div>

                            <div className="space-y-1 bg-[#eef1fa] p-1">
                                {pageRows.length === 0 ? (
                                    <div className="rounded-md bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">
                                        No hay conciliaciones para mostrar.
                                    </div>
                                ) : (
                                    pageRows.map((row) => (
                                        <WaveRowItem
                                            key={row.id}
                                            row={row}
                                            onOpenResumen={() => router.push(`/finanzas/conciliaciones-mercadolibre-full/${encodeURIComponent(row.id)}`)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalRecords={filteredRows.length}
                            pageSize={PER_PAGE}
                            onPageChange={setCurrentPage}
                            barClassName="bg-[#e8eaf5]"
                        />
                    </>
                )}
            </div>
            <UploadMercadoLibreModal
                open={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                rows={rows}
                token={token}
                userId={Number((user as any)?.id ?? getLoggedUserId() ?? 0)}
                onCompared={loadWaves}
            />
        </div>
    );
}

function StatCard({ color, title, value, subtitle }: { color: string; title: string; value: number; subtitle: string }) {
    return (
        <div className={`rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm ${color} border-l-4`}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">{title}</div>
            <div className="mt-1 text-2xl font-semibold leading-none text-slate-800">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        </div>
    );
}

function WaveRowItem({ row, onOpenResumen }: { row: WaveRow; onOpenResumen: () => void }) {
    const meta = STATUS_META[row.status];

    return (
        <div className={`grid grid-cols-[1.2fr_1fr_1fr_1.1fr_0.7fr_1.6fr] items-center rounded-md border border-slate-200 border-l-4 ${meta.border} bg-white px-4 py-4`}>
            <div>
                <div className="text-sm font-semibold text-slate-800">{row.displayId}</div>
                <div className="mt-1 text-xs text-slate-500">
                    {formatDate(row.startDate)} - {formatDate(row.endDate)}
                </div>
            </div>

            <div>
                <div className={`text-sm font-semibold ${meta.text}`}>{translateStatusToSpanish(row.rawStatus)}</div>
                <div className="mt-1 text-xs text-slate-500">{row.statusDescription || "--"}</div>
            </div>

            <div>
                <div className={`text-sm font-semibold ${row.pendingDifferences > 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {row.pendingDifferences} pendientes
                </div>
                <div className="mt-1 text-xs text-slate-500">{row.differencesDescription || "--"}</div>
            </div>

            <div>
                <div className="text-sm font-semibold text-slate-800">{translateStatusToSpanish(row.sapStatus)}</div>
                <div className="mt-1 text-xs text-slate-500">{row.sapCode || "--"}</div>
            </div>

            <div className="text-base font-semibold text-slate-800">{formatMoneyCompact(row.totalMl)}</div>

            <div className="flex items-center justify-end gap-4">
                <button
                    type="button"
                    onClick={onOpenResumen}
                    className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${row.status === "sentSap"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
                        }`}
                >
                    {meta.button}
                    <ArrowRightIcon className="h-4 w-4" />
                </button>
                <button type="button" onClick={onOpenResumen} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    {row.status === "readySap" ? "Ver auditoria" : row.status === "processing" ? "Ver resumen" : "Historial"}
                </button>
            </div>
        </div>
    );
}

type UploadMercadoLibreModalProps = {
    open: boolean;
    onClose: () => void;
    onCompared: () => Promise<void> | void;
    rows: WaveRow[];
    token: string | null;
    userId: number;
};

function UploadMercadoLibreModal({ open, onClose, onCompared, rows, token, userId }: UploadMercadoLibreModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedPeriodId, setSelectedPeriodId] = useState("");
    const [parentDocumentFolioNumber, setParentDocumentFolioNumber] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) {
            setSelectedFile(null);
            setSelectedPeriodId("");
            setParentDocumentFolioNumber("");
            setIsDragOver(false);
            setIsComparing(false);
            setError("");
            return;
        }

        panelRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isComparing) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isComparing, onClose, open]);

    if (!open) return null;

    const periodOptions = rows.map((row) => ({
        value: row.id,
        label: `${row.displayId} | ${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
    }));

    const selectedRow = rows.find((row) => row.id === selectedPeriodId) ?? null;
    const selectedPeriodLabel = selectedRow ? `${formatDate(selectedRow.startDate)} - ${formatDate(selectedRow.endDate)}` : "--";

    const handleFileSelection = (file: File | null) => {
        if (!file) return;

        const lowerName = file.name.toLowerCase();
        const isExcelFile = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");

        if (!isExcelFile) {
            setSelectedFile(null);
            setError("Archivo invalido. Solo se permiten archivos .xls o .xlsx.");
            return;
        }

        setSelectedFile(file);
        const suggestedRow = findWaveRowForFile(file.name, rows);
        setSelectedPeriodId(suggestedRow?.id ?? "");
        setError("");
    };

    const handleCompare = async () => {
        if (!selectedFile) {
            setError("Debes seleccionar un archivo para comparar.");
            return;
        }
        if (!selectedRow) {
            setError("Debes seleccionar un periodo.");
            return;
        }
        if (!parentDocumentFolioNumber.trim()) {
            setError("Debes ingresar el numero de factura de Mercado Libre.");
            return;
        }
        if (!userId) {
            setError("No se pudo identificar el usuario que realiza la comparacion.");
            return;
        }
        if (!token) {
            setError("No hay sesion activa para enviar la comparacion.");
            return;
        }

        setError("");
        setIsComparing(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("waveId", selectedRow.id);
            formData.append("sourceFile", "finance");
            formData.append("userId", String(userId));
            formData.append("parentDocumentFolioNumber", parentDocumentFolioNumber.trim());

            const response = await fetch(WAVE_STAGE_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "x-plataforma-id": "1",
                },
                body: formData,
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const payload = await response.clone().json();
                    message =
                        payload?.message ||
                        payload?.error ||
                        payload?.detail ||
                        payload?.data?.message ||
                        message;
                } catch {
                    try {
                        const text = await response.text();
                        if (text) message = text;
                    } catch {
                        // no-op
                    }
                }
                throw new Error(message);
            }

            await onCompared();
            onClose();
        } catch (compareError: any) {
            setError(compareError?.message || "No se pudo enviar la comparacion.");
        } finally {
            setIsComparing(false);
        }
    };

    const summaryItems = [
        { label: "Archivo detectado", value: selectedFile ? selectedFile.name : "--" },
        { label: "Tipo", value: "Mercado Libre Full" },
    ];

    const metricItems = [
        {
            label: "Total OMS periodo",
            value: selectedRow ? formatMoneyCompact(selectedRow.totalOms) : "--",
            detail: selectedRow ? "monto OMS disponible para el periodo" : "selecciona un periodo de la lista",
        },
        {
            label: "Total ML periodo",
            value: selectedRow ? formatMoneyCompact(selectedRow.totalMl) : "--",
            detail: selectedRow ? "monto ML disponible para el periodo" : "selecciona un periodo de la lista",
        },
        {
            label: "Estado",
            value: selectedRow ? translateStatusToSpanish(selectedRow.rawStatus) : selectedFile ? "Sin periodo" : "Sin archivo",
            detail: selectedRow ? (selectedRow.statusDescription || "--") : selectedFile ? "debes seleccionar manualmente un periodo" : "carga un archivo para iniciar",
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={() => !isComparing && onClose()}>
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Subir archivo Mercado Libre Full"
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)] outline-none sm:p-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">Conciliacion Mercado Libre Full</div>
                        <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-[32px]">Subir archivo Mercado Libre Full</h2>
                        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                            Carga el Excel descargado desde Mercado Libre. El sistema comparara ventas, notas de credito,
                            refunds y ajustes contra el OMS.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Cerrar modal"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EEF3FF] text-blue-600 transition hover:bg-[#E2EAFF]"
                        onClick={() => !isComparing && onClose()}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    className="hidden"
                    onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
                />

                <div
                    className={`mt-6 rounded-2xl border border-dashed px-6 py-8 transition ${isDragOver ? "border-blue-400 bg-blue-50/70" : "border-[#C9D7FF] bg-[#F8FAFF]"}`}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(event) => {
                        event.preventDefault();
                        setIsDragOver(false);
                        handleFileSelection(event.dataTransfer.files?.[0] ?? null);
                    }}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                            <DocumentTextIcon className="h-7 w-7" />
                        </div>
                        <div className="mt-4 text-lg font-bold text-slate-800">
                            {selectedFile ? selectedFile.name : "Arrastra tu archivo Excel o seleccionalo"}
                        </div>
                        <div className="mt-2 text-sm font-medium text-slate-500">
                            {selectedFile ? `Periodo seleccionado: ${selectedPeriodLabel}` : "Formatos permitidos: .xls y .xlsx"}
                        </div>
                        <button
                            type="button"
                            className="mt-5 inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                            onClick={() => inputRef.current?.click()}
                        >
                            Seleccionar archivo
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Archivo detectado</div>
                        <div className="mt-2 truncate text-sm font-bold text-slate-900">{selectedFile ? selectedFile.name : "--"}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Periodo detectado</div>
                        <div className="mt-2">
                            <Select
                                id="periodo-mercado-libre-full"
                                placeholder="Selecciona el periodo"
                                options={periodOptions}
                                value={selectedPeriodId}
                                onValueChange={setSelectedPeriodId}
                                disabled={!selectedFile || isComparing}
                                className="min-h-[44px] rounded-xl border border-slate-100 bg-slate-50 px-3 pr-10 text-sm font-medium text-slate-700 shadow-none focus-within:border-blue-200 focus-within:ring-0"
                            />
                        </div>
                    </div>
                    {summaryItems.slice(1).map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{item.label}</div>
                            <div className="mt-2 truncate text-sm font-bold text-slate-900">{item.value}</div>
                        </div>
                    ))}
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <label htmlFor="parent-document-folio-number" className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                            Numero folio ML
                        </label>
                        <input
                            id="parent-document-folio-number"
                            type="text"
                            inputMode="numeric"
                            value={parentDocumentFolioNumber}
                            onChange={(event) => setParentDocumentFolioNumber(event.target.value)}
                            placeholder="Ingresa el folio"
                            disabled={isComparing}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                            className="mt-2 block w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white"
                        />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {metricItems.map((item) => (
                        <div key={item.label} className="rounded-2xl bg-[#F4F6FF] px-5 py-4">
                            <div className="text-xs font-extrabold uppercase tracking-wide text-blue-600">{item.label}</div>
                            <div className="mt-1 text-[32px] font-extrabold leading-none text-slate-900">{item.value}</div>
                            <div className="mt-2 text-sm font-semibold leading-5 text-slate-500">{item.detail}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <ActionButton variant="secondary" className="rounded-full px-6" onClick={onClose} disabled={isComparing}>
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        variant="primary"
                        className="rounded-full px-6"
                        onClick={handleCompare}
                        disabled={!selectedFile || !selectedRow || !parentDocumentFolioNumber.trim()}
                        loading={isComparing}
                    >
                        {!isComparing && <ArrowPathIcon className="h-4 w-4" />}
                        Comparar ahora
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}

function findWaveRowForFile(fileName: string, rows: WaveRow[]) {
    const normalizedFileName = fileName.toLowerCase();

    const exactMatch = rows.find((row) => normalizedFileName.includes(row.displayId.toLowerCase()));
    if (exactMatch) return exactMatch;

    const weekMatch = /w(\d{1,2})/i.exec(fileName);
    if (weekMatch) {
        const weekToken = `w${weekMatch[1].padStart(2, "0")}`;
        const rowMatch = rows.find((row) => row.displayId.toLowerCase().includes(weekToken));
        if (rowMatch) return rowMatch;
    }

    const monthMatch = /m(\d{1,2})/i.exec(fileName);
    if (monthMatch) {
        const monthToken = `m${monthMatch[1].padStart(2, "0")}`;
        const rowMatch = rows.find((row) => row.displayId.toLowerCase().includes(monthToken));
        if (rowMatch) return rowMatch;
    }

    return null;
}
