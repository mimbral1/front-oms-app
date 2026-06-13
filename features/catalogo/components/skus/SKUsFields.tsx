// views\CatalogoView\SKUs\components\SKUsFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    CubeIcon,
    ScaleIcon,
    UserIcon
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

/* Interfaz */
export interface Sku {
    id?: string;
    refId: string;
    refIdProducto: string;
    nombre: string;
    codigosBarra: string; // Simulado como texto separado por comas o simple
    esNuevo: boolean;
    fechaLanzamiento: string;
    modal: string;
    status: string;

    // Unidades
    umVenta: string;
    multiplicadorUmVenta: number;
    umPpum: string;
    multiplicadorUmPpum: number;

    // Dimensiones / Medidas Bulto
    dimensionesAncho: number;
    dimensionesAltura: number;
    dimensionesProfundidad: number;
    dimensionesPeso: number;
    bultoAncho: number;
    bultoAltura: number;
    bultoProfundidad: number;
    bultoPeso: number;

    // Metadatos
    created?: { username: string; date: string; avatar?: string };
    modified?: { username: string; date: string; email?: string; avatar?: string };
}

export function SKUsFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: Sku;
    readOnly?: boolean;
    onChange?: (field: keyof Sku, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof Sku) => (v: any) => onChange?.(field, v);

    // Opciones mock para "Códigos de barra" (EAN)
    const eanOptions = React.useMemo(
        () => [
            { value: "", label: "Seleccione código de barra" },
            { value: "7801234567890", label: "7801234567890 - Unidad" },
            { value: "7809876543210", label: "7809876543210 - Pack x6" },
            { value: "7801112223334", label: "7801112223334 - Display" },
            { value: "7804445556667", label: "7804445556667 - Promoción" },
        ],
        []
    );

    const [eanSearch, setEanSearch] = React.useState("");

    const filteredEanOptions = React.useMemo(() => {
        const q = eanSearch.trim().toLowerCase();
        if (!q) return eanOptions;
        return eanOptions.filter((o) =>
            (o.label + " " + o.value).toLowerCase().includes(q)
        );
    }, [eanOptions, eanSearch]);

    // Codigos seleccionados a partir del string (CSV) en record.codigosBarra
    const selectedEans = React.useMemo(
        () =>
            (record.codigosBarra || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        [record.codigosBarra]
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA (General + Unidades) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* DETALLE / RESUMEN */}
                    <Card
                        title="RESUMEN"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">

                            {/* Ref ID */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ref ID</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.refId}
                                    onChange={(e) => handle("refId")(e.target.value)}
                                    readOnly={!isCreate} // Usualmente RefID no se edita
                                    disabled={!isCreate}
                                    placeholder=""
                                />
                            </div>

                            {/* Ref ID */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ref ID Producto</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.refIdProducto}
                                    onChange={(e) => handle("refIdProducto")(e.target.value)}
                                    readOnly={!isCreate}
                                    disabled={!isCreate}
                                    placeholder=""
                                />
                            </div>

                            {/* Producto / Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Producto</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none text-blue-600 font-medium"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    placeholder="Nombre del producto"
                                />
                            </div>

                            {/* Códigos de barra */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Códigos de barra</span>
                            <div className="col-span-5">
                                {/* selector para agregar códigos de barra (EAN) */}
                                <SelectSearchInline
                                    id="codigosBarra"
                                    label="Código de barra"
                                    value={"" /* siempre vacío para permitir agregar múltiples */}
                                    options={filteredEanOptions}
                                    searchQuery={eanSearch}
                                    onSearch={setEanSearch}
                                    onChange={(value) => {
                                        if (!value) return;

                                        // normaliza el CSV actual a array
                                        const current = (record.codigosBarra || "")
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter(Boolean);

                                        // evita duplicados
                                        if (current.includes(value)) return;

                                        const next = [...current, value];
                                        // guarda nuevamente como CSV
                                        handle("codigosBarra")(next.join(", "));
                                    }}
                                />

                                {/* chips de códigos de barra seleccionados */}
                                {selectedEans.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedEans.map((code) => (
                                            <span
                                                key={code}
                                                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                                            >
                                                {code}
                                                <button
                                                    type="button"
                                                    className="ml-2 text-gray-500 hover:text-gray-800"
                                                    onClick={() => {
                                                        const current = (record.codigosBarra || "")
                                                            .split(",")
                                                            .map((s) => s.trim())
                                                            .filter(Boolean);
                                                        const next = current.filter((c) => c !== code);
                                                        handle("codigosBarra")(next.join(", "));
                                                    }}
                                                    aria-label={`Quitar código ${code}`}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {/* Nuevo (Switch) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nuevo</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.esNuevo}
                                    onClick={() => handle("esNuevo")(!record.esNuevo)}
                                    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${record.esNuevo ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${record.esNuevo ? "translate-x-5" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Fecha de lanzamiento */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Fecha lanz.</span>
                            <div className="col-span-5">
                                <input
                                    type="date"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.fechaLanzamiento}
                                    onChange={(e) => handle("fechaLanzamiento")(e.target.value)}
                                />
                            </div>

                            {/* Modal */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Modal</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.modal}
                                    options={["Moda", "Tecnología", "Hogar", "Estándar"]}
                                    onChange={handle("modal")}
                                    inline
                                />
                            </div>

                            {/* Status */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Status</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.status}
                                    options={["Activo", "Inactivo", "Pendiente"]}
                                    onChange={handle("status")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/* UNIDADES */}
                    <Card
                        title="UNIDADES"
                        icon={ScaleIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* UM Venta */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">UM (Venta)</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.umVenta}
                                    options={["kg", "un", "lt", "m"]}
                                    onChange={handle("umVenta")}
                                    inline
                                />
                            </div>

                            {/* Multiplicador UM Venta */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Multiplicador UM (Venta)</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    step="0.0001"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.multiplicadorUmVenta}
                                    onChange={(e) => handle("multiplicadorUmVenta")(Number(e.target.value))}
                                />
                            </div>

                            {/* UM PPUM */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">UM (PPUM)</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.umPpum}
                                    options={["kg", "un", "lt", "m"]}
                                    onChange={handle("umPpum")}
                                    inline
                                />
                            </div>

                            {/* Multiplicador UM PPUM */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Multiplicador UM (PPUM)</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    step="1"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.multiplicadorUmPpum}
                                    onChange={(e) => handle("multiplicadorUmPpum")(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA (Dimensiones, Bulto, Usuarios) */}
                <div className="lg:col-span-3 space-y-6">

                    {/* MEDIDAS GENERALES */}
                    <Card
                        title="DIMENSIONES"
                        icon={CubeIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-xs font-bold text-gray-500 mb-1">Ancho</span>
                            <input
                                type="number"
                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                value={record.dimensionesAncho}
                                onChange={(e) => handle("dimensionesAncho")(Number(e.target.value))}
                            />
                            <span className="col-span-1 text-xs font-bold text-gray-500 mb-1">Altura</span>
                            <input
                                type="number"
                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                value={record.dimensionesAltura}
                                onChange={(e) => handle("dimensionesAltura")(Number(e.target.value))}
                            />
                            <span className="col-span-1 text-xs font-bold text-gray-500 mb-1">Profundidad</span>
                            <input
                                type="number"
                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                value={record.dimensionesProfundidad}
                                onChange={(e) => handle("dimensionesProfundidad")(Number(e.target.value))}
                            />
                            <span className="col-span-1 text-xs font-bold text-gray-500 mb-1">Peso</span>
                            <input
                                type="number"
                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                value={record.dimensionesPeso}
                                onChange={(e) => handle("dimensionesPeso")(Number(e.target.value))}
                            />
                        </div>
                    </Card>

                    {/* MEDIDAS BULTO */}
                    <Card
                        title="MEDIDAS BULTO"
                        icon={CubeIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-6">
                            <span className="col-span-1 text-xs font-bold text-gray-500 mb-1">Ancho</span>
                            <input
                                type="number"
                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                value={record.bultoAncho}
                                onChange={(e) => handle("bultoAncho")(Number(e.target.value))}
                            />

                            <span className="col-span-1 text-xs font-bold text-gray-500 mb-1">Altura</span>
                            <input
                                type="number"
                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                value={record.bultoAltura}
                                onChange={(e) => handle("bultoAltura")(Number(e.target.value))}
                            />

                            <span className="col-span-1 text-xs font-bold text-gray-500 mb-1">Profundidad</span>
                            <input
                                type="number"
                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                value={record.bultoProfundidad}
                                onChange={(e) => handle("bultoProfundidad")(Number(e.target.value))}
                            />

                            <span className="col-span-1 text-xs font-bold text-gray-500 mb-1">Peso</span>
                            <input
                                type="number"
                                className="col-span-5 border-b border-gray-300 text-sm outline-none"
                                value={record.bultoPeso}
                                onChange={(e) => handle("bultoPeso")(Number(e.target.value))}
                            />

                        </div>
                    </Card>

                    {/* USUARIO CREADOR (Solo en Resumen) */}
                    {!isCreate && record.created && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                                    {record.created.avatar ? (
                                        <img src={record.created.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-6 w-6 m-2 text-gray-400" />
                                    )}
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium text-gray-900">{record.created.username}</div>
                                    <div className="text-gray-500 text-xs">{record.created.date}</div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* ULTIMA MODIFICACION (Solo en Resumen) */}
                    {!isCreate && record.modified && (
                        <Card
                            title="ÚLTIMA MODIFICACIÓN"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                                    {record.modified.avatar ? (
                                        <img src={record.modified.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-6 w-6 m-2 text-gray-400" />
                                    )}
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium text-gray-900">{record.modified.username}</div>
                                    <div className="text-xs text-gray-500">{record.modified.email}</div>
                                    <div className="text-xs text-gray-400 mt-1">{record.modified.date}</div>
                                </div>
                            </div>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    );
}