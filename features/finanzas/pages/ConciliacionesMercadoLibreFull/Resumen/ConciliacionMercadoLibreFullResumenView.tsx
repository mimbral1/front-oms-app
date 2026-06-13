"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ClipboardDocumentListIcon,
    LockClosedIcon,
    ClockIcon,
    CheckIcon,
    ShoppingCartIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { ConciliacionHeader } from "../components/ConciliacionHeader";
import { FINANCE_WAVES_API } from "@/lib/http/endpoints";

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
    totalMl?: Array<{ total?: number | null }>;
    totalOms?: Array<{ total?: number | null }>;
};

type ApiWavesResponse = {
    waves?: ApiWave[];
};

type SummaryStatus = "processing" | "blocked" | "readySap" | "sentSap" | "errorSap";

type SummaryWave = {
    id: string;
    displayId: string;
    startDate: string | null;
    endDate: string | null;
    status: SummaryStatus;
    pendingDifferences: number;
    differencesDescription: string;
    sapStatus: string;
    sapCode: string | null;
    totalMl: number;
    totalOms: number;
};

const WAVES_URL = FINANCE_WAVES_API;

const STATUS_META: Record<SummaryStatus, { label: string; pill: string; title: string; description: string }> = {
    processing: {
        label: "Procesando",
        pill: "bg-blue-600 text-white",
        title: "Liquidación en proceso",
        description: "El archivo esta siendo comparado contra OMS.",
    },
    blocked: {
        label: "Bloqueada",
        pill: "bg-red-600 text-white",
        title: "Liquidación bloqueada",
        description: "Existen diferencias pendientes que requieren revision.",
    },
    readySap: {
        label: "Lista para SAP",
        pill: "bg-emerald-600 text-white",
        title: "Liquidación lista para SAP",
        description: "La liquidacion puede cerrarse y enviar documentos a SAP.",
    },
    sentSap: {
        label: "Enviada SAP",
        pill: "bg-blue-600 text-white",
        title: "Liquidación enviada a SAP",
        description: "El cierre fue completado y los documentos fueron generados.",
    },
    errorSap: {
        label: "Error SAP",
        pill: "bg-red-600 text-white",
        title: "Liquidación con error SAP",
        description: "El envio requiere revision o reintento.",
    },
};

const formatDate = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const mapStatus = (rawStatus?: string | null, sapStatus?: string | null, pending = 0): SummaryStatus => {
    const status = String(rawStatus || "").toLowerCase();
    const sap = String(sapStatus || "").toLowerCase();

    if (status.includes("error") || sap.includes("error")) return "errorSap";
    if (status.includes("block") || status.includes("locked")) return "blocked";
    if (status.includes("sent") || status.includes("closed") || status.includes("completed")) return "sentSap";
    if (status.includes("ready") || status.includes("pending_review")) return "readySap";
    if (sap === "en sap" && pending === 0) return "sentSap";
    return "processing";
};

const parseResolved = (description: string) => {
    const match = /(\d+)\s+resuelta/i.exec(description);
    return match ? Number(match[1]) : 0;
};

const mapWave = (wave: ApiWave): SummaryWave => {
    const week = wave.semana?.[0] ?? {};
    const estado = wave.estado?.[0] ?? {};
    const diferencias = wave.diferencias?.[0] ?? {};
    const documentoSap = wave.documentoSap?.[0] ?? {};
    const pendingDifferences = Number(diferencias.pendientes ?? 0);

    return {
        id: String(week.waveId || week.displayId || ""),
        displayId: String(week.displayId || "--"),
        startDate: week.fechaInicio ?? null,
        endDate: week.fechaFin ?? null,
        status: mapStatus(estado.status, documentoSap.status, pendingDifferences),
        pendingDifferences,
        differencesDescription: String(diferencias.descripcion || `${pendingDifferences} pendientes`),
        sapStatus: String(documentoSap.status || "sin proyectar"),
        sapCode: documentoSap.code ? String(documentoSap.code) : null,
        totalMl: Number(wave.totalMl?.[0]?.total ?? 0),
        totalOms: Number(wave.totalOms?.[0]?.total ?? 0),
    };
};

