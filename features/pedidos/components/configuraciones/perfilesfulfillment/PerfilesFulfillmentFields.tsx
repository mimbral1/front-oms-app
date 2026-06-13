// views\PedidosView\Configuraciones\PerfilesFulfillment\components\PerfilesFulfillmentFields.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    ScissorsIcon,
    NumberedListIcon,
    ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { useFetchWithAuth } from "@/lib/http/client";
import { PackageCheckIcon, PackageIcon, PencilLineIcon, UserCircleIcon } from "lucide-react";

/* ---------- interfaz ---------- */
export interface FulfillmentProfile {

    id?: string;

    /** DETALLE */
    nombre: string;

    // Plan de fulfillment
    motor: "Advanced" | "Basic";

    // Combinación
    tiposEntrega: string[];
    canalVentaId?: number;
    canalVentaNombre?: string;

    // Parámetros de esquema avanzado
    restriccionEntrega: "Shipping type" | "Carrier" | "Shipping sla";
    atribucionOlas: "As soon as possible" | "Closest to delivery";
    crearEnviosInternos: boolean;
    tipoDistribucionInterna: "Movements";
    priorizarPickingEnAlmacenEntrega: boolean;
    onlyPreferredWithStock: boolean;
    usarPickUpPoint: boolean;

    factorFoundRateFactor: "Quantity";
    factorFoundRateValor: "Found-rate (valor)";
    factorFoundRatePercent: number;   // %

    prioridadTransporte: "Lower shipping cost";
    atribucionTimeSlot: "Ignore quota";

    // Split de pedidos
    permitirSplit: boolean;
    tipoSplit: "Order";
    splitMax: number | "";
    valorMinimo: number | "";

    consolidarEntrega: boolean;

    // Post preparación
    recalcularTransportista: boolean;

    // metadatos
    status: "Activo" | "Inactivo";
    created?: { username: string; email: string; date: string };
    updatedAt?: string;

    /** TIPO DE ENTREGA (derecha) */
    saltearOlaPickingExpress?: boolean;

    /** USUARIO CREADOR */
    usuarioCreadorNombre?: string;
    usuarioCreadorEmail?: string;
    fechaCreacion?: string;

    /** ÚLTIMA MODIFICACIÓN */
    usuarioModificadorNombre?: string;
    usuarioModificadorEmail?: string;
    ultimaModificacion?: string;
}

