"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon as DocumentTextIcon,
    PlusIcon,
    UserIcon,
    Squares2X2Icon,
    QueueListIcon,
    CubeIcon,
    MapPinIcon,
    TagIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/user-avatar";

/* ===== Tipos (alineados a la UI de la captura y SellersFields) ===== */
export type ControlEstado =
    | "Pendiente de confirmación"
    | "En progreso"
    | "Completado"
    | "Rechazado";

export interface UserMini {
    username: string;
    email: string;
}

export type BackendStatus = "pendingConfirmation" | "inProgress" | "completed" | "rejected";

export interface StockControlPayloadItem {
    skuId: string;
    skuReferenceId: string;
    positionId: string;
    countedQuantity: number;
    positionKey: string;
    ean: string;
}

export interface WarehouseOption {
    id: string;
    name: string;
    referenceId?: string;
}

export interface StockControl {
    id: string;             // ID
    inventario: string;
    warehouseId?: string;
    backendStatus?: BackendStatus;
    payloadItems?: StockControlPayloadItem[];

    asignado: UserMini;
    reviewer: UserMini;

    items: number;
    posiciones: number;
    productos: number;

    estado: ControlEstado;
    usuario: UserMini;
    fecha: string;

    created: {
        username: string;
        email: string;
        date: string;
    };
}

/* ===== Helpers UI ===== */
const ESTADOS: ControlEstado[] = [
    "Pendiente de confirmación",
    "En progreso",
    "Completado",
    "Rechazado",
];

