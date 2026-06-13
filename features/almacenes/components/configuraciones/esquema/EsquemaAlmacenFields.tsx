"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { Toggle } from "@/components/ui/togle/togle";

export type Estado = "Activo" | "Inactivo";
export type PickingOrder =
    | "categories"
    | "storedGoods"
    | "skuPositions"
    | "skuPositionsThenCategories";

export const SCHEMA_LEVEL_OPTIONS = ["zona", "sector", "pasillo", "estante", "altura"] as const;
export type SchemaLevelOption = (typeof SCHEMA_LEVEL_OPTIONS)[number];
export const PICKING_ORDER_LABELS: Record<PickingOrder, string> = {
    categories: "Categorias",
    storedGoods: "Ubicaciones con stock",
    skuPositions: "Posiciones SKU",
    skuPositionsThenCategories: "Posiciones SKU y categorias",
};

export const getPickingOrderLabel = (value: PickingOrder | string) =>
    PICKING_ORDER_LABELS[value as PickingOrder] ?? value;

export interface EsquemaAlmacen {
    id?: string;
    nombre: string;
    pickingOrder: PickingOrder;
    niveles: string[];
    estado: Estado;
    creado?: { username: string; email: string; date: string };
    modificado?: { username: string; email: string; date: string };
}

export function EsquemaAlmacenFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: EsquemaAlmacen;
    readOnly?: boolean;
    onChange?: (field: keyof EsquemaAlmacen, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof EsquemaAlmacen) => (value: any) => onChange?.(field, value);
    const [levelsOpen, setLevelsOpen] = useState(false);
    const levelsRef = useRef<HTMLDivElement | null>(null);

    const pickingOptions = useMemo(
        () =>
            ([
                { label: PICKING_ORDER_LABELS.categories, value: "categories" },
                { label: PICKING_ORDER_LABELS.storedGoods, value: "storedGoods" },
                { label: PICKING_ORDER_LABELS.skuPositions, value: "skuPositions" },
                {
                    label: PICKING_ORDER_LABELS.skuPositionsThenCategories,
                    value: "skuPositionsThenCategories",
                },
            ] as const),
        []
    );

    const nivelCatalog = useMemo(() => [...SCHEMA_LEVEL_OPTIONS], []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!levelsRef.current?.contains(event.target as Node)) {
                setLevelsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addNivel = (nivel: string) => {
        const normalized = nivel.trim();
        if (!normalized || record.niveles.includes(normalized)) return;
        handle("niveles")([...record.niveles, normalized]);
    };

    const removeNivel = (nivel: string) => {
        handle("niveles")(record.niveles.filter((item) => item !== nivel));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                <div className="space-y-6 lg:col-span-4">
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-x-6 gap-y-4">
                            <span className="whitespace-nowrap text-sm font-bold text-gray-600">Nombre</span>
                            <div>
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    placeholder=""
                                    disabled={readOnly}
                                />
                            </div>

                            <span className="whitespace-nowrap text-sm font-bold text-gray-600">Orden de picking</span>
                            <div>
                                <CollapsibleField
                                    label=""
                                    value={record.pickingOrder}
                                    options={[...pickingOptions]}
                                    onChange={(value) => handle("pickingOrder")(value as PickingOrder)}
                                    inline
                                />
                            </div>

                            <span className="whitespace-nowrap pt-1 text-sm font-bold text-gray-600">Niveles</span>
                            <div>
                                <div className="relative" ref={levelsRef}>
                                    <button
                                        type="button"
                                        onClick={() => !readOnly && setLevelsOpen((prev) => !prev)}
                                        disabled={readOnly}
                                        className={[
                                            "flex min-h-[38px] w-full items-center justify-between gap-3 border-b border-gray-300 py-1 text-left",
                                            readOnly ? "cursor-default" : "cursor-pointer",
                                        ].join(" ")}
                                    >
                                        <div className="flex flex-1 flex-wrap items-center gap-2">
                                            {record.niveles.map((nivel) => (
                                                <span
                                                    key={nivel}
                                                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                                                >
                                                    <span>{nivel}</span>
                                                    {!readOnly ? (
                                                        <span
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                removeNivel(nivel);
                                                            }}
                                                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-white"
                                                            aria-label={`Quitar ${nivel}`}
                                                            title={`Quitar ${nivel}`}
                                                        >
                                                            <XMarkIcon className="h-3 w-3" />
                                                        </span>
                                                    ) : null}
                                                </span>
                                            ))}
                                        </div>
                                        {!readOnly ? (
                                            levelsOpen ? (
                                                <ChevronUpIcon className="h-4 w-4 shrink-0 text-blue-600" />
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4 shrink-0 text-blue-600" />
                                            )
                                        ) : null}
                                    </button>

                                    {levelsOpen && !readOnly ? (
                                        <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                                            <div className="flex max-h-56 flex-col overflow-auto">
                                                {nivelCatalog.map((nivel) => {
                                                    const selected = record.niveles.includes(nivel);
                                                    return (
                                                        <button
                                                            key={nivel}
                                                            type="button"
                                                            onClick={() => (selected ? removeNivel(nivel) : addNivel(nivel))}
                                                            className={[
                                                                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                                                                selected ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50",
                                                            ].join(" ")}
                                                        >
                                                            <span>{nivel}</span>
                                                            {selected ? <XMarkIcon className="h-4 w-4" /> : null}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <span className="whitespace-nowrap text-sm font-bold text-gray-600">Estado</span>
                            <div>
                                <div className="flex items-center py-1">
                                    <Toggle
                                        checked={record.estado === "Activo"}
                                        onCheckedChange={(checked) => handle("estado")(checked ? "Activo" : "Inactivo")}
                                        disabled={readOnly}
                                        aria-label="Cambiar estado"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6 lg:col-span-3">
                    {!isCreate && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm font-bold text-gray-600">Usuario</span>
                                <div className="col-span-5">
                                    <div className="flex items-center gap-2">
                                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-300 text-xs font-bold text-white">
                                            AM
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-sm text-gray-900">{record.creado?.username ?? "Ariel Mikowski"}</div>
                                            <div className="text-xs text-gray-500">{record.creado?.email ?? "ariel.mikowski@..."}</div>
                                        </div>
                                        <div className="ml-auto text-xs text-gray-500">{record.creado?.date ?? "14/05/2024 11:30:09"}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {!isCreate && (
                        <Card
                            title="ULTIMA MODIFICACION"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm font-bold text-gray-600">Usuario</span>
                                <div className="col-span-5">
                                    <div className="flex items-center gap-2">
                                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-300 text-xs font-bold text-white">
                                            AM
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-sm text-gray-900">{record.modificado?.username ?? "Ariel Mikowski"}</div>
                                            <div className="text-xs text-gray-500">{record.modificado?.email ?? "ariel.mikowski@..."}</div>
                                        </div>
                                        <div className="ml-auto text-xs text-gray-500">{record.modificado?.date ?? "18/09/2024 18:24:26"}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
