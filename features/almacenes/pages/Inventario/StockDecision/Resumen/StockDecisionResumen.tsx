"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import {
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

import StockDecisionFields, {
    StockDecision,
} from "@/features/almacenes/components/inventario/stockdecision/StockDecisionFields";

/* ========================================================================
   MOCK
======================================================================== */

const MOCK: StockDecision = {
    nombre: "Default Stock Decision",
    estado: "Activo",
    version: "v3",
    engine: "Advanced",
    multiWarehouse: true,
    reserveStock: true,
    reserveMinutes: 120,
    allowSplit: true,
    maxSplits: 3,
    minimizeSplits: true,
    maxWeight: 30,
    maxVolume: 0.2,
    maxItems: 10,
    slaStandard: 240,
    slaExpress: 120,
    wavesEnabled: true,
    waveEvery: 30,
};

export default function StockDecisionResumen() {
    const router = useRouter();
    const pathname = usePathname();
    const baseRoute = pathname?.startsWith("/almacen/inventario/cambios-stock")
        ? "/almacen/inventario/cambios-stock"
        : "/almacen/gestion/stock-decision";
    const [record, setRecord] = useState<StockDecision>(MOCK);
    const recordRef = useRef(record);

    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    const handleSave = () => {
        console.log("Guardar Stock Decision:", recordRef.current);
    };

    /* ======================================================
       HEADER ACTIONS
    ====================================================== */
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push(baseRoute),
            },
        ],
        [router, baseRoute]
    );

    /* ======================================================
       PAGE HEADER
    ====================================================== */
    const headerConfig = useMemo<PageHeaderProps>(
        () => ({
            title: (
                <div>
                    <div className="text-xs uppercase font-semibold text-blue-600 tracking-wider">
                        Stock Decision
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record.nombre}
                    </div>
                </div>
            ),
            action: headerActions,
            status: {
                text: record.estado,
                variant: "success",
            },
        }),
        [headerActions, record]
    );

    usePageHeader(() => headerConfig, [headerConfig]);

    /* ======================================================
       RETURN
    ====================================================== */
    return (
        <div className="p-6 bg-white">
            <StockDecisionFields
                record={record}
                readOnly={false}
                onChange={(field, value) =>
                    setRecord((prev) => ({ ...prev, [field]: value }))
                }
            />
        </div>
    );
}
