"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
    DocumentTextIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";
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
    diferencias?: Array<{ pendientes?: number | null; descripcion?: string | null }>;
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
    pendingDifferences: number;
};

type PendingCase = {
    id: string;
    type: string;
    order: string;
    title: string;
    subtitle: string;
    amount: string;
    status: "Pendiente decision" | "Aprobado" | "Excluido";
    oms: string;
    ml: string;
    difference: string;
    differenceReason: string;
    details: Array<{ label: string; value: string }>;
    history: Array<{ date: string; label: string; value: string }>;
};

const WAVES_URL = FINANCE_WAVES_API;

const CASES: PendingCase[] = [
    {
        id: "case-amount",
        type: "Monto distinto",
        order: "Pedido ML 200008722187305",
        title: "Monto distinto",
        subtitle: "Aceite de oliva extra virgen 500 Ml",
        amount: "$-2.000",
        status: "Pendiente decision",
        oms: "$20.158",
        ml: "$18.158",
        difference: "$-2.000",
        differenceReason: "Nota credito",
        details: [
            { label: "Pedido OMS", value: "REC #1513831023542-01" },
            { label: "PackId", value: "2000012773906585" },
            { label: "SKU", value: "MIM-ML-ACE-500" },
            { label: "Posible causa", value: "Nota de credito posterior a la venta" },
        ],
        history: [
            { date: "20/05/2026", label: "Venta", value: "$20.158" },
            { date: "31/05/2026", label: "Nota credito", value: "$-2.000" },
        ],
    },
    {
        id: "case-sku",
        type: "SKU no encontrado",
        order: "Pedido ML 200008722187306",
        title: "SKU no encontrado",
        subtitle: "Producto informado por ML sin equivalencia OMS",
        amount: "$0",
        status: "Pendiente decision",
        oms: "$0",
        ml: "$12.990",
        difference: "$12.990",
        differenceReason: "SKU sin match",
        details: [
            { label: "Pedido OMS", value: "REC #1513831023542-02" },
            { label: "PackId", value: "2000012773906586" },
            { label: "SKU", value: "ML-SKU-UNKNOWN" },
            { label: "Posible causa", value: "Producto sin mapeo en catalogo" },
        ],
        history: [
            { date: "20/05/2026", label: "Venta ML", value: "$12.990" },
        ],
    },
];

const CASE_TYPES = [
    "Monto distinto",
    "SKU no encontrado",
    "Cantidad distinta",
    "Pedido no encontrado",
    "Revision manual",
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
        pendingDifferences,
    };
};

