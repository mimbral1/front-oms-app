// views\PickingView\configuraciones\components\PickersFields.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserCircleIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { ActiveStatusToggle } from "@/components/ui/togle";
import { useApiPickers } from "@/app/fetchWithAuth/picking/configuraciones/api-pickers/api-pickers";
import { Avatar } from "@/components/ui/user-avatar";

/** ───────────────────── Tipos ───────────────────── */
export type Picker = {
    imagenUrl?: string;
    nombre: string;
    email: string;
    perfil: string;
    idFuncionario: string;
    almacenTienda: string;

    carrierIds: string[];
    locationIds: string[];
    shippingTypeCodes: string[];
    pickingPointIds: string[];
    enabledPickingZones: string[];
    restrictedPickingZones: string[];

    estado: "Activo" | "Inactivo";
    creador?: { nombre: string; email: string; avatar?: string };
    modificador?: { nombre: string; email: string; avatar?: string };
    fechaCreacion?: string;
    ultimaModificacion?: string;
};

export function PickersFields({
    record,
    readOnly = false,
    allowStatusEditWhenReadOnly = false,
    onChange,
    isCreate = false,
}: {
    record: Picker;
    readOnly?: boolean;
    allowStatusEditWhenReadOnly?: boolean;
    onChange?: <K extends keyof Picker>(field: K, value: Picker[K]) => void;
    isCreate?: boolean;
}) {
    const set =
        <K extends keyof Picker>(k: K) =>
            (v: Picker[K]) =>
                onChange?.(k, v);

    const {
        getLocationsSimple,
        getShippingTypesSimple,
        getPickingPointsSimple,
        getPickingZonesSimple,
        getPickerRoleCandidates,
    } = useApiPickers();

    /* =======================
       OPTIONS / SEARCH STATE
    ======================= */
    type Opt = { label: string; value: string };
    type Candidate = { id: string; nombre: string; email: string };

    const [candidateOpts, setCandidateOpts] = useState<Opt[]>([]);
    const [candidateSearch, setCandidateSearch] = useState("");
    const [candidateList, setCandidateList] = useState<Candidate[]>([]);

    const [locationOpts, setLocationOpts] = useState<Opt[]>([]);
    const [locationSearch, setLocationSearch] = useState("");

    const [shippingOpts, setShippingOpts] = useState<Opt[]>([]);
    const [shippingSearch, setShippingSearch] = useState("");

    const [pickingPointOpts, setPickingPointOpts] = useState<Opt[]>([]);
    const [pickingPointSearch, setPickingPointSearch] = useState("");

    const [zoneOpts, setZoneOpts] = useState<Opt[]>([]);
    const [zoneSearch, setZoneSearch] = useState("");
    const [optionsLoading, setOptionsLoading] = useState(true);

    // Transportistas (endpoint en desarrollo)
    const carrierOpts: Opt[] = [
        { label: "Andreani", value: "andreani" },
        { label: "Correo Argentino", value: "correo_argentino" },
        { label: "DHL", value: "dhl" },
    ];
    const [carrierSearch, setCarrierSearch] = useState("");

    /* =======================
       LOAD OPTIONS (igual a esquemas)
    ======================= */
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (mounted) setOptionsLoading(true);
            try {
                const [loc, ship, points, zones] = await Promise.all([
                    getLocationsSimple(),
                    getShippingTypesSimple(),
                    getPickingPointsSimple(),
                    getPickingZonesSimple(),
                ]);
                const users = await getPickerRoleCandidates();

                if (!mounted) return;

                setLocationOpts(
                    (loc?.items ?? loc?.data?.items ?? [])
                        .map((l: any) => ({ label: l.name ?? l.nombre, value: String(l.id ?? l.locationId ?? "") }))
                        .filter((o: Opt) => o.value)
                );

                setShippingOpts(
                    (ship?.items ?? ship?.data?.items ?? ship?.data ?? [])
                        .map((s: any) => ({
                            label: s.name ?? s.nombre ?? s.description ?? s.shippingTypeCode,
                            value: String(s.code ?? s.shippingTypeCode ?? s.codigo ?? ""),
                        }))
                        .filter((o: Opt) => o.value)
                );

                setPickingPointOpts(
                    (points?.items ?? points?.data?.items ?? [])
                        .map((p: any) => ({ label: p.name ?? p.nombre, value: String(p.id ?? p.pickingPointId ?? "") }))
                        .filter((o: Opt) => o.value)
                );

                setZoneOpts(
                    (zones?.items ?? zones?.data?.items ?? zones?.data ?? [])
                        .map((z: any) => ({
                            label: z.name ?? z.nombre ?? z.code ?? z.zoneId,
                            value: String(z.id ?? z.zoneId ?? z.zonaId ?? ""),
                        }))
                        .filter((o: Opt) => o.value)
                );

                const rawUsers = users?.items ?? users?.data?.items ?? users?.data ?? [];
                const mappedCandidates: Candidate[] = rawUsers
                    .map((u: any) => {
                        const id = String(u.usuarioId ?? u.userId ?? u.id ?? u.idUsuario ?? "");
                        const nombre = `${u.nombres ?? ""} ${u.apellidos ?? ""}`.trim();
                        const email = String(u.email ?? "");
                        return { id, nombre, email };
                    })
                    .filter((u: Candidate) => u.id && u.nombre);

                setCandidateList(mappedCandidates);
                setCandidateOpts(
                    mappedCandidates.map((u) => ({
                        value: u.id,
                        label: u.nombre,
                    }))
                );
            } catch (e) {
                console.error("Error cargando opciones pickers:", e);
            } finally {
                if (mounted) setOptionsLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    const labelMap = (opts: Opt[]) =>
        new Map(opts.map((o) => [o.value, o.label]));

    const renderSelectedChips = (
        ids: string[],
        opts: Opt[],
        onRemove: (id: string) => void,
    ) => {
        if (!ids.length) return null;

        if (optionsLoading) {
            return ids.map((id) => (
                <span
                    key={id}
                    className="inline-flex h-6 w-24 animate-pulse items-center rounded-full bg-gray-200"
                />
            ));
        }

        const map = labelMap(opts);
        return ids.map((id) => (
            <span key={id} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                {map.get(id) ?? id}
                <button
                    type="button"
                    className="ml-2"
                    onClick={() => onRemove(id)}
                >
                    ×
                </button>
            </span>
        ));
    };

    const candidateMap = useMemo(
        () => new Map(candidateList.map((u) => [u.id, u])),
        [candidateList],
    );

    /* =======================
       RENDER
    ======================= */
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                {isCreate && !readOnly ? (
                                    <SelectSearchInline
                                        id="picker-candidate"
                                        label="picker"
                                        value={record.idFuncionario}
                                        options={candidateOpts}
                                        searchQuery={candidateSearch}
                                        onSearch={setCandidateSearch}
                                        onChange={(userId) => {
                                            const user = candidateMap.get(userId);

                                            set("idFuncionario")(userId || "");
                                            set("nombre")(user?.nombre ?? "");
                                            set("email")(user?.email ?? "");
                                        }}
                                    />
                                ) : (
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none bg-transparent text-gray-700"
                                        value={record.nombre}
                                        readOnly
                                    />
                                )}
                            </div>

                            {/* Email */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none bg-transparent text-gray-700"
                                    value={record.email}
                                    readOnly
                                />
                            </div>

                            {/* Ubicaciones */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ubicaciones</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="locations"
                                    label="ubicaciones"
                                    value=""
                                    options={locationOpts}
                                    searchQuery={locationSearch}
                                    onSearch={setLocationSearch}
                                    onChange={(v) => {
                                        if (v && !record.locationIds.includes(v)) {
                                            set("locationIds")([...record.locationIds, v]);
                                        }
                                    }}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {renderSelectedChips(
                                        record.locationIds,
                                        locationOpts,
                                        (id) => set("locationIds")(record.locationIds.filter((x) => x !== id)),
                                    )}
                                </div>
                            </div>

                            {/* Picking point */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Picking point</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="picking-points"
                                    label="picking point"
                                    value=""
                                    options={pickingPointOpts}
                                    searchQuery={pickingPointSearch}
                                    onSearch={setPickingPointSearch}
                                    onChange={(v) => {
                                        if (v && !record.pickingPointIds.includes(v)) {
                                            set("pickingPointIds")([...record.pickingPointIds, v]);
                                        }
                                    }}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {renderSelectedChips(
                                        record.pickingPointIds,
                                        pickingPointOpts,
                                        (id) => set("pickingPointIds")(record.pickingPointIds.filter((x) => x !== id)),
                                    )}
                                </div>
                            </div>

                            {/* Transportistas */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Transportistas</span>
                            <div className="col-span-5 opacity-50 pointer-events-none">
                                <SelectSearchInline
                                    id="carriers"
                                    label="transportistas"
                                    value=""
                                    options={carrierOpts}
                                    searchQuery={carrierSearch}
                                    onSearch={setCarrierSearch}
                                    onChange={(v) => {
                                        if (v && !record.carrierIds.includes(v)) {
                                            set("carrierIds")([...record.carrierIds, v]);
                                        }
                                    }}
                                />
                            </div>

                            {/* Modalidad de entrega */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Modalidad de entrega</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="shipping"
                                    label="modalidad"
                                    value=""
                                    options={shippingOpts}
                                    searchQuery={shippingSearch}
                                    onSearch={setShippingSearch}
                                    onChange={(v) => {
                                        if (v && !record.shippingTypeCodes.includes(v)) {
                                            set("shippingTypeCodes")([...record.shippingTypeCodes, v]);
                                        }
                                    }}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {renderSelectedChips(
                                        record.shippingTypeCodes,
                                        shippingOpts,
                                        (code) => set("shippingTypeCodes")(record.shippingTypeCodes.filter((x) => x !== code)),
                                    )}
                                </div>
                            </div>

                            {/* Sectores habilitados */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Sectores habilitados</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="zones-enabled"
                                    label="sectores"
                                    value=""
                                    options={zoneOpts}
                                    searchQuery={zoneSearch}
                                    onSearch={setZoneSearch}
                                    onChange={(v) => {
                                        if (v && !record.enabledPickingZones.includes(v)) {
                                            set("enabledPickingZones")([...record.enabledPickingZones, v]);
                                        }
                                        if (v && record.restrictedPickingZones.includes(v)) {
                                            set("restrictedPickingZones")(record.restrictedPickingZones.filter((x) => x !== v));
                                        }
                                    }}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {renderSelectedChips(
                                        record.enabledPickingZones,
                                        zoneOpts,
                                        (zoneId) => set("enabledPickingZones")(record.enabledPickingZones.filter((x) => x !== zoneId)),
                                    )}
                                </div>
                            </div>

                            {/* Sectores restringidos */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Sectores restringidos</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="zones-restricted"
                                    label="sectores"
                                    value=""
                                    options={zoneOpts}
                                    searchQuery={zoneSearch}
                                    onSearch={setZoneSearch}
                                    onChange={(v) => {
                                        if (v && !record.restrictedPickingZones.includes(v)) {
                                            set("restrictedPickingZones")([...record.restrictedPickingZones, v]);
                                        }
                                        if (v && record.enabledPickingZones.includes(v)) {
                                            set("enabledPickingZones")(record.enabledPickingZones.filter((x) => x !== v));
                                        }
                                    }}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {renderSelectedChips(
                                        record.restrictedPickingZones,
                                        zoneOpts,
                                        (zoneId) => set("restrictedPickingZones")(record.restrictedPickingZones.filter((x) => x !== zoneId)),
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="OTROS"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <ActiveStatusToggle
                                    active={record.estado === "Activo"}
                                    disabled={readOnly && !allowStatusEditWhenReadOnly}
                                    onActiveChange={(active) =>
                                        set("estado")(active ? "Activo" : "Inactivo")
                                    }
                                    showStateLabel={false}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* USUARIO CREADOR */}
                    {!isCreate && record.creador && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserCircleIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        name={record.creador.nombre || "Usuario"}
                                        src={record.creador.avatar}
                                        className="h-8 w-8 bg-blue-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{record.creador.nombre || "—"}</span>
                                        <span className="text-xs text-gray-500">{record.creador.email || "—"}</span>
                                    </div>
                                </div>
                                {record.fechaCreacion && (
                                    <span className="text-xs text-gray-500">{record.fechaCreacion}</span>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* ÚLTIMA MODIFICACIÓN */}
                    {!isCreate && record.modificador && (
                        <Card
                            title="ÚLTIMA MODIFICACIÓN"
                            icon={PencilSquareIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        name={record.modificador.nombre || "Usuario"}
                                        src={record.modificador.avatar}
                                        className="h-8 w-8 bg-gray-400"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{record.modificador.nombre || "—"}</span>
                                        <span className="text-xs text-gray-500">{record.modificador.email || "—"}</span>
                                    </div>
                                </div>
                                {record.ultimaModificacion && (
                                    <span className="text-xs text-gray-500">{record.ultimaModificacion}</span>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
