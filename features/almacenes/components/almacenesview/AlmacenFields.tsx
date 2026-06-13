// views\Almacen\AlmacenesView\components\AlmacenFields.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserIcon,
    PencilIcon,
    Square3Stack3DIcon,
    CubeIcon,
    ShoppingBagIcon,
    ArrowPathRoundedSquareIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { StoreIcon, Triangle } from "lucide-react";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { useFetchWithAuth } from "@/lib/http/client";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import {
    COMMERCE_SERVICE_LOCATIONS_SIMPLE,
    WAREHOUSE_GROUP_API,
    WAREHOUSE_PICKUP_POINT_API,
} from "@/lib/http/endpoints";

import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

type ApiPickupPoint = {
    id: string;
    referenceId?: string | null;
    accountId?: string | null;
    name?: string | null;
    address?: {
        country?: string | null;
        state?: string | null;
        city?: string | null;
    } | null;
    latitude?: number | null;
    longitude?: number | null;
    thirdParty?: boolean | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
};

type ApiLocationSimpleItem = {
    id?: string | number | null;
    storeId?: string | number | null;
    name?: string | null;
    referenceId?: string | null;
};

type ApiWarehouseGroupItem = {
    id?: string | null;
    name?: string | null;
    location?: string | null;
    status?: string | null;
};

/* ---------- tipos ---------- */
export type Estado = "Activo" | "Inactivo";

export interface Warehouse {
    pickuppointsIds: string;
    canalesVentaPicking: string;
    // DETALLE
    name: string;
    refId: string;
    location: string;
    group: string;
    canalesVenta: string; // coma-separados en modo edición
    tareas: string;       // coma-separados en modo edición
    limitarSellers: string; // "true" | "false" para mantener onChange<string>
    status: Estado;

    // ESQUEMAS
    inbound: string;
    slotting: string;
    consolidacion: string;
    outbound: string;
    cambiosDevoluciones: string;

    // POSICIONES TOTALES
    slots?: string;            // números como string para onChange<string>
    ocupacionPercent?: string; // idem

    // DISTRIBUCIÓN DE PEDIDOS
    prioridad?: string;

    // LÍMITES POR SPRINT
    maxPedidos?: string;
    bultos?: string;
    items?: string;

    // ESTADÍSTICAS (normalmente read-only)
    movimientosPendientes?: string;
    porWarehouse?: string;
    pedidosCount?: string;
    bultosCount?: string;
    itemsCount?: string;

    created?: { username: string; email?: string; date: string };
    modified?: { username: string; email?: string; date: string };
}

interface Props {
    record: Warehouse;
    onChange?: (field: keyof Warehouse, value: string) => void;
    hideMetaSections?: boolean;
}

const StatsPill = ({
    icon,
    value,
}: {
    icon: React.ReactNode;
    value?: string | number | null;
}) => {
    const display =
        value === undefined || value === null || String(value).trim() === ""
            ? "-"
            : value;

    return (
        <div className="inline-flex items-center rounded-full border border-gray-300 px-1 py-1">
            <span className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300">
                <span className="h-4 w-4 text-gray-700">{icon}</span>
            </span>
            <span className="ml-1 inline-flex h-7 min-w-[28px] items-center justify-center rounded-full border border-gray-300 px-2 text-sm text-gray-800">
                {display}
            </span>
        </div>
    );
};


