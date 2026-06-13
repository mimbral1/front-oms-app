// features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-categorias/MeliMapeoCategoriasDetail.tsx
"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import { XCircle, Save, ClipboardList, Layers } from "lucide-react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useAuth } from "@/app/context/auth/AuthContext";
import Card from "@/components/ui/card/Card";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import { TextField, Chip } from "@mui/material";
import { URL_MIMBRAL_MAPEOS } from "@/lib/http/endpoints";
import type {
    TipoMapping,
    CategoriaNode,
    CategoriasAPIResponse,
    MapeoVistaEntry,
    MapeoVistaAPIResponse,
} from "./types";

const CATEGORIAS_API = `${URL_MIMBRAL_MAPEOS}/api/categorias`;
const MAPEOS_VISTA_API = `${URL_MIMBRAL_MAPEOS}/api/mapeos/vista`;

// -- form data -----------------------------------------------------------------

interface MappingFormData {
    storeCategoryId: string;
    storeCategoryName: string;
    mapeado: boolean;
    categoria: { id: string; nombre: string };
    tipos: Record<string, TipoMapping>;
}

const defaultMapping: MappingFormData = {
    storeCategoryId: "",
    storeCategoryName: "",
    mapeado: false,
    categoria: { id: "", nombre: "" },
    tipos: {},
};

// -- confidence bar ------------------------------------------------------------

