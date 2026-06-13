"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

type EstadoUI = "No retornable" | "En uso" | "Disponible";

export interface PaqueteRow {
    id: string;
    tipo: string;
    refId: string;
    barcode: string;
    posicion: string;
    pedidoId: string;
    precio: number;
    createdAt: string;
    status: EstadoUI;
}

const clp = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const fdt = (iso: string) =>
    new Date(iso).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const pill = (s: EstadoUI) =>
    s === "En uso"
        ? "bg-yellow-400 text-white"
        : s === "No retornable"
            ? "bg-rose-500 text-white"
            : "bg-green-500 text-white";

export default function PaqueteDetalleView({
    open,
    pkg,
    onClose,
    onChangeStatus,
}: {
    open: boolean;
    pkg: PaqueteRow | null;
    onClose: () => void;
    onChangeStatus: (newStatus: EstadoUI) => void;
}) {
    return (
        <div
            className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"
                }`}
            aria-hidden={!open}
        >
            {/* overlay */}
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />
            {/* panel */}
            <div
                className={`absolute right-0 top-0 h-full w-full md:w-[52%] lg:w-[48%] bg-white shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                            Paquete
                        </div>
                        <div className="truncate text-lg font-semibold text-gray-900">
                            {pkg ? `${pkg.tipo} · ${pkg.refId}` : "—"}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
                        aria-label="Cerrar"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* contenido */}
                {pkg && (
                    <div className="h-[calc(100%-64px)] overflow-y-auto p-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Estado + acciones */}
                            <div className="rounded-xl border bg-white p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Estado</span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill(pkg.status)}`}>
                                        {pkg.status}
                                    </span>
                                </div>

                                {pkg.status === "En uso" && (
                                    <div className="flex flex-wrap gap-2">
                                        <ActionButton
                                            variant="error"
                                            onClick={() => onChangeStatus("No retornable")}
                                        >
                                            Descartar (no retornable)
                                        </ActionButton>
                                        <ActionButton
                                            variant="primary"
                                            onClick={() => onChangeStatus("Disponible")}
                                        >
                                            Liberar (disponible)
                                        </ActionButton>
                                    </div>
                                )}
                            </div>

                            {/* Detalle */}
                            <div className="rounded-xl border bg-white p-4">
                                <div className="mb-4 text-sm font-semibold text-gray-900">Detalle</div>
                                <div className="grid grid-cols-12 gap-4 text-sm">
                                    <LabelVal label="Tipo" value={pkg.tipo} />
                                    <LabelVal label="Ref ID" value={pkg.refId} />
                                    <LabelVal label="Código de barras" value={pkg.barcode} span={12} />
                                    <LabelVal label="Posición" value={pkg.posicion} />
                                    <LabelVal label="ID Pedido" value={pkg.pedidoId} span={12} />
                                    <LabelVal label="Precio" value={clp.format(pkg.precio)} />
                                    <LabelVal label="Creación" value={fdt(pkg.createdAt)} span={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function LabelVal({
    label,
    value,
    span = 6,
}: {
    label: string;
    value: string;
    span?: 3 | 4 | 5 | 6 | 8 | 12;
}) {
    return (
        <div className={`col-span-${span}`}>
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-1 text-gray-900">{value || "—"}</div>
        </div>
    );
}
