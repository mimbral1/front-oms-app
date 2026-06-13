// views\Delivery\Tms\SimulacionRuta\components\SimulacionRutaFields.tsx
"use client";

import React, { useState } from "react";
import Select from "react-select";

export interface SimulacionRuta {
    id?: string;
    envio: string;
    fecha_entrega_desde: string;
    fecha_entrega_hasta: string;
    fecha_creacion: string;
    fecha_envio: string,
    tipo_entrega: any;
    tipo_vehiculo: any;
    inventario: string;
    rutas: string;
    entregas: string;
    estado: string;
    usuario_creador: { iniciales: string; nombre: string; email: string };
}

interface Props {
    record: SimulacionRuta;
    readOnly?: boolean;
    onChange?: <K extends keyof SimulacionRuta>(field: K, value: SimulacionRuta[K]) => void;
    onSimular?: () => void;
}

export const SimulacionRutaFields: React.FC<Props> = ({
    record,
    readOnly = true,
    onChange,
    onSimular,
}) => {
    const [vehiculos, setVehiculos] = useState({
        camion: 0,
        carro: 0,
        moto: 0,
    });

    // tipo de entrega opciones
    const tipoEntregaOptions = [
        { value: "Envio a domicilio", label: "Envio a domicilio" },
        { value: "Express 24hs", label: "Express 24hs" },
    ];


    const handleSelectChange =
        (field: keyof SimulacionRuta) =>
            (e: React.ChangeEvent<HTMLSelectElement>) => {
                onChange?.(field, e.target.value);
            };

    const handleVehiculoChange = (tipo: keyof typeof vehiculos, delta: number) => {
        setVehiculos((prev) => ({
            ...prev,
            [tipo]: Math.max(0, prev[tipo] + delta),
        }));
    };

    return (
        <div className="space-y-6 mt-0 pt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-6 gap-4 items-center">
                        {/* Agendamiento */}
                        <span className="col-span-1 text-sm font-bold text-gray-600">Agendamiento</span>
                        <div className="col-span-5">
                            <span className="text-xs text-blue-600 font-medium mb-1 block">Agendamiento</span>
                            {readOnly ? (
                                <span className="text-sm text-gray-900">{record.fecha_entrega_desde} → {record.fecha_entrega_hasta}</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="datetime-local"
                                        value={record.fecha_entrega_desde}
                                        onChange={(e) => onChange?.("fecha_entrega_desde", e.target.value)}
                                        className="border-b border-gray-300 text-sm text-gray-900 focus:outline-none w-full"
                                    />
                                    <span className="text-gray-500 text-sm">→</span>
                                    <input
                                        type="datetime-local"
                                        value={record.fecha_entrega_hasta}
                                        onChange={(e) => onChange?.("fecha_entrega_hasta", e.target.value)}
                                        className="border-b border-gray-300 text-sm text-gray-900 focus:outline-none w-full"
                                    />
                                    <button
                                        onClick={() => {
                                            onChange?.("fecha_entrega_desde", "");
                                            onChange?.("fecha_entrega_hasta", "");
                                        }}
                                        className="text-gray-400 hover:text-red-500"
                                        title="Limpiar"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Inventario */}
                        <span className="col-span-1 text-sm font-bold text-gray-600">Inventario</span>
                        <div className="col-span-5">
                            {readOnly ? (
                                <span className="text-sm text-gray-900">{record.inventario}</span>
                            ) : (
                                <Select
                                    isMulti
                                    name="tipo_entrega"
                                    /*  evita IDs auto-incrementales distintos entre SSR/CSR */
                                    instanceId="simulacion-tipo-entrega"

                                    options={tipoEntregaOptions}
                                    value={tipoEntregaOptions.filter((option) =>
                                        Array.isArray(record.tipo_entrega)
                                            ? record.tipo_entrega.includes(option.value)
                                            : typeof record.tipo_entrega === "string"
                                                ? record.tipo_entrega.split(",").includes(option.value)
                                                : false
                                    )}
                                    onChange={(selected) => {
                                        const values = (selected as readonly { value: string }[]).map((s) => s.value).join(",");
                                        onChange?.("tipo_entrega", values);
                                    }}

                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    /*  sólo en cliente; evita avisos en SSR cuando portalizas el menú */
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                                />

                            )}
                        </div>

                        {/* tipo de entrega */}
                        <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo de entrega</span>
                        <div className="col-span-5">
                            {readOnly ? (
                                <div className="text-sm font-medium text-gray-900">
                                    {Array.isArray(record.tipo_entrega) ? record.tipo_entrega.join(", ") : record.tipo_entrega}
                                </div>
                            ) : (
                                <Select
                                    isMulti
                                    name="tipo_entrega"
                                    options={tipoEntregaOptions}
                                    value={tipoEntregaOptions.filter((option) =>
                                        Array.isArray(record.tipo_entrega)
                                            ? record.tipo_entrega.includes(option.value)
                                            : typeof record.tipo_entrega === "string"
                                                ? record.tipo_entrega.split(",").includes(option.value)
                                                : false
                                    )}
                                    onChange={(selected) => {
                                        const values = (selected as readonly { value: string }[]).map((s) => s.value).join(",");
                                        onChange?.("tipo_entrega", values);
                                    }}

                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                />

                            )}
                        </div>

                        {/* Tipos de vehículo */}
                        <span className="col-span-1 text-sm font-bold text-gray-600">Tipo de vehículo</span>
                        <div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { tipo: "camion", nombre: "Camión", capacidad: 18 },
                                { tipo: "carro", nombre: "Carro", capacidad: 6 },
                                { tipo: "moto", nombre: "Motocicleta", capacidad: 2 },
                            ].map(({ tipo, nombre, capacidad }) => (
                                <div
                                    key={tipo}
                                    className="border rounded-lg p-4 text-center shadow-md flex flex-col items-center"
                                >
                                    <div className="text-blue-600 font-semibold">{nombre}</div>
                                    <div className="text-sm text-gray-500 mb-2">Capacidad {capacidad}</div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleVehiculoChange(tipo as any, -1)}
                                            className="px-2 py-1 text-xl bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center">{vehiculos[tipo as keyof typeof vehiculos]}</span>
                                        <button
                                            onClick={() => handleVehiculoChange(tipo as any, 1)}
                                            className="px-2 py-1 text-xl bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Contenedor para los botones en la esquina inferior derecha */}
            <div className="fixed bottom-20 right-20 flex flex-col items-end space-y-2">
                {/* Botón "Agregar almacén" */}
                <button className="flex items-center space-x-2 text-blue-600">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-600 text-blue-600 text-2xl font-semibold">
                        +
                    </div>
                    <span>Agregar almacén</span>
                </button>
                <br />
                <br />
                {/* Botón "Simular rutas" */}
                <button
                    onClick={() => onSimular?.()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200"
                >
                    Simular rutas
                </button>

            </div>
        </div>
    );
};