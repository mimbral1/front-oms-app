"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    CubeTransparentIcon,
    HashtagIcon,
    CalendarDaysIcon,
    BuildingOffice2Icon,
    ArchiveBoxIcon,
    LinkIcon,
    PaperAirplaneIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import DateTimePickerField from "@/components/ui/date-time-picker/DateTimePickerField";
import { MultiSelectSearchInline } from "@/components/ui/collapsible/multiSelectSearchInline";
import Select from "@/components/ui/select";

type ShippingContainerStatus =
    | "pending"
    | "approved"
    | "scheduled"
    | "dispatched"
    | "delivered"
    | "notDelivered"
    | "partiallyDelivered"
    | "error";

type ShippingContainerDetail = {
    id?: string | null;
    refId?: string | null;
    shippingContainerTypeId?: string | null;
    carrierId?: string | null;
    routeId?: string | null;
    status?: ShippingContainerStatus | null;
    dateCreated?: string | null;
    userCreated?: string | null;
    dateModified?: string | null;
    userModified?: string | null;
    sealNumber?: string | null;
    companyId?: string | null;
    estimatedDispatchDate?: string | null;
    integrationComplements?: {
        flightNumber?: string | null;
    } | null;
    integrationId?: string | null;
    packageIds?: string[] | null;
};

