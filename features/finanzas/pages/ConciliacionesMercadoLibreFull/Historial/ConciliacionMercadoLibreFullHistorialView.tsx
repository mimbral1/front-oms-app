"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserIcon } from "@heroicons/react/24/outline";
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
    documentoSap?: Array<{ status?: string | null }>;
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
};

type HistoryItem = {
    date: string;
    responsible: string;
    event: string;
    result: string;
};

const WAVES_URL = FINANCE_WAVES_API;

const HISTORY_ITEMS: HistoryItem[] = [
    {
        date: "02/06/2026 09:16",
        responsible: "Carolina Soto",
        event: "Subio archivo de liquidacion ML",
        result: "Archivo recibido",
    },
    {
        date: "02/06/2026 09:16",
        responsible: "Sistema",
        event: "Comparo liquidacion ML contra pedidos OMS",
        result: "0 casos pendientes",
    },
    {
        date: "27/05/2026 10:12",
        responsible: "Carolina Soto",
        event: "Definio generar nota de credito",
        result: "Caso corregido",
    },
    {
        date: "27/05/2026 10:21",
        responsible: "Carolina Soto",
        event: "Aprobo diferencia menor para SAP",
        result: "Aprobado para SAP",
    },
    {
        date: "27/05/2026 10:34",
        responsible: "Leonardo Gambino",
        event: "Asigno responsable operativo",
        result: "Pendiente decision",
    },
];

const formatDate = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

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
    };
};

export default function ConciliacionMercadoLibreFullHistorialView() {
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
                    setErrorMessage(error?.message || "No se pudo cargar el historial");
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
        return <div className="min-h-screen bg-[#e8eaf5] p-6 text-sm font-medium text-slate-600">Cargando historial...</div>;
    }

    if (!record) {
        return <div className="min-h-screen bg-[#e8eaf5] p-6 text-sm font-medium text-red-600">{errorMessage}</div>;
    }

    return (
        <div className="min-h-screen bg-[#e8eaf5]">
            <ConciliacionHeader
                displayId={record.displayId}
                dateRange={`${formatDate(record.startDate)} - ${formatDate(record.endDate)}`}
                status={record.status}
                activeTab="historial"
                recordId={record.id}
            />

            <div className="space-y-4 p-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Historial</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                        Registro de carga, comparacion y decisiones tomadas en {record.displayId}.
                    </p>
                </div>

                <section className="overflow-hidden rounded-md bg-white">
                    <div className="grid grid-cols-[220px_280px_1fr_280px] bg-[#dfe3ef] px-4 py-3 text-xs font-semibold text-slate-500">
                        <span>Fecha</span>
                        <span>Responsable</span>
                        <span>Evento</span>
                        <span>Resultado</span>
                    </div>

                    <div className="divide-y divide-[#e2e6f3]">
                        {HISTORY_ITEMS.map((item) => (
                            <div
                                key={`${item.date}-${item.event}`}
                                className="grid min-h-[58px] grid-cols-[220px_280px_1fr_280px] items-center border-l-4 border-l-emerald-500 px-4 text-sm text-slate-600"
                            >
                                <span className="font-medium">{item.date}</span>
                                <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                                    <UserIcon className="h-4 w-4 text-blue-600" />
                                    {item.responsible}
                                </span>
                                <span className="font-medium">{item.event}</span>
                                <span>
                                    <span className="inline-flex min-w-[210px] rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                        {item.result}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
