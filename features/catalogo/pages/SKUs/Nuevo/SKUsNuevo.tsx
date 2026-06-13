// views\CatalogoView\SKUs\Nuevo\Nuevo.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { Sku, SKUsFields } from "@/features/catalogo/components/skus/SKUsFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

/* Registro inicial vacío */
const initialRecord: Sku = {
    refId: "",
    refIdProducto: "",
    nombre: "",
    codigosBarra: "",
    esNuevo: true,
    fechaLanzamiento: "",
    modal: "",
    status: "Activo",
    umVenta: "un",
    multiplicadorUmVenta: 1,
    umPpum: "",
    multiplicadorUmPpum: 1,
    dimensionesAncho: 0,
    dimensionesAltura: 0,
    dimensionesProfundidad: 0,
    dimensionesPeso: 0,
    bultoAncho: 0,
    bultoAltura: 0,
    bultoProfundidad: 0,
    bultoPeso: 0,
};

export default function SKUsNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<Sku>({ ...initialRecord });

    const handleChange = (field: keyof Sku, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // Mantener referencias
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // POST real (Simulado)
    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;

        const errors: string[] = [];
        if (!current.refId) errors.push("Falta el Ref ID.");
        if (!current.nombre) errors.push("Falta el nombre del producto.");

        if (errors.length) {
            console.warn("Validación:", errors);
            return;
        }

        const payload = {
            ...current,
            UserCreated: Number(currentUser?.id ?? 0),
        };

        try {
            // console.log("POST /product-service/skus/Crear payload:", payload);
            // Simulación de llamada
            await new Promise(r => setTimeout(r, 800));
            // const resp = await fetchWithAuth(...)

            setRecord({ ...initialRecord });
            // router.push("/maestros/skus");
        } catch (err: any) {
            console.error("Error creando SKU:", err);
        }
    }, [fetchWithAuth]);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleCreate },
            {
                label: "Guardar y crear",
                variant: "primary",
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
                },
            },
            { label: "Cancelar", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/catalogo/skus") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">SKUs</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <SKUsFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}