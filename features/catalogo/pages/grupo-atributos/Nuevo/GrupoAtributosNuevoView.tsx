"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import Card from "@/components/ui/card/Card";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { Autocomplete, TextField, Chip } from "@mui/material";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

const ACCOUNT_OPTIONS = [
    { label: "Fizzmod QA", value: "Fizzmod QA" },
    { label: "Mimbral", value: "Mimbral" },
    { label: "La Torre", value: "La Torre" },
];

interface NewGroup {
    name: string;
    refId: string;
    accounts: string[];
    status: "Active" | "Inactive";
}

const initialRecord: NewGroup = {
    name: "",
    refId: "",
    accounts: [],
    status: "Active",
};

export default function GrupoAtributosNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<NewGroup>({ ...initialRecord });

    const handleChange = (field: keyof NewGroup, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

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
        router.push("/catalogo/grupo-atributos");
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
                onClick: () => router.push("/catalogo/grupo-atributos"),
            },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">ATTRIBUTE GROUPS</div>
                    <div className="text-2xl font-semibold text-gray-900">New</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="bg-white p-6">
            <Card title="DETAIL" icon={DocumentTextIcon}>
                <div className="space-y-1">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
                        <span className="text-sm text-gray-500">Name</span>
                        <input
                            type="text"
                            value={record.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Nombre del grupo"
                            className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                        />
                    </div>
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
                        <span className="text-sm text-gray-500">Accounts</span>
                        <Autocomplete
                            multiple
                            size="small"
                            options={ACCOUNT_OPTIONS}
                            getOptionLabel={(opt) => opt.label}
                            value={ACCOUNT_OPTIONS.filter((o) => record.accounts.includes(o.value))}
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
                            value={record.status}
                            options={["Active", "Inactive"]}
                            onChange={(val) => handleChange("status", val)}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