export default function ConciliacionMercadoLibreFullResumenView() {
    const router = useRouter();
    const params = useParams();
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const recordId = String(rawId || "");

    const [record, setRecord] = useState<SummaryWave | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadRecord = async () => {
            setLoading(true);
            setErrorMessage(null);

            try {
                const response = await fetch(WAVES_URL, { method: "GET" });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const payload = (await response.json()) as ApiWavesResponse;
                const waves = Array.isArray(payload.waves) ? payload.waves.map(mapWave) : [];
                const decodedId = decodeURIComponent(recordId);
                const found = waves.find((wave) => wave.id === decodedId || wave.displayId === decodedId) ?? null;

                if (mounted) {
                    setRecord(found);
                    if (!found) setErrorMessage("No se encontro la conciliacion solicitada.");
                }
            } catch (error: any) {
                if (mounted) {
                    setRecord(null);
                    setErrorMessage(error?.message || "No se pudo cargar la conciliacion");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadRecord();

        return () => {
            mounted = false;
        };
    }, [recordId]);

    const statusMeta = record ? STATUS_META[record.status] : STATUS_META.processing;
    const resolvedDifferences = useMemo(() => parseResolved(record?.differencesDescription ?? ""), [record?.differencesDescription]);
    const detectedDifferences = (record?.pendingDifferences ?? 0) + resolvedDifferences;

    if (loading) {
        return <div className="min-h-screen bg-[#e8eaf5] p-6 text-sm font-medium text-slate-600">Cargando resumen...</div>;
    }

    if (!record) {
        return (
            <div className="min-h-screen bg-[#e8eaf5] p-6">
                <button
                    type="button"
                    onClick={() => router.push("/finanzas/conciliaciones-mercadolibre-full")}
                    className="mb-4 inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-blue-600 hover:bg-slate-50"
                >
                    <XCircleIcon className="h-4 w-4" />
                    Volver
                </button>
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-medium text-red-600">{errorMessage}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#e8eaf5]">
            <ConciliacionHeader
                displayId={record.displayId}
                dateRange={`${formatDate(record.startDate)} - ${formatDate(record.endDate)}`}
                status={record.status}
                activeTab="resumen"
                recordId={record.id}
            />

            <div className="space-y-4 p-6">
                <section className="rounded-md border-l-4 border-l-blue-600 bg-blue-50 px-5 py-5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Estado de cierre</div>
                    <h2 className="mt-1.5 text-3xl font-semibold text-slate-900">{statusMeta.title}</h2>
                    <p className="mt-1.5 text-sm font-medium text-slate-600">{statusMeta.description}</p>
                </section>

                <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.05fr_0.95fr_1fr]">
                    <Card title="Estado de cierre" icon={<LockClosedIcon className="h-5 w-5" />}>
                        <div className="rounded-md border-l-4 border-l-blue-600 bg-blue-50 px-3 py-3">
                            <div className="text-sm font-semibold text-slate-900">Comparacion en curso</div>
                            <div className="mt-1 text-xs font-medium text-slate-600">El archivo esta siendo comparado contra OMS.</div>
                        </div>
                    </Card>

                    <Card title="Resultado conciliacion" icon={<ShoppingCartIcon className="h-5 w-5" />}>
                        <div className="grid grid-cols-2 gap-3">
                            <Metric label="Movimientos ML" value={record.totalMl > 0 ? "1.278" : "0"} />
                            <Metric label="Conciliados auto" value={String(resolvedDifferences)} positive />
                            <Metric label="Aprobados manual" value="0" positive />
                            <Metric label="Diferencias detectadas" value={String(detectedDifferences)} />
                            <Metric label="Diferencias resueltas" value={String(resolvedDifferences)} positive />
                            <Metric label="Diferencias pendientes" value={String(record.pendingDifferences)} positive={record.pendingDifferences === 0} />
                        </div>
                    </Card>

                    <Card title="Salida contable proyectada" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>
                        <div className="grid grid-cols-[1fr_auto] gap-y-3 text-sm">
                            <SummaryLine label="Movimientos conciliados" value="0" />
                            <SummaryLine label="Documentos SAP proyectados" value={record.sapCode ? "1" : "0"} />
                            <SummaryLine label="Facturas" value="0" />
                            <SummaryLine label="Boletas" value="0" />
                            <SummaryLine label="Notas credito" value="0" />
                            <SummaryLine label="Ajustes/excluidos" value="0" />
                        </div>
                    </Card>
                </section>

                <Card title="Validaciones de conciliacion" icon={<CheckIcon className="h-5 w-5" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <Validation label="Pendiente" text="PackId existe en OMS" />
                        <Validation label="Pendiente" text="SKU pertenece al pedido" />
                        <Validation label="Pendiente" text="Cantidad con diferencias" />
                        <Validation label="Pendiente" text="Monto con diferencias" />
                        <Validation label="Pendiente" text="Documento financiero valido" />
                    </div>
                </Card>

                <Card title="Ver historial de actividad" icon={<ClockIcon className="h-5 w-5" />} accentTitle>
                    <div className="border-l-4 border-l-blue-600 pl-5">
                        <Activity date={formatDateTime(record.startDate)} title="Liquidacion ML cargada" text={`liquidacion_full_${record.displayId.toLowerCase()}.xlsx`} />
                        <Activity date={formatDateTime(record.startDate)} title="Comparacion en curso" text="Validando PackId, SKU, cantidad, monto y tipo origen" />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Card({ title, icon, children, accentTitle = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; accentTitle?: boolean }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
            <div className={`mb-3 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-xs font-semibold uppercase tracking-wide ${accentTitle ? "text-blue-600" : "text-slate-900"}`}>
                <span className="text-slate-500">{icon}</span>
                {title}
            </div>
            {children}
        </section>
    );
}

function Metric({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
    return (
        <div className="rounded bg-[#f0f3fb] px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
            <div className={`mt-1.5 text-3xl font-semibold leading-none ${positive ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
        </div>
    );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
    return (
        <>
            <span className="font-semibold text-slate-600">{label}</span>
            <span className="font-semibold text-slate-900">{value}</span>
        </>
    );
}

function Validation({ label, text }: { label: string; text: string }) {
    return (
        <div className="rounded bg-[#f0f3fb] border-l-4 border-l-blue-600 px-3 py-3">
            <div className="text-sm font-semibold text-slate-900">{label}</div>
            <div className="mt-1 text-xs font-medium text-slate-600">{text}</div>
        </div>
    );
}

function Activity({ date, title, text }: { date: string; title: string; text: string }) {
    return (
        <div className="grid grid-cols-[145px_1fr] border-b border-slate-200 py-3 last:border-0">
            <div className="text-xs font-semibold text-slate-500">{date}</div>
            <div>
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <div className="mt-0.5 text-xs font-medium text-slate-500">{text}</div>
            </div>
        </div>
    );
}
