"use client";

import React, { useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

export type Ronda = {
    id: string;
    pickerId: string;
    pickerNombre: string;
    pickerEmail: string;

    pickingPoint: string;

    olaDisplay: string;
    olaInicio: string;
    olaFin: string;

    completado: boolean;
    itemsRepickeados: boolean;
    itemsSalteados: boolean;
    hasItemsCandidate: boolean;

    status: string;
};

type Opt = { label: string; value: string };

export function RondasFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
    pickerOptions = [],
}: {
    record: Ronda;
    readOnly?: boolean;
    onChange?: <K extends keyof Ronda>(field: K, value: Ronda[K]) => void;
    isCreate?: boolean;
    pickerOptions?: Opt[];
}) {
    const handle =
        <K extends keyof Ronda>(field: K) =>
            (value: Ronda[K]) =>
                onChange?.(field, value);

    const [pickerSearch, setPickerSearch] = useState("");

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Picker */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Picker
                            </span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="picker"
                                    label="Picker"
                                    value={record.pickerId}
                                    options={pickerOptions}
                                    searchQuery={pickerSearch}
                                    onSearch={setPickerSearch}
                                    onChange={(v, label) => {
                                        handle("pickerId")(v as any);

                                        if (!label) {
                                            handle("pickerNombre")("" as any);
                                            handle("pickerEmail")("" as any);
                                            return;
                                        }

                                        const [nombre, email] = label.split(" - ");
                                        handle("pickerNombre")(nombre as any);
                                        handle("pickerEmail")(email as any);
                                    }}
                                />

                            </div>

                            {/* Picking point */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Picking point
                            </span>
                            <div className="col-span-5">
                                <div className="w-full border-b border-gray-300 bg-transparent pb-1 text-sm text-black">
                                    {record.pickingPoint || "-"}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="OLAS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Display
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none text-black"
                                    value={record.olaDisplay}
                                    readOnly
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Fecha de inicio
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none text-black"
                                    value={record.olaInicio}
                                    readOnly
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Fecha de fin
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none text-black"
                                    value={record.olaFin}
                                    readOnly
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="OTROS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {[
                                ["Completado", "completado"],
                                ["Ítems repickeados", "itemsRepickeados"],
                                ["Ítems salteados", "itemsSalteados"],
                                ["Has items candidate", "hasItemsCandidate"],
                            ].map(([label, key]) => (
                                <React.Fragment key={key}>
                                    <span className="col-span-4 text-sm text-gray-600 font-bold">
                                        {label}
                                    </span>
                                    <div className="col-span-2">
                                        <span
                                            className={`inline-flex min-w-[52px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${(record as any)[key]
                                                ? "bg-green-100 text-green-700"
                                                : "bg-slate-100 text-slate-600"
                                                }`}
                                        >
                                            {(record as any)[key] ? "Sí" : "No"}
                                        </span>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>

                    {!isCreate && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                                    MV
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                        Manuel Vilche
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        manuel.vilche@janiscommerce.com
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
