// views\Almacen\Gestion\SolicitudTraslado\Nuevo\SolicitudTrasladoNuevo.tsx

"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";

import {
    createInternalDistributionMovement,
    MOVEMENT_TYPES,
    type MovementType,
} from "@/app/fetchWithAuth/api-traslados/inventory-docs";
import {
    TrasladosFieldsNuevo,
    type TrasladoRecord,
} from "@/features/almacenes/components/solicitud-traslado/SolicitudTrasladoFieldsNuevo";
import { getLoggedUserId } from "@/lib/auth/logged-user";

// genera external ref aleatorio al entrar en la pagina 
const generateExternalRef = () => {
    const ts = Date.now();
    const rnd = Math.floor(Math.random() * 1_000_000);
    return `TT-${ts}-${rnd}`;
};

/* ---------- Inicial ---------- */
const createInitialRecord = (): TrasladoRecord => ({
    header: {
        docType: "TT",
        movementType: "internalDistribution",
        assigneeId: "",
        dispatcherId: "",
        receiverId: "",
        fromWh: "",
        fromPosition: "",
        toWh: "",
        toPosition: "",
        reference: "",
        docDate: "",
        externalRef: generateExternalRef(),
    },
    lines: [{ itemSku: "", quantity: 1 }],
});


export default function TrasladosNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<TrasladoRecord>(() => createInitialRecord());

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    // resetear stock al postear 
    const [resetKey, setResetKey] = useState(0);

    const isMovementType = (value: string): value is MovementType => {
        return MOVEMENT_TYPES.includes(value as MovementType);
    };

    /* ---------- Crear ---------- */
    const handleCreate = useCallback(async () => {
        const current = recordRef.current;

        if (!current.header.fromWh || !current.header.toWh) {
            toast.error("Completa las bodegas de origen y destino");
            return;
        }

        if (!current.header.fromPosition || !current.header.toPosition) {
            toast.error("Completa las posiciones de origen y destino");
            return;
        }

        if (!current.header.assigneeId || !current.header.dispatcherId || !current.header.receiverId) {
            toast.error("Completa asignado, despachador y receptor");
            return;
        }

        if (!current.lines.length) {
            toast.error("Debes agregar al menos una línea");
            return;
        }

        const validLines = current.lines.filter(
            (l): l is TrasladoRecord["lines"][number] & { quantity: number } =>
                Boolean(l.itemSku?.trim()) &&
                typeof l.quantity === "number" &&
                l.quantity > 0
        );

        if (!validLines.length) {
            toast.error("Debes ingresar al menos una línea válida (SKU y cantidad)");
            return;
        }

        if (!isMovementType(current.header.movementType)) {
            toast.error("Selecciona un tipo de movimiento valido");
            return;
        }

        try {
            for (const line of validLines) {
                await createInternalDistributionMovement({
                    type: current.header.movementType,
                    source: {
                        warehouseId: current.header.fromWh,
                        positionId: current.header.fromPosition,
                    },
                    destination: {
                        warehouseId: current.header.toWh,
                        positionId: current.header.toPosition,
                    },
                    content: {
                        skuId: line.itemSku.trim(),
                        quantity: line.quantity,
                    },
                    assigneeId: current.header.assigneeId,
                    dispatcherId: current.header.dispatcherId,
                    receiverId: current.header.receiverId,
                    usuarioCreadorId: getLoggedUserId(),
                });
            }
            toast.success("Traslado creado correctamente");
            setRecord(createInitialRecord());
            setResetKey((k) => k + 1); // fuerza limpieza de stock
        } catch (err: any) {
            toast.error(err?.message || "Error al crear el traslado");
        }
    }, []);

    /* ---------- Header ---------- */
    const headerActions = useMemo<Action[]>(
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
                onClick: handleCreate,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => { router.push("/almacen/gestion/solicitud-traslado"); },
            },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Solicitud de Traslado
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Nuevo
                    </div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6">
            <TrasladosFieldsNuevo
                record={record}
                onChange={setRecord}
                resetKey={resetKey}
            />
        </div>
    );
}
