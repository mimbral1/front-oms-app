"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import { XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import GeofenceNuevoFields, { ApiGeofence } from "@/features/ubicaciones/components/geofences/GeofenceNuevoFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { FaPlus } from "react-icons/fa";

type CreateGeofenceResponse = { id?: string | number; message?: string };

const errorPayload = (err: unknown): unknown => {
    if (err && typeof err === "object" && "payload" in err) {
        return (err as { payload?: unknown }).payload ?? err;
    }
    return err;
};

// ===== Registro vacío (idéntico patrón a Ubicaciones Nuevo) =====
const EMPTY: ApiGeofence = {
    name: "",
    status: "active",
    description: "",
    user: "1",       // si luego usas AuthContext, reemplázalo por el id real
    coverage: null,  // se completa al dibujar
};

const API_GEOFENCES = "comerce-service/geofences";

export default function GeofenceNuevoView() {
    const router = useRouter();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<ApiGeofence>(EMPTY);
    const [saving, setSaving] = useState(false);

    const onChange = <K extends keyof ApiGeofence>(field: K, value: ApiGeofence[K]) =>
        setRecord((r) => ({ ...r, [field]: value }));

    // refs estables (patrón consistente)
    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    /** Acepta cualquier variante (ring, [ring], [[ring]], [[[ring]]], [[[[ring]]]]…)
     *  Devuelve SIEMPRE [[[ ringCerrado ]]] o null si no es válido.
     */
    // Normaliza el coverage para cumplir exactamente con el formato [[[ [lng, lat], ... ]]]
    const normalizeCoverage = (cov: unknown): number[][][][] | null => {
        if (!Array.isArray(cov)) return null;

        // Desciende hasta encontrar el array de puntos [lng, lat]
        let current: unknown = cov;
        while (
            Array.isArray(current) &&
            Array.isArray(current[0]) &&
            Array.isArray(current[0][0]) &&
            Array.isArray(current[0][0][0])
        ) {
            current = current[0]; // baja un nivel
        }

        // Asegura que current sea un array de puntos válidos
        const currentArray = Array.isArray(current) ? current : [];
        const ring: unknown[] = Array.isArray(currentArray[0]) ? (currentArray[0] as unknown[]) : currentArray;
        if (!Array.isArray(ring) || ring.length < 3) return null;

        const validPoints = ring
            .filter(
                (p): p is [number, number] =>
                    Array.isArray(p) &&
                    p.length === 2 &&
                    typeof p[0] === "number" &&
                    typeof p[1] === "number"
            )
            .map((p) => [p[0], p[1]] as [number, number]);
        if (validPoints.length < 3) return null;

        // Cierra el polígono si hace falta
        const first = validPoints[0];
        const last = validPoints[validPoints.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            validPoints.push([...first]);
        }

        // Devuelve exactamente [[[ ... ]]] (tres niveles)
        return [[validPoints]];
    };

    const save = useCallback(async (navigateAfterSave = true): Promise<boolean> => {
        const current = recordRef.current;

        // Validaciones mínimas (igual de sobrias que en tus módulos)
        const errs: string[] = [];
        if (!current.name.trim()) errs.push("Falta el nombre.");
        const normalized = normalizeCoverage(recordRef.current.coverage);
        if (!normalized) {
            console.warn("Cobertura inválida.");
            return false;
        }
        if (!normalized) errs.push("Dibuja un polígono válido (al menos 3 puntos).");

        if (errs.length) {
            console.warn("Validación antes de POST:", errs);
            return false;
        }

        const payload = {
            name: current.name.trim(),
            status: current.status,
            description: current.description?.trim() || "",
            user: String(current.user ?? "1"),
            coverage: normalized,
        };

        try {
            setSaving(true);
            const res = await fetchWithAuth<CreateGeofenceResponse>(API_GEOFENCES, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            if (res?.id && navigateAfterSave) {
                router.push(`/ubicaciones/geocercas`);
            }
            return Boolean(res?.id);
        } catch (e) {
            console.error("Error creando geofence:", errorPayload(e));
            return false;
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth, router]);

    // ===== Header (calcado a Ubicaciones → Nuevo) =====
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: saving ? "Guardando..." : "Guardar",
                variant: "success",
                icon: <CheckCircleIcon className="h-4 w-4" />,
                onClick: () => { void save(true); },
                disabled: saving,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <CheckCircleIcon className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: async () => {
                    const ok = await save(false);
                    if (ok) setRecord(EMPTY);
                },
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/ubicaciones/geocercas"),
                disabled: saving,
            },
        ],
        [router, save, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Geocercas
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nueva geocerca</div>
                </div>
            ),
            action: headerActions,
            status: {
                text: record.status === "active" ? "Activo" : "Inactivo",
                variant: record.status === "active" ? "success" : "warning",
            },
        } as PageHeaderProps),
        [headerActions, record.status]
    );

    return (
        <div className="flex flex-col bg-white">
            <div className="p-6">
                <GeofenceNuevoFields record={record} onChange={onChange} isCreate />
            </div>
        </div>
    );
}
