// views\Delivery\Tms\SimulacionRuta\components\SimularRutasPanel.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SimRouteMap, { RouteLayer, Stop } from "./SimRouteMap";
import { getOptimizedDirections } from "@/features/delivery/services/getOptimizedDirections";
import { buildTalcaSimulationRoutes } from "@/features/delivery/components/rutas/listadorutas/talca.mock";
import { Check, ChevronDown, ChevronRight, X, ChevronDown as Caret } from "lucide-react";
import { ActionButton } from "@/components/ui/button/action-button";

/* ============================== Tipos ============================== */
type SimRoute = {
    id: string;
    nombre: string;
    color: string;
    expanded?: boolean;
    selected?: boolean;
    stops: Stop[];
};

function withAlpha(hex: string, alpha = 0.12) {
    const h = hex.replace("#", "");
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ========================= Conductores (Select) ========================= */
const DRIVERS = [
    "Manuel Vilche",
    "Ariel Mikowski",
    "Leonardo Gambino",
    "Christian de Diego",
];

function AssignDriversModal({
    open,
    onClose,
    routes,
}: {
    open: boolean;
    onClose: () => void;
    routes: { id: string; nombre: string; color: string }[];
}) {
    const [drivers, setDrivers] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) return;
        setDrivers({});
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-semibold">Asignar conductores</div>
                    <button
                        onClick={onClose}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="space-y-3">
                    {routes.map((r, idx) => (
                        <div
                            key={`${r.id}-driverrow-${idx}`}
                            className="rounded-lg border border-gray-200 px-3 py-2"
                            style={{ borderLeft: `4px solid ${r.color}` }}
                        >
                            {/* 2 columnas en md+, 1 columna en mobile */}
                            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                {/* Columna izquierda: título */}
                                <div className="md:col-span-5">
                                    <div className="text-sm font-semibold text-gray-800 truncate">
                                        {r.nombre}
                                    </div>
                                </div>

                                {/* Columna derecha: select (full width) */}
                                <div className="md:col-span-7">
                                    <div className="relative">
                                        <select
                                            value={drivers[r.id] ?? ""}
                                            onChange={(e) =>
                                                setDrivers((prev) => ({ ...prev, [r.id]: e.target.value }))
                                            }
                                            className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="" disabled>
                                                Seleccionar conductor…
                                            </option>
                                            {DRIVERS.map((d) => (
                                                <option key={`${r.id}-opt-${d}`} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Limpiar */}
                                        <button
                                            type="button"
                                            title="Limpiar"
                                            onClick={() =>
                                                setDrivers((prev) => {
                                                    const cp = { ...prev };
                                                    delete cp[r.id];
                                                    return cp;
                                                })
                                            }
                                            className="absolute right-7 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
                                        >
                                            <X size={14} />
                                        </button>

                                        {/* Caret visual */}
                                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                                            <Caret size={16} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                <div className="mt-5 flex justify-end gap-3">
                    <ActionButton
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        variant="primary"
                        onClick={onClose}
                    >
                        Confirmar ruta
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}

/* =========================== Componente Panel =========================== */
export default function SimularRutasPanel({ request }: { request?: any }) {
    // 1) rutas desde mock (talca) — ninguna seleccionada al inicio
    const [routes, setRoutes] = useState<SimRoute[]>(() =>
        buildTalcaSimulationRoutes().map((r: any, i: number) => ({
            id: r.id ?? `r-${i}`,
            nombre: r.nombre ?? r.title ?? `Ruta ${i + 1}`,
            color: r.color,
            expanded: i === 0,
            selected: false, // desmarcado al inicio
            stops: r.stops,
        }))
    );

    // 2) cache estable -> cero parpadeo
    const dirCacheRef = useRef<Map<string, google.maps.DirectionsResult | undefined>>(
        new Map()
    );

    // 3) Precargar la PRIMERA ruta y recién ahí seleccionarla => aparece “al tiro”
    useEffect(() => {
        const run = async () => {
            if (!routes.length) return;
            const first = routes[0];
            if (!dirCacheRef.current.get(first.id)) {
                const d = await getOptimizedDirections(first.stops);
                dirCacheRef.current.set(first.id, d);
            }
            setRoutes((prev) =>
                prev.map((r, i) => (i === 0 ? { ...r, selected: true } : r))
            );
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 4) si cambian stops de una seleccionada -> recalc
    const prevStopsKeyRef = useRef<string>("");
    useEffect(() => {
        const key = routes
            .filter((r) => r.selected)
            .map((r) => `${r.id}:${r.stops.map((s) => s.id).join(",")}`)
            .join("|");

        if (key === prevStopsKeyRef.current) return;
        prevStopsKeyRef.current = key;

        const run = async () => {
            for (const r of routes) {
                if (!r.selected) continue;
                const d = await getOptimizedDirections(r.stops);
                dirCacheRef.current.set(r.id, d);
                setRefresh((v) => v + 1);
            }
        };
        if (key) run();
    }, [routes]);

    // 5) force render liviano cuando cache cambia
    const [, setRefresh] = useState(0);

    // 6) capas activas para el mapa
    const layers: RouteLayer[] = useMemo(
        () =>
            routes
                .filter((r) => r.selected)
                .map((r, idx) => ({
                    id: `${r.id}-layer-${idx}`, //  asegura unicidad
                    color: r.color,
                    directions: dirCacheRef.current.get(r.id),
                    stops: r.stops,
                })),
        [routes]
    );

    // 7) Totales
    const totals = useMemo(() => {
        const totalRutas = routes.length;
        const totalEntregas = routes.reduce(
            (acc, r) => acc + Math.max(0, r.stops.length - 1),
            0
        );
        return { totalRutas, totalEntregas, sinRuta: 0 };
    }, [routes]);

    // 8) helpers UI
    const toggleExpanded = (id: string) =>
        setRoutes((prev) =>
            prev.map((r) => ({ ...r, expanded: r.id === id ? !r.expanded : r.expanded }))
        );

    //  seleccionar “al tiro”: pre-calcula y recién selecciona
    const toggleRouteSelected = async (id: string) => {
        const r = routes.find((x) => x.id === id);
        if (!r) return;
        const willSelect = !r.selected;

        if (willSelect && !dirCacheRef.current.get(r.id)) {
            const d = await getOptimizedDirections(r.stops);
            dirCacheRef.current.set(r.id, d);
            setRefresh((v) => v + 1);
        }

        setRoutes((prev) =>
            prev.map((x) => (x.id === id ? { ...x, selected: willSelect } : x))
        );
    };

    // Modal de conductores
    const [assignOpen, setAssignOpen] = useState(false);

    return (
        <div className="w-full">
            {/* Totales */}
            <div className="mb-2 text-sm font-semibold text-gray-700">
                TOTALES: <span className="font-bold">{totals.totalRutas} Rutas</span> |{" "}
                <span className="font-bold">{totals.totalEntregas} Entregas</span> |{" "}
                <span className="font-bold">{totals.sinRuta}</span> Entregas sin ruta
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* IZQUIERDA */}
                <div className="lg:col-span-5">
                    <div className="space-y-3">
                        {routes.map((r, rIndex) => {
                            const d = dirCacheRef.current.get(r.id);
                            const legs = d?.routes?.[0]?.legs ?? [];
                            return (
                                <div
                                    key={`${r.id}-card-${rIndex}`} //  clave única robusta
                                    className="rounded-lg border border-gray-200 bg-white"
                                >
                                    <div
                                        className="flex items-center justify-between rounded-t-lg px-3 py-2"
                                        style={{ borderLeft: `4px solid ${r.color}` }}
                                    >
                                        <button
                                            onClick={() => toggleExpanded(r.id)}
                                            className="flex items-center gap-2"
                                        >
                                            {r.expanded ? (
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            )}
                                            <span className="text-sm font-semibold text-gray-800">
                                                {r.nombre}
                                            </span>
                                        </button>

                                        <span
                                            className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-[4px] border"
                                            style={{
                                                background: r.selected ? r.color : "white",
                                                borderColor: r.selected ? r.color : "#E5E7EB",
                                                color: "white",
                                            }}
                                            title="Mostrar en el mapa"
                                            onClick={() => void toggleRouteSelected(r.id)}
                                        >
                                            {r.selected && <Check className="h-3 w-3" />}
                                        </span>
                                    </div>

                                    {r.expanded && (
                                        <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                                            {/* Origen */}
                                            <div className="mb-2 text-[12px] text-gray-700">
                                                <span className="mr-2 rounded-full border-2 border-white bg-amber-500 px-2 py-0.5 text-white shadow">
                                                    Origen
                                                </span>
                                                {r.stops[0]?.title ?? "Almacén"}
                                            </div>

                                            {/* Entregas (título + distancia/tiempo del tramo si hay directions) */}
                                            <div className="space-y-1">
                                                {(legs.length
                                                    ? legs.map((_, i) => r.stops[i + 1]) // ordenadas según ruta
                                                    : r.stops.slice(1)
                                                ).map((s, i) => {
                                                    const leg = legs[i];
                                                    const dist = leg?.distance?.text ?? "—";
                                                    const time = leg?.duration?.text ?? "—";
                                                    return (
                                                        <div
                                                            key={`${r.id}-stop-${i}-${s?.id ?? "x"}`} //  clave única
                                                            className="flex items-center justify-between rounded-md px-2 py-1"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold"
                                                                    style={{
                                                                        background: withAlpha(r.color, 0.12),
                                                                        color: r.color,
                                                                        border: `1px solid ${r.color}`,
                                                                    }}
                                                                >
                                                                    {i + 1}
                                                                </span>
                                                                <span className="text-[12px] leading-5 text-gray-700">
                                                                    {s?.title ?? "Entrega"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                                                                    ↔ {dist}
                                                                </span>
                                                                <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                                                                    ⍱ {time}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* CTA inferior -> abre modal conductores */}
                    <div className="mt-4 flex items-center justify-center">
                        <ActionButton
                            variant="primary"
                            onClick={() => setAssignOpen(true)}
                        >
                            Crear ruta
                        </ActionButton>
                    </div>
                </div>

                {/* DERECHA: un solo mapa con las rutas seleccionadas */}
                <div className="lg:col-span-7">
                    <div className="rounded-md border border-gray-200 bg-white p-2">
                        <SimRouteMap layers={layers} />
                    </div>
                </div>
            </div>

            {/* Modal conductores */}
            <AssignDriversModal
                open={assignOpen}
                onClose={() => setAssignOpen(false)}
                routes={routes.map((r) => ({ id: r.id, nombre: r.nombre, color: r.color }))}
            />
        </div>
    );
}