export default function ConciliacionMercadoLibreFullCasosPendientesView() {
    const params = useParams();
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const recordId = String(rawId || "");

    const [record, setRecord] = useState<SummaryWave | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState(CASE_TYPES[0]);
    const [selectedCaseId, setSelectedCaseId] = useState(CASES[0].id);

    useEffect(() => {
        let mounted = true;

        const loadRecord = async () => {
            setLoading(true);

            try {
                const response = await fetch(WAVES_URL, { method: "GET" });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const payload = (await response.json()) as ApiWavesResponse;
                const waves = Array.isArray(payload.waves) ? payload.waves.map(mapWave) : [];
                const decodedId = decodeURIComponent(recordId);
                const found = waves.find((wave) => wave.id === decodedId || wave.displayId === decodedId) ?? null;
                if (mounted) setRecord(found);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadRecord();

        return () => {
            mounted = false;
        };
    }, [recordId]);

    const casesByType = useMemo(() => CASES.filter((item) => item.type === selectedType), [selectedType]);
    const selectedCase = CASES.find((item) => item.id === selectedCaseId) ?? casesByType[0] ?? CASES[0];

    useEffect(() => {
        const firstCase = CASES.find((item) => item.type === selectedType);
        if (firstCase) setSelectedCaseId(firstCase.id);
    }, [selectedType]);

    if (loading || !record) {
        return <div className="min-h-screen bg-[#e8eaf5] p-6 text-sm font-medium text-slate-600">Cargando casos pendientes...</div>;
    }

    const dateRange = `${formatDate(record.startDate)} - ${formatDate(record.endDate)}`;
    const pendingCount = Math.max(record.pendingDifferences, 5);

    return (
        <div className="min-h-screen bg-[#e8eaf5]">
            <ConciliacionHeader
                displayId={record.displayId}
                dateRange={dateRange}
                status={record.status}
                activeTab="casos"
                recordId={record.id}
            />

            <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Casos pendientes</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <ActionButton variant="secondary" size="sm">
                            <DocumentTextIcon className="h-4 w-4" />
                            Ver auditoria completa
                        </ActionButton>
                        <ActionButton variant="secondary" size="sm" className="h-8 w-8 rounded-full px-0">
                            <ChevronRightIcon className="h-4 w-4" />
                        </ActionButton>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.65fr_1fr]">
                    <Panel title="Casos por estado" right={`${pendingCount + 1} casos mock`}>
                        <div className="grid grid-cols-3 gap-3">
                            <StatusCard label="Pendientes" value={pendingCount} subtitle="Requieren decision" color="border-l-red-500" />
                            <StatusCard label="Aprobados" value={1} subtitle="Pueden avanzar" color="border-l-emerald-600" />
                            <StatusCard label="Excluidos" value={0} subtitle="Fuera del cierre" color="border-l-blue-600" />
                        </div>
                    </Panel>

                    <Panel title="Casos por tipo" right="Selecciona una categoria para trabajar">
                        <div className="grid grid-cols-5 gap-2">
                            {CASE_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSelectedType(type)}
                                    className={`flex min-h-[70px] items-center justify-between rounded-md border px-3 text-left text-sm font-semibold ${selectedType === type
                                        ? "border-blue-600 bg-blue-50 text-blue-600"
                                        : "border-slate-200 bg-white text-slate-900"
                                        }`}
                                >
                                    <span>{type}</span>
                                    <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs text-white">1</span>
                                </button>
                            ))}
                        </div>
                    </Panel>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
                    <aside className="overflow-hidden rounded-md bg-white">
                        <div className="border-b border-slate-200 px-4 py-4">
                            <h3 className="text-lg font-semibold text-slate-900">{selectedType}</h3>
                            <p className="mt-1 text-sm font-semibold text-slate-500">Mostrando 1 de {pendingCount} casos pendientes</p>
                        </div>

                        {casesByType.length === 0 ? (
                            <div className="px-4 py-5 text-sm font-medium text-slate-500">No hay casos mock para esta categoria.</div>
                        ) : (
                            casesByType.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedCaseId(item.id)}
                                    className={`block w-full border-l-4 px-4 py-4 text-left ${selectedCase.id === item.id ? "border-l-blue-600 bg-blue-50" : "border-l-transparent bg-white"}`}
                                >
                                    <div className="text-sm font-semibold text-slate-900">{item.order}</div>
                                    <div className="mt-1 text-xs font-medium text-slate-600">{item.subtitle}</div>
                                    <div className="mt-2 text-sm font-semibold text-red-600">{item.amount}</div>
                                </button>
                            ))
                        )}
                    </aside>

                    <main className="rounded-md bg-white p-5">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">Caso seleccionado</div>
                                <h3 className="mt-1 text-3xl font-semibold text-slate-900">{selectedCase.title}</h3>
                                <p className="mt-1 text-sm font-semibold text-slate-600">{selectedCase.order}</p>
                                <p className="mt-2 text-sm font-semibold text-blue-600">Mostrando 1 de {pendingCount} casos pendientes</p>
                            </div>
                            <span className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white">{selectedCase.status}</span>
                        </div>

                        <div className="mb-4 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4">
                            <AmountCard label="OMS" value={selectedCase.oms} subtitle="Qty 1" />
                            <AmountCard label="Liquidacion ML" value={selectedCase.ml} subtitle="Qty 1" />
                            <AmountCard label="Diferencia" value={selectedCase.difference} subtitle={selectedCase.differenceReason} danger />
                        </div>

                        <div className="mb-5 grid grid-cols-[130px_1fr] gap-y-3 text-sm">
                            {selectedCase.details.map((detail) => (
                                <DetailLine key={detail.label} label={detail.label} value={detail.value} />
                            ))}
                        </div>

                        <SectionTitle>Historial del PackId</SectionTitle>
                        <div className="mb-5 overflow-hidden rounded-md">
                            {selectedCase.history.map((entry) => (
                                <div key={`${entry.date}-${entry.label}`} className="grid grid-cols-[120px_1fr_auto] bg-[#f0f3fb] px-3 py-3 text-sm font-semibold text-slate-700">
                                    <span>{entry.date}</span>
                                    <span>{entry.label}</span>
                                    <span>{entry.value}</span>
                                </div>
                            ))}
                        </div>

                        <SectionTitle>Evidencia financiera</SectionTitle>
                        <div className="mb-5 grid grid-cols-4 gap-3">
                            <Evidence label="Venta / factura" value={selectedCase.oms} />
                            <Evidence label="NC / refund" value={selectedCase.difference} danger />
                            <Evidence label="Ajustes ML" value="$0" />
                            <Evidence label="Neto financiero" value={selectedCase.ml} />
                        </div>

                        <div className="flex justify-end gap-2">
                            <ActionButton variant="primary" size="sm">Aprobar para SAP</ActionButton>
                            <ActionButton variant="secondary" size="sm">Corregir documento</ActionButton>
                            <ActionButton variant="secondary" size="sm">Excluir del cierre</ActionButton>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

function Panel({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
    return (
        <section className="rounded-md bg-white p-4">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                <h3 className="text-slate-900">{title}</h3>
                {right ? <span className="text-xs text-slate-500">{right}</span> : null}
            </div>
            {children}
        </section>
    );
}

function StatusCard({ label, value, subtitle, color }: { label: string; value: number; subtitle: string; color: string }) {
    return (
        <div className={`rounded bg-[#f0f3fb] border-l-4 ${color} px-4 py-3`}>
            <div className="text-xs font-semibold uppercase text-blue-600">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
            <div className="mt-1 text-xs font-semibold uppercase text-slate-500">{subtitle}</div>
        </div>
    );
}

function AmountCard({ label, value, subtitle, danger = false }: { label: string; value: string; subtitle: string; danger?: boolean }) {
    return (
        <div className="rounded bg-[#f0f3fb] border-l-4 border-l-blue-600 px-4 py-4">
            <div className="text-xs font-semibold uppercase text-blue-600">{label}</div>
            <div className={`mt-1 text-3xl font-semibold ${danger ? "text-red-500" : "text-slate-900"}`}>{value}</div>
            <div className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</div>
        </div>
    );
}

function DetailLine({ label, value }: { label: string; value: string }) {
    return (
        <>
            <span className="font-semibold text-slate-500">{label}</span>
            <span className="font-semibold text-slate-900">{value}</span>
        </>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h4 className="mb-2 text-base font-semibold uppercase text-slate-900">{children}</h4>;
}

function Evidence({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
    return (
        <div className="rounded bg-[#f0f3fb] border-l-4 border-l-blue-600 px-4 py-3">
            <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
            <div className={`mt-1 text-xl font-semibold ${danger ? "text-red-500" : "text-slate-900"}`}>{value}</div>
        </div>
    );
}
