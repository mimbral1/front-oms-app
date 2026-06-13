"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import type { Action } from "@/components/layout/page-header";
import { ArrowDownTrayIcon, ArrowPathIcon, CalendarDaysIcon, HashtagIcon, PlusIcon } from "@heroicons/react/24/outline";
import { exportToCsv } from "@/components/presets/export/export";
import { DELIVERY_SHIPPING_CONTAINER_ENDPOINT } from "@/lib/http/endpoints";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import DateTimePickerField from "@/components/ui/date-time-picker/DateTimePickerField";
import { MultiSelectSearchInline } from "@/components/ui/collapsible/multiSelectSearchInline";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

type TipoContenedor = {
    id: string;
    nombre: string;
    sealNumber: string;
    estimatedDispatchDate: string;
    integracion: string;
    status: string;
    activo: boolean;
};

type CreateShippingContainerPayload = {
    status: "pending" | "approved" | "scheduled" | "dispatched" | "delivered" | "notDelivered" | "partiallyDelivered" | "error";
    shippingContainerTypeId: string;
    sealNumber: string;
    estimatedDispatchDate: string;
    companyId: string;
    packageIds: string[];
    integrationId?: string;
    integrationComplements?: {
        flightNumber?: string;
    };
};

type ShippingContainerTypeOption = {
    id: string;
    label: string;
};

type ShippingContainerTypeItem = {
    id?: string | null;
    name?: string | null;
    referenceId?: string | null;
};

type ShippingContainerTypeResponse = {
    data?: ShippingContainerTypeItem[];
};

type CompanyOption = {
    id: string;
    label: string;
};

type CompanyItem = {
    id?: string | null;
    name?: string | null;
    refId?: string | null;
};

type CompanyResponse = {
    data?: CompanyItem[];
};

type PackageOption = {
    id: string;
    label: string;
};

type PackageItem = {
    id?: string | null;
    name?: string | null;
    refId?: string | null;
    status?: string | null;
};

type PackageResponse = {
    data?: PackageItem[];
};

const INTEGRACIONES = ["Bluexpress", "Chilexpress", "Starken", "Integración propia"];

const getStatusMeta = (statusRaw: string) => {
    const normalized = String(statusRaw || "")
        .trim()
        .replace(/[-_\s]/g, "")
        .toLowerCase();

    const statusStyles: Record<string, { label: string; badgeClassName: string; dotClassName: string }> = {
        pending: {
            label: "Pendiente",
            badgeClassName: "border-sky-200 bg-sky-50 text-sky-800",
            dotClassName: "bg-sky-500",
        },
        approved: {
            label: "Aprobado",
            badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
            dotClassName: "bg-emerald-500",
        },
        scheduled: {
            label: "Programado",
            badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-800",
            dotClassName: "bg-indigo-500",
        },
        dispatched: {
            label: "Despachado",
            badgeClassName: "border-blue-200 bg-blue-50 text-blue-800",
            dotClassName: "bg-blue-500",
        },
        delivered: {
            label: "Entregado",
            badgeClassName: "border-teal-200 bg-teal-50 text-teal-800",
            dotClassName: "bg-teal-500",
        },
        notdelivered: {
            label: "No entregado",
            badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
            dotClassName: "bg-amber-500",
        },
        partiallydelivered: {
            label: "Parcialmente entregado",
            badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-800",
            dotClassName: "bg-cyan-500",
        },
        error: {
            label: "Error",
            badgeClassName: "border-rose-200 bg-rose-50 text-rose-800",
            dotClassName: "bg-rose-500",
        },
    };

    return statusStyles[normalized] ?? statusStyles.pending;
};

