"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClipboardDocumentListIcon,
    ArchiveBoxIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { ActiveStatusToggle } from "@/components/ui/togle/status-toggle";

type ApiShippingContainerTypeDetail = {
    id?: string | null;
    name?: string | null;
    referenceId?: string | null;
    weight?: number | null;
    maxWeight?: number | null;
    minPackageWeight?: number | null;
    maxPackageWeight?: number | null;
    status?: string | null;
    userCreated?: string | { name?: string | null; email?: string | null } | null;
    userModified?: string | { name?: string | null; email?: string | null } | null;
    dateCreated?: string | null;
    dateModified?: string | null;
};

type Summary = {
    id: string;
    name: string;
    referenceId: string;
    weight: number | null;
    maxWeight: number | null;
    minPackageWeight: number | null;
    maxPackageWeight: number | null;
    status: string;
    userCreated: string;
    userModified: string;
    dateCreated: string;
    dateModified: string;
};

type UpdateShippingContainerTypePayload = {
    name: string;
    referenceId: string;
    weight: number;
    maxWeight: number;
    minPackageWeight: number;
    maxPackageWeight: number;
    status: "active" | "inactive";
};

type EditForm = {
    name: string;
    weight: string;
    maxWeight: string;
    minPackageWeight: string;
    maxPackageWeight: string;
    status: "active" | "inactive";
};

const toNumberOrNull = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

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

const toUserLabel = (value: ApiShippingContainerTypeDetail["userCreated"]) => {
    if (!value) return "-";
    if (typeof value === "string") return value;
    return value.name || value.email || "-";
};

