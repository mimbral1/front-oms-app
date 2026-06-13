"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon, DocumentTextIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

interface AttributePair {
    id: string;
    attribute: string;
    attributeGroup: string;
}

interface NewSet {
    refId: string;
    name: string;
    attributes: AttributePair[];
    status: "Active" | "Inactive";
}

const initialRecord: NewSet = {
    refId: "",
    name: "",
    attributes: [],
    status: "Active",
};

export default function SetAtributosNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<NewSet>({ ...initialRecord });

    const handleChange = (field: keyof NewSet, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const handleAddAttribute = () => {
        setRecord((prev) => ({
            ...prev,
            attributes: [
                ...prev.attributes,
                { id: `new-${Date.now()}`, attribute: "", attributeGroup: "" },
            ],
        }));
    };

    const handleRemoveAttribute = (id: string) => {
        setRecord((prev) => ({
            ...prev,
            attributes: prev.attributes.filter((a) => a.id !== id),
        }));
    };

    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        if (!current.name || !current.refId) {
            console.warn("Validación: nombre y Ref ID requeridos");
            return;
        }
        await new Promise((r) => setTimeout(r, 600));
        setRecord({ ...initialRecord });
        router.push("/catalogo/set-atributos");
    }, [router]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Save",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: handleCreate,
            },
            {
                label: "Save & Create",
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
                label: "Cancel",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/set-atributos"),
            },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">ATTRIBUTE SET</div>
                    <div className="text-2xl font-semibold text-gray-900">New</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="bg-white p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                    <Card title="DETAIL" icon={DocumentTextIcon}>
                        <div className="space-y-1">
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                                <span className="text-sm text-gray-500">Ref ID</span>
                                <input
                                    type="text"
                                    value={record.refId}
                                    onChange={(e) => handleChange("refId", e.target.value)}
                                    placeholder="Identificador único"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                                <span className="text-sm text-gray-500">Name</span>
                                <input
                                    type="text"
                                    value={record.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Nombre del set"
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            </div>

                            <div className="py-3">
                                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                                    <span className="text-sm text-gray-500 pt-2">Attributes</span>
                                    <div className="space-y-2">
                                        {record.attributes.map((pair) => (
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

                <div className="space-y-6">
                    <Card title="OTHERS" icon={DocumentTextIcon}>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-4 py-3">
                            <span className="text-sm text-gray-500">Status</span>
                            <CollapsibleField
                                label=""
                                value={record.status}
                                options={["Active", "Inactive"]}
                                onChange={(val) => handleChange("status", val)}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
