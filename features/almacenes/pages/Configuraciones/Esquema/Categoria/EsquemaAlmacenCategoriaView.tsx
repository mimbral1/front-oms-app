"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowDownTrayIcon, ArrowPathIcon, Bars3Icon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { exportToCsv } from "@/components/presets/export/export";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { FaPlus } from "react-icons/fa";

type CategoryRow = {
    id: string;
    name: string;
    refId: string;
    tree: string;
};

type ApiSchema = {
    id?: string | null;
    name?: string | null;
    status?: string | null;
};

type ApiSchemaCategory = {
    id?: string | null;
    name?: string | null;
    referenceId?: string | null;
    nameTree?: string | null;
};

const SCHEMA_URL = `${BASE_WAREHOUSES}/schema`;
const SCHEMA_CATEGORY_URL = `${BASE_WAREHOUSES}/schema-category`;
const SCHEMA_CATEGORY_BATCH_URL = `${BASE_WAREHOUSES}/schema-category-batch`;

export default function EsquemaAlmacenCategoriaView() {
    const router = useRouter();
    const { id } = useParams();

    const schemaId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

    const [schemaName, setSchemaName] = useState("Orden categoria");
    const [schemaStatus, setSchemaStatus] = useState<"Activo" | "Inactivo">("Activo");
    const [rows, setRows] = useState<CategoryRow[]>([]);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!schemaId) {
            setRows([]);
            setErrorMessage("No se encontro el identificador del esquema.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const [schemaResponse, categoriesResponse] = await Promise.all([
                fetch(`${SCHEMA_URL}/${encodeURIComponent(schemaId)}`, {
                    method: "GET",
                    headers: withAuthPlatformHeaders(),
                    cache: "no-store",
                }),
                fetch(`${SCHEMA_CATEGORY_URL}?filters[id]=${encodeURIComponent(schemaId)}`, {
                    method: "GET",
                    headers: withAuthPlatformHeaders(),
                    cache: "no-store",
                }),
            ]);

            if (!schemaResponse.ok) {
                const text = await schemaResponse.text().catch(() => "");
                throw new Error(text || `HTTP ${schemaResponse.status}`);
            }

            if (!categoriesResponse.ok) {
                const text = await categoriesResponse.text().catch(() => "");
                throw new Error(text || `HTTP ${categoriesResponse.status}`);
            }

            const schema = (await schemaResponse.json()) as ApiSchema;
            const categories = (await categoriesResponse.json()) as ApiSchemaCategory[];

            setSchemaName(String(schema.name || "Orden categoria"));
            setSchemaStatus(String(schema.status || "").toLowerCase() === "active" ? "Activo" : "Inactivo");
            setRows(
                (Array.isArray(categories) ? categories : []).map((category) => ({
                    id: String(category.id || category.referenceId || ""),
                    name: String(category.name || "-"),
                    refId: String(category.referenceId || "-"),
                    tree: String(category.nameTree || category.name || "-"),
                }))
            );
        } catch (error) {
            console.error("Error cargando categorias del esquema:", error);
            setRows([]);
            setErrorMessage("No se pudieron cargar las categorias del esquema.");
        } finally {
            setLoading(false);
        }
    }, [schemaId]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const handleDrop = (targetIndex: number) => {
        setRows((prev) => {
            if (dragIndex === null || dragIndex === targetIndex) return prev;
            const next = [...prev];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
        setDragIndex(null);
        setOverIndex(null);
    };

    const handleExport = useCallback(() => {
        exportToCsv(
            "orden-categorias.csv",
            rows.map((row) => ({
                Nombre: row.name,
                "Ref ID": row.refId,
                Arbol: row.tree,
            }))
        );
    }, [rows]);

    const handleSave = useCallback(async () => {
        if (!schemaName.trim()) {
            setErrorMessage("No se encontro el nombre del esquema para guardar.");
            return;
        }

        if (!rows.length) {
            setErrorMessage("No hay categorias para guardar.");
            return;
        }

        setSaving(true);
        setErrorMessage(null);

        try {
            const payload = rows.map((row) => ({
                schemaName: schemaName.trim(),
                categoryReferenceId: row.refId,
            }));

            const response = await fetch(SCHEMA_CATEGORY_BATCH_URL, {
                method: "POST",
                headers: withAuthPlatformHeaders({
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || `HTTP ${response.status}`);
            }

            await fetchData();
        } catch (error) {
            console.error("Error guardando categorias del esquema:", error);
            setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar el orden de categorias.");
        } finally {
            setSaving(false);
        }
    }, [fetchData, rows, schemaName]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: handleExport,
                disabled: loading || rows.length === 0,
            },
            {
                label: saving ? "Aplicando..." : "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => {
                    void handleSave();
                },
                disabled: loading || saving || rows.length === 0,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: () => {
                    void handleSave();
                },
                disabled: loading || saving || rows.length === 0,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
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
        [handleExport, handleSave, loading, router, rows.length, saving]
    );

    usePageHeader(
        () =>
            ({
                title: (
                    <div>
                        <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Esquema</div>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-semibold text-gray-900">{schemaName}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${schemaStatus === "Activo" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {schemaStatus}
                            </span>
                        </div>
                    </div>
                ),
                action: headerActions,
            } as unknown as PageHeaderProps),
        [headerActions, schemaName, schemaStatus]
    );

    return (
        <div className="px-1 pb-6">
            {errorMessage ? (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="overflow-hidden">
                <div className="grid grid-cols-[46px_300px_120px_1fr] gap-x-20 px-3 py-2 text-sm font-semibold text-[#7a8090]">
                    <span />
                    <span>Nombre</span>
                    <span>Ref ID</span>
                    <span>Arbol</span>
                </div>

                {loading ? (
                    <div className="rounded-md border border-[#e1e5ef] bg-white px-4 py-6 text-center text-gray-500">
                        <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                        Cargando...
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-md border border-[#e1e5ef] bg-white px-4 py-6 text-center text-gray-500">
                        No hay categorias asociadas a este esquema.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {rows.map((row, index) => (
                            <div
                                key={`${row.refId}-${index}`}
                                draggable={!saving}
                                onDragStart={() => setDragIndex(index)}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setOverIndex(index);
                                }}
                                onDragLeave={() => setOverIndex((prev) => (prev === index ? null : prev))}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleDrop(index);
                                }}
                                onDragEnd={() => {
                                    setDragIndex(null);
                                    setOverIndex(null);
                                }}
                                className={`grid grid-cols-[46px_300px_120px_1fr] items-center gap-x-20 border border-[#e1e5ef] px-3 py-3 text-sm transition-colors ${dragIndex === index ? "cursor-grabbing opacity-70" : "cursor-grab"} ${overIndex === index ? "bg-[#eaf2ff]" : "bg-white"}`}
                            >
                                <div className="flex items-center justify-center text-[#6b7280]">
                                    <Bars3Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 font-medium text-[#4a4f5c]">{row.name}</div>
                                <div className="font-semibold text-[#555b69]">{row.refId}</div>
                                <div className="min-w-0 truncate text-[#565d6b]" title={row.tree}>{row.tree}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
