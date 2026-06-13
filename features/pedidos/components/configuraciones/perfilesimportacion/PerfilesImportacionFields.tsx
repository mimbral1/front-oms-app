// views\PedidosView\Configuraciones\PerfilesImportacion\components\PerfilesImportacionFields.tsx
"use client";

import { useMemo, useState } from "react";

import {
    ClipboardDocumentListIcon,
    NumberedListIcon,
    Cog6ToothIcon,
    ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";
import { PencilLineIcon, UserCircleIcon } from "lucide-react";

import Card from "@/components/ui/card/Card";

/* Multi-select inline */
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

export interface PerfilImportacion {
    nombre: string;
    prioridad: string;
    estadoPerfil: string;

    importar: boolean;
    sincronizar: boolean;

    sellerScope: string;

    cuentas: string[];
    canales: string[];
    pickup: string[];
    tiposEnvio: string[];

    comentario: string;
}

interface Props {
    record: PerfilImportacion;
    readOnly?: boolean;
    onChange?: (field: keyof PerfilImportacion, value: any) => void;
    isCreate?: boolean;
}

export default function PerfilesImportacionFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: Props) {
    const handle = (field: keyof PerfilImportacion) => (value: any) => {
        if (!readOnly && onChange) onChange(field, value);
    };

    /* ---------------- MOCKS ---------------- */
    const cuentasMock = useMemo(
        () => [
            { label: "VTEX-B2C", value: "VTEX-B2C" },
            { label: "MERCADO-LIBRE-FULL", value: "MERCADO-LIBRE-FULL" },
            { label: "PORTAL-EMPRESAS", value: "PORTAL-EMPRESAS" },
            { label: "ML-MARKETPLACE", value: "ML-MARKETPLACE" },
        ],
        []
    );

    const canalesMock = useMemo(
        () => [
            { label: "WEB-B2C", value: "WEB-B2C" },
            { label: "MOBILE-APP", value: "MOBILE-APP" },
            { label: "WEB-B2B", value: "WEB-B2B" },
            { label: "ML-MARKETPLACE", value: "ML-MARKETPLACE" },
        ],
        []
    );

    const pickupMock = useMemo(
        () => [
            { label: "PICKUP-STORE-01", value: "PICKUP-STORE-01" },
            { label: "PICKUP-STORE-02", value: "PICKUP-STORE-02" },
        ],
        []
    );

    const tiposMock = useMemo(
        () => [
            { label: "DELIVERY", value: "DELIVERY" },
            { label: "SCHEDULED_DELIVERY", value: "SCHEDULED_DELIVERY" },
            { label: "PICKUP_IN_STORE", value: "PICKUP_IN_STORE" },
            { label: "CUSTOM", value: "CUSTOM" },
        ],
        []
    );

    const [search, setSearch] = useState({
        cuentas: "",
        canales: "",
        pickup: "",
        tipos: "",
    });

    /* ---------------- CHIP ---------------- */
    const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
        <span className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {label}
            <button onClick={onRemove} className="text-blue-600 hover:text-blue-900">×</button>
        </span>
    );

    /* ---------------- TOGGLE ---------------- */
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

    /* ---------------- USER MOCKS ---------------- */
    const mockUserCreator = {
        nombre: "Juan Pérez",
        correo: "juan.perez@mimbral.cl",
        fecha: "2025-11-10 14:22",
    };

    const mockUserUpdate = {
        nombre: "María López",
        correo: "maria.lopez@mimbral.cl",
        fecha: "2025-11-21 09:47",
    };

    /* =======================================================================
       RETURN 
    ======================================================================= */
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">

                {/* -------------------------------------------------------------- */}
                {/* COLUMNA IZQUIERDA (4/7)                                       */}
                {/* -------------------------------------------------------------- */}
                <div className="lg:col-span-4 space-y-6">

                    {/* ------------------------- DETALLE DEL PERFIL ------------------------- */}
                    <Card
                        title="DETALLE DEL PERFIL"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">

                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Nombre
                            </span>
                            <div className="col-span-5">
                                <input
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                />
                            </div>

                            {/* Prioridad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Prioridad
                            </span>
                            <div className="col-span-5">
                                <select
                                    value={record.prioridad}
                                    onChange={(e) => handle("prioridad")(e.target.value)}
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                >
                                    <option value="P1">P1</option>
                                    <option value="P2">P2</option>
                                    <option value="P3">P3</option>
                                </select>
                            </div>

                        </div>
                    </Card>

                    {/* ------------------------- PERMISOS ------------------------- */}
                    <Card
                        title="Permisos de importación"
                        icon={NumberedListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">

                            <span className="col-span-1 text-sm font-bold text-gray-600">
                                Importar órdenes
                            </span>
                            <div className="col-span-5">
                                <Toggle on={record.importar} onChange={handle("importar")} />
                                <div className="text-xs text-gray-500 mt-1">
                                    Permite recibir órdenes desde el canal
                                </div>
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-600">
                                Sincronizar órdenes
                            </span>
                            <div className="col-span-5">
                                <Toggle on={record.sincronizar} onChange={handle("sincronizar")} />
                                <div className="text-xs text-gray-500 mt-1">
                                    Habilita sincronizaciones automáticas
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* ------------------------- SCOPE ------------------------- */}
                    <Card
                        title="Alcance (scope)"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">

                            <span className="col-span-1 text-sm font-bold text-gray-600">
                                Seller Scope
                            </span>
                            <div className="col-span-5">
                                <select
                                    value={record.sellerScope}
                                    onChange={(e) => handle("sellerScope")(e.target.value)}
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                >
                                    <option value="any">any</option>
                                </select>
                            </div>

                            {/* Estado */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Estado
                            </span>
                            <div className="col-span-5">
                                <select
                                    value={record.estadoPerfil}
                                    onChange={(e) => handle("estadoPerfil")(e.target.value)}
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>

                        </div>
                    </Card>

                    {/* ------------------------- CUENTAS / CANALES / PICKUP / TIPOS ------------------------- */}
                    <Card
                        title="Cuentas, canales y puntos de retiro"
                        icon={ClipboardDocumentCheckIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">

                            {/* Cuentas */}
                            <span className="col-span-1 text-sm font-bold text-gray-600">Cuentas</span>
                            <div className="col-span-5 space-y-2">
                                <SelectSearchInline
                                    id="cuentas"
                                    value=""
                                    label="cuenta"
                                    options={cuentasMock}
                                    searchQuery={search.cuentas}
                                    onSearch={(q) => setSearch({ ...search, cuentas: q })}
                                    onChange={(v) => {
                                        if (!record.cuentas.includes(v))
                                            handle("cuentas")([...record.cuentas, v]);
                                    }}
                                />

                                <div className="flex flex-wrap gap-2">
                                    {record.cuentas.map((c) => (
                                        <Chip
                                            key={c}
                                            label={c}
                                            onRemove={() =>
                                                handle("cuentas")(record.cuentas.filter((x) => x !== c))
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Canales */}
                            <span className="col-span-1 text-sm font-bold text-gray-600">
                                Canales de venta
                            </span>
                            <div className="col-span-5 space-y-2">
                                <SelectSearchInline
                                    id="canales"
                                    value=""
                                    label="canal"
                                    options={canalesMock}
                                    searchQuery={search.canales}
                                    onSearch={(q) => setSearch({ ...search, canales: q })}
                                    onChange={(v) => {
                                        if (!record.canales.includes(v))
                                            handle("canales")([...record.canales, v]);
                                    }}
                                />

                                <div className="flex flex-wrap gap-2">
                                    {record.canales.map((c) => (
                                        <Chip
                                            key={c}
                                            label={c}
                                            onRemove={() =>
                                                handle("canales")(record.canales.filter((x) => x !== c))
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Pickup */}
                            <span className="col-span-1 text-sm font-bold text-gray-600">
                                Puntos de retiro
                            </span>
                            <div className="col-span-5 space-y-2">
                                <SelectSearchInline
                                    id="pickup"
                                    value=""
                                    label="pickup"
                                    options={pickupMock}
                                    searchQuery={search.pickup}
                                    onSearch={(q) => setSearch({ ...search, pickup: q })}
                                    onChange={(v) => {
                                        if (!record.pickup.includes(v))
                                            handle("pickup")([...record.pickup, v]);
                                    }}
                                />

                                <div className="flex flex-wrap gap-2">
                                    {record.pickup.map((p) => (
                                        <Chip
                                            key={p}
                                            label={p}
                                            onRemove={() =>
                                                handle("pickup")(record.pickup.filter((x) => x !== p))
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Tipos de envío */}
                            <span className="col-span-1 text-sm font-bold text-gray-600">
                                Tipos de envío
                            </span>
                            <div className="col-span-5 space-y-2">
                                <SelectSearchInline
                                    id="tiposEnvio"
                                    value=""
                                    label="tipo de envío"
                                    options={tiposMock}
                                    searchQuery={search.tipos}
                                    onSearch={(q) => setSearch({ ...search, tipos: q })}
                                    onChange={(v) => {
                                        if (!record.tiposEnvio.includes(v))
                                            handle("tiposEnvio")([...record.tiposEnvio, v]);
                                    }}
                                />

                                <div className="flex flex-wrap gap-2">
                                    {record.tiposEnvio.map((t) => (
                                        <Chip
                                            key={t}
                                            label={t}
                                            onRemove={() =>
                                                handle("tiposEnvio")(record.tiposEnvio.filter((x) => x !== t))
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                        </div>
                    </Card>

                    {/* ------------------------- NOTAS ------------------------- */}
                    <Card
                        title="Notas"
                        icon={PencilLineIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm font-bold text-gray-600">
                                Comentario interno
                            </span>
                            <div className="col-span-5">
                                <textarea
                                    rows={4}
                                    value={record.comentario}
                                    onChange={(e) => handle("comentario")(e.target.value)}
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent resize-none"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* -------------------------------------------------------------- */}
                {/* COLUMNA DERECHA         */}
                {/* -------------------------------------------------------------- */}
                {!isCreate && (
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
                                            {(mockUserCreator.nombre || "—")
                                                .split(/\s+/)
                                                .map((p) => p[0])
                                                .slice(0, 2)
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{mockUserCreator.nombre || "—"}</span>
                                            <span className="text-xs text-gray-500">{mockUserCreator.correo || ""}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className="text-xs text-gray-500">
                                        {mockUserCreator.fecha || "—"}
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
                                            {(mockUserCreator.nombre || "—")
                                                .split(/\s+/)
                                                .map((p) => p[0])
                                                .slice(0, 2)
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{mockUserCreator.nombre || "—"}</span>
                                            <span className="text-xs text-gray-500">{mockUserCreator.correo || ""}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className="text-xs text-gray-500">
                                        {mockUserCreator.fecha || "—"}
                                    </span>
                                </div>
                            </div>
                        </Card>

                    </div>
                )}
            </div>
        </div>
    );
}
