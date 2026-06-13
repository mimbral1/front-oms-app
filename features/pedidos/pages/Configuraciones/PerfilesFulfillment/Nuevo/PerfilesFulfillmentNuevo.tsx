// views\PedidosView\Configuraciones\PerfilesFulfillment\Nuevo\PerfilesFulfillmentNuevo.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { PerfilesFulfillmentFields, FulfillmentProfile } from "@/features/pedidos/components/configuraciones/perfilesfulfillment/PerfilesFulfillmentFields";
import { useAuth } from "@/app/context/auth/AuthContext";

/* Registro inicial (mocks por ahora) */
const initialRecord: FulfillmentProfile = {
    nombre: "",
    motor: "Advanced",
    tiposEntrega: ["drive_through"],
    canalVentaId: undefined,
    canalVentaNombre: "",

    restriccionEntrega: "Shipping type",
    atribucionOlas: "As soon as possible",
    crearEnviosInternos: true,
    tipoDistribucionInterna: "Movements",
    priorizarPickingEnAlmacenEntrega: true,
    onlyPreferredWithStock: false,
    usarPickUpPoint: false,

    factorFoundRateFactor: "Quantity",
    factorFoundRateValor: "Found-rate (valor)",
    factorFoundRatePercent: 0,

    prioridadTransporte: "Lower shipping cost",
    atribucionTimeSlot: "Ignore quota",

    permitirSplit: true,
    tipoSplit: "Order",
    splitMax: 3,
    valorMinimo: "",
    consolidarEntrega: true,

    recalcularTransportista: false,

    status: "Activo",
    created: { username: "—", email: "—", date: "—" },

    saltearOlaPickingExpress: false,
    usuarioCreadorNombre: "Ariel Mikowski",
    usuarioCreadorEmail: "ariel_mikowski@example.com",
    fechaCreacion: "13/08/2024 17:12:58",
    usuarioModificadorNombre: "Ariel Mikowski",
    usuarioModificadorEmail: "ariel_mikowski@example.com",
    ultimaModificacion: "05/09/2025 11:24:07",

};

export default function PerfilesFulfillmentNuevoView() {
    const router = useRouter();
    const { user } = useAuth();

    const [record, setRecord] = useState<FulfillmentProfile>({ ...initialRecord });
    const handleChange = (field: keyof FulfillmentProfile, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // refs estables para header (mismo patrón)
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // Mock de creación (cuando exista endpoint lo enchufamos)
    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        console.log("Crear Fulfillment Profile (payload)", current);
        // aquí POST real cuando lo tengas
        setRecord({ ...initialRecord });
    }, []);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleCreate },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => { handleCreate(); },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/pedidos/configuraciones/perfiles-fulfillment") },
        ],
        [router, handleCreate]
    ); // patrón SalesChannelsNuevoView :contentReference[oaicite:9]{index=9}

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Perfiles de Fulfillment</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    ); // :contentReference[oaicite:10]{index=10}

    return (
        <div className="p-6 bg-white">
            <PerfilesFulfillmentFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
