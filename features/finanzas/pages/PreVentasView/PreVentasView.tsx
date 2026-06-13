"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/ui/button/action-button";

type RequestStatus = "PENDIENTE" | "APROBADA" | "APROBADA PARCIAL" | "RECHAZADA" | "EXPIRADA";
type RiskLevel = "Bajo" | "Medio" | "Alto";

type CreditRequest = {
    id: string;
    rut: string;
    status: RequestStatus;
    client: string;
    seller: string;
    totalPreventa: number;
    availableCredit: number;
    exceededAmount: number;
    risk: RiskLevel;
    createdAt: string;
    condition: string;
    score: number;
    moraVigente: boolean;
    facturasVencidas: number;
};

const CLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

const MOCK_REQUESTS: CreditRequest[] = [
    {
        id: "AUTH-1028",
        rut: "76.221.400-8",
        status: "PENDIENTE",
        client: "Ferreteria Los Robles",
        seller: "Maria Soto",
        totalPreventa: 1850000,
        availableCredit: 1200000,
        exceededAmount: 650000,
        risk: "Medio",
        createdAt: "10:42",
        condition: "Credito 30 dias",
        score: 73,
        moraVigente: false,
        facturasVencidas: 1,
    },
    {
        id: "AUTH-1027",
        rut: "77.018.221-2",
        status: "APROBADA",
        client: "Constructora Maule Sur",
        seller: "Pablo Herrera",
        totalPreventa: 3420000,
        availableCredit: 2800000,
        exceededAmount: 620000,
        risk: "Bajo",
        createdAt: "10:18",
        condition: "Credito 45 dias",
        score: 82,
        moraVigente: false,
        facturasVencidas: 0,
    },
    {
        id: "AUTH-1026",
        rut: "78.450.112-1",
        status: "APROBADA PARCIAL",
        client: "Agricola San Javier",
        seller: "Daniela Rojas",
        totalPreventa: 2250000,
        availableCredit: 1500000,
        exceededAmount: 750000,
        risk: "Medio",
        createdAt: "09:56",
        condition: "Credito cosecha",
        score: 68,
        moraVigente: false,
        facturasVencidas: 1,
    },
    {
        id: "AUTH-1025",
        rut: "76.812.909-5",
        status: "RECHAZADA",
        client: "Comercial El Molino",
        seller: "Ivan Munoz",
        totalPreventa: 980000,
        availableCredit: 250000,
        exceededAmount: 730000,
        risk: "Alto",
        createdAt: "09:35",
        condition: "Credito 15 dias",
        score: 51,
        moraVigente: true,
        facturasVencidas: 3,
    },
    {
        id: "AUTH-1024",
        rut: "79.110.432-6",
        status: "PENDIENTE",
        client: "Maestranza Central",
        seller: "Camila Vera",
        totalPreventa: 4620000,
        availableCredit: 3500000,
        exceededAmount: 1120000,
        risk: "Alto",
        createdAt: "09:12",
        condition: "Credito 30 dias",
        score: 47,
        moraVigente: true,
        facturasVencidas: 2,
    },
    {
        id: "AUTH-1023",
        rut: "76.112.331-4",
        status: "EXPIRADA",
        client: "Servicios Los Aromos",
        seller: "Jorge Diaz",
        totalPreventa: 740000,
        availableCredit: 620000,
        exceededAmount: 120000,
        risk: "Bajo",
        createdAt: "Ayer",
        condition: "Contado",
        score: 84,
        moraVigente: false,
        facturasVencidas: 0,
    },
];

function statusClasses(status: RequestStatus): string {
    switch (status) {
        case "PENDIENTE":
            return "bg-amber-100 text-amber-800";
        case "APROBADA":
            return "bg-green-100 text-green-800";
        case "APROBADA PARCIAL":
            return "bg-violet-100 text-violet-700";
        case "RECHAZADA":
            return "bg-red-100 text-red-700";
        case "EXPIRADA":
            return "bg-slate-100 text-slate-600";
        default:
            return "bg-slate-100 text-slate-600";
    }
}

