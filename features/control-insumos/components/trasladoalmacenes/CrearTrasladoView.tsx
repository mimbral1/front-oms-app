// views\ControlInsumos\TrasladoAlmacenes\components\CrearTrasladoView.tsx
"use client";

import React, { useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

export default function CrearTrasladoView() {
    const [items, setItems] = useState([
        { insumo: "", cantidad: "", unidad: "" },
    ]);

    const agregarItem = () =>
        setItems((p) => [...p, { insumo: "", cantidad: "", unidad: "" }]);

    const borrarItem = (i: number) =>
        setItems((p) => p.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-6 bg-white p-6">

            <h2 className="font-semibold text-gray-700 text-lg">
                Formulario de Traslado de Insumos
            </h2>

            {/* ---------- INFORMACIÓN GENERAL ---------- */}
            <h3 className="font-semibold text-gray-700">Información general</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="flex flex-col">
                    <label className="text-sm text-gray-700 mb-1">
                        Bodega Origen
                    </label>
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option>Seleccione bodega de origen</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm text-gray-700 mb-1">
                        Bodega Destino
                    </label>
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option>Seleccione bodega de destino</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm text-gray-700 mb-1">
                        Fecha Prevista
                    </label>
                    <input
                        type="text"
                        placeholder="Seleccione fecha"
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                </div>
            </div>

            {/* ---------- ITEMS DEL TRASLADO ---------- */}
            <h3 className="font-semibold text-gray-700">Ítems del Traslado</h3>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border rounded-xl p-4"
                    >
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1">
                                Código / Ítem
                            </label>
                            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option>Seleccione insumo</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1">
                                Cantidad
                            </label>
                            <input
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                placeholder="0"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1">
                                Unidad
                            </label>
                            <input
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                placeholder="Unidad de medida"
                            />
                        </div>

                        <ActionButton
                            variant="error"
                            size="sm"
                            onClick={() => borrarItem(index)}
                            className="md:col-span-3 flex justify-end"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </ActionButton>
                    </div>
                ))}
            </div>

            <ActionButton
                variant="secondary"
                size="sm"
                onClick={agregarItem}
            >
                <PlusIcon className="h-4 w-4" />
                Agregar ítem
            </ActionButton>

            {/* ---------- MOTIVO ---------- */}
            <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                    Motivo / Observaciones
                </label>
                <textarea
                    rows={4}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Ingrese cualquier motivo o comentario..."
                />
            </div>

            {/* ---------- ENVIAR ---------- */}
            <div className="flex justify-end">
                <ActionButton variant="primary">
                    Enviar Traslado
                </ActionButton>
            </div>
        </div>
    );
}
