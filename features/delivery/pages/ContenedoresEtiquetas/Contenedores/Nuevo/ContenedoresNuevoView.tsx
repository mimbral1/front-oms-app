"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircleIcon,
    XCircleIcon,
    CubeTransparentIcon,
    HashtagIcon,
    CalendarDaysIcon,
    BuildingOffice2Icon,
    ArchiveBoxIcon,
    LinkIcon,
    PaperAirplaneIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import DateTimePickerField from "@/components/ui/date-time-picker/DateTimePickerField";
import { MultiSelectSearchInline } from "@/components/ui/collapsible/multiSelectSearchInline";

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

export default function ContenedoresNuevoView() {
    const router = useRouter();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();

    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

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

    const packageLabelById = useMemo(() => {
        const map = new Map<string, string>();
        packageOptions.forEach((option) => {
            map.set(option.id, option.label);
        });
        return map;
    }, [packageOptions]);

    const buildRecommendedSealNumber = useCallback(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const random = Math.floor(1000 + Math.random() * 9000);
        return `SEL-${y}${m}${d}-${random}`;
    }, []);

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

    const handleCreate = useCallback(async () => {
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

            router.push("/delivery/contenedores-etiquetas/contenedores");
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Error al crear contenedor");
        } finally {
            setSaving(false);
        }
    }, [companyId, estimatedDispatchDate, fetchWithAuthDelivery, flightNumber, integrationId, packageIds, router, sealNumber, shippingContainerTypeId]);

    const headerActions: Action[] = [
        {
            label: "Cancelar",
            variant: "secondary",
            icon: <XCircleIcon className="h-5 w-5" />,
            onClick: () => router.push("/delivery/contenedores-etiquetas/contenedores"),
            disabled: saving,
        },
        {
            label: saving ? "Guardando..." : "Crear",
            variant: "success",
            icon: <CheckCircleIcon className="h-5 w-5" />,
            onClick: () => {
                void handleCreate();
            },
            disabled: saving,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Nuevo contenedor"
                description="Crear contenedor en shipping-container."
                action={headerActions}
            />

            <div className="flex-1 px-6 pb-6 pt-6">
                {loadError ? (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {loadError}
                    </div>
                ) : null}

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
                            <SparklesIcon className="h-5 w-5 text-slate-500" />
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-800">Crear contenedor</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Tipo de contenedor *" icon={CubeTransparentIcon}>
                                <select
                                    value={shippingContainerTypeId}
                                    onChange={(e) => setShippingContainerTypeId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
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
                            </Field>

                            <Field label="Compañía *" icon={BuildingOffice2Icon}>
                                <select
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
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
                            </Field>

                            <Field label="Numero de sello *" icon={HashtagIcon}>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={sealNumber}
                                        onChange={(e) => setSealNumber(e.target.value)}
                                        placeholder="Ej: A0000-001"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSealNumber(buildRecommendedSealNumber())}
                                        className="shrink-0 rounded-lg border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Sugerir
                                    </button>
                                </div>
                            </Field>

                            <Field label="Fecha estimada de despacho *" icon={CalendarDaysIcon}>
                                <DateTimePickerField
                                    value={estimatedDispatchDate}
                                    onChange={setEstimatedDispatchDate}
                                    showNowButton={false}
                                    compactTime
                                    equalizeDateHeight
                                />
                            </Field>

                            <div className="md:col-span-2">
                                <Field label="Paquetes" icon={ArchiveBoxIcon}>
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
                                </Field>
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

                            <Field label="Integración (opcional)" icon={LinkIcon}>
                                <input
                                    value={integrationId}
                                    onChange={(e) => setIntegrationId(e.target.value)}
                                    placeholder="Ej: E001300"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </Field>

                            <Field label="Número de vuelo (opcional)" icon={PaperAirplaneIcon}>
                                <input
                                    value={flightNumber}
                                    onChange={(e) => setFlightNumber(e.target.value)}
                                    placeholder="Ej: A100"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </Field>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Resumen previo</p>
                            <div className="space-y-2 text-sm">
                                <SummaryRow label="Tipo" value={shippingContainerTypeOptions.find((o) => o.id === shippingContainerTypeId)?.label || "-"} />
                                <SummaryRow label="Sello" value={sealNumber || "-"} />
                                <SummaryRow label="Despacho" value={estimatedDispatchDate || "-"} />
                                <SummaryRow label="Compañía" value={companyOptions.find((o) => o.id === companyId)?.label || "-"} />
                                <SummaryRow label="Paquetes" value={packageIds.length ? String(packageIds.length) : "-"} />
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </div>
    );
}

function Field({
    label,
    icon: Icon,
    children,
}: {
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                {label}
            </label>
            {children}
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-b-0 last:pb-0">
            <span className="text-slate-600">{label}</span>
            <span className="truncate font-medium text-slate-900">{value}</span>
        </div>
    );
}
