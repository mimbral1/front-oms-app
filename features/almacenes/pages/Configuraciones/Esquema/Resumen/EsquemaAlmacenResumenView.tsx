// app/views/Almacen/Configuraciones/Esquema/Detail/EsquemaAlmacenResumenView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowDownTrayIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { exportToCsv } from "@/components/presets/export/export";
import {
    EsquemaAlmacen,
    EsquemaAlmacenFields,
    SCHEMA_LEVEL_OPTIONS,
} from "@/features/almacenes/components/configuraciones/esquema/EsquemaAlmacenFields";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

const API_BASE = BASE_WAREHOUSES;
const VALID_LEVELS = new Set<string>(SCHEMA_LEVEL_OPTIONS);

type ApiSchemaDetail = {
    id?: string | null;
    name?: string | null;
    pickingOrder?: string | null;
    levels?: string[] | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
};

const formatDate = (value?: string | null) => {
    if (!value) return "--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "--";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};

const mapPickingOrder = (value?: string | null): EsquemaAlmacen["pickingOrder"] => {
    if (value === "categories") return "categories";
    if (value === "skuPositions") return "skuPositions";
    if (value === "skuPositionsThenCategories") return "skuPositionsThenCategories";
    return "storedGoods";
};

const mapEstado = (value?: string | null): EsquemaAlmacen["estado"] => {
    return String(value || "").toLowerCase() === "active" ? "Activo" : "Inactivo";
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
};

const getResponseErrorMessage = async (response: Response, fallback: string) => {
    const text = await response.text().catch(() => "");
    if (!text.trim()) return fallback;

    try {
        const parsed = JSON.parse(text) as { message?: string; error?: string };
        return parsed.message || parsed.error || text;
    } catch {
        return text;
    }
};

const mapEstadoToApi = (estado: EsquemaAlmacen["estado"]): "active" | "inactive" =>
    estado === "Activo" ? "active" : "inactive";

const EMPTY: EsquemaAlmacen = {
    id: "",
    nombre: "",
    pickingOrder: "storedGoods",
    niveles: [],
    estado: "Activo",
    creado: { username: "--", email: "--", date: "--" },
    modificado: { username: "--", email: "--", date: "--" },
};

export default function EsquemaAlmacenResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<EsquemaAlmacen | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    useEffect(() => {
        if (!recordId) {
            setRecord(EMPTY);
            setLoading(false);
            return;
        }

        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                setErrorMessage(null);

                const response = await fetch(`${API_BASE}/schema/${encodeURIComponent(String(recordId))}`, {
                    method: "GET",
                    headers: withAuthPlatformHeaders(),
                });

                if (!response.ok) {
                    const text = await response.text().catch(() => "");
                    throw new Error(text || `HTTP ${response.status}`);
                }

                const data = (await response.json()) as ApiSchemaDetail;

                const mapped: EsquemaAlmacen = {
                    id: String(data.id || recordId || ""),
                    nombre: String(data.name || ""),
                    pickingOrder: mapPickingOrder(data.pickingOrder),
                    niveles: Array.isArray(data.levels) ? data.levels.map((l) => String(l)) : [],
                    estado: mapEstado(data.status),
                    creado: {
                        username: String(data.userCreated || "--"),
                        email: "--",
                        date: formatDate(data.dateCreated),
                    },
                    modificado: {
                        username: String(data.userModified || "--"),
                        email: "--",
                        date: formatDate(data.dateModified),
                    },
                };

                if (mounted) setRecord(mapped);
            } catch (error: unknown) {
                if (mounted) {
                    setRecord(null);
                    setErrorMessage(getErrorMessage(error, "No se pudo cargar el esquema"));
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [recordId]);

    const handleChange = (field: keyof EsquemaAlmacen, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        if (!current) return;

        const name = current.nombre.trim();
        const levels = current.niveles
            .map((level) => level.trim())
            .filter((level) => VALID_LEVELS.has(level));

        const errors: string[] = [];
        if (!name) errors.push("Falta el nombre del esquema.");
        if (!current.pickingOrder) errors.push("Falta el picking order del esquema.");
        if (levels.length === 0) errors.push("Debes seleccionar al menos un nivel valido.");

        if (errors.length) {
            setErrorMessage(errors.join(" "));
            return;
        }

        setSaving(true);
        try {
            setErrorMessage(null);

            const response = await fetch(`${API_BASE}/schema/${encodeURIComponent(String(current.id || recordId || ""))}`, {
                method: "PUT",
                headers: withAuthPlatformHeaders({
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    name,
                    pickingOrder: current.pickingOrder,
                    levels,
                    status: mapEstadoToApi(current.estado),
                }),
            });

            if (!response.ok) {
                throw new Error(await getResponseErrorMessage(response, `HTTP ${response.status}`));
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error, "No se pudo guardar el esquema"));
        } finally {
            setSaving(false);
        }
    }, [recordId]);

    const handleExport = useCallback(() => {
        if (!record) return;

        exportToCsv("esquema-almacen-resumen.csv", [
            ["Nombre", "Orden de picking", "Niveles", "Estado"],
            [
                record.nombre,
                record.pickingOrder,
                record.niveles.join(", "),
                record.estado,
            ],
        ]);
    }, [record]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: handleExport,
                disabled: saving || !record,
            },
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin text-current" /> : <SaveOutlined className="h-4 w-4 text-current" />}
                        {!saving ? (
                            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                                <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                            </div>
                        ) : null}
                    </div>
                ),
                onClick: () => router.push("/almacen/configuracion/esquema/nuevo"),
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/configuracion/esquema"),
                disabled: saving,
            },
        ],
        [router, handleExport, handleSave, record, saving]
    );

    usePageHeader(
        () =>
        ({
                title: (
                    <div>
                        <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Esquema</div>
                        <div className="text-2xl font-semibold text-gray-900">{record?.nombre || "Esquema"}</div>
                    </div>
                ),
            action: headerActions,
            status: saving
                ? { text: "Guardando...", variant: "processing" }
                : record
                    ? { text: record.estado, variant: record.estado === "Activo" ? "success" : "warning" }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, record?.estado]
    );

    if (loading) return <div className="p-6">Cargando...</div>;
    if (!record) return <div className="p-6 text-red-600">{errorMessage || "No se encontro el esquema."}</div>;

    return (
        <div className="p-6 bg-white">
            <EsquemaAlmacenFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