const getIntegrationMeta = (integrationRaw: string) => {
    const integration = String(integrationRaw || "").trim();
    const normalized = integration.toLowerCase();

    if (!integration || integration === "-") {
        return {
            label: "Sin integración",
            subtitle: "Sin conector logístico",
            chipClassName: "border-slate-200 bg-slate-50 text-slate-600",
        };
    }

    if (normalized.includes("bluexpress")) {
        return {
            label: integration,
            subtitle: "Conector activo",
            chipClassName: "border-sky-200 bg-sky-50 text-sky-800",
        };
    }

    if (normalized.includes("chilexpress")) {
        return {
            label: integration,
            subtitle: "Conector activo",
            chipClassName: "border-orange-200 bg-orange-50 text-orange-800",
        };
    }

    if (normalized.includes("starken")) {
        return {
            label: integration,
            subtitle: "Conector activo",
            chipClassName: "border-amber-200 bg-amber-50 text-amber-800",
        };
    }

    return {
        label: integration,
        subtitle: "Integración configurada",
        chipClassName: "border-violet-200 bg-violet-50 text-violet-800",
    };
};

const formatDateTime = (value: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getDispatchMeta = (value: string) => {
    const formatted = formatDateTime(value);
    if (formatted === "-") {
        return {
            formatted,
            hint: "Sin fecha",
            hintClassName: "bg-slate-100 text-slate-600",
        };
    }

    const dispatch = new Date(value);
    if (Number.isNaN(dispatch.getTime())) {
        return {
            formatted,
            hint: "Fecha inválida",
            hintClassName: "bg-rose-100 text-rose-700",
        };
    }

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dispatchStart = new Date(dispatch.getFullYear(), dispatch.getMonth(), dispatch.getDate()).getTime();
    const diffDays = Math.round((dispatchStart - todayStart) / dayMs);

    if (diffDays < 0) {
        return {
            formatted,
            hint: `Atrasado ${Math.abs(diffDays)} d`,
            hintClassName: "bg-rose-100 text-rose-700",
        };
    }

    if (diffDays === 0) {
        return {
            formatted,
            hint: "Hoy",
            hintClassName: "bg-amber-100 text-amber-700",
        };
    }

    if (diffDays === 1) {
        return {
            formatted,
            hint: "Mañana",
            hintClassName: "bg-emerald-100 text-emerald-700",
        };
    }

    return {
        formatted,
        hint: `En ${diffDays} d`,
        hintClassName: "bg-sky-100 text-sky-700",
    };
};

const mapPackageRows = (payload: unknown): TipoContenedor[] => {
    const list = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { data?: unknown[] })?.data)
            ? (payload as { data: unknown[] }).data
            : Array.isArray((payload as { items?: unknown[] })?.items)
                ? (payload as { items: unknown[] }).items
                : Array.isArray((payload as { data?: { items?: unknown[] } })?.data?.items)
                    ? (payload as { data: { items: unknown[] } }).data.items
                    : [];

    return list.map((raw, index) => {
        const item = (raw ?? {}) as Record<string, unknown>;
        const id = item.id ?? item._id ?? item.codigo ?? item.code ?? `PKG-${index + 1}`;
        const refId = item.refId ?? item.referenceId;
        const nombre = String(refId ?? "").trim() || "-";
        const sealNumber = String(item.sealNumber ?? item.seal ?? "").trim() || "-";
        const estimatedDispatchDate = String(item.estimatedDispatchDate ?? item.dispatchDate ?? "").trim();
        const integracion = item.integracion ?? item.integration ?? item.logisticIntegration ?? "Integración propia";
        const status = String(item.status ?? item.estado ?? "pending").trim() || "pending";
        const activo = item.activo ?? item.active ?? item.isActive ?? true;

        return {
            id: String(id),
            nombre: String(nombre),
            sealNumber,
            estimatedDispatchDate,
            integracion: String(integracion),
            status: String(status),
            activo: Boolean(activo),
        };
    });
};

interface Filters {
    search: string;
    integracion: string;
}

const initialFilters: Filters = {
    search: "",
    integracion: "",
};

