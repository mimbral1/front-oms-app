// views\PickingView\configuraciones\multipicking\sectores\components\SectoresPickingFields.tsx
"use client";

import React, { useState } from "react";
import { useFetchWithAuth } from "@/lib/http/client";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, PencilIcon, UserIcon } from "@heroicons/react/24/outline";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { Avatar } from "@/components/ui/user-avatar";

/* ================== Tipos ================== */
export interface SectorPicking {
    id?: string;

    // Backend
    name: string;
    categoryIds: string[];
    skuIds: string[];
    maxQuantityOrders: number;
    maxQuantityItems: number;
    status?: string;
    isActive?: boolean;

    // Auditoría
    created?: {
        username: string;
        email: string;
        avatar?: string;
        date: string;
    };

    modified?: {
        username: string;
        email: string;
        avatar?: string;
        date: string;
    };
    categoryNames?: Record<string, string>; // CategoryCode/Id -> Name
    skuNames?: Record<string, string>; // ItemCode -> Name
}

interface Props {
    record: SectorPicking;
    readOnly?: boolean;
    onChange?: <K extends keyof SectorPicking>(field: K, value: SectorPicking[K]) => void;
}

/* ============== Fields ============== */
export const SectoresPickingFields: React.FC<Props> = ({ record, readOnly = true, onChange }) => {

    const { fetchWithAuth } = useFetchWithAuth();
    const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
    const [catSearch, setCatSearch] = useState("");
    const [loadingCats, setLoadingCats] = useState(false);
    const [skuOptions, setSkuOptions] = useState<{ label: string; value: string }[]>([]);
    const [skuSearch, setSkuSearch] = useState("");
    const [loadingSkus, setLoadingSkus] = useState(false);

    const categoryLabelById = React.useMemo(
        () => new Map(categories.map((c) => [String(c.value), c.label])),
        [categories]
    );

    const selectedCategoryIds = React.useMemo(
        () => (record.categoryIds ?? []).map((id) => String(id).trim()).filter(Boolean),
        [record.categoryIds]
    );

    const selectedCategoryNames = React.useMemo(
        () => selectedCategoryIds
            .map((id) => categoryLabelById.get(id) ?? "")
            .map((name) => name.trim())
            .filter(Boolean),
        [selectedCategoryIds, categoryLabelById]
    );

    const hasSelectedCategories = selectedCategoryIds.length > 0;

    const handle =
        <K extends keyof SectorPicking>(field: K) =>
            (v: SectorPicking[K]) =>
                onChange?.(field, v);

    const isNew = !record.created?.username;

    /* ================== Categorías ================== */
    React.useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCats(true);
                const data = await fetchWithAuth<any[]>(
                    "catalog/getcategory",
                    { method: "GET" }
                );

                setCategories(
                    data.map((c: any) => ({
                        label: c.Name,
                        value: c.Code,
                    }))
                );
            } finally {
                setLoadingCats(false);
            }
        };

        loadCategories();
    }, []);

    /* ================== SKUs ================== */
    React.useEffect(() => {
        if (!hasSelectedCategories) {
            setSkuOptions([]);
            setSkuSearch("");
            return;
        }

        const loadSkus = async () => {
            setLoadingSkus(true);
            try {
                const params = new URLSearchParams({
                    page: "1",
                    pageSize: skuSearch.trim() ? "10" : "50",
                });

                const isNumeric = /^\d+$/.test(skuSearch.trim());
                if (skuSearch.trim() && isNumeric) {
                    params.set("itemCode", skuSearch.trim());
                } else if (skuSearch.trim()) {
                    params.set("name", skuSearch.trim());
                }

                const json = await fetchWithAuth<any>(
                    `catalog/products?${params.toString()}`,
                    { method: "GET" }
                );

                const allowed = new Set(
                    [...selectedCategoryIds, ...selectedCategoryNames]
                        .map((v) => v.trim().toLowerCase())
                        .filter(Boolean)
                );

                const filteredProducts = (json?.data ?? []).filter((p: any) => {
                    const categoryValue = String(p?.Category ?? "").trim().toLowerCase();
                    return categoryValue ? allowed.has(categoryValue) : false;
                });

                setSkuOptions(
                    filteredProducts.map((p: any) => ({
                        label: p.Name,
                        value: p.ItemCode,
                    }))
                );
            } finally {
                setLoadingSkus(false);
            }
        };

        loadSkus();
    }, [fetchWithAuth, skuSearch, hasSelectedCategories, selectedCategoryIds, selectedCategoryNames]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {/* =======================
NOMBRE
======================= */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Nombre
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.name}
                                    disabled={readOnly}
                                    onChange={(e) => handle("name")(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* =======================
CATEGORÍAS
======================= */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Categorías
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="flex flex-wrap gap-2">
                                        {record.categoryIds.length ? (
                                            record.categoryIds.map((id) => (
                                                <span
                                                    key={id}
                                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-sm"
                                                >
                                                    {record.categoryNames?.[String(id)] ?? categoryLabelById.get(String(id)) ?? id}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <SelectSearchInline
                                            id="categories"
                                            label="categorías"
                                            value=""
                                            options={categories}
                                            searchQuery={catSearch}
                                            loading={loadingCats}
                                            onSearch={setCatSearch}
                                            onChange={(value) => {
                                                if (value && !record.categoryIds.includes(value)) {
                                                    handle("categoryIds")([...record.categoryIds, value]);
                                                }
                                            }}
                                        />

                                        {record.categoryIds.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {record.categoryIds.map((id) => (
                                                    <span
                                                        key={id}
                                                        className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                                                    >
                                                        {record.categoryNames?.[String(id)] ?? categoryLabelById.get(String(id)) ?? id}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handle("categoryIds")(
                                                                    record.categoryIds.filter((x) => x !== id)
                                                                )
                                                            }
                                                            className="text-indigo-400 hover:text-indigo-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* =======================
                                 SKU
                             ======================= */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Productos
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="flex flex-wrap gap-2">
                                        {record.skuIds.length ? (
                                            record.skuIds.map((sku) => (
                                                <span
                                                    key={sku}
                                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-sm"
                                                >
                                                    {record.skuNames?.[sku] ?? sku}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <SelectSearchInline
                                            id="skus"
                                            label="productos"
                                            value=""
                                            options={skuOptions}
                                            searchQuery={skuSearch}
                                            loading={loadingSkus}
                                            onSearch={(q) => {
                                                if (!hasSelectedCategories) {
                                                    setSkuSearch("");
                                                    setSkuOptions([]);
                                                    return;
                                                }
                                                setSkuSearch(q);
                                            }}
                                            onChange={(value, label) => {
                                                if (!value || record.skuIds.includes(value)) return;

                                                handle("skuIds")([...record.skuIds, value]);

                                                if (label) {
                                                    handle("skuNames")({
                                                        ...(record.skuNames ?? {}),
                                                        [value]: label,
                                                    });
                                                }
                                            }}
                                        />

                                        {!hasSelectedCategories && (
                                            <p className="mt-2 text-xs text-amber-600">
                                                Selecciona al menos una categoría para buscar productos.
                                            </p>
                                        )}

                                        {record.skuIds.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {record.skuIds.map((id) => (
                                                    <span
                                                        key={id}
                                                        className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                                                    >
                                                        {record.skuNames?.[id] ?? id}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handle("skuIds")(
                                                                    record.skuIds.filter((x) => x !== id)
                                                                )
                                                            }
                                                            className="text-indigo-400 hover:text-indigo-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* =======================
          LÍMITES
      ======================= */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Máx. órdenes
                            </span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.maxQuantityOrders}
                                    disabled={readOnly}
                                    onChange={(e) =>
                                        handle("maxQuantityOrders")(Number(e.target.value))
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Máx. ítems
                            </span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.maxQuantityItems}
                                    disabled={readOnly}
                                    onChange={(e) =>
                                        handle("maxQuantityItems")(Number(e.target.value))
                                    }
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {record.created ? (
                            <div className="flex items-center justify-between">
                                {/* Izquierda: avatar + nombre + email */}
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        name={record.created.username}
                                        src={record.created.avatar}
                                        className="h-7 w-7 bg-orange-100 text-xs font-bold text-orange-700"
                                    />

                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">
                                            {record.created.username}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {record.created.email}
                                        </span>
                                    </div>
                                </div>

                                {/* Derecha: fecha creación */}
                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                    {record.created.date || "—"}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">—</div>
                        )}
                    </Card>

                    {record.modified && (
                        <Card
                            title="ÚLTIMA MODIFICACIÓN"
                            icon={PencilIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            {record.modified ? (
                                <div className="flex items-center justify-between">
                                    {/* Izquierda: avatar + nombre + email */}
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            name={record.modified.username}
                                            src={record.modified.avatar}
                                            className="h-7 w-7 bg-orange-100 text-xs font-bold text-orange-700"
                                        />

                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                                {record.modified.username}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {record.modified.email}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Derecha: fecha creación */}
                                    <div className="text-xs text-gray-500 whitespace-nowrap">
                                        {record.modified.date || "—"}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">—</div>
                            )}
                        </Card>
                    )}
                    {/* ===============================
    SKUs ASIGNADOS AL SECTOR
=============================== */}
                    {record.skuIds && record.skuIds.length > 0 && (
                        <Card
                            title="PRODUCTOS ASIGNADOS"
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="overflow-hidden rounded-md border border-gray-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">
                                                SKU
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">
                                                Producto
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {record.skuIds.map((sku) => (
                                            <tr key={sku}>
                                                <td className="px-3 py-2 font-mono text-gray-800 whitespace-nowrap">
                                                    {sku}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700">
                                                    {record.skuNames?.[sku] ?? sku}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SectoresPickingFields;
