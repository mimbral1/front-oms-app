"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConciliacionHeader, type ConciliacionHeaderStatus } from "../components/ConciliacionHeader";
import { FINANCE_WAVES_API } from "@/lib/http/endpoints";

type ApiWave = {
    semana?: Array<{
        displayId?: string | null;
        waveId?: string | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
    }>;
    estado?: Array<{ status?: string | null }>;
    diferencias?: Array<{ pendientes?: number | null }>;
    documentoSap?: Array<{ status?: string | null; code?: string | null }>;
    totalMl?: Array<{ total?: number | null }>;
};

type ApiWavesResponse = {
    waves?: ApiWave[];
};

type SummaryWave = {
    id: string;
    displayId: string;
    startDate: string | null;
    endDate: string | null;
    status: ConciliacionHeaderStatus;
    sapStatus: string;
    sapCode: string | null;
    totalMl: number;
};

const WAVES_URL = FINANCE_WAVES_API;

const formatDate = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatMoney = (value: number) => `$${value.toLocaleString("es-CL")}`;

const mapStatus = (rawStatus?: string | null, sapStatus?: string | null, pending = 0): ConciliacionHeaderStatus => {
    const status = String(rawStatus || "").toLowerCase();
    const sap = String(sapStatus || "").toLowerCase();

    if (status.includes("error") || sap.includes("error")) return "errorSap";
    if (status.includes("block") || status.includes("locked")) return "blocked";
    if (status.includes("sent") || status.includes("closed") || status.includes("completed")) return "sentSap";
    if (status.includes("ready") || status.includes("pending_review")) return "readySap";
    if (sap === "en sap" && pending === 0) return "sentSap";
    return "processing";
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
        sapStatus: String(documentoSap.status || "sin proyectar"),
        sapCode: documentoSap.code ? String(documentoSap.code) : null,
        totalMl: Number(wave.totalMl?.[0]?.total ?? 0),
    };
};

export default function ConciliacionMercadoLibreFullDocumentosSapView() {
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

    if (loading) {
        return <div className="min-h-screen bg-[#e8eaf5] p-6 text-sm font-medium text-slate-600">Cargando documentos SAP...</div>;
    }

    if (!record) {
        return <div className="min-h-screen bg-[#e8eaf5] p-6 text-sm font-medium text-red-600">{errorMessage}</div>;
    }

    const hasDocuments = Boolean(record.sapCode);
    const totalDocuments = hasDocuments ? 1 : 0;
    const totalAmount = hasDocuments ? record.totalMl : 0;
    const sapState = hasDocuments ? "En SAP" : "Sin proyectar";

    return (
        <div className="min-h-screen bg-[#e8eaf5]">
            <ConciliacionHeader
                displayId={record.displayId}
                dateRange={`${formatDate(record.startDate)} - ${formatDate(record.endDate)}`}
                status={record.status}
                activeTab="documentos"
                recordId={record.id}
            />

            <div className="space-y-4 p-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Documentos SAP</h2>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                        Los documentos se proyectan despues de comparar la liquidacion contra OMS.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <StatCard title="Total documentos" value={String(totalDocuments)} subtitle={hasDocuments ? "documento generado" : "pendiente de proyeccion"} />
                    <StatCard title="Monto total" value={formatMoney(totalAmount)} subtitle={hasDocuments ? "monto proyectado" : "pendiente de calculo"} />
                    <StatCard title="Estado" value={sapState} subtitle={hasDocuments ? record.sapCode ?? "documento generado" : "sin DocEntry hasta enviar"} />
                </div>

                {hasDocuments ? (
                    <section className="rounded-md border border-slate-200 bg-white">
                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] border-b border-slate-200 bg-[#f0f3fb] px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                            <span>Documento</span>
                            <span>Tipo</span>
                            <span>Monto</span>
                            <span>Estado</span>
                        </div>
                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center px-4 py-4 text-sm">
                            <span className="font-semibold text-slate-900">{record.sapCode}</span>
                            <span className="font-semibold text-slate-600">Factura</span>
                            <span className="font-semibold text-slate-900">{formatMoney(record.totalMl)}</span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Generado</span>
                        </div>
                    </section>
                ) : (
                    <section className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
                        <h3 className="text-lg font-semibold text-slate-900">Sin documentos proyectados</h3>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                            Cuando termine la comparacion se agruparan movimientos conciliados en facturas, boletas y notas credito.
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <div className="rounded-md border border-slate-200 border-l-4 border-l-blue-600 bg-white px-4 py-4">
            <div className="text-xs font-semibold uppercase text-blue-600">{title}</div>
            <div className="mt-1 text-3xl font-semibold text-slate-900">{value}</div>
            <div className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</div>
        </div>
    );
}
