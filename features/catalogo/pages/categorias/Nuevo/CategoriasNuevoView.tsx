"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus, FaClipboardList, FaPen } from "react-icons/fa";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import {
    Chip as MuiChip,
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent,
} from "@mui/material";

interface NewCategory {
    name: string;
    reference: string;
    parent: string;
    accounts: string[];
    slug: string;
    status: "Active" | "Inactive";
    seoTitle: string;
    seoKeywords: string;
    seoDescription: string;
}

const initialRecord: NewCategory = {
    name: "",
    reference: "",
    parent: "",
    accounts: [],
    slug: "",
    status: "Active",
    seoTitle: "",
    seoKeywords: "",
    seoDescription: "",
};

const ACCOUNT_OPTIONS = ["La Torre", "Mimbral", "Marketplace"];

const TypedFaPlus = FaPlus as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const SaveWithPlusIcon = () => (
    <div className="relative flex h-5 w-5 items-center justify-center">
        <SaveOutlined className="h-4 w-4 text-current" />
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
            <TypedFaPlus className="h-2.5 w-2.5 text-blue-500" />
        </div>
    </div>
);

export default function CategoriasNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<NewCategory>({ ...initialRecord });

    const handleChange = (field: keyof NewCategory, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        if (!current.name || !current.reference) {
            console.warn("Validación: nombre y referencia requeridos");
            return;
        }
        await new Promise((r) => setTimeout(r, 600));
        router.push("/catalogo/categorias");
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
                icon: <SaveWithPlusIcon />,
                onClick: async () => {
                    await handleCreate();
                    setRecord({ ...initialRecord });
                },
            },
            {
                label: "Cancel",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/categorias"),
            },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">CATEGORY</div>
                    <div className="text-2xl font-semibold text-gray-900">New</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    const handleAccountsChange = (event: SelectChangeEvent<string[]>) => {
        handleChange("accounts", event.target.value as string[]);
    };

    return (
        <div className="flex-1 bg-white p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card
                        title="DETAIL"
                        icon={FaClipboardList}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl bg-white p-6 shadow-sm"
                    >
                        <div className="space-y-10">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Name</span>
                                <input
                                    type="text"
                                    value={record.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Nombre de la categoría"
                                    className="text-right text-sm font-medium text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Reference</span>
                                <input
                                    type="text"
                                    value={record.reference}
                                    onChange={(e) => handleChange("reference", e.target.value)}
                                    placeholder="Referencia única"
                                    className="text-right text-sm font-medium text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Parent</span>
                                <input
                                    type="text"
                                    value={record.parent}
                                    onChange={(e) => handleChange("parent", e.target.value)}
                                    placeholder="Categoría padre"
                                    className="text-right text-sm font-medium text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Accounts</span>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <Select
                                        multiple
                                        value={record.accounts}
                                        onChange={handleAccountsChange}
                                        displayEmpty
                                        renderValue={(selected) =>
                                            selected.length === 0 ? (
                                                <span className="text-gray-400 text-sm">Select accounts</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {selected.map((v) => (
                                                        <MuiChip key={v} label={v} size="small" />
                                                    ))}
                                                </div>
                                            )
                                        }
                                        sx={{ fontSize: "0.875rem" }}
                                    >
                                        {ACCOUNT_OPTIONS.map((opt) => (
                                            <MenuItem key={opt} value={opt}>
                                                {opt}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>

                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Slug</span>
                                <input
                                    type="text"
                                    value={record.slug}
                                    onChange={(e) => handleChange("slug", e.target.value)}
                                    placeholder="slug-de-categoria"
                                    className="text-right text-sm font-medium text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none"
                                />
                            </div>

                            <CollapsibleField
                                label="Status"
                                value={record.status}
                                options={["Active", "Inactive"]}
                                onChange={(val) => handleChange("status", val)}
                            />
                        </div>
                    </Card>

                    <Card
                        title="SEO"
                        icon={GlobeAltIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl bg-white p-6 shadow-sm"
                    >
                        <div className="space-y-10">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Title</span>
                                <input
                                    type="text"
                                    value={record.seoTitle}
                                    onChange={(e) => handleChange("seoTitle", e.target.value)}
                                    placeholder="SEO Title"
                                    className="text-right text-sm font-medium text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Keywords</span>
                                <input
                                    type="text"
                                    value={record.seoKeywords}
                                    onChange={(e) => handleChange("seoKeywords", e.target.value)}
                                    placeholder="SEO Keywords"
                                    className="text-right text-sm font-medium text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Description</span>
                                <input
                                    type="text"
                                    value={record.seoDescription}
                                    onChange={(e) => handleChange("seoDescription", e.target.value)}
                                    placeholder="SEO Description"
                                    className="text-right text-sm font-medium text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <Card
                        title="CREATOR USER"
                        icon={FaPen}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl bg-white p-6 shadow-sm"
                    >
                        <div className="flex flex-col space-y-4 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                                <span>User</span>
                                <span className="font-medium text-gray-400">—</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Created at</span>
                                <span className="font-medium text-gray-400">—</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
