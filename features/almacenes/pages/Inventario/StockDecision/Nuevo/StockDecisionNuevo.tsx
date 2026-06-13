"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import StockDecisionFields, {
    StockDecision,
} from "@/features/almacenes/components/inventario/stockdecision/StockDecisionFields";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { FaPlus } from "react-icons/fa";

const EMPTY: StockDecision = {
    nombre: "",
    estado: "Activo",
    version: "v1",

    engine: "Advanced",

    multiWarehouse: false,
    reserveStock: false,
    reserveMinutes: 0,

    allowSplit: false,
    maxSplits: 0,
    minimizeSplits: false,

    maxWeight: 0,
    maxVolume: 0,
    maxItems: 0,

    slaStandard: 0,
    slaExpress: 0,
    wavesEnabled: false,
    waveEvery: 0,
};


export default function StockDecisionNuevo() {
    const router = useRouter();
    const pathname = usePathname();
    const baseRoute = pathname?.startsWith("/almacen/inventario/cambios-stock")
        ? "/almacen/inventario/cambios-stock"
        : "/almacen/gestion/stock-decision";
    const [record, setRecord] = useState<StockDecision>({ ...EMPTY });
    const ref = useRef(record);

    useEffect(() => {
        ref.current = record;
    }, [record]);

    const handleChange = (f: keyof StockDecision, v: any) =>
        setRecord((r) => ({ ...r, [f]: v }));

    const actions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Crear", ref.current),
            },
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
                    console.log("Aplicar");
                },
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

    const header = useMemo<PageHeaderProps>(
        () => ({
            title: (
                <>
                    <div className="text-xs uppercase text-blue-600">
                        Stock Decision
                    </div>
                    <div className="text-2xl font-semibold">Nuevo</div>
                </>
            ),
            action: actions,
        }),
        [actions]
    );

    usePageHeader(() => header, [header]);

    return (
        <div className="p-6 bg-white">
            <StockDecisionFields record={record} onChange={handleChange} isCreate />
        </div>
    );
}
