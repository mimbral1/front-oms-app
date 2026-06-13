// src/app/pedidos/configuraciones/delivery/horarios/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import Card from "@/components/ui/card/Card";
import { ArrowDownOnSquareIcon, CheckCircleIcon, ClockIcon, Cog6ToothIcon, CurrencyDollarIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function DeliveryHorariosView() {
    const router = useRouter();

    // Estado editable (valores ejemplo)
    const [paquetesMax, setPaquetesMax] = useState<number | string>("10000");
    const [itemsMax, setItemsMax] = useState<number | string>("10000");
    const [extraDeliveryCost, setExtraDeliveryCost] = useState<number | string>("0");
    const [tiempoMinFulfillment, setTiempoMinFulfillment] = useState<number | string>("12");

    // Acciones (calcadas a Dom)
    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", onClick: () => { }, icon: <CheckCircleIcon className="h-5 w-5" /> },
            { label: "Guardar", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                onClick: () => {
                    setPaquetesMax(""); setItemsMax(""); setExtraDeliveryCost(""); setTiempoMinFulfillment("");
                },
            },
            { label: "Volver al listado", variant: "secondary", onClick: () => router.push("/pedidos/configuraciones/delivery"), icon: <XCircleIcon className="h-5 w-5" /> },
        ],
        [router]
    );

    // Header (idéntico formato al Dom)
    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Configuración</div>
                    <div className="text-2xl font-semibold text-gray-900">Ajustes de Delivery</div>
                </div>
            ),
            action: headerActions,
        }),
        [headerActions]
    );

    const labelCls = "text-sm text-gray-600 font-bold";
    const inputCls = "w-full border-b border-gray-300 text-sm outline-none bg-transparent";

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5] pt-[80px]">
            <div className="p-6 space-y-6 bg-white">
                {/* PRINCIPAL (sin redondeados, estilo SalesChannelFields) */}
                <Card
                    title="PRINCIPAL"
                    icon={Cog6ToothIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="p-6"             // <- sin rounded
                    borderClass="border-gray-200"
                    titleClassName="text-base font-semibold tracking-wide text-gray-800"
                >
                    <div className="grid grid-cols-6 gap-4">
                        {/* Paquetes (máx.) */}
                        <span className="col-span-1 {labelCls}">Paquetes (máx.)</span>
                        <div className="col-span-5">
                            <input
                                type="number"
                                className={inputCls}
                                value={paquetesMax}
                                onChange={(e) => setPaquetesMax(e.target.value)}
                                placeholder=""
                            />
                        </div>

                        {/* Ítems (máx.) */}
                        <span className="col-span-1 {labelCls}">Ítems (máx.)</span>
                        <div className="col-span-5">
                            <input
                                type="number"
                                className={inputCls}
                                value={itemsMax}
                                onChange={(e) => setItemsMax(e.target.value)}
                                placeholder=""
                            />
                        </div>
                    </div>
                </Card>

                {/* COSTOS */}
                <Card
                    title="COSTOS"
                    icon={CurrencyDollarIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="p-6"             // <- sin rounded
                    borderClass="border-gray-200"
                    titleClassName="text-base font-semibold tracking-wide text-gray-800"
                >
                    <div className="grid grid-cols-6 gap-4">
                        {/* Extra delivery cost */}
                        <span className="col-span-1 {labelCls}">Costo de envío adicional</span>
                        <div className="col-span-5 flex items-center gap-2">
                            <span className="text-green-600">$</span>
                            <input
                                type="number"
                                step="0.01"
                                className={inputCls}
                                value={extraDeliveryCost}
                                onChange={(e) => setExtraDeliveryCost(e.target.value)}
                                placeholder=""
                            />
                        </div>
                    </div>
                </Card>

                {/* TIEMPO */}
                <Card
                    title="TIEMPO"
                    icon={ClockIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="p-6"             // <- sin rounded
                    borderClass="border-gray-200"
                    titleClassName="text-base font-semibold tracking-wide text-gray-800"
                >
                    <div className="grid grid-cols-6 gap-4">
                        {/* Tiempo mínimo de Fulfillment */}
                        <span className="col-span-1 {labelCls}">Tiempo mínimo de Fulfillment</span>
                        <div className="col-span-5">
                            <input
                                type="number"
                                className={inputCls}
                                value={tiempoMinFulfillment}
                                onChange={(e) => setTiempoMinFulfillment(e.target.value)}
                                placeholder=""
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
