// hooks\Permisos\useUserPermissions.ts

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

interface ApiPermissionResponse {
    usuarioId: number;
    plataformaId: number;
    permisos: {
        moduloRuta: string;
        submodulos?: {
            subModuloRuta: string;
        }[];
    }[];
}

export function useUserPermissions() {
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [allowedRoutes, setAllowedRoutes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        let mounted = true;

        (async () => {
            setLoading(true);
            try {
                const res = await fetchWithAuth<ApiPermissionResponse>(
                    `idservice/users/${user.id}/permissions/1`,
                    { method: "GET" }
                );

                if (!mounted) return;

                const routes = new Set<string>();

                res?.permisos?.forEach((mod) => {
                    if (mod.moduloRuta) {
                        routes.add(normalize(mod.moduloRuta));
                    }

                    mod.submodulos?.forEach((sub) => {
                        if (sub.subModuloRuta) {
                            routes.add(normalize(sub.subModuloRuta));
                        }
                    });
                });

                setAllowedRoutes(routes);
            } catch (e) {
                console.error("Error cargando permisos:", e);
                setAllowedRoutes(new Set());
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [user?.id, fetchWithAuth]);

    return {
        allowedRoutes,
        loadingPermissions: loading,
    };
}

/** Normaliza rutas tipo "/catalogo/precios" */
const normalize = (route: string) =>
    route.startsWith("/") ? route : `/${route}`;
