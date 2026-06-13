// app/views/Organizacion/OrganizacionView.tsx
"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { CheckCircleIcon, ChevronDownIcon, ClipboardDocumentListIcon, LockClosedIcon, PencilIcon, PlusIcon, UserIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";

import { FaPlus } from "react-icons/fa";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { useRouter } from "next/navigation";

type Status = "Activo" | "Inactivo";

interface OrgRecord {
    nombre: string;
    modalidad: string;
    clients: string;
    status: Status;
    created?: { username: string; email: string; date: string };
    modified?: { username: string; email: string; date: string };

    colorPrimary: string;   // #e70c6e
    colorSecondary: string; // #fbfaf8

    // Políticas de contraseña
    activarReglas: boolean;
    minPasswordLength: string;
    forbiddenWords: string;
    requireSpecialChars: boolean;
    requireMixedCase: boolean;
    requireNumbers: boolean;
    disallowPersonalData: boolean;
    disallowConsecutive: boolean;

    // Sesiones
    duracionHoras: string;

    // Bloque adicional (en DETALLE)
    disablePasswordAccess: boolean;
    organization: string;
}

const initial: OrgRecord = {
    nombre: "",
    modalidad: "",
    clients: "",
    colorPrimary: "#e70c6e",
    colorSecondary: "#fbfaf8",

    activarReglas: false,
    minPasswordLength: "",
    forbiddenWords: "",
    requireSpecialChars: false,
    requireMixedCase: false,
    requireNumbers: false,
    disallowPersonalData: false,
    disallowConsecutive: false,

    duracionHoras: "",
    disablePasswordAccess: false,
    organization: "",

    status: "Activo",
    created: { username: "", email: "", date: "" },
    modified: { username: "", email: "", date: "" },
};

