// app/views/Pedidos/Repack/RepackView.tsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { getStatusVariant } from "@/features/pedidos/utils/pedido-status";
import type { PedidoStatus } from "@/features/pedidos/types/lista-pedidos";
import { FaPlus } from "react-icons/fa";
import Card from "@/components/ui/card/Card";
import { PackageIcon, PackagePlusIcon } from "lucide-react";

type AccionRepack =
    | "CREAR_PAQUETE"
    | "INSERTAR_EN_PAQUETE"
    | "ELIMINAR_PAQUETES"
    | "RESTABLECER_PAQUETES"
    | "FINALIZAR";

export default function RepackView() {
    const router = useRouter();

    // MOCK de pedido (como en la captura)
    const pedidoId = "FIZ #1233273051547-01";
    const pedidoStatus = "Pickeado";

    // Estado UI
    const [saving, setSaving] = useState(false);
    const [accion, setAccion] = useState<AccionRepack>("CREAR_PAQUETE");
    const [codigoBarras, setCodigoBarras] = useState("");
    const [tipoPaquete, setTipoPaquete] = useState("");
    const [ancho, setAncho] = useState<string>("");
    const [altura, setAltura] = useState<string>("");
    const [largo, setLargo] = useState<string>("");
    const [peso, setPeso] = useState<string>("");
    const [cubage, setCubage] = useState<string>("");

    const handleSave = useCallback(async () => {
        setSaving(true);
        // simulacion de guardado (mock)
        setTimeout(() => setSaving(false), 900);
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Guardar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />, onClick: handleSave, disabled: saving },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: handleSave,
                disabled: saving,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/pedidos/listado-pedidos"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Pedidos</div>
                    <div className="text-2xl font-semibold text-gray-900">{pedidoId}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando", variant: "info" }
                : { text: pedidoStatus, variant: getStatusVariant(pedidoStatus as PedidoStatus) },
        } as PageHeaderProps),
        [headerActions, saving, pedidoId, pedidoStatus]
    );

    return (
        <div className="grid grid-cols-1 gap-6">
            {/* TIPO DE REPACK */}
            <Card title="TIPO DE REPACK" icon={PackageIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                <div className="grid grid-cols-12 gap-4">
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Accin</span>
                    <div className="col-span-11">
                        <div className="relative">
                            <select
                                className="w-full appearance-none border-b border-gray-300 bg-transparent py-1.5 pr-8 text-sm outline-none"
                                value={accion}
                                onChange={(e) => setAccion(e.target.value as AccionRepack)}
                            >
                                <option value="CREAR_PAQUETE">Crear paquete</option>
                                <option value="INSERTAR_EN_PAQUETE">Insertar dentro de paquete</option>
                                <option value="ELIMINAR_PAQUETES">Eliminar paquetes</option>
                                <option value="RESTABLECER_PAQUETES">Restablecer paquetes</option>
                                <option value="FINALIZAR">Finalizar</option>
                            </select>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 pr-1 text-gray-400">?</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* PAQUETE NUEVO */}
            <Card title="PAQUETE NUEVO" icon={PackagePlusIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                <div className="grid grid-cols-12 gap-4">
                    {/* Fila 1: Cdigo de barras (6 cols) + Tipo de paquete (6 cols) */}
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Cdigo de barras</span>
                    <div className="col-span-5">
                        <input
                            className="w-full border-b border-gray-300 text-sm outline-none"
                            value={codigoBarras}
                            onChange={(e) => setCodigoBarras(e.target.value)}
                            placeholder=""
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold flex items-center gap-2">
                        Tipo de paquete <PackageIcon className="h-4 w-4" />
                    </span>
                    <div className="col-span-5">
                        <div className="relative">
                            <select
                                className="w-full appearance-none border-b border-gray-300 bg-transparent py-1.5 pr-8 text-sm outline-none"
                                value={tipoPaquete}
                                onChange={(e) => setTipoPaquete(e.target.value)}
                            >
                                <option value=""> Seleccione </option>
                                <option value="Caja">Caja</option>
                                <option value="Bolsa">Bolsa</option>
                                <option value="Sobre">Sobre</option>
                                <option value="Pallet">Pallet</option>
                            </select>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 pr-1 text-gray-400">?</span>
                        </div>
                    </div>

                    {/* Fila 2: Ancho / Altura / Largo / Peso (1 label + 2 input = 3 cols cada uno) */}
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Ancho</span>
                    <div className="col-span-2">
                        <input
                            className="w-full border-b border-gray-300 text-sm outline-none"
                            value={ancho}
                            onChange={(e) => setAncho(e.target.value)}
                            placeholder=""
                            inputMode="decimal"
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Altura</span>
                    <div className="col-span-2">
                        <input
                            className="w-full border-b border-gray-300 text-sm outline-none"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                            placeholder=""
                            inputMode="decimal"
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Largo</span>
                    <div className="col-span-2">
                        <input
                            className="w-full border-b border-gray-300 text-sm outline-none"
                            value={largo}
                            onChange={(e) => setLargo(e.target.value)}
                            placeholder=""
                            inputMode="decimal"
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Peso</span>
                    <div className="col-span-2">
                        <input
                            className="w-full border-b border-gray-300 text-sm outline-none"
                            value={peso}
                            onChange={(e) => setPeso(e.target.value)}
                            placeholder=""
                            inputMode="decimal"
                        />
                    </div>

                    {/* Fila 3: Cubage full width */}
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Cubage</span>
                    <div className="col-span-11">
                        <input
                            className="w-full border-b border-gray-300 text-sm outline-none"
                            value={cubage}
                            onChange={(e) => setCubage(e.target.value)}
                            placeholder=""
                            inputMode="decimal"
                        />
                    </div>
                </div>
            </Card>

        </div>
    );
}
