// app/views/Productos/Grupos/New/GruposProductoNuevoView.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { ProductGroup, GruposProductoFields } from "@/features/catalogo/components/configuraciones-catalogo/grupos-de-productos/GruposProductoFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

/* Registro inicial vacío (mismo patrón que Nuevo de SalesChannels) */
const initialRecord: ProductGroup = {
    nombre: "",
    refId: "",
    icono: "",
    estado: "Activo",
    created: { username: "—", email: "—", date: "—" },
};

export default function GruposProductoNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<ProductGroup>({ ...initialRecord });
    const handleChange = (field: keyof ProductGroup, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // Mantener refs estables (calcado de tu Nuevo de canales)
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // POST real (ajusta endpoint cuando exista)
    const handleCreate = useCallback(async () => {
        const current = recordRef.current as ProductGroup;
        const currentUser = userRef.current;

        const payload = {
            Name: (current.nombre || "").trim(),
            ReferenceId: (current.refId || "").trim(),
            Icon: current.icono || "",
            IsActive: current.estado === "Activo" ? 1 : 0,
            UserCreated: Number(currentUser?.id ?? 0),
        };

        const errors: string[] = [];
        if (!payload.Name) errors.push("Falta el nombre (Name).");

        if (errors.length) {
            console.warn("Validación antes de POST:", errors);
            return;
        }

        try {
            // const resp = await fetchWithAuth<{ ok: boolean; data: any }>("product-service/product-group/Crear", { method: "POST", body: JSON.stringify(payload) });
            // Mock: asumimos OK y limpiamos
            setRecord({ ...initialRecord });
        } catch (err: any) {
            console.error("Error creando grupo de producto:", err?.payload ?? err);
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
                },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/catalogo/configuraciones-catalogo/grupos-de-productos") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Grupos de producto</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            {/* isCreate oculta Ref ID y tarjetas de usuario en el Fields */}
            <GruposProductoFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
