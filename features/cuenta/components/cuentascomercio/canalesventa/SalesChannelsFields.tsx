// views\Cuenta\CuentasComercio\CanalesVenta\components\SalesChannelsFields.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    BuildingStorefrontIcon,
    UserIcon,
    PlusCircleIcon,
    TrashIcon
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";
import { PencilIcon } from "lucide-react";

/* Interfaz */
export interface SalesChannelPriceList {
    priceListNum: number;
    priceListName: string;
    isActive: boolean;
}

export interface SalesChannel {
    id?: string;
    nombre: string;
    refId: string;
    idCorto?: string;
    moneda: string;
    pickingExterno: boolean;
    capturaAutoPostPicking: boolean;
    asociadas: {
        catalogo: string;
        precios: string;
        stock: string;
        pedidos: string;
        entrega: string;
    };
    status?: string;
    created: { username: string; email: string; date: string };

    // compañía
    companyId?: number;
    companyName?: string;

    // listas de precios 
    priceLists?: SalesChannelPriceList[];

    // usuario creador 
    creador?: {
        nombre: string;
        email: string;
        avatar?: string;
    };
    creadorFecha?: string;

    // ultima modificacion 
    modificador?: {
        nombre: string;
        email: string;
        avatar?: string;
    };

    modificadorFecha?: string;

}

