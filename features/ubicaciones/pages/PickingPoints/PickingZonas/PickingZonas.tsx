"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    Squares2X2Icon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { useFetchWithAuthQA } from "@/lib/http/client";
import PickingZonasFields, { PickingZoneConfig } from "./PickingZonasFields";

type UnknownRecord = Record<string, unknown>;
const asRecord = (value: unknown): UnknownRecord =>
    value && typeof value === "object" ? (value as UnknownRecord) : {};
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/* ===== Mapeo API → PickingZoneConfig ===== */
function mapApiToZones(res: unknown): PickingZoneConfig[] {
    const resObj = asRecord(res);
    const dataObj = asRecord(resObj.data);
    const zones = dataObj.zones;
    if (!Array.isArray(zones)) return [];
    return asArray(zones).map((zone) => {
        const z = asRecord(zone);
        return {
            key: String(z.zoneId ?? ""),
            name: String(z.zoneName ?? ""),
            description: z.zoneDescription == null ? null : String(z.zoneDescription),
            active: Boolean(z.enabled),
            preparable: !Boolean(z.restricted),
        };
    });
}

export default function PickingZonas() {
    const router = useRouter();
    const { id } = useParams();
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [zones, setZones] = useState<PickingZoneConfig[]>([]);
    const [originalZones, setOriginalZones] = useState<PickingZoneConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const changedCount = useMemo(() => {
        return zones.filter((z) => {
            const orig = originalZones.find((o) => o.key === z.key);
            return orig && orig.active !== z.active;
        }).length;
    }, [zones, originalZones]);

    const activeCount = useMemo(
        () => zones.filter((z) => z.active).length,
        [zones]
    );

    /* ===== Cargar zonas desde API ===== */
    useEffect(() => {
        if (!id) return;
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const res = await fetchWithAuthQA<unknown>(
                    `picking-service/points-zones/${id}/zones`,
                    { method: "GET" },
                );
                if (mounted) {
                    const mapped = mapApiToZones(res);
                    setZones(mapped);
                    setOriginalZones(mapped);
                }
            } catch (error) {
                console.error("Error cargando zonas de picking:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, [id, fetchWithAuthQA]);

    const handleChange = <K extends keyof PickingZoneConfig>(zoneKey: string, field: K, value: PickingZoneConfig[K]) => {
        setZones((prev) => prev.map((z) => (z.key === zoneKey ? { ...z, [field]: value } : z)));
    };

    /* ===== Aplicar cambios (PATCH zonas modificadas) ===== */
    const handleApply = useCallback(async () => {
        if (!id) return;
        const changed = zones.filter((z) => {
            const orig = originalZones.find((o) => o.key === z.key);
            return orig && orig.active !== z.active;
        });
        if (changed.length === 0) return;

        setSaving(true);
        try {
            await Promise.all(
                changed.map((z) =>
                    fetchWithAuthQA("picking-service/points-zones/update", {
                        method: "PATCH",
                        body: JSON.stringify({
                            pickingPointId: id,
                            zoneId: z.key,
                            enabled: z.active,
                        }),
                    }),
                ),
            );
            setOriginalZones([...zones]);
        } catch (error) {
            console.error("Error actualizando zonas:", error);
        } finally {
            setSaving(false);
        }
    }, [id, zones, originalZones, fetchWithAuthQA]);

    const headerActions: Action[] = useMemo(
        () => [
            { label: saving ? "Aplicando…" : `Aplicar${changedCount > 0 ? ` (${changedCount})` : ""}`, variant: "success", icon: <CheckCircleIcon className="h-4 w-4" />, onClick: handleApply },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("Guardar", zones) },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-4 w-4" />, onClick: () => router.push("/ubicaciones/picking-points") },
        ],
        [router, zones, saving, handleApply, changedCount]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Puntos de picking</div>
                    <div className="text-2xl font-semibold text-gray-900">Sectores de Picking</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    if (loading) {
        return (
            <div className="p-6 bg-[#f5f7ff] min-h-[200px]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-slate-600">
                        <Squares2X2Icon className="h-5 w-5 animate-pulse" />
                        <span className="font-medium">Cargando zonas de picking...</span>
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (zones.length === 0) {
        return (
            <div className="p-6 bg-[#f5f7ff] min-h-[200px]">
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center shadow-sm">
                    <SparklesIcon className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-600">No hay zonas configuradas para este punto de picking.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7ff] p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                            <Squares2X2Icon className="h-4 w-4" />
                            Zonas: <strong>{zones.length}</strong>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                            <CheckCircleIcon className="h-4 w-4" />
                            Activas: <strong>{activeCount}</strong>
                        </span>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${changedCount > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                            Cambios pendientes: <strong>{changedCount}</strong>
                        </span>
                    </div>
                </div>

                <PickingZonasFields zones={zones} readOnly={false} onChange={handleChange} />
            </div>
        </div>
    );
}
