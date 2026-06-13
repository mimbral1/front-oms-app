"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ChevronRight, ClipboardList, Home, PackageSearch, QrCodeIcon } from "lucide-react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { StatusBadge } from "@/components/ui/badge/status";
import { resolveStatus } from "@/components/ui/badge/status-registry";
import { formatCurrency } from "@/lib/format/money";

const DEFAULT_PRODUCT_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
      <rect width='100%' height='100%' fill='#f1f5f9'/>
      <g fill='#94a3b8'>
        <rect x='10' y='38' width='44' height='8' rx='2'/>
        <circle cx='20' cy='24' r='8'/>
      </g>
    </svg>`,
    );

export type PedidoRoundResult = {
    sessionItemId: string;
    nombreProducto: string;
    imagen?: string;
    sku?: string;
    ean?: string;
    cantidad?: number;
    precioUnitario?: number;
    totalItem?: number;
    cantidadSolicitada: number;
    cantidadPickeada: number;
    faltante: number;
    estado: string;
};

export type PedidoRound = {
    id: string;
    sessionId: string;
    shipmentCode: string;
    entregaDate?: string | null;
    origen?: string | null;
    destino?: string | null;
    rangoEntrega?: string | null;
    pedidosLabel?: string | null;
    total?: number | null;
    subtotal?: number | null;
    shippingTotal?: number | null;
    pickingProducts?: number | null;
    pickingItems?: number | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    deliveryType?: string | null;
    deliveryCompany?: string | null;
    deliveryAddress?: string | null;
    date: string;
    assigned: string | null;
    status: string;
    warehouseName?: string | null;
    resultados: PedidoRoundResult[];
};

interface RoundsExpandableListProps {
    rounds: PedidoRound[];
    emptyText?: string;
    mode?: "order-rounds" | "session-summary" | "shipments";
}

export function RoundsExpandableList({ rounds, emptyText = "No hay rondas.", mode = "order-rounds" }: RoundsExpandableListProps) {
    const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
    const toggleOpen = (id: string) => setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));

    const getRoundKey = (r: PedidoRound, index: number) =>
        `${r.sessionId}::${r.shipmentCode || ""}::${r.id || ""}::${index}`;

    if (!rounds?.length) {
        return <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">{emptyText}</div>;
    }

    return (
        <div className="space-y-3">
            {mode === "shipments" && (
                <div className="grid grid-cols-[minmax(170px,1fr)_160px_120px_minmax(260px,1.2fr)_180px_140px_120px] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <div>Envio</div>
                    <div>Entrega</div>
                    <div>Origen</div>
                    <div>Destino</div>
                    <div>Rango de entrega</div>
                    <div>Pedidos</div>
                    <div className="justify-self-end">Status</div>
                </div>
            )}
            {rounds.map((r, index) => {
                const roundKey = getRoundKey(r, index);
                const isOpen = !!openIds[roundKey];
                const isSessionSummaryMode = mode === "session-summary";
                const isShipmentsMode = mode === "shipments";
                const shippingTotalValue =
                    typeof r.shippingTotal === "number"
                        ? r.shippingTotal
                        : typeof r.subtotal === "number" && typeof r.total === "number"
                            ? r.total - r.subtotal
                            : null;
                return (
                    <div key={roundKey} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                        <div
                            className={`grid items-center gap-4 px-5 py-3 ${isShipmentsMode
                                ? "grid-cols-[minmax(170px,1fr)_160px_120px_minmax(260px,1.2fr)_180px_140px_120px]"
                                : isSessionSummaryMode
                                    ? "grid-cols-[minmax(260px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_180px_140px]"
                                    : "grid-cols-[minmax(240px,1fr)_280px_160px_160px_120px]"
                                }`}
                            onClick={isShipmentsMode ? undefined : () => toggleOpen(roundKey)}
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {!isShipmentsMode && (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                                    {isShipmentsMode ? (
                                        <span className="text-base font-semibold tracking-tight text-gray-900">{r.shipmentCode}</span>
                                    ) : isSessionSummaryMode ? (
                                        <>
                                            <span className="text-base font-semibold tracking-tight text-gray-900">{r.shipmentCode}</span>
                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{r.id}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-base font-semibold tracking-tight text-gray-900">{r.id}</span>
                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{r.shipmentCode}</span>
                                        </>
                                    )}
                                </div>
                                {!isSessionSummaryMode && !isShipmentsMode && (
                                    <div className="mt-2 pl-6">
                                        {(typeof r.subtotal === "number" || typeof r.total === "number") && (
                                            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5">
                                                {typeof r.subtotal === "number" && (
                                                    <span className="text-xs text-slate-600">Subtotal: <span className="font-medium tabular-nums">{formatCurrency(r.subtotal)}</span></span>
                                                )}
                                                {typeof r.total === "number" && (
                                                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 tabular-nums">Total: {formatCurrency(r.total)}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {isShipmentsMode ? (
                                <>
                                    <div className="text-sm text-gray-700">{r.entregaDate || "-"}</div>
                                    <div className="text-sm text-gray-700">{r.origen || "-"}</div>
                                    <div className="text-sm text-gray-700 truncate" title={r.destino || "-"}>{r.destino || "-"}</div>
                                    <div className="text-sm text-gray-700">{r.rangoEntrega || "-"}</div>
                                    <div className="text-sm text-gray-700">{r.pedidosLabel || "-"}</div>
                                </>
                            ) : isSessionSummaryMode ? (
                                <>
                                    <div className="text-sm text-gray-700 min-w-0">
                                        <div className="font-medium truncate">{r.customerName || "-"}</div>
                                        {r.customerEmail && <div className="text-xs text-gray-600 truncate">{r.customerEmail}</div>}
                                        {r.customerPhone && <div className="text-xs text-gray-600">{r.customerPhone}</div>}
                                    </div>
                                    <div className="text-sm text-gray-700 min-w-0">
                                        <div className="font-medium truncate">{r.deliveryType || "-"}</div>
                                        {r.deliveryAddress && <div className="text-xs text-gray-600 line-clamp-2">{r.deliveryAddress}</div>}
                                        {r.deliveryCompany && <div className="text-xs text-gray-600 truncate">{r.deliveryCompany}</div>}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        {(typeof r.subtotal === "number" || typeof r.total === "number") && (
                                            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                                                {typeof r.subtotal === "number" && (
                                                    <div className="flex items-center justify-between text-xs text-slate-600">
                                                        <span>Total items</span>
                                                        <span className="font-medium tabular-nums">{formatCurrency(r.subtotal)}</span>
                                                    </div>
                                                )}
                                                {typeof shippingTotalValue === "number" && (
                                                    <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                                                        <span>Total envios</span>
                                                        <span className="font-medium tabular-nums">{formatCurrency(shippingTotalValue)}</span>
                                                    </div>
                                                )}
                                                {typeof r.total === "number" && (
                                                    <div className="mt-1 flex items-center justify-between">
                                                        <span className="text-xs uppercase tracking-wide text-slate-500">Total</span>
                                                        <span className="text-base font-semibold text-slate-900 tabular-nums">{formatCurrency(r.total)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="inline-flex items-center gap-2 text-gray-700 min-w-0">
                                        <Home className="h-5 w-5" />
                                        <span className="whitespace-normal break-words leading-5">{r.warehouseName ?? "-"}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-sm text-gray-600" onClick={(e) => e.stopPropagation()}>
                                        <Calendar className="h-5 w-5" />
                                        <span>{r.date}</span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        {r.assigned ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-green-700">
                                                <CheckCircleIcon className="h-4 w-4" /> {r.assigned}
                                            </span>
                                        ) : (
                                            <span className="rounded-md border px-2 py-1 text-xs text-gray-500">Sin asignar</span>
                                        )}
                                    </div>
                                </>
                            )}
                            <div className="justify-self-end">
                                <StatusBadge
                                    status={r.status}
                                    variant={resolveStatus(r.status, isShipmentsMode ? "delivery-tracking" : "pedido").variant as any}
                                />
                            </div>
                            {!isSessionSummaryMode && !isShipmentsMode && (
                                <div className="justify-self-end">
                                    <button className="pointer-events-none inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs text-gray-400" disabled>
                                        <ClipboardList size={14} />
                                        Agregar
                                    </button>
                                </div>
                            )}
                        </div>

                        {isOpen && !isShipmentsMode && (
                            <div className="divide-y">
                                {r.resultados.length === 0 ? (
                                    <div className="px-5 py-4 text-sm text-gray-500">Sin detalle de productos en esta ronda.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-2">Producto</th>
                                                    <th className="px-4 py-2">SKU / EAN</th>
                                                    {isSessionSummaryMode ? (
                                                        <>
                                                            <th className="px-4 py-2 text-right">Cantidad</th>
                                                            <th className="px-4 py-2 text-right">Precio unitario</th>
                                                            <th className="px-4 py-2 text-right">Total item</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-4 py-2 text-right">Solicitada</th>
                                                            <th className="px-4 py-2 text-right">Pickeada</th>
                                                            <th className="px-4 py-2 text-right">Faltante</th>
                                                            <th className="px-4 py-2">Estado</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {r.resultados.map((res) => (
                                                    <tr key={res.sessionItemId} className="border-t border-gray-100">
                                                        <td className="px-4 py-2 text-gray-800">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 overflow-hidden rounded-md border bg-white">
                                                                    <img
                                                                        src={res.imagen || DEFAULT_PRODUCT_IMG}
                                                                        alt={res.nombreProducto}
                                                                        className="h-full w-full object-contain"
                                                                        onError={(e) => {
                                                                            e.currentTarget.src = DEFAULT_PRODUCT_IMG;
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span>{res.nombreProducto}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-xs text-gray-600">
                                                            <div className="flex flex-col">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <PackageSearch size={14} /> {res.sku || "-"}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1">
                                                                    <QrCodeIcon size={14} /> {res.ean || "-"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        {isSessionSummaryMode ? (
                                                            <>
                                                                <td className="px-4 py-2 text-right tabular-nums">{Number(res.cantidad ?? res.cantidadSolicitada ?? 0)}</td>
                                                                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Number(res.precioUnitario ?? 0))}</td>
                                                                <td className="px-4 py-2 text-right tabular-nums font-medium">{formatCurrency(Number(res.totalItem ?? 0))}</td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-4 py-2 text-right tabular-nums">{res.cantidadSolicitada}</td>
                                                                <td className="px-4 py-2 text-right tabular-nums">{res.cantidadPickeada}</td>
                                                                <td className="px-4 py-2 text-right tabular-nums">{res.faltante}</td>
                                                                <td className="px-4 py-2">
                                                                    <StatusBadge status={res.estado} variant={resolveStatus(res.estado, "pedido").variant as any} />
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
