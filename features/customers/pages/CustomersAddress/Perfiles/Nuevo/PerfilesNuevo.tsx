// views\Customers\CustomersAddress\Perfiles\Nuevo\Nuevo.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import {
    PerfilesFields,
    type Perfil,
    type ModuloAPI,
    type SubmodAPI,
    type AccionAPI,
} from "@/features/customers/components/customersaddress/perfiles/PerfilesFields";
import { useFetchWithAuth } from "@/lib/http/client";

// estado de autenticacion
import { useAuth } from "@/app/context/auth/AuthContext";
import { toast } from "react-hot-toast";

/* =========================
   Tipos / helpers de permisos
   ========================= */

type RolPermisoAPI = { subModuloId: number; accionesId: number[] };
type RolCreadoAPI = { roleId: number } & Record<string, any>;

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
 * Guardado: estado de la UI (permissions) -> payload de API
 * Recorremos directamente lo que hay en `record.permissions`,
 * mapeando cada subModuloId a sus accionesId correspondientes.
 *
 * permissions: {
 *   "3": { read: true, write: false, update: true, delete: false },
 *   "4": { ... },
 * }
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

/* =========================
   COMPONENTE PRINCIPAL
   ========================= */

export default function PerfilesNuevoView() {
    const router = useRouter();
    const { user } = useAuth();

    const [record, setRecord] = useState<Perfil>({
        name: "",
        description: "",
        plataformaCod: "MIMBRAL_360",
        permissions: {},
        status: "Activo",
    });

    const [lookups, setLookups] = useState<Lookups | null>(null);
    const [modulesFromApi, setModulesFromApi] = useState<ModuloAPI[] | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const { fetchWithAuth, token } = useFetchWithAuth();

    const handleChange = useCallback((field: keyof Perfil, value: string) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handlePermissionChange = useCallback(
        (permissionKey: string, access: AccessKey, value: boolean) => {
            console.log("handlePermissionChange (Nuevo) ->", { permissionKey, access, value });

            setRecord((prev) => {
                const prevPermissions = prev.permissions || {};
                const prevPerm = prevPermissions[permissionKey] || {};
                const nextPerm: NonNullable<Perfil["permissions"][string]> = { ...prevPerm };

                if (value) {
                    nextPerm[access] = true;
                } else {
                    delete nextPerm[access];
                }

                let nextPermissions: Perfil["permissions"] = { ...prevPermissions };

                if (
                    !nextPerm.read &&
                    !nextPerm.write &&
                    !nextPerm.update &&
                    !nextPerm.delete
                ) {
                    const { [permissionKey]: _removed, ...rest } = nextPermissions || {};
                    nextPermissions = rest;
                } else {
                    nextPermissions[permissionKey] = nextPerm;
                }

                return {
                    ...prev,
                    permissions: nextPermissions,
                };
            });
        },
        []
    );

    const hasAnyCheckedPermission = useCallback(() => {
        const entries = Object.values(record.permissions || {});
        return entries.some((p) => !!(p?.read || p?.write || p?.update || p?.delete));
    }, [record.permissions]);

    const handleSave = useCallback(
        async (createAndNew = false) => {
            if (saving) return;

            if (!lookups) {
                toast.error("Aún no se carga la estructura de permisos. Intenta nuevamente.");
                return;
            }

            if (!hasAnyCheckedPermission()) {
                toast.error("Debes seleccionar al menos un permiso antes de guardar.");
                return;
            }

            const permisos = permissionsRecordToPermisosArray(record.permissions, lookups);
            if (!permisos.length) {
                toast.error(
                    "No se pudo mapear los permisos seleccionados. Verifica que al menos un permiso esté marcado."
                );
                return;
            }

            const body = {
                nombre: record.name,
                descripcion: record.description,
                plataformaCod: record.plataformaCod || "MIMBRAL_360",
                usuarioId: user?.id,
                permisos,
            };

            try {
                setSaving(true);
                console.log("POST idservice/create-rol payload:", body);

                const creado = await fetchWithAuth<RolCreadoAPI>("idservice/create-rol", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                console.log("Rol creado:", creado);
                toast.success("Perfil creado correctamente");

                if (createAndNew) {
                    // reiniciar el formulario para crear otro
                    setRecord({
                        name: "",
                        description: "",
                        plataformaCod: "MIMBRAL_360",
                        permissions: {},
                        status: "Activo",
                    });
                } else {
                    router.push("/cuenta/perfiles");
                }
            } catch (err: any) {
                console.error("Error al crear rol:", err);
                toast.error(
                    typeof err === "string"
                        ? err
                        : err?.message || "No se pudo crear el perfil."
                );
            } finally {
                setSaving(false);
            }
        },
        [record, lookups, fetchWithAuth, router, hasAnyCheckedPermission, user?.id, saving]
    );

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: saving ? "Guardando..." : "Guardar",
                variant: "primary",
                icon: saving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                    <SaveOutlined className="h-4 w-4" />
                ),
                disabled: saving,
                onClick: () => handleSave(false),
            },
            {
                label: saving ? "Guardando..." : "Guardar & Crear nuevo",
                variant: "primary",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        {saving ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <SaveOutlined className="h-4 w-4 text-current" />
                                <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                                    <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                                </div>
                            </>
                        )}
                    </div>
                ),
                disabled: saving,
                onClick: () => handleSave(true),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                disabled: saving,
                onClick: () => router.push("/customers/direcciones/perfiles"),
            },
        ],
        [handleSave, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: "Nuevo Perfil",
            status: saving ? "Guardando..." : undefined,
            action: headerActions,
        } as PageHeaderProps),
        [record?.name, headerActions, saving]
    );

    useEffect(() => {
        if (!token) return;

        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);

            try {
                const estructura = await fetchWithAuth<ModuloAPI[]>("idservice/estructura/MIMBRAL_360");
                if (cancelled) return;

                const estructuraArr = Array.isArray(estructura)
                    ? estructura
                    : ((estructura as any)?.data as ModuloAPI[]) || [];

                if (!Array.isArray(estructuraArr)) {
                    throw new Error("La estructura de permisos no tiene el formato esperado.");
                }

                setModulesFromApi(estructuraArr);
                setLookups(buildLookups(estructuraArr));
            } catch (err: any) {
                console.error("Error al cargar estructura:", err);
                if (!cancelled) {
                    setError(err?.message || "No se pudo cargar la estructura.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };

    }, [token]);

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

    if (error) {
        return (
            <div className="p-6">
                <div
                    className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                    role="alert"
                >
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon
                                className="h-5 w-5 text-red-400"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">Error al cargar estructura</h3>
                            <p className="mt-2 text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white">
            <PerfilesFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                onPermissionChange={handlePermissionChange}
                modules={modulesFromApi || []}
            />
        </div>
    );
}
