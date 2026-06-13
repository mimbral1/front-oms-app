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
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useFetchWithAuth } from "@/lib/http/client";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import {
    Autocomplete,
    TextField,
    Chip,
} from "@mui/material";

const TypedFaPlus = FaPlus as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const SaveWithPlusIcon = () => (
    <div className="relative flex h-5 w-5 items-center justify-center">
        <SaveOutlined className="h-4 w-4 text-current" />
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
            <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
        </div>
    </div>
);

interface AttributeGroup {
    id: string;
    name: string;
    refId: string;
    accounts: string[];
    status: "Active" | "Inactive";
    creatorUserName: string;
    creatorUserEmail: string;
    createdAt: string;
}

const MOCK_GROUP: AttributeGroup = {
    id: "1",
    name: "Dimensiones",
    refId: "DIM-123",
    accounts: ["Fizzmod QA"],
    status: "Active",
    creatorUserName: "Bruno Bellini",
    creatorUserEmail: "bruno.bellini@fiz...",
    createdAt: "25/01/2022 12:00:30",
};

const ACCOUNT_OPTIONS = [
    { label: "Fizzmod QA", value: "Fizzmod QA" },
    { label: "Mimbral", value: "Mimbral" },
    { label: "La Torre", value: "La Torre" },
];

export default function GrupoAtributosResumenView() {
    const { id } = useParams();
    const router = useRouter();
    const { fetchWithAuth, token } = useFetchWithAuth();

    const [group, setGroup] = useState<AttributeGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGroup = async () => {
            if (!id) return;
            setLoading(true);
            try {
                await new Promise((r) => setTimeout(r, 400));
                setGroup({ ...MOCK_GROUP, id: id as string });
            } catch (err: any) {
                setError(`Error al cargar: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchGroup();
    }, [id, token, fetchWithAuth]);

    const handleChange = useCallback(
        (field: keyof AttributeGroup, value: any) => {
            setGroup((prev) => (prev ? { ...prev, [field]: value } : prev));
        },
        []
    );

    const handleSave = useCallback(async () => {
        if (!group) return;
        console.log("[SAVE]", group);
        router.push("/catalogo/grupo-atributos");
    }, [group, router]);

    const handleApply = useCallback(async () => {
        if (!group) return;
        console.log("[APPLY]", group);
    }, [group]);

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
                    router.push("/catalogo/grupo-atributos/nuevo");
                },
                icon: <SaveWithPlusIcon />,
            },
            {
                label: "Cancel",
                variant: "secondary",
                onClick: () => router.push("/catalogo/grupo-atributos"),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [handleApply, handleSave, router]
    );

    usePageHeader(
        () => ({
            title: group ? group.name : "Cargando…",
            action: headerActions,
            status: group
                ? { text: group.status, variant: group.status === "Active" ? "success" : "warning" }
                : undefined,
        }),
        [group, headerActions]
    );

    if (loading) {
        return (
            <div className="flex w-full items-center justify-center py-10">
                <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-500">Cargando…</span>
            </div>
        );
    }

    if (error || !group) {
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
                                <span className="text-sm text-gray-500">Name</span>
                                <input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                                <span className="text-sm text-gray-500">Ref ID</span>
                                <input
                                    type="text"
                                    value={group.refId}
                                    onChange={(e) => handleChange("refId", e.target.value)}
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                                <span className="text-sm text-gray-500">Accounts</span>
                                <Autocomplete
                                    multiple
                                    size="small"
                                    options={ACCOUNT_OPTIONS}
                                    getOptionLabel={(opt) => opt.label}
                                    value={ACCOUNT_OPTIONS.filter((o) => group.accounts.includes(o.value))}
                                    onChange={(_, selected) => handleChange("accounts", selected.map((s) => s.value))}
                                    renderTags={(tagValue, getTagProps) =>
                                        tagValue.map((option, index) => {
                                            const { key, ...restProps } = getTagProps({ index });
                                            return <Chip key={key} label={option.label} size="small" {...restProps} />;
                                        })
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="standard"
                                            placeholder="Seleccionar cuentas"
                                            InputProps={{ ...params.InputProps, disableUnderline: true }}
                                        />
                                    )}
                                    fullWidth
                                    disableCloseOnSelect
                                />
                            </div>

                            <div className="grid grid-cols-[140px_1fr] items-center gap-4 py-3">
                                <span className="text-sm text-gray-500">Status</span>
                                <CollapsibleField
                                    label=""
                                    value={group.status}
                                    options={["Active", "Inactive"]}
                                    onChange={(val) => handleChange("status", val)}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Columna derecha */}
                <div className="space-y-6">
                    <Card title="CREATOR USER" icon={UserIcon}>
                        <div className="space-y-3 py-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                                    {group.creatorUserName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">{group.creatorUserName}</span>
                                    <span className="block text-xs text-gray-400">{group.creatorUserEmail}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs italic text-gray-400">{group.createdAt}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
