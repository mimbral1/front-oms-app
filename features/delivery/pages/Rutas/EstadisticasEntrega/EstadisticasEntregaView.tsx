"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";

type TotalsRow = { modality: string; deliveries: number; percentage: number };
type StateDistRow = { modality: string; created: number; inProgress: number; finished: number; cancelled: number };
type OperatorRow = { companyName: string; load: number; otd: number };

type DayDist = {
    day: string;
    delivery: number;
    expressDelivery: number;
    pickup: number;
    driveThrough: number;
};

const totals: TotalsRow[] = [
    { modality: "express_delivery", deliveries: 58, percentage: 53.21 },
    { modality: "store_pickup", deliveries: 33, percentage: 30.28 },
    { modality: "delivery", deliveries: 18, percentage: 16.51 },
];

const processing = {
    preparacion: 4.59,
    cicloVida: 34.35,
    entrega: 33.26,
    despacho: 41.53,
    zonaEntrega: 13.15,
};

const stateDist: StateDistRow[] = [
    { modality: "Delivery", created: 100, inProgress: 0, finished: 0, cancelled: 0 },
    { modality: "Express Delivery", created: 44.83, inProgress: 17.24, finished: 36.21, cancelled: 1.72 },
    { modality: "Store Pickup", created: 60.61, inProgress: 30.3, finished: 6.06, cancelled: 3.03 },
    { modality: "Drive Through", created: 0, inProgress: 0, finished: 0, cancelled: 0 },
];

const byDay: DayDist[] = [
    { day: "05/01", delivery: 1, expressDelivery: 0, pickup: 3, driveThrough: 0 },
    { day: "08/01", delivery: 1, expressDelivery: 0, pickup: 1, driveThrough: 0 },
    { day: "12/01", delivery: 5, expressDelivery: 1, pickup: 6, driveThrough: 0 },
    { day: "15/01", delivery: 6, expressDelivery: 2, pickup: 11, driveThrough: 10 },
    { day: "18/01", delivery: 14, expressDelivery: 20, pickup: 24, driveThrough: 19 },
    { day: "21/01", delivery: 3, expressDelivery: 2, pickup: 1, driveThrough: 0 },
    { day: "27/01", delivery: 1, expressDelivery: 1, pickup: 1, driveThrough: 1 },
];

const operators: OperatorRow[] = [
    { companyName: "Private Fleet", load: 100, otd: 14.47 },
];

const otdParts = [
    { label: "Pending", value: 79.8, color: "#2f3135" },
    { label: "OTD Delivered", value: 11, color: "#2f74ff" },
    { label: "Out Of Time", value: 6.2, color: "#000000" },
    { label: "Not Delivered", value: 3, color: "#d9dbe5" },
];

const otif = [
    { modality: "express_delivery", fillRate: 11, foundRate: 0 },
    { modality: "store_pickup", fillRate: 1, foundRate: 0 },
];

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={`rounded-md bg-white p-3 shadow-sm ${className}`}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
            {children}
        </section>
    );
}

function pct(value: number) {
    return `${value.toFixed(2)} %`;
}

