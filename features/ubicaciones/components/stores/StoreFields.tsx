// views\Ubicaciones\Stores\components\StoresFields.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserCircleIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";


/* Interfaz (análogo a SalesChannel) */
export interface StoreRecord {
    id?: string; // string para UI
    companyId?: number;
    companyName?: string;
    name: string;
    email: string;
    phone: string;
    status: "Activo" | "Inactivo";
    created: { username: string; email: string; date: string };
    modified?: { username: string; email: string; date: string };
}

type CompanyApiRow = {
    Id?: number | string;
    BusinessName?: string;
    LegalName?: string;
};

export function StoreFields({
    record,
    readOnly: _readOnly = false,
    onChange,
    isCreate = false, // modo creación para condicionar campos/secciones
}: {
    record: StoreRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof StoreRecord>(field: K, value: StoreRecord[K]) => void;
    isCreate?: boolean;
}) {
    const handle = <K extends keyof StoreRecord>(field: K) => (v: StoreRecord[K]) => onChange?.(field, v);

    // Estado local de compañías (lista + búsqueda + carga), mismo patrón que SalesChannelsFields
    const { fetchWithAuth } = useFetchWithAuth(); // centraliza token + x-plataforma-id
    const [companies, setCompanies] = useState<Array<{ Id: number; BusinessName: string }>>([]);
    const [companiesLoading, setCompaniesLoading] = useState(false);
    const [companySearch, setCompanySearch] = useState("");

    useEffect(() => {
        let mounted = true;
        const loadCompanies = async () => {
            try {
                setCompaniesLoading(true);
                // GET /company (ruta relativa: el helper agrega URL_BASE)
                const res = await fetchWithAuth<{ ok: boolean; data: CompanyApiRow[] }>("comerce-service/company");
                if (!mounted) return;
                const rows = Array.isArray(res?.data) ? res.data : [];
                setCompanies(
                    rows.map((c) => ({
                        Id: Number(c?.Id),
                        BusinessName: String(c?.BusinessName ?? c?.LegalName ?? `#${c?.Id ?? ""}`),
                    }))
                );
            } catch {
                // mismo manejo tranquilo
                setCompanies([]);
            } finally {
                if (mounted) setCompaniesLoading(false);
            }
        };
        loadCompanies();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]); // :contentReference[oaicite:3]{index=3}

    // Opciones para el selector (con "Seleccione…")
    const companyOptions = useMemo(
        () => [
            { label: "Seleccione compañía…", value: "" },
            ...companies.map((c) => ({ label: `${c.BusinessName}`, value: String(c.Id) })),
        ],
        [companies]
    ); // :contentReference[oaicite:4]{index=4}

    // Filtro local al escribir (misma idea que select-search del header)
    const visibleOptions = useMemo(() => {
        const q = companySearch.trim().toLowerCase();
        if (!q) return companyOptions;
        return companyOptions.filter((opt) => (opt.label + " " + opt.value).toLowerCase().includes(q));
    }, [companyOptions, companySearch]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLE */} {/* (no modifico comentarios ni estructura) */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Compañía (selector con búsqueda, estilo select-search) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Compañía</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="company"
                                    label="Compañía"
                                    value={record.companyId ? String(record.companyId) : ""}
                                    options={visibleOptions}
                                    searchQuery={companySearch}
                                    loading={companiesLoading}
                                    onSearch={setCompanySearch}
                                    onChange={(val, label) => {
                                        const nextId = val ? Number(val) : undefined;
                                        handle("companyId")(nextId);
                                        handle("companyName")(label || "");
                                    }}
                                    placeholderFromDefault
                                />
                            </div>

                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.name}
                                    onChange={(e) => handle("name")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Email */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.email}
                                    onChange={(e) => handle("email")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Teléfono */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Teléfono</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.phone}
                                    onChange={(e) => handle("phone")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Estado (switch simple) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.status === "Activo"}
                                    onClick={() => handle("status")(record.status === "Activo" ? "Inactivo" : "Activo")}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.status === "Activo" ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.status === "Activo" ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ================ COLUMNA DERECHA ================ */}
                <div className="lg:col-span-3 space-y-6">
                    {/* USUARIO CREADOR */}
                    {!isCreate && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserCircleIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                                        {(record.created?.username?.[0] || "U").toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{record.created?.username || "—"}</span>
                                        <span className="text-xs text-gray-500">{record.created?.email || "—"}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">{record.created?.date || "—"}</span>
                            </div>
                        </Card>
                    )}

                    {/* ÚLTIMA MODIFICACIÓN */}
                    {!isCreate && (
                        <Card
                            title="ÚLTIMA MODIFICACIÓN"
                            icon={PencilSquareIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-xs font-semibold text-white">
                                        {(record.modified?.username?.[0] || "U").toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{record.modified?.username || "—"}</span>
                                        <span className="text-xs text-gray-500">{record.modified?.email || "—"}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">{record.modified?.date || "—"}</span>
                            </div>
                        </Card>
                    )}
                </div>

            </div>
        </div>
    );
}
