// EstadisticasPedidosView.tsx
"use client";

import { useMemo } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { PageHeader } from "@/components/layout/page-header";
import { usePedidosStore } from "@/features/pedidos/stores/lista-pedidos";
import { useFetchPedidos } from "@/features/pedidos/hooks/useFetchPedidos";
import { clp } from "@/lib/format/money";
import { exportToCsv } from "@/components/presets/export/export";

/** Configurable: mapea IDs de estado a cada grupo para los contadores */
const STATUS_GROUPS: Record<string, number[]> = {
    inPreparation: [], // ej: [2,3,4,5]
    inDelivery: [], // ej: [6,7]
    finished: [], // ej: [8,9,10]
};

type AnyPedido = Record<string, any>;

/* ---------- Filtros del header (UI) ---------- */
function getFiltersUI(filters: any) {
    return [
        {
            id: "fechaRango",
            label: "Período",
            type: "date-range" as const,
            value: (filters as any).fechaDesde && (filters as any).fechaHasta
                ? JSON.stringify({ start: (filters as any).fechaDesde, end: (filters as any).fechaHasta })
                : "",
        },
        {
            id: "inventario",
            label: "Inventario",
            type: "select" as const,
            value: (filters as any).inventario ?? "",
            options: [
                { label: "Todos", value: "" },
                { label: "Inventario A", value: "A" },
                { label: "Inventario B", value: "B" },
            ],
        },
        {
            id: "location",
            label: "Ubicación",
            type: "select" as const,
            value: (filters as any).location ?? "",
            options: [
                { label: "Todas", value: "" },
                { label: "Sucursal 1", value: "1" },
                { label: "Sucursal 2", value: "2" },
            ],
        },
        {
            id: "transportista",
            label: "Transportista",
            type: "select" as const,
            value: (filters as any).transportista ?? "",
            options: [
                { label: "Todos", value: "" },
                { label: "Transp. A", value: "A" },
                { label: "Transp. B", value: "B" },
            ],
        },
    ];
}

/* ---------- Helpers numéricos ---------- */
function safeAvg(arr: number[]) {
    const vals = arr.filter((n) => Number.isFinite(n));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function sum(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0);
}