export function OrganizacionView() {
    const router = useRouter();

    const [record, setRecord] = useState<OrgRecord>({
        nombre: "Fizzmod",
        modalidad: "fizzmodarg",
        clients: "Fizzmod",

        colorPrimary: "#e70c6e",
        colorSecondary: "#fbfaf8",

        activarReglas: true,
        minPasswordLength: "3",
        forbiddenWords: "",
        requireSpecialChars: false,
        requireMixedCase: false,
        requireNumbers: false,
        disallowPersonalData: false,
        disallowConsecutive: false,

        duracionHoras: "",

        disablePasswordAccess: false,
        organization: "Fizzmod",

        status: "Activo",
        created: {
            username: "Francisco Mato",
            email: "francisco@fizzmod…",
            date: "09/03/2022 16:31:38",
        },
        modified: {
            username: "Guillermina Cip…",
            email: "guillermina.cipri…",
            date: "06/04/2022 14:12:04",
        },
    });

    const handle =
        (field: keyof OrgRecord) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                const value =
                    e.target.type === "checkbox"
                        ? (e.target as HTMLInputElement).checked
                        : e.target.value;
                setRecord((r) => ({ ...r, [field]: value as any }));
            };

    const isNew = !record.created?.username;

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => console.log("Aplicar sin cerrar", record),
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Guardar", record),
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => {
                    console.log("Guardar y limpiar", record);
                    setRecord(initial);
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/Pricing/Price"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: "Organización",
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    const rulesDisabled = !record.activarReglas;

    // helper para el puntito de color (cae a transparente si el valor no es válido)
    const swatch = (hex: string) =>
        /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex) ? hex : "transparent";
    return (
        <div className="space-y-6 bg-[#ffffff]">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* ─── LEFT (span 2 cols) ─── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    value={record.nombre}
                                    onChange={handle("nombre")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Clients</span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    value={record.clients}
                                    onChange={handle("clients")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* POLÍTICA DE CONTRASEÑAS */}
                    <Card
                        title="POLÍTICA DE CONTRASEÑAS"
                        icon={LockClosedIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4 items-center">
                            {/* Activar reglas */}
                            <span className="col-span-1 text-sm text-gray-600">
                                Activar reglas
                            </span>
                            <div className="col-span-5">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={record.activarReglas}
                                        onChange={handle("activarReglas")}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-900 select-none">
                                        {record.activarReglas ? "Sí" : "No"}
                                    </span>
                                </label>
                            </div>

                            {/* Extensión (Min.) */}
                            <span
                                className={`col-span-1 text-sm ${rulesDisabled ? "text-gray-400" : "text-gray-600"
                                    }`}
                            >
                                Extensión (Min.)
                            </span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="3"
                                    value={record.minPasswordLength}
                                    onChange={handle("minPasswordLength")}
                                    disabled={rulesDisabled}
                                    className={`w-40 border-b focus:outline-none text-sm ${rulesDisabled
                                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                        : "border-gray-300 text-gray-900"
                                        }`}
                                />
                            </div>

                            {/* Palabras prohibidas */}
                            <span
                                className={`col-span-1 text-sm ${rulesDisabled ? "text-gray-400" : "text-gray-600"
                                    }`}
                            >
                                Palabras prohibidas
                            </span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    placeholder='Ej: "janis, admin, root"'
                                    value={record.forbiddenWords}
                                    onChange={handle("forbiddenWords")}
                                    disabled={rulesDisabled}
                                    className={`w-full border-b focus:outline-none text-sm ${rulesDisabled
                                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                        : "border-gray-300 text-gray-900"
                                        }`}
                                />
                            </div>

                            {/* Checks fila 1 */}
                            <div className="col-span-3">
                                <label
                                    className={`inline-flex items-center gap-2 ${rulesDisabled ? "opacity-50" : ""
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={record.requireSpecialChars}
                                        onChange={handle("requireSpecialChars")}
                                        disabled={rulesDisabled}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-gray-900">
                                        Requiere caracteres especiales
                                    </span>
                                </label>
                            </div>
                            <div className="col-span-3">
                                <label
                                    className={`inline-flex items-center gap-2 ${rulesDisabled ? "opacity-50" : ""
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={record.requireMixedCase}
                                        onChange={handle("requireMixedCase")}
                                        disabled={rulesDisabled}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-gray-900">
                                        Requiere mayúsculas y minúsculas
                                    </span>
                                </label>
                            </div>

                            {/* Checks fila 2 */}
                            <div className="col-span-3">
                                <label
                                    className={`inline-flex items-center gap-2 ${rulesDisabled ? "opacity-50" : ""
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={record.requireNumbers}
                                        onChange={handle("requireNumbers")}
                                        disabled={rulesDisabled}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-gray-900">
                                        Requiere números
                                    </span>
                                </label>
                            </div>
                            <div className="col-span-3">
                                <label
                                    className={`inline-flex items-center gap-2 ${rulesDisabled ? "opacity-50" : ""
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={record.disallowPersonalData}
                                        onChange={handle("disallowPersonalData")}
                                        disabled={rulesDisabled}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-gray-900">
                                        No permitir datos personales
                                    </span>
                                </label>
                            </div>

                            {/* Check fila 3 */}
                            <div className="col-span-3">
                                <label
                                    className={`inline-flex items-center gap-2 ${rulesDisabled ? "opacity-50" : ""
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={record.disallowConsecutive}
                                        onChange={handle("disallowConsecutive")}
                                        disabled={rulesDisabled}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-gray-900">
                                        No permitir números consecutivos
                                    </span>
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* POLÍTICA DE SESIONES */}
                    <Card
                        title="POLÍTICA DE SESIONES"
                        icon={LockClosedIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4 items-center">
                            <span className="col-span-1 text-sm text-gray-600">
                                Duración (horas)
                            </span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    min={0}
                                    value={record.duracionHoras}
                                    onChange={handle("duracionHoras")}
                                    className="w-40 border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    value={record.nombre}
                                    onChange={handle("nombre")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            {/* Modalidad */}
                            <span className="col-span-1 text-sm text-gray-600">Modalidad</span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    value={record.modalidad}
                                    onChange={handle("modalidad")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            {/* Colores en una fila (1+2, 1+2 = 6) */}
                            <span className="col-span-1 text-sm text-gray-600">
                                Color principal
                            </span>
                            <div className="col-span-2">
                                <div className="flex items-center gap-3">
                                    <span
                                        className="h-4 w-4 rounded-full border border-gray-300"
                                        style={{ backgroundColor: swatch(record.colorPrimary) }}
                                        aria-hidden
                                    />
                                    <input
                                        type="text"
                                        value={record.colorPrimary}
                                        onChange={handle("colorPrimary")}
                                        placeholder="#e70c6e"
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                </div>
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">
                                Color secundario
                            </span>
                            <div className="col-span-2">
                                <div className="flex items-center gap-3">
                                    <span
                                        className="h-4 w-4 rounded-full border border-gray-300"
                                        style={{ backgroundColor: swatch(record.colorSecondary) }}
                                        aria-hidden
                                    />
                                    <input
                                        type="text"
                                        value={record.colorSecondary}
                                        onChange={handle("colorSecondary")}
                                        placeholder="#fbfaf8"
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                </div>
                            </div>

                            {/* Desactivar acceso por contraseña (toggle) */}
                            <span className="col-span-1 text-sm text-gray-600">
                                Desactivar acceso por contraseña
                            </span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.disablePasswordAccess}
                                    onClick={() =>
                                        setRecord((r) => ({
                                            ...r,
                                            disablePasswordAccess: !r.disablePasswordAccess,
                                        }))
                                    }
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.disablePasswordAccess ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.disablePasswordAccess
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Organización (input + acciones) */}
                            <span className="col-span-1 text-sm text-gray-600">
                                Organización
                            </span>
                            <div className="col-span-5">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={record.organization}
                                        onChange={handle("organization")}
                                        className="w-full border-b border-gray-300 pr-12 focus:outline-none text-sm text-gray-900"
                                    />
                                    {/* limpiar */}
                                    <button
                                        type="button"
                                        className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setRecord((r) => ({ ...r, organization: "" }))}
                                        aria-label="Limpiar"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                    {/* desplegar */}
                                    <button
                                        type="button"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        aria-label="Abrir selector"
                                    >
                                        <ChevronDownIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* acciones debajo: Editar / Nuevo */}
                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-full bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Nuevo
                                    </button>
                                </div>
                            </div>
                        </div>
                        <br />
                    </Card>
                </div>

                {/* ─── RIGHT COLUMN ─── */}
                <div className="space-y-6">
                    <Card
                        title="OTROS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4 items-center">
                            <span className="col-span-2 text-sm text-gray-600">Status</span>
                            <div className="col-span-4">
                                <select
                                    value={record.status}
                                    onChange={handle("status")}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {isNew ? (
                            <span className="text-sm text-gray-500">—</span>
                        ) : (
                            <>
                                <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                                {record?.created?.username
                                                    ?.split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-semibold text-blue-600">
                                                    {record?.created?.username}
                                                </div>
                                                <div className="text-gray-500 truncate max-w-[200px]">
                                                    {record?.created?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-sm text-gray-500 text-right truncate">
                                        {record?.created?.date}
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>

                    <Card
                        title="ÚLTIMA MODIFICACIÓN"
                        icon={PencilIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        {record.modified ? (
                            <>
                                <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                                {record?.modified?.username
                                                    ?.split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-semibold text-blue-600">
                                                    {record?.modified?.username}
                                                </div>
                                                <div className="text-gray-500 truncate max-w-[200px]">
                                                    {record?.modified?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-sm text-gray-500 text-right truncate">
                                        {record?.modified?.date}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <span className="text-sm text-gray-500">—</span>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