export function PerfilesFulfillmentFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: FulfillmentProfile;
    readOnly?: boolean;
    onChange?: (field: keyof FulfillmentProfile, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof FulfillmentProfile) => (v: any) => onChange?.(field, v);

    /* ---------- Canal de venta (API + SelectSearchInline) ---------- */
    // Patrón idéntico a CommerceAccountsFields (cargar canales con fetch-with-auth + mini select-search)
    const { fetchWithAuth } = useFetchWithAuth(); // :contentReference[oaicite:0]{index=0}
    const [channels, setChannels] = useState<Array<{ Id: number; Name: string }>>([]);
    const [channelSearch, setChannelSearch] = useState("");
    const [loadingChannels, setLoadingChannels] = useState(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoadingChannels(true);
                // Igual que en CommerceAccountsFields: usamos Listar con page grande
                const res = await fetchWithAuth<{ ok: boolean; data: any[] }>(
                    "comerce-service/sales-channel/Listar?page=1&pageSize=200&isActive=1"
                ); // :contentReference[oaicite:1]{index=1}
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

    const channelOptions = useMemo(
        () => [
            { label: "Seleccione canal…", value: "" },
            ...channels.map((c) => ({ label: `${c.Name}`, value: String(c.Id) })),
        ],
        [channels]
    ); // :contentReference[oaicite:2]{index=2}

    const visibleChannelOptions = useMemo(() => {
        const q = channelSearch.trim().toLowerCase();
        if (!q) return channelOptions;
        return channelOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [channelOptions, channelSearch]); // :contentReference[oaicite:3]{index=3}

    /* ---------- helpers UI ---------- */
    const Toggle = ({
        on,
        onChange,
        disabled,
    }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            disabled={disabled || readOnly}
            onClick={() => !disabled && !readOnly && onChange(!on)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${on ? "bg-blue-500" : "bg-gray-300"
                } ${disabled || readOnly ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );

    /* ---------- modo plan ---------- */
    const isAdvanced = record.motor === "Advanced";
    const isBasic = record.motor === "Basic";

    /* ---------- render ---------- */
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLE */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.nombre || ""}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </Card>

                    {/* PLAN DE FULFILLMENT */}
                    <Card
                        title="PLAN DE FULFILLMENT"
                        icon={NumberedListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Motor</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.motor}
                                    inline
                                    options={["Advanced", "Basic"]}
                                    onChange={handle("motor")}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* parametros de esquema basicos */}
                    {isBasic && (
                        <Card
                            icon={<Cog6ToothIcon className="w-5 h-5 text-gray-600" />}
                            title="PARÁMETROS DE ESQUEMA BÁSICOS"
                            className="rounded-xl p-6"
                            hasTitleDivider
                            noDefaultStyles
                        >
                            <div className="grid grid-cols-6 gap-4">
                                {/* Restricciones de entrega */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Restricciones de entrega</span>
                                <div className="col-span-5">
                                    <CollapsibleField
                                        label=""
                                        value={record.restriccionEntrega}
                                        inline
                                        options={["Carrier", "Shipping sla", "Shipping type"]}
                                        onChange={handle("restriccionEntrega")}
                                    />
                                </div>

                                {/* Atribución de Olas */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Atribución de Olas</span>
                                <div className="col-span-5">
                                    <CollapsibleField
                                        label=""
                                        value={record.atribucionOlas}
                                        inline
                                        options={["As soon as possible", "Closest to delivery"]}
                                        onChange={handle("atribucionOlas")}
                                    />
                                </div>

                                {/* Usar pick up point */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Usar pick up point</span>
                                <div className="col-span-5">
                                    <Toggle
                                        on={!!record.usarPickUpPoint}
                                        onChange={(v) => handle("usarPickUpPoint")(v)}
                                    />
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* PARÁMETROS DE ESQUEMA AVANZADO */}
                    {isAdvanced &&
                        (
                            <Card
                                title="PARÁMETROS DE ESQUEMA AVANZADO"
                                icon={Cog6ToothIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-6 gap-4">
                                    {/* Restricciones de entrega */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Restricciones de entrega</span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            value={record.restriccionEntrega}
                                            inline
                                            options={["Shipping type"]}
                                            onChange={handle("restriccionEntrega")}
                                        />
                                    </div>

                                    {/* Atribución de Olas */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Atribución de Olas</span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            value={record.atribucionOlas}
                                            inline
                                            options={["As soon as possible", "Closest to delivery"]}
                                            onChange={handle("atribucionOlas")}
                                        />
                                    </div>

                                    {/* Crear envíos internos */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Crear envíos internos</span>
                                    <div className="col-span-5">
                                        <Toggle on={record.crearEnviosInternos} onChange={handle("crearEnviosInternos")} />
                                    </div>

                                    {/* Tipo de distribución interna */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo de distribución interna</span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            value={record.tipoDistribucionInterna}
                                            inline
                                            options={["Movements"]}
                                            onChange={handle("tipoDistribucionInterna")}
                                        />
                                    </div>

                                    {/* Priorizar picking en almacén de entrega */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">
                                        Priorizar picking en almacén de entrega
                                    </span>
                                    <div className="col-span-5">
                                        <Toggle
                                            on={record.priorizarPickingEnAlmacenEntrega}
                                            onChange={handle("priorizarPickingEnAlmacenEntrega")}
                                        />
                                    </div>

                                    {/* Only use preferred warehouses with stock */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">
                                        Only use preferred warehouses with stock
                                    </span>
                                    <div className="col-span-5">
                                        <Toggle on={record.onlyPreferredWithStock} onChange={handle("onlyPreferredWithStock")} />
                                    </div>

                                    {/* Usar pick up point */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Usar pick up point</span>
                                    <div className="col-span-5">
                                        <Toggle on={record.usarPickUpPoint} onChange={handle("usarPickUpPoint")} />
                                    </div>

                                    {/* Factor Found-Rate */}
                                    <div className="col-span-6 grid grid-cols-6 gap-3">
                                        <span className="col-span-1 text-sm text-gray-600 font-bold">Factor Found-Rate</span>
                                        <div className="col-span-2">
                                            <CollapsibleField
                                                label=""
                                                value={record.factorFoundRateFactor}
                                                inline
                                                options={["Quantity"]}
                                                onChange={handle("factorFoundRateFactor")}
                                            />
                                        </div>
                                        <span className="col-span-1 text-sm text-gray-600 font-bold">Factor Found-Rate %</span>
                                        <div className="col-span-2">
                                            <input
                                                className="w-full border-b border-gray-300 text-sm outline-none"
                                                type="number"
                                                value={record.factorFoundRatePercent}
                                                onChange={(e) => handle("factorFoundRatePercent")(Number(e.target.value || 0))}
                                                placeholder=""
                                            />
                                        </div>
                                    </div>

                                    {/* Prioridad de transporte */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Prioridad de transporte</span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            value={record.prioridadTransporte}
                                            inline
                                            options={["Lower shipping cost"]}
                                            onChange={handle("prioridadTransporte")}
                                        />
                                    </div>

                                    {/* Atribución de TimeSlot */}
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Atribución de TimeSlot</span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            value={record.atribucionTimeSlot}
                                            inline
                                            options={["Ignore quota"]}
                                            onChange={handle("atribucionTimeSlot")}
                                        />
                                    </div>
                                </div>
                            </Card>
                        )
                    }

                    {/* SPLIT DE PEDIDOS */}
                    {isAdvanced &&
                        (

                            <Card
                                title="SPLIT DE PEDIDOS"
                                icon={ScissorsIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-6 gap-4">
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Permitir Split</span>
                                    <div className="col-span-5">
                                        <Toggle on={record.permitirSplit} onChange={handle("permitirSplit")} />
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo de split</span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            value={record.tipoSplit}
                                            inline
                                            options={["Order"]}
                                            onChange={handle("tipoSplit")}
                                        />
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Split (Máx.)</span>
                                    <div className="col-span-5">
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            type="number"
                                            value={record.splitMax}
                                            onChange={(e) => handle("splitMax")(e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder=""
                                        />
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Valor mínimo</span>
                                    <div className="col-span-5">
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            type="number"
                                            value={record.valorMinimo}
                                            onChange={(e) => handle("valorMinimo")(e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder=""
                                        />
                                    </div>

                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Consolidar entrega</span>
                                    <div className="col-span-5">
                                        <Toggle on={record.consolidarEntrega} onChange={handle("consolidarEntrega")} />
                                    </div>
                                </div>
                            </Card>
                        )
                    }

                    {/* POST PREPARACIÓN */}
                    <Card
                        title="POST PREPARACIÓN"
                        icon={PackageCheckIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Recalcular transportista</span>
                            <div className="col-span-5">
                                <Toggle on={record.recalcularTransportista} onChange={handle("recalcularTransportista")} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">

                    {/* OTROS */}
                    <Card
                        title="OTROS"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.status}
                                    inline
                                    options={["Activo", "Inactivo"]}
                                    onChange={handle("status")}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* COMBINACIÓN */}
                    <Card
                        title="COMBINACIÓN"
                        icon={ClipboardDocumentCheckIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Tipo de entrega (mock simple, uno a la vez). Si luego quieres multi, lo adaptamos. */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo de entrega</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.tiposEntrega[0] || ""}
                                    inline
                                    options={["Express delivery", "Delivery", "Drive through", "Store pickup"]}
                                    onChange={(val) => handle("tiposEntrega")([val])}
                                />
                            </div>

                            {/* Canal de venta (API + selector con búsqueda inline) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Canal de venta</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="sales-channel"
                                    label="Canal"
                                    value={record.canalVentaId ? String(record.canalVentaId) : ""}
                                    options={visibleChannelOptions}
                                    searchQuery={channelSearch}
                                    loading={loadingChannels}
                                    onSearch={setChannelSearch}
                                    onChange={(val, label) => {
                                        const id = val ? Number(val) : undefined;
                                        handle("canalVentaId")(id);
                                        handle("canalVentaNombre")(label || "");
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                    {/* TIPO DE ENTREGA */}
                    {isAdvanced &&
                        (
                            <Card
                                title="TIPO DE ENTREGA"
                                icon={PackageIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-6 gap-4">
                                    <span className="col-span-4 text-sm text-gray-600 font-bold">
                                        Saltear ola de picking para entrega express
                                    </span>
                                    <div className="col-span-2">
                                        <Toggle
                                            on={!!record.saltearOlaPickingExpress}
                                            onChange={handle("saltearOlaPickingExpress")}
                                        />
                                    </div>
                                </div>
                            </Card>
                        )
                    }

                    {/* USUARIO CREADOR / ÚLTIMA MODIFICACIÓN (solo en Resumen) */}
                    {!isCreate && (
                        <>
                            {/* USUARIO CREADOR */}
                            <Card
                                title="USUARIO CREADOR"
                                icon={UserCircleIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-12 items-center gap-4">
                                    <div className="col-span-9">
                                        <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                                            <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                                {(record.usuarioCreadorNombre || "—")
                                                    .split(/\s+/)
                                                    .map((p) => p[0])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{record.usuarioCreadorNombre || "—"}</span>
                                                <span className="text-xs text-gray-500">{record.usuarioCreadorEmail || ""}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-right">
                                        <span className="text-xs text-gray-500">
                                            {record.fechaCreacion || "—"}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* ÚLTIMA MODIFICACIÓN */}
                            <Card
                                title="ÚLTIMA MODIFICACIÓN"
                                icon={PencilLineIcon}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl p-6"
                            >
                                <div className="grid grid-cols-12 items-center gap-4">
                                    <div className="col-span-9">
                                        <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                                            <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                                {(record.usuarioModificadorNombre || "—")
                                                    .split(/\s+/)
                                                    .map((p) => p[0])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{record.usuarioModificadorNombre || "—"}</span>
                                                <span className="text-xs text-gray-500">{record.usuarioModificadorEmail || ""}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-right">
                                        <span className="text-xs text-gray-500">
                                            {record.ultimaModificacion || "—"}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Mini SelectSearchInline (igual patrón que CommerceAccountsFields) ---------- */
// Copiado 1:1 del patrón local usado en CommerceAccountsFields (buscar + opciones locales)
// 
function SelectSearchInline({
    id,
    label,
    value,
    options,
    searchQuery,
    loading,
    onSearch,
    onChange,
    placeholderFromDefault = true,
}: {
    id: string;
    label: string;
    value: string;
    options: { label: string; value: string }[];
    searchQuery: string;
    loading?: boolean;
    onSearch: (q: string) => void;
    onChange: (value: string, label?: string) => void;
    placeholderFromDefault?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [input, setInput] = useState("");
    const boxRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const defaultOptionLabel = useMemo(
        () => options.find((o) => o.value === "")?.label || "",
        [options]
    );

    const placeholder = useMemo(() => {
        if (placeholderFromDefault && !searchQuery && value === "" && defaultOptionLabel) return defaultOptionLabel;
        return `Buscar ${label.toLowerCase()}…`;
    }, [defaultOptionLabel, placeholderFromDefault, label, searchQuery, value]);

    useEffect(() => {
        const hasSearch = typeof searchQuery === "string" && searchQuery.trim() !== "";
        if (hasSearch) { setInput(searchQuery); return; }
        if (value !== "") {
            const selected = options.find((o) => o.value === value)?.label || "";
            setInput(selected);
        } else {
            setInput("");
        }
    }, [searchQuery, value, options]);

    const localOptions = useMemo(() => {
        const q = (input || "").trim().toLowerCase();
        return (options || []).filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [options, input]);

    useEffect(() => { if (highlight >= localOptions.length) setHighlight(0); }, [localOptions.length, highlight]);

    const selectOption = (opt: { value: string; label: string }) => {
        onChange(opt.value, opt.label);
        onSearch("");
        setInput(opt.value === "" ? "" : opt.label);
        setOpen(false);
    };


    return (
        <div className="relative" ref={boxRef}>
            <div className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <input
                    id={`${id}-search`}
                    type="text"
                    autoComplete="off"
                    value={input}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        const v = e.target.value;
                        setInput(v);
                        onSearch(v);
                        if (value !== "" && v !== "") onChange("");
                        setOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOpen(true);
                        if (!localOptions.length) { if (e.key === "Escape") setOpen(false); return; }
                        if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % localOptions.length); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + localOptions.length) % localOptions.length); }
                        else if (e.key === "Enter") { e.preventDefault(); const opt = localOptions[highlight]; if (opt) selectOption(opt); else setOpen(false); }
                        else if (e.key === "Escape") { setOpen(false); }
                    }}
                    className="block w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
                    placeholder={placeholder}
                />
            </div>

            {open && localOptions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
                    {localOptions.map((opt, idx) => (
                        <li
                            key={opt.value || String(idx)}
                            className={`cursor-pointer select-none px-3 py-2 ${idx === highlight ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"}`}
                            onMouseEnter={() => setHighlight(idx)}
                            onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
