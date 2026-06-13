// views\Ubicaciones\Stores\components\Nuevo\Nuevo.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { StoreRecord, StoreFields } from "@/features/ubicaciones/components/stores/StoreFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

type AuthUserLike = { id?: number | string } | null | undefined;
type CreateStoreResponse = { ok: boolean; data?: unknown };

const toUserId = (user: AuthUserLike): number => {
    if (!user) return 0;
    const parsed = Number(user.id);
    return Number.isFinite(parsed) ? parsed : 0;
};

const errorPayload = (err: unknown): unknown => {
    if (err && typeof err === "object" && "payload" in err) {
        return (err as { payload?: unknown }).payload ?? err;
    }
    return err;
};

/* Registro inicial vacío */
const initialRecord: StoreRecord = {
    name: "",
    email: "",
    phone: "",
    status: "Activo",
    created: { username: "—", email: "—", date: "—" },
};

export default function StoreNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<StoreRecord>({ ...initialRecord });

    const handleChange = <K extends keyof StoreRecord>(field: K, value: StoreRecord[K]) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // Mantener referencias estables para evitar bucles en usePageHeader
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // Crear con control de navegación: stay=true => se queda; stay=false => va al listado
    const handleCreate = useCallback(async ({ stay }: { stay: boolean }): Promise<boolean> => {
        const current = recordRef.current as StoreRecord;
        const currentUser = userRef.current as AuthUserLike;

        const payload = {
            CompanyId: Number(current.companyId || 0),
            Name: (current.name || "").trim(),
            Email: (current.email || "").trim(),
            PhoneNumber: (current.phone || "").trim(),
            Status: current.status === "Activo" ? 1 : 0,
            UserCreated: toUserId(currentUser),
        };

        const errors: string[] = [];
        if (!payload.Name) errors.push("Falta el nombre (Name).");
        if (!payload.Email) errors.push("Falta el email (Email).");
        if (payload.UserCreated === 0) errors.push("UserCreated inválido.");
        if (errors.length) { console.warn("Validación antes de POST:", errors); return false; }

        try {
            await fetchWithAuth<CreateStoreResponse>(
                "comerce-service/store/Crear",
                { method: "POST", body: JSON.stringify(payload) }
            );
            if (stay) {
                // quedarse creando otro
                setRecord({ ...initialRecord });
            } else {
                // ir al listado
                router.push("/ubicaciones/stores");
            }
            return true;
        } catch (err) {
            console.error("Error creando tienda:", errorPayload(err));
            return false;
        }
    }, [fetchWithAuth, router]);

    // “Guardar” = crea y va al listado. “Guardar & Crear nuevo” = crea y se queda.
    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => { void handleCreate({ stay: false }); } },
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
                onClick: () => { void handleCreate({ stay: true }); },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/ubicaciones/stores") },
        ],
        [router, handleCreate]
    );


    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Stores</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            {/* isCreate oculta tarjetas de usuario en el Fields */}
            <StoreFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
