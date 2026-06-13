"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircleIcon,
    XCircleIcon,
    CubeTransparentIcon,
    HashtagIcon,
    ScaleIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { ActiveStatusToggle } from "@/components/ui/togle/status-toggle";

type CreateShippingContainerTypePayload = {
    name: string;
    referenceId: string;
    weight: number;
    maxWeight: number;
    minPackageWeight: number;
    maxPackageWeight: number;
    status: "active" | "inactive";
};

export default function TiposContenedorNuevoView() {
    const router = useRouter();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [referenceId, setReferenceId] = useState("");
    const [weight, setWeight] = useState("");
    const [maxWeight, setMaxWeight] = useState("");
    const [minPackageWeight, setMinPackageWeight] = useState("");
    const [maxPackageWeight, setMaxPackageWeight] = useState("");
    const [status, setStatus] = useState<"active" | "inactive">("active");

    const handleCreate = useCallback(async () => {
        const cleanName = name.trim();
        const cleanReferenceId = referenceId.trim();
        const cleanWeight = weight.trim();
        const cleanMaxWeight = maxWeight.trim();
        const cleanMinPackageWeight = minPackageWeight.trim();
        const cleanMaxPackageWeight = maxPackageWeight.trim();

        if (!cleanName || !cleanReferenceId || !cleanWeight || !cleanMaxWeight || !cleanMinPackageWeight || !cleanMaxPackageWeight) {
            setError("Completa los campos obligatorios para crear el tipo de contenedor.");
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

        const payload: CreateShippingContainerTypePayload = {
            name: cleanName,
            referenceId: cleanReferenceId,
            weight: parsedWeight,
            maxWeight: parsedMaxWeight,
            minPackageWeight: parsedMinPackageWeight,
            maxPackageWeight: parsedMaxPackageWeight,
            status,
        };

        setSaving(true);
        setError(null);
        try {
            await fetchWithAuthDelivery("shipping-container-type", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            router.push("/delivery/contenedores-etiquetas/tipos-contenedor");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear tipo de contenedor");
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuthDelivery, maxPackageWeight, maxWeight, minPackageWeight, name, referenceId, router, status, weight]);

    const headerActions: Action[] = [
        {
            label: "Cancelar",
            variant: "secondary",
            icon: <XCircleIcon className="h-5 w-5" />,
            onClick: () => router.push("/delivery/contenedores-etiquetas/tipos-contenedor"),
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
                title="Nuevo tipo de contenedor"
                description="Crear tipo de contenedor en shipping-container-type."
                action={headerActions}
            />

            <div className="flex-1 px-6 pb-6 pt-10">
                {error ? (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
                            <SparklesIcon className="h-5 w-5 text-slate-500" />
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-800">Completa la información</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Nombre *" icon={CubeTransparentIcon}>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Caja estándar"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </Field>

                            <Field label="Referencia *" icon={HashtagIcon}>
                                <input
                                    value={referenceId}
                                    onChange={(e) => setReferenceId(e.target.value)}
                                    placeholder="Ej: CAJA-STD-001"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </Field>

                            <Field label="Peso base *" icon={ScaleIcon}>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="Ej: 500"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </Field>

                            <Field label="Peso máximo contenedor *" icon={ScaleIcon}>
                                <input
                                    type="number"
                                    value={maxWeight}
                                    onChange={(e) => setMaxWeight(e.target.value)}
                                    placeholder="Ej: 20000"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </Field>

                            <Field label="Peso mínimo paquete *" icon={ScaleIcon}>
                                <input
                                    type="number"
                                    value={minPackageWeight}
                                    onChange={(e) => setMinPackageWeight(e.target.value)}
                                    placeholder="Ej: 100"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </Field>

                            <Field label="Peso máximo paquete *" icon={ScaleIcon}>
                                <input
                                    type="number"
                                    value={maxPackageWeight}
                                    onChange={(e) => setMaxPackageWeight(e.target.value)}
                                    placeholder="Ej: 5000"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </Field>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Estado</p>
                            <ActiveStatusToggle
                                active={status === "active"}
                                onActiveChange={(active) => setStatus(active ? "active" : "inactive")}
                                activeLabel="Activo"
                                inactiveLabel="Inactivo"
                                showStateLabel={false}
                            />
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Resumen previo</p>
                            <div className="space-y-2 text-sm">
                                <SummaryRow label="Nombre" value={name || "-"} />
                                <SummaryRow label="Referencia" value={referenceId || "-"} />
                                <SummaryRow label="Peso base" value={weight || "-"} />
                                <SummaryRow label="Máx. contenedor" value={maxWeight || "-"} />
                                <SummaryRow label="Rango paquete" value={`${minPackageWeight || "-"} - ${maxPackageWeight || "-"}`} />
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
