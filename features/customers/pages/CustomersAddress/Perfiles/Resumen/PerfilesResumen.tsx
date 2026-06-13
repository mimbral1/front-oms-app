// views\Customers\CustomersAddress\Perfiles\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import {
    PerfilesFields,
    type Perfil,
    type ModuloAPI,
    type SubmodAPI,
    type AccionAPI,
} from "@/features/customers/components/customersaddress/perfiles/PerfilesFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { toast } from "react-hot-toast";

/* =========================
   Tipos API
   ========================= */

type RolPermisoAPI = {
    subModuloId: number;
    accionesId: number[];
};

type RolDetalleAPI = {
    roleId: number;
    nombre: string;
    descripcion: string;
    plataformaCod: string;
    usuarioId: number;
    permisos: RolPermisoAPI[];
    activo?: boolean;
};

/* =========================
   Lookups internos
   ========================= */

type AccessKey = "read" | "write" | "update" | "delete";

const ACTION_CODE_TO_ACCESS_KEY: Record<string, AccessKey> = {
    READ: "read",
    CREATE: "write",
    UPDATE: "update",
    DELETE: "delete",
};

type Lookups = {
    actionsBySubId: Record<number, Partial<Record<AccessKey, number>>>;
};

/**
 * Construimos un mapa de:
 *  subModuloId -> { read?: idAccion, write?: idAccion, update?: idAccion, delete?: idAccion }
 * usando solamente la estructura de Mimbral 360.
 */
function buildLookups(mods: ModuloAPI[]): Lookups {
    const actionsBySubId: Record<number, Partial<Record<AccessKey, number>>> = {};

    mods.forEach((m: ModuloAPI) => {
        (m.submodulos || []).forEach((s: SubmodAPI) => {
            const map: Partial<Record<AccessKey, number>> = {};

            (s.acciones || []).forEach((a: AccionAPI) => {
                const code = (a.codigo || "").toUpperCase();
                const access = ACTION_CODE_TO_ACCESS_KEY[code];
                if (access) {
                    map[access] = a.id;
                }
            });

            actionsBySubId[s.id] = map;
        });
    });

    return { actionsBySubId };
}

/**
 * Adaptamos el array de permisos de la API (subModuloId / accionesId)
 * al record de permisos usado por el formulario:
 *
 *   permissions: {
 *      "3": { read: true, write: false, update: true, delete: false },
 *      "4": { ... },
 *      ...
 *   }
 */
function permisoArrayToPermissionsRecord(
    permisos: RolPermisoAPI[],
    lookups: Lookups
): Perfil["permissions"] {
    const out: Perfil["permissions"] = {};
    const { actionsBySubId } = lookups;

    for (const p of permisos || []) {
        const map = actionsBySubId[p.subModuloId];
        if (!map) continue;

        const key = String(p.subModuloId);
        const current: NonNullable<Perfil["permissions"][string]> = out[key] || {};

        for (const accionId of p.accionesId || []) {
            (["read", "write", "update", "delete"] as AccessKey[]).forEach((acc) => {
                if (map[acc] && map[acc] === accionId) {
                    current[acc] = true;
                }
            });
        }

        if (Object.keys(current).length > 0) {
            out[key] = current;
        }
    }

    return out;
}

/**
 * Guardado: estado de la UI (permissions) -> payload de API
 * Recorremos directamente lo que hay en permissions,
 * mapeando cada subModuloId a sus accionesId correspondientes.
 */
function permissionsRecordToPermisosArray(
    permissions: Perfil["permissions"],
    lookups: Lookups
): RolPermisoAPI[] {
    const { actionsBySubId } = lookups;
    const permisos: RolPermisoAPI[] = [];

    Object.entries(permissions || {}).forEach(([subKey, p]) => {
        if (!p) return;

        const subModuloId = Number(subKey);
        if (!Number.isFinite(subModuloId)) return;

        const map = actionsBySubId[subModuloId];
        if (!map) return;

        const accionesSet = new Set<number>();

        if (p.read && map.read) accionesSet.add(map.read);
        if (p.write && map.write) accionesSet.add(map.write);
        if (p.update && map.update) accionesSet.add(map.update);
        if (p.delete && map.delete) accionesSet.add(map.delete);

        if (accionesSet.size > 0) {
            permisos.push({
                subModuloId,
                accionesId: Array.from(accionesSet),
            });
        }
    });

    return permisos;
}

