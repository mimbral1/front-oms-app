// features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-atributos/MeliMapeoAtributosDetail.tsx
"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import { XCircle, Save, ClipboardList } from "lucide-react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import Card from "@/components/ui/card/Card";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import {
    TextField,
    Select,
    MenuItem,
    FormControl,
    Switch,
    FormControlLabel,
} from "@mui/material";
import {
    createMarketplaceAttributeMapping,
    fetchAllMarketplaceAttributeMappings,
    resolveAttributeMarketplace,
    updateMarketplaceAttributeMapping,
    type AttributeMappingNormalizedRow,
} from "../../../../services/marketplaceAttributeMappings";

const VALUE_TYPE_OPTIONS = [
    { label: "Texto", value: "string" },
    { label: "Numero", value: "number" },
    { label: "Lista", value: "list" },
    { label: "Booleano", value: "boolean" },
];

interface AttributeFormData {
    storeAttributeId: string;
    storeAttributeName: string;
    storeAttributeType: string;
    meliAttributeId: string;
    meliAttributeName: string;
    meliValueType: string;
    meliRequired: boolean;
}

const defaultForm: AttributeFormData = {
    storeAttributeId: "",
    storeAttributeName: "",
    storeAttributeType: "string",
    meliAttributeId: "",
    meliAttributeName: "",
    meliValueType: "string",
    meliRequired: false,
};

function buildMeliPayloadPreview(form: AttributeFormData) {
    const storeAttr = form.storeAttributeId || "—";
    const meliId = form.meliAttributeId || "—";
    const meliName = form.meliAttributeName || "—";

    return {
        _comment: `PIM "${storeAttr}" ? MeLi "${meliId}"`,
        attributes: [
            {
                id: meliId,
                name: meliName,
                value_name: `<valor de ${storeAttr}>`,
            },
        ],
    };
}

function findRowByAttributeId(rows: AttributeMappingNormalizedRow[], attributeId: string): AttributeMappingNormalizedRow | null {
    const normalized = String(attributeId || "").trim();
    if (!normalized) return null;

    const byAttrId = rows.find((row) => String(row.storeAttributeId) === normalized);
    if (byAttrId) return byAttrId;

    const asNumber = Number(normalized);
    if (!Number.isNaN(asNumber)) {
        const byApiId = rows.find((row) => row.apiId !== undefined && Number(row.apiId) === asNumber);
        if (byApiId) return byApiId;
    }

    return null;
}

