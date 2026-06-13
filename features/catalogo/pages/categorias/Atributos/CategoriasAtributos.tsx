// features/catalogo/pages/categorias/Atributos/CategoriasAtributos.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/card/Card";
import { FaLayerGroup } from "react-icons/fa";
import {
    TextField,
    Select,
    MenuItem,
    FormControl,
    IconButton,
} from "@mui/material";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";

// ── Flag para usar datos mock ────────────────────────
const USE_MOCKS = true;

interface AttributeRow {
    id: string;
    channel: string;
    channelAttr: string;
    masterAttr: string;
    transform: string;
}

const CHANNELS = [
    { id: "ML", name: "Mercado Libre" },
    { id: "VTEX", name: "VTEX" },
    { id: "SHOPIFY", name: "Shopify" },
];

const TRANSFORM_OPTIONS = [
    { value: "none", label: "Ninguna" },
    { value: "uppercase", label: "Mayúsculas" },
    { value: "lowercase", label: "Minúsculas" },
    { value: "capitalize", label: "Capitalizar" },
];

let nextTempId = 1;

function generateMockAttributes(categoryId: string): AttributeRow[] {
    const mockMap: Record<string, AttributeRow[]> = {
        default: [
            { id: "a1", channel: "ML", channelAttr: "BRAND", masterAttr: "marca", transform: "none" },
            { id: "a2", channel: "ML", channelAttr: "MODEL", masterAttr: "modelo", transform: "none" },
            { id: "a3", channel: "ML", channelAttr: "COLOR", masterAttr: "color", transform: "capitalize" },
            { id: "a4", channel: "VTEX", channelAttr: "brand", masterAttr: "marca", transform: "lowercase" },
            { id: "a5", channel: "VTEX", channelAttr: "model", masterAttr: "modelo", transform: "lowercase" },
            { id: "a6", channel: "SHOPIFY", channelAttr: "vendor", masterAttr: "marca", transform: "none" },
        ],
    };
    return mockMap[categoryId] ?? mockMap.default;
}