/**
 * Adaptamos la respuesta de detalle de rol a nuestro Perfil interno,
 * construyendo también los lookups necesarios para el mapeo de permisos.
 */
function adaptRoleToPerfil(role: RolDetalleAPI, estructura: ModuloAPI[]) {
    const lookups = buildLookups(estructura);
    const permissions = permisoArrayToPermissionsRecord(role.permisos || [], lookups);

    const perfil: Perfil = {
        id: String(role.roleId),
        name: role.nombre ?? "",
        description: role.descripcion ?? "",
        plataformaCod: role.plataformaCod ?? "MIMBRAL_360",
        permissions,
        status: role.activo === false ? "Inactivo" : "Activo",
        createdAt: undefined,
        createdBy: undefined,
        modifiedAt: undefined,
        modifiedBy: undefined,
    };

    return { perfil, lookups };
}

/* =========================
   Vista principal
   ========================= */

export default function PerfilesResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const profileId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth, token } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<Perfil | null>(null);
    const [permissions, setPermissions] = useState<Perfil["permissions"]>({});
    const [lookups, setLookups] = useState<Lookups | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [modulesFromApi, setModulesFromApi] = useState<ModuloAPI[] | null>(null);

    // cuando cargamos el perfil desde la API, sincronizamos record + permissions
    const loadPerfil = useCallback(
        (detalle: RolDetalleAPI, estructura: ModuloAPI[]) => {
            const { perfil, lookups: lk } = adaptRoleToPerfil(detalle, estructura);
            setRecord(perfil);
            setPermissions(perfil.permissions || {});
            setLookups(lk);
        },
        []
    );

    const handleChange = useCallback((field: keyof Perfil, value: string) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    }, []);

    const handlePermissionChange = useCallback(
        (permissionKey: string, access: AccessKey, value: boolean) => {
            console.log("handlePermissionChange ->", { permissionKey, access, value });

            setPermissions((prev) => {
                const prevPerm = prev?.[permissionKey] || {};
                const nextPerm: NonNullable<Perfil["permissions"][string]> = { ...prevPerm };

                if (value) {
                    nextPerm[access] = true;
                } else {
                    delete nextPerm[access];
                }

                if (
                    !nextPerm.read &&
                    !nextPerm.write &&
                    !nextPerm.update &&
                    !nextPerm.delete
                ) {
                    const { [permissionKey]: _removed, ...rest } = prev || {};
                    return rest;
                }

                return {
                    ...(prev || {}),
                    [permissionKey]: nextPerm,
                };
            });
        },
        []
    );

    const handleApply = useCallback(async () => {
        console.log("===== [PerfilesResumenView] APPLY =====");
        if (!record || !lookups) {
            setError("No hay datos cargados para guardar.");
            return false;
        }

        // usamos SIEMPRE el estado de permisos separado
        console.log("===== [PerfilesResumenView] APPLY: estado actual =====");
        console.log("record (sin permisos):", { ...record, permissions: undefined });
        console.log("permissions (estado fuente):", permissions);

        const permisos = permissionsRecordToPermisosArray(permissions, lookups);

        const body = {
            roleId: record.id ? Number(record.id) : Number(profileId),
            nombre: record.name,
            descripcion: record.description,
            plataformaCod: record.plataformaCod || "MIMBRAL_360",
            usuarioId: user?.id,
            permisos,
            activo: record.status !== "Inactivo",
        };

        try {
            setSaving(true);

            console.log("===== [PerfilesResumenView] APPLY (PUT /idservice/role) =====");
            console.log("profileId (path param):", profileId);
            console.log("permisos (payload mapeado subModuloId / accionesId):", permisos);
            console.log("body (PUT completo):", body);

            await fetchWithAuth(`idservice/role/${profileId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            console.log("Rol actualizado (Aplicar) con body:", body);
            toast.success("Perfil actualizado correctamente");
            return true;
        } catch (err: any) {
            console.error("Error al actualizar rol:", err);
            toast.error("Ocurrió un error al guardar el perfil");
            return false;
        } finally {
            setSaving(false);
        }
    }, [record, permissions, lookups, user, fetchWithAuth, profileId]);

    const handleSave = useCallback(async () => {
        console.log("===== [PerfilesResumenView] SAVE (Aplicar + volver al listado) =====");
        console.log("record antes de guardar:", record);
        console.log("permissions antes de guardar:", permissions);

        const ok = await handleApply();
        if (ok) {
            router.push("/cuenta/perfiles");
        }
    }, [handleApply, router, record, permissions]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: saving ? "Aplicando..." : "Aplicar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                ),
                disabled: saving,
                onClick: handleApply,
            },
            {
                label: saving ? "Guardando..." : "Guardar",
                variant: "primary",
                icon: saving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                    <SaveOutlined className="h-4 w-4" />
                ),
                disabled: saving,
                onClick: handleSave,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                disabled: saving,
                onClick: () => router.push("/customers/direcciones/perfiles"),
            },
        ],
        [handleApply, handleSave, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: `Perfil: ${record?.name ?? "—"}`,
            status: saving ? "Guardando..." : record?.status,
            action: headerActions,
        } as PageHeaderProps),
        [record?.name, record?.status, saving, headerActions]
    );

    useEffect(() => {
        if (!profileId || !token) return;

        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const [estructura, detalle] = await Promise.all([
                    fetchWithAuth<ModuloAPI[]>("idservice/estructura/MIMBRAL_360"),
                    fetchWithAuth<RolDetalleAPI>(`idservice/role/${profileId}`),
                ]);
                if (cancelled) return;

                const estructuraAny = estructura as any;
                if (
                    estructuraAny &&
                    typeof estructuraAny === "object" &&
                    !Array.isArray(estructuraAny) &&
                    "message" in estructuraAny
                ) {
                    throw new Error(
                        String(estructuraAny.message || "Error al cargar la estructura de permisos.")
                    );
                }

                const detalleAny = detalle as any;
                if (
                    detalleAny &&
                    typeof detalleAny === "object" &&
                    !("roleId" in detalleAny) &&
                    "message" in detalleAny
                ) {
                    throw new Error(
                        String(detalleAny.message || "Error al cargar el detalle del perfil.")
                    );
                }

                const estructuraArr = Array.isArray(estructura)
                    ? estructura
                    : ((estructura as any)?.data as ModuloAPI[]) || [];

                if (!Array.isArray(estructuraArr)) {
                    throw new Error("La estructura de permisos no tiene el formato esperado.");
                }

                setModulesFromApi(estructuraArr);
                loadPerfil(detalle as RolDetalleAPI, estructuraArr);
            } catch (err: any) {
                console.error("Error al cargar datos de perfil:", err);
                setError(
                    typeof err === "string"
                        ? err
                        : err?.message || "No se pudieron cargar los datos del perfil."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };

    }, [profileId, token, fetchWithAuth, loadPerfil]);

    if (loading) {
        return (
            <div className="p-6">
                <div className="bg-white flex items-center justify-center px-4 py-6 text-center text-gray-500 text-sm">
                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando…
                </div>
            </div>
        );
    }

    if (!record) {
        return <p className="p-4 text-red-500">Registro no encontrado.</p>;
    }

    const recordForFields: Perfil = {
        ...record,
        permissions: Object.fromEntries(
            Object.entries(permissions || {}).map(([key, p]) => [key, { ...p }])
        ),
    };

    return (
        <div className="p-6 bg-white">
            <PerfilesFields
                record={recordForFields}
                readOnly={false}
                onChange={handleChange}
                onPermissionChange={handlePermissionChange}
                modules={modulesFromApi || []}
            />
        </div>
    );
}