export function SalesChannelFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
    blockRenderUntilReady = false,
}: {
    record: SalesChannel;
    readOnly?: boolean;
    onChange?: (field: keyof SalesChannel, value: any) => void;
    isCreate?: boolean;
    blockRenderUntilReady?: boolean;
}) {
    const handle = (field: keyof SalesChannel) => (v: any) =>
        onChange?.(field, v);

    const { fetchWithAuth } = useFetchWithAuth();

    /* ---------- Compañías ---------- */
    const [companies, setCompanies] = useState<
        Array<{ Id: number; BusinessName: string }>
    >([]);
    const [companiesLoading, setCompaniesLoading] = useState(false);
    const [companySearch, setCompanySearch] = useState("");

    // cargar todos los datos
    const [loadingInitialData, setLoadingInitialData] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadCompanies = async () => {
            try {
                setCompaniesLoading(true);
                const res = await fetchWithAuth<{ ok: boolean; data: any[] }>(
                    "comerce-service/company"
                );
                if (!mounted) return;
                setCompanies(
                    (res?.data || []).map((c: any) => ({
                        Id: Number(c?.Id),
                        BusinessName: String(
                            c?.BusinessName ?? c?.LegalName ?? `#${c?.Id ?? ""}`
                        ),
                    }))
                );
            } catch (e) {
                console.error("Error cargando compañías:", e);
                setCompanies([]);
            } finally {
                if (mounted) setCompaniesLoading(false);
            }
        };
        loadCompanies();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    const companyOptions = useMemo(
        () => [
            { label: "Seleccione compañía…", value: "" },
            ...companies.map((c) => ({
                label: c.BusinessName,
                value: String(c.Id),
            })),
        ],
        [companies]
    );

    const visibleCompanyOptions = useMemo(() => {
        const q = companySearch.trim().toLowerCase();
        if (!q) return companyOptions;
        return companyOptions.filter((o) =>
            (o.label + " " + o.value).toLowerCase().includes(q)
        );
    }, [companyOptions, companySearch]);

    /* ---------- Price Lists ---------- */

    const priceLists = record.priceLists || [];

    const updatePriceList = (
        index: number,
        patch: Partial<SalesChannelPriceList>
    ) => {
        const next = [...priceLists];
        next[index] = { ...next[index], ...patch };
        handle("priceLists")(next);
    };

    // agregar una nueva fila de lista de precios
    const addPriceList = () => {
        const next = [...(record.priceLists || [])];
        next.push({
            priceListNum: 0,
            priceListName: "",
            isActive: true,
        });
        handle("priceLists")(next);
    };

    // listar listas de precios 
    const [priceListOptions, setPriceListOptions] = useState<
        Array<{ label: string; value: string }>
    >([]);
    const [priceListSearch, setPriceListSearch] = useState("");
    const [priceListsLoading, setPriceListsLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchPriceLists = async () => {
            try {
                setPriceListsLoading(true);
                const resp = await fetchWithAuth<{ data: any[] }>(
                    "catalog/price-lists?pageSize=500"
                );

                if (!mounted) return;

                const options = (resp.data || []).map((pl) => ({
                    label: pl.ListName,
                    value: String(pl.ListNum),
                }));

                setPriceListOptions(options);
            } catch (err) {
                console.error("Error cargando listas de precios:", err);
                setPriceListOptions([]);
            } finally {
                if (mounted) setPriceListsLoading(false);
            }
        };

        fetchPriceLists();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    // Normalizar listas de precios para que siempre exista al menos una fila editable
    const priceListsNormalized =
        record.priceLists && record.priceLists.length > 0
            ? record.priceLists
            : isCreate
                ? []
                : [
                    {
                        priceListNum: 0,
                        priceListName: "",
                        isActive: true,
                    },
                ];

    // marcar cuando ya cargan todos los datos 
    useEffect(() => {
        if (!companiesLoading && !priceListsLoading) {
            setLoadingInitialData(false);
        }
    }, [companiesLoading, priceListsLoading]);

    // cargar todos los datos 
    if (blockRenderUntilReady && loadingInitialData) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
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
                            {/* Compañía */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Compañía
                            </span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="company"
                                    label="Compañía"
                                    value={record.companyId ? String(record.companyId) : ""}
                                    options={visibleCompanyOptions}
                                    searchQuery={companySearch}
                                    loading={companiesLoading}
                                    onSearch={setCompanySearch}
                                    onChange={(val, label) => {
                                        handle("companyId")(val ? Number(val) : undefined);
                                        handle("companyName")(label || "");
                                    }}
                                    placeholderFromDefault
                                />
                            </div>

                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Nombre
                            </span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                />
                            </div>

                            {/* Ref ID */}
                            {!isCreate && (
                                <>
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">
                                        Ref ID
                                    </span>
                                    <div className="col-span-5">
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={record.refId}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                </>
                            )}

                            {/* Moneda */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Moneda principal
                            </span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.moneda}
                                    options={["CLP", "USD", "EUR"]}
                                    onChange={handle("moneda")}
                                    inline
                                />
                            </div>

                            {/* Picking externo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Picking externo
                            </span>

                            <div className="col-span-5 flex items-center gap-4">
                                {/* Switch */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        handle("pickingExterno")(!record.pickingExterno)
                                    }
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.pickingExterno ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.pickingExterno ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* LISTAS DE PRECIOS */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Listas de precios
                            </span>
                            <div className="col-span-5 space-y-3">
                                {priceListsNormalized.map((pl, idx) => (
                                    <div
                                        key={`${pl.priceListNum}-${idx}`}
                                        className="grid grid-cols-10 gap-4 items-center"
                                    >
                                        {/* 3/4 SelectSearchInline */}
                                        <div className="col-span-8">
                                            <SelectSearchInline
                                                id={`priceList-${idx}`}
                                                label="Lista de precios"
                                                value={String(pl.priceListNum)}
                                                options={priceListOptions.map((opt) => {
                                                    const optNum = Number(opt.value);

                                                    const isUsedInOtherRow = (record.priceLists || []).some(
                                                        (x, i) => i !== idx && x.priceListNum === optNum
                                                    );

                                                    return {
                                                        ...opt,
                                                        disabled: isUsedInOtherRow,
                                                    };
                                                })}
                                                loading={priceListsLoading}
                                                searchQuery={priceListSearch}
                                                onSearch={setPriceListSearch}
                                                onChange={(val, label) => {
                                                    const exists = (record.priceLists || []).some(
                                                        (x, i) => i !== idx && x.priceListNum === Number(val)
                                                    );
                                                    if (exists) return;

                                                    const next = [...(record.priceLists || [])];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        priceListNum: Number(val),
                                                        priceListName: label || "",
                                                    };
                                                    onChange?.("priceLists", next);
                                                }}
                                                placeholderFromDefault
                                            />
                                        </div>

                                        {/* 1/4 Switch */}
                                        <div className="col-span-1 flex justify-center min-w-[3rem]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = [...(record.priceLists || [])];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        isActive: !next[idx].isActive,
                                                    };
                                                    onChange?.("priceLists", next);
                                                }}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${pl.isActive ? "bg-blue-500" : "bg-gray-300"
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${pl.isActive ? "translate-x-6" : "translate-x-1"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                        {/* Eliminar lista */}
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = [...(record.priceLists || [])];
                                                    next.splice(idx, 1);
                                                    handle("priceLists")(next);
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                                title="Eliminar lista"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {/* Icono + (misma fila, misma altura visual) */}
                                <button
                                    type="button"
                                    onClick={addPriceList}
                                    className="flex items-center text-blue-600 hover:text-blue-700"
                                    title="Agregar lista de precios"
                                >
                                    <PlusCircleIcon className="h-5 w-5" />
                                </button>
                            </div>

                        </div>
                    </Card>

                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="CUENTAS ASOCIADAS"
                        icon={BuildingStorefrontIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">{/* sin cambios */}</div>
                    </Card>

                    {!isCreate && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            {record.creador ? (
                                <div className="flex items-center justify-between">
                                    {/* Izquierda: avatar + nombre + email */}
                                    <div className="flex items-center gap-2">
                                        {record.creador.avatar ? (
                                            <img
                                                src={record.creador.avatar}
                                                className="h-7 w-7 rounded-full object-cover"
                                                alt=""
                                            />
                                        ) : (
                                            <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                                                {(record.creador.nombre?.match(/\b\w/g) || [])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase() || "US"}
                                            </div>
                                        )}

                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                                {record.creador.nombre}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {record.creador.email}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Derecha: fecha creación */}
                                    <div className="text-xs text-gray-500 whitespace-nowrap">
                                        {record.creadorFecha || "—"}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">—</div>
                            )}
                        </Card>
                    )}

                    {!isCreate && (
                        <Card
                            title="ÚLTIMA MODIFICACIÓN"
                            icon={PencilIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            {record.modificador ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {record.modificador.avatar ? (
                                            <img
                                                src={record.modificador.avatar}
                                                className="h-7 w-7 rounded-full object-cover"
                                                alt=""
                                            />
                                        ) : (
                                            <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                                                {(record.modificador.nombre?.match(/\b\w/g) || [])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase() || "US"}
                                            </div>
                                        )}

                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                                {record.modificador.nombre}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {record.modificador.email}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-500 whitespace-nowrap">
                                        {record.modificadorFecha || "—"}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">—</div>
                            )}
                        </Card>
                    )}

                </div>
            </div>
        </div>
    );
}