export default function EstadisticasPedidosView() {
    const { refetch } = useFetchPedidos({ page: 1, pageSize: 10 });
    const { pedidos, filters, setFilters } = usePedidosStore();

    /* --- Mapper para evitar errores de tipos al setear filtros no existentes en el store --- */
    const hasKey = <T extends object>(obj: T, key: PropertyKey): key is keyof T =>
        Object.prototype.hasOwnProperty.call(obj, key);

    const setFilterSmart = (uiId: string, value: any) => {
        // Manejar el rango de fecha especialmente
        if (uiId === "fechaRango") {
            if (value) {
                try {
                    const range = JSON.parse(value);
                    setFilters({ fechaDesde: range.start ?? "", fechaHasta: range.end ?? "", dateFrom: range.start ?? "", dateTo: range.end ?? "" } as any);
                } catch { /* ignore */ }
            } else {
                setFilters({ fechaDesde: "", fechaHasta: "", dateFrom: "", dateTo: "" } as any);
            }
            return;
        }

        // Candidatos en orden de preferencia para cada filtro de la UI
        const CANDIDATES: Record<string, string[]> = {
            inventario: ["inventario", "inventoryId", "inventory"],
            location: ["location", "locationId", "storeId"],
            transportista: ["transportista", "carrierId", "transportistaId", "carrier"],
        };

        // Si coincide 1:1 con una clave del store, usarla directo
        if (hasKey(filters, uiId)) {
            setFilters({ [uiId]: value } as Partial<typeof filters>);
            return;
        }

        // Buscar una clave real disponible en el store según los candidatos
        const candidates = CANDIDATES[uiId] ?? [];
        const target = candidates.find((k) => hasKey(filters, k));

        if (!target) {
            console.warn(`[EstadisticasPedidos] Filtro UI "${uiId}" no mapeado al store`, { available: Object.keys(filters) });
            return;
        }

        // `target` está verificado como clave válida del store
        setFilters({ [target]: value } as Partial<typeof filters>);
    };


    const dataFilters = useMemo(() => getFiltersUI(filters), [filters]);
    const handleFilterChange = (id: string, value: string) => setFilterSmart(id, value);

    /* ---------- KPIs base en función de la respuesta actual ---------- */
    const totalPedidos = pedidos.length;
    const montos = useMemo(() => pedidos.map((p: AnyPedido) => Number(p.doctotalsy ?? 0)), [pedidos]);
    const items = useMemo(() => pedidos.map((p: AnyPedido) => Number(p.itemsAmount ?? 0)), [pedidos]);
    const productos = useMemo(
        () => pedidos.map((p: AnyPedido) => Number((p as any).productsAmount ?? p.itemsAmount ?? 0)),
        [pedidos]
    );

    const totalVentas = sum(montos);
    const ticketProm = totalPedidos ? totalVentas / totalPedidos : 0;
    const itemsProm = safeAvg(items);
    const productosProm = safeAvg(productos);

    // Pedidos por estado (ajusta STATUS_GROUPS con IDs reales)
    const inPreparation = pedidos.filter((p: AnyPedido) => STATUS_GROUPS.inPreparation.includes(Number(p.orderStatusID))).length;
    const inDelivery = pedidos.filter((p: AnyPedido) => STATUS_GROUPS.inDelivery.includes(Number(p.orderStatusID))).length;
    const finished = pedidos.filter((p: AnyPedido) => STATUS_GROUPS.finished.includes(Number(p.orderStatusID))).length;

    // Placeholders para métricas avanzadas (cuando se exponga en la API/derivable)
    const pedidosPerfectos: number | null = null;
    const cancelacionPct: number | null = null;
    const foundRatePct: number | null = null;
    const fillRatePct: number | null = null;

    const clearAllFilters = () => {
        const reset = Object.fromEntries(
            Object.entries(filters).map(([k, v]) => [k, typeof v === "boolean" ? false : ""])
        ) as Partial<typeof filters>;
        setFilters(reset);
    };

    const hasActiveFilters = Object.values(filters).some(v => typeof v === "boolean" ? v : v !== "");

    const headerActions = [
        {
            label: "Actualizar",
            variant: "secondary" as const,
            onClick: () => refetch(),
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary" as const,
            onClick: () => {
                const headers = ["orderID", "cardname", "doctotalsy", "itemsAmount", "orderStatusID", "createdate"];
                const rows = pedidos.map((p: AnyPedido) => [
                    p.orderID,
                    p.cardname,
                    p.doctotalsy,
                    p.itemsAmount,
                    p.orderStatusID,
                    p.createdate,
                ]);
                exportToCsv("estadisticas-pedidos.csv", [headers, ...rows]);
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title="Pedidos"
                action={headerActions}
                filters={dataFilters}
                onFilterChange={handleFilterChange}
                filterTitle
                filtersRight={
                    <ClearFiltersButton onClick={clearAllFilters} disabled={!hasActiveFilters} />
                }
            />

            <div className="flex-1 p-6">
                {/* ===== Fila 1: KPIs (7) ===== */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {/* Ticket promedio */}
                    <div className="col-span-1">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm text-gray-500">Ticket promedio</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {clp.format(ticketProm || 0)}
                            </div>
                        </div>
                    </div>

                    {/* Átems promedio */}
                    <div className="col-span-1">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm text-gray-500">Átems promedio</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {itemsProm !== null ? itemsProm.toFixed(1) : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Productos promedio */}
                    <div className="col-span-1">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm text-gray-500">Productos promedio</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {productosProm !== null ? productosProm.toFixed(1) : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Pedidos perfectos */}
                    <div className="col-span-1">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm text-gray-500">Pedidos perfectos</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {pedidosPerfectos !== null ? `${(pedidosPerfectos * 100).toFixed(2)}%` : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Cancelación */}
                    <div className="col-span-1">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm text-gray-500">Cancelación</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {cancelacionPct !== null ? `${(cancelacionPct * 100).toFixed(2)}%` : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Found-rate */}
                    <div className="col-span-1">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm text-gray-500">Found-rate</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {foundRatePct !== null ? `${(foundRatePct * 100).toFixed(2)}%` : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Fill-rate */}
                    <div className="col-span-1">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm text-gray-500">Fill-rate</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                                {fillRatePct !== null ? `${(fillRatePct * 100).toFixed(2)}%` : "—"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== Fila 2: 4 módulos ===== */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Pedidos por status */}
                    <div className="col-span-1 rounded-lg bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-gray-700">PEDIDOS POR ESTADO</div>
                        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                            <div>
                                <div className="text-xs text-gray-500">Total</div>
                                <div className="mt-1 text-lg font-semibold">{totalPedidos}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">En preparación</div>
                                <div className="mt-1 text-lg font-semibold">{inPreparation}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">En despacho</div>
                                <div className="mt-1 text-lg font-semibold">{inDelivery}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Finalizados</div>
                                <div className="mt-1 text-lg font-semibold">{finished}</div>
                            </div>
                        </div>
                    </div>

                    {/* Pedidos por día (placeholder de gráfica) */}
                    <div className="col-span-1 rounded-lg bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-gray-700">PEDIDOS POR DÁA</div>
                        <div className="mt-4 flex h-56 w-full items-center justify-center rounded bg-gray-50 text-gray-400">
                            Gráfico de barras aquí
                        </div>
                    </div>

                    {/* Métodos de pago (placeholder) */}
                    <div className="col-span-1 rounded-lg bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-gray-700">MÁ‰TODOS DE PAGO</div>
                        <div className="mt-4 flex h-56 w-full items-center justify-center rounded bg-gray-50 text-gray-400">
                            Gráfico de torta aquí
                        </div>
                    </div>

                    {/* Métodos de entrega (placeholder) */}
                    <div className="col-span-1 rounded-lg bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-gray-700">MÁ‰TODOS DE ENTREGA</div>
                        <div className="mt-4 flex h-56 w-full items-center justify-center rounded bg-gray-50 text-gray-400">
                            Gráfico de torta aquí
                        </div>
                    </div>
                </div>

                {/* ===== Fila 3: Banda inferior (4 tiles) ===== */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {["Picking", "Preparación", "Despacho", "Entrega"].map((k) => (
                        <div key={k} className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm text-gray-500">{k}</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">—</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

}

