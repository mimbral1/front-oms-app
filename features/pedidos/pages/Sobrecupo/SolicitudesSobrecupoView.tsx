"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/ui/button/action-button";

type RequestStatus = "POR_RESOLVER" | "PENDIENTE" | "APROBADA" | "APROBADA_PARCIAL" | "BLOQUEADA" | "EXPIRADA";
type NextAction = "Accion primero" | "Mayor monto" | "Mas reciente";

type RequestCard = {
    id: string;
    preSaleId: string;
    client: string;
    total: number;
    overQuota: number;
    approvedAmount: number;
    status: RequestStatus;
    note: string;
    primaryAction: string;
    secondaryAction: string;
};

const CLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

const STATUS_LABEL: Record<RequestStatus, string> = {
    POR_RESOLVER: "LISTA PARA POS",
    PENDIENTE: "PENDIENTE",
    APROBADA: "APROBADA",
    APROBADA_PARCIAL: "APROBADA PARCIAL",
    BLOQUEADA: "BLOQUEADA",
    EXPIRADA: "EXPIRADA",
};

const STATUS_BADGE_CLASS: Record<RequestStatus, string> = {
    POR_RESOLVER: "text-blue-700 bg-blue-100",
    PENDIENTE: "text-amber-700 bg-amber-100",
    APROBADA: "text-green-700 bg-green-100",
    APROBADA_PARCIAL: "text-violet-700 bg-violet-100",
    BLOQUEADA: "text-red-700 bg-red-100",
    EXPIRADA: "text-slate-700 bg-slate-200",
};

const NOTE_CLASS: Record<RequestStatus, string> = {
    POR_RESOLVER: "bg-blue-50 text-blue-700",
    PENDIENTE: "bg-amber-50 text-amber-700",
    APROBADA: "bg-emerald-50 text-emerald-700",
    APROBADA_PARCIAL: "bg-violet-50 text-violet-700",
    BLOQUEADA: "bg-red-50 text-red-700",
    EXPIRADA: "bg-slate-100 text-slate-700",
};

const PRIMARY_BUTTON_CLASS: Record<RequestStatus, string> = {
    POR_RESOLVER: "bg-[#16a34a] hover:bg-[#15803d] text-white",
    PENDIENTE: "bg-slate-900 hover:bg-slate-800 text-white",
    APROBADA: "bg-[#16a34a] hover:bg-[#15803d] text-white",
    APROBADA_PARCIAL: "bg-[#2563eb] hover:bg-[#1d4ed8] text-white",
    BLOQUEADA: "bg-red-600 hover:bg-red-700 text-white",
    EXPIRADA: "bg-slate-700 hover:bg-slate-800 text-white",
};

const MOCK_CARDS: RequestCard[] = [
    {
        id: "AUTH-2037",
        preSaleId: "PV-91261",
        client: "Maestranza Central",
        total: 4620000,
        overQuota: 1120000,
        approvedAmount: 1120000,
        status: "POR_RESOLVER",
        note: "Lista para caja. El credito ya quedo reservado para esta preventa.",
        primaryAction: "Enviar a POS",
        secondaryAction: "Detalle",
    },
    {
        id: "AUTH-2041",
        preSaleId: "PV-91280",
        client: "Ferreteria Los Robles",
        total: 1850000,
        overQuota: 650000,
        approvedAmount: 650000,
        status: "APROBADA",
        note: "Aprobada. Ya puedes continuar la venta antes de que expire la autorizacion.",
        primaryAction: "Continuar venta en POS",
        secondaryAction: "Detalle",
    },
    {
        id: "AUTH-2039",
        preSaleId: "PV-91275",
        client: "Agricola San Javier",
        total: 2250000,
        overQuota: 750000,
        approvedAmount: 300000,
        status: "APROBADA_PARCIAL",
        note: "Aprobacion parcial. Ajusta productos o cambia la diferencia a otro medio de pago.",
        primaryAction: "Ajustar preventa",
        secondaryAction: "Detalle",
    },
    {
        id: "AUTH-2043",
        preSaleId: "PV-91302",
        client: "Materiales Norte",
        total: 980000,
        overQuota: 430000,
        approvedAmount: 0,
        status: "PENDIENTE",
        note: "En revision de cobranza. Te avisaremos cuando exista decision.",
        primaryAction: "Esperando respuesta",
        secondaryAction: "Detalle",
    },
    {
        id: "AUTH-2044",
        preSaleId: "PV-91304",
        client: "Comercial El Molino",
        total: 1120000,
        overQuota: 540000,
        approvedAmount: 0,
        status: "BLOQUEADA",
        note: "Bloqueada por mora vigente y facturas vencidas fuera de politica.",
        primaryAction: "Solicitar nuevamente",
        secondaryAction: "Detalle",
    },
    {
        id: "AUTH-2045",
        preSaleId: "PV-91308",
        client: "Servicios Los Aromos",
        total: 740000,
        overQuota: 220000,
        approvedAmount: 0,
        status: "EXPIRADA",
        note: "Autorizacion expirada. Debes solicitar nuevamente para continuar la venta.",
        primaryAction: "Solicitar nuevamente",
        secondaryAction: "Detalle",
    },
];

