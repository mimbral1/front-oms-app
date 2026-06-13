// views\Cuenta\Usuarios\components\UsuariosFields.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    UserIcon,
    BuildingStorefrontIcon,
    PhotoIcon,
    PencilIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";

// importamos los mismos componentes que usas en Login para el ojo
import { IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { estandarizarRut } from "@/features/customers/components/clientes/utils-rut";

import { useAuth } from "@/app/context/auth/AuthContext";
import { URL_BASE } from "@/lib/http/endpoints";

export type Usuario = {
    nombre: string;
    apellido: string;
    email: string;
    idFuncionario: string;            // ID (NO se muestra en Nuevo)
    documento: string;        // rut

    perfil?: string[];           // rolId (string numérica)
    // múltiples roles (IDs como string)
    roles?: string[];
    // canal de venta seleccionado (cuando el perfil contiene "vendedor")
    salesChannelId?: string;
    // metadatos para el POST
    salesChannelName?: string;   // -> "canalDeVenta"
    salesChannelRefId?: string;  // -> "canalDeVentaId"

    idDepartamento: string;    // departamentoId (string numérica)
    tipo: "dev" | "regular";
    externo: boolean;
    soloLectura: boolean;
    idioma: string;
    estado: "Activo" | "Inactivo";
    password: string;        // (Nuevo)
    telefono?: string;

    // multi-select de plataformas (IDs como string)
    plataformas: string[];

    avatarUrl?: string;
    comercioAccesoTotal: boolean;
    creador?: {
        nombre: string;
        email: string;
        avatar?: string;
    };
    creadorFecha?: string;

    modificador?: {
        nombre: string;
        email: string;
        avatar?: string;
    };
    modificadorFecha?: string;
};

type Opt = { label: string; value: string };

const X_PLATAFORMA_ID = "1";

export function UsuariosFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
    errors,
    onReady,
    onAvatarMessage,
    onAvatarSaving,
    avatarSaving,
    onAvatarClick,
}: {
    record: Usuario;
    readOnly?: boolean;
    onChange?: <K extends keyof Usuario>(field: K, value: Usuario[K]) => void;
    isCreate?: boolean;
    errors?: Partial<Record<keyof Usuario, string>>;
    onReady?: () => void;
    onAvatarMessage?: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
    onAvatarSaving?: (saving: boolean) => void;
    avatarSaving?: boolean;
    onAvatarClick?: () => void;
}) {
    const { fetchWithAuth } = useFetchWithAuth();
    const { token } = useAuth();

    const handle =
        <K extends keyof Usuario>(field: K) =>
            (value: Usuario[K]) =>
                onChange?.(field, value);

    const err = (k: keyof Usuario) => errors?.[k];

    // estado local para el visor de contraseña (idéntico a Login)
    const [showPwd, setShowPwd] = useState(false);

    // Roles
    const [roles, setRoles] = useState<Opt[]>([{ value: "", label: "Seleccione rol" }]);
    const [roleSearch, setRoleSearch] = useState("");
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetchWithAuth<{
                    page: number;
                    pageSize: number;
                    totalRecords: number;
                    totalPages: number;
                    data: { ID: number; Nombre: string }[];
                }>("idservice/roles?page=1&pageSize=50", { method: "GET" });
                const opts = res?.data?.map((r) => ({ value: String(r.ID), label: r.Nombre })) ?? [];
                if (!mounted) return;
                setRoles([{ value: "", label: "Seleccione rol" }, ...opts]);
                setRolesLoaded(true); // terminó de cargar los datos 
            } catch (e) {
                setRolesLoaded(true); // terminó de cargar los datos 
                console.warn("No se pudieron cargar roles", e);
            }
        })();
        return () => { mounted = false; };
    }, [fetchWithAuth]);

    const filteredRoles = useMemo(() => {
        const q = roleSearch.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [roles, roleSearch]);

    // Departamentos
    const [deptOpts, setDeptOpts] = useState<Opt[]>([{ value: "", label: "Seleccione departamento" }]);
    const [deptQuery, setDeptQuery] = useState("");
    const deptTimer = useRef<number | undefined>(undefined);
    useEffect(() => {
        if (deptTimer.current) window.clearTimeout(deptTimer.current);
        // @ts-ignore
        deptTimer.current = window.setTimeout(async () => {
            try {
                const url = `idservice/departments/get?buscar=${encodeURIComponent(deptQuery || "")}`;
                const res = await fetchWithAuth<{
                    ok: boolean;
                    total: number;
                    data: { DepartmentId: number; Name: string }[];
                }>(url, { method: "GET" });
                const opts = res?.data?.map((d) => ({ value: String(d.DepartmentId), label: d.Name })) ?? [];
                setDeptOpts([{ value: "", label: "Seleccione departamento" }, ...opts]);
                setDeptLoaded(true); // terminó de cargar los datos 
            } catch (e) {
                setDeptLoaded(true); // terminó de cargar los datos 
                console.warn("No se pudieron cargar departamentos", e);
            }
        }, 300);
        return () => { if (deptTimer.current) window.clearTimeout(deptTimer.current); };
    }, [deptQuery, fetchWithAuth]);

    // Plataformas (multi)
    const [platOpts, setPlatOpts] = useState<Opt[]>([{ value: "", label: "Seleccione plataforma…" }]);
    const [platSearch, setPlatSearch] = useState("");
    const [platLoading, setPlatLoading] = useState(false);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setPlatLoading(true);
                const res = await fetchWithAuth<{ ok: boolean; total: number; data: { ID: number; NOMBRE: string }[] }>(
                    "idservice/plataformas/obtener",
                    { method: "GET" }
                );
                const opts = (res?.data ?? []).map((p) => ({ value: String(p.ID), label: p.NOMBRE }));
                if (!mounted) return;
                setPlatOpts([{ value: "", label: "Seleccione plataforma…" }, ...opts]);
            } catch (e) {
                console.warn("No se pudieron cargar plataformas", e);
            } finally {
                if (mounted) {
                    setPlatLoading(false);
                    setPlatLoaded(true); // terminó de cargar los datos 
                }
            }
        })();
        return () => { mounted = false; };
    }, [fetchWithAuth]);

    const visiblePlats = useMemo(() => {
        const q = platSearch.trim().toLowerCase();
        if (!q) return platOpts;
        return platOpts.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [platOpts, platSearch]);

    const visiblePlatsLookup = useMemo(() => {
        const m = new Map<string, string>();
        platOpts.forEach((o) => m.set(o.value, o.label));
        return m;
    }, [platOpts]);

    const platformLabel = (value: string) => visiblePlatsLookup.get(value) || value;

    const addPlataforma = (value: string) => {
        if (!value) return;
        const exists = (record.plataformas || []).includes(value);
        if (exists) return;
        handle("plataformas")([...(record.plataformas || []), value] as any);
    };

    const removePlataforma = (value: string) => {
        handle("plataformas")((record.plataformas || []).filter((v) => v !== value) as any);
    };

    // ===================== Canales de venta =====================
    // Helper sin flag 'u' ni \p{Diacritic}
    const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Lookups para roles (id -> label)
    const roleLabelById = useMemo(() => {
        const m = new Map<string, string>();
        roles.forEach(o => m.set(o.value, o.label));
        return m;
    }, [roles]);

    // ¿algún rol seleccionado contiene "vendedor"?
    const isVendedor = useMemo(() => {
        const ids = Array.isArray(record.perfil) ? record.perfil : [];
        const labels = ids.map((id: string) => roleLabelById.get(id) ?? "");
        return labels.some(lbl => stripDiacritics(lbl).toLowerCase().includes("vendedor"));
    }, [record.roles, record.perfil, roleLabelById]);

    // Opciones de canales y LUT (id -> {Name, ReferenceId})
    type SalesChMeta = { id: string; name: string; refId: string; label: string; };
    const [salesChOpts, setSalesChOpts] = useState<Opt[]>([{ value: "", label: "Seleccione canal…" }]);
    const [salesChSearch, setSalesChSearch] = useState("");
    const [salesChLoading, setSalesChLoading] = useState(false);

    // Flags de carga completa
    const [rolesLoaded, setRolesLoaded] = useState(false);
    const [deptLoaded, setDeptLoaded] = useState(false);
    const [platLoaded, setPlatLoaded] = useState(false);
    const [salesLoaded, setSalesLoaded] = useState(false);

    const salesChByIdRef = useRef<Map<string, SalesChMeta>>(new Map());

    // canales de venta 
    useEffect(() => {
        let mounted = true;
        if (!isVendedor) {
            setSalesChOpts([{ value: "", label: "Seleccione canal…" }]);
            salesChByIdRef.current = new Map();
            if (record.salesChannelId) {
                // limpia selección y metadatos si deja de ser vendedor
                onChange?.("salesChannelId", "" as any);
                onChange?.("salesChannelName", "" as any);
                onChange?.("salesChannelRefId", "" as any);
            }
            setSalesLoaded(true); // terminó de cargar los datos 
            return;
        }
        (async () => {
            try {
                setSalesChLoading(true);
                const res = await fetchWithAuth<{
                    ok?: boolean;
                    page?: number; pageSize?: number; total?: number;
                    data?: Array<{
                        Id: number; ReferenceId: string; Name: string;
                        CompanyId: number; CompanyName: string;
                        ExternalDelivery: boolean; IsActive: boolean;
                        CreatedAt: string; UpdatedAt: string | null;
                        UserCreated: string; UserModified: string | null;
                    }>;
                }>("comerce-service/sales-channel/Listar?", { method: "GET" });

                const arr = res?.data ?? [];
                const opts: Opt[] = arr.map(c => ({
                    value: String(c.Id),
                    label: c.Name + (c.ExternalDelivery ? " (Entrega externa)" : "")
                }));
                const lut = new Map<string, SalesChMeta>();
                arr.forEach(c => {
                    lut.set(String(c.Id), { id: String(c.Id), name: c.Name, refId: c.ReferenceId, label: c.Name });
                });

                if (!mounted) return;
                salesChByIdRef.current = lut;
                setSalesChOpts([{ value: "", label: "Seleccione canal…" }, ...opts]);
                // Autoselect por ReferenceId si vino desde la API y aún no hay selección
                if (record.salesChannelRefId && !record.salesChannelId) {
                    const match = Array.from(lut.values()).find(m => m.refId === record.salesChannelRefId);
                    if (match) {
                        onChange?.("salesChannelId", match.id as any);
                        onChange?.("salesChannelName", match.name as any);
                        onChange?.("salesChannelRefId", match.refId as any);
                    }
                }
                setSalesLoaded(true); // terminó de cargar los datos 
            } catch (e) {
                console.warn("No se pudieron cargar canales de venta", e);
                if (mounted) {
                    setSalesLoaded(true); // terminó de cargar los datos 
                    salesChByIdRef.current = new Map();
                    setSalesChOpts([{ value: "", label: "Seleccione canal…" }]);
                }
            } finally {
                if (mounted) setSalesChLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [isVendedor, fetchWithAuth]);

    const visibleSalesChOpts = useMemo(() => {
        const q = salesChSearch.trim().toLowerCase();
        if (!q) return salesChOpts;
        return salesChOpts.filter(o => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [salesChOpts, salesChSearch]);
    // =================== Canales de venta ===================

    // =================== Subir imagen avatar ================
    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !record.idFuncionario) return;

        // validar mime
        const allowed = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowed.includes(file.type)) {
            onAvatarMessage?.({ type: "error", text: "Formato no permitido, prueba con otra imagen." });
            return;
        }

        try {
            onAvatarSaving?.(true); //  ACTIVAR GUARDANDO EN EL ESTADO
            onAvatarMessage?.(null);

            const formData = new FormData();
            formData.append("imagen", file);

            const t = token || JSON.parse(localStorage.getItem("authState") || "{}")?.token;
            const url = `${URL_BASE}/idservice/perfiles/subir-imagen/${record.idFuncionario}`;

            const resp = await fetch(url, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${t}`,
                    "x-plataforma-id": X_PLATAFORMA_ID
                },
                body: formData
            });

            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(txt);
            }

            const json = await resp.json();
            const newUrl = json.url || json.perfil?.URLImagenPerfil;

            if (newUrl) onChange?.("avatarUrl", newUrl);

            onAvatarMessage?.({ type: "success", text: "Imagen subida correctamente." });

        } catch (err: any) {
            onAvatarMessage?.({ type: "error", text: err?.message || "Error al subir imagen." });
        } finally {
            onAvatarSaving?.(false); // ↍ DESACTIVAR GUARDANDO
        }
    };

    // helper para formatear fechas 
    const formatFechaCL = (value?: string) => {
        if (!value) return "—";

        // soporta: 2025-08-12T10:14:22.200
        const [date, time] = value.split("T");
        if (!date || !time) return value;

        const [yyyy, mm, dd] = date.split("-");
        const hhmmss = time.split(".")[0]; // corta milisegundos

        if (!yyyy || !mm || !dd) return value;

        return `${dd}/${mm}/${yyyy} ${hhmmss}`;
    };


    // efecto para cargar todos los datos antes de mostrar la vista 
    useEffect(() => {
        const ready =
            rolesLoaded &&
            deptLoaded &&
            platLoaded &&
            salesLoaded;

        if (ready && onReady) {
            onReady();
        }
    }, [rolesLoaded, deptLoaded, platLoaded, salesLoaded, onReady]);

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
                                <input
                                    className={`w-full border-b bg-transparent text-sm outline-none ${err("nombre") ? "border-red-500" : "border-gray-300"}`}
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    readOnly={readOnly}
                                    aria-invalid={!!err("nombre")}
                                    aria-describedby={err("nombre") ? "error-nombre" : undefined}
                                    placeholder="Nombre"
                                />
                                {err("nombre") && <p id="error-nombre" className="mt-1 text-xs text-red-600">{err("nombre")}</p>}
                            </div>

                            {/* Apellido */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Apellido</span>
                            <div className="col-span-5">
                                <input
                                    className={`w-full border-b bg-transparent text-sm outline-none ${err("apellido") ? "border-red-500" : "border-gray-300"}`}
                                    value={record.apellido}
                                    onChange={(e) => handle("apellido")(e.target.value)}
                                    readOnly={readOnly}
                                    aria-invalid={!!err("apellido")}
                                    aria-describedby={err("apellido") ? "error-apellido" : undefined}
                                    placeholder="Apellido"
                                />
                                {err("apellido") && <p id="error-apellido" className="mt-1 text-xs text-red-600">{err("apellido")}</p>}
                            </div>

                            {/* Email */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                            <div className="col-span-5">
                                <input
                                    type="email"
                                    className={`w-full border-b bg-transparent text-sm outline-none ${err("email") ? "border-red-500" : "border-gray-300"}`}
                                    value={record.email}
                                    onChange={(e) => handle("email")(e.target.value)}
                                    readOnly={readOnly}
                                    aria-invalid={!!err("email")}
                                    aria-describedby={err("email") ? "error-email" : undefined}
                                    placeholder="correo@dominio.cl"
                                />
                                {err("email") && <p id="error-email" className="mt-1 text-xs text-red-600">{err("email")}</p>}
                            </div>

                            {/* Password (solo en Nuevo)  */}
                            {isCreate && (
                                <>
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Password</span>
                                    <div className="col-span-5 relative">
                                        <input
                                            type={showPwd ? "text" : "password"}
                                            className={`w-full border-b bg-transparent text-sm outline-none ${err("password") ? "border-red-500" : "border-gray-300"}`}
                                            value={record.password ?? ""}
                                            onChange={(e) => handle("password")(e.target.value)}
                                            readOnly={readOnly}
                                            aria-invalid={!!err("password")}
                                            aria-describedby={err("password") ? "error-password" : undefined}
                                            placeholder="••••••••"
                                        />
                                        <IconButton
                                            onClick={() => setShowPwd(!showPwd)}
                                            edge="end"
                                            size="small"
                                            sx={{ position: "absolute", right: "2px", top: "-5px" }}
                                            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            {showPwd ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                        {err("password") && <p id="error-password" className="mt-1 text-xs text-red-600">{err("password")}</p>}
                                    </div>
                                </>
                            )}

                            {/* Ref ID: NO se muestra en Nuevo */}
                            {!isCreate && (
                                <>
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Ref ID</span>
                                    <div className="col-span-5">
                                        <input
                                            className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                            value={record.idFuncionario}
                                            onChange={(e) => handle("idFuncionario")(e.target.value)}
                                            readOnly={readOnly}
                                            placeholder="ID"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Documento */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Documento</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                    value={record.documento}
                                    onChange={(e) => handle("documento")(estandarizarRut(e.target.value))}
                                    readOnly={readOnly}
                                    placeholder="12.345.678-9"
                                    maxLength={12}
                                />
                                {err("documento") && (
                                    <p className="mt-1 text-xs text-red-600">{err("documento")}</p>
                                )}
                            </div>

                            {/* Teléfono */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Teléfono</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                    value={record.telefono ?? ""}
                                    onChange={(e) => handle("telefono")(e.target.value)}
                                    readOnly={readOnly}
                                    placeholder="+56 9 1122 3344"
                                />
                            </div>

                            {/* PERFIL — multi-select igual que Plataformas */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Perfil</span>
                            <div className="col-span-5">

                                {/* Selector: siempre vacío para agregar múltiples */}
                                <SelectSearchInline
                                    id="perfil"
                                    label="Rol"
                                    value=""
                                    options={filteredRoles}
                                    searchQuery={roleSearch}
                                    onSearch={setRoleSearch}
                                    onChange={(value) => {
                                        if (!value) return;
                                        const current = record.perfil || [];
                                        if (current.includes(value)) return;
                                        onChange?.("perfil", [...current, value] as any);
                                    }}
                                />

                                {/* Chips seleccionados */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(record.perfil || []).map((rid) => (
                                        <span
                                            key={rid}
                                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                                        >
                                            {roleLabelById.get(rid) ?? rid}
                                            <button
                                                type="button"
                                                className="ml-2 text-gray-500 hover:text-gray-800"
                                                onClick={() =>
                                                    onChange?.(
                                                        "perfil",
                                                        (record.perfil || []).filter((v: string) => v !== rid) as any
                                                    )
                                                }
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {err("perfil") && (
                                    <p className="mt-1 text-xs text-red-600">{err("perfil")}</p>
                                )}
                            </div>

                            {/* Canal de venta (visible si algún rol seleccionado contiene "vendedor") */}
                            {isVendedor && (
                                <>
                                    <span className="col-span-1 text-sm text-gray-600 font-bold">Canal de venta</span>
                                    <div className="col-span-5">
                                        <SelectSearchInline
                                            id="salesChannel"
                                            label="Canal de venta"
                                            value={record.salesChannelId ?? ""}
                                            options={visibleSalesChOpts}
                                            searchQuery={salesChSearch}
                                            loading={salesChLoading}
                                            onSearch={setSalesChSearch}
                                            onChange={(value) => {
                                                onChange?.("salesChannelId", value as any);
                                                const meta = value ? salesChByIdRef.current.get(String(value)) : undefined;
                                                onChange?.("salesChannelName", (meta?.name ?? "") as any);
                                                onChange?.("salesChannelRefId", (meta?.refId ?? "") as any);
                                            }}
                                        />

                                        {/* Si tu validación marca error formal, lo mostramos como siempre */}
                                        {err("salesChannelId") && (
                                            <p id="error-salesChannelId" className="mt-1 text-xs text-red-600">
                                                {err("salesChannelId")}
                                            </p>
                                        )}

                                        {/* aviso rojo cuando está visible pero vacío (no bloqueante) */}
                                        {/* {!err("salesChannelId") && !record.salesChannelId && (
                                            <p className="mt-1 text-xs text-red-600">
                                                Canal de venta sin seleccionar
                                            </p>
                                        )} */}
                                    </div>
                                </>
                            )}

                            {/* Departamento */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Departamento</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="departamento"
                                    label="Departamento"
                                    value={record.idDepartamento ?? ""}
                                    options={deptOpts}
                                    searchQuery={deptQuery}
                                    onSearch={setDeptQuery}
                                    onChange={(value) => handle("idDepartamento")(value)}
                                />
                                {err("idDepartamento") && <p className="mt-1 text-xs text-red-600">{err("idDepartamento")}</p>}
                            </div>

                            {/* Plataformas (multi) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Plataformas</span>
                            <div className="col-span-5">
                                <SelectSearchInline
                                    id="plataformas"
                                    label="Plataforma"
                                    value={"" /* siempre vacío para permitir agregar múltiples */}
                                    options={visiblePlats}
                                    searchQuery={platSearch}
                                    loading={platLoading}
                                    onSearch={setPlatSearch}
                                    onChange={(val) => addPlataforma(val)}
                                />
                                {/* Chips seleccionados */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(record.plataformas || []).map((pid) => (
                                        <span key={pid} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                                            {platformLabel(pid)}
                                            <button
                                                type="button"
                                                className="ml-2 text-gray-500 hover:text-gray-800"
                                                onClick={() => removePlataforma(pid)}
                                                aria-label="Quitar plataforma"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {err("plataformas") && <p className="mt-1 text-xs text-red-600">{err("plataformas") as any}</p>}
                            </div>

                            {/* Tipo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.tipo}
                                    options={["dev", "regular"]}
                                    onChange={(v) => handle("tipo")(v as Usuario["tipo"])}
                                />
                            </div>

                            {/* Externo */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Externo</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.externo}
                                    onClick={() => handle("externo")(!record.externo)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.externo ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.externo ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>

                            {/* Solo lectura */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Solo lectura</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.soloLectura}
                                    onClick={() => handle("soloLectura")(!record.soloLectura)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.soloLectura ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.soloLectura ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>

                            {/* Idioma principal */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Idioma principal</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.idioma}
                                    options={["Español", "Português", "English"]}
                                    onChange={(v) => handle("idioma")(String(v))}
                                />
                            </div>

                            {/* Estado */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.estado}
                                    options={["Activo", "Inactivo"]}
                                    onChange={(v) => handle("estado")(v as Usuario["estado"])}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card title="AVATAR" icon={PhotoIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="flex flex-col items-center gap-3">

                            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">

                                {avatarSaving ? (
                                    <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-500" />
                                ) : record.avatarUrl ? (
                                    <img
                                        src={record.avatarUrl}
                                        className="h-20 w-20 object-cover cursor-pointer"
                                        onClick={onAvatarClick}
                                    />
                                ) : (
                                    <PhotoIcon className="h-10 w-10 text-gray-400" />
                                )}


                            </div>

                            {/* Botón Cambiar imagen */}
                            {!readOnly && !isCreate && record.idFuncionario && (
                                <label className="cursor-pointer px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                    Cambiar imagen
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleUploadImage}
                                    />
                                </label>
                            )}
                        </div>
                    </Card>

                    <Card title="COMERCIO" icon={BuildingStorefrontIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-2 text-sm text-gray-600 font-bold">Acceso total</span>
                            <div className="col-span-4">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.comercioAccesoTotal}
                                    onClick={() => handle("comercioAccesoTotal")(!record.comercioAccesoTotal)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.comercioAccesoTotal ? "bg-blue-500" : "bg-gray-300"}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.comercioAccesoTotal ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>
                        </div>
                    </Card>

                    {!isCreate && (
                        <Card title="USUARIO CREADOR" icon={UserIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
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
                                        {formatFechaCL(record.creadorFecha)}
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
                                        {formatFechaCL(record.modificadorFecha)}
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
