"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

import { type GeofenceRecord } from "@/features/ubicaciones/components/geofences/GeofenceResumenFields";
import GeofenceResumenTab from "@/features/ubicaciones/pages/Geofences/tabs/GeofenceResumenTab";
import GeofenceLocationsTab, { type GeofenceLocationRow } from "@/features/ubicaciones/pages/Geofences/tabs/GeofenceLocationsTab";
import { useFetchWithAuth } from "@/lib/http/client";

// ===== Helpers =====
const API_BASE = "comerce-service/geofences";

const MOCK_GEOFENCE_LOCATIONS: GeofenceLocationRow[] = [
    {
        id: "mock-1",
        nombre: "Palermo",
        refId: "PAL",
        modificado: "08/03/2023 13:18",
        usuario: "ariel.mikowski@j...",
        status: "Activo",
    },
    {
        id: "mock-2",
        nombre: "Belgrano",
        refId: "Janis-BEL",
        modificado: "08/03/2023 13:20",
        usuario: "ariel.mikowski@j...",
        status: "Activo",
    },
];

type GeofenceTabId = "resumen" | "ubicaciones" | "comentarios" | "logs";

type UnknownRecord = Record<string, unknown>;
const asRecord = (value: unknown): UnknownRecord =>
    value && typeof value === "object" ? (value as UnknownRecord) : {};
const errorPayload = (err: unknown): unknown => {
    if (err && typeof err === "object" && "payload" in err) {
        return (err as { payload?: unknown }).payload ?? err;
    }
    return err;
};
const asId = (value: unknown): string | number | undefined =>
    typeof value === "string" || typeof value === "number" ? value : undefined;
const asStatus = (value: unknown): "active" | "inactive" =>
    value === "active" || value === "inactive" ? value : "inactive";
const asString = (value: unknown, fallback = ""): string =>
    typeof value === "string" ? value : typeof value === "number" ? String(value) : fallback;
const asOptionalString = (value: unknown): string | null =>
    typeof value === "string" ? value : null;

const isPoint = (p: unknown): p is [number, number] =>
    Array.isArray(p) && p.length === 2 && typeof p[0] === "number" && typeof p[1] === "number";

/** Normalizador definitivo (devuelve EXACTAMENTE [[[ [lng,lat], ... ]]] ) */
const normalizeCoverage = (cov: unknown): GeofenceRecord["coverage"] => {
    if (!Array.isArray(cov)) return null;

    // baja niveles mientras siga habiendo arrays de arrays
    let cur: unknown = cov;
    while (
        Array.isArray(cur) &&
        Array.isArray(cur[0]) &&
        Array.isArray(cur[0][0]) &&
        Array.isArray(cur[0][0][0])
    ) {
        cur = cur[0];
    }

    const currentArray = Array.isArray(cur) ? cur : [];
    const ringCandidate = Array.isArray(currentArray[0]) ? currentArray[0] : currentArray;
    if (!Array.isArray(ringCandidate) || ringCandidate.length < 3) return null;

    const points = ringCandidate.filter(isPoint);
    if (points.length < 3) return null;

    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        points.push([...first]);
    }
    return [[points]];
};

