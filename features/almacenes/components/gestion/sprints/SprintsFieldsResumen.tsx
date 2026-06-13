// app/views/Sprints/components/SprintsFieldsResumen.tsx
"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    BuildingOffice2Icon,
    TruckIcon,
    BuildingStorefrontIcon,
    ArrowsRightLeftIcon,
    ShoppingCartIcon,
    ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

/* Tipado compartido con la vista */
export interface SprintRecord {
    id?: string;
    title?: string;
    status?: string;
    // DESTINO
    destLocation: string;
    destWarehouse: string;
    // ORIGEN
    sourceGroup: string;
    // meta
    creator?: { name: string; email: string; date?: string };
    assignee?: { name: string; email: string };
    startedAt?: string;
    endedAt?: string;
}

/* Helper: fecha + hora en 2 inputs apilados, sin alterar estilos */
function DateTimeStack({
    label,
    value,
    onChange,
}: {
    label: string;
    value?: string;
    onChange: (v: string) => void;
}) {
    const [d, t] = useMemo(() => {
        if (!value) return ["", ""];
        const parts = value.split(" ");
        return [parts[0] ?? "", parts[1] ?? ""];
    }, [value]);

    const [date, setDate] = useState(d);
    const [time, setTime] = useState(t);

    const commit = (nd: string, nt: string) => {
        setDate(nd);
        setTime(nt);
        onChange(`${nd}${nd && nt ? " " : ""}${nt}`);
    };

    return (
        <>
            <span className="col-span-2 text-sm text-gray-600 font-bold">{label}</span>
            <div className="col-span-10">
                <div className="grid grid-cols-1 gap-2">
                    <input
                        type="date"
                        className="w-full border-b border-gray-300 text-sm outline-none"
                        value={date}
                        onChange={(e) => commit(e.target.value, time)}
                    />
                    <input
                        type="time"
                        className="w-full border-b border-gray-300 text-sm outline-none"
                        value={time}
                        onChange={(e) => commit(date, e.target.value)}
                    />
                </div>
            </div>
        </>
    );
}

// para iconos en TOTALES
function TotalItem({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    value: number | string;
}) {
    return (
        <>
            <span className="col-span-3 flex items-center gap-2 text-sm text-gray-600 font-bold">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200">
                    <Icon className="h-4 w-4 text-gray-600 font-bold" />
                </span>
                {label}
            </span>
            <div className="col-span-9">
                {/* <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs"> */}
                <div className="inline-flex items-center px-2 py-1 text-xs">
                    {value}
                </div>
            </div>
        </>
    );
}


/* ─────────────────────────────────────────
   Campos del RESUMEN — EDITABLES (misma UI)
   ───────────────────────────────────────── */
export function SprintFieldsResumen({
    record,
    onChange,
}: {
    record: SprintRecord;
    onChange?: <K extends keyof SprintRecord>(
        field: K,
        value: SprintRecord[K]
    ) => void;
}) {
    const set =
        <K extends keyof SprintRecord>(field: K) =>
            (v: SprintRecord[K]) =>
                onChange?.(field, v);

    const creator = record.creator ?? { name: "", email: "" };
    const assignee = record.assignee ?? { name: "", email: "" };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* Columna izquierda */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Título</span>
                            <div className="col-span-10">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.title ?? ""}
                                    onChange={(e) => set("title")(e.target.value)}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </Card>

                    {/* ORIGEN */}
                    <Card
                        title="ORIGEN"
                        icon={TruckIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <span className="col-span-2 text-sm text-gray-600 font-bold">
                                Grupo de almacén
                            </span>
                            <div className="col-span-10">
                                <CollapsibleField
                                    label=""
                                    value={record.sourceGroup}
                                    options={["Piso 1", "Piso 2", "Piso 3"]}
                                    onChange={set("sourceGroup")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* DESTINO */}
                    <Card
                        title="DESTINO"
                        icon={BuildingOffice2Icon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <span className="col-span-2 text-sm text-gray-600 font-bold">
                                Ubicación
                            </span>
                            <div className="col-span-10">
                                <CollapsibleField
                                    label=""
                                    value={record.destLocation}
                                    options={["Palermo 201", "Belgrano 101", "Centro 01"]}
                                    onChange={set("destLocation")}
                                    inline
                                />
                            </div>

                            <span className="col-span-2 text-sm text-gray-600 font-bold">
                                Almacén
                            </span>
                            <div className="col-span-10">
                                <CollapsibleField
                                    label=""
                                    value={record.destWarehouse}
                                    options={["Palermo 201", "Palermo 202", "Belgrano 101"]}
                                    onChange={set("destWarehouse")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* FECHAS */}
                    <Card
                        title="FECHAS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <DateTimeStack
                                label="Fecha de inicio"
                                value={record.startedAt}
                                onChange={set("startedAt")}
                            />
                            <DateTimeStack
                                label="Fecha de fin"
                                value={record.endedAt}
                                onChange={set("endedAt")}
                            />
                        </div>
                    </Card>
                </div>

                {/* Columna derecha */}
                <div className="lg:col-span-3 space-y-6">
                    {/* TOTALES (informativo, igual que antes) */}
                    <Card
                        title="TOTALES"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <TotalItem icon={BuildingStorefrontIcon} label="Almacenes" value={1} />
                            <TotalItem icon={ArrowsRightLeftIcon} label="Movimientos" value={1} />
                            <TotalItem icon={ShoppingCartIcon} label="Pedidos" value={1} />
                            <TotalItem icon={ShoppingBagIcon} label="Bultos" value={1} />
                        </div>
                    </Card>


                    {/* USUARIOS */}
                    <Card
                        title="USUARIOS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <span className="col-span-4 text-sm text-gray-600 font-bold">
                                Asignado (nombre)
                            </span>
                            <div className="col-span-8">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={assignee.name}
                                    onChange={(e) =>
                                        set("assignee")({ ...assignee, name: e.target.value })
                                    }
                                />
                            </div>

                            <span className="col-span-4 text-sm text-gray-600 font-bold">
                                Asignado (email)
                            </span>
                            <div className="col-span-8">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={assignee.email}
                                    onChange={(e) =>
                                        set("assignee")({ ...assignee, email: e.target.value })
                                    }
                                />
                            </div>

                            <span className="col-span-4 text-sm text-gray-600 font-bold">
                                Usuario creador (nombre)
                            </span>
                            <div className="col-span-8">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={creator.name}
                                    onChange={(e) =>
                                        set("creator")({ ...creator, name: e.target.value })
                                    }
                                />
                            </div>

                            <span className="col-span-4 text-sm text-gray-600 font-bold">
                                Usuario creador (email)
                            </span>
                            <div className="col-span-8">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={creator.email}
                                    onChange={(e) =>
                                        set("creator")({ ...creator, email: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default SprintFieldsResumen;
