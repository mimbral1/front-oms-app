// views\PickingView\configuraciones\Resumen\PickerResumenView.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { toast } from "react-hot-toast";

import { Picker, PickersFields } from "@/features/picking/components/pickingview/configuraciones/PickersFields";
import { useApiPickers } from "@/app/fetchWithAuth/picking/configuraciones/api-pickers/api-pickers";
import { useAuth } from "@/app/context/auth/AuthContext";

type ZoneState = { enabled: 0 | 1; restricted: 0 | 1 };
type OriginalAssignments = {
    carrierIds: Set<string>;
    locationIds: Set<string>;
    shippingTypeCodes: Set<string>;
    pickingPointIds: Set<string>;
    zones: Map<string, ZoneState>;
};

const EMPTY_ASSIGNMENTS: OriginalAssignments = {
    carrierIds: new Set<string>(),
    locationIds: new Set<string>(),
    shippingTypeCodes: new Set<string>(),
    pickingPointIds: new Set<string>(),
    zones: new Map<string, ZoneState>(),
};

export default function PickerResumenView() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const { user } = useAuth();
    const { getPickerById, updatePicker } = useApiPickers();

    const [record, setRecord] = useState<Picker | null>(null);
    const recordRef = useRef<Picker | null>(null);
    const originalRef = useRef<OriginalAssignments>(EMPTY_ASSIGNMENTS);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* ===============================
       Mantener ref sincronizada
    =============================== */
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    /* ===============================
       LOAD
    =============================== */
    const load = async () => {
        if (!id) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await getPickerById(id);
            const data = res.data;

            const originalCarrierIds =
                data.assignments?.carriers
                    ?.filter((c: any) => c.enabled)
                    ?.map((c: any) => String(c.carrierId)) ?? [];

            const originalLocationIds =
                data.assignments?.locations
                    ?.filter((l: any) => l.enabled)
                    ?.map((l: any) => String(l.locationId)) ?? [];

            const originalShippingTypeCodes =
                data.assignments?.shippingTypes
                    ?.filter((s: any) => s.enabled)
                    ?.map((s: any) => String(s.shippingTypeCode)) ?? [];

            const originalZones = new Map<string, ZoneState>();
            (data.assignments?.zones ?? []).forEach((z: any) => {
                const zoneId = String(z.zoneId ?? z.id ?? "");
                if (!zoneId) return;
                originalZones.set(zoneId, {
                    enabled: z.enabled ? 1 : 0,
                    restricted: z.restricted ? 1 : 0,
                });
            });

            originalRef.current = {
                carrierIds: new Set(originalCarrierIds),
                locationIds: new Set(originalLocationIds),
                shippingTypeCodes: new Set(originalShippingTypeCodes),
                pickingPointIds: new Set(
                    data.assignments?.pickingPoints
                        ?.filter((p: any) => p.enabled)
                        ?.map((p: any) => String(p.pickingPointId)) ?? []
                ),
                zones: originalZones,
            };

            setRecord({
                nombre: data.snapshot?.userName ?? "",
                email: data.snapshot?.userEmail ?? "",
                perfil: "",
                idFuncionario: String(data.picker?.userId ?? data.snapshot?.userId ?? ""),
                almacenTienda: "",

                carrierIds: originalCarrierIds,

                locationIds: originalLocationIds,

                shippingTypeCodes: originalShippingTypeCodes,

                pickingPointIds:
                    data.assignments?.pickingPoints
                        ?.filter((p: any) => p.enabled)
                        ?.map((p: any) => p.pickingPointId) ?? [],

                enabledPickingZones: Array.from(originalZones.entries())
                    .filter(([, z]) => z.enabled === 1 && z.restricted === 0)
                    .map(([zoneId]) => zoneId),
                restrictedPickingZones: Array.from(originalZones.entries())
                    .filter(([, z]) => z.restricted === 1)
                    .map(([zoneId]) => zoneId),

                estado: data.picker.status === "active" ? "Activo" : "Inactivo",

                creador: data.profiles?.createdBy
                    ? {
                        nombre: `${data.profiles.createdBy.nombres} ${data.profiles.createdBy.apellidos}`,
                        email: data.profiles.createdBy.email,
                        avatar: data.profiles.createdBy.urlImagenPerfil,
                    }
                    : undefined,

                modificador: data.profiles?.updatedBy
                    ? {
                        nombre: `${data.profiles.updatedBy.nombres ?? ""} ${data.profiles.updatedBy.apellidos ?? ""}`.trim(),
                        email: data.profiles.updatedBy.email,
                        avatar: data.profiles.updatedBy.urlImagenPerfil,
                    }
                    : undefined,

                fechaCreacion: data.picker.dateCreatedCL,
                ultimaModificacion: data.picker.dateModifiedCL,
            });
        } catch (e: any) {
            console.error("Error cargando picker:", e);
            setErrorMessage(
                e?.message || "No se pudo cargar el picker."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [id]);

    /* ===============================
       GUARDAR (PATCH)
    =============================== */
    const handleSave = async (goBack = false) => {
        const current = recordRef.current;
        if (!current || !user || !id) return;

        const toChanges = (original: Set<string>, currentValues: string[]) => {
            const next = new Set(currentValues.map((v) => String(v)));
            const ids = new Set(Array.from(original).concat(Array.from(next)));
            return Array.from(ids);
        };

        const carrierChanges = toChanges(originalRef.current.carrierIds, current.carrierIds)
            .map((carrierId) => ({
                carrierId,
                enabled: (current.carrierIds.includes(carrierId) ? 1 : 0) as 0 | 1,
            }))
            .filter((ch) => (originalRef.current.carrierIds.has(ch.carrierId) ? 1 : 0) !== ch.enabled);

        const locationChanges = toChanges(originalRef.current.locationIds, current.locationIds)
            .map((locationId) => ({
                locationId,
                enabled: (current.locationIds.includes(locationId) ? 1 : 0) as 0 | 1,
            }))
            .filter((ch) => (originalRef.current.locationIds.has(ch.locationId) ? 1 : 0) !== ch.enabled);

        const shippingTypeChanges = toChanges(originalRef.current.shippingTypeCodes, current.shippingTypeCodes)
            .map((shippingTypeCode) => ({
                shippingTypeCode,
                enabled: (current.shippingTypeCodes.includes(shippingTypeCode) ? 1 : 0) as 0 | 1,
            }))
            .filter((ch) => (originalRef.current.shippingTypeCodes.has(ch.shippingTypeCode) ? 1 : 0) !== ch.enabled);

        const pickingPointChanges = toChanges(originalRef.current.pickingPointIds, current.pickingPointIds)
            .map((pickingPointId) => ({
                pickingPointId,
                enabled: (current.pickingPointIds.includes(pickingPointId) ? 1 : 0) as 0 | 1,
            }))
            .filter((ch) => (originalRef.current.pickingPointIds.has(ch.pickingPointId) ? 1 : 0) !== ch.enabled);

        const currentEnabledZones = new Set(current.enabledPickingZones.map((z) => String(z)));
        const currentRestrictedZones = new Set(current.restrictedPickingZones.map((z) => String(z)));

        const zoneIds = new Set<string>([
            ...Array.from(originalRef.current.zones.keys()),
            ...Array.from(currentEnabledZones),
            ...Array.from(currentRestrictedZones),
        ]);

        const zoneChanges = Array.from(zoneIds)
            .map((zoneId) => {
                const originalZone = originalRef.current.zones.get(zoneId) ?? { enabled: 0 as 0 | 1, restricted: 0 as 0 | 1 };
                const restricted = (currentRestrictedZones.has(zoneId) ? 1 : 0) as 0 | 1;
                const enabled = (currentEnabledZones.has(zoneId) ? 1 : 0) as 0 | 1;
                return {
                    zoneId,
                    enabled,
                    restricted,
                    _changed:
                        originalZone.enabled !== enabled ||
                        originalZone.restricted !== restricted,
                };
            })
            .filter((z) => z._changed)
            .map(({ zoneId, enabled, restricted }) => ({ zoneId, enabled, restricted }));

        setSaving(true);

        try {
            await updatePicker(id, {
                changedBy: Number(user.id),
                status: current.estado === "Activo" ? "active" : "inactive",
                carrierChanges,
                locationChanges,
                shippingTypeChanges,
                pickingPointChanges,
                zoneChanges,
            });

            toast.success("Picker actualizado correctamente");

            await load();

            if (goBack) {
                router.push("/picking/configuraciones/pickers");
            }
        } catch (e: any) {
            toast.error(
                e?.message || "Ocurrió un error al guardar el picker"
            );
        } finally {
            setSaving(false);
        }
    };

    /* ===============================
       HEADER
    =============================== */
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                ),
                onClick: () => handleSave(false),
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => handleSave(true),
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/configuraciones/pickers"),
                disabled: saving,
            },
        ],
        [saving, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Pickers
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record?.nombre || `#${id}`}
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions, record?.nombre, id]
    );

    /* ===============================
       ESTADOS
    =============================== */
    if (loading) {
        return (
            <div className="p-6 text-gray-500">
                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                Cargando picker…
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="p-6 text-red-600">{errorMessage}</div>
        );
    }

    if (!record) return null;

    /* ===============================
       RENDER
    =============================== */
    return (
        <div className="p-6 bg-white">
            <PickersFields
                record={record}
                readOnly
                allowStatusEditWhenReadOnly
                onChange={(field, value) =>
                    setRecord((prev) =>
                        prev ? { ...prev, [field]: value } : prev
                    )
                }
            />
        </div>
    );
}
