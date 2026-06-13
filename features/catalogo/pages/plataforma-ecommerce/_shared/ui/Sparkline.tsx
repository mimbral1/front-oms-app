// features/catalogo/pages/plataforma-ecommerce/_shared/ui/Sparkline.tsx
//
// Sparkline minimalista (SVG inline, sin libs). Sin design system implications:
// se usa para gráficos sutiles dentro de MetricCard u otras visualizaciones.

export interface SparklineProps {
    /** Serie de valores (al menos 2 para dibujar línea). */
    data: number[];
    /** Color del trazo. Default blue-600. */
    color?: string;
    width?: number;
    height?: number;
    fillOpacity?: number;
    className?: string;
}

export function Sparkline({
    data,
    color = "#2563eb",
    width = 220,
    height = 50,
    fillOpacity = 0.08,
    className,
}: SparklineProps) {
    if (!Array.isArray(data) || data.length < 2) {
        return (
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className={["w-full h-12", className].filter(Boolean).join(" ")}
                aria-hidden="true"
            />
        );
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const norm = (i: number): number =>
        height - ((data[i] - min) / range) * (height - 6) - 3;

    const stepX = data.length === 1 ? 0 : width / (data.length - 1);

    const linePath = data
        .map((_, i) =>
            `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(2)},${norm(i).toFixed(2)}`,
        )
        .join(" ");

    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={["w-full h-12", className].filter(Boolean).join(" ")}
            aria-hidden="true"
        >
            <path d={areaPath} fill={color} opacity={fillOpacity} />
            <path d={linePath} stroke={color} strokeWidth="1.5" fill="none" />
        </svg>
    );
}
