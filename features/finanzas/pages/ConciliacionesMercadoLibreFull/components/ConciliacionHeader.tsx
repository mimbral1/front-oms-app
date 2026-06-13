"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import {
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    PaperAirplaneIcon,
    PaperClipIcon,
    ListBulletIcon,
    XCircleIcon,
    XMarkIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

export type ConciliacionHeaderStatus = "processing" | "blocked" | "readySap" | "sentSap" | "errorSap";
export type ConciliacionTabId = "resumen" | "casos" | "documentos" | "historial";

const STATUS_META: Record<ConciliacionHeaderStatus, { label: string; pill: string }> = {
    processing: { label: "Procesando", pill: "bg-blue-600 text-white" },
    blocked: { label: "Bloqueada", pill: "bg-red-600 text-white" },
    readySap: { label: "Lista para SAP", pill: "bg-emerald-600 text-white" },
    sentSap: { label: "Enviada SAP", pill: "bg-blue-600 text-white" },
    errorSap: { label: "Error SAP", pill: "bg-red-600 text-white" },
};

const TABS: Array<{ id: ConciliacionTabId; label: string; icon: React.ReactNode }> = [
    { id: "resumen", label: "Resumen", icon: <ClipboardDocumentListIcon className="h-4 w-4" /> },
    { id: "casos", label: "Casos pendientes", icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
    { id: "documentos", label: "Documentos SAP", icon: <PaperClipIcon className="h-4 w-4" /> },
    { id: "historial", label: "Historial", icon: <ListBulletIcon className="h-4 w-4" /> },
];

export function ConciliacionHeader({
    displayId,
    dateRange,
    status,
    activeTab,
    recordId,
}: {
    displayId: string;
    dateRange: string;
    status: ConciliacionHeaderStatus;
    activeTab: ConciliacionTabId;
    recordId: string;
}) {
    const router = useRouter();
    const statusMeta = STATUS_META[status];

    const goToTab = (tabId: ConciliacionTabId) => {
        if (tabId === "resumen") {
            router.push(`/finanzas/conciliaciones-mercadolibre-full/${encodeURIComponent(recordId)}`);
            return;
        }

        router.push(`/finanzas/conciliaciones-mercadolibre-full/${encodeURIComponent(recordId)}/${tabId}`);
    };

    return (
        <div className="border-b border-slate-200 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Liquidacion ML Full</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold leading-none text-slate-900">{displayId}</h1>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.pill}`}>
                            {statusMeta.label}
                        </span>
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-slate-600">{dateRange}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <ActionButton variant="gray" size="sm" disabled>
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Comparando liquidacion
                    </ActionButton>
                    <ActionButton variant="secondary" size="sm">
                        <DocumentTextIcon className="h-4 w-4" />
                        Ver auditoria
                    </ActionButton>
                    <ActionButton variant="secondary" size="sm">
                        <XMarkIcon className="h-4 w-4" />
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push("/finanzas/conciliaciones-mercadolibre-full")}
                    >
                        <XCircleIcon className="h-4 w-4" />
                        Volver al listado
                    </ActionButton>
                </div>
            </div>

            <div className="flex items-center gap-5 px-6">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => goToTab(tab.id)}
                        className={`inline-flex items-center gap-1.5 border-b-2 px-1 py-3 text-xs font-semibold uppercase tracking-wide ${activeTab === tab.id ? "border-blue-600 text-slate-900" : "border-transparent text-slate-500"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}