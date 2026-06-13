// views\Picking\Repacking\components\RepackingFields.tsx
"use client";

import { useEffect } from "react";

import {
    ClipboardDocumentListIcon,
    MapPinIcon
} from "@heroicons/react/24/outline";
import { LayersIcon, UserCircleIcon, PencilLineIcon } from "lucide-react";

import Card from "@/components/ui/card/Card";

/* ============================================================
   Tipos
============================================================ */

export interface RepackingItem {
    sku: string;
    descripcion: string;
    cantidad: string | number;
    pesoKg: string | number;
}

export interface RepackingRecord {
    repackId: string;
    orderId: string;
    referenceId: string;
    ean: string;
    tipoPaquete: string;
    retornable: boolean;
    unidadesTotales: string | number;
    skusTotales: string | number;

    warehouse: string;
    posicion: string;
    dimensiones: string;
    pesoTotal: string | number;
    volumen: string;
    cubing: string;

    items: RepackingItem[];

    paquetesAnidados: string;

    creadoPor?: { nombre: string; email: string };
    fechaCreacion?: string;

    modificadoPor?: { nombre: string; email: string };
    fechaModificacion?: string;
}

interface Props {
    isSummary?: boolean;
    record: RepackingRecord;
    onChange: (field: keyof RepackingRecord, value: any) => void;
    onReady?: () => void;
}

/* ============================================================
   Input 
============================================================ */

const Input = ({ value, disabled, onChange }: any) => (
    <input
        className="w-full border-b border-gray-300 bg-transparent px-1 py-1 focus:outline-none focus:border-blue-500"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
    />
);

/* ============================================================
   Tabla Items
============================================================ */

