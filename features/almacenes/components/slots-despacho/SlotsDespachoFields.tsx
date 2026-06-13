"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { TrashIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { CalendarCheck2Icon } from "lucide-react";
import { ActionButton } from "@/components/ui/button/action-button";

/** Tipos */
export interface SlotDespacho {
    id: string;
    transportista: string;
    desde: string; // HH:mm
    hasta: string; // HH:mm
}

export default function SlotsDespachoFields({
    slots,
    readOnly = false,
    onChange,
    onAdd,
    onRemove,
    carriersOptions = [],
}: {
    slots: SlotDespacho[];
    readOnly?: boolean;
    onChange?: (index: number, field: keyof SlotDespacho, value: any) => void;
    onAdd?: () => void;
    onRemove?: (index: number) => void;
    carriersOptions?: string[];
}) {
    return (
        <div className="space-y-6">
            <Card
                icon={CalendarCheck2Icon}
                title="SLOTS DE DESPACHO"
                hasTitleDivider noDefaultStyles
                className="rounded-xl p-6">
                {/* Grid general 6 columnas: label izq / campos der (como PickingPointFields) */}
                <div className="grid grid-cols-6 gap-4">
                    {slots.map((row, idx) => (
                        <React.Fragment key={row.id}>
                            {/* Transportista */}
                            <span className="col-span-1 text-sm text-gray-600">Transportista</span>
                            <div className="col-span-5">
                                <div className="flex items-center">
                                    {readOnly ? (
                                        <div className="text-sm text-gray-800">{row.transportista || "—"}</div>
                                    ) : (
                                        <div className="flex w-full items-center">
                                            <div className="flex-1">
                                                <CollapsibleField
                                                    label=""
                                                    value={row.transportista}
                                                    options={carriersOptions}
                                                    onChange={(v) => onChange?.(idx, "transportista", String(v))}
                                                    inline
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onRemove?.(idx)}
                                                className="ml-3 rounded-full p-1 text-gray-500 hover:text-gray-700"
                                                title="Eliminar slot"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Desde */}
                            <span className="col-span-1 text-sm text-gray-600">Desde</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm text-gray-800">{row.desde || "—"}</div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={row.desde}
                                            onChange={(e) => onChange?.(idx, "desde", e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Hasta */}
                            <span className="col-span-1 text-sm text-gray-600">Hasta</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <div className="text-sm text-gray-800">{row.hasta || "—"}</div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={row.hasta}
                                            onChange={(e) => onChange?.(idx, "hasta", e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Separador entre filas */}
                            {idx < slots.length - 1 && <div className="col-span-6 my-2 border-b border-gray-200" />}
                        </React.Fragment>
                    ))}

                    {/* Botón Nuevo */}
                    {!readOnly && (
                        <div className="col-span-6 mt-2">
                            <ActionButton
                                type="button"
                                variant="primary"
                                onClick={onAdd}
                            >
                                <PlusCircleIcon className="h-5 w-5" />
                                Nuevo
                            </ActionButton>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