/* ---------- componente ---------- */
export const AlmacenFields: React.FC<Props> = ({
    record,
    onChange,
    hideMetaSections = false,
}) => {
    const handle =
        (field: keyof Warehouse) =>
            (
                e:
                    | React.ChangeEvent<HTMLInputElement>
                    | React.ChangeEvent<HTMLSelectElement>
                    | React.ChangeEvent<HTMLTextAreaElement>
            ) => {
                // Para checkbox devolvemos "true"/"false" como string para respetar la firma
                const v =
                    e.target.type === "checkbox"
                        ? (e.target as HTMLInputElement).checked
                            ? "true"
                            : "false"
                        : e.target.value;
                onChange?.(field, v);
            };

    const handleCollapsible = (field: keyof Warehouse) => (v: any) => onChange?.(field, v)

    const isNew = !record.created?.username;

    // Carga de canales (mismo patrón que CommerceAccountsFields)
    const { fetchWithAuth } = useFetchWithAuth();
    const [channels, setChannels] = useState<Array<{ Id: number; Name: string }>>([]);
    const [channelSearch, setChannelSearch] = useState("");
    const [loadingChannels, setLoadingChannels] = useState(false);

    // ── Ubicación (locations simple)
    const [locationSearch, setLocationSearch] = useState("");
    const [locationOptions, setLocationOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    // ── Grupo de warehouse
    const [groupSearch, setGroupSearch] = useState("");
    const [groupOptions, setGroupOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // ── Canales de venta para picking (mock, sin endpoint)
    const [pickingChannelSearch, setPickingChannelSearch] = useState("");
    const pickingChannelOptions = useMemo(
        () => [
            { label: "Seleccione canal…", value: "" },
            ...Array.from({ length: 5 }, (_, i) => ({
                label: `Canal de venta para picking ${i + 1}`,
                value: String(i + 1),
            })),
        ],
        []
    );
    const visiblePickingChannelOptions = useMemo(() => {
        const q = pickingChannelSearch.trim().toLowerCase();
        return pickingChannelOptions.filter((o) =>
            (o.label + " " + o.value).toLowerCase().includes(q)
        );
    }, [pickingChannelOptions, pickingChannelSearch]);

    // ── Pickup points ids
    const [pickingPointSearch, setPickingPointSearch] = useState("");
    const [pickupPoints, setPickupPoints] = useState<ApiPickupPoint[]>([]);
    const [loadingPickupPoints, setLoadingPickupPoints] = useState(false);
    const pickingPointOptions = useMemo(
        () => [
            { label: "Seleccione pickup point…", value: "" },
            ...pickupPoints
                .filter((pp) => String(pp.status || "").toLowerCase() === "active")
                .map((pp) => ({
                    label: `${pp.referenceId || pp.id} - ${pp.name || "Sin nombre"}`,
                    value: String(pp.id),
                })),
        ],
        [pickupPoints]
    );
    const visiblePickingPointOptions = useMemo(() => {
        const q = pickingPointSearch.trim().toLowerCase();
        return pickingPointOptions.filter((o) =>
            (o.label + " " + o.value).toLowerCase().includes(q)
        );
    }, [pickingPointOptions, pickingPointSearch]);


    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoadingChannels(true);
                const res = await fetchWithAuth<{ ok: boolean; data: any[] }>(
                    "comerce-service/sales-channel/Listar?page=1&pageSize=200&isActive=1"
                );
                if (!mounted) return;
                const rows = Array.isArray(res?.data) ? res.data : [];
                setChannels(rows.map((r: any) => ({ Id: Number(r.Id), Name: String(r.Name ?? `#${r.Id}`) })));
            } catch (e) {
                console.error("Error listando canales:", e);
                setChannels([]);
            } finally {
                if (mounted) setLoadingChannels(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [fetchWithAuth]);

    useEffect(() => {
        let mounted = true;
        const loadLocations = async () => {
            try {
                setLoadingLocations(true);
                const res = await fetchWithAuth<{ total?: number; items?: ApiLocationSimpleItem[] }>(
                    COMMERCE_SERVICE_LOCATIONS_SIMPLE,
                    { method: "GET" }
                );

                if (!mounted) return;
                const items = Array.isArray(res?.items) ? res.items : [];
                const options = items
                    .map((item) => {
                        const id = String(item?.id ?? "").trim();
                        if (!id) return null;
                        const name = String(item?.name ?? "").trim();
                        const referenceId = String(item?.referenceId ?? "").trim();
                        const label = referenceId && name ? `${referenceId} - ${name}` : name || referenceId || id;
                        return { label, value: id };
                    })
                    .filter(Boolean) as Array<{ label: string; value: string }>;

                setLocationOptions(options);
            } catch (e) {
                console.error("Error listando ubicaciones:", e);
                if (mounted) setLocationOptions([]);
            } finally {
                if (mounted) setLoadingLocations(false);
            }
        };

        loadLocations();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    useEffect(() => {
        let mounted = true;
        const loadGroups = async () => {
            try {
                setLoadingGroups(true);
                const res = await fetchWithAuth<ApiWarehouseGroupItem[]>(
                    WAREHOUSE_GROUP_API,
                    { method: "GET" }
                );

                if (!mounted) return;
                const rows = Array.isArray(res) ? res : [];
                const options = rows
                    .filter((item) => String(item?.status ?? "").toLowerCase() === "active")
                    .map((item) => {
                        const id = String(item?.id ?? "").trim();
                        const name = String(item?.name ?? "").trim();
                        return id ? { label: name || id, value: id } : null;
                    })
                    .filter(Boolean) as Array<{ label: string; value: string }>;

                setGroupOptions(options);
            } catch (e) {
                console.error("Error listando grupos de warehouse:", e);
                if (mounted) setGroupOptions([]);
            } finally {
                if (mounted) setLoadingGroups(false);
            }
        };

        loadGroups();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    useEffect(() => {
        let mounted = true;
        const loadPickupPoints = async () => {
            try {
                setLoadingPickupPoints(true);
                const res = await fetch(WAREHOUSE_PICKUP_POINT_API, {
                    method: "GET",
                    headers: withAuthPlatformHeaders(),
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const rows = (await res.json()) as ApiPickupPoint[];
                if (!mounted) return;
                setPickupPoints(Array.isArray(rows) ? rows : []);
            } catch (e) {
                console.error("Error listando pickup points:", e);
                if (mounted) setPickupPoints([]);
            } finally {
                if (mounted) setLoadingPickupPoints(false);
            }
        };

        loadPickupPoints();
        return () => {
            mounted = false;
        };
    }, []);

    const channelOptions = useMemo(
        () => [
            { label: "Seleccione canal…", value: "" },
            ...channels.map((c) => ({ label: `${c.Name}`, value: String(c.Id) })),
        ],
        [channels]
    );

    const selectedSalesChannelIds = useMemo(
        () =>
            String(record.canalesVenta ?? "")
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
        [record.canalesVenta]
    );

    const channelLabelById = useMemo(
        () => new Map(channelOptions.map((o) => [String(o.value), o.label])),
        [channelOptions]
    );

    const visibleChannelOptions = useMemo(() => {
        const q = channelSearch.trim().toLowerCase();
        if (!q) return channelOptions;
        return channelOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [channelOptions, channelSearch]);

    const visibleLocationOptions = useMemo(() => {
        const q = locationSearch.trim().toLowerCase();
        const withDefault = [{ label: "Seleccione ubicación…", value: "" }, ...locationOptions];
        if (!q) return withDefault;
        return withDefault.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [locationOptions, locationSearch]);

    const visibleGroupOptions = useMemo(() => {
        const q = groupSearch.trim().toLowerCase();
        const withDefault = [{ label: "Seleccione grupo…", value: "" }, ...groupOptions];
        if (!q) return withDefault;
        return withDefault.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [groupOptions, groupSearch]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/** ─── LEFT (span 2 cols) ─── */}
                <div className="lg:col-span-2 space-y-6">
                    {/** DETALLE */}
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
                                    value={record.name}
                                    onChange={handle("name")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Ref ID</span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    value={record.refId}
                                    onChange={handle("refId")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Ubicación</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="warehouse-location"
                                    label="Ubicación"
                                    value={record.location ?? ""}
                                    options={visibleLocationOptions}
                                    searchQuery={locationSearch}
                                    loading={loadingLocations}
                                    onSearch={setLocationSearch}
                                    onChange={(value) => onChange?.("location", String(value ?? ""))}
                                    placeholderFromDefault
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Grupo</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="warehouse-group"
                                    label="Grupo"
                                    value={record.group ?? ""}
                                    options={visibleGroupOptions}
                                    searchQuery={groupSearch}
                                    loading={loadingGroups}
                                    onSearch={setGroupSearch}
                                    onChange={(value) => onChange?.("group", String(value ?? ""))}
                                    placeholderFromDefault
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">
                                Canales de venta
                            </span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="warehouse-sales-channel"
                                    label="Canal"
                                    value=""
                                    options={visibleChannelOptions}
                                    searchQuery={channelSearch}
                                    loading={loadingChannels}
                                    onSearch={setChannelSearch}
                                    onChange={(val /*, label*/) => {
                                        if (!val) return;
                                        const next = selectedSalesChannelIds.includes(val)
                                            ? selectedSalesChannelIds
                                            : [...selectedSalesChannelIds, val];
                                        onChange?.("canalesVenta", next.join(","));
                                        setChannelSearch("");
                                    }}
                                    placeholderFromDefault
                                />

                                {selectedSalesChannelIds.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedSalesChannelIds.map((id) => (
                                            <span
                                                key={id}
                                                className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                                            >
                                                {channelLabelById.get(id) ?? `Canal ${id}`}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = selectedSalesChannelIds.filter((x) => x !== id);
                                                        onChange?.("canalesVenta", next.join(","));
                                                    }}
                                                    className="text-indigo-400 hover:text-indigo-600"
                                                >
                                                    <XCircleIcon className="h-5 w-5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">
                                Canales de venta para picking
                            </span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="warehouse-picking-sales-channel"
                                    label="Canal de venta para picking"
                                    value={record.canalesVentaPicking ?? ""}
                                    options={visiblePickingChannelOptions}
                                    searchQuery={pickingChannelSearch}
                                    loading={false}
                                    onSearch={setPickingChannelSearch}
                                    onChange={(val /*, label*/) => onChange?.("canalesVentaPicking", val || "")}
                                    placeholderFromDefault
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Tareas</span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    value={record.tareas}
                                    onChange={handle("tareas")}
                                    placeholder="Pick products, Ships orders, ..."
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">
                                Limitar sellers
                            </span>
                            <div className="col-span-5">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={record.limitarSellers === "true"}
                                        onChange={handle("limitarSellers")}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-900 select-none">
                                        {record.limitarSellers === "true" ? "Sí" : "No"}
                                    </span>
                                </label>
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">
                                Pickup points ids
                            </span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="warehouse-picking-point-id"
                                    label="Pickup point id"
                                    value={record.pickuppointsIds ?? ""}      // selección única
                                    options={visiblePickingPointOptions}
                                    searchQuery={pickingPointSearch}
                                    loading={loadingPickupPoints}
                                    onSearch={setPickingPointSearch}
                                    onChange={(val /*, label*/) => onChange?.("pickuppointsIds", val || "")}
                                    placeholderFromDefault
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Status</span>
                            <div className="col-span-5">
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

                    {/** DISTRIBUCIÓN DE PEDIDOS */}
                    <Card
                        title="DISTRIBUCIÓN DE PEDIDOS"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600">Prioridad</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    value={record.prioridad ?? ""}
                                    onChange={handle("prioridad")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>
                        </div>
                    </Card>

                    {/** LÍMITES POR SPRINT */}
                    <Card
                        title="LÍMITES POR SPRINT"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600">Máx. pedidos</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    value={record.maxPedidos ?? ""}
                                    onChange={handle("maxPedidos")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Bultos</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    value={record.bultos ?? ""}
                                    onChange={handle("bultos")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600">Ítems</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    value={record.items ?? ""}
                                    onChange={handle("items")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/** ─── RIGHT COLUMN ─── */}
                <div className="space-y-6">
                    {/** ESQUEMAS */}
                    <Card
                        title="ESQUEMAS"
                        icon={Square3Stack3DIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-3 text-sm text-gray-600">
                                Ingreso (Inbound)
                            </span>
                            <div className="col-span-3">
                                <CollapsibleField
                                    label="Ingreso (Inbound)"
                                    value={record.inbound}
                                    options={["Inbound"]}
                                    onChange={handleCollapsible("inbound")}
                                    inline
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600">Slotting</span>
                            <div className="col-span-3">
                                <CollapsibleField
                                    label="Darkstore Slotting"
                                    value={record.slotting}
                                    options={["Darkstore Slotting"]}
                                    onChange={handleCollapsible("slotting")}
                                    inline
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600">
                                Consolidación
                            </span>
                            <div className="col-span-3">
                                <CollapsibleField
                                    label="Consolidación Darkstore"
                                    value={record.consolidacion}
                                    options={["Consolidación Darkstore"]}
                                    onChange={handleCollapsible("consolidacion")}
                                    inline
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600">
                                Salida (Outbound)
                            </span>
                            <div className="col-span-3">
                                <CollapsibleField
                                    label="Outbound Darkstore"
                                    value={record.outbound}
                                    options={["Outbound Darkstore"]}
                                    onChange={handleCollapsible("outbound")}
                                    inline
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600">
                                Cambios y devoluciones
                            </span>
                            <div className="col-span-3">
                                <CollapsibleField
                                    label="Cambios y Devoluciones"
                                    value={record.cambiosDevoluciones}
                                    options={["Holding and Return"]}
                                    onChange={handleCollapsible("cambiosDevoluciones")}
                                    inline
                                />
                            </div>
                        </div>
                    </Card>

                    {/** POSICIONES TOTALES */}
                    <Card
                        title="POSICIONES TOTALES"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-3 text-sm text-gray-600">Slots</span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    value={record.slots ?? "0"}
                                    onChange={handle("slots")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>

                            <span className="col-span-3 text-sm text-gray-600">
                                Ocupación (%)
                            </span>
                            <div className="col-span-3">
                                <input
                                    type="number"
                                    value={record.ocupacionPercent ?? "0"}
                                    onChange={handle("ocupacionPercent")}
                                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                />
                            </div>
                        </div>
                    </Card>

                    {!hideMetaSections && (
                        <>
                            {/** ESTADÍSTICAS */}
                            <Card
                                title="ESTADÍSTICAS"
                                icon={ClipboardDocumentListIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-6 gap-4 items-center">
                                    <span className="col-span-4 text-sm text-gray-600">Movimientos pendientes</span>
                                    <div className="col-span-2">
                                        <StatsPill
                                            icon={<ArrowPathRoundedSquareIcon className="h-4 w-4" />}
                                            value={record.movimientosPendientes}
                                        />
                                    </div>

                                    <span className="col-span-4 text-sm text-gray-600">Por warehouse</span>
                                    <div className="col-span-2">
                                        <StatsPill
                                            icon={<StoreIcon className="h-4 w-4" />}
                                            value={record.porWarehouse}
                                        />
                                    </div>

                                    <span className="col-span-4 text-sm text-gray-600">Pedidos</span>
                                    <div className="col-span-2">
                                        <StatsPill
                                            icon={<CubeIcon className="h-4 w-4" />}
                                            value={record.pedidosCount}
                                        />
                                    </div>

                                    <span className="col-span-4 text-sm text-gray-600">Bultos</span>
                                    <div className="col-span-2">
                                        <StatsPill
                                            icon={<ShoppingBagIcon className="h-4 w-4" />}
                                            value={record.bultosCount}
                                        />
                                    </div>

                                    <span className="col-span-4 text-sm text-gray-600">Ítems</span>
                                    <div className="col-span-2">
                                        <StatsPill
                                            icon={<Triangle className="h-4 w-4" />}
                                            value={record.itemsCount}
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/** USUARIO CREADOR */}
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
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-900">
                                                {record.created!.username}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {record.created!.date}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {record.created!.email}
                                        </span>
                                    </>
                                )}
                            </Card>

                            {/** ÚLTIMA MODIFICACIÓN */}
                            <Card
                                title="ÚLTIMA MODIFICACIÓN"
                                icon={PencilIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                {record.modified ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-900">
                                                {record.modified.username}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {record.modified.date}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {record.modified.email}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-500">—</span>
                                )}
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlmacenFields;