export function CategoriasAtributos() {
    const params = useParams();
    const categoryId = params?.id as string | undefined;
    const { token } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [attributes, setAttributes] = useState<AttributeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterChannel, setFilterChannel] = useState<string>("");

    const loadMockData = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            setAttributes(generateMockAttributes(categoryId ?? "default"));
            setLoading(false);
        }, 300);
    }, [categoryId]);

    const fetchAttributes = useCallback(async () => {
        if (USE_MOCKS) { loadMockData(); return; }
        if (!token || !categoryId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth<{ attribute_mappings: { channel: string; channel_attr: string; master_attr: string; transform: string }[] }>(
                `catalog/getcategorymapping/${categoryId}/attributes`
            );
            setAttributes(
                (data.attribute_mappings || []).map((a, idx) => ({
                    id: `srv-${idx}`,
                    channel: a.channel,
                    channelAttr: a.channel_attr,
                    masterAttr: a.master_attr,
                    transform: a.transform || "none",
                }))
            );
        } catch (err: any) {
            console.error("Error fetching category attributes:", err);
            setError(`Error al cargar atributos: ${err?.message ?? String(err)}`);
        } finally {
            setLoading(false);
        }
    }, [token, categoryId, fetchWithAuth, loadMockData]);

    useEffect(() => {
        if (USE_MOCKS) { loadMockData(); return; }
        fetchAttributes();
    }, [fetchAttributes, loadMockData]);

    const handleAdd = () => {
        const newAttr: AttributeRow = {
            id: `temp-${nextTempId++}`,
            channel: "ML",
            channelAttr: "",
            masterAttr: "",
            transform: "none",
        };
        setAttributes((prev) => [...prev, newAttr]);
    };

    const handleRemove = (id: string) => {
        setAttributes((prev) => prev.filter((a) => a.id !== id));
    };

    const handleChange = (id: string, field: keyof AttributeRow, value: string) => {
        setAttributes((prev) =>
            prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
        );
    };

    const handleSave = async () => {
        if (USE_MOCKS) {
            console.log("[MOCK] Guardar atributos de categoría:", { categoryId, attributes });
            return;
        }
        if (!token || !categoryId) return;
        try {
            await fetchWithAuth(`catalog/getcategorymapping/${categoryId}/attributes`, {
                method: "PUT",
                body: JSON.stringify({
                    attribute_mappings: attributes.map((a) => ({
                        channel: a.channel,
                        channel_attr: a.channelAttr,
                        master_attr: a.masterAttr,
                        transform: a.transform,
                    })),
                }),
            });
        } catch (err: any) {
            console.error("Error saving attributes:", err);
            setError(`Error al guardar: ${err?.message ?? String(err)}`);
        }
    };

    const filteredAttributes = filterChannel
        ? attributes.filter((a) => a.channel === filterChannel)
        : attributes;

    // Agrupar por canal
    const groupedByChannel = filteredAttributes.reduce<Record<string, AttributeRow[]>>(
        (acc, attr) => {
            if (!acc[attr.channel]) acc[attr.channel] = [];
            acc[attr.channel].push(attr);
            return acc;
        },
        {}
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return <p className="p-4 text-center text-red-500">Error: {error}</p>;
    }

    return (
        <div className="flex-1 bg-white p-6">
            <div className="space-y-6">
                {/* Filtro por canal + botones */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">Filtrar por canal:</span>
                        <FormControl variant="standard" size="small" sx={{ minWidth: 160 }}>
                            <Select
                                value={filterChannel}
                                onChange={(e) => setFilterChannel(e.target.value)}
                                displayEmpty
                                disableUnderline
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {CHANNELS.map((ch) => (
                                    <MenuItem key={ch.id} value={ch.id}>
                                        {ch.name} ({ch.id})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAdd}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Agregar atributo
                        </button>
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                            Guardar cambios
                        </button>
                    </div>
                </div>

                {/* Tabla de mapeo de atributos agrupada por canal */}
                {Object.keys(groupedByChannel).length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                        No hay atributos mapeados para esta categoría. Agregue uno con el botón de arriba.
                    </div>
                ) : (
                    Object.entries(groupedByChannel).map(([channel, attrs]) => {
                        const channelInfo = CHANNELS.find((c) => c.id === channel);
                        return (
                            <Card
                                key={channel}
                                title={`${channelInfo?.name ?? channel} (${channel})`}
                                icon={FaLayerGroup}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl bg-white p-6 shadow-sm"
                            >
                                <div className="space-y-3">
                                    {/* Encabezado tabla */}
                                    <div className="grid grid-cols-[1fr_1fr_1fr_48px] gap-4 px-2">
                                        <span className="text-xs font-semibold uppercase text-gray-500">
                                            Atributo Canal (channel_attr)
                                        </span>
                                        <span className="text-xs font-semibold uppercase text-gray-500">
                                            Atributo Master (master_attr)
                                        </span>
                                        <span className="text-xs font-semibold uppercase text-gray-500">
                                            Transformación
                                        </span>
                                        <span></span>
                                    </div>

                                    {/* Filas */}
                                    {attrs.map((attr) => (
                                        <div
                                            key={attr.id}
                                            className="grid grid-cols-[1fr_1fr_1fr_48px] gap-4 items-center bg-gray-50 rounded-lg px-3 py-2"
                                        >
                                            <TextField
                                                value={attr.channelAttr}
                                                onChange={(e) => handleChange(attr.id, "channelAttr", e.target.value)}
                                                variant="standard"
                                                fullWidth
                                                placeholder="ej: BRAND"
                                                InputProps={{ disableUnderline: true }}
                                                size="small"
                                            />
                                            <TextField
                                                value={attr.masterAttr}
                                                onChange={(e) => handleChange(attr.id, "masterAttr", e.target.value)}
                                                variant="standard"
                                                fullWidth
                                                placeholder="ej: marca"
                                                InputProps={{ disableUnderline: true }}
                                                size="small"
                                            />
                                            <FormControl fullWidth variant="standard" size="small">
                                                <Select
                                                    value={attr.transform}
                                                    onChange={(e) => handleChange(attr.id, "transform", e.target.value)}
                                                    disableUnderline
                                                >
                                                    {TRANSFORM_OPTIONS.map((opt) => (
                                                        <MenuItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemove(attr.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </IconButton>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
