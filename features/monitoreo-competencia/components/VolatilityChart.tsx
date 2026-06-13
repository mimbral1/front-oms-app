// views\CatalogoView\MonitoreoCompetencia\components\VolatilityChart.tsx

"use client";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";

type ChartPoint = {
    mes: string;
    mimbral: number;
    mercadoLibre: number;
    falabella: number;
    sodimac: number;
    easy: number;
};

interface Props {
    data: ChartPoint[];
}

export default function VolatilityChart({ data }: Props) {
    return (
        <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Line
                        type="monotone"
                        dataKey="mimbral"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        name="Mimbral"
                    />
                    <Line
                        type="monotone"
                        dataKey="mercadoLibre"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        name="Mercado Libre"
                    />
                    <Line
                        type="monotone"
                        dataKey="falabella"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                        name="Falabella"
                    />
                    <Line
                        type="monotone"
                        dataKey="sodimac"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Sodimac"
                    />
                    <Line
                        type="monotone"
                        dataKey="easy"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={false}
                        name="Easy"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
