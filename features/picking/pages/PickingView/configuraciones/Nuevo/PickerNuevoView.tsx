// views\PickingView\configuraciones\Nuevo\PickerNuevoView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";

import { Picker, PickersFields } from "@/features/picking/components/pickingview/configuraciones/PickersFields";
import { useApiPickers } from "@/app/fetchWithAuth/picking/configuraciones/api-pickers/api-pickers";
import { useAuth } from "@/app/context/auth/AuthContext";

/* ===============================
   Estado inicial
=============================== */
const initialRecord: Picker = {
    nombre: "",
    email: "",
    perfil: "",
    idFuncionario: "",
    almacenTienda: "",

    carrierIds: [],
    locationIds: [],
    shippingTypeCodes: [],
    pickingPointIds: [],
    enabledPickingZones: [],
    restrictedPickingZones: [],

    estado: "Activo",

    creador: undefined,
    fechaCreacion: "",
    ultimaModificacion: "",
};

export default function PickerNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { createPicker } = useApiPickers();

    const [record, setRecord] = useState<Picker>({ ...initialRecord });
    const [saving, setSaving] = useState(false);

    const handleChange = <K extends keyof Picker>(field: K, value: Picker[K]) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    /* ===============================
       Ref estable (header)
    =============================== */
    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    /* ===============================
       CREAR
    =============================== */
    const handleCreate = useCallback(
        async (goBack = false) => {
            const current = recordRef.current;
            if (!current || !user) return;

            if (!current.idFuncionario) {
                toast.error("Debes seleccionar un picker válido en Nombre.");
                return;
            }

            setSaving(true);

            try {
                await createPicker({
                    userId: Number(current.idFuncionario),
                    createdBy: Number(user.id),
                    status: current.estado === "Activo" ? "active" : "inactive",
                    userSnapshot: {
                        userEmail: current.email,
                        userName: current.nombre,
                    },
                    carrierIds: current.carrierIds,
                    locationIds: current.locationIds,
                    shippingTypeCodes: current.shippingTypeCodes,
                    pickingPointIds: current.pickingPointIds,
                    enabledPickingZones: current.enabledPickingZones,
                    restrictedPickingZones: current.restrictedPickingZones,
                });

                toast.success("Picker creado correctamente");

                if (goBack) {
                    router.push("/picking/configuraciones/pickers");
                } else {
                    setRecord({ ...initialRecord });
                }
            } catch (e: any) {
                toast.error(
                    e?.message || "Ocurrió un error al crear el picker"
                );
            } finally {
                setSaving(false);
            }
        },
        [user, router]
    );

    /* ===============================
       HEADER
    =============================== */
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => handleCreate(true),
                disabled: saving,
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
                onClick: () => handleCreate(false),
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/configuraciones/pickers"),
                disabled: saving,
            },
        ],
        [saving, handleCreate, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Pickers
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Nuevo
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    /* ===============================
       RENDER
    =============================== */
    return (
        <div className="p-6 bg-white">
            <PickersFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                isCreate
            />
        </div>
    );
}
