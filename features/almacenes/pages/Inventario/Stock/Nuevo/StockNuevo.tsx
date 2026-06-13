"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import StockFields, {
    InventarioOption,
    StockRecord,
} from "@/features/almacenes/components/inventario/stock/StockFields";
import {
    inventoryCreateStock,
} from "@/app/fetchWithAuth/api-inventory/inventory";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { getLoggedUserId } from "@/lib/auth/logged-user";

const initialRecord: StockRecord = {
    sku: "",
    nombre: "",
    inventario: "",
    onHand: 0,
    safety: 0,
    reservado: 0,
    disponible: 0,
    proyectado: 0,
    infinito: false,
    updatedAt: "",
    usuario: "Usuario QA",
    correo: "qa@mimbral.cl",
    blocked: false,
    warehouses: [],
};

export default function StockNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<StockRecord>({ ...initialRecord });
    const [warehouseOptions, setWarehouseOptions] = useState<InventarioOption[] | null>(null);
    const recordRef = useRef(record);

    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    useEffect(() => {
        let mounted = true;

        const loadWarehouses = async () => {
            try {
                const { items } = await warehousesAll({ page: 1, pageSize: 200 });
                if (!mounted) return;

                const options = items
                    .filter((w) => w.isActive)
                    .map((w) => ({
                        value: w.id,
                        label: w.name,
                    }));

                setWarehouseOptions(options);
            } catch (error) {
                console.error("No fue posible cargar bodegas", error);
                if (!mounted) return;
                setWarehouseOptions([]);
            }
        };

        loadWarehouses();
        return () => {
            mounted = false;
        };
    }, []);

    const set = (field: keyof StockRecord, value: any) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        if (!current.sku.trim()) {
            console.warn("Validacion: falta SKU");
            return;
        }

        if (!current.inventario.trim()) {
            console.warn("Validacion: falta warehouse");
            return;
        }

        await inventoryCreateStock({
            sku: current.sku.trim(),
            warehouse: current.inventario.trim(),
            stock: Number.isFinite(Number(current.onHand)) ? Number(current.onHand) : 0,
            infiniteStock: !!current.infinito,
            usuarioCreadorId: getLoggedUserId(),
        });
    }, []);

    const actions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: handleCreate,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: async () => {
                    await handleCreate();
                    setRecord({ ...initialRecord });
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/inventario/stock"),
            },
        ],
        [handleCreate, router]
    );

    const header = useMemo<PageHeaderProps>(
        () => ({
            title: (
                <>
                    <div className="text-xs uppercase text-blue-600">Stock</div>
                    <div className="text-2xl font-semibold">Nuevo</div>
                </>
            ),
            action: actions,
        }),
        [actions]
    );

    usePageHeader(() => header, [header]);

    return (
        <div className="bg-white p-6">
            <StockFields
                record={record}
                readOnly={false}
                onChange={set}
                isCreate
                inventarios={warehouseOptions || undefined}
            />
        </div>
    );
}