type UpdateShippingContainerPayload = {
    status: ShippingContainerStatus;
    sealNumber: string;
    estimatedDispatchDate: string;
    packageIds: string[];
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

type EditForm = {
    status: ShippingContainerStatus;
    shippingContainerTypeId: string;
    sealNumber: string;
    estimatedDispatchDate: string;
    companyId: string;
    packageIds: string[];
    integrationId: string;
    flightNumber: string;
};

type Summary = {
    id: string;
    refId: string;
    carrierId: string;
    routeId: string;
    userCreated: string;
    dateCreated: string;
    userModified: string;
    dateModified: string;
};

const SHIPPING_CONTAINER_STATUS_OPTIONS: Array<{ value: ShippingContainerStatus; label: string }> = [
    { value: "pending", label: "Pendiente" },
    { value: "approved", label: "Aprobado" },
    { value: "scheduled", label: "Programado" },
    { value: "dispatched", label: "Despachado" },
    { value: "delivered", label: "Entregado" },
    { value: "notDelivered", label: "No entregado" },
    { value: "partiallyDelivered", label: "Parcialmente entregado" },
    { value: "error", label: "Error" },
];

const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const toLocalDateTimeInput = (value: string | null | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function ContenedoresResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [summary, setSummary] = useState<Summary | null>(null);
    const [form, setForm] = useState<EditForm>({
        status: "pending",
        shippingContainerTypeId: "",
        sealNumber: "",
        estimatedDispatchDate: "",
        companyId: "",
        packageIds: [],
        integrationId: "",
        flightNumber: "",
    });

    const [shippingContainerTypeOptions, setShippingContainerTypeOptions] = useState<ShippingContainerTypeOption[]>([]);
    const [shippingContainerTypeLoading, setShippingContainerTypeLoading] = useState(false);
    const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
    const [companyLoading, setCompanyLoading] = useState(false);
    const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
    const [packageLoading, setPackageLoading] = useState(false);
    const [packageSearchQuery, setPackageSearchQuery] = useState("");

    const packageLabelById = useMemo(() => {
        const map = new Map<string, string>();
        packageOptions.forEach((option) => map.set(option.id, option.label));
        return map;
    }, [packageOptions]);

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
                    const optionId = String(item?.id || "").trim();
                    if (!optionId) return null;
                    const name = String(item?.name || "").trim();
                    const referenceId = String(item?.referenceId || "").trim();
                    return {
                        id: optionId,
                        label: name || referenceId || optionId,
                    };
                })
                .filter(Boolean) as ShippingContainerTypeOption[];

            setShippingContainerTypeOptions(mapped);
        } catch (loadError) {
            console.error("Error cargando tipos de contenedor:", loadError);
            setShippingContainerTypeOptions([]);
        } finally {
            setShippingContainerTypeLoading(false);
        }
    }, [fetchWithAuthDelivery]);

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
                    const optionId = String(item?.id || "").trim();
                    if (!optionId) return null;
                    const name = String(item?.name || "").trim();
                    const refId = String(item?.refId || "").trim();
                    return {
                        id: optionId,
                        label: name && refId ? `${name} (${refId})` : name || refId || optionId,
                    };
                })
                .filter(Boolean) as CompanyOption[];

            setCompanyOptions(mapped);
        } catch (loadError) {
            console.error("Error cargando compañías:", loadError);
            setCompanyOptions([]);
        } finally {
            setCompanyLoading(false);
        }
    }, [fetchWithAuthDelivery]);

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
                    const optionId = String(item?.id || "").trim();
                    if (!optionId) return null;
                    const name = String(item?.name || "").trim();
                    const refId = String(item?.refId || "").trim();
                    const status = String(item?.status || "").trim();
                    const baseLabel = name && refId ? `${name} (${refId})` : name || refId || optionId;
                    const label = status ? `${baseLabel} - ${status}` : baseLabel;
                    return { id: optionId, label };
                })
                .filter(Boolean) as PackageOption[];

            setPackageOptions(mapped);
        } catch (loadError) {
            console.error("Error cargando paquetes:", loadError);
            setPackageOptions([]);
        } finally {
            setPackageLoading(false);
        }
    }, [fetchWithAuthDelivery]);

    const loadSummary = useCallback(async () => {
        if (!recordId) {
            setError("ID de contenedor inválido");
            setSummary(null);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await fetchWithAuthDelivery<ShippingContainerDetail>(`shipping-container/${encodeURIComponent(recordId)}`, {
                method: "GET",
                cache: "no-store",
            });

            const status = String(response?.status || "pending") as ShippingContainerStatus;
            const normalizedStatus: ShippingContainerStatus =
                status === "approved" ||
                    status === "scheduled" ||
                    status === "dispatched" ||
                    status === "delivered" ||
                    status === "notDelivered" ||
                    status === "partiallyDelivered" ||
                    status === "error"
                    ? status
                    : "pending";

            setSummary({
                id: String(response?.id || recordId),
                refId: String(response?.refId || "-") || "-",
                carrierId: String(response?.carrierId || "-") || "-",
                routeId: String(response?.routeId || "-") || "-",
                userCreated: String(response?.userCreated || "-") || "-",
                dateCreated: formatDate(response?.dateCreated),
                userModified: String(response?.userModified || "-") || "-",
                dateModified: formatDate(response?.dateModified),
            });

            setForm({
                status: normalizedStatus,
                shippingContainerTypeId: String(response?.shippingContainerTypeId || ""),
                sealNumber: String(response?.sealNumber || ""),
                estimatedDispatchDate: toLocalDateTimeInput(response?.estimatedDispatchDate),
                companyId: String(response?.companyId || ""),
                packageIds: Array.isArray(response?.packageIds) ? response.packageIds.map(String) : [],
                integrationId: String(response?.integrationId || ""),
                flightNumber: String(response?.integrationComplements?.flightNumber || ""),
            });
        } catch (loadError) {
            setSummary(null);
            setError(loadError instanceof Error ? loadError.message : "Error al cargar el resumen del contenedor");
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuthDelivery, recordId]);

    useEffect(() => {
        void loadShippingContainerTypes();
        void loadCompanies();
        void loadPackageOptions();
    }, [loadShippingContainerTypes, loadCompanies, loadPackageOptions]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    const handleSave = useCallback(async () => {
        if (!recordId) {
            setError("ID de contenedor inválido");
            return;
        }

        const cleanSealNumber = form.sealNumber.trim();

        if (!cleanSealNumber) {
            setError("Completa los campos obligatorios para guardar el contenedor.");
            return;
        }

        const estimatedDate = form.estimatedDispatchDate ? new Date(form.estimatedDispatchDate) : null;
        if (!estimatedDate || Number.isNaN(estimatedDate.getTime())) {
            setError("Ingresa una fecha estimada de despacho válida.");
            return;
        }

        const payload: UpdateShippingContainerPayload = {
            status: form.status,
            sealNumber: cleanSealNumber,
            estimatedDispatchDate: estimatedDate.toISOString(),
            packageIds: form.packageIds,
        };

        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await fetchWithAuthDelivery(`shipping-container/${encodeURIComponent(recordId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            setSuccessMessage("Contenedor actualizado correctamente.");
            await loadSummary();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Error al guardar contenedor");
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuthDelivery, form, loadSummary, recordId]);

    const actions = useMemo<Action[]>(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/contenedores-etiquetas/contenedores"),
            },
            {
                label: saving ? "Guardando..." : "Guardar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => {
                    void handleSave();
                },
                disabled: saving || loading || !summary,
            },
            {
                label: "Recargar",
                variant: "primary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: () => {
                    void loadSummary();
                },
            },
        ],
        [handleSave, loadSummary, loading, router, saving, summary]
    );

    const shippingContainerTypeLabel = useMemo(() => {
        if (!form.shippingContainerTypeId) return "-";
        const found = shippingContainerTypeOptions.find((option) => option.id === form.shippingContainerTypeId);
        return found?.label || form.shippingContainerTypeId;
    }, [form.shippingContainerTypeId, shippingContainerTypeOptions]);

    const companyLabel = useMemo(() => {
        if (!form.companyId) return "-";
        const found = companyOptions.find((option) => option.id === form.companyId);
        return found?.label || form.companyId;
    }, [companyOptions, form.companyId]);

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Resumen de contenedor"
                description={summary ? `Contenedor ${summary.id}` : "Detalle de contenedor"}
                action={actions}
            />

            <div className="flex-1 px-6 pb-6 pt-6">
                {loading ? <div className="text-sm text-slate-600">Cargando resumen...</div> : null}

                {error ? (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {successMessage ? (
                    <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {successMessage}
                    </div>
                ) : null}

                {!loading && !error ? (
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
                                <CubeTransparentIcon className="h-5 w-5 text-slate-500" />
                                <p className="text-sm font-semibold uppercase tracking-wide text-slate-800">Detalle del contenedor</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Estado" icon={ArchiveBoxIcon}>
                                    <Select
                                        value={form.status}
                                        onValueChange={(value) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                status: value as ShippingContainerStatus,
                                            }))
                                        }
                                        options={SHIPPING_CONTAINER_STATUS_OPTIONS.map((option) => ({
                                            value: option.value,
                                            label: option.label,
                                        }))}
                                        placeholder="Seleccionar estado"
                                    >
                                    </Select>
                                </Field>

                                <Field label="Tipo de contenedor *" icon={CubeTransparentIcon}>
                                    <ReadOnlyValue
                                        value={
                                            shippingContainerTypeLoading
                                                ? "Cargando tipos..."
                                                : shippingContainerTypeLabel
                                        }
                                    />
                                </Field>

                                <Field label="Compañía *" icon={BuildingOffice2Icon}>
                                    <ReadOnlyValue
                                        value={
                                            companyLoading
                                                ? "Cargando compañías..."
                                                : companyLabel
                                        }
                                    />
                                </Field>

                                <Field label="Numero de sello *" icon={HashtagIcon}>
                                    <input
                                        value={form.sealNumber}
                                        onChange={(e) => setForm((prev) => ({ ...prev, sealNumber: e.target.value }))}
                                        placeholder="Ej: A0000-001"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </Field>

                                <Field label="Fecha estimada de despacho *" icon={CalendarDaysIcon}>
                                    <DateTimePickerField
                                        value={form.estimatedDispatchDate}
                                        onChange={(value) => setForm((prev) => ({ ...prev, estimatedDispatchDate: value }))}
                                        showNowButton={false}
                                        compactTime
                                        equalizeDateHeight
                                    />
                                </Field>

                                <Field label="Integración (opcional)" icon={LinkIcon}>
                                    <ReadOnlyValue value={form.integrationId || "-"} />
                                </Field>

                                <Field label="Número de vuelo (opcional)" icon={PaperAirplaneIcon}>
                                    <ReadOnlyValue value={form.flightNumber || "-"} />
                                </Field>

                                <div className="md:col-span-2">
                                    <Field label="Paquetes" icon={ArchiveBoxIcon}>
                                        <MultiSelectSearchInline
                                            id="package-ids"
                                            label="paquetes"
                                            values={form.packageIds}
                                            options={packageOptions.map((option) => ({
                                                label: option.label,
                                                value: option.id,
                                            }))}
                                            searchQuery={packageSearchQuery}
                                            onSearch={setPackageSearchQuery}
                                            onChange={(value) => setForm((prev) => ({ ...prev, packageIds: value }))}
                                            compact
                                            showCompactSummary={false}
                                            showSelectedPanel={false}
                                            compactSelectionStyle="badge"
                                            size="sm"
                                            showSelectionInControl={false}
                                            resetSearchOnFocus
                                        />
                                    </Field>

                                    {form.packageIds.length > 0 ? (
                                        <div className="mt-2 rounded-md border border-blue-100 bg-blue-50/50 p-2">
                                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                                                Seleccionados ({form.packageIds.length})
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {form.packageIds.map((packageId) => (
                                                    <span
                                                        key={packageId}
                                                        className="inline-flex max-w-[220px] items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                                                    >
                                                        <span className="truncate" title={packageLabelById.get(packageId) ?? packageId}>
                                                            {packageLabelById.get(packageId) ?? packageId}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setForm((prev) => ({
                                                                    ...prev,
                                                                    packageIds: prev.packageIds.filter((idValue) => idValue !== packageId),
                                                                }))
                                                            }
                                                            className="rounded-full px-1 leading-none text-blue-700 hover:bg-blue-200"
                                                            aria-label={`Quitar paquete ${packageLabelById.get(packageId) ?? packageId}`}
                                                        >
                                                            x
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <MetaCard title="Resumen" icon={CubeTransparentIcon}>
                                <MetaRow label="ID" value={summary?.id || "-"} />
                                <MetaRow label="refId" value={summary?.refId || "-"} />
                                <MetaRow label="carrierId" value={summary?.carrierId || "-"} />
                                <MetaRow label="routeId" value={summary?.routeId || "-"} />
                            </MetaCard>

                            <AuditInfoCard
                                title="USUARIO CREADOR"
                                user={summary?.userCreated || "-"}
                                date={summary?.dateCreated || "-"}
                            />

                            <AuditInfoCard
                                title="ULTIMA MODIFICACION"
                                user={summary?.userModified || "-"}
                                date={summary?.dateModified || "-"}
                            />
                        </div>
                    </section>
                ) : null}
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
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <div className="pl-8">{children}</div>
            </div>
        </div>
    );
}

function MetaCard({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Icon className="h-5 w-5 text-slate-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">{title}</h2>
            </div>
            <div className="space-y-2">{children}</div>
        </section>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="text-right font-medium text-slate-800">{value}</span>
        </div>
    );
}

function ReadOnlyValue({ value }: { value: string }) {
    return (
        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            {value}
        </div>
    );
}

function AuditInfoCard({ title, user, date }: { title: string; user: string; date: string }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-slate-500" />
                <h3 className="text-xs font-bold tracking-wide text-slate-900">{title}</h3>
                <div className="h-px flex-1 bg-slate-300" />
            </div>
            <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[100px_1fr] gap-3">
                    <span className="font-semibold text-slate-700">Nombre</span>
                    <span className="text-slate-900">{user || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-3">
                    <span className="font-semibold text-slate-700">Fecha</span>
                    <span className="text-slate-900">{date || "-"}</span>
                </div>
            </div>
        </section>
    );
}
