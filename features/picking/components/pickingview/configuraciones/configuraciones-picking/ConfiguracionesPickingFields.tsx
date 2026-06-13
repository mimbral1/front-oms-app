// views\PickingView\configuraciones\configuraciones-picking\components\ConfiguracionesPickingFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import {
    ClipboardListIcon,
    ReplaceIcon,
    SquareDashedMousePointerIcon,
} from "lucide-react";
import Select, { MultiValue } from 'react-select';

// MOCK 
export interface ConfiguracionesPicking {
    visibilidadPicker: string;
    elegirRonda: boolean;
    barcodeType: string;
    posponerItems: boolean;
    omitirItems: boolean;
    desplegar: boolean;
    itemsSueltos: boolean;
    itemsFaltantes: boolean;
    confirmarItemsPos: boolean;
    confirmarItemsIgn: boolean;
    confirmarItemsDesp: boolean;
    confirmarItemsSinCanasto: boolean;
    sustitucionOnline: string;
    sustitucionOffline: string;
    criteriosSustitucionEstandar: string[];
    criteriosSustitucionCandidatos: string[];
    pickearCantidadMayor: boolean;
    tipoIdPedido: string;
}

interface Props {
    config: ConfiguracionesPicking;
    readOnly?: boolean;
    onChange?: (field: keyof ConfiguracionesPicking, value: any) => void;
}

// selectores de criterios
const mockCriteriosOptions = [
    { value: "Misma marca", label: "Misma marca" },
    { value: "Marca propia", label: "Marca propia" },
    { value: "Tamaño similar", label: "Tamaño similar" },
    { value: "+4 otro", label: "+4 otro" },
];

