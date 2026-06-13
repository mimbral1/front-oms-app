// views\Cuenta\CuentasComercio\CanalesVenta\Nuevo\Nuevo.tsx

"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { SalesChannel, SalesChannelFields } from "@/features/cuenta/components/cuentascomercio/canalesventa/SalesChannelsFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";
import { toast } from "react-hot-toast";

/* Registro inicial vacío */
const initialRecord: SalesChannel = {
    nombre: "",
    refId: "",
    moneda: "",
    pickingExterno: false,
    capturaAutoPostPicking: false,
    asociadas: { catalogo: "", precios: "", stock: "", pedidos: "", entrega: "" },
    status: "Activo",
    created: { username: "—", email: "—", date: "—" },
    // Opcionales por si el Fields ya trae compañía
    // companyId?: number; companyName?: string;
};

export default function SalesChannelsNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<SalesChannel>({ ...initialRecord });

    const handleChange = (field: keyof SalesChannel, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // Mantener referencias estables para evitar bucles en usePageHeader
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // POST real: crear canal de venta
    const handleCreate = useCallback(async () => {
        const current = recordRef.current as any;
        const currentUser = userRef.current;

        const companyId = current?.companyId; // viene del selector en el Fields
        const name = (current?.nombre || "").trim();

        const validPriceLists = (current.priceLists || []).filter(
            (pl: any) => typeof pl.priceListNum === "number" && pl.priceListNum > 0
        );

        const payload = {
            CompanyId: Number(companyId || 0),
            Name: name || "",
            ExternalDelivery: current?.pickingExterno ? 1 : 0,
            IsActive: 1,
            UserCreated: Number(currentUser?.id ?? 0),
            priceLists: validPriceLists.map((pl: any) => ({
                priceListNum: pl.priceListNum,
                isActive: pl.isActive ? 1 : 0,
            })),
        };

        const errors: string[] = [];
        if (!companyId) errors.push("Falta seleccionar la compañía (CompanyId).");
        if (!name) errors.push("Falta el nombre del canal (Name).");

        if (errors.length) {
            toast.error("Completa los campos obligatorios antes de guardar");
            return;
        }

        try {
            // console.log("POST /comerce-service/sales-channel/Crear payload:", payload);
            const resp = await fetchWithAuth<{ ok: boolean; data?: any }>(
                "comerce-service/sales-channel/Crear",
                { method: "POST", body: JSON.stringify(payload) }
            );
            toast.success("Canal de venta creado correctamente");
            // console.log("Creado OK:", resp);

            // limpiar y quedar listo para otro registro
            setRecord({ ...initialRecord });
            // Si quieres navegar al listado:
            // router.push("/ventas/canales");
        } catch (err) {
            console.error(err);
            toast.error("Ocurrió un error al guardar el canal de venta");
        }
    }, [fetchWithAuth]);

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
                onClick: () => {
                    handleCreate();
                    // limpiar ya se hace en handleCreate si todo OK
                },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push('/cuenta/cuentas-comercio/canales-venta') },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Canales de venta</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            {/* isCreate oculta Ref ID y los apartados de Usuario en el Fields */}
            <SalesChannelFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
