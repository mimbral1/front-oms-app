// views\Customers\Clientes\CondicionesPago\CondicionesPagoView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import SaveOutlined from "@mui/icons-material/SaveOutlined";

import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { CheckCircleIcon, ClipboardDocumentListIcon, MapPinIcon, XCircleIcon } from "@heroicons/react/24/outline";

/* Toggle minimal (mismo del proyecto) */
function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? "bg-blue-600" : "bg-gray-300"
                }`}
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-1"
                    }`}
            />
        </button>
    );
}

/** Record (keys en inglés, labels en español) */
export interface PaymentTermsRecord {
    // DETALLE
    payment_terms: string;
    late_interest: string;
    price_list: string;
    discount_total: string;
    credit_limit: string;
    committed_limit: string;
    claim_term: string;
    auto_posting: boolean;

    // OTROS
    card_class: string;
    card_number: string;
    card_status: "Activo" | "Inactivo" | "Suspendido";
    due_date: string; // yyyy-mm-dd
    national_id: string;
    avg_delay: string;
    priority: string;
    default_iban: string;

    blacklist_left: boolean;
    is_new_left: boolean;
    blacklist_right: boolean;
    is_new_right: boolean;

    // META
    creator: { initials: string; name: string; email: string };
    creator_at: string;
    lastmod: { initials: string; name: string; email: string };
    lastmod_at: string;
}

const initialRecord: PaymentTermsRecord = {
    // DETALLE
    payment_terms: "a 30, 60, 90 días",
    late_interest: "Cancino",
    price_list: "Precios ventas distribuidor",
    discount_total: "Windows default",
    credit_limit: "4.000.000",
    committed_limit: "4.000.000",
    claim_term: "Normal",
    auto_posting: false,

    // OTROS
    card_class: "Activo",
    card_number: "************1190",
    card_status: "Activo",
    due_date: "",
    national_id: "",
    avg_delay: "",
    priority: "",
    default_iban: "",

    blacklist_left: true,
    is_new_left: false,
    blacklist_right: true,
    is_new_right: false,

    // META
    creator: { initials: "BB", name: "Bruno Bellini", email: "bruno.bellini@…" },
    creator_at: "09/02/2025 11:11:45",
    lastmod: { initials: "BB", name: "Bruno Bellini", email: "bruno.bellini@…" },
    lastmod_at: "09/02/2025 11:11:45",
};

