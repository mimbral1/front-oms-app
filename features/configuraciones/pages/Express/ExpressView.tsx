// app/pedidos/configuraciones/dom/express/ExpressView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@headlessui/react";
import { ArrowDownOnSquareIcon, BarsArrowDownIcon, CalendarDaysIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import Card from "@/components/ui/card/Card";

export default function DomExpressConfigView() {
    const router = useRouter();

    /* ---------- estado local ---------- */
    const [priorizarOriginal, setPriorizarOriginal] = useState(false);
    const [fuenteSimulacion, setFuenteSimulacion] = useState<"shipping-type" | "inventory" | "capacity">("shipping-type");
    const [stockFoundRate, setStockFoundRate] = useState<number>(100);
    const [capacidadEntrega, setCapacidadEntrega] = useState<number>(10);

    /* ---------- handlers (acá se enchufa API real si corresponde) ---------- */
    const handleAplicar = () => {
        // TODO: PATCH/PUT con los valores actuales (fetch-with-auth)
        // Ej: fetchWithAuth("dom/express", { method: "PUT", body: JSON.stringify({...}) })
        // Mantener mismo helper y forma de payload que uses en otros módulos.
        console.log("Aplicar EXPRESS", {
            priorizarOriginal,
            fuenteSimulacion,
            stockFoundRate,
            capacidadEntrega,
        });
    };

    const handleGuardar = () => {
        // TODO: Igual que aplicar, pero dejando persistido y feedback en header si usas status
        handleAplicar();
    };

    const handleGuardarCrearNuevo = () => {
        // TODO: Guardar y luego limpiar si tu UX lo requiere
        handleAplicar();
    };

    /* ---------- acciones header (mismo esquema que DOM) ---------- */
    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", onClick: handleAplicar, icon: <CheckCircleIcon className="h-5 w-5" /> },
            { label: "Guardar", variant: "success", onClick: handleGuardar, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
            { label: "Guardar & Crear nuevo", variant: "success", onClick: handleGuardarCrearNuevo, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
            { label: "Volver al listado", variant: "secondary", onClick: () => router.push("/pedidos/configuraciones/dom"), icon: <XCircleIcon className="h-5 w-5" /> },
        ],
        [router, priorizarOriginal, fuenteSimulacion, stockFoundRate, capacidadEntrega]
    );

    /* ---------- header (idéntico a DOM: “Configuración / DOM”) ---------- */
    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Configuración</div>
                    <div className="text-2xl font-semibold text-gray-900">DOM</div>
                </div>
            ),
            action: headerActions,
        }),
        [headerActions]
    );

    /* ---------- render ---------- */
    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5] pt-[80px]">
            <div className="p-6">
                <Card
                    title="PRIORIDADES"
                    icon={BarsArrowDownIcon}
                    hasTitleDivider
                    className="mt-2"
                    borderClass="border-gray-200"
                    roundedClass="rounded-2xl"
                    titleClassName="text-base font-semibold tracking-wide text-gray-800"
                >
                    <div className="space-y-8">
                        {/* Priorizar original */}
                        <div className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-x-8">
                            <span className="text-sm font-bold text-gray-700">Priorizar original</span>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={priorizarOriginal}
                                    onChange={setPriorizarOriginal}
                                    className={`${priorizarOriginal ? "bg-blue-600" : "bg-gray-300"
                                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                >
                                    <span
                                        className={`${priorizarOriginal ? "translate-x-6" : "translate-x-1"
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </Switch>
                                {priorizarOriginal && (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                        Activo
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Fuente de simulación */}
                        <div className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-x-8">
                            <span className="text-sm font-bold text-gray-700">Fuente de simulación</span>
                            <div className="flex items-center justify-between gap-3">
                                <select
                                    className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                                    value={fuenteSimulacion}
                                    onChange={(e) => setFuenteSimulacion(e.target.value as any)}
                                >
                                    <option value="shipping-type">Shipping type</option>
                                    <option value="inventory">Inventory</option>
                                    <option value="capacity">Capacity</option>
                                </select>
                                {/* Si usas acciones de fila (ej. limpiar valor), déjalo aquí */}
                                {/* <button className="text-gray-500 hover:text-gray-700">✕</button> */}
                            </div>
                        </div>

                        {/* Stock (Found rate) */}
                        <div className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-x-8">
                            <span className="text-sm font-bold text-gray-700">Stock</span>
                            <div className="flex items-center gap-3">
                                {/* Icono a la izquierda, input con borde inferior (mismo patrón) */}
                                <span className="text-sm text-gray-500">🍷ï¸‍</span>
                                <input
                                    type="number"
                                    className="w-28 border-b border-gray-300 bg-transparent text-sm outline-none"
                                    value={stockFoundRate}
                                    onChange={(e) => setStockFoundRate(Number(e.target.value || 0))}
                                />
                            </div>
                        </div>

                        {/* Capacidad de entrega */}
                        <div className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-x-8">
                            <span className="text-sm font-bold text-gray-700">Capacidad de entrega</span>
                            <div className="flex items-center gap-3">
                                <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                                <input
                                    type="number"
                                    className="w-28 border-b border-gray-300 bg-transparent text-sm outline-none"
                                    value={capacidadEntrega}
                                    onChange={(e) => setCapacidadEntrega(Number(e.target.value || 0))}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
