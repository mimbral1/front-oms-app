"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import Card from "@/components/ui/card/Card";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { BASE_WAREHOUSES, COMMERCE_SERVICE_LOCATIONS_SIMPLE } from "@/lib/http/endpoints";

import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
const API_BASE = BASE_WAREHOUSES;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});

type ApiWarehouseGroup = {
    id?: string | null;
    name?: string | null;
    location?: string | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
};

type WarehouseGroupRecord = {
    id: string;
    name: string;
    location: string;
    status: "Active" | "Inactive";
    created: { user: string; date: string };
    modified: { user: string; date: string };
};

type WarehouseStatus = WarehouseGroupRecord["status"];

type LocationOption = {
    id: string;
    name: string;
    display: string;
};

type ApiLocation = {
    id?: string | number | null;
    name?: string | null;
};

type ApiLocationsResponse = {
    items?: ApiLocation[];
};

const LOCATIONS_URL = COMMERCE_SERVICE_LOCATIONS_SIMPLE;

const EMPTY: WarehouseGroupRecord = {
    id: "",
    name: "",
    location: "",
    status: "Active",
    created: { user: "-", date: "-" },
    modified: { user: "-", date: "-" },
};

const STATUS_LABELS: Record<WarehouseStatus, string> = {
    Active: "Activo",
    Inactive: "Inactivo",
};

const STATUS_OPTIONS = Object.values(STATUS_LABELS);

const toStatusLabel = (status: WarehouseStatus) => STATUS_LABELS[status];

const fromStatusLabel = (label: string): WarehouseStatus =>
    label === STATUS_LABELS.Inactive ? "Inactive" : "Active";

const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};