export default function TiposContenedorResumenView() {
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [form, setForm] = useState<EditForm>({
        name: "",
        weight: "",
        maxWeight: "",
        minPackageWeight: "",
        maxPackageWeight: "",
        status: "inactive",
    });

    const loadSummary = useCallback(async () => {
        if (!recordId) {
            setError("ID inválido");
            setSummary(null);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await fetchWithAuthDelivery<ApiShippingContainerTypeDetail>(`shipping-container-type/${encodeURIComponent(recordId)}`, {
                method: "GET",
                cache: "no-store",
            });

            const nextSummary: Summary = {
                id: String(response?.id || recordId),
                name: String(response?.name || "Sin nombre"),
                referenceId: String(response?.referenceId || "-"),
                weight: toNumberOrNull(response?.weight),
                maxWeight: toNumberOrNull(response?.maxWeight),
                minPackageWeight: toNumberOrNull(response?.minPackageWeight),
                maxPackageWeight: toNumberOrNull(response?.maxPackageWeight),
                status: String(response?.status || "inactive"),
                userCreated: toUserLabel(response?.userCreated),
                userModified: toUserLabel(response?.userModified),
                dateCreated: formatDate(response?.dateCreated),
                dateModified: formatDate(response?.dateModified),
            };

            setSummary(nextSummary);
            setForm({
                name: nextSummary.name,
                weight: nextSummary.weight != null ? String(nextSummary.weight) : "",
                maxWeight: nextSummary.maxWeight != null ? String(nextSummary.maxWeight) : "",
                minPackageWeight: nextSummary.minPackageWeight != null ? String(nextSummary.minPackageWeight) : "",
                maxPackageWeight: nextSummary.maxPackageWeight != null ? String(nextSummary.maxPackageWeight) : "",
                status: nextSummary.status.toLowerCase() === "active" ? "active" : "inactive",
            });
        } catch (err) {
            setSummary(null);
            setError(err instanceof Error ? err.message : "Error al cargar el resumen");
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuthDelivery, recordId]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    const handleSave = useCallback(async () => {
        if (!recordId) {
            setError("ID inválido");
            return;
        }

        const cleanName = form.name.trim();
        const cleanReferenceId = summary?.referenceId?.trim() || "";
        const cleanWeight = form.weight.trim();
        const cleanMaxWeight = form.maxWeight.trim();
        const cleanMinPackageWeight = form.minPackageWeight.trim();
        const cleanMaxPackageWeight = form.maxPackageWeight.trim();

        if (!cleanName || !cleanReferenceId || !cleanWeight || !cleanMaxWeight || !cleanMinPackageWeight || !cleanMaxPackageWeight) {
            setError("Completa los campos obligatorios para guardar el tipo de contenedor.");
            return;
        }

        const parsedWeight = Number(cleanWeight);
        const parsedMaxWeight = Number(cleanMaxWeight);
        const parsedMinPackageWeight = Number(cleanMinPackageWeight);
        const parsedMaxPackageWeight = Number(cleanMaxPackageWeight);

        if ([parsedWeight, parsedMaxWeight, parsedMinPackageWeight, parsedMaxPackageWeight].some((value) => !Number.isFinite(value))) {
            setError("Los campos de peso deben ser numéricos.");
            return;
        }

        const payload: UpdateShippingContainerTypePayload = {
            name: cleanName,
            referenceId: cleanReferenceId,
            weight: parsedWeight,
            maxWeight: parsedMaxWeight,
            minPackageWeight: parsedMinPackageWeight,
            maxPackageWeight: parsedMaxPackageWeight,
            status: form.status,
        };

        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await fetchWithAuthDelivery(`shipping-container-type/${encodeURIComponent(recordId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            setSuccessMessage("Tipo de contenedor actualizado correctamente.");
            await loadSummary();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar tipo de contenedor");
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuthDelivery, form, loadSummary, recordId, summary]);

    const actions = useMemo<Action[]>(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/contenedores-etiquetas/tipos-contenedor"),
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

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Resumen de tipo de contenedor"
                description={recordId ? `Detalle de ${recordId}` : "Detalle"}
                action={actions}
            />

            <div className="flex-1 px-6 pb-6 pt-4">
                {loading ? <div className="text-sm text-slate-600">Cargando resumen...</div> : null}

                {error ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {successMessage ? (
                    <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {successMessage}
                    </div>
                ) : null}

                {!loading && !error && summary ? (
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="space-y-4 xl:col-span-2">
                            <SummaryCard title="Detalle" icon={ClipboardDocumentListIcon}>
                                <InfoRow
                                    label="Nombre"
                                    value={
                                        <input
                                            value={form.name}
                                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="w-56 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    }
                                />
                                <InfoRow
                                    label="Referencia"
                                    value={<span className="font-medium text-slate-900">{summary.referenceId}</span>}
                                />
                                <InfoRow
                                    label="Estado"
                                    value={
                                        <div className="flex w-56 justify-end">
                                            <ActiveStatusToggle
                                                active={form.status === "active"}
                                                onActiveChange={(active) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        status: active ? "active" : "inactive",
                                                    }))
                                                }
                                                showStateLabel={false}
                                            />
                                        </div>
                                    }
                                />
                            </SummaryCard>

                            <SummaryCard title="Pesos" icon={ArchiveBoxIcon}>
                                <InfoRow
                                    label="Peso base"
                                    value={
                                        <input
                                            type="number"
                                            value={form.weight}
                                            onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                                            className="w-40 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    }
                                />
                                <InfoRow
                                    label="Peso maximo contenedor"
                                    value={
                                        <input
                                            type="number"
                                            value={form.maxWeight}
                                            onChange={(e) => setForm((prev) => ({ ...prev, maxWeight: e.target.value }))}
                                            className="w-40 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    }
                                />
                                <InfoRow
                                    label="Peso minimo paquete"
                                    value={
                                        <input
                                            type="number"
                                            value={form.minPackageWeight}
                                            onChange={(e) => setForm((prev) => ({ ...prev, minPackageWeight: e.target.value }))}
                                            className="w-40 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    }
                                />
                                <InfoRow
                                    label="Peso maximo paquete"
                                    value={
                                        <input
                                            type="number"
                                            value={form.maxPackageWeight}
                                            onChange={(e) => setForm((prev) => ({ ...prev, maxPackageWeight: e.target.value }))}
                                            className="w-40 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    }
                                />
                            </SummaryCard>
                        </div>

                        <div className="space-y-4">
                            <SummaryCard title="Creacion" icon={UserIcon}>
                                <InfoRow label="Usuario creador" value={summary.userCreated} />
                                <InfoRow label="Fecha creacion" value={summary.dateCreated} />
                            </SummaryCard>

                            <SummaryCard title="Modificacion" icon={UserIcon}>
                                <InfoRow label="Usuario modificador" value={summary.userModified} />
                                <InfoRow label="Fecha modificacion" value={summary.dateModified} />
                            </SummaryCard>
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function SummaryCard({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
                <Icon className="h-5 w-5 text-slate-500" />
                <p className="text-2sm font-semibold uppercase tracking-wide text-slate-800">{title}</p>
                <div className="h-px flex-1 bg-slate-300" />
            </div>
            <div className="space-y-1">{children}</div>
        </section>
    );
}

function InfoRow({
    label,
    value,
    breakAll = false,
}: {
    label: string;
    value: React.ReactNode;
    breakAll?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-b-0">
            <span className="text-slate-600">{label}</span>
            <span className={`font-medium text-slate-900 ${breakAll ? "break-all" : ""}`}>{value}</span>
        </div>
    );
}
