// views\Cuenta\Usuarios\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { UsuariosFields, Usuario } from "@/features/cuenta/components/usuarios/UsuariosFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { toast } from "react-hot-toast";
import AvatarPreviewModal from "@/features/cuenta/components/usuarios/AvatarPreviewModal";

// Endpoint base para perfiles (detalle/edición)
const PROFILE_BASE_PERFILES = "idservice/perfiles";
const PROFILE_BASE_USUARIOS = "idservice/usuarios"

const EMPTY: Usuario = {
    nombre: "",
    apellido: "",
    email: "",
    idFuncionario: "",
    documento: "",
    perfil: [],
    roles: [],
    idDepartamento: "",
    tipo: "regular",
    externo: false,
    soloLectura: false,
    idioma: "Español (Chile)",
    estado: "Activo",
    avatarUrl: "",
    comercioAccesoTotal: false,
    password: "",
    telefono: "",
    plataformas: [],
    salesChannelId: "",
    salesChannelName: "",
    salesChannelRefId: "",
    creador: {
        nombre: "",
        email: "",
        avatar: "",
    },
    creadorFecha: "",
    modificador: {
        nombre: "",
        email: "",
        avatar: "",
    },
    modificadorFecha: "",
};

export default function UsuarioResumenView() {
    const router = useRouter();
    const params = useParams();
    const idFromRoute = String(params?.id ?? "");

    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<Usuario>({ ...EMPTY });
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [avatarSaving, setAvatarSaving] = useState(false);
    const [formReady, setFormReady] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    // Refs para usar el último estado dentro de handlers
    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    // Guarda un snapshot de header para otras pestañas (ApiKey, etc.)
    useEffect(() => {
        if (!idFromRoute) return;
        const name = `${(record?.nombre ?? "").trim()} ${(record?.apellido ?? "").trim()}`.trim();
        const active =
            (record?.estado ?? "Activo") !== "Inactivo"; // mismo criterio que usas para el badge en Resumen

        try {
            sessionStorage.setItem(
                `usr-hdr:${idFromRoute}`,
                JSON.stringify({ name, active })
            );
        } catch { }
         
    }, [idFromRoute, record?.nombre, record?.apellido, record?.estado]);

    // imagen por default 
    const AVATAR_DEF = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    // helper para usuario modificador 
    const fetchUsuarioModificador = async (userId: string) => {
        try {
            const perfil = await fetchWithAuth<any>(`idservice/perfiles/${userId}`, {
                method: "GET",
            });

            const nombreCompleto = [perfil?.Nombres, perfil?.Apellidos]
                .filter(Boolean)
                .join(" ")
                .trim();

            return {
                nombre: nombreCompleto || "—",
                email: perfil?.Email ?? "—",
                avatar: perfil?.URLImagenPerfil ?? undefined,
            };
        } catch {
            return null;
        }
    };

    /* ===================== CARGA DE DETALLE ===================== */
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!idFromRoute) return;
            try {
                setLoading(true);
                setFormReady(false);
                // GET a /idservice/perfiles/:id
                const resp = await fetchWithAuth<any>(`${PROFILE_BASE_PERFILES}/${idFromRoute}`, { method: "GET" });
                const PROFILE_BASE_USUARIOS = "idservice/usuarios"

                const a = resp ?? {};
                const mapped: Usuario = {
                    ...EMPTY,
                    // ids y datos base
                    idFuncionario: a?.ID_FUNCIONARIO != null ? String(a.ID_FUNCIONARIO) : "",
                    // Viene como ID numérico -> va a record.idDepartamento (string numérica)
                    idDepartamento: a?.ID_Departamento != null ? String(a.ID_Departamento) : "",
                    email: a?.Email ?? "",
                    nombre: a?.Nombres ?? "",
                    apellido: a?.Apellidos ?? "",
                    documento: a?.RUT ?? "",
                    telefono: a?.Telefono ?? "",
                    avatarUrl: a?.URLImagenPerfil ?? AVATAR_DEF,

                    // es externo 
                    externo: a?.EsExterno ?? false,

                    // Perfil: lista de IDs (string)
                    perfil: Array.isArray(a?.RolIDs)
                        ? a.RolIDs.map((x: number) => String(x))
                        : [],

                    // Plataformas: lista de IDs (string)
                    plataformas: Array.isArray(a?.PlataformaIDs)
                        ? a.PlataformaIDs.map((x: number) => String(x))
                        : [],

                    // Metadatos de auditoría
                    creador: a?.UsuarioCreador
                        ? {
                            nombre: [a.UsuarioCreador.Nombre, a.UsuarioCreador.Apellido]
                                .filter(Boolean)
                                .join(" ")
                                .trim(),
                            email: a.UsuarioCreador.Email ?? "",
                            avatar: a.UsuarioCreador.Imagen ?? "",
                        }
                        : undefined,

                    creadorFecha: a?.UsuarioCreador?.FechaCreacion ?? "",

                    modificador: a?.UsuarioActualizador
                        ? {
                            nombre: [a.UsuarioActualizador.Nombre, a.UsuarioActualizador.Apellido]
                                .filter(Boolean)
                                .join(" ")
                                .trim(),
                            email: a.UsuarioActualizador.Email ?? "",
                            avatar: a.UsuarioActualizador.Imagen ?? "",
                        }
                        : undefined,

                    modificadorFecha: a?.UsuarioActualizador?.FechaActualizacion ?? "",
                    // Pre-carga Canal de Venta desde la API (ReferenceId)
                    salesChannelRefId: a?.CanalDeVentaId ?? "",
                    salesChannelId: "",
                    salesChannelName: "",
                    estado: a?.Activo ? "Activo" : "Inactivo",
                };
                if (!mounted) return;
                setRecord(mapped);

            } catch (e) {
                console.error("Error cargando perfil de usuario:", e);
                if (mounted) setRecord({ ...EMPTY });
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [idFromRoute, fetchWithAuth]);

    /* ===================== HANDLERS ===================== */
    const handleChange = useCallback(<K extends keyof Usuario>(field: K, value: Usuario[K]) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSave = useCallback(
        async (goBack: boolean) => {
            const r = recordRef.current;
            if (!r || !idFromRoute) return;

            // Intento de obtener el ID del usuario actual desde el authState local
            // (si tu contexto expone el id, cámbialo por eso).
            let usuarioActualizadorId: number | undefined = undefined;
            try {
                const ls = JSON.parse(localStorage.getItem("authState") || "{}");
                const maybeId = ls?.user?.id ?? ls?.userId ?? ls?.usuarioId;
                if (maybeId != null) usuarioActualizadorId = Number(maybeId);
            } catch { /* noop */ }

            // Normalizaciones
            const rolesIds = Array.isArray(r.perfil)
                ? r.perfil.map((x) => Number(x))
                : [];

            const departamentoId = r.idDepartamento?.trim() ? Number(r.idDepartamento) : undefined;
            const plataformaIds = Array.isArray(r.plataformas) ? r.plataformas.map((x) => Number(x)) : [];

            // Activo segun tu selector de estado
            const activo = (r.estado ?? "Activo") !== "Inactivo";

            // Canal de venta (solo si hay datos)
            const canalDeVenta = r.salesChannelName?.trim() || undefined;
            const canalDeVentaId = r.salesChannelRefId?.trim() || undefined;

            const payload = {
                correo: r.email?.trim() || "",
                activo,
                nombres: r.nombre?.trim() || "",
                apellidos: r.apellido?.trim() || "",
                rut: r.documento?.trim() || "",
                departamentoId,
                telefono: r.telefono?.trim() || "",
                urlImagenPerfil: r.avatarUrl?.trim() || "",
                canalDeVenta,
                canalDeVentaId,
                usuarioActualizadorId,
                rolesIds,
                plataformaIds,
                esExterno: r.externo ?? false,
            };

            try {
                setSaving(true);
                await fetchWithAuth(`${PROFILE_BASE_USUARIOS}/editar/${idFromRoute}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });

                toast.success("Usuario actualizado correctamente");

                if (usuarioActualizadorId) {
                    const perfil = await fetchUsuarioModificador(String(usuarioActualizadorId));

                    if (perfil) {
                        setRecord((prev) => ({
                            ...prev,
                            modificador: perfil,
                            modificadorFecha: prev.modificadorFecha,
                        }));
                    }
                }

                if (goBack) {
                    router.push("/cuenta/usuarios/listado-usuarios");
                }

            } catch (e) {
                console.error("Error editando usuario:", e);
                toast.error("Ocurrió un error al guardar el usuario");

            } finally {
                setSaving(false);
            }
        }, [idFromRoute, fetchWithAuth]);


    /* ===================== PAGE HEADER ===================== */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => handleSave(false),
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: () => handleSave(true),
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/cuenta/usuarios/listado-usuarios"),
                disabled: saving,
            },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Usuarios</div>
                    <div className="text-2xl font-semibold text-gray-900">{loading ? "Cargando..." : record.nombre + ' ' + record.apellido}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : record
                    ? {
                        text: (record.estado ?? "Activo") === "Activo" ? "Activo" : "Inactivo",
                        variant: (record.estado ?? "Activo") === "Activo" ? "success" : "warning"
                    }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, record]
    );

    /* ===================== RENDER ===================== */

    return (
        <div className="">

            {/* Loader con tus estilos ORIGINALES */}
            {(loading || !formReady) && (
                <div className="mb-6 overflow-x-auto border rounded-md">
                    <table className="min-w-full text-sm">
                        <tbody>
                            <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                    Cargando…
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Formulario (montado SIEMPRE, pero invisible hasta que esté listo) */}
            <div className={loading || !formReady ? "hidden" : "block"}>
                <div className="p-6 bg-white">
                    <UsuariosFields
                        record={record}
                        readOnly={false}
                        onChange={handleChange}
                        onReady={() => setFormReady(true)}
                        onAvatarMessage={(msg) => {
                            if (!msg) return;
                            msg.type === "success"
                                ? toast.success(msg.text)
                                : toast.error(msg.text);
                        }}
                        onAvatarSaving={setAvatarSaving}
                        avatarSaving={avatarSaving}
                        onAvatarClick={() => setShowAvatarModal(true)}
                    />
                </div>
            </div>

            {/* modal para ver avatar en grande */}
            <AvatarPreviewModal
                open={showAvatarModal}
                imageUrl={record.avatarUrl}
                onClose={() => setShowAvatarModal(false)}
            />
        </div>
    );
}
