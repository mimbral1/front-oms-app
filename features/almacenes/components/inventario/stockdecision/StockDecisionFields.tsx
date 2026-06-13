"use client";

import {
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    Squares2X2Icon,
    AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { UserCircleIcon, PencilLineIcon } from "lucide-react";

import Card from "@/components/ui/card/Card";

/* ======================================================
   TIPOS
====================================================== */

export interface StockDecision {
    nombre: string;
    estado: "Activo" | "Inactivo";
    version: string;

    engine: string;

    multiWarehouse: boolean;
    reserveStock: boolean;
    reserveMinutes: number;

    allowSplit: boolean;
    maxSplits: number;
    minimizeSplits: boolean;

    maxWeight: number;
    maxVolume: number;
    maxItems: number;

    slaStandard: number;
    slaExpress: number;
    wavesEnabled: boolean;
    waveEvery: number;
}

interface Props {
    record?: StockDecision;
    readOnly?: boolean;
    onChange?: (field: keyof StockDecision, value: any) => void;
    isCreate?: boolean;
}

/* ======================================================
   TOGGLE (MISMO QUE PERFILES IMPORTACIÓN)
====================================================== */
const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${on ? "bg-blue-500" : "bg-gray-300"
            }`}
    >
        <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"
                }`}
        />
    </button>
);

/* ======================================================
   COMPONENTE
====================================================== */

export default function StockDecisionFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: Props) {
    if (!record) return null;

    const handle =
        (field: keyof StockDecision) =>
            (value: any) => {
                if (!readOnly && onChange) onChange(field, value);
            };

    const mockUser = {
        nombre: "Juan Pérez",
        correo: "juan.perez@mimbral.cl",
        fecha: "2025-11-09 14:22",
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">

                {/* ===================== IZQUIERDA ===================== */}
                <div className="lg:col-span-4 space-y-6">

                    {/* DETALLE */}
                    <Card
                        title="Detalle"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <Label>Nombre</Label>
                            <Field>
                                <input
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                />
                            </Field>

                            <Label>Estado</Label>
                            <Field>
                                <select
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                    value={record.estado}
                                    onChange={(e) => handle("estado")(e.target.value)}
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </Field>

                            <Label>Versión</Label>
                            <Field>
                                <input
                                    className="w-full border-b border-gray-200 bg-transparent text-sm"
                                    value={record.version}
                                    disabled
                                />
                            </Field>
                        </div>
                    </Card>

                    {/* MOTOR */}
                    <Card
                        title="Motor"
                        icon={Cog6ToothIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <Label>Tipo de motor</Label>
                            <Field>
                                <input
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                    value={record.engine}
                                    onChange={(e) => handle("engine")(e.target.value)}
                                />
                            </Field>
                        </div>
                    </Card>

                    {/* PARÁMETROS DE STOCK */}
                    <Card
                        title="Parámetros de stock"
                        icon={Squares2X2Icon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <Label>Multi warehouse</Label>
                            <Field>
                                <Toggle
                                    on={record.multiWarehouse}
                                    onChange={handle("multiWarehouse")}
                                />
                            </Field>

                            <Label>Reservar stock (min)</Label>
                            <Field className="flex items-center gap-4">
                                <Toggle
                                    on={record.reserveStock}
                                    onChange={handle("reserveStock")}
                                />
                                <input
                                    className="w-24 border-b border-gray-300 bg-transparent text-sm outline-none"
                                    type="number"
                                    value={record.reserveMinutes}
                                    onChange={(e) =>
                                        handle("reserveMinutes")(Number(e.target.value))
                                    }
                                />
                            </Field>
                        </div>
                    </Card>

                    {/* SPLIT POLICY + SLA */}
                    <Card
                        title="Split policy"
                        icon={AdjustmentsHorizontalIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Permitir split
                                </label>
                                <Toggle
                                    on={record.allowSplit}
                                    onChange={handle("allowSplit")}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Max splits
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                    value={record.maxSplits}
                                    onChange={(e) =>
                                        handle("maxSplits")(Number(e.target.value))
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Minimizar splits
                                </label>
                                <Toggle
                                    on={record.minimizeSplits}
                                    onChange={handle("minimizeSplits")}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* CONSTRAINTS */}
                    <Card
                        title="Constraints"
                        icon={Squares2X2Icon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Max weight (kg / paquete)
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                    value={record.maxWeight}
                                    onChange={(e) =>
                                        handle("maxWeight")(Number(e.target.value))
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Max volume (m³ / paquete)
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                    value={record.maxVolume}
                                    onChange={(e) =>
                                        handle("maxVolume")(Number(e.target.value))
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Max items / paquete
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                    value={record.maxItems}
                                    onChange={(e) =>
                                        handle("maxItems")(Number(e.target.value))
                                    }
                                />
                            </div>
                        </div>
                    </Card>

                    {/* SLA & WAVE RULES */}
                    <Card
                        title="SLA & Wave rules"
                        icon={AdjustmentsHorizontalIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Preparación estándar (min)
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                    value={record.slaStandard}
                                    onChange={(e) =>
                                        handle("slaStandard")(Number(e.target.value))
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Preparación express (min)
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                    value={record.slaExpress}
                                    onChange={(e) =>
                                        handle("slaExpress")(Number(e.target.value))
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Waves enabled
                                </label>
                                <Toggle
                                    on={record.wavesEnabled}
                                    onChange={handle("wavesEnabled")}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-2">
                                    Crea cada (min)
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                    value={record.waveEvery}
                                    onChange={(e) =>
                                        handle("waveEvery")(Number(e.target.value))
                                    }
                                />
                            </div>
                        </div>
                    </Card>

                </div>

                {/* ===================== DERECHA ===================== */}
                {!isCreate && (
                    <div className="lg:col-span-3 space-y-6">
                        <Card
                            title="Usuario creador"
                            icon={UserCircleIcon}
                            hasTitleDivider
                            noDefaultStyles
                            className="rounded-xl p-6 bg-white"
                        >
                            <UserInfo {...mockUser} />
                        </Card>

                        <Card
                            title="Última modificación"
                            icon={PencilLineIcon}
                            hasTitleDivider
                            noDefaultStyles
                            className="rounded-xl p-6 bg-white"
                        >
                            <UserInfo {...mockUser} />
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ======================================================
   HELPERS (MISMO PATRÓN QUE PERFILES)
====================================================== */

const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="col-span-1 text-sm font-bold text-gray-600">
        {children}
    </span>
);

const Field = ({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`col-span-5 ${className}`}>{children}</div>
);

function UserInfo({
    nombre,
    correo,
    fecha,
}: {
    nombre: string;
    correo: string;
    fecha: string;
}) {
    return (
        <div className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-9">
                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                        {nombre
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm">{nombre}</span>
                        <span className="text-xs text-gray-500">{correo}</span>
                    </div>
                </div>
            </div>
            <div className="col-span-3 text-right">
                <span className="text-xs text-gray-500">{fecha}</span>
            </div>
        </div>
    );
}