const TABS = [
    { id: "POR_RESOLVER", label: "Por resolver" },
    { id: "PENDIENTE", label: "Pendientes" },
    { id: "APROBADA", label: "Aprobadas" },
    { id: "BLOQUEADA", label: "Bloqueadas" },
    { id: "TODAS", label: "Todas" },
] as const;

export default function SolicitudesSobrecupoView() {
    const [selectedId, setSelectedId] = useState(MOCK_CARDS[0].id);
    const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("POR_RESOLVER");
    const [search, setSearch] = useState("");
    const [nextAction, setNextAction] = useState<NextAction>("Accion primero");

    const filteredCards = useMemo(() => {
        const q = search.trim().toLowerCase();

        let rows = MOCK_CARDS.filter((card) => {
            const matchTab =
                tab === "TODAS"
                    ? true
                    : tab === "POR_RESOLVER"
                        ? ["POR_RESOLVER", "APROBADA", "APROBADA_PARCIAL"].includes(card.status)
                        : tab === "APROBADA"
                            ? ["APROBADA", "APROBADA_PARCIAL"].includes(card.status)
                            : tab === "BLOQUEADA"
                                ? ["BLOQUEADA", "EXPIRADA"].includes(card.status)
                                : card.status === tab;
            const matchQ = q
                ? `${card.id} ${card.preSaleId} ${card.client}`.toLowerCase().includes(q)
                : true;
            return matchTab && matchQ;
        });

        if (nextAction === "Mayor monto") {
            rows = [...rows].sort((a, b) => b.overQuota - a.overQuota);
        }

        if (nextAction === "Mas reciente") {
            rows = [...rows].sort((a, b) => b.id.localeCompare(a.id));
        }

        return rows;
    }, [nextAction, search, tab]);

    useEffect(() => {
        if (!filteredCards.length) return;
        if (!filteredCards.some((item) => item.id === selectedId)) {
            setSelectedId(filteredCards[0].id);
        }
    }, [filteredCards, selectedId]);

    const selected = filteredCards.find((item) => item.id === selectedId) ?? filteredCards[0] ?? MOCK_CARDS[0];

    const metrics = useMemo(() => {
        const actionable = MOCK_CARDS.filter(
            (r) => r.status === "POR_RESOLVER" || r.status === "APROBADA" || r.status === "APROBADA_PARCIAL"
        ).length;

        const pending = MOCK_CARDS.filter((r) => r.status === "PENDIENTE").length;

        const approvedAmount = MOCK_CARDS.reduce((acc, r) => acc + r.approvedAmount, 0);

        const problems = MOCK_CARDS.filter((r) => r.status === "BLOQUEADA" || r.status === "EXPIRADA").length;

        return {
            actionable,
            pending,
            approvedAmount,
            problems,
        };
    }, []);

    const sideNoteClass = {
        POR_RESOLVER: "mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 font-medium",
        PENDIENTE: "mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 font-medium",
        APROBADA: "mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 font-medium",
        APROBADA_PARCIAL: "mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-700 font-medium",
        BLOQUEADA: "mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-medium",
        EXPIRADA: "mt-3 rounded-xl border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700 font-medium",
    } as const;

    return (
        <div className="min-h-screen bg-[#f3f5fb]">
            <PageHeader
                title="Mis solicitudes de sobrecupo"
                description="Prioriza las que tienen accion: continuar venta, ajustar preventa o solicitar nuevamente."
                action={
                    <div className="flex items-center gap-2">
                        <ActionButton variant="secondary" onClick={() => { }}>
                            Actualizar
                        </ActionButton>
                        <ActionButton variant="primary" onClick={() => { }}>
                            Nueva preventa
                        </ActionButton>
                    </div>
                }
            />

            <div className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    <MetricCard title="Accionables ahora" value={String(metrics.actionable)} subtitle="Aprobadas, listas o parciales" />
                    <MetricCard title="Pendientes" value={String(metrics.pending)} subtitle="Esperando cobranza" />
                    <MetricCard title="Monto aprobado" value={CLP.format(metrics.approvedAmount)} subtitle="Disponible para venta" />
                    <MetricCard title="Problemas" value={String(metrics.problems)} subtitle="Rechazadas o expiradas" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
                    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                        <div className="p-3 border-b border-slate-200">
                            <div className="flex flex-wrap gap-2">
                                {TABS.map((item) => {
                                    const isActive = tab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setTab(item.id)}
                                            className={[
                                                "rounded-xl border px-3 py-1.5 text-sm font-medium transition",
                                                isActive
                                                    ? "border-slate-900 bg-slate-900 text-white"
                                                    : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
                                            ].join(" ")}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-2">
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                                    placeholder="Buscar cliente, preventa o solicitud..."
                                />
                                <select
                                    value={nextAction}
                                    onChange={(e) => setNextAction(e.target.value as NextAction)}
                                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                                >
                                    <option value="Accion primero">Accion primero</option>
                                    <option value="Mayor monto">Mayor monto</option>
                                    <option value="Mas reciente">Mas reciente</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-3 space-y-2">
                            {filteredCards.length === 0 ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                    No hay solicitudes para los filtros aplicados.
                                </div>
                            ) : (
                                filteredCards.map((card) => {
                                    const isActive = selected?.id === card.id;
                                    return (
                                        <article
                                            key={card.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedId(card.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") setSelectedId(card.id);
                                            }}
                                            className={[
                                                "relative rounded-xl border p-3 transition",
                                                isActive
                                                    ? "border-blue-300 bg-[#f4f8ff] shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
                                                    : "border-slate-200 bg-white hover:bg-slate-50",
                                            ].join(" ")}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-[18px] font-semibold text-slate-900">{card.client}</h3>
                                                        {isActive && (
                                                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                                                                Seleccionada
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        {card.preSaleId} - {card.id}
                                                    </p>
                                                </div>
                                                <span className={[
                                                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                                    STATUS_BADGE_CLASS[card.status],
                                                ].join(" ")}>
                                                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                                                    {STATUS_LABEL[card.status]}
                                                </span>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <InfoBox label="Total" value={CLP.format(card.total)} />
                                                <InfoBox label="Sobrecupo" value={CLP.format(card.overQuota)} />
                                                <InfoBox label="Aprobado" value={CLP.format(card.approvedAmount)} />
                                            </div>

                                            <div className={[
                                                "mt-2 rounded-xl px-3 py-2 text-xs font-medium",
                                                NOTE_CLASS[card.status],
                                            ].join(" ")}>
                                                {card.note}
                                            </div>

                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    className={[
                                                        "h-10 rounded-xl text-sm font-semibold transition",
                                                        PRIMARY_BUTTON_CLASS[card.status],
                                                    ].join(" ")}
                                                >
                                                    {card.primaryAction}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="h-10 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    {card.secondaryAction}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-slate-200 bg-white p-4 h-fit xl:sticky xl:top-24">
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
                            <div>
                                <h3 className="text-2xl font-semibold text-slate-900">{selected.id}</h3>
                                <p className="text-xs text-slate-500">{selected.preSaleId} - {selected.client}</p>
                            </div>
                            <span className={[
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                STATUS_BADGE_CLASS[selected.status],
                            ].join(" ")}>
                                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                                {STATUS_LABEL[selected.status]}
                            </span>
                        </div>

                        <div className={sideNoteClass[selected.status]}>
                            {selected.note}
                        </div>

                        <section className="mt-4 border-t border-slate-200 pt-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Siguiente accion</h4>
                            <button className={[
                                "mt-2 h-10 w-full rounded-xl text-sm font-semibold transition",
                                PRIMARY_BUTTON_CLASS[selected.status],
                            ].join(" ")}>
                                {selected.primaryAction}
                            </button>
                            <button className="mt-2 h-10 w-full rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                Ver preventa
                            </button>
                        </section>

                        <section className="mt-4 border-t border-slate-200 pt-3 text-sm">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detalle financiero</h4>
                            <div className="mt-2 space-y-1.5 text-slate-700">
                                <FinanceLine label="Total preventa" value={CLP.format(selected.total)} />
                                <FinanceLine label="Cupo disponible" value={CLP.format(selected.total - selected.overQuota)} />
                                <FinanceLine label="Sobrecupo solicitado" value={CLP.format(selected.overQuota)} />
                                <FinanceLine label="Monto aprobado" value={CLP.format(selected.approvedAmount)} />
                                <FinanceLine label="Vigencia" value="Hoy 18:30" />
                            </div>
                        </section>

                        <section className="mt-4 border-t border-slate-200 pt-3 text-sm">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flujo</h4>
                            <ul className="mt-2 space-y-2.5 text-slate-700">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />
                                    <div>
                                        <p className="font-semibold leading-4">Solicitud creada</p>
                                        <p className="text-xs text-slate-500">Se pidio autorizacion porque el cliente excedia su cupo.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />
                                    <div>
                                        <p className="font-semibold leading-4">Revision cobranza</p>
                                        <p className="text-xs text-slate-500">Cobranza evalua riesgo, deuda y monto.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />
                                    <div>
                                        <p className="font-semibold leading-4">Decision registrada</p>
                                        <p className="text-xs text-slate-500">Aprobacion, aprobacion parcial o rechazo.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />
                                    <div>
                                        <p className="font-semibold leading-4">Venta habilitada</p>
                                        <p className="text-xs text-slate-500">Solo ocurre si el credito queda autorizado y reservado.</p>
                                    </div>
                                </li>
                            </ul>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{title}</p>
            <p className="mt-1 text-[32px] leading-none font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
    );
}

function InfoBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] text-slate-500">{label}</p>
            <p className="text-base font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function FinanceLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span>{label}</span>
            <span className="font-semibold text-slate-900">{value}</span>
        </div>
    );
}
