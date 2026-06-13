// app/views/Commerce/Accounts/components/CommerceAccountsFields.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { useFetchWithAuth } from "@/lib/http/client";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

/* Interfaz */
export interface CommerceAccount {
    id?: string | number;
    nombre: string;                    // Name
    comercio: string;                  // EcommerceName
    refId: string;                     // ReferenceId (read-only en Resumen)
    plataforma: string;
    status: string;                    // "Activo" | "Inactivo"

    // para integrar API
    salesChannelId?: number;           // SalesChannelId
    salesChannelName?: string;         // SalesChannelName (display)
    featuresRaw?: string;              // textarea con JSON opcional
}


export function CommerceAccountsFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false, // modo creación para ocultar Ref ID
}: {
    record: CommerceAccount;
    readOnly?: boolean;
    onChange?: (field: keyof CommerceAccount, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof CommerceAccount) => (v: any) => onChange?.(field, v);

    // ============== CANALES DE VENTA ==============
    // cargar canales de venta para selector
    const { fetchWithAuth } = useFetchWithAuth();
    const [channels, setChannels] = useState<Array<{ Id: number; Name: string }>>([]);
    const [channelSearch, setChannelSearch] = useState("");
    const [loadingChannels, setLoadingChannels] = useState(false);

    const channelOptions = useMemo(
        () => [
            { label: "Seleccione canal…", value: "" },
            ...channels.map((c) => ({ label: `${c.Name}`, value: String(c.Id) })), // value interno = Id
        ],
        [channels]
    );

    const visibleChannelOptions = useMemo(() => {
        const q = channelSearch.trim().toLowerCase();
        if (!q) return channelOptions;
        return channelOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [channelOptions, channelSearch]);

    // ============== PLATAFORMAS ==============

    // --- Plataforma selector (value = NOMBRE) ---
    const [platforms, setPlatforms] = useState<Array<{ ID: number; NOMBRE: string }>>([]);
    const [platformSearch, setPlatformSearch] = useState("");
    const [loadingPlatforms, setLoadingPlatforms] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingPlatforms(true);
                const res = await fetchWithAuth<{ ok: boolean; total: number; data: Array<{ ID: number; NOMBRE: string }> }>(
                    "idservice/plataformas/obtener"
                );
                if (!mounted) return;
                setPlatforms(Array.isArray(res?.data) ? res!.data : []);
            } catch (e) {
                console.error("Error listando plataformas:", e);
                setPlatforms([]);
            } finally {
                if (mounted) setLoadingPlatforms(false);
            }
        })();
        return () => { mounted = false; };
    }, [fetchWithAuth]);


    const platformOptions = useMemo(
        () => [
            { label: "Seleccione plataforma…", value: "" },
            ...platforms.map(p => ({ label: p.NOMBRE, value: p.NOMBRE })), // ✅ enviamos NOMBRE
        ],
        [platforms]
    );

    const visiblePlatformOptions = useMemo(() => {
        const q = platformSearch.trim().toLowerCase();
        if (!q) return platformOptions;
        return platformOptions.filter(o => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [platformOptions, platformSearch]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoadingChannels(true);
                // usamos Listar con page=1,pagesize grande para opciones
                const res = await fetchWithAuth<{ ok: boolean; data: any[] }>("comerce-service/sales-channel/Listar?page=1&pageSize=200&isActive=1");
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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
                <Card title="DETALLE" icon={ClipboardDocumentListIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                    <div className="grid grid-cols-12 gap-4">
                        {/* Canal de venta (selector con búsqueda) */}
                        <span className="col-span-1 text-sm text-gray-600 font-bold">Canal</span>
                        <div className="col-span-11">
                            <SelectSearchInline
                                id="salesChannel"
                                label="Canal"
                                value={record.salesChannelId ? String(record.salesChannelId) : ""} // guarda Id en el form 
                                options={visibleChannelOptions}
                                searchQuery={channelSearch}
                                loading={loadingChannels}
                                onSearch={setChannelSearch}
                                onChange={(val, label) => {
                                    handle("salesChannelId")(val ? Number(val) : undefined);
                                    handle("salesChannelName")(label || "");
                                }}
                                placeholderFromDefault
                            />
                        </div>

                        {/* Nombre */}
                        {/* (no modifico tus comentarios existentes) */}
                        <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                        <div className="col-span-11">
                            <input className="w-full border-b border-gray-300 text-sm outline-none" value={record.nombre} onChange={(e) => handle("nombre")(e.target.value)} placeholder="" />
                        </div>

                        {/* Comercio */}
                        <span className="col-span-1 text-sm text-gray-600 font-bold">Comercio</span>
                        <div className="col-span-11">
                            <input className="w-full border-b border-gray-300 text-sm outline-none" value={record.comercio} onChange={(e) => handle("comercio")(e.target.value)} placeholder="" />
                        </div>

                        {/* Ref ID -> SOLO en Resumen (no en crear) y SOLO LECTURA */}
                        {!isCreate && (
                            <>
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Ref ID</span>
                                <div className="col-span-11">
                                    <input className="w-full border-b border-gray-300 text-sm outline-none" value={record.refId} readOnly disabled placeholder="" />
                                </div>
                            </>
                        )}

                        {/* Plataforma */}
                        <span className="col-span-1 text-sm text-gray-600 font-bold">Plataforma</span>
                        <div className="col-span-11">
                            <SelectSearchInline
                                id="platform"
                                label="Plataforma"
                                value={record.plataforma || ""}          // guarda NOMBRE directamente
                                options={visiblePlatformOptions}
                                searchQuery={platformSearch}
                                loading={loadingPlatforms}
                                onSearch={setPlatformSearch}
                                onChange={(val /* NOMBRE */, label) => {
                                    handle("plataforma")(label || "");     // guarda NOMBRE en el form
                                }}
                                placeholderFromDefault
                            />
                        </div>

                        {/* Status */}
                        <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                        <div className="col-span-11">
                            <CollapsibleField label="" value={record.status} inline options={["Activo", "Inactivo"]} onChange={handle("status")} />
                        </div>

                        {/* Features (JSON opcional) */}
                        <span className="col-span-1 text-sm text-gray-600 font-bold">Características</span>
                        <div className="col-span-11">
                            <textarea
                                className="w-full border border-gray-300 rounded-md text-sm p-2 outline-none"
                                rows={4}
                                value={record.featuresRaw ?? ""}
                                onChange={(e) => handle("featuresRaw")(e.target.value)}
                                placeholder='Opcional. JSON, ej: {"smartcheckout":true,"inventorySync":"push"}'
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
