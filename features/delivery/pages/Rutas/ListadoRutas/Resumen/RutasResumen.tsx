// views\Delivery\Rutas\Resumen\Resumen.tsx
"use client";

/* ==========================================================================
   RUTAS - RESUMEN
   ========================================================================== */

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { DocumentTextIcon, PencilSquareIcon, PlayIcon } from "@heroicons/react/24/solid";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { RutasDetalleFields, type RutasDetalleRecord } from "@/features/delivery/components/rutas/listadorutas/RutasDetalleFields";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { ActionButton } from "@/components/ui/button/action-button";

type SelectOption = { label: string; value: string };

type ApiListResponse<T> = {
    data?: T[];
    items?: T[];
    rows?: T[];
    results?: T[];
};

type ApiDriverItem = {
    id?: string | null;
    driverId?: string | null;
    externalId?: string | null;
    name?: string | null;
    firstName?: string | null;
    first_name?: string | null;
    firstname?: string | null;
    lastName?: string | null;
    last_name?: string | null;
    lastname?: string | null;
};

type ApiVehicleItem = {
    id?: string | null;
    vehicleId?: string | null;
    externalId?: string | null;
    name?: string | null;
    refId?: string | null;
    referenceId?: string | null;
    plate?: string | null;
};

type ApiDeliveryManItem = {
    id?: string | null;
    deliveryManId?: string | null;
    helperId?: string | null;
    externalId?: string | null;
    name?: string | null;
    firstName?: string | null;
    first_name?: string | null;
    firstname?: string | null;
    lastName?: string | null;
    last_name?: string | null;
    lastname?: string | null;
};

const normalizeRows = <T,>(payload: ApiListResponse<T> | T[] | null | undefined): T[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.rows)) return payload.rows;
    if (Array.isArray(payload.results)) return payload.results;
    return [];
};

