"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import {
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    UserIcon,
    TrashIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

const TypedFaPlus = FaPlus as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const SaveWithPlusIcon = () => (
    <div className="relative flex h-5 w-5 items-center justify-center">
        <SaveOutlined className="h-4 w-4 text-current" />
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
            <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
        </div>
    </div>
);

interface AttributePair {
    id: string;
    attribute: string;
    attributeGroup: string;
}

interface AttributeSet {
    id: string;
    refId: string;
    name: string;
    attributes: AttributePair[];
    status: "Active" | "Inactive";
    creatorUserName: string;
    creatorUserEmail: string;
    createdAt: string;
}

const MOCK_SET: AttributeSet = {
    id: "1",
    refId: "atr-set",
    name: "Dimensiones",
    attributes: [
        { id: "1", attribute: "Attribute", attributeGroup: "" },
        { id: "2", attribute: "Attribute group", attributeGroup: "" },
    ],
    status: "Active",
    creatorUserName: "Bruno Bellini",
    creatorUserEmail: "bruno.bellini@fiz...",
    createdAt: "25/01/2022 12:18:00",
};

export default function SetAtributosResumenView() {
    const { id } = useParams();
    const router = useRouter();

    const [attrSet, setAttrSet] = useState<AttributeSet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSet = async () => {
            if (!id) return;
            setLoading(true);
            try {
                await new Promise((r) => setTimeout(r, 400));
                setAttrSet({ ...MOCK_SET, id: id as string });
            } catch (err: any) {
                setError(`Error al cargar: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchSet();
    }, [id]);

    const handleChange = useCallback(
        (field: keyof AttributeSet, value: any) => {
            setAttrSet((prev) => (prev ? { ...prev, [field]: value } : prev));
        },
        []
    );

    const handleAddAttribute = useCallback(() => {
        setAttrSet((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                attributes: [
                    ...prev.attributes,
                    { id: `new-${Date.now()}`, attribute: "", attributeGroup: "" },
                ],
            };
        });
    }, []);

    const handleRemoveAttribute = useCallback((attrId: string) => {
        setAttrSet((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                attributes: prev.attributes.filter((a) => a.id !== attrId),
            };
        });
    }, []);

    const handleSave = useCallback(async () => {
        if (!attrSet) return;
        console.log("[SAVE]", attrSet);
        router.push("/catalogo/set-atributos");
    }, [attrSet, router]);

    const handleApply = useCallback(async () => {
        if (!attrSet) return;
        console.log("[APPLY]", attrSet);
    }, [attrSet]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Apply",
                variant: "primary",
                onClick: handleApply,
                icon: <CheckCircleIcon className="h-5 w-5" />,
            },
            {
                label: "Save",
                variant: "success",
                onClick: handleSave,
                icon: <SaveOutlined className="h-4 w-4" />,
            },
            {
                label: "Save & Create",
                variant: "primary",
                onClick: async () => {
                    await handleSave();
                    router.push("/catalogo/set-atributos/nuevo");
                },
                icon: <SaveWithPlusIcon />,
            },
            {
                label: "Cancel",
                variant: "secondary",
                onClick: () => router.push("/catalogo/set-atributos"),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [handleApply, handleSave, router]
    );

    usePageHeader(
        () => ({
            title: attrSet ? attrSet.name : "Cargando…",
            action: headerActions,
            status: attrSet
                ? { text: attrSet.status, variant: attrSet.status === "Active" ? "success" : "warning" }
                : undefined,
        }),
        [attrSet, headerActions]
    );

    if (loading) {
        return (
            <div className="flex w-full items-center justify-center py-10">
                <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-500">Cargando…</span>
            </div>
        );
    }

    if (error || !attrSet) {
        return <p className="p-4 text-center text-red-500">{error || "No encontrado."}</p>;
    }

    return (
        <div className="flex-1 bg-white p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
                {/* Columna izquierda */}
                <div className="space-y-6">
                    <Card title="DETAIL" icon={DocumentTextIcon}>
                        <div className="space-y-1">
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                                <span className="text-sm text-gray-500">Ref ID</span>
                                <input
                                    type="text"
                                    value={attrSet.refId}
                                    onChange={(e) => handleChange("refId", e.target.value)}
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                                <span className="text-sm text-gray-500">Name</span>
                                <input
                                    type="text"
                                    value={attrSet.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            </div>

                            {/* Attributes list */}
                            <div className="py-3">
                                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                                    <span className="text-sm text-gray-500 pt-2">Attributes</span>
                                    <div className="space-y-2">
                                        {attrSet.attributes.map((pair) => (
                                            <div key={pair.id} className="flex items-center gap-2">
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={pair.attribute}
                                                        placeholder="Attribute"
                                                        readOnly
                                                        className="rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={pair.attributeGroup}
                                                        placeholder="Attribute group"
                                                        readOnly
                                                        className="rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAttribute(pair.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={handleAddAttribute}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-600"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            New
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Columna derecha */}
                <div className="space-y-6">
                    <Card title="OTHERS" icon={DocumentTextIcon}>
                        <div className="space-y-1">
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4 py-3">
                                <span className="text-sm text-gray-500">Status</span>
                                <CollapsibleField
                                    label=""
                                    value={attrSet.status}
                                    options={["Active", "Inactive"]}
                                    onChange={(val) => handleChange("status", val)}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card title="CREATOR USER" icon={UserIcon}>
                        <div className="space-y-3 py-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                                    {attrSet.creatorUserName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">{attrSet.creatorUserName}</span>
                                    <span className="block text-xs text-gray-400">{attrSet.creatorUserEmail}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs italic text-gray-400">{attrSet.createdAt}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
