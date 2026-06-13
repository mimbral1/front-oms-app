// views\Picking\TrackeoPaquetes\components\TrackeoPaquetesFields.tsx

"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    CubeIcon,
    ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

/* ---------- Interfaz ---------- */
export interface TrackeoPaquete {
    tipo: string;
    material: string;
    codigoBarras: string;
    precio: string;
    pedido: string;

    ancho: string;
    altura: string;
    largo: string;
    volumen: string;
    peso: string;
}

export function TrackeoPaquetesFields({
    record,
    onChange,
}: {
    record: TrackeoPaquete;
    onChange?: (field: keyof TrackeoPaquete, value: any) => void;
}) {
    const handle = (field: keyof TrackeoPaquete) => (v: any) =>
        onChange?.(field, v);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="BULTOS"
                        icon={CubeIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Tipo
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.tipo}
                                    onChange={(e) => handle("tipo")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Material
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.material}
                                    onChange={(e) => handle("material")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Código de barras
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.codigoBarras}
                                    onChange={(e) =>
                                        handle("codigoBarras")(e.target.value)
                                    }
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Precio
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.precio}
                                    onChange={(e) => handle("precio")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Pedido
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.pedido}
                                    onChange={(e) => handle("pedido")(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="DIMENSIONES"
                        icon={ArrowsPointingOutIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-3 text-sm text-gray-600 font-bold">
                                Ancho
                            </span>
                            <div className="col-span-3 text-right">
                                <input
                                    className="w-full text-right border-b border-gray-300 text-sm outline-none"
                                    value={record.ancho}
                                    onChange={(e) => handle("ancho")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">
                                Altura
                            </span>
                            <div className="col-span-3 text-right">
                                <input
                                    className="w-full text-right border-b border-gray-300 text-sm outline-none"
                                    value={record.altura}
                                    onChange={(e) => handle("altura")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">
                                Largo
                            </span>
                            <div className="col-span-3 text-right">
                                <input
                                    className="w-full text-right border-b border-gray-300 text-sm outline-none"
                                    value={record.largo}
                                    onChange={(e) => handle("largo")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">
                                Volumen
                            </span>
                            <div className="col-span-3 text-right">
                                <input
                                    className="w-full text-right border-b border-gray-300 text-sm outline-none"
                                    value={record.volumen}
                                    onChange={(e) => handle("volumen")(e.target.value)}
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600 font-bold">
                                Peso
                            </span>
                            <div className="col-span-3 text-right">
                                <input
                                    className="w-full text-right border-b border-gray-300 text-sm outline-none"
                                    value={record.peso}
                                    onChange={(e) => handle("peso")(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
