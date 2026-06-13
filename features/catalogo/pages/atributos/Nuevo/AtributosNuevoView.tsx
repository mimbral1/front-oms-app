"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import {
    AtributosFields,
    Attribute,
    SelectOption,
} from "@/features/catalogo/components/atributos/AtributosFields";
import { useFetchWithAuth } from "@/lib/http/client";

/* ── Registro inicial vacío ── */
const initialRecord: Attribute = {
    Name: "",
    RefId: "",
    Group: "",
    Category: "",
    Accounts: [],
    AppliesToSkus: false,
    Type: "text",
    Options: [],
    Multiple: false,
    Mandatory: false,
    DefaultValue: "",
    Status: "Activo",
    DateModified: null,
    UpdatedByName: null,
    UpdatedByEmail: null,
};

/* ── Mock dropdown options ── */
const MOCK_GROUP_OPTIONS: SelectOption[] = [
    { label: "General", value: "General" },
    { label: "Dimensiones", value: "Dimensiones" },
    { label: "Técnico", value: "Técnico" },
];

const MOCK_CATEGORY_OPTIONS: SelectOption[] = [
    { label: "Ferretería", value: "Ferretería" },
    { label: "Construcción", value: "Construcción" },
    { label: "Iluminación y Electricidad", value: "Iluminación y Electricidad" },
    { label: "Limpieza y Cuidado del Hogar", value: "Limpieza y Cuidado del Hogar" },
];

const MOCK_ACCOUNT_OPTIONS: SelectOption[] = [
    { label: "Mimbral", value: "mimbral" },
    { label: "Mimbral Chile", value: "mimbral-cl" },
    { label: "TuMayorFerretero", value: "tmf" },
];

const MOCK_TYPE_OPTIONS: SelectOption[] = [
    { label: "Texto", value: "text" },
    { label: "Numérico", value: "number" },
];

export default function AtributosNuevoView() {
    const router = useRouter();
    const { fetchWithAuth } = useFetchWithAuth();
    const [record, setRecord] = useState<Attribute>({ ...initialRecord });

    const handleChange = (field: keyof Attribute, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    const handleCreate = useCallback(async () => {
        const current = recordRef.current;

        const errors: string[] = [];
        if (!current.Name) errors.push("Falta el nombre del atributo.");
        if (!current.RefId) errors.push("Falta el Ref ID.");

        if (errors.length) {
            console.warn("Validación:", errors);
            return;
        }

        try {
            // Mock create — replace with real API call
            await new Promise((r) => setTimeout(r, 800));
            setRecord({ ...initialRecord });
            router.push("/catalogo/atributos");
        } catch (err: any) {
            console.error("Error creando atributo:", err);
        }
    }, [fetchWithAuth, router]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: handleCreate,
            },
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
                onClick: async () => {
                    await handleCreate();
                    setRecord({ ...initialRecord });
                },
            },
            {
                label: "Cancelar",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/atributos"),
            },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Atributos
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="bg-white p-6">
            <AtributosFields
                attribute={record}
                readOnly={false}
                onChange={handleChange}
                isNew
                groupOptions={MOCK_GROUP_OPTIONS}
                categoryOptions={MOCK_CATEGORY_OPTIONS}
                accountOptions={MOCK_ACCOUNT_OPTIONS}
                typeOptions={MOCK_TYPE_OPTIONS}
            />
        </div>
    );
}