export default function GruposAlmacenesResumenView() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const recordId = String(params?.id || "");

    const [record, setRecord] = useState<WarehouseGroupRecord>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);

    useEffect(() => {
        let mounted = true;

        const loadLocations = async () => {
            try {
                const response = await fetch(LOCATIONS_URL, {
                    method: "GET",
                    headers: JANIS_HEADERS,
                });
                if (!response.ok) return;

                const data = (await response.json()) as ApiLocationsResponse;
                const options = (Array.isArray(data.items) ? data.items : [])
                    .map((item) => {
                        const id = String(item?.id ?? "").trim();
                        const name = String(item?.name ?? "").trim();
                        return {
                            id,
                            name,
                            display: id && name ? `${id} - ${name}` : name,
                        };
                    })
                    .filter((item) => item.id && item.name);

                if (mounted) {
                    setLocationOptions(options);
                }
            } catch {
                if (mounted) setLocationOptions([]);
            }
        };

        loadLocations();
        return () => {
            mounted = false;
        };
    }, []);

    const fetchDetail = useCallback(async () => {
        if (!recordId) return;

        try {
            setLoading(true);
            setErrorMessage(null);
            setSaveMessage(null);

            const response = await fetch(`${API_BASE}/warehouse-group/${encodeURIComponent(recordId)}`, {
                method: "GET",
                headers: JANIS_HEADERS,
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || `HTTP ${response.status}`);
            }

            const data = (await response.json()) as ApiWarehouseGroup;
            setRecord({
                id: String(data.id || recordId),
                name: String(data.name || ""),
                location: String(data.location || ""),
                status: String(data.status || "").toLowerCase() === "active" ? "Active" : "Inactive",
                created: {
                    user: String(data.userCreated || "-"),
                    date: formatDate(data.dateCreated),
                },
                modified: {
                    user: String(data.userModified || "-"),
                    date: formatDate(data.dateModified),
                },
            });
        } catch (error: any) {
            setErrorMessage(error?.message || "No se pudo cargar el grupo de almacenes");
        } finally {
            setLoading(false);
        }
    }, [recordId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleSave = useCallback(async () => {
        if (!record.id) return;
        const name = record.name.trim();

        if (!name) {
            alert("Debes ingresar un nombre para guardar.");
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(`${API_BASE}/warehouse-group/${encodeURIComponent(record.id)}`, {
                method: "PUT",
                headers: {
                    ...JANIS_HEADERS,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    location: String(record.location || "").trim(),
                    status: record.status === "Active" ? "active" : "inactive",
                }),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || `HTTP ${response.status}`);
            }

            await fetchDetail();
            setSaveMessage("Cambios guardados correctamente.");
        } catch (error: any) {
            alert(`No se pudo guardar: ${error?.message || "Error desconocido"}`);
        } finally {
            setSaving(false);
        }
    }, [record, fetchDetail]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                onClick: handleSave,
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                disabled: saving || loading,
            },
            {
                label: "Guardar",
                variant: "success",
                onClick: handleSave,
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                disabled: saving || loading,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => router.push("/almacen/configuracion/grupos"),
                icon: <XCircleIcon className="h-5 w-5" />,
                disabled: saving,
            },
        ],
        [handleSave, loading, router, saving]
    );

    const selectedLocationLabel =
        locationOptions.find((opt) => opt.id === record.location)?.display || "";

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title={
                    <div>
                        <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Grupo de Almacenes</div>
                        <div className="text-2xl font-semibold text-gray-900">Resumen</div>
                    </div>
                }
                description={record.id ? `ID: ${record.id}` : undefined}
                action={headerActions}
                status={{
                    text: loading ? "Cargando" : toStatusLabel(record.status),
                    variant: record.status === "Active" ? "success" : "warning",
                }}
            />

            <div className="p-6">
                {loading && <p className="mb-4 text-sm text-gray-500">Cargando grupo de almacenes...</p>}
                {errorMessage && <p className="mb-4 text-sm text-red-600">{errorMessage}</p>}
                {saveMessage && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{saveMessage}</p>}

                {!loading && !errorMessage && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                        <div className="lg:col-span-4">
                            <Card
                                title="GRUPO DE ALMACENES"
                                icon={<BuildingOffice2Icon className="h-5 w-5 text-gray-500" />}
                                noDefaultStyles
                                hasTitleDivider
                                className="rounded-xl bg-white p-6 shadow-sm"
                            >
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-12 items-center gap-3">
                                        <span className="col-span-3 text-sm text-gray-600">Nombre</span>
                                        <div className="col-span-9 w-full max-w-md">
                                            <input
                                                className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                                value={record.name}
                                                onChange={(e) => setRecord((prev) => ({ ...prev, name: e.target.value }))}
                                                placeholder="Nombre del grupo"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-3">
                                        <span className="col-span-3 text-sm text-gray-600">Ubicacion</span>
                                        <div className="col-span-9 w-full max-w-md">
                                            <CollapsibleField
                                                inline
                                                label=""
                                                value={selectedLocationLabel || record.location}
                                                options={locationOptions.map((opt) => opt.display)}
                                                onChange={(value) => {
                                                    const selected = locationOptions.find((opt) => opt.display === String(value));
                                                    setRecord((prev) => ({ ...prev, location: selected?.id || prev.location }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-3">
                                        <span className="col-span-3 text-sm text-gray-600">Estado</span>
                                        <div className="col-span-9 w-full max-w-md">
                                            <CollapsibleField
                                                inline
                                                label=""
                                                value={toStatusLabel(record.status)}
                                                options={STATUS_OPTIONS}
                                                onChange={(value) =>
                                                    setRecord((prev) => ({ ...prev, status: fromStatusLabel(String(value)) }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-3 space-y-6">
                            <Card title="USUARIO CREADOR" hasTitleDivider noDefaultStyles className="rounded-xl bg-white p-6 shadow-sm">
                                <div className="text-sm text-gray-700">{record.created.user}</div>
                                <div className="text-xs text-gray-500">{record.created.date}</div>
                            </Card>

                            <Card title="ULTIMA MODIFICACION" hasTitleDivider noDefaultStyles className="rounded-xl bg-white p-6 shadow-sm">
                                <div className="text-sm text-gray-700">{record.modified.user}</div>
                                <div className="text-xs text-gray-500">{record.modified.date}</div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