const ItemsTable = ({ items, disabled, onChange }: any) => {
    const update = (i: number, field: keyof RepackingItem, value: any) => {
        const next = [...items];
        next[i] = { ...next[i], [field]: value };
        onChange(next);
    };

    return (
        <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                    <tr>
                        <th className="px-4 py-2 text-left">SKU</th>
                        <th className="px-4 py-2 text-left">Descripción</th>
                        <th className="px-4 py-2 text-center">Cant.</th>
                        <th className="px-4 py-2 text-center">Peso (KG)</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((it: any, idx: number) => (
                        <tr key={idx} className="border-t">
                            <td className="px-4 py-2">
                                <Input value={it.sku} disabled={disabled} onChange={(v: any) => update(idx, "sku", v)} />
                            </td>

                            <td className="px-4 py-2">
                                <Input value={it.descripcion} disabled={disabled} onChange={(v: any) => update(idx, "descripcion", v)} />
                            </td>

                            <td className="px-4 py-2 text-center">
                                <Input value={it.cantidad} disabled={disabled} onChange={(v: any) => update(idx, "cantidad", v)} />
                            </td>

                            <td className="px-4 py-2 text-center">
                                <Input value={it.pesoKg} disabled={disabled} onChange={(v: any) => update(idx, "pesoKg", v)} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function RepackingFields({
    isSummary,
    record,
    onChange,
    onReady
}: Props) {
    useEffect(() => {
        onReady?.();
    }, [onReady]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

            {/* ============================================================
                COLUMNA IZQUIERDA (FORMULARIO PRINCIPAL)
            ============================================================ */}
            <div className="space-y-10 lg:col-span-4">

                {/* INFORMACIÓN GENERAL */}
                <Card
                    title="INFORMACIÓN GENERAL"
                    icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="mt-4 space-y-6">
                        <div className="grid grid-cols-6 gap-y-4">

                            <label className="col-span-1">Repack ID</label>
                            <div className="col-span-5">
                                <Input value={record.repackId} onChange={(v: any) => onChange("repackId", v)} />
                            </div>

                            <label className="col-span-1">Order ID</label>
                            <div className="col-span-5">
                                <Input value={record.orderId} onChange={(v: any) => onChange("orderId", v)} />
                            </div>

                            <label className="col-span-1">Reference ID</label>
                            <div className="col-span-5">
                                <Input value={record.referenceId} onChange={(v: any) => onChange("referenceId", v)} />
                            </div>

                            <label className="col-span-1">EAN</label>
                            <div className="col-span-5">
                                <Input value={record.ean} onChange={(v: any) => onChange("ean", v)} />
                            </div>

                            <label className="col-span-1">Tipo paquete</label>
                            <div className="col-span-5">
                                <Input value={record.tipoPaquete} onChange={(v: any) => onChange("tipoPaquete", v)} />
                            </div>

                            <label className="col-span-1">Retornable</label>
                            <div className="col-span-5">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={record.retornable}
                                    onChange={(e) => onChange("retornable", e.target.checked)}
                                />
                            </div>

                            <label className="col-span-1">Unidades</label>
                            <div className="col-span-5">
                                <Input value={record.unidadesTotales} onChange={(v: any) => onChange("unidadesTotales", v)} />
                            </div>

                            <label className="col-span-1">SKUs</label>
                            <div className="col-span-5">
                                <Input value={record.skusTotales} onChange={(v: any) => onChange("skusTotales", v)} />
                            </div>

                        </div>
                    </div>
                </Card>

                {/* UBICACIÓN */}
                <Card
                    title="UBICACIÓN Y DIMENSIONES"
                    icon={<MapPinIcon className="h-6 w-6" />}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="mt-4 space-y-6">
                        <div className="grid grid-cols-6 gap-y-4">

                            <label className="col-span-1">Warehouse</label>
                            <div className="col-span-5">
                                <Input value={record.warehouse} onChange={(v: any) => onChange("warehouse", v)} />
                            </div>

                            <label className="col-span-1">Posición</label>
                            <div className="col-span-5">
                                <Input value={record.posicion} onChange={(v: any) => onChange("posicion", v)} />
                            </div>

                            <label className="col-span-1">Dimensiones</label>
                            <div className="col-span-5">
                                <Input value={record.dimensiones} onChange={(v: any) => onChange("dimensiones", v)} />
                            </div>

                            <label className="col-span-1">Peso total</label>
                            <div className="col-span-5">
                                <Input value={record.pesoTotal} onChange={(v: any) => onChange("pesoTotal", v)} />
                            </div>

                            <label className="col-span-1">Volumen</label>
                            <div className="col-span-5">
                                <Input value={record.volumen} onChange={(v: any) => onChange("volumen", v)} />
                            </div>

                            <label className="col-span-1">Cubing</label>
                            <div className="col-span-5">
                                <Input value={record.cubing} onChange={(v: any) => onChange("cubing", v)} />
                            </div>

                        </div>
                    </div>
                </Card>

                {/* PAQUETES ANIDADOS */}
                <Card
                    title="PAQUETES ANIDADOS"
                    icon={<LayersIcon className="h-6 w-6" />}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="mt-4">
                        <textarea
                            className="w-full border border-gray-300 rounded-md p-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={record.paquetesAnidados}
                            onChange={(e) => onChange("paquetesAnidados", e.target.value)}
                        />
                    </div>
                </Card>
            </div>

            {/* ============================================================
                COLUMNA DERECHA 
            ============================================================ */}
            {isSummary && (
                <div className="lg:col-span-3 space-y-6">

                    {/* USUARIO CREADOR */}
                    <Card
                        title="Usuario creador"
                        icon={UserCircleIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6 bg-white"
                    >
                        <div className="grid grid-cols-12 items-center gap-4">
                            <div className="col-span-9">
                                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                                    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                        {(record.creadoPor?.nombre || "—")
                                            .split(/\s+/)
                                            .map((p) => p[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{record.creadoPor?.nombre || "—"}</span>
                                        <span className="text-xs text-gray-500">{record.creadoPor?.email || ""}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-3 text-right">
                                <span className="text-xs text-gray-500">
                                    {record.creadoPor?.email || "—"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* ÚLTIMA MODIFICACIÓN */}
                    <Card
                        title="Última modificación"
                        icon={PencilLineIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6 bg-white"
                    >
                        <div className="grid grid-cols-12 items-center gap-4">
                            <div className="col-span-9">
                                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                                    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                        {(record.modificadoPor?.nombre || "—")
                                            .split(/\s+/)
                                            .map((p) => p[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{record.modificadoPor?.nombre || "—"}</span>
                                        <span className="text-xs text-gray-500">{record.modificadoPor?.email || ""}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-3 text-right">
                                <span className="text-xs text-gray-500">
                                    {record.modificadoPor?.email || "—"}
                                </span>
                            </div>
                        </div>
                    </Card>

                </div>
            )}

        </div>
    );
}
