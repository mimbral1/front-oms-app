// views\MonitoreoView\AdmModulosEndpoints\components\AdmModulosEndpointsFields.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";

/* ===== Tipos ===== */
export type FormMode = "modulo" | "submodulo";

export type ModuloForm = {
    plataformaId?: string; // select
    nombre: string;
    codigo: string;
    ruta: string;
    descripcion: string;
};

export type SubmoduloForm = {
    moduloId?: string; // select
    nombre: string;
    codigo: string;
    descripcion: string;
    ruta: string;
};

export function AdmModulosEndpointsFields({
    mode,
    moduloForm,
    submoduloForm,
    onModuloChange,
    onSubmoduloChange,
    isCreate = true, // por consistencia con otros Fields
}: {
    mode: FormMode;
    moduloForm: ModuloForm;
    submoduloForm: SubmoduloForm;
    onModuloChange: (k: keyof ModuloForm, v: any) => void;
    onSubmoduloChange: (k: keyof SubmoduloForm, v: any) => void;
    isCreate?: boolean;
}) {
    const { fetchWithAuth } = useFetchWithAuth();

    /* ======= Opciones (Plataformas / Módulos) ======= */
    const [platformOptions, setPlatformOptions] = useState<{ label: string; value: string }[]>([]);
    const [platformSearch, setPlatformSearch] = useState("");
    const [loadingPlatforms, setLoadingPlatforms] = useState(false);

    const [moduleOptions, setModuleOptions] = useState<{ label: string; value: string }[]>([]);
    const [moduleSearch, setModuleSearch] = useState("");
    const [loadingModules, setLoadingModules] = useState(false);

    // carga listado de plataformas
    useEffect(() => {
        let mounted = true;
        const loadPlatforms = async () => {
            try {
                setLoadingPlatforms(true);
                // GET /idservice/plataformas/obtener  -> { ok, total, data: [{ ID, NOMBRE, CODIGO, ...}] } o array plano
                const res = await fetchWithAuth<any>("idservice/plataformas/obtener");

                const list: any[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
                if (!mounted) return;

                setPlatformOptions(
                    list.map((p) => ({
                        label: `${String(p?.NOMBRE ?? "")} (${String(p?.CODIGO ?? "")})`.trim(),
                        value: String(p?.ID ?? ""),
                    }))
                );
            } catch {
                setPlatformOptions([]);
            } finally {
                if (mounted) setLoadingPlatforms(false);
            }
        };

        loadPlatforms();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    // carga listado de módulos
    useEffect(() => {
        let mounted = true;
        const loadModules = async () => {
            try {
                setLoadingModules(true);
                // GET /idservice/modulos  -> puede venir como array plano o { data: [...] }
                const res = await fetchWithAuth<any>("idservice/modulos");

                const list: any[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
                if (!mounted) return;

                setModuleOptions(
                    list.map((m) => ({
                        label: `${String(m?.NOMBRE ?? "")} (${String(m?.CODIGO ?? "")})`.trim(),
                        value: String(m?.ID ?? ""),
                    }))
                );
            } catch {
                setModuleOptions([]);
            } finally {
                if (mounted) setLoadingModules(false);
            }
        };

        loadModules();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    const filteredPlatforms = useMemo(() => {
        const q = platformSearch.toLowerCase();
        const base = [{ label: "Seleccione plataforma…", value: "" }, ...platformOptions];
        if (!q) return base;
        return base.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [platformOptions, platformSearch]);

    const filteredModules = useMemo(() => {
        const q = moduleSearch.toLowerCase();
        const base = [{ label: "Seleccione módulo…", value: "" }, ...moduleOptions];
        if (!q) return base;
        return base.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [moduleOptions, moduleSearch]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* ======== COLUMNA IZQUIERDA ======== */}
                <div className="lg:col-span-4 space-y-6">
                    {/* —— 1) CREAR MÓDULO —— */}
                    {mode === "modulo" && (
                        <Card title="1) CREAR MÓDULO" noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                            <div className="grid grid-cols-6 gap-4">
                                {/* Plataforma */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Plataforma</span>
                                <div className="col-span-5">
                                    <SelectSearchInline
                                        id="plataforma"
                                        label="Plataforma"
                                        value={moduloForm.plataformaId || ""}
                                        options={filteredPlatforms}
                                        searchQuery={platformSearch}
                                        loading={loadingPlatforms}
                                        onSearch={setPlatformSearch}
                                        onChange={(val) => onModuloChange("plataformaId", val)}
                                        placeholderFromDefault
                                    />
                                </div>

                                {/* Nombre */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                                <div className="col-span-5">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={moduloForm.nombre}
                                        onChange={(e) => onModuloChange("nombre", e.target.value)}
                                        placeholder="Ej: PICKING"
                                    />
                                </div>

                                {/* Código */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Código</span>
                                <div className="col-span-5">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={moduloForm.codigo}
                                        onChange={(e) => onModuloChange("codigo", e.target.value)}
                                        placeholder="Ej: OMS-PI"
                                    />
                                </div>

                                {/* Ruta */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Ruta (Front)</span>
                                <div className="col-span-5">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={moduloForm.ruta}
                                        onChange={(e) => onModuloChange("ruta", e.target.value)}
                                        placeholder="Ej: /picking"
                                    />
                                </div>

                                {/* Descripción */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                                <div className="col-span-5">
                                    <textarea
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        rows={3}
                                        value={moduloForm.descripcion}
                                        onChange={(e) => onModuloChange("descripcion", e.target.value)}
                                        placeholder="Ej: Módulo de picking y preparación"
                                    />
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* —— 2) CREAR SUBMÓDULO —— */}
                    {mode === "submodulo" && (
                        <Card title="2) CREAR SUBMÓDULO" noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                            <div className="grid grid-cols-6 gap-4">
                                {/* Módulo (select) */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Módulo ID</span>
                                <div className="col-span-5">
                                    <SelectSearchInline
                                        id="modulo"
                                        label="Módulo"
                                        value={submoduloForm.moduloId || ""}
                                        options={filteredModules}
                                        searchQuery={moduleSearch}
                                        loading={loadingModules}
                                        onSearch={setModuleSearch}
                                        onChange={(val) => onSubmoduloChange("moduloId", val)}
                                        placeholderFromDefault
                                    />
                                </div>

                                {/* Nombre */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                                <div className="col-span-5">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={submoduloForm.nombre}
                                        onChange={(e) => onSubmoduloChange("nombre", e.target.value)}
                                        placeholder="Ej: Órdenes en Picking"
                                    />
                                </div>

                                {/* Código */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Código</span>
                                <div className="col-span-5">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={submoduloForm.codigo}
                                        onChange={(e) => onSubmoduloChange("codigo", e.target.value)}
                                        placeholder="Ej: OMS-PI-ORD"
                                    />
                                </div>

                                {/* Ruta */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Ruta (Front)</span>
                                <div className="col-span-5">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        value={submoduloForm.ruta}
                                        onChange={(e) => onSubmoduloChange("ruta", e.target.value)}
                                        placeholder="Ej: /picking/ordenes"
                                    />
                                </div>

                                {/* Descripción */}
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                                <div className="col-span-5">
                                    <textarea
                                        className="w-full border-b border-gray-300 text-sm outline-none"
                                        rows={3}
                                        value={submoduloForm.descripcion}
                                        onChange={(e) => onSubmoduloChange("descripcion", e.target.value)}
                                        placeholder="Ej: Listado y gestión de órdenes en picking"
                                    />
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* ======== COLUMNA DERECHA ======== */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Por si hay que agregar usuario creador y fecha de modificacion o algo asi */}
                </div>
            </div>
        </div>
    );
}
