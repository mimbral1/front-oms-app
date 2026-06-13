"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import {
    AtributosFields,
    Attribute,
    SelectOption,
} from "@/features/catalogo/components/atributos/AtributosFields";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useFetchWithAuth } from "@/lib/http/client";

const TypedFaPlus = FaPlus as unknown as React.FC<
    React.SVGProps<SVGSVGElement>
>;
const SaveWithPlusIcon = () => (
    <div className="relative flex h-5 w-5 items-center justify-center">
        <SaveOutlined className="h-4 w-4 text-current" />
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
            <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
        </div>
    </div>
);

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

/* ── Mock data para un atributo existente ── */
const MOCK_ATTRIBUTE: Attribute = {
    Name: "Color",
    RefId: "color123",
    Group: "General",
    Category: "Ferretería",
    Accounts: ["mimbral"],
    AppliesToSkus: true,
    Type: "text",
    Options: ["Rojo", "Azul", "Verde", "Negro", "Blanco"],
    Multiple: false,
    Mandatory: false,
    DefaultValue: "",
    Status: "Activo",
    DateModified: "25/01/2022 10:16",
    UpdatedByName: "Bruno Bellini",
    UpdatedByEmail: "bruno.bellini@fiz...",
    createdAtFormatted: "20/01/2022 08:30",
};

export default function AtributosResumenView() {
    const { id } = useParams();
    const router = useRouter();
    const { fetchWithAuth, token } = useFetchWithAuth();
    const [attribute, setAttribute] = useState<Attribute | null>(null);
    const [editAttribute, setEditAttribute] = useState<Attribute | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAttribute = async () => {
            if (!id) {
                setError("ID del atributo no proporcionado.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // Mock fetch — replace with real API call
                await new Promise((r) => setTimeout(r, 400));
                const data = { ...MOCK_ATTRIBUTE, Name: `${MOCK_ATTRIBUTE.Name} (${id})` };
                setAttribute(data);
                setEditAttribute({ ...data });
            } catch (err: any) {
                console.error("Error fetching attribute:", err);
                setError(`Error al cargar el atributo: ${err.message}`);
                setAttribute(null);
                setEditAttribute(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAttribute();
    }, [id, token, fetchWithAuth]);

    const handleFieldChange = useCallback(
        (field: keyof Attribute, value: any) => {
            setEditAttribute((prev) => (prev ? { ...prev, [field]: value } : prev));
        },
        []
    );

    const handleSave = useCallback(async () => {
        if (!editAttribute || !id) return;
        console.log("[SAVE] Guardar atributo:", editAttribute);
        try {
            // Mock save — replace with real API call
            await new Promise((r) => setTimeout(r, 400));
            setAttribute({ ...editAttribute });
            router.push("/catalogo/atributos");
        } catch (err: any) {
            console.error("Error saving attribute:", err);
            setError(`Error al guardar: ${err?.message ?? String(err)}`);
        }
    }, [editAttribute, id, router]);

    const handleApply = useCallback(async () => {
        if (!editAttribute || !id) return;
        console.log("[APPLY] Aplicar atributo:", editAttribute);
        try {
            // Mock apply — replace with real API call
            await new Promise((r) => setTimeout(r, 400));
            setAttribute({ ...editAttribute });
        } catch (err: any) {
            console.error("Error applying attribute:", err);
            setError(`Error al aplicar: ${err?.message ?? String(err)}`);
        }
    }, [editAttribute, id]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "primary",
                onClick: handleApply,
                icon: <CheckCircleIcon className="h-5 w-5" />,
            },
            {
                label: "Guardar",
                variant: "success",
                onClick: handleSave,
                icon: <SaveOutlined className="h-4 w-4" />,
            },
            {
                label: "Guardar y crear",
                variant: "primary",
                onClick: async () => {
                    await handleSave();
                    router.push("/catalogo/atributos/nuevo");
                },
                icon: <SaveWithPlusIcon />,
            },
            {
                label: "Cancelar",
                variant: "secondary",
                onClick: () => router.push("/catalogo/atributos"),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [handleApply, handleSave, router]
    );

    usePageHeader(
        () => ({
            title: editAttribute ? editAttribute.Name : "Cargando Atributo...",
            action: headerActions,
            status: editAttribute
                ? {
                    text: editAttribute.Status,
                    variant:
                        editAttribute.Status === "Activo" ? "success" : "warning",
                }
                : undefined,
        }),
        [editAttribute, headerActions]
    );

    if (loading) {
        return (
            <div className="flex w-full items-center justify-center py-10">
                <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-500">Cargando…</span>
            </div>
        );
    }

    if (error) {
        return (
            <p className="p-4 text-center text-red-500">Error: {error}</p>
        );
    }

    if (!editAttribute) {
        return (
            <p className="p-4 text-center text-gray-500">
                Atributo no encontrado o no disponible.
            </p>
        );
    }

    return (
        <AtributosFields
            attribute={editAttribute}
            readOnly={false}
            onChange={handleFieldChange}
            isNew={false}
            groupOptions={MOCK_GROUP_OPTIONS}
            categoryOptions={MOCK_CATEGORY_OPTIONS}
            accountOptions={MOCK_ACCOUNT_OPTIONS}
            typeOptions={MOCK_TYPE_OPTIONS}
        />
    );
}