export default function EstadisticasEntregaView() {
    const donutBg = useMemo(() => {
        let cursor = 0;
        const segments = otdParts.map((item) => {
            const start = cursor;
            cursor += item.value;
            return `${item.color} ${start}% ${cursor}%`;
        });
        return `conic-gradient(${segments.join(",")})`;
    }, []);

    const maxOtif = Math.max(...otif.map((v) => Math.max(v.fillRate, v.foundRate)), 1);
    const maxDay = Math.max(...byDay.map((v) => Math.max(v.delivery, v.expressDelivery, v.pickup, v.driveThrough)), 1);

    return (
        <div className="min-h-screen bg-[#e8eaf5]">
            <PageHeader title="Estadísticas de entrega" description="Monitor de desempeño y efectividad de entregas" />

            <div className="space-y-4 p-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <Card title="Entregas totales">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="pb-1">Shipping modality</th>
                                    <th className="pb-1 text-right">Deliveries</th>
                                    <th className="pb-1 text-right">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {totals.map((row) => (
                                    <tr key={row.modality} className="border-t border-gray-100">
                                        <td className="py-1">{row.modality}</td>
                                        <td className="py-1 text-right font-semibold">{row.deliveries}</td>
                                        <td className="py-1 text-right font-semibold">{pct(row.percentage)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    <Card title="OTD">
                        <div className="flex items-center gap-6">
                            <div className="relative h-48 w-48">
                                <div className="h-full w-full rounded-full" style={{ background: donutBg }} />
                                <div className="absolute inset-[26px] rounded-full bg-white" />
                            </div>
                            <ul className="space-y-1 text-sm">
                                {otdParts.map((part) => (
                                    <li key={part.label} className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: part.color }} />
                                        <span>{part.label}</span>
                                        <span className="font-semibold">{part.value}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>

                    <Card title="OTIF">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                {otif.map((row) => (
                                    <div key={row.modality}>
                                        <div className="mb-1 text-xs text-gray-600">{row.modality}</div>
                                        <div className="space-y-1">
                                            <div className="h-3 rounded bg-gray-100">
                                                <div className="h-3 rounded bg-[#2f3135]" style={{ width: `${(row.fillRate / maxOtif) * 100}%` }} />
                                            </div>
                                            <div className="h-3 rounded bg-gray-100">
                                                <div className="h-3 rounded bg-[#2f74ff]" style={{ width: `${(row.foundRate / maxOtif) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 border-t border-gray-300 pt-2">
                                <div className="grid grid-cols-3 text-[11px] text-gray-500">
                                    <span className="text-left">0</span>
                                    <span className="text-center">{(maxOtif / 2).toFixed(1)}</span>
                                    <span className="text-right">{maxOtif}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                    <Card title="Tiempo de preparacion" className="lg:col-span-1">
                        <div className="text-4xl font-semibold text-gray-900">{processing.preparacion} hs</div>
                    </Card>
                    <Card title="Ciclo de vida" className="lg:col-span-1">
                        <div className="text-4xl font-semibold text-gray-900">{processing.cicloVida} hs</div>
                    </Card>
                    <Card title="Entrega" className="lg:col-span-1">
                        <div className="text-4xl font-semibold text-gray-900">{processing.entrega} hs</div>
                    </Card>
                    <Card title="Despacho" className="lg:col-span-1">
                        <div className="text-4xl font-semibold text-gray-900">{processing.despacho} hs</div>
                    </Card>
                    <Card title="Zona de entrega" className="lg:col-span-1">
                        <div className="text-4xl font-semibold text-gray-900">{processing.zonaEntrega} hs</div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <Card title="Distribución por estados" className="xl:col-span-1">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="pb-1">Type modality</th>
                                    <th className="pb-1 text-right">Created</th>
                                    <th className="pb-1 text-right">In progress</th>
                                    <th className="pb-1 text-right">Finished</th>
                                    <th className="pb-1 text-right">Cancelled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stateDist.map((row) => (
                                    <tr key={row.modality} className="border-t border-gray-100">
                                        <td className="py-1">{row.modality}</td>
                                        <td className="py-1 text-right">{row.created} %</td>
                                        <td className="py-1 text-right">{row.inProgress} %</td>
                                        <td className="py-1 text-right">{row.finished} %</td>
                                        <td className="py-1 text-right">{row.cancelled} %</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    <Card title="Distribución de pedidos por días" className="xl:col-span-1">
                        <div className="rounded border border-gray-100 p-3">
                            <div className="grid grid-cols-[34px_1fr] gap-2">
                                <div className="flex h-56 flex-col justify-between pb-5 text-[11px] text-gray-500">
                                    <span>{maxDay}</span>
                                    <span>{Math.round(maxDay / 2)}</span>
                                    <span>0</span>
                                </div>
                                <div className="flex h-64 items-end justify-between gap-1 border-l border-gray-300 border-b border-gray-300 pl-2 pr-1">
                                    {byDay.map((d) => (
                                        <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                                            <div className="flex h-52 items-end gap-1">
                                                <div className="w-2 rounded bg-[#3b82f6]" style={{ height: `${(d.delivery / maxDay) * 100}%` }} title={`Delivery: ${d.delivery}`} />
                                                <div className="w-2 rounded bg-[#60a5fa]" style={{ height: `${(d.expressDelivery / maxDay) * 100}%` }} title={`Express: ${d.expressDelivery}`} />
                                                <div className="w-2 rounded bg-[#111827]" style={{ height: `${(d.pickup / maxDay) * 100}%` }} title={`Pickup: ${d.pickup}`} />
                                                <div className="w-2 rounded bg-[#6b7280]" style={{ height: `${(d.driveThrough / maxDay) * 100}%` }} title={`Drive Through: ${d.driveThrough}`} />
                                            </div>
                                            <div className="text-[10px] text-gray-600">{d.day}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Distribución por operador logístico" className="xl:col-span-1">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="pb-1">Company name</th>
                                    <th className="pb-1 text-right">Load</th>
                                    <th className="pb-1 text-right">Otd</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operators.map((row) => (
                                    <tr key={row.companyName} className="border-t border-gray-100">
                                        <td className="py-1 font-semibold">{row.companyName}</td>
                                        <td className="py-1 text-right font-semibold">{row.load} %</td>
                                        <td className="py-1 text-right font-semibold">{row.otd} %</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>
        </div>
    );
}