const filterConfig: FilterConfig<Filters, TipoContenedor>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.nombre} ${row.integracion}`
                .toLowerCase()
                .includes(String(value ?? "").trim().toLowerCase()),
    },
    {
        id: "integracion",
        label: "Integración",
        type: "select",
        options: INTEGRACIONES.map((item) => ({ label: item, value: item })),
        rowValue: (row) => row.integracion,
    },
];

const getColumns = (): Column<TipoContenedor>[] => [
    {
        header: <div className="w-full text-center">ID</div>,
        accessorKey: "nombre",
        cell: (row) => (
            <div className="min-h-[48px] max-w-[150px] leading-tight">
                <div className="truncate text-sm font-semibold text-slate-800" title={row.nombre}>
                    {row.nombre}
                </div>
                <div className="mt-1 truncate text-xs text-slate-500" title={row.id}>
                    {row.id}
                </div>
            </div>
        ),
    },
    {
        header: <div className="w-full text-center">Sello</div>,
        accessorKey: "sealNumber",
        cell: (row) => (
            <div className="min-h-[48px] leading-tight text-center">
                <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                    <HashtagIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono text-xs font-semibold tracking-tight text-slate-700">{row.sealNumber || "-"}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">Código de sello</div>
            </div>
        ),
    },
    {
        header: <div className="w-full text-center">Despacho estimado</div>,
        accessorKey: "estimatedDispatchDate",
        cell: (row) => {
            const dispatchMeta = getDispatchMeta(row.estimatedDispatchDate);
            return (
                <div className="min-h-[48px] leading-tight text-center">
                    <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                        <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                        <span>{dispatchMeta.formatted}</span>
                    </div>
                    <div className="mt-1">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${dispatchMeta.hintClassName}`}>
                            {dispatchMeta.hint}
                        </span>
                    </div>
                </div>
            );
        },
    },
    {
        header: <div className="w-full text-center">Integración logística</div>,
        accessorKey: "integracion",
        cell: (row) => {
            const meta = getIntegrationMeta(row.integracion);
            return (
                <div className="min-h-[48px] leading-tight text-center">
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${meta.chipClassName}`}>
                        {meta.label}
                    </span>
                    <div className="mt-1 text-xs text-slate-500">{meta.subtitle}</div>
                </div>
            );
        },
    },
    {
        header: <div className="w-full text-center">Estado</div>,
        accessorKey: "status",
        cell: (row) => {
            const meta = getStatusMeta(row.status);
            return (
                <div className="min-h-[48px] flex items-center justify-center">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.badgeClassName}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} />
                        {meta.label}
                    </span>
                </div>
            );
        },
    },
];

export default function ContenedoresView() {
    const router = useRouter();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();
    const [rows, setRows] = useState<TipoContenedor[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [nombre, setNombre] = useState("");
    const [integracion, setIntegracion] = useState(INTEGRACIONES[0]);
    const [activo, setActivo] = useState(true);
    const [shippingContainerTypeOptions, setShippingContainerTypeOptions] = useState<ShippingContainerTypeOption[]>([]);
    const [shippingContainerTypeLoading, setShippingContainerTypeLoading] = useState(false);
    const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
    const [companyLoading, setCompanyLoading] = useState(false);
    const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
    const [packageLoading, setPackageLoading] = useState(false);
    const [packageSearchQuery, setPackageSearchQuery] = useState("");
    const [shippingContainerTypeId, setShippingContainerTypeId] = useState("");
    const [sealNumber, setSealNumber] = useState("");
    const [estimatedDispatchDate, setEstimatedDispatchDate] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [packageIds, setPackageIds] = useState<string[]>([]);
    const [integrationId, setIntegrationId] = useState("");
    const [flightNumber, setFlightNumber] = useState("");
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, TipoContenedor>({
            initialFilters,
            configs: filterConfig,
        });

    const loadPackages = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const response = await fetch(DELIVERY_SHIPPING_CONTAINER_ENDPOINT, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`No se pudo obtener contenedores (${response.status})`);
            }

            const payload = (await response.json()) as unknown;
            setRows(mapPackageRows(payload));
        } catch (error) {
            setRows([]);
            setLoadError(error instanceof Error ? error.message : "Error al cargar contenedores");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPackages();
    }, [loadPackages]);

    const loadShippingContainerTypes = useCallback(async () => {
        setShippingContainerTypeLoading(true);
        try {
            const response = await fetchWithAuthDelivery<ShippingContainerTypeResponse>("shipping-container-type", {
                method: "GET",
                cache: "no-store",
            });

            const list = Array.isArray(response?.data) ? response.data : [];
            const mapped = list
                .map((item) => {
                    const id = String(item?.id || "").trim();
                    if (!id) return null;
                    const name = String(item?.name || "").trim();
                    const referenceId = String(item?.referenceId || "").trim();
                    return {
                        id,
                        label: name || referenceId || id,
                    };
                })
                .filter(Boolean) as ShippingContainerTypeOption[];

            setShippingContainerTypeOptions(mapped);
        } catch (error) {
            console.error("Error cargando tipos de contenedor:", error);
            setShippingContainerTypeOptions([]);
        } finally {
            setShippingContainerTypeLoading(false);
        }
    }, [fetchWithAuthDelivery]);

    useEffect(() => {
        void loadShippingContainerTypes();
    }, [loadShippingContainerTypes]);

    const loadCompanies = useCallback(async () => {
        setCompanyLoading(true);
        try {
            const response = await fetchWithAuthDelivery<CompanyResponse>("company", {
                method: "GET",
                cache: "no-store",
            });

            const list = Array.isArray(response?.data) ? response.data : [];
            const mapped = list
                .map((item) => {
                    const id = String(item?.id || "").trim();
                    if (!id) return null;
                    const name = String(item?.name || "").trim();
                    const refId = String(item?.refId || "").trim();
                    return {
                        id,
                        label: name && refId ? `${name} (${refId})` : name || refId || id,
                    };
                })
                .filter(Boolean) as CompanyOption[];

            setCompanyOptions(mapped);
        } catch (error) {
            console.error("Error cargando compañías:", error);
            setCompanyOptions([]);
        } finally {
            setCompanyLoading(false);
        }
    }, [fetchWithAuthDelivery]);

    useEffect(() => {
        void loadCompanies();
    }, [loadCompanies]);

    const loadPackageOptions = useCallback(async () => {
        setPackageLoading(true);
        try {
            const response = await fetchWithAuthDelivery<PackageResponse>("package?page=1&limit=500", {
                method: "GET",
                cache: "no-store",
            });

            const list = Array.isArray(response?.data) ? response.data : [];
            const mapped = list
                .map((item) => {
                    const id = String(item?.id || "").trim();
                    if (!id) return null;
                    const name = String(item?.name || "").trim();
                    const refId = String(item?.refId || "").trim();
                    const status = String(item?.status || "").trim();
                    const baseLabel = name && refId ? `${name} (${refId})` : name || refId || id;
                    const label = status ? `${baseLabel} - ${status}` : baseLabel;
                    return { id, label };
                })
                .filter(Boolean) as PackageOption[];

            setPackageOptions(mapped);
        } catch (error) {
            console.error("Error cargando paquetes:", error);
            setPackageOptions([]);
        } finally {
            setPackageLoading(false);
        }
    }, [fetchWithAuthDelivery]);

    useEffect(() => {
        void loadPackageOptions();
    }, [loadPackageOptions]);

    const selectedRow = useMemo(
        () => rows.find((row) => row.id === selectedId) ?? null,
        [rows, selectedId]
    );

    const packageLabelById = useMemo(() => {
        const map = new Map<string, string>();
        packageOptions.forEach((option) => {
            map.set(option.id, option.label);
        });
        return map;
    }, [packageOptions]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

    const handleEdit = useCallback(
        (row: TipoContenedor) => {
            router.push(`/delivery/contenedores-etiquetas/contenedores/${encodeURIComponent(row.id)}`);
        },
        [router]
    );

    const columns = useMemo(() => getColumns(), []);

    const buildRecommendedSealNumber = useCallback(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const random = Math.floor(1000 + Math.random() * 9000);
        return `SEL-${y}${m}${d}-${random}`;
    }, []);

    const resetForm = () => {
        setSelectedId(null);
        setIsCreating(false);
        setNombre("");
        setIntegracion(INTEGRACIONES[0]);
        setActivo(true);
        setShippingContainerTypeId("");
        setSealNumber("");
        setEstimatedDispatchDate("");
        setCompanyId("");
        setPackageIds([]);
        setPackageSearchQuery("");
        setIntegrationId("");
        setFlightNumber("");
    };

    const startCreate = () => {
        setSelectedId(null);
        setIsCreating(true);
        setNombre("");
        setIntegracion(INTEGRACIONES[0]);
        setActivo(true);
        setShippingContainerTypeId("");
        setSealNumber("");
        setEstimatedDispatchDate("");
        setCompanyId("");
        setPackageIds([]);
        setPackageSearchQuery("");
        setIntegrationId("");
        setFlightNumber("");
    };

    const handleSave = async () => {
        const cleanNombre = nombre.trim();

        if (isCreating) {
            const cleanTypeId = shippingContainerTypeId.trim();
            const cleanSealNumber = sealNumber.trim();
            const cleanCompanyId = companyId.trim();
            const cleanIntegrationId = integrationId.trim();

            if (!cleanTypeId || !cleanSealNumber || !cleanCompanyId) {
                setLoadError("Completa los campos obligatorios para crear el contenedor.");
                return;
            }

            const estimatedDate = estimatedDispatchDate ? new Date(estimatedDispatchDate) : null;
            if (!estimatedDate || Number.isNaN(estimatedDate.getTime())) {
                setLoadError("Ingresa una fecha estimada de despacho válida.");
                return;
            }

            setSaving(true);
            setLoadError(null);

            try {
                const body: CreateShippingContainerPayload = {
                    status: "pending",
                    shippingContainerTypeId: cleanTypeId,
                    sealNumber: cleanSealNumber,
                    estimatedDispatchDate: estimatedDate.toISOString(),
                    companyId: cleanCompanyId,
                    packageIds,
                    ...(cleanIntegrationId ? { integrationId: cleanIntegrationId } : {}),
                    integrationComplements: flightNumber.trim()
                        ? { flightNumber: flightNumber.trim() }
                        : undefined,
                };

                await fetchWithAuthDelivery("shipping-container", {
                    method: "POST",
                    body: JSON.stringify(body),
                });

                await loadPackages();
                resetForm();
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Error al crear contenedor");
            } finally {
                setSaving(false);
            }
            return;
        }

        if (!cleanNombre) return;
        if (!selectedRow) return;

        setRows((prev) => [
            ...prev.map((row) =>
                row.id === selectedRow.id
                    ? { ...row, nombre: cleanNombre, integracion, activo }
                    : row
            ),
        ]);
        resetForm();
    };

    const handleExport = () => {
        const headers = ["ID", "Ref", "Sello", "Despacho estimado", "Integración", "Estado"];
        const data = filteredRows.map((row) => [
            row.id,
            row.nombre,
            row.sealNumber,
            formatDateTime(row.estimatedDispatchDate),
            row.integracion,
            getStatusMeta(row.status).label,
        ]);
        exportToCsv("tipos-contenedor.csv", [headers, ...data]);
    };

    const headerActions: Action[] = [
        {
            label: "Actualizar",
            variant: "secondary",
            onClick: () => {
                void loadPackages();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/delivery/contenedores-etiquetas/contenedores/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary",
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Contenedores"
                description="Lista de contenedores (Caja, Tote, Pallet), edición y asociación a integración logística."
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) =>
                    handleFilterChange(id, String(value ?? ""))
                }
                filterTitle
            />

            <div className="flex-1 px-6 pb-6 pt-2">
                {loadError ? (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {loadError}
                    </div>
                ) : null}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <section className={`${(selectedRow || isCreating) ? "xl:col-span-2" : "xl:col-span-3"} overflow-x-auto`}>
                        {loading ? <div className="pb-3 text-sm text-slate-600">Cargando contenedores...</div> : null}
                        {!loading && rows.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                                Aún no hay contenedores registrados.
                            </div>
                        ) : null}

                        {!loading && rows.length > 0 && filteredRows.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                                No hay contenedores que coincidan con los filtros seleccionados.
                            </div>
                        ) : null}

                        {!loading && filteredRows.length > 0 ? (
                            <DataTable
                                data={filteredRows}
                                columns={columns}
                                dataType="Pedidos"
                                layout="adaptive"
                                rowGap={4}
                                rowPaddingY={16}
                                rowBgClass="bg-white shadow-sm"
                                onRowClick={(row: TipoContenedor) => handleEdit(row)}
                            />
                        ) : null}
                    </section>

                    {(selectedRow || isCreating) ? (
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-sm font-semibold text-slate-800">{isCreating ? "Crear contenedor" : "Editar contenedor"}</p>

                            <div className="space-y-3">
                                {isCreating ? (
                                    <>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Tipo de contenedor *</label>
                                            <select
                                                value={shippingContainerTypeId}
                                                onChange={(e) => setShippingContainerTypeId(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                                disabled={shippingContainerTypeLoading}
                                            >
                                                <option value="">
                                                    {shippingContainerTypeLoading ? "Cargando tipos..." : "Selecciona un tipo de contenedor"}
                                                </option>
                                                {shippingContainerTypeOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Numero de sello *</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={sealNumber}
                                                    onChange={(e) => setSealNumber(e.target.value)}
                                                    placeholder="Ej: A0000-001"
                                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setSealNumber(buildRecommendedSealNumber())}
                                                    className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Sugerir
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Fecha estimada de despacho *</label>
                                            <DateTimePickerField
                                                value={estimatedDispatchDate}
                                                onChange={setEstimatedDispatchDate}
                                                showNowButton={false}
                                                compactTime
                                                equalizeDateHeight
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Compañía *</label>
                                            <select
                                                value={companyId}
                                                onChange={(e) => setCompanyId(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                                disabled={companyLoading}
                                            >
                                                <option value="">
                                                    {companyLoading ? "Cargando compañías..." : "Selecciona una compañía"}
                                                </option>
                                                {companyOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">IDs de paquetes</label>
                                            <MultiSelectSearchInline
                                                id="package-ids"
                                                label="paquetes"
                                                values={packageIds}
                                                options={packageOptions.map((option) => ({
                                                    label: option.label,
                                                    value: option.id,
                                                }))}
                                                searchQuery={packageSearchQuery}
                                                onSearch={setPackageSearchQuery}
                                                onChange={setPackageIds}
                                                compact
                                                showCompactSummary={false}
                                                showSelectedPanel={false}
                                                compactSelectionStyle="badge"
                                                size="sm"
                                                showSelectionInControl={false}
                                                resetSearchOnFocus
                                            />
                                            {packageIds.length > 0 ? (
                                                <div className="mt-2 rounded-md border border-blue-100 bg-blue-50/50 p-2">
                                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                                                        Seleccionados ({packageIds.length})
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {packageIds.map((id) => (
                                                            <span
                                                                key={id}
                                                                className="inline-flex max-w-[220px] items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                                                            >
                                                                <span className="truncate" title={packageLabelById.get(id) ?? id}>
                                                                    {packageLabelById.get(id) ?? id}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPackageIds((prev) => prev.filter((pkgId) => pkgId !== id))}
                                                                    className="rounded-full px-1 leading-none text-blue-700 hover:bg-blue-200"
                                                                    aria-label={`Quitar paquete ${packageLabelById.get(id) ?? id}`}
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Integración (opcional)</label>
                                            <input
                                                value={integrationId}
                                                onChange={(e) => setIntegrationId(e.target.value)}
                                                placeholder="Ej: E001300"
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Número de vuelo (opcional)</label>
                                            <input
                                                value={flightNumber}
                                                onChange={(e) => setFlightNumber(e.target.value)}
                                                placeholder="Ej: A100"
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
                                            <input
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                placeholder="Ej: Caja"
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Integración logística</label>
                                            <select
                                                value={integracion}
                                                onChange={(e) => setIntegracion(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                            >
                                                {INTEGRACIONES.map((item) => (
                                                    <option key={item} value={item}>
                                                        {item}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <label className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={activo}
                                                onChange={(e) => setActivo(e.target.checked)}
                                            />
                                            Tipo activo
                                        </label>
                                    </>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void handleSave();
                                        }}
                                        disabled={saving}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {saving ? "Guardando..." : isCreating ? "Crear" : "Guardar cambios"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </section>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
