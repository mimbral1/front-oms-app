// views\Delivery\Rutas\components\RutasDetalleFields.tsx
"use client";

/* ==========================================================================
   RUTAS RESUMEN
   ========================================================================== */

import React from "react";
import Card from "@/components/ui/card/Card";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import {
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    PencilSquareIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { TruckIcon } from "lucide-react";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";

export type ResultadoRuta = {
    pickupsOk: number;
    pickupsNo: number;
    entregasOk: number;
    entregasNo: number;
    avancePct: number;
};

export type UsuarioMini = {
    initials: string;
    name: string;
    email?: string;
    at?: string;
};

export type RutasDetalleRecord = {
    conductorId?: string;
    repartidorId?: string;
    vehiculoId?: string;

    inicio?: string;
    fin?: string;

    distanciaKm?: number;
    distanciaRecorridaKm?: number;
    duracionEstimadaMin?: number;
    duracionRealMin?: number;
    estadoTiempo?: "OnTime" | "Delayed" | "InProgress";

    resultado: ResultadoRuta;

    creador?: UsuarioMini;
    ultimaModificacion?: UsuarioMini;
};

export function RutasDetalleFields({
    record,
    onChange,
    driverOptions = [],
    helperOptions = [],
    vehicleOptions = [],
}: {
    record: RutasDetalleRecord;
    onChange?: <K extends keyof RutasDetalleRecord>(field: K, value: RutasDetalleRecord[K]) => void;
    driverOptions?: { label: string; value: string }[];
    helperOptions?: { label: string; value: string }[];
    vehicleOptions?: { label: string; value: string }[];
}) {
    const fmtMin = (m?: number) => {
        if (m == null) return "-";
        if (m < 60) return `${m} min`;
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return `${h}h ${mm}m`;
    };

    const Chip = ({ value, tone }: { value: number | string; tone?: "green" | "red" | "gray" }) => {
        const map =
            tone === "green"
                ? "bg-emerald-100 text-emerald-700"
                : tone === "red"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-gray-100 text-gray-700";
        return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map}`}>{value}</span>;
    };

    const EstadoBadge = ({ estado }: { estado?: RutasDetalleRecord["estadoTiempo"] }) => {
        if (estado === "Delayed") return <Chip value="Delayed" tone="red" />;
        if (estado === "OnTime") return <Chip value="On time" tone="green" />;
        return <Chip value="In progress" tone="gray" />;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-6">
                    {/* DETALLE */}
                    <Card title="DETALLE" icon={ClipboardDocumentListIcon} hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            {/* Conductor */}
                            <div className="col-span-1 flex items-center text-sm font-semibold text-gray-700">Conductor</div>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="detalle-conductor"
                                    label="Conductor"
                                    value={record.conductorId ?? ""}
                                    options={[{ label: "—", value: "" }, ...driverOptions]}
                                    searchQuery=""
                                    loading={false}
                                    onSearch={() => { }}
                                    onChange={(val) => onChange?.("conductorId", val || "")}
                                />
                            </div>

                            {/* Repartidor */}
                            <div className="col-span-1 flex items-center text-sm font-semibold text-gray-700">Repartidor</div>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="detalle-repartidor"
                                    label="Repartidor"
                                    value={record.repartidorId ?? ""}
                                    options={[{ label: "—", value: "" }, ...helperOptions]}
                                    searchQuery=""
                                    loading={false}
                                    onSearch={() => { }}
                                    onChange={(val) => onChange?.("repartidorId", val || "")}
                                />
                            </div>

                            {/* Vehículo */}
                            <div className="col-span-1 flex items-center text-sm font-semibold text-gray-700">Vehículo</div>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="detalle-vehiculo"
                                    label="Vehículo"
                                    value={record.vehiculoId ?? ""}
                                    options={[{ label: "—", value: "" }, ...vehicleOptions]}
                                    searchQuery=""
                                    loading={false}
                                    onSearch={() => { }}
                                    onChange={(val) => onChange?.("vehiculoId", val || "")}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* PROGRAMACIÓN */}
                    <Card title="PROGRAMACIÓN" icon={CalendarDaysIcon} hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-1 flex items-center text-sm font-semibold text-gray-700">Inicio</div>
                            <div className="col-span-5">
                                <input
                                    type="datetime-local"
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
                                    value={record.inicio || ""}
                                    onChange={(e) => onChange?.("inicio", e.target.value)}
                                />
                            </div>

                            <div className="col-span-1 flex items-center text-sm font-semibold text-gray-700">Finalización</div>
                            <div className="col-span-5">
                                <input
                                    type="datetime-local"
                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
                                    value={record.fin || ""}
                                    onChange={(e) => onChange?.("fin", e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* DURACIÓN */}
                    <Card title="DURACIÓN" icon={ClockIcon} hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-1 flex items-center text-sm font-semibold text-gray-700">
                                <ClockIcon className="mr-2 h-4 w-4" />
                                <span>Duración</span>
                            </div>
                            <div className="col-span-5 flex flex-wrap items-center gap-3">
                                <span className="text-sm text-gray-700">Duración estimada</span>
                                <Chip value={fmtMin(record.duracionEstimadaMin)} tone="gray" />

                                <span className="ml-2 text-sm text-gray-700">Duración real</span>
                                <Chip value={fmtMin(record.duracionRealMin)} tone="gray" />

                                <span className="ml-2 text-sm text-gray-700">Estado</span>
                                <EstadoBadge estado={record.estadoTiempo} />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* DISTANCIA */}
                    <Card title="DISTANCIA" icon={TruckIcon} hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-3 text-sm text-gray-600">Distancia estimada</div>
                            <div className="col-span-3 text-right text-xl font-semibold text-gray-900">
                                {(record.distanciaKm ?? 0).toFixed(2)} Km
                            </div>

                            <div className="col-span-3 text-sm text-gray-600">Distancia recorrida</div>
                            <div className="col-span-3 text-right text-xl font-semibold text-gray-900">
                                {(record.distanciaRecorridaKm ?? 0).toFixed(2)} Km
                            </div>
                        </div>
                    </Card>

                    {/* RESULTADO */}
                    <Card title="RESULTADO" icon={CalculateOutlinedIcon} hasTitleDivider className="rounded-xl p-6">
                        <div className="space-y-3 text-sm">
                            {/* <div className="flex items-center justify-between">
                                <span>Pick ups completados</span>
                                <Chip value={record.resultado.pickupsOk} tone="green" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Pick ups no completados</span>
                                <Chip value={record.resultado.pickupsNo} tone="red" />
                            </div> */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <span>Entregas completadas</span>
                                    <Chip value={record.resultado.entregasOk} tone="green" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Entregas no concluidas</span>
                                    <Chip value={record.resultado.entregasNo} tone="red" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <span>Porcentaje de avance</span>
                                    <Chip value={`${record.resultado.avancePct}%`} tone="green" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* USUARIO CREADOR */}
                    <Card title="USUARIO CREADOR" icon={UserIcon} hasTitleDivider className="rounded-xl p-6">
                        {record.creador ? (
                            <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                                    {record.creador.initials}
                                </div>
                                <div className="text-sm">
                                    <div className="font-semibold text-gray-900">{record.creador.name}</div>
                                    {record.creador.email && <div className="text-gray-500">{record.creador.email}</div>}
                                    {record.creador.at && <div className="text-xs text-gray-400">{record.creador.at}</div>}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">-</div>
                        )}
                    </Card>

                    {/* ÚLTIMA MODIFICACIÓN */}
                    {record.ultimaModificacion && (
                        <Card title="ÚLTIMA MODIFICACIÓN" icon={PencilSquareIcon} hasTitleDivider className="rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                                    {record.ultimaModificacion.initials}
                                </div>
                                <div className="text-sm">
                                    <div className="font-semibold text-gray-900">{record.ultimaModificacion.name}</div>
                                    {record.ultimaModificacion.email && <div className="text-gray-500">{record.ultimaModificacion.email}</div>}
                                    {record.ultimaModificacion.at && <div className="text-xs text-gray-400">{record.ultimaModificacion.at}</div>}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
