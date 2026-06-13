"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowDownTrayIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
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

const initialRecord: EsquemaAlmacen = {
    nombre: "",
    pickingOrder: "storedGoods",
    niveles: [],
    estado: "Activo",
    creado: { username: "--", email: "--", date: "--" },
    modificado: { username: "--", email: "--", date: "--" },
};

const SCHEMA_URL = `${BASE_WAREHOUSES}/schema`;
const VALID_LEVELS = new Set<string>(SCHEMA_LEVEL_OPTIONS);

type SchemaCreateStatus = "active" | "inactive";

const mapStatusToApi = (estado: EsquemaAlmacen["estado"]): SchemaCreateStatus =>
    estado === "Activo" ? "active" : "inactive";

const getErrorMessage = async (response: Response, fallback: string) => {
    const text = await response.text().catch(() => "");
    if (!text.trim()) return fallback;

    try {
        const parsed = JSON.parse(text) as { message?: string; error?: string };
        return parsed.message || parsed.error || text;
    } catch {
        return text;
    }
};

export default function EsquemaAlmacenNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<EsquemaAlmacen>({ ...initialRecord });
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleChange = (field: keyof EsquemaAlmacen, value: unknown) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    const handleCreate = useCallback(
        async (resetAfterSave: boolean) => {
            const current = recordRef.current;
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
            setErrorMessage(null);

            try {
                const response = await fetch(SCHEMA_URL, {
                    method: "POST",
                    headers: withAuthPlatformHeaders({
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        name,
                        pickingOrder: current.pickingOrder,
                        levels,
                        status: mapStatusToApi(current.estado),
                    }),
                });

                if (!response.ok) {
                    throw new Error(await getErrorMessage(response, `HTTP ${response.status}`));
                }

                if (resetAfterSave) {
                    setRecord({ ...initialRecord });
                    return;
                }

                router.push("/almacen/configuracion/esquema");
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "No se pudo crear el esquema";
                console.error("Error creando esquema:", error);
                setErrorMessage(message);
            } finally {
                setSaving(false);
            }
        },
        [router]
    );

    const handleExport = useCallback(() => {
        exportToCsv("esquema-almacen-nuevo.csv", [
            ["Nombre", "Orden de picking", "Niveles", "Estado"],
            [
                record.nombre,
                record.pickingOrder,
                record.niveles.join(", "),
                record.estado,
            ],
        ]);
    }, [record]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: handleExport,
                disabled: saving,
            },
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />,
                onClick: () => {
                    void handleCreate(false);
                },
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: () => {
                    void handleCreate(false);
                },
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
                onClick: () => {
                    void handleCreate(true);
                },
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
        [router, handleCreate, handleExport, saving]
    );

    usePageHeader(
        () =>
            ({
                title: (
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Esquema</div>
                        <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                    </div>
                ),
                action: headerActions,
            } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="bg-white p-6">
            {errorMessage ? <p className="mb-4 text-sm text-red-600">{errorMessage}</p> : null}
            <EsquemaAlmacenFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