function ConfidenceBar({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color =
        pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500";
    const bg =
        pct >= 90 ? "bg-green-100" : pct >= 70 ? "bg-yellow-100" : "bg-red-100";
    return (
        <div className="flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full ${bg}`}>
                <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-medium text-gray-600 w-9 text-right tabular-nums">
                {pct}%
            </span>
        </div>
    );
}

// -- component -----------------------------------------------------------------

export function MeliMapeoCategoriasDetail() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string | undefined;
    const platform = useEcommercePlatform();
    const { user } = useAuth();
    const BASE_ROUTE = `${platform.basePath}/mapeo-categorias`;

    const [formData, setFormData] = useState<MappingFormData>(defaultMapping);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // -- load ------------------------------------------------------------------
    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch category info and mapeos in parallel
                const [catRes, mapRes] = await Promise.all([
                    fetch(CATEGORIAS_API),
                    fetch(`${MAPEOS_VISTA_API}?marketplace=mercadolibre`),
                ]);

                if (!catRes.ok) throw new Error(`Error cargando categorías: HTTP ${catRes.status}`);
                if (!mapRes.ok) throw new Error(`Error cargando mapeos: HTTP ${mapRes.status}`);

                const catJson: CategoriasAPIResponse = await catRes.json();
                const mapJson: MapeoVistaAPIResponse = await mapRes.json();

                if (cancelled) return;

                // Walk the recursive tree to find the category by ID
                const findNode = (nodes: CategoriaNode[], targetId: string): CategoriaNode | null => {
                    for (const n of nodes) {
                        if (String(n.id) === targetId) return n;
                        if (n.subcategorias) {
                            const found = findNode(n.subcategorias, targetId);
                            if (found) return found;
                        }
                    }
                    return null;
                }
                const storeCat = findNode(catJson.categorias || [], String(id));

                // Get mapping for this category from { success, data } wrapper
                const mapEntry: MapeoVistaEntry | undefined = mapJson.data?.[String(id)];
                const meli = mapEntry?.mercadolibre;

                // Build tipos: merge store tipos with MeLi mapping
                const tipos: Record<string, TipoMapping> = {};
                if (storeCat?.tipos) {
                    for (const t of storeCat.tipos) {
                        const meliTipo = meli?.tipos?.[t.nombre];
                        tipos[t.nombre] = meliTipo || {
                            id: "",
                            nombre: "",
                            confianza: 0,
                            validado: false,
                        };
                    }
                }

                setFormData({
                    storeCategoryId: String(id),
                    storeCategoryName: storeCat?.nombre || `Categoría ${id}`,
                    mapeado: meli?.mapeado ?? false,
                    categoria: meli?.categoria || { id: "", nombre: "" },
                    tipos,
                });
            } catch (err: any) {
                if (!cancelled)
                    setError(`Error al cargar: ${err?.message ?? String(err)}`);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    // -- handlers --------------------------------------------------------------

    const handleCategoriaChange = (field: "id" | "nombre", value: string) => {
        setFormData((prev) => ({
            ...prev,
            categoria: { ...prev.categoria, [field]: value },
        }));
    };

    const handleTipoChange = (
        tipoName: string,
        field: keyof TipoMapping,
        value: string | number | boolean
    ) => {
        setFormData((prev) => ({
            ...prev,
            tipos: {
                ...prev.tipos,
                [tipoName]: { ...prev.tipos[tipoName], [field]: value },
            },
        }));
    };

    const handleToggleValidado = (tipoName: string) => {
        setFormData((prev) => ({
            ...prev,
            tipos: {
                ...prev.tipos,
                [tipoName]: {
                    ...prev.tipos[tipoName],
                    validado: !prev.tipos[tipoName].validado,
                },
            },
        }));
    };

    // -- save ------------------------------------------------------------------

    const handleSave = useCallback(async () => {
        try {
            const body = {
                marketplace: "mercadolibre",
                category_id: Number(id),
                mercadolibre: {
                    mapeado: formData.mapeado,
                    categoria: formData.categoria,
                    tipos: formData.tipos,
                },
                // Auditoría — patrón estándar del proyecto.
                userId: Number(user?.id) || null,
                userName: user?.nombre ?? null,
                userEmail: user?.email ?? null,
            };
            const res = await fetch(`${URL_MIMBRAL_MAPEOS}/api/mapeos`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            router.push(BASE_ROUTE);
        } catch (err: any) {
            setError(`Error al guardar: ${err?.message ?? String(err)}`);
        }
    }, [formData, id, router, user?.id, user?.nombre, user?.email, BASE_ROUTE]);

    // -- page header -----------------------------------------------------------

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                onClick: handleSave,
                icon: <Save className="h-4 w-4" />,
            },
            {
                label: "Cancelar",
                variant: "secondary",
                onClick: () => router.push(BASE_ROUTE),
                icon: <XCircle className="h-5 w-5" />,
            },
        ],
        [handleSave, router]
    );

    usePageHeader(
        () => ({
            title: formData.storeCategoryName
                ? `${formData.storeCategoryName} ? ${formData.categoria.id || "Sin mapear"}`
                : "Detalle de mapeo",
            action: headerActions,
        }),
        [formData.storeCategoryName, formData.categoria.id, headerActions]
    );

    // -- loading / error -------------------------------------------------------

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
            </div>
        );
    }

    if (error) {
        return <p className="p-4 text-center text-red-500">Error: {error}</p>;
    }

    // -- derived stats ---------------------------------------------------------

    const tiposList = Object.entries(formData.tipos);
    const tiposValidados = tiposList.filter(([, t]) => t.validado).length;
    const avgConfianza =
        tiposList.length > 0
            ? tiposList.reduce((sum, [, t]) => sum + t.confianza, 0) /
            tiposList.length
            : 0;

    // -- render ----------------------------------------------------------------

    return (
        <div className="flex-1 bg-white p-6">
            <div className="space-y-6">
                {/* -- CARD: Detalle de la categoría ------------------------ */}
                <Card
                    title="DETALLE - MAPEO DE CATEGORÍA"
                    icon={ClipboardList}
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl bg-white p-6 shadow-sm"
                >
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* left – fields */}
                        <div className="space-y-6">
                            <FieldRows
                                label="Categoría de la tienda"
                                className="border-b border-gray-300"
                            >
                                <span className="text-sm font-medium text-gray-900">
                                    {formData.storeCategoryName}
                                    <span className="ml-2 text-xs text-gray-400">
                                        ID: {formData.storeCategoryId}
                                    </span>
                                </span>
                            </FieldRows>

                            <FieldRows
                                label="ID Categoría MeLi"
                                className="border-b border-gray-300"
                            >
                                <TextField
                                    value={formData.categoria.id}
                                    onChange={(e) =>
                                        handleCategoriaChange("id", e.target.value)
                                    }
                                    variant="standard"
                                    fullWidth
                                    placeholder="ej: MLC31454"
                                    InputProps={{ disableUnderline: true }}
                                    size="small"
                                />
                            </FieldRows>

                            <FieldRows
                                label="Ruta Categoría MeLi"
                                className="border-b border-gray-300"
                            >
                                <TextField
                                    value={formData.categoria.nombre}
                                    onChange={(e) =>
                                        handleCategoriaChange("nombre", e.target.value)
                                    }
                                    variant="standard"
                                    fullWidth
                                    placeholder="ej: Herramientas > Taladros > De Mano"
                                    InputProps={{ disableUnderline: true }}
                                    size="small"
                                />
                            </FieldRows>

                            <FieldRows
                                label="Estado"
                                className="border-b border-gray-300"
                            >
                                <Chip
                                    label={formData.mapeado ? "Mapeado" : "Sin mapear"}
                                    size="small"
                                    color={formData.mapeado ? "success" : "default"}
                                />
                            </FieldRows>
                        </div>

                        {/* right – stats */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Resumen
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                                    <div className="text-2xl font-bold text-indigo-700">
                                        {tiposList.length}
                                    </div>
                                    <div className="text-xs text-indigo-600">
                                        Tipos de producto
                                    </div>
                                </div>

                                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                                    <div className="text-2xl font-bold text-green-700">
                                        {tiposValidados}/{tiposList.length}
                                    </div>
                                    <div className="text-xs text-green-600">
                                        Tipos validados
                                    </div>
                                </div>

                                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 col-span-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-blue-700">
                                            {(avgConfianza * 100).toFixed(1)}%
                                        </span>
                                        <span className="text-xs text-blue-600">
                                            Confianza promedio
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 rounded-full bg-blue-100">
                                        <div
                                            className="h-full rounded-full bg-blue-500 transition-all"
                                            style={{
                                                width: `${Math.round(avgConfianza * 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* payload preview */}
                            <pre className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-xs text-gray-700 overflow-auto max-h-48">
                                {JSON.stringify(
                                    {
                                        category_id: formData.categoria.id || "—",
                                        category_name: formData.categoria.nombre || "—",
                                        tipos_count: tiposList.length,
                                    },
                                    null,
                                    2
                                )}
                            </pre>
                        </div>
                    </div>
                </Card>

                {/* -- CARD: Tipos de producto ------------------------------ */}
                <Card
                    title={`MAPEO DE TIPOS DE PRODUCTO — ${platform.name.toUpperCase()}`}
                    icon={Layers}
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl bg-white p-6 shadow-sm"
                >
                    <div className="space-y-3">
                        {/* table header */}
                        <div className="grid grid-cols-[1.2fr_110px_1fr_120px_80px] gap-4 px-3">
                            <span className="text-xs font-semibold uppercase text-gray-500">
                                Tipo (tienda)
                            </span>
                            <span className="text-xs font-semibold uppercase text-gray-500">
                                ID MeLi
                            </span>
                            <span className="text-xs font-semibold uppercase text-gray-500">
                                Categoría MeLi
                            </span>
                            <span className="text-xs font-semibold uppercase text-gray-500">
                                Confianza
                            </span>
                            <span className="text-xs font-semibold uppercase text-gray-500 text-center">
                                Validado
                            </span>
                        </div>

                        {tiposList.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                No hay tipos de producto para esta categoría.
                            </div>
                        ) : (
                            tiposList.map(([tipoName, tipo]) => (
                                <div
                                    key={tipoName}
                                    className={`grid grid-cols-[1.2fr_110px_1fr_120px_80px] gap-4 items-center rounded-lg px-3 py-2.5 border transition-colors ${tipo.validado
                                        ? "bg-green-50/60 border-green-200"
                                        : "bg-gray-50 border-gray-200"
                                        }`}
                                >
                                    {/* Tipo name (read-only) */}
                                    <span
                                        className="text-sm font-medium text-gray-900 truncate"
                                        title={tipoName}
                                    >
                                        {tipoName}
                                    </span>

                                    {/* MeLi ID */}
                                    <TextField
                                        value={tipo.id}
                                        onChange={(e) =>
                                            handleTipoChange(tipoName, "id", e.target.value)
                                        }
                                        variant="standard"
                                        fullWidth
                                        placeholder="MLC…"
                                        InputProps={{
                                            disableUnderline: true,
                                            className: "text-sm",
                                        }}
                                        size="small"
                                    />

                                    {/* MeLi category name */}
                                    <TextField
                                        value={tipo.nombre}
                                        onChange={(e) =>
                                            handleTipoChange(
                                                tipoName,
                                                "nombre",
                                                e.target.value
                                            )
                                        }
                                        variant="standard"
                                        fullWidth
                                        placeholder="Nombre categoría"
                                        InputProps={{
                                            disableUnderline: true,
                                            className: "text-sm",
                                        }}
                                        size="small"
                                    />

                                    {/* Confidence bar */}
                                    <ConfidenceBar value={tipo.confianza} />

                                    {/* Validated toggle */}
                                    <div className="flex justify-center">
                                        <Chip
                                            label={tipo.validado ? "Sí" : "No"}
                                            size="small"
                                            color={tipo.validado ? "success" : "default"}
                                            onClick={() => handleToggleValidado(tipoName)}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