const toDriverOptions = (rows: ApiDriverItem[]): SelectOption[] => {
    const map = new Map<string, SelectOption>();

    for (const item of rows) {
        const id = String(item?.id ?? item?.driverId ?? item?.externalId ?? "").trim();
        if (!id) continue;

        const name = String(item?.name ?? "").trim();
        const firstName = String(item?.firstName ?? item?.first_name ?? item?.firstname ?? "").trim();
        const lastName = String(item?.lastName ?? item?.last_name ?? item?.lastname ?? "").trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

        map.set(id, {
            value: id,
            label: name || fullName || id,
        });
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
};

const toVehicleOptions = (rows: ApiVehicleItem[]): SelectOption[] => {
    const map = new Map<string, SelectOption>();

    for (const item of rows) {
        const id = String(item?.id ?? item?.vehicleId ?? item?.externalId ?? "").trim();
        if (!id) continue;

        const name = String(item?.name ?? "").trim();
        const refId = String(item?.refId ?? item?.referenceId ?? "").trim();
        const plate = String(item?.plate ?? "").trim();

        map.set(id, {
            value: id,
            label: name || refId || plate || id,
        });
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
};

const toDeliveryManOptions = (rows: ApiDeliveryManItem[]): SelectOption[] => {
    const map = new Map<string, SelectOption>();

    for (const item of rows) {
        const id = String(item?.id ?? item?.deliveryManId ?? item?.helperId ?? item?.externalId ?? "").trim();
        if (!id) continue;

        const name = String(item?.name ?? "").trim();
        const firstName = String(item?.firstName ?? item?.first_name ?? item?.firstname ?? "").trim();
        const lastName = String(item?.lastName ?? item?.last_name ?? item?.lastname ?? "").trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

        map.set(id, {
            value: id,
            label: name || fullName || id,
        });
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
};

/* ---------- MOCK/estado inicial (tipado) ---------- */
const EMPTY: RutasDetalleRecord = {
    conductorId: "",
    repartidorId: "",
    vehiculoId: "",
    inicio: "",
    fin: "",
    distanciaKm: 0,
    distanciaRecorridaKm: 0,
    duracionEstimadaMin: 0,
    duracionRealMin: 0,
    estadoTiempo: "InProgress",
    resultado: { pickupsOk: 0, pickupsNo: 0, entregasOk: 0, entregasNo: 0, avancePct: 0 },
    creador: { initials: "—", name: "—", email: "—", at: "—" },
};

export default function RutasResumenView() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();
    const { user } = useAuth();

    const [record, setRecord] = useState<RutasDetalleRecord>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [routeStatus, setRouteStatus] = useState<string>("created");
    const [routeDisplayId, setRouteDisplayId] = useState<string>("");
    const [driverCatalog, setDriverCatalog] = useState<SelectOption[]>([]);
    const [helperCatalog, setHelperCatalog] = useState<SelectOption[]>([]);
    const [vehicleCatalog, setVehicleCatalog] = useState<SelectOption[]>([]);
    const [driverNameFromRoute, setDriverNameFromRoute] = useState<string>("");
    const [helperNameFromRoute, setHelperNameFromRoute] = useState<string>("");
    const [vehicleNameFromRoute, setVehicleNameFromRoute] = useState<string>("");

    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    const routeId = String(params?.id ?? "").trim();

    const toDatetimeLocal = (value?: string | null) => {
        if (!value) return "";
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        const yyyy = dt.getFullYear();
        const mm = pad(dt.getMonth() + 1);
        const dd = pad(dt.getDate());
        const hh = pad(dt.getHours());
        const mi = pad(dt.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };

    const toDateTimeLabel = (value?: string | null) => {
        if (!value) return "—";
        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) return "—";
        return dt.toLocaleString();
    };

    const diffMinutes = (start?: string | null, end?: string | null) => {
        if (!start || !end) return 0;
        const a = new Date(start);
        const b = new Date(end);
        if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
        const minutes = Math.round((b.getTime() - a.getTime()) / 60000);
        return minutes > 0 ? minutes : 0;
    };

    const toInitials = (value?: string | null) => {
        const text = String(value || "").trim();
        if (!text) return "—";
        const pieces = text.split(/\s+/).filter(Boolean);
        if (!pieces.length) return "—";
        return pieces
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() || "")
            .join("");
    };

    const mapStatusToBadge = (status?: string | null): PageHeaderProps["status"] => {
        const current = String(status || "").toLowerCase();
        if (["created", "scheduled", "pending"].includes(current)) {
            return { text: "Creada", variant: "warning" };
        }
        if (["finished", "completed", "delivered", "done"].includes(current)) {
            return { text: "Finalizada", variant: "success" };
        }
        if (["cancelled", "canceled", "failed", "error"].includes(current)) {
            return { text: "Cancelada", variant: "error" };
        }
        if (["in_progress", "inprogress", "on_route", "dispatched"].includes(current)) {
            return { text: "En curso", variant: "processing" };
        }
        return { text: "Programada", variant: "warning" };
    };

    /* ----------------- cargar detalle (endpoint real) ----------------- */
    useEffect(() => {
        if (!routeId) return;
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const response = await fetchWithAuthDelivery<any>(`route/${encodeURIComponent(routeId)}`, {
                    method: "GET",
                    cache: "no-store",
                });
                const route = response && typeof response === "object" && response.data && typeof response.data === "object"
                    ? response.data
                    : response;
                const totalShippings = Number(route?.totalShippings ?? 0);
                const completedShippings = Number(route?.totalShippingsCompleted ?? 0);
                const pendingShippings = Math.max(0, totalShippings - completedShippings);
                const avancePct = totalShippings > 0 ? Math.round((completedShippings / totalShippings) * 100) : 0;
                const estimatedMinutes = diffMinutes(route?.scheduleStart, route?.scheduleEnd);

                const mapped: RutasDetalleRecord = {
                    conductorId: String(route?.driverId ?? ""),
                    repartidorId: String(route?.deliveryManId ?? ""),
                    vehiculoId: String(route?.vehicleId ?? ""),
                    inicio: toDatetimeLocal(route?.scheduleStart),
                    fin: toDatetimeLocal(route?.scheduleEnd),
                    distanciaKm: Number(route?.expectedDistance ?? 0),
                    distanciaRecorridaKm: Number(route?.distanceTraveled ?? 0),
                    duracionEstimadaMin: estimatedMinutes,
                    duracionRealMin: 0,
                    estadoTiempo: "InProgress",
                    resultado: {
                        pickupsOk: route?.originWarehouseId ? 1 : 0,
                        pickupsNo: route?.originWarehouseId ? 0 : 1,
                        entregasOk: completedShippings,
                        entregasNo: pendingShippings,
                        avancePct,
                    },
                    creador: {
                        initials: toInitials(route?.userCreated),
                        name: String(route?.userCreated || "—"),
                        at: toDateTimeLabel(route?.dateCreated),
                    },
                    ultimaModificacion: {
                        initials: toInitials(route?.userModified),
                        name: String(route?.userModified || "—"),
                        at: toDateTimeLabel(route?.dateModified),
                    },
                };

                if (mounted) {
                    setRecord(mapped);
                    setRouteStatus(String(route?.status || "created"));
                    setRouteDisplayId(String(route?.displayId || route?.refId || route?.id || routeId));
                    setDriverNameFromRoute(String(route?.driverName ?? route?.driver?.name ?? "").trim());
                    setHelperNameFromRoute(String(route?.deliveryManName ?? route?.deliveryMan?.name ?? "").trim());
                    setVehicleNameFromRoute(String(route?.vehicleName ?? route?.vehicle?.name ?? "").trim());
                }
            } catch (e) {
                console.error(e);
                if (mounted) {
                    setRecord(EMPTY);
                    setRouteStatus("created");
                    setRouteDisplayId(routeId);
                    setHelperNameFromRoute("");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [fetchWithAuthDelivery, routeId]);

    useEffect(() => {
        if (!routeId) return;
        let mounted = true;

        const loadCatalogs = async () => {
            try {
                const [driverPayload, helperPayload, vehiclePayload] = await Promise.all([
                    fetchWithAuthDelivery<ApiListResponse<ApiDriverItem>>("driver", { method: "GET", cache: "no-store" }),
                    fetchWithAuthDelivery<ApiListResponse<ApiDeliveryManItem>>("delivery-man", { method: "GET", cache: "no-store" }),
                    fetchWithAuthDelivery<ApiListResponse<ApiVehicleItem>>("vehicle", { method: "GET", cache: "no-store" }),
                ]);

                if (!mounted) return;
                setDriverCatalog(toDriverOptions(normalizeRows(driverPayload)));
                setHelperCatalog(toDeliveryManOptions(normalizeRows(helperPayload)));
                setVehicleCatalog(toVehicleOptions(normalizeRows(vehiclePayload)));
            } catch (error) {
                console.error("Error cargando catálogos de ruta:", error);
                if (!mounted) return;
                setDriverCatalog([]);
                setHelperCatalog([]);
                setVehicleCatalog([]);
            }
        };

        loadCatalogs();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuthDelivery, routeId]);

    /* ----------------- selects de conductor/repartidor/vehículo ----------------- */
    const driverOptions = useMemo(() => {
        const list = [...driverCatalog];
        const current = String(record.conductorId || "").trim();
        if (current && !list.some((opt) => opt.value === current)) {
            list.unshift({ label: driverNameFromRoute || "Conductor sin nombre", value: current });
        }
        return list;
    }, [driverCatalog, driverNameFromRoute, record.conductorId]);

    const helperOptions = useMemo(() => {
        const list = [...helperCatalog];
        const current = String(record.repartidorId || "").trim();
        if (current && !list.some((opt) => opt.value === current)) {
            list.unshift({ label: helperNameFromRoute || current, value: current });
        }
        return list;
    }, [helperCatalog, helperNameFromRoute, record.repartidorId]);

    const vehicleOptions = useMemo(() => {
        const list = [...vehicleCatalog];
        const current = String(record.vehiculoId || "").trim();
        if (current && !list.some((opt) => opt.value === current)) {
            list.unshift({ label: vehicleNameFromRoute || "Vehículo sin nombre", value: current });
        }
        return list;
    }, [record.vehiculoId, vehicleCatalog, vehicleNameFromRoute]);

    /* ----------------- guardar (PUT) ----------------- */
    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;
        setSaving(true);
        try {
            const toIsoOrEmpty = (value?: string | null) => {
                const text = String(value ?? "").trim();
                if (!text) return "";
                const dt = new Date(text);
                return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
            };

            const driverId = String(current.conductorId ?? "").trim();
            const deliveryManId = String(current.repartidorId ?? "").trim();
            const vehicleId = String(current.vehiculoId ?? "").trim();
            const scheduleStart = toIsoOrEmpty(current.inicio);
            const scheduleEnd = toIsoOrEmpty(current.fin);
            const userModified = String(currentUser?.id ?? "").trim();

            const body: any = {};
            if (driverId) body.driverId = driverId;
            if (deliveryManId) body.deliveryManId = deliveryManId;
            if (vehicleId) body.vehicleId = vehicleId;
            if (scheduleStart) body.scheduleStart = scheduleStart;
            if (scheduleEnd) body.scheduleEnd = scheduleEnd;
            if (userModified) body.userModified = userModified;

            await fetchWithAuthDelivery(`route/${encodeURIComponent(routeId)}`, {
                method: "PATCH",
                body: JSON.stringify(body),
            });
        } catch (err) {
            console.error("Error al guardar ruta:", (err as any)?.payload ?? err);
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuthDelivery, routeId]);

    /* ----------------- acciones header  ----------------- */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/rutas/listado-rutas"),
                disabled: saving,
            },
        ],
        [handleSave, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Rutas de transporte</div>
                    <div className="text-2xl font-semibold text-gray-900">{routeDisplayId || routeId || "Ruta"}</div>
                </div>
            ),
            action: headerActions,
            status: mapStatusToBadge(routeStatus),
        } as unknown as PageHeaderProps),
        [headerActions, routeDisplayId, routeId, routeStatus]
    );

    const handleGenerateDeliverySheet = useCallback(() => {
        console.info("Generar guía de despacho", { routeId });
    }, [routeId]);

    const handleEditRoute = useCallback(() => {
        console.info("Editar ruta", { routeId });
    }, [routeId]);

    const handleStartRoute = useCallback(() => {
        console.info("Iniciar ruta", { routeId });
    }, [routeId]);

    /* ----------------- Render  ----------------- */
    if (loading) return <div className="p-6">Cargando…</div>;

    return (
        <div>
            <div className="px-6 py-3">
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <ActionButton variant="success" onClick={handleGenerateDeliverySheet} disabled={saving}>
                        <DocumentTextIcon className="h-4 w-4" />
                        Generar guía de despacho
                    </ActionButton>
                    <ActionButton variant="pick" onClick={handleEditRoute} disabled={saving}>
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar ruta
                    </ActionButton>
                    <ActionButton variant="pick" onClick={handleStartRoute} disabled={saving}>
                        <PlayIcon className="h-4 w-4" />
                        Iniciar
                    </ActionButton>
                </div>
            </div>

            <div className="p-6">
                <RutasDetalleFields
                    record={record}
                    onChange={(k, v) => setRecord((prev) => ({ ...prev, [k]: v }))}
                    driverOptions={driverOptions}
                    helperOptions={helperOptions}
                    vehicleOptions={vehicleOptions}
                />
            </div>
        </div>
    );
}