export default function CondicionesPagoView() {
    const router = useRouter();
    const [record, setRecord] = useState<PaymentTermsRecord>({ ...initialRecord });

    const set =
        <K extends keyof PaymentTermsRecord>(field: K) =>
            (value: PaymentTermsRecord[K]) =>
                setRecord((p) => ({ ...p, [field]: value }));

    /* Header */
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => console.log("Aplicar sin cerrar", record),
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Guardar", record),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/customers/clientes"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Cliente
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Condiciones de pago
                    </div>
                </div>
            ),
            action: headerActions,
            status: {
                text: record.card_status,
                variant: record.card_status === "Activo" ? "success" : "warning",
            },
        } as PageHeaderProps),
        [headerActions, record.card_status]
    );

    /* ─────────────────────────────────────────────────────────────── */

    return (
        <div className="p-6 bg-white">
            <div className="grid grid-cols-12 gap-6">
                {/* Izquierda */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            {/* Condiciones de pago */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Condiciones de pago
                            </label>
                            <div className="col-span-9">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.payment_terms}
                                    options={["a 15 días", "a 30, 60, 90 días", "Contado", "Fin de mes"]}
                                    onChange={(v) => set("payment_terms")(String(v))}
                                />
                            </div>

                            {/* % intereses de demora */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                % intereses de demora
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.late_interest}
                                    onChange={(e) => set("late_interest")(e.target.value)}
                                />
                            </div>

                            {/* Listas de precios */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Listas de precios
                            </label>
                            <div className="col-span-9">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.price_list}
                                    options={[
                                        "Precios ventas distribuidor",
                                        "Lista minorista",
                                        "Mayorista",
                                    ]}
                                    onChange={(v) => set("price_list")(String(v))}
                                />
                            </div>

                            {/* % descuento total */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                % descuento total
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.discount_total}
                                    onChange={(e) => set("discount_total")(e.target.value)}
                                />
                            </div>

                            {/* Límite de Crédito */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Límite de Crédito
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.credit_limit}
                                    onChange={(e) => set("credit_limit")(e.target.value)}
                                />
                            </div>

                            {/* Límite de comprometido */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Límite de comprometido
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.committed_limit}
                                    onChange={(e) => set("committed_limit")(e.target.value)}
                                />
                            </div>

                            {/* Plazo de reclamación */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Plazo de reclamación
                            </label>
                            <div className="col-span-9">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.claim_term}
                                    options={["Normal", "Extendido 30", "Extendido 60"]}
                                    onChange={(v) => set("claim_term")(String(v))}
                                />
                            </div>

                            {/* Contabilización automática (select) */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Contabilización automática
                            </label>
                            <div className="col-span-9">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.auto_posting ? "Sí" : "No"}
                                    options={["Sí", "No"]}
                                    onChange={(v) => set("auto_posting")(String(v) === "Sí")}
                                />
                            </div>

                        </div>
                    </Card>
                </div>

                {/* Derecha */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                    <Card
                        title="OTROS"
                        icon={MapPinIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-12 gap-4">
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Clase de tarjeta de crédito
                            </label>
                            <div className="col-span-9">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.card_class}
                                    options={["Activo", "Inactivo", "Suspendido"]}
                                    onChange={(v) => set("card_class")(String(v))}
                                />
                            </div>

                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Número tarjeta de crédito
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.card_number}
                                    onChange={(e) => set("card_number")(e.target.value)}
                                />
                            </div>

                            {/* Fecha de vencimiento (select Activo / Inactivo) */}
                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Fecha de vencimiento
                            </label>
                            <div className="col-span-9">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.due_date}                 // "Activo" | "Inactivo"
                                    options={["Activo", "Inactivo"]}
                                    onChange={(v) => set("due_date")(String(v))}
                                />
                            </div>

                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Fecha de vencimiento
                            </label>
                            <div className="col-span-9">
                                <input
                                    type="date"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.due_date}
                                    onChange={(e) => set("due_date")(e.target.value)}
                                />
                            </div>

                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Número ID
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.national_id}
                                    onChange={(e) => set("national_id")(e.target.value)}
                                />
                            </div>

                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Demora media
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.avg_delay}
                                    onChange={(e) => set("avg_delay")(e.target.value)}
                                />
                            </div>

                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                Prioridad
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.priority}
                                    onChange={(e) => set("priority")(e.target.value)}
                                />
                            </div>

                            <label className="col-span-3 text-sm text-gray-600 font-bold">
                                IBAN por defecto
                            </label>
                            <div className="col-span-9">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.default_iban}
                                    onChange={(e) => set("default_iban")(e.target.value)}
                                />
                            </div>

                            {/* Bloques de toggles */}
                            <div className="col-span-12 grid grid-cols-12 gap-4 pt-2">
                                <div className="col-span-6 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                    <span className="text-sm text-gray-700">Lista negra</span>
                                    <Toggle checked={record.blacklist_left} onChange={set("blacklist_left")} />
                                </div>
                                <div className="col-span-6 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                    <span className="text-sm text-gray-700">Lista negra</span>
                                    <Toggle checked={record.blacklist_right} onChange={set("blacklist_right")} />
                                </div>

                                <div className="col-span-6 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                    <span className="text-sm text-gray-700">Es nuevo</span>
                                    <Toggle checked={record.is_new_left} onChange={set("is_new_left")} />
                                </div>
                                <div className="col-span-6 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                    <span className="text-sm text-gray-700">Es nuevo</span>
                                    <Toggle checked={record.is_new_right} onChange={set("is_new_right")} />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/*  Usuario creador / Última modificación */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                                        USUARIO CREADOR
                                    </span>
                                    <div className="h-px flex-1 bg-gray-300" />
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                                        {record.creator.initials}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{record.creator.name}</span>
                                        <span className="text-xs text-gray-500">{record.creator.email}</span>
                                    </div>
                                    <div className="ml-auto text-xs text-gray-500">{record.creator_at}</div>
                                </div>
                            </div>

                            <div className="col-span-12">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                                        ÚLTIMA MODIFICACIÓN
                                    </span>
                                    <div className="h-px flex-1 bg-gray-300" />
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                                        {record.lastmod.initials}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{record.lastmod.name}</span>
                                        <span className="text-xs text-gray-500">{record.lastmod.email}</span>
                                    </div>
                                    <div className="ml-auto text-xs text-gray-500">{record.lastmod_at}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* /Derecha */}
            </div>
        </div>
    );
}