function riskClasses(risk: RiskLevel): string {
    switch (risk) {
        case "Bajo":
            return "text-green-700";
        case "Medio":
            return "text-amber-700";
        case "Alto":
            return "text-red-700";
        default:
            return "text-slate-700";
    }
}

export function PreVentasView() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [sortBy, setSortBy] = useState("riesgo");
    const [selectedId, setSelectedId] = useState(MOCK_REQUESTS[0]?.id ?? "");

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = MOCK_REQUESTS.filter((r) => {
            const matchStatus = statusFilter ? r.status === statusFilter : true;
            const matchQuery = q
                ? `${r.id} ${r.rut} ${r.client} ${r.seller}`.toLowerCase().includes(q)
                : true;
            return matchStatus && matchQuery;
        });

        if (sortBy === "riesgo") {
            const riskWeight: Record<RiskLevel, number> = { Alto: 3, Medio: 2, Bajo: 1 };
            return [...rows].sort((a, b) => riskWeight[b.risk] - riskWeight[a.risk]);
        }

        return rows;
    }, [search, statusFilter, sortBy]);

    const selected = filteredRows.find((r) => r.id === selectedId) ?? filteredRows[0] ?? MOCK_REQUESTS[0];

    const summary = useMemo(() => {
        const pending = MOCK_REQUESTS.filter((r) => r.status === "PENDIENTE").length;
        const approvedToday = MOCK_REQUESTS.filter((r) => r.status === "APROBADA" || r.status === "APROBADA PARCIAL").length;
        const rejected = MOCK_REQUESTS.filter((r) => r.status === "RECHAZADA").length;
        const pendingAmount = MOCK_REQUESTS.filter((r) => r.status === "PENDIENTE").reduce((acc, r) => acc + r.exceededAmount, 0);

        return {
            pending,
            approvedToday,
            rejected,
            pendingAmount,
            sla: "12m",
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#f2f4f8]">
            <PageHeader
                title="Solicitudes de autorizacion de credito"
                description="Revision de preventas que exceden el cupo disponible del cliente."
                action={[
                    { label: "Exportar", variant: "secondary", onClick: () => { } },
                    { label: "Actualizar", variant: "primary", onClick: () => { } },
                ]}
            />

            <div className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Pendientes</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.pending}</p>
                        <p className="text-xs text-slate-400">Requieren decision</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Aprobadas hoy</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.approvedToday}</p>
                        <p className="text-xs text-slate-400">Solicitudes autorizadas</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Rechazadas</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.rejected}</p>
                        <p className="text-xs text-slate-400">Por mora o riesgo</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Monto pendiente</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">{CLP.format(summary.pendingAmount)}</p>
                        <p className="text-xs text-slate-400">Sobrecupo solicitado</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">SLA promedio</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.sla}</p>
                        <p className="text-xs text-slate-400">Tiempo de respuesta</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
                    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="p-3 border-b border-slate-200 space-y-2">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por cliente, RUT, preventa o vendedor..."
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="APROBADA">Aprobada</option>
                                <option value="APROBADA PARCIAL">Aprobada parcial</option>
                                <option value="RECHAZADA">Rechazada</option>
                                <option value="EXPIRADA">Expirada</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="riesgo">Mayor riesgo primero</option>
                                <option value="creada">Mas reciente</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[920px] text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wide">
                                    <tr>
                                        <th className="text-left px-3 py-2">Solicitud</th>
                                        <th className="text-left px-3 py-2">Estado</th>
                                        <th className="text-left px-3 py-2">Cliente</th>
                                        <th className="text-left px-3 py-2">Vendedor</th>
                                        <th className="text-left px-3 py-2">Total preventa</th>
                                        <th className="text-left px-3 py-2">Cupo disponible</th>
                                        <th className="text-left px-3 py-2">Sobrecupo</th>
                                        <th className="text-left px-3 py-2">Riesgo</th>
                                        <th className="text-left px-3 py-2">Creada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map((row) => {
                                        const active = selected?.id === row.id;
                                        return (
                                            <tr
                                                key={row.id}
                                                onClick={() => setSelectedId(row.id)}
                                                className={`border-t border-slate-100 cursor-pointer ${active ? "bg-slate-100" : "hover:bg-slate-50"}`}
                                            >
                                                <td className="px-3 py-2">
                                                    <p className="font-semibold text-slate-900">{row.id}</p>
                                                    <p className="text-xs text-slate-500">{row.rut}</p>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${statusClasses(row.status)}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 font-medium text-slate-900">{row.client}</td>
                                                <td className="px-3 py-2 text-slate-700">{row.seller}</td>
                                                <td className="px-3 py-2 font-semibold">{CLP.format(row.totalPreventa)}</td>
                                                <td className="px-3 py-2">{CLP.format(row.availableCredit)}</td>
                                                <td className="px-3 py-2 font-semibold">{CLP.format(row.exceededAmount)}</td>
                                                <td className={`px-3 py-2 font-semibold ${riskClasses(row.risk)}`}>{row.risk}</td>
                                                <td className="px-3 py-2">{row.createdAt}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <aside className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 h-fit xl:sticky xl:top-24">
                        {selected ? (
                            <>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900">{selected.id}</p>
                                        <p className="text-xs text-slate-500">Preventa {selected.rut} - {selected.client}</p>
                                    </div>
                                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${statusClasses(selected.status)}`}>
                                        {selected.status}
                                    </span>
                                </div>

                                <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Resumen financiero</p>
                                    <div className="flex justify-between"><span>Total preventa</span><span className="font-semibold">{CLP.format(selected.totalPreventa)}</span></div>
                                    <div className="flex justify-between"><span>Cupo disponible</span><span className="font-semibold">{CLP.format(selected.availableCredit)}</span></div>
                                    <div className="flex justify-between"><span>Sobrecupo solicitado</span><span className="font-semibold">{CLP.format(selected.exceededAmount)}</span></div>
                                    <div className="flex justify-between"><span>Condicion</span><span className="font-semibold">{selected.condition}</span></div>
                                </div>

                                <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Evaluacion de riesgo</p>
                                    <div className="flex justify-between"><span>Score interno</span><span className="font-semibold">{selected.score} / 100</span></div>
                                    <div className="flex justify-between"><span>Mora vigente</span><span className="font-semibold">{selected.moraVigente ? "Si" : "No"}</span></div>
                                    <div className="flex justify-between"><span>Facturas vencidas</span><span className="font-semibold">{selected.facturasVencidas}</span></div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-600">
                                        Riesgo medio: cliente con buen historial, pero tiene una factura vencida menor a 15 dias.
                                    </div>
                                </div>

                                <div className="space-y-2 border-t border-slate-200 pt-3">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Decision de cobranza</p>
                                    <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
                                        <input defaultValue={String(selected.exceededAmount)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm" />
                                        <select className="rounded-lg border border-slate-200 px-2 py-2 text-sm">
                                            <option>24 horas</option>
                                            <option>48 horas</option>
                                            <option>72 horas</option>
                                        </select>
                                    </div>
                                    <textarea
                                        rows={3}
                                        placeholder="Comentario interno"
                                        className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <ActionButton variant="success">Aprobar</ActionButton>
                                        <ActionButton variant="primary">Aprobar parcial</ActionButton>
                                    </div>
                                    <ActionButton variant="error" className="w-full">Rechazar solicitud</ActionButton>
                                </div>

                                <div className="space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-600">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Trazabilidad</p>
                                    <p>Preventa creada.</p>
                                    <p>Customer credit detecto excedente sobre cupo disponible.</p>
                                    <p>Pendiente cobranza.</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Sin solicitudes para mostrar.</p>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
