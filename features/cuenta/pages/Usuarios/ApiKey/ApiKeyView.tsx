// views\Cuenta\Usuarios\ApiKey\ApiKeyView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon, PlusCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { ActionButton } from "@/components/ui/button/action-button";

type ApiKeyRow = {
    id: string;
    name: string;
    key: string;
    secret?: string;
    createdBy?: { name: string; email: string; avatar?: string };
    platformId?: string;
    platformName?: string;
    type?: string;
    message?: string;
    createdAt?: string;
    active?: boolean;
};

type Opt = { value: string; label: string };

export default function UsuarioApiKeysView() {
    const router = useRouter();
    const params = useParams();

    const viewUserId = String(params?.id ?? "");
    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();
    const activeUserId = Number(user?.id || 0);

    const [showCreator, setShowCreator] = useState(false);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: showCreator ? "Ocultar" : "Nuevo",
                icon: <PlusCircleIcon className="h-5 w-5" />,
                onClick: () => setShowCreator((v) => !v),
                variant: "success",
                disabled: false,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/cuenta/usuarios/listado-usuarios"),
                disabled: false,
            },
        ],
        [router, showCreator]
    );

    // --- Datos para page header ---
    const [headerName, setHeaderName] = useState<string>("API Keys");
    const [headerActive, setHeaderActive] = useState<boolean | null>(null);

    // --- Carga mínima para el header (igual que en Resumen): obtiene nombres y estado ---
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // mismo endpoint que usa el resumen de usuarios: /idservice/perfiles/:id
                const resp = await fetchWithAuth<any>(`idservice/perfiles/${viewUserId}`, { method: "GET" });
                if (!mounted) return;

                const nombres = (resp?.Nombres ?? "").trim();
                const apellidos = (resp?.Apellidos ?? "").trim();
                const fullName = `${nombres} ${apellidos}`.trim() || "Usuario";

                // El backend puede mandar Estado/IsActive/Activo como string/bool -> normalizamos a boolean
                const rawActive = resp?.Estado ?? resp?.IsActive ?? resp?.Activo ?? null;
                const active =
                    typeof rawActive === "string"
                        ? rawActive.toLowerCase() !== "inactivo"
                        : rawActive == null
                            ? null
                            : Boolean(rawActive);

                setHeaderName(fullName);
                setHeaderActive(active);
            } catch {
                setHeaderName("Usuario");
                setHeaderActive(null);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth, viewUserId]);

    // ===== Header (lee snapshot de Resumen y fallback a fetch) =====
    const [hdr, setHdr] = useState<{ name: string; active: boolean } | null>(null);

    // 2.1) Intento 1: leer desde sessionStorage (sin nueva llamada)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(`usr-hdr:${viewUserId}`);
            if (raw) setHdr(JSON.parse(raw));
        } catch { }
    }, [viewUserId]);

    // 2.2) Fallback: si no hay snapshot, pedir lo mínimo al endpoint de perfil
    useEffect(() => {
        if (hdr) return; // ya tenemos snapshot
        let mounted = true;
        (async () => {
            try {
                const resp = await fetchWithAuth<any>(`idservice/perfiles/${viewUserId}`, { method: "GET" });
                const name = [resp?.Nombres ?? "", resp?.Apellidos ?? ""].filter(Boolean).join(" ").trim() || "Usuario";
                // Si tu backend expone otro flag para activo, ajusta acá:
                const active = resp?.UsuarioCreador != null
                    ? (resp?.Estado ?? "Activo") !== "Inactivo"
                    : Boolean(resp?.IsActive ?? true);

                if (mounted) setHdr({ name, active });
            } catch {
                if (mounted) setHdr({ name: "Usuario", active: true }); // último recurso visual
            }
        })();
        return () => { mounted = false; };
    }, [hdr, viewUserId, fetchWithAuth]);

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Usuarios</div>
                    <div className="text-2xl font-semibold text-gray-900">{hdr?.name || "API Keys"}</div>
                </div>
            ),
            action: headerActions,
            status:
                hdr
                    ? { text: hdr.active ? "Activo" : "Inactivo", variant: hdr.active ? "success" : "warning" }
                    : undefined,
        } as PageHeaderProps),
        [headerActions, hdr]
    );

    const splitApiDate = (iso?: string) => {
        if (!iso || typeof iso !== "string") return { date: "—", time: "—" };
        const [d, rest] = iso.split("T");
        const hhmmss = (rest || "").split(".")[0]?.replace("Z", "") || "—";
        return { date: d || "—", time: hhmmss || "—" };
    };

    const [rows, setRows] = useState<ApiKeyRow[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    const loadList = useCallback(async () => {
        setLoadingList(true);
        try {
            const data = await fetchWithAuth<{ message: string; apis: any[] }>(`idservice/api-key/${viewUserId}`, {
                method: "GET",
            });
            const mapped: ApiKeyRow[] =
                (data?.apis ?? []).map((r) => ({
                    id: String(r.ID),
                    name: r.NOMBRE,
                    key: r.APP_KEY,
                    createdBy:
                        r.CreadorNombre || r.CorreoElectronico
                            ? { name: r.CreadorNombre ?? "—", email: r.CorreoElectronico ?? "—", avatar: r.CreadorImagen }
                            : undefined,
                    platformId: r.PLATAFORMA_ID ? String(r.PLATAFORMA_ID) : undefined,
                    platformName: r.PLATAFORMA_NOMBRE ?? undefined,
                    type: r.TIPO,
                    message: r.MENSAJE ?? "-",
                    createdAt: r.FECHA_CREACION ?? undefined,
                    active: Boolean(r.ACTIVO),
                })) || [];
            setRows(mapped);
        } catch {
            setRows([]);
        } finally {
            setLoadingList(false);
        }
    }, [fetchWithAuth, viewUserId]);

    useEffect(() => {
        loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [platOpts, setPlatOpts] = useState<Opt[]>([{ value: "", label: "Seleccione plataforma…" }]);
    const [platQuery, setPlatQuery] = useState("");
    const [platLoading, setPlatLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setPlatLoading(true);
                const res = await fetchWithAuth<{ ok: boolean; total: number; data: { ID: number; NOMBRE: string }[] }>(
                    `idservice/plataformas/obtener?usuarioId=${viewUserId}`,
                    { method: "GET" }
                );
                const opts = (res?.data ?? []).map((p) => ({ value: String(p.ID), label: p.NOMBRE })) || [];
                if (!mounted) return;
                setPlatOpts([{ value: "", label: "Seleccione plataforma…" }, ...opts]);
            } catch {
                if (mounted) setPlatOpts([{ value: "", label: "Seleccione plataforma…" }]);
            } finally {
                if (mounted) setPlatLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth, viewUserId]);

    const visiblePlats = useMemo(() => {
        const q = platQuery.trim().toLowerCase();
        if (!q) return platOpts;
        return platOpts.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [platOpts, platQuery]);

    const platLookup = useMemo(() => {
        const m = new Map<string, string>();
        platOpts.forEach((o) => m.set(o.value, o.label));
        return m;
    }, [platOpts]);

    const [tipoOpts] = useState<Opt[]>([
        { value: "", label: "Seleccione tipo…" },
        { value: "cliente", label: "Cliente" },
        { value: "servidor", label: "Servidor" },
    ]);
    const [tipoQuery, setTipoQuery] = useState("");
    const visibleTipos = useMemo(() => {
        const q = tipoQuery.trim().toLowerCase();
        if (!q) return tipoOpts;
        return tipoOpts.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [tipoOpts, tipoQuery]);

    const [ambienteOpts] = useState<Opt[]>([
        { value: "", label: "Seleccione ambiente…" },
        { value: "productivo", label: "Productivo" },
        { value: "integracion", label: "Integración" },
        { value: "pruebas", label: "Pruebas" },
    ]);
    const [ambienteQuery, setAmbienteQuery] = useState("");
    const visibleAmbientes = useMemo(() => {
        const q = ambienteQuery.trim().toLowerCase();
        if (!q) return ambienteOpts;
        return ambienteOpts.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
    }, [ambienteOpts, ambienteQuery]);

    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<{ nombre: string; plataformaId: string; tipo: string; mensaje: string; ambiente: string }>({
        nombre: "",
        plataformaId: "",
        tipo: "",
        mensaje: "",
        ambiente: "",
    });
    const [errors, setErrors] = useState<{ nombre?: string; plataformaId?: string; tipo?: string; ambiente?: string; general?: string }>(
        {}
    );

    const setF =
        <K extends keyof typeof form>(k: K) =>
            (v: (typeof form)[K]) =>
                setForm((p) => ({ ...p, [k]: v }));

    const validate = useCallback(() => {
        const e: typeof errors = {};
        if (!form.nombre.trim()) e.nombre = "Ingresa un nombre.";
        if (!form.plataformaId) e.plataformaId = "Selecciona una plataforma.";
        if (!form.tipo) e.tipo = "Selecciona un tipo.";
        if (!form.ambiente) e.ambiente = "Selecciona un ambiente.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [form, errors]);

    // Banner efímero (solo nombre/llave/secreta) + contador
    const [ephemeral, setEphemeral] = useState<{ name: string; key: string; secret?: string } | null>(null);
    const [ephemeralCountdown, setEphemeralCountdown] = useState<number>(0);
    const ephemeralTimer = useRef<number | null>(null);
    const ephemeralInterval = useRef<number | null>(null);

    useEffect(() => {
        if (ephemeral) {
            setEphemeralCountdown(60);
            if (ephemeralInterval.current) window.clearInterval(ephemeralInterval.current);
            // @ts-ignore
            ephemeralInterval.current = window.setInterval(() => {
                setEphemeralCountdown((s) => {
                    if (s <= 1) {
                        if (ephemeralTimer.current) window.clearTimeout(ephemeralTimer.current);
                        if (ephemeralInterval.current) window.clearInterval(ephemeralInterval.current);
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
            if (ephemeralTimer.current) window.clearTimeout(ephemeralTimer.current);
            // @ts-ignore
            ephemeralTimer.current = window.setTimeout(() => setEphemeral(null), 60000);
        } else {
            if (ephemeralInterval.current) window.clearInterval(ephemeralInterval.current);
            setEphemeralCountdown(0);
        }
        return () => {
            if (ephemeralInterval.current) window.clearInterval(ephemeralInterval.current);
        };
    }, [ephemeral]);

    const handleCreate = useCallback(async () => {
        if (!validate()) {
            setErrors((p) => ({ ...p, general: "Revisa los campos requeridos." }));
            return;
        }
        try {
            setCreating(true);

            const payload = {
                usuarioId: activeUserId,
                nombre: form.nombre.trim(),
                plataformaId: Number(form.plataformaId),
                tipo: String(form.tipo).toLowerCase(),
                mensaje: form.mensaje || "",
                ambiente: form.ambiente,
            };

            // NUEVO: el POST devuelve appKey/appToken
            const created = await fetchWithAuth<{
                appId: number;
                appKey: string;
                appToken: string;
                tokenPrefix: string;
                tipo: string;
                mensaje: string;
            }>(`idservice/api-key/${viewUserId}`, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            // Recargar listado para que aparezca abajo
            await loadList();

            // Banner con nombre/llave/secreta que vienen del POST
            setEphemeral({
                name: form.nombre.trim(),
                key: String(created?.appKey ?? "-"),
                secret: created?.appToken ? String(created.appToken) : undefined,
            });

            setForm({ nombre: "", plataformaId: "", tipo: "", mensaje: "", ambiente: "" });
            setErrors({});
            setShowCreator(false);
        } finally {
            setCreating(false);
        }
    }, [form, activeUserId, viewUserId, fetchWithAuth, validate, loadList]);

    const [openRotate, setOpenRotate] = useState(false);
    const [rotateTarget, setRotateTarget] = useState<ApiKeyRow | null>(null);
    const [rotateErrorMsg, setRotateErrorMsg] = useState<string | null>(null);
    const [rotating, setRotating] = useState(false);

    const onRotateAsk = useCallback((row: ApiKeyRow) => {
        setRotateTarget(row);
        setRotateErrorMsg(null);
        setOpenRotate(true);
    }, []);

    const submitRotate = useCallback(async () => {
        if (!rotateTarget) return;
        try {
            setRotating(true);
            const rotated = await fetchWithAuth<{ appToken: string }>(`idservice/api-key/${rotateTarget.id}/rotate`, {
                method: "POST",
                body: JSON.stringify({ usuarioId: activeUserId }),
            });

            await loadList();

            setEphemeral({
                name: rotateTarget.name,
                key: rotateTarget.key,
                secret: rotated?.appToken ? String(rotated.appToken) : undefined,
            });

            setOpenRotate(false);
            setRotateTarget(null);
            setRotateErrorMsg(null);
        } catch (e: any) {
            setRotateErrorMsg(e?.message || "No se pudo rotar el token.");
        } finally {
            setRotating(false);
        }
    }, [rotateTarget, activeUserId, fetchWithAuth, loadList]);

    const [openDeactivate, setOpenDeactivate] = useState(false);
    const [deactivateTarget, setDeactivateTarget] = useState<ApiKeyRow | null>(null);
    const [deactivateErrorMsg, setDeactivateErrorMsg] = useState<string | null>(null);
    const [deactivating, setDeactivating] = useState(false);

    const onDeactivateAsk = useCallback((row: ApiKeyRow) => {
        setDeactivateTarget(row);
        setDeactivateErrorMsg(null);
        setOpenDeactivate(true);
    }, []);

    const submitDeactivate = useCallback(async () => {
        if (!deactivateTarget) return;
        try {
            setDeactivating(true);
            try {
                await fetchWithAuth(`idservice/api-key/${deactivateTarget.id}`, {
                    method: "DELETE",
                    body: JSON.stringify({ usuarioId: activeUserId }),
                });
            } catch (e: any) {
                const msg = String(e?.message || e);
                if (!/Unexpected end of JSON input/i.test(msg)) {
                    throw e;
                }
            }
            setOpenDeactivate(false);
            setDeactivateTarget(null);
            setDeactivateErrorMsg(null);
            await loadList();
        } catch (e: any) {
            setDeactivateErrorMsg(e?.message || "No se pudo desactivar la API Key.");
        } finally {
            setDeactivating(false);
        }
    }, [deactivateTarget, activeUserId, fetchWithAuth, loadList]);

    return (
        <div className="p-6 bg-white">
            {showCreator && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreator(false)} aria-hidden />
                    <div className="relative z-[101] w-full max-w-3xl rounded-xl bg-white shadow-2xl">
                        <div className="px-6 py-4 border-b">
                            <div className="text-lg font-semibold text-gray-900">Crear nueva API Key</div>
                            <div className="text-xs text-gray-500">Completa los campos y guarda. Podrás rotar para obtener un secreto nuevo si lo necesitas.</div>
                        </div>

                        {errors.general && (
                            <div className="mx-6 mt-4 rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                                {errors.general}
                            </div>
                        )}

                        <div className="p-6">
                            <div className="grid grid-cols-6 gap-4">
                                <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                                <div className="col-span-5">
                                    <input
                                        type="text"
                                        className={`w-full border-b bg-transparent text-sm outline-none ${errors.nombre ? "border-rose-400" : "border-gray-300"}`}
                                        value={form.nombre}
                                        onChange={(e) => {
                                            setF("nombre")(e.target.value);
                                            if (errors.nombre) setErrors((p) => ({ ...p, nombre: undefined }));
                                        }}
                                        placeholder="testingApiKey"
                                    />
                                    {errors.nombre && <div className="mt-1 text-xs text-rose-600">{errors.nombre}</div>}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Plataforma</span>
                                <div className="col-span-5">
                                    <SelectSearchInline
                                        id="plataforma"
                                        label="Plataforma"
                                        value={form.plataformaId}
                                        options={visiblePlats}
                                        searchQuery={platQuery}
                                        loading={platLoading}
                                        onSearch={setPlatQuery}
                                        onChange={(value) => {
                                            setF("plataformaId")(value);
                                            if (errors.plataformaId) setErrors((p) => ({ ...p, plataformaId: undefined }));
                                        }}
                                    />
                                    {errors.plataformaId && <div className="mt-1 text-xs text-rose-600">{errors.plataformaId}</div>}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo</span>
                                <div className="col-span-5">
                                    <SelectSearchInline
                                        id="tipo"
                                        label="Tipo"
                                        value={form.tipo}
                                        options={visibleTipos}
                                        searchQuery={tipoQuery}
                                        onSearch={setTipoQuery}
                                        onChange={(value) => {
                                            setF("tipo")(value);
                                            if (errors.tipo) setErrors((p) => ({ ...p, tipo: undefined }));
                                        }}
                                    />
                                    {errors.tipo && <div className="mt-1 text-xs text-rose-600">{errors.tipo}</div>}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Ambiente</span>
                                <div className="col-span-5">
                                    <SelectSearchInline
                                        id="ambiente"
                                        label="Ambiente"
                                        value={form.ambiente}
                                        options={visibleAmbientes}
                                        searchQuery={setAmbienteQuery as any}
                                        onSearch={setAmbienteQuery}
                                        onChange={(value) => {
                                            setF("ambiente")(value);
                                            if (errors.ambiente) setErrors((p) => ({ ...p, ambiente: undefined }));
                                        }}
                                    />
                                    {errors.ambiente && <div className="mt-1 text-xs text-rose-600">{errors.ambiente}</div>}
                                </div>

                                <span className="col-span-1 text-sm text-gray-600 font-bold">Mensaje</span>
                                <div className="col-span-5">
                                    <input
                                        type="text"
                                        className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                        value={form.mensaje}
                                        onChange={(e) => setF("mensaje")(e.target.value)}
                                        placeholder="Descripción corta / uso"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
                            <ActionButton
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setShowCreator(false);
                                    setErrors({});
                                }}
                            >
                                Cancelar
                            </ActionButton>
                            <ActionButton
                                type="button"
                                variant="primary"
                                onClick={handleCreate}
                                disabled={creating}
                            >
                                {creating ? "Guardando…" : "Guardar"}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner efímero: Nombre / Llave / Secreta + contador */}
            {ephemeral && (
                <div className="mt-4">
                    <div className="flex items-center justify-between bg-yellow-400 text-black px-4 py-2 rounded-t-md font-semibold">
                        <span>¡Atención! <span className="font-normal">Esta clave no se mostrará otra vez.</span></span>
                        {ephemeralCountdown > 0 && (
                            <span className="text-sm font-medium">Se ocultará en {ephemeralCountdown}s</span>
                        )}
                    </div>
                    <div className="overflow-x-auto border border-yellow-400 rounded-b-md bg-white">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-4 py-2 text-left">Nombre</th>
                                    <th className="px-4 py-2 text-left">Llave</th>
                                    <th className="px-4 py-2 text-left">Secreta</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t">
                                    <td className="px-4 py-3">{ephemeral.name}</td>
                                    <td className="px-4 py-3">
                                        <code className="break-all">{ephemeral.key}</code>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <LockClosedIcon className="h-4 w-4 text-gray-700" />
                                            <code className="break-all">{ephemeral.secret ?? "—"}</code>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-6 overflow-x-auto border rounded-md">
                <div className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">Listado</div>
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-4 py-2 text-left">Nombre</th>
                            <th className="px-4 py-2 text-left">Llave</th>
                            <th className="px-4 py-2 text-left">Plataforma</th>
                            <th className="px-4 py-2 text-left">Tipo</th>
                            <th className="px-4 py-2 text-left">Mensaje</th>
                            <th className="px-4 py-2 text-left">Fecha</th>
                            <th className="px-4 py-2 text-left">Estado</th>
                            <th className="px-4 py-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingList ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                    Cargando…
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3">{r.name}</td>
                                    <td className="px-4 py-3">
                                        <code className="break-all">{r.key}</code>
                                    </td>
                                    <td className="px-4 py-3">{r.platformName ?? "—"}</td>
                                    <td className="px-4 py-3">{r.type ?? "-"}</td>
                                    <td className="px-4 py-3">{r.message ?? "-"}</td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const { date, time } = splitApiDate(r.createdAt);
                                            return (
                                                <div className="flex flex-col leading-tight">
                                                    <span>{date}</span>
                                                    <span className="text-xs text-gray-500">{time}</span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${r.active ? "bg-green-600" : "bg-gray-400"
                                                }`}
                                        >
                                            {r.active ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onRotateAsk(r)}
                                                className="rounded-md bg-amber-500 px-3 py-1 text-white hover:bg-amber-600"
                                            >
                                                Rotar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeactivateAsk(r)}
                                                className="rounded-md bg-rose-500 px-3 py-1 text-white hover:bg-rose-600 disabled:opacity-50"
                                                disabled={!r.active}
                                            >
                                                Desactivar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {openRotate && rotateTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-2 text-lg font-semibold">Rotar token</div>
                        <p className="text-sm text-gray-700">
                            ¿Seguro que deseas rotar el token de <b>{rotateTarget.name}</b>? Se generará un <b>nuevo secreto</b> visible solo una vez.
                        </p>

                        {rotateErrorMsg && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{rotateErrorMsg}</div>}

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    setOpenRotate(false);
                                    setRotateTarget(null);
                                    setRotateErrorMsg(null);
                                }}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitRotate}
                                disabled={rotating}
                                className="rounded-md bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
                            >
                                {rotating ? "Rotando…" : "Rotar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {openDeactivate && deactivateTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-2 text-lg font-semibold">Desactivar API Key</div>
                        <p className="text-sm text-gray-700">
                            ¿Seguro que deseas desactivar <b>{deactivateTarget.name}</b>? Podrás crear otra o rotar su token si lo necesitas.
                        </p>

                        {deactivateErrorMsg && (
                            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{deactivateErrorMsg}</div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    setOpenDeactivate(false);
                                    setDeactivateTarget(null);
                                    setDeactivateErrorMsg(null);
                                }}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitDeactivate}
                                disabled={deactivating}
                                className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                                {deactivating ? "Desactivando…" : "Desactivar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