export function MeliMapeoAtributosDetail() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string | undefined;
    const platform = useEcommercePlatform();
    const marketplace = useMemo(
        () => resolveAttributeMarketplace(platform.name),
        [platform.name]
    );
    const baseRoute = `${platform.basePath}/mapeo-atributos`;

    const { token, user } = useAuth();

    const [formData, setFormData] = useState<AttributeFormData>(defaultForm);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mappingId, setMappingId] = useState<string | number | undefined>(undefined);
    const [n3Id, setN3Id] = useState<string | number | undefined>(undefined);

    useEffect(() => {
        if (!id) return;

        if (!token) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                let rows: AttributeMappingNormalizedRow[] = [];
                try {
                    rows = await fetchAllMarketplaceAttributeMappings({
                        marketplace,
                        token,
                        query: { buscar: id, compacto: true },
                        maxPages: 5,
                    });
                } catch {
                    rows = [];
                }
                if (rows.length === 0) {
                    rows = await fetchAllMarketplaceAttributeMappings({
                        marketplace,
                        token,
                        query: { compacto: true },
                        maxPages: 25,
                    });
                }
                const data = findRowByAttributeId(rows, id);

                if (!data) {
                    throw new Error("No se encontro mapeo para este atributo.");
                }

                if (cancelled) return;

                setMappingId(data.apiId);
                setN3Id(data.n3Id || data.storeCategoryId || undefined);
                setFormData({
                    storeAttributeId: data.storeAttributeId,
                    storeAttributeName: data.storeAttributeName || data.storeAttributeId,
                    storeAttributeType: data.storeAttributeType || "string",
                    meliAttributeId: data.marketplaceAttributeId || "",
                    meliAttributeName: data.marketplaceAttributeName || "",
                    meliValueType: data.storeAttributeType || "string",
                    meliRequired: data.marketplaceRequired || false,
                });
            } catch (err: any) {
                if (!cancelled) {
                    setError(`Error al cargar: ${err?.message ?? String(err)}`);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, marketplace, token]);

    const handleFieldChange = <K extends keyof AttributeFormData>(
        field: K,
        value: AttributeFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = useCallback(async () => {
        if (!token) return;
        try {
            if (!formData.meliAttributeId || !formData.meliAttributeName) {
                throw new Error("Debe indicar ID y nombre del atributo marketplace.");
            }

            if (mappingId !== undefined && mappingId !== null) {
                await updateMarketplaceAttributeMapping({
                    marketplace,
                    token,
                    userId: user?.id,
                    mappingId,
                    marketplaceAttributeId: formData.meliAttributeId,
                    marketplaceAttributeName: formData.meliAttributeName,
                    validado: true,
                });
            } else {
                const resolvedN3Id = n3Id;
                if (resolvedN3Id === undefined || resolvedN3Id === null || resolvedN3Id === "") {
                    throw new Error("No se pudo resolver n3_id para crear el mapeo.");
                }

                const createdId = await createMarketplaceAttributeMapping({
                    marketplace,
                    token,
                    userId: user?.id,
                    n3Id: resolvedN3Id,
                    storeAttributeId: formData.storeAttributeId || String(id || ""),
                    marketplaceAttributeId: formData.meliAttributeId,
                    marketplaceAttributeName: formData.meliAttributeName,
                    validado: true,
                });
                setMappingId(createdId);
            }

            router.push(baseRoute);
        } catch (err: any) {
            setError(`Error al guardar: ${err?.message ?? String(err)}`);
        }
    }, [baseRoute, formData, id, mappingId, marketplace, n3Id, router, token, user?.id]);

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
                onClick: () => router.push(baseRoute),
                icon: <XCircle className="h-5 w-5" />,
            },
        ],
        [baseRoute, handleSave, router]
    );

    usePageHeader(
        () => ({
            title: formData.storeAttributeName
                ? `${formData.storeAttributeName} ? ${formData.meliAttributeId || "Sin mapear"}`
                : "Detalle de mapeo de atributo",
            action: headerActions,
        }),
        [formData.storeAttributeName, formData.meliAttributeId, headerActions]
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
                <Card
                    title="DETALLE - ATRIBUTO MERCADO LIBRE"
                    icon={ClipboardList}
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl bg-white p-6 shadow-sm"
                >
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-8">
                            <div className="flex flex-col pb-2">
                                <FieldRows label="Atributo de la tienda" className="border-b border-gray-300">
                                    <span className="text-sm font-medium text-gray-900">
                                        {formData.storeAttributeName}
                                    </span>
                                </FieldRows>
                            </div>

                            <div className="flex flex-col pb-2">
                                <FieldRows label="Tipo (tienda)" className="border-b border-gray-300">
                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                        {formData.storeAttributeType}
                                    </span>
                                </FieldRows>
                            </div>

                            <div className="flex flex-col pb-2">
                                <FieldRows label="ID Atributo MeLi" className="border-b border-gray-300">
                                    <TextField
                                        value={formData.meliAttributeId}
                                        onChange={(e) => handleFieldChange("meliAttributeId", e.target.value)}
                                        variant="standard"
                                        fullWidth
                                        placeholder="ej: BRAND"
                                        InputProps={{ disableUnderline: true }}
                                        size="small"
                                    />
                                </FieldRows>
                            </div>

                            <div className="flex flex-col pb-2">
                                <FieldRows label="Nombre Atributo MeLi" className="border-b border-gray-300">
                                    <TextField
                                        value={formData.meliAttributeName}
                                        onChange={(e) => handleFieldChange("meliAttributeName", e.target.value)}
                                        variant="standard"
                                        fullWidth
                                        placeholder="ej: Marca"
                                        InputProps={{ disableUnderline: true }}
                                        size="small"
                                    />
                                </FieldRows>
                            </div>

                            <div className="flex flex-col pb-2">
                                <FieldRows label="Tipo de valor MeLi" className="border-b border-gray-300">
                                    <FormControl fullWidth variant="standard" size="small">
                                        <Select
                                            value={formData.meliValueType}
                                            onChange={(e) => handleFieldChange("meliValueType", e.target.value as string)}
                                            disableUnderline
                                        >
                                            {VALUE_TYPE_OPTIONS.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </FieldRows>
                            </div>

                            <div className="flex flex-col pb-2">
                                <FieldRows label="Requerido en MeLi" className="border-b border-gray-300">
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.meliRequired}
                                                onChange={(e) => handleFieldChange("meliRequired", e.target.checked as any)}
                                                size="small"
                                            />
                                        }
                                        label={formData.meliRequired ? "Si" : "No"}
                                    />
                                </FieldRows>
                            </div>
                        </div>

                        {/* Vista previa */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Vista previa - Payload Mercado Libre
                            </h4>
                            <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-auto max-h-80 border border-gray-200">
                                {JSON.stringify(buildMeliPayloadPreview(formData), null, 2)}
                            </pre>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