const StatusPill = ({ s }: { s: ControlEstado }) => {
    const color =
        s === "Pendiente de confirmación"
            ? "bg-amber-500"
            : s === "Completado"
                ? "bg-green-600"
                : s === "En progreso"
                    ? "bg-blue-600"
                    : "bg-rose-600";
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white ${color}`}>
            {s}
        </span>
    );
};

const UserLine = ({ user }: { user: UserMini }) => (
    <div className="flex items-start gap-3">
        <Avatar
            name={user?.username || user?.email || "-"}
            alt={user?.username || user?.email || "-"}
            className="h-8 w-8"
        />
        <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{user?.username || "—"}</span>
            <span className="text-xs text-gray-500">{user?.email || "—"}</span>
        </div>
    </div>
);

const CreatorBlock = ({ username, email, date }: { username: string; email: string; date: string }) => (
    <div className="flex items-start gap-3">
        <Avatar
            name={username || email || "-"}
            alt={username || email || "-"}
            className="h-8 w-8"
        />
        <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{username || "—"}</span>
            <span className="text-xs text-gray-500">{email || "—"}</span>
            <span className="text-xs text-gray-500">{date || "—"}</span>
        </div>
    </div>
);

// estado 
type Estado =
    | "Pendiente de confirmación"
    | "En progreso"
    | "Completado"
    | "Rechazado";

const stateColor = (s: Estado) =>
    s === "Pendiente de confirmación"
        ? "bg-amber-500"
        : s === "Completado"
            ? "bg-green-500"
            : s === "En progreso"
                ? "bg-blue-500"
                : "bg-rose-500";

export const ControlInventarioFields = ({
    record,
    readOnly = false,
    mode = "full",
    warehouseOptions = [],
    warehousesLoading = false,
    onChange,
}: {
    record: StockControl;
    readOnly?: boolean;
    mode?: "full" | "backend-create";
    warehouseOptions?: WarehouseOption[];
    warehousesLoading?: boolean;
    onChange?: <K extends keyof StockControl>(field: K, value: StockControl[K]) => void;
}) => {
    const set =
        <K extends keyof StockControl>(k: K) =>
            (v: StockControl[K]) =>
                onChange?.(k, v);

    if (mode === "backend-create") {
        const payloadItems = record.payloadItems || [];

        const updateItem = (index: number, patch: Partial<StockControlPayloadItem>) => {
            const next = payloadItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
            set("payloadItems")(next);
        };

        const addItem = () => {
            const next: StockControlPayloadItem[] = [
                ...payloadItems,
                {
                    skuId: "",
                    skuReferenceId: "",
                    positionId: "",
                    countedQuantity: 0,
                    positionKey: "",
                    ean: "",
                },
            ];
            set("payloadItems")(next);
        };

        const removeItem = (index: number) => {
            const next = payloadItems.filter((_, idx) => idx !== index);
            set("payloadItems")(next);
        };

        return (
            <div className="space-y-6">
                <Card
                    title="DETALLE"
                    icon={DocumentTextIcon}
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl p-6"
                >
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-600">Warehouse ID</label>
                            {warehouseOptions.length > 0 ? (
                                <select
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                                    value={record.warehouseId || ""}
                                    onChange={(e) => set("warehouseId")(e.target.value)}
                                    disabled={readOnly || warehousesLoading}
                                >
                                    <option value="">Selecciona un warehouse</option>
                                    {warehouseOptions.map((warehouse) => (
                                        <option key={warehouse.id} value={warehouse.id}>
                                            {warehouse.referenceId ? `${warehouse.referenceId} - ` : ""}{warehouse.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    value={record.warehouseId || ""}
                                    onChange={(e) => set("warehouseId")(e.target.value)}
                                    disabled={readOnly}
                                    placeholder="3bcba741-5e5f-4a3f-b716-74f57a7bf88f"
                                />
                            )}
                            {warehousesLoading && (
                                <p className="mt-1 text-xs text-gray-500">Cargando warehouses...</p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card
                    title="ITEMS"
                    icon={CubeIcon}
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl p-6"
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">SKU ID</th>
                                    <th className="px-3 py-2">SKU Ref ID</th>
                                    <th className="px-3 py-2">Position ID</th>
                                    <th className="px-3 py-2 text-right">Counted Qty</th>
                                    <th className="px-3 py-2">Position Key</th>
                                    <th className="px-3 py-2">EAN</th>
                                    <th className="px-3 py-2 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payloadItems.map((item, index) => (
                                    <tr key={`${index}-${item.skuId}`} className="border-t border-gray-100">
                                        <td className="px-3 py-2">
                                            <input
                                                className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-blue-500"
                                                value={item.skuId}
                                                onChange={(e) => updateItem(index, { skuId: e.target.value })}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-blue-500"
                                                value={item.skuReferenceId}
                                                onChange={(e) => updateItem(index, { skuReferenceId: e.target.value })}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-blue-500"
                                                value={item.positionId}
                                                onChange={(e) => updateItem(index, { positionId: e.target.value })}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min={0}
                                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-right outline-none focus:border-blue-500"
                                                value={item.countedQuantity}
                                                onChange={(e) => updateItem(index, { countedQuantity: Number(e.target.value || 0) })}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-blue-500"
                                                value={item.positionKey}
                                                onChange={(e) => updateItem(index, { positionKey: e.target.value })}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                className="w-full rounded border border-gray-300 px-2 py-1.5 outline-none focus:border-blue-500"
                                                value={item.ean}
                                                onChange={(e) => updateItem(index, { ean: e.target.value })}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                disabled={readOnly}
                                                className="inline-flex items-center rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                                            >
                                                <TrashIcon className="mr-1 h-4 w-4" /> Quitar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={addItem}
                            disabled={readOnly}
                            className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        >
                            <PlusIcon className="mr-1 h-4 w-4" /> Agregar item
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={DocumentTextIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* ID */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">ID</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.id}
                                    onChange={(e) => set("id")(e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>

                            {/* Inventario */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Inventario</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.inventario}
                                    onChange={(e) => set("inventario")(e.target.value)}
                                    disabled={readOnly}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </Card>

                    {/* USUARIO */}
                    <Card
                        title="USUARIO"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-6">
                            {/* Asignado */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Asignado</span>
                            <div className="col-span-5">
                                <UserLine user={record.asignado} />
                            </div>

                            {/* Reviewer */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Reviewer</span>
                            <div className="col-span-5">
                                <UserLine user={record.reviewer} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="TOTALES"
                        icon={Squares2X2Icon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="space-y-4">
                            {[
                                { label: "Items", icon: <CubeIcon className="h-4 w-4" />, value: record.items },
                                { label: "Posiciones", icon: <MapPinIcon className="h-4 w-4" />, value: record.posiciones },
                                { label: "Productos", icon: <TagIcon className="h-4 w-4" />, value: record.productos },
                            ].map(({ label, icon, value }) => (
                                <div key={label} className="grid grid-cols-[120px_auto] items-center">
                                    <span className="text-sm text-gray-600 font-bold">{label}</span>
                                    <div className="flex items-center gap-2">
                                        {/* ícono dentro de burbuja y contador en píldora */}
                                        <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 gap-1">
                                            {icon}
                                            {value}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>


                    {/* STEPS */}
                    <Card
                        title="STEPS"
                        icon={QueueListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-6">
                            {/* Estado */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-4">
                                <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${stateColor(record.estado)}`}>
                                    {record.estado}
                                </div>
                            </div>

                            {/* Usuario */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Usuario</span>
                            <div className="col-span-4">
                                <UserLine user={record.usuario} />
                            </div>

                            {/* Fecha */}
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Fecha</span>
                            <div className="col-span-4">
                                <input
                                    type="datetime-local"
                                    className="bg-transparent text-sm text-gray-900 outline-none disabled:bg-transparent disabled:text-gray-900"
                                    value={record.fecha}
                                    readOnly
                                    disabled
                                />
                            </div>
                        </div>
                    </Card>

                    {/* USUARIO CREADOR  */}
                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <CreatorBlock
                            username={record.created.username}
                            email={record.created.email}
                            date={record.created.date}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
};