// ===== Página =====
export default function GeofenceResumenView() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const pathname = usePathname();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<GeofenceRecord>({
        id: "",
        name: "",
        status: "active",
        description: "",
        user: "1",
        coverage: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [applied, setApplied] = useState(false);
    const [locations, setLocations] = useState<GeofenceLocationRow[]>([]);
    const [locationsLoading, setLocationsLoading] = useState(false);

    const locationRowsToRender = useMemo(
        () => (locations.length ? locations : MOCK_GEOFENCE_LOCATIONS),
        [locations]
    );

    const activeTab = useMemo<GeofenceTabId>(() => {
        const segment = pathname.split("/").filter(Boolean).pop() || "";
        if (segment === "locations" || segment === "ubicaciones") return "ubicaciones";
        if (segment === "comments" || segment === "comentarios") return "comentarios";
        if (segment === "logs") return "logs";
        return "resumen";
    }, [pathname]);

    // onChange consistente
    const onChange = <K extends keyof GeofenceRecord>(field: K, value: GeofenceRecord[K]) =>
        setRecord((r) => ({ ...r, [field]: value }));

    // refs estables
    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    // ====== GET by id ======
    const load = useCallback(async () => {
        setLoading(true);
        setApplied(false);
        try {
            const data = asRecord(await fetchWithAuth<unknown>(`${API_BASE}/${params.id}`));
            setRecord({
                id: asId(data.id),
                name: asString(data.name),
                status: asStatus(data.status),
                description: asString(data.description),
                user: String(data.userModified ?? data.userCreated ?? "1"),
                coverage: normalizeCoverage(data.coverage),
                dateCreated: asOptionalString(data.dateCreated),
                userCreated: asOptionalString(data.userCreated),
                dateModified: asOptionalString(data.dateModified),
                userModified: asOptionalString(data.userModified),
            });
        } catch (e) {
            console.error("Error cargando geofence:", errorPayload(e));
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuth, params.id]);

    useEffect(() => {
        if (params?.id) load();
    }, [params?.id, load]);

    const loadLocations = useCallback(async () => {
        if (!params?.id) return;
        setLocationsLoading(true);

        try {
            const endpointCandidates = [
                `${API_BASE}/${params.id}/locations`,
                `${API_BASE}/${params.id}/ubicaciones`,
                `${API_BASE}/${params.id}/location`,
            ];

            let rawData: unknown[] = [];
            for (const endpoint of endpointCandidates) {
                try {
                    const response = await fetchWithAuth<unknown>(endpoint);
                    const responseObj = asRecord(response);
                    const items = Array.isArray(response)
                        ? response
                        : Array.isArray(responseObj.data)
                            ? responseObj.data
                            : [];
                    if (items.length) {
                        rawData = items;
                        break;
                    }
                } catch {
                    // Intenta siguiente candidato
                }
            }

            if (!rawData.length) {
                setLocations([]);
                return;
            }

            const mapped = rawData.map((item, index) => {
                const row = asRecord(item);
                return {
                    id: String(row.id ?? row.Id ?? index),
                    nombre: String(row.name ?? row.Name ?? row.nombre ?? ""),
                    refId: String(row.refId ?? row.RefId ?? row.referenceId ?? row.ReferenceId ?? ""),
                    modificado: String(row.dateModified ?? row.DateModified ?? row.modifiedAt ?? "--"),
                    usuario: String(row.userName ?? row.UserName ?? row.usuario ?? "--"),
                    status: (row.status ?? row.Status ?? row.isActive) ? "Activo" : "Inactivo",
                };
            }) as GeofenceLocationRow[];

            setLocations(mapped);
        } finally {
            setLocationsLoading(false);
        }
    }, [fetchWithAuth, params?.id]);

    useEffect(() => {
        if (activeTab === "ubicaciones") {
            loadLocations();
        }
    }, [activeTab, loadLocations]);

    // ====== PUT (Aplicar/Guardar) ======
    const putUpdate = useCallback(
        async (navigateAfter?: boolean) => {
            const current = recordRef.current;

            // Validaciones mínimas
            const errs: string[] = [];
            if (!current.name.trim()) errs.push("Falta el nombre.");
            const normalized = normalizeCoverage(current.coverage);
            if (!normalized) errs.push("Dibuja un polígono válido (al menos 3 puntos).");

            if (errs.length) {
                console.warn("Validación antes de PUT:", errs);
                return;
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
                await fetchWithAuth<{ id: string | number; message: string }>(`${API_BASE}/${params.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                setApplied(true);
                if (navigateAfter) router.push(`/ubicaciones/geocercas`);
                else await load(); // refrescar datos por si el back normaliza
            } catch (e) {
                console.error("Error actualizando geofence:", errorPayload(e));
            } finally {
                setSaving(false);
            }
        },
        [fetchWithAuth, load, params.id, router]
    );

    // ====== Header ======
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => putUpdate(false),
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: () => putUpdate(true),
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => router.push("/ubicaciones/geocercas"),
                disabled: saving,
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [putUpdate, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Geocercas</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {loading ? "Cargando…" : record.name || `Geocerca #${params.id}`}
                    </div>
                </div>
            ),
            action: headerActions,
            status: {
                text: record.status === "active" ? "Activo" : "Inactivo",
                variant: record.status === "active" ? "success" : "warning",
                // (opcional) showApplied indicator
                pill: applied ? { text: "Aplicado", variant: "success" } : undefined,
            },
        } as PageHeaderProps),
        [headerActions, loading, record.status, record.name, params.id, applied]
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 h-[560px] w-full animate-pulse rounded-xl bg-gray-100" />
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white">
            <div className="p-6">
                {activeTab === "resumen" && (
                    <GeofenceResumenTab record={record} onChange={onChange} />
                )}

                {activeTab === "ubicaciones" && (
                    <GeofenceLocationsTab loading={locationsLoading} rows={locationRowsToRender} />
                )}

                {activeTab === "comentarios" && (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
                        Sin comentarios para esta geocerca.
                    </div>
                )}

                {activeTab === "logs" && (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
                        Sin logs para esta geocerca.
                    </div>
                )}
            </div>
        </div>
    );
}
