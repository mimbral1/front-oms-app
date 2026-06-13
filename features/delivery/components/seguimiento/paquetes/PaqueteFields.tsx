"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { CubeIcon, ArrowsPointingOutIcon, MapPinIcon } from "@heroicons/react/24/outline";

export interface PaqueteRecord {
    id?: string;
    refId: string;
    ean: string;
    shippingId: string;
    orderId: string;
    packageTypeId: string;
    currency: string;
    status: string;
    trackingStatus: string;
    trackingDate: string;
    fechaCreacion: string;
    fechaModificacion: string;
    locationLat: number | string;
    locationLng: number | string;
    senderWarehouseId: string;
    receiverWarehouseId: string;
    location: string;
    nombre: string;
    descripcion: string;
    costoAdquisicion: number | string;
    ancho: number | string;
    alto: number | string;
    largo: number | string;
    cubage: number | string;
    pesoMaximo: number | string;
}

export default function PaqueteFields({
    record,
    onChange,
}: {
    record: PaqueteRecord;
    onChange?: <K extends keyof PaqueteRecord>(field: K, value: PaqueteRecord[K]) => void;
}) {
    const set =
        <K extends keyof PaqueteRecord>(field: K) =>
        (value: PaqueteRecord[K]) =>
            onChange?.(field, value);

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="flex flex-col gap-6">
                <Card title="RESUMEN" icon={CubeIcon} hasTitleDivider className="rounded-xl p-6">
                    <div className="grid grid-cols-6 gap-4">
                        <span className="col-span-1 text-sm text-gray-600">ID referencia</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.refId} onChange={(e) => set("refId")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">EAN</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.ean} onChange={(e) => set("ean")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">ID envio</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.shippingId} onChange={(e) => set("shippingId")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Nombre</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.nombre} onChange={(e) => set("nombre")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Descripcion</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.descripcion} onChange={(e) => set("descripcion")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Costo</span>
                        <div className="col-span-5">
                            <input type="number" step="0.01" className="w-full border-b border-gray-300 text-sm outline-none" value={record.costoAdquisicion ?? ""} onChange={(e) => set("costoAdquisicion")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Estado</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.status} onChange={(e) => set("status")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Fecha creacion</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.fechaCreacion} onChange={(e) => set("fechaCreacion")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Fecha modificacion</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.fechaModificacion} onChange={(e) => set("fechaModificacion")(e.target.value)} />
                        </div>
                    </div>
                </Card>

                <Card title="DIMENSIONES" icon={ArrowsPointingOutIcon} hasTitleDivider className="rounded-xl p-6">
                    <div className="grid grid-cols-6 gap-4">
                        <span className="col-span-1 text-sm text-gray-600">Ancho</span>
                        <div className="col-span-5">
                            <input type="number" className="w-full border-b border-gray-300 text-sm outline-none" value={record.ancho ?? ""} onChange={(e) => set("ancho")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Altura</span>
                        <div className="col-span-5">
                            <input type="number" className="w-full border-b border-gray-300 text-sm outline-none" value={record.alto ?? ""} onChange={(e) => set("alto")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Largo</span>
                        <div className="col-span-5">
                            <input type="number" className="w-full border-b border-gray-300 text-sm outline-none" value={record.largo ?? ""} onChange={(e) => set("largo")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Volumen</span>
                        <div className="col-span-5">
                            <input type="number" className="w-full border-b border-gray-300 text-sm outline-none" value={record.cubage ?? ""} onChange={(e) => set("cubage")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Peso maximo</span>
                        <div className="col-span-5">
                            <input type="number" className="w-full border-b border-gray-300 text-sm outline-none" value={record.pesoMaximo ?? ""} onChange={(e) => set("pesoMaximo")(e.target.value)} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col gap-6">
                <Card title="DATOS LOGISTICOS" icon={CubeIcon} hasTitleDivider className="rounded-xl p-6">
                    <div className="grid grid-cols-6 gap-4">
                        <span className="col-span-1 text-sm text-gray-600">Moneda</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.currency} onChange={(e) => set("currency")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">ID orden</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.orderId} onChange={(e) => set("orderId")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">ID tipo paquete</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.packageTypeId} onChange={(e) => set("packageTypeId")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">ID bodega origen</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.senderWarehouseId} onChange={(e) => set("senderWarehouseId")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">ID bodega destino</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.receiverWarehouseId} onChange={(e) => set("receiverWarehouseId")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Ubicacion</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.location} onChange={(e) => set("location")(e.target.value)} />
                        </div>
                    </div>
                </Card>

                <Card title="SEGUIMIENTO" icon={MapPinIcon} hasTitleDivider className="rounded-xl p-6">
                    <div className="grid grid-cols-6 gap-4">
                        <span className="col-span-1 text-sm text-gray-600">Estado seguimiento</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.trackingStatus} onChange={(e) => set("trackingStatus")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Fecha seguimiento</span>
                        <div className="col-span-5">
                            <input type="text" className="w-full border-b border-gray-300 text-sm outline-none" value={record.trackingDate} onChange={(e) => set("trackingDate")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Latitud</span>
                        <div className="col-span-5">
                            <input type="number" className="w-full border-b border-gray-300 text-sm outline-none" value={record.locationLat ?? ""} onChange={(e) => set("locationLat")(e.target.value)} />
                        </div>

                        <span className="col-span-1 text-sm text-gray-600">Longitud</span>
                        <div className="col-span-5">
                            <input type="number" className="w-full border-b border-gray-300 text-sm outline-none" value={record.locationLng ?? ""} onChange={(e) => set("locationLng")(e.target.value)} />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
