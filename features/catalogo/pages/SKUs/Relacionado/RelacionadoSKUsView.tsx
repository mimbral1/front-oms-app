// views\CatalogoView\SKUs\Resumen\SKUsRelacionadoView.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

import {
    XCircleIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    LinkIcon,
    PlusCircleIcon,
} from "@heroicons/react/24/outline";

// Opciones mock de SKUs 
type SkuOption = {
    value: string;
    label: string;
};

const ALL_SKU_OPTIONS: SkuOption[] = [
    { value: "seven-up", label: "seven-up" },
    { value: "amargo-patagon", label: "Amargo Patagónico" },
    { value: "amargo-blanco", label: "Amargo Blanco" },
    { value: "coca-sabor-original", label: "coca sabor original" },
    { value: "pitusas-de-mani", label: "pitusas-de-mani" },
];

type RelatedRowProps = {
    label: string;
    values: string[];
    onChange: (next: string[]) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    options: SkuOption[];
};

const RelatedRow: React.FC<RelatedRowProps> = ({
    label,
    values,
    onChange,
    searchQuery,
    setSearchQuery,
    options,
}) => {
    const visibleOptions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [options, searchQuery]);

    const handleAdd = (value: string) => {
        if (!value) return;
        if (values.includes(value)) return;
        onChange([...values, value]);
    };

    const handleRemove = (value: string) => {
        onChange(values.filter((v) => v !== value));
    };

    const labelFromValue = (value: string) =>
        options.find((o) => o.value === value)?.label ?? value;

    return (
        <div className="grid grid-cols-6 items-start gap-4 border-b last:border-b-0 py-4">
            <div className="col-span-1 text-sm text-gray-600 font-bold">{label}</div>

            <div className="col-span-5 space-y-2">
                <SelectSearchInline
                    id={`rel-${label.toLowerCase()}`}
                    label="Buscar SKU"
                    value=""
                    options={visibleOptions}
                    searchQuery={searchQuery}
                    onSearch={setSearchQuery}
                    onChange={handleAdd}
                />

                {values.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {values.map((v) => (
                            <span
                                key={v}
                                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                            >
                                <span className="max-w-[140px] truncate">{labelFromValue(v)}</span>
                                <button
                                    type="button"
                                    className="ml-2 text-gray-500 hover:text-gray-800"
                                    onClick={() => handleRemove(v)}
                                    aria-label={`Quitar ${labelFromValue(v)}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const SKUsRelacionadoView: React.FC = () => {
    const router = useRouter();
    const params = useParams<{ id?: string }>();

    const [saving, setSaving] = useState(false);

    // Estado local para cada grupo de relacionados (mocks basados en la imagen)
    const [similares, setSimilares] = useState<string[]>([
        "seven-up",
        "amargo-patagon",
        "amargo-blanco",
        "coca-sabor-original",
    ]);
    const [accesorios, setAccesorios] = useState<string[]>([]);
    const [sugeridos, setSugeridos] = useState<string[]>(["pitusas-de-mani"]);

    const [qSimilares, setQSimilares] = useState("");
    const [qAccesorios, setQAccesorios] = useState("");
    const [qSugeridos, setQSugeridos] = useState("");

    const handleApply = useCallback(async () => {
        try {
            setSaving(true);
            // mock de guardado rápido
            await new Promise((resolve) => setTimeout(resolve, 600));
        } finally {
            setSaving(false);
        }
    }, [similares, accesorios, sugeridos, params?.id]);

    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            // mock de guardado completo
            await new Promise((resolve) => setTimeout(resolve, 800));
        } finally {
            setSaving(false);
        }
    }, [similares, accesorios, sugeridos, params?.id]);

    const handleSaveAndNew = useCallback(async () => {
        try {
            setSaving(true);
            await new Promise((resolve) => setTimeout(resolve, 800));
            router.push("/catalogo/skus/nuevo");
        } finally {
            setSaving(false);
        }
    }, [router, similares, accesorios, sugeridos, params?.id]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                ),
                onClick: handleApply,
                // disabled: saving,
                disabled: true,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <PlusCircleIcon className="h-5 w-5" />
                ),
                onClick: handleSave,
                // disabled: saving,
                disabled: true,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <PlusCircleIcon className="h-5 w-5" />
                ),
                onClick: handleSaveAndNew,
                // disabled: saving,
                disabled: true,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/skus"),
                disabled: saving,
            },
        ],
        [handleApply, handleSave, handleSaveAndNew, router, saving]
    );

    // Mock del header del SKU 
    const headerName = "Agua Saborizada Frutilla Limon Levite 1.5lt";
    const headerActive = true;

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        SKU
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                        {headerName || "SKU relacionado"}
                        <span
                            className={`text-xs px-3 py-1 rounded-full text-white font-medium ${headerActive ? "bg-green-500" : "bg-gray-400"
                                }`}
                        >
                            {headerActive ? "Activo" : "Inactivo"}
                        </span>
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions, headerName, headerActive]
    );

    return (
        <div className="p-6 bg-page-bg">
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-4">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl">
                        <LinkIcon className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-semibold text-gray-900">SKU RELACIONADOS</h2>
                    <div className="ml-4 h-px flex-1 bg-gray-200" />
                </div>

                <div className="">
                    <RelatedRow
                        label="Similares"
                        values={similares}
                        onChange={setSimilares}
                        searchQuery={qSimilares}
                        setSearchQuery={setQSimilares}
                        options={ALL_SKU_OPTIONS}
                    />
                    <RelatedRow
                        label="Accesorios"
                        values={accesorios}
                        onChange={setAccesorios}
                        searchQuery={qAccesorios}
                        setSearchQuery={setQAccesorios}
                        options={ALL_SKU_OPTIONS}
                    />
                    <RelatedRow
                        label="Sugeridos"
                        values={sugeridos}
                        onChange={setSugeridos}
                        searchQuery={qSugeridos}
                        setSearchQuery={setQSugeridos}
                        options={ALL_SKU_OPTIONS}
                    />
                </div>
            </div>
        </div>
    );
};

export default SKUsRelacionadoView;