export const ConfiguracionesPickingFields: React.FC<Props> = ({ config, readOnly = true, onChange }) => {
    const handle =
        (field: keyof ConfiguracionesPicking) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                let value: any;
                if (e.target.type === 'checkbox') {
                    // Aquí le decimos a TypeScript que e.target es un HTMLInputElement
                    value = (e.target as HTMLInputElement).checked;
                } else {
                    value = e.target.value;
                }
                onChange?.(field, value);
            };

    // Función para renderizar el nuevo estilo de checkbox tipo "switch"
    const renderSwitch = (field: keyof ConfiguracionesPicking) => (
        <label className="inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                id={field as string}
                checked={config[field] as boolean}
                onChange={handle(field)}
                disabled={readOnly}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 relative transition-all duration-300">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
        </label>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/** ─── LEFT (span 2 cols) ─── */}
                <div className="lg:col-span-3 space-y-6">
                    {/** RONDAS */}
                    <Card
                        title="RONDAS"
                        icon={SquareDashedMousePointerIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4 items-center">
                            <span className="col-span-1 text-sm text-gray-600">Visión del Picker</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {config.visibilidadPicker}
                                    </span>
                                ) : (
                                    <select
                                        value={config.visibilidadPicker}
                                        onChange={handle("visibilidadPicker")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    >
                                        <option value="Mine and unassigned">Mine and unassigned</option>
                                    </select>
                                )}
                            </div>
                            <span className="col-span-1 text-sm text-gray-600">Eligir ronda</span>
                            <div className="col-span-5">
                                {renderSwitch("elegirRonda")}
                            </div>
                            <span className="col-span-1 text-sm text-gray-600">Barcode type</span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {config.barcodeType}
                                    </span>
                                ) : (
                                    <select
                                        value={config.barcodeType}
                                        onChange={handle("barcodeType")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    >
                                        <option value="None">None</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/** ACCIONES Y VALIDACIONES */}
                    <Card
                        title="ACCIONES Y VALIDACIONES"
                        icon={QuestionMarkCircleIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <span className="col-span-1 text-sm text-gray-900">Posponer ítems</span>
                            {renderSwitch("posponerItems")}
                            <span className="col-span-1 text-sm text-gray-900">Confirmar ítems pospuestos</span>
                            {renderSwitch("confirmarItemsPos")}

                            <span className="col-span-1 text-sm text-gray-900">Omitir ítems</span>
                            {renderSwitch("omitirItems")}
                            <span className="col-span-1 text-sm text-gray-900">Confirmar ítems ignorados</span>
                            {renderSwitch("confirmarItemsIgn")}

                            <span className="col-span-1 text-sm text-gray-900">Despickear</span>
                            {renderSwitch("desplegar")}
                            <span className="col-span-1 text-sm text-gray-900">Confirmar ítems despickeados</span>
                            {renderSwitch("confirmarItemsDesp")}

                            <span className="col-span-1 text-sm text-gray-900">Ítems sueltos (Multipicking)</span>
                            {renderSwitch("itemsSueltos")}
                            <span className="col-span-1 text-sm text-gray-900">Confirmar ítems sin canasto (Multipicking)</span>
                            {renderSwitch("confirmarItemsSinCanasto")}

                            <span className="col-span-1 text-sm text-gray-900">Ítems faltantes</span>
                            {renderSwitch("itemsFaltantes")}
                        </div>
                    </Card>
                </div>

                {/** ─── RIGHT COLUMN ─── */}
                <div className="lg:col-span-2 space-y-6">
                    {/** SUSTITUCIÓN */}
                    <Card
                        title="SUSTITUCIÓN"
                        icon={ReplaceIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <span className="col-span-1 text-sm text-gray-600">Sustitución (online)</span>
                            <div className="col-span-2">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900">
                                        {config.sustitucionOnline}
                                    </span>
                                ) : (
                                    <select
                                        value={config.sustitucionOnline}
                                        onChange={handle("sustitucionOnline")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    >
                                        <option value="Can pick unknown items">Can pick unknown items</option>
                                    </select>
                                )}
                            </div>
                            <span className="col-span-1 text-sm text-gray-600">Sustitución (offline)</span>
                            <div className="col-span-2">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900">
                                        {config.sustitucionOffline}
                                    </span>
                                ) : (
                                    <select
                                        value={config.sustitucionOffline}
                                        onChange={handle("sustitucionOffline")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    >
                                        <option value="Can pick original items only">Can pick original items only</option>
                                    </select>
                                )}
                            </div>
                            <span className="col-span-1 text-sm text-gray-600">Criterios para sustitución estándar</span>
                            <div className="col-span-2">
                                {readOnly ? (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {config.criteriosSustitucionEstandar.map((criterio, index) => (
                                            <span key={index} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                                                {criterio}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <Select
                                        isMulti
                                        name="criteriosSustitucionEstandar"
                                        options={mockCriteriosOptions}
                                        value={config.criteriosSustitucionEstandar.map((val: string) => ({
                                            label: val,
                                            value: val,
                                        }))}
                                        onChange={(selected: MultiValue<{ label: string, value: string }>) => {
                                            const values = selected.map((s) => s.value);
                                            onChange?.("criteriosSustitucionEstandar", values);
                                        }}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                )}
                            </div>
                            <span className="col-span-1 text-sm text-gray-600">Criterio de sustitución para seleccionar candidatos</span>
                            <div className="col-span-2">
                                {readOnly ? (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {config.criteriosSustitucionCandidatos.map((criterio, index) => (
                                            <span key={index} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                                                {criterio}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <Select
                                        isMulti
                                        name="criteriosSustitucionCandidatos"
                                        options={mockCriteriosOptions}
                                        value={config.criteriosSustitucionCandidatos.map((val: string) => ({
                                            label: val,
                                            value: val,
                                        }))}
                                        onChange={(selected: MultiValue<{ label: string, value: string }>) => {
                                            const values = selected.map((s) => s.value);
                                            onChange?.("criteriosSustitucionCandidatos", values);
                                        }}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                    />
                                )}
                            </div>
                            <span className="col-span-1 text-sm text-gray-900">Pickear cantidad mayor a la original</span>
                            <div className="col-span-1 flex justify-end">
                                {renderSwitch("pickearCantidadMayor")}
                            </div>
                        </div>
                    </Card>

                    {/** DISPLAY */}
                    <Card
                        title="DISPLAY"
                        icon={ClipboardListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-3 gap-4 items-center">
                            <span className="col-span-1 text-sm text-gray-600">Tipo ID de pedido</span>
                            <div className="col-span-2">
                                {readOnly ? (
                                    <span className="text-sm font-medium text-gray-900">
                                        {config.tipoIdPedido}
                                    </span>
                                ) : (
                                    <select
                                        value={config.tipoIdPedido}
                                        onChange={handle("tipoIdPedido")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    >
                                        <option value="Commerce">Commerce</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
