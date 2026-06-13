// views\PickingView\configuraciones\multipicking\sectores\Esquemas\EsquemasSectoresPicking.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentIcon,
    ClipboardDocumentCheckIcon,
    ListBulletIcon,
} from "@heroicons/react/24/outline";
import { useApiSectoresPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/sectores-picking/api-sectores-picking";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";

/* ──────────────────────────────
   Tipos
────────────────────────────── */
interface PickingSchema {
    id: string;
    name: string;
}

/* ──────────────────────────────
   Mini componente para copiar ID
────────────────────────────── */
function CopyId({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* noop */ }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={copied ? "¡Copiado!" : `Copiar: ${value}`}
            className="group inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-1 font-mono text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
        >
            <span>{value}</span>
            {copied ? (
                <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-500" />
            ) : (
                <ClipboardDocumentIcon className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            )}
        </button>
    );
}

/* ──────────────────────────────
   Vista
────────────────────────────── */
export default function EsquemasSectoresPicking() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const zoneId = Array.isArray(params?.id) ? params!.id[0] : params?.id;

    const { getZonePickingSchemas, getZoneById } = useApiSectoresPicking();

    const [data, setData] = useState<PickingSchema[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [zoneName, setZoneName] = useState<string>("");

    /* ──────────────────────────────
       Load
    ────────────────────────────── */
    const load = async () => {
        if (!zoneId) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            const [schemasRes, zoneRes] = await Promise.all([
                getZonePickingSchemas(zoneId),
                getZoneById(zoneId),
            ]);

            setData(schemasRes?.pickingSchemas ?? []);
            setZoneName(zoneRes?.data?.name ?? zoneRes?.name ?? "");
        } catch (e: any) {
            console.error("Error cargando esquemas de picking:", e);
            setErrorMessage(
                e?.message || "No se pudieron cargar los esquemas de picking."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [zoneId]);

    /* ──────────────────────────────
       PageHeader (idéntico a Logs)
    ────────────────────────────── */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () =>
                    router.push("/picking/configuraciones/multipicking/sectores"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Sectores de Picking
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {zoneName}
                    </div>
                </div>
            ),
            action: headerActions,
            status: undefined,
        } as PageHeaderProps),
        [headerActions, zoneName]
    );

    /* ──────────────────────────────
       Estados
    ────────────────────────────── */
    if (loading) {
        return (
            <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="px-4 py-6 text-center text-gray-500">
                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                Cargando esquemas…
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium">
                            Error al cargar esquemas de picking
                        </h3>
                        <p className="mt-2 text-sm">{errorMessage}</p>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setErrorMessage(null);
                                    load();
                                }}
                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Tabla */}
            {data.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow-sm">
                    <ListBulletIcon className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm font-medium text-gray-500">
                        No hay esquemas de picking asociados a este sector.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Nombre
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((schema, idx) => (
                                <tr
                                    key={schema.id}
                                    className={`transition ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                        } hover:bg-blue-50/60`}
                                >
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-gray-800">
                                            {schema.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <CopyId value={schema.id} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
