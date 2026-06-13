// features/catalogo/pages/plataforma-ecommerce/shared/productos/base/views/MarketplaceProductosDetail.tsx

"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { Action } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import TextField from "@mui/material/TextField";
import {
    RefreshCw,
    XCircle,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    AlignLeft,
    AlignCenter,
    AlignRight,
    ListOrdered,
    Link,
    Undo2,
    Redo2,
    Ban,
} from "lucide-react";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { ActiveStatusToggle } from "@/components/ui/togle/status-toggle";
import type { CampoBasico } from "../types/detail-types";
import { useMarketplaceProductoDetailData } from "../hooks/useMarketplaceProductoDetailData";
import { resolveMarketplaceKey } from "../utils/marketplace";

const formatFieldLabel = (key: string): string => {
    const map: Record<string, string> = {
        titulo: "Titulo",
        precio: "Precio",
        stock: "Stock",
        estado: "Estado",
        descripcion: "Descripcion",
    };
    return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const normalizeToHtml = (value: string): string => {
    if (!value) return "";
    if (value.includes("<") && value.includes(">")) return value;
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r\n|\r|\n/g, "<br>");
};

const RichTextField = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (nextValue: string) => void;
}) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const savedSelectionRef = useRef<Range | null>(null);
    const [showSource, setShowSource] = useState(false);

    useEffect(() => {
        if (!editorRef.current) return;
        const nextHtml = normalizeToHtml(value || "");
        if (editorRef.current.innerHTML !== nextHtml) {
            editorRef.current.innerHTML = nextHtml;
        }
    }, [value]);

    const saveSelection = useCallback(() => {
        if (!editorRef.current || showSource) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (!editorRef.current.contains(range.commonAncestorContainer)) return;
        savedSelectionRef.current = range.cloneRange();
    }, [showSource]);

    const restoreSelection = useCallback(() => {
        if (!editorRef.current || showSource) return false;
        editorRef.current.focus();

        const selection = window.getSelection();
        if (!selection) return false;

        if (savedSelectionRef.current) {
            selection.removeAllRanges();
            selection.addRange(savedSelectionRef.current);
            return true;
        }

        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
    }, [showSource]);

    useEffect(() => {
        const onSelectionChange = () => saveSelection();
        document.addEventListener("selectionchange", onSelectionChange);
        return () => document.removeEventListener("selectionchange", onSelectionChange);
    }, [saveSelection]);

    const applyCommand = useCallback((command: string, commandValue?: string) => {
        if (!editorRef.current || showSource) return;
        restoreSelection();

        // Keep inline styles so font size and colors render consistently.
        document.execCommand("styleWithCSS", false, "true");

        if (command === "hiliteColor") {
            const ok = document.execCommand("hiliteColor", false, commandValue);
            if (!ok) {
                document.execCommand("backColor", false, commandValue);
            }
        } else {
            document.execCommand(command, false, commandValue);
        }

        saveSelection();
        onChange(editorRef.current.innerHTML || "");
    }, [onChange, restoreSelection, saveSelection, showSource]);

    const applyLink = useCallback(() => {
        if (showSource) return;
        restoreSelection();
        const url = window.prompt("Ingresa la URL", "https://");
        if (!url) return;
        applyCommand("createLink", url);
    }, [applyCommand, restoreSelection, showSource]);

    const applyImage = useCallback(() => {
        if (showSource) return;
        restoreSelection();
        const url = window.prompt("URL de la imagen", "https://");
        if (!url) return;
        applyCommand("insertImage", url);
    }, [applyCommand, restoreSelection, showSource]);

    const applyTextColor = useCallback((color: string) => {
        applyCommand("foreColor", color);
    }, [applyCommand]);

    const applyBackgroundColor = useCallback((color: string) => {
        applyCommand("hiliteColor", color);
    }, [applyCommand]);

    const applyFontSize = useCallback((size: string) => {
        const sizeMap: Record<string, string> = {
            "10": "2",
            "12": "3",
            "14": "4",
            "16": "5",
            "18": "6",
        };
        applyCommand("fontSize", sizeMap[size] || "3");
    }, [applyCommand]);

    const insertTable = useCallback(() => {
        applyCommand(
            "insertHTML",
            '<table border="1" style="border-collapse:collapse;width:100%"><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p></p>'
        );
    }, [applyCommand]);

    const toolbarBtnClass =
        "inline-flex h-8 min-w-8 items-center justify-center rounded border border-transparent px-1.5 text-gray-700 transition hover:border-gray-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40";

    const ToolbarButton = ({
        title,
        onClick,
        children,
    }: {
        title: string;
        onClick: () => void;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            disabled={showSource}
            className={toolbarBtnClass}
            title={title}
            onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
            }}
            onClick={onClick}
        >
            {children}
        </button>
    );

    return (
        <div className="w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
            <div className="overflow-x-auto border-b border-gray-200 bg-gray-50">
                <div className="flex min-w-max items-center gap-1 px-2 py-1.5">
                    <select
                        className="h-7 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
                        defaultValue="12"
                        title="Tamaño de fuente"
                        disabled={showSource}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            saveSelection();
                        }}
                        onChange={(e) => applyFontSize(e.target.value)}
                    >
                        <option value="10">10pt</option>
                        <option value="12">12pt</option>
                        <option value="14">14pt</option>
                        <option value="16">16pt</option>
                        <option value="18">18pt</option>
                    </select>

                    <span className="mx-1 h-5 w-px bg-gray-200" />

                    <ToolbarButton title="Negrita" onClick={() => applyCommand("bold")}>
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Cursiva" onClick={() => applyCommand("italic")}>
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Subrayado" onClick={() => applyCommand("underline")}>
                        <Underline className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Tachado" onClick={() => applyCommand("strikeThrough")}>
                        <Strikethrough className="h-4 w-4" />
                    </ToolbarButton>

                    <span className="mx-1 h-5 w-px bg-gray-200" />

                    <ToolbarButton title="Lista" onClick={() => applyCommand("insertUnorderedList")}>
                        <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Lista numerada" onClick={() => applyCommand("insertOrderedList")}>
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Alinear izquierda" onClick={() => applyCommand("justifyLeft")}>
                        <AlignLeft className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Centrar" onClick={() => applyCommand("justifyCenter")}>
                        <AlignCenter className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Alinear derecha" onClick={() => applyCommand("justifyRight")}>
                        <AlignRight className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Justificar" onClick={() => applyCommand("justifyFull")}>
                        J
                    </ToolbarButton>

                    <span className="mx-1 h-5 w-px bg-gray-200" />

                    <ToolbarButton title="Insertar link" onClick={applyLink}>
                        <Link className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Insertar imagen" onClick={applyImage}>
                        IMG
                    </ToolbarButton>
                    <ToolbarButton title="Linea horizontal" onClick={() => applyCommand("insertHorizontalRule")}>
                        HR
                    </ToolbarButton>
                    <ToolbarButton title="Tabla" onClick={insertTable}>
                        TAB
                    </ToolbarButton>
                    <ToolbarButton title="Disminuir sangria" onClick={() => applyCommand("outdent")}>
                        {"<-"}
                    </ToolbarButton>
                    <ToolbarButton title="Aumentar sangria" onClick={() => applyCommand("indent")}>
                        {"->"}
                    </ToolbarButton>

                    <span className="mx-1 h-5 w-px bg-gray-200" />

                    <ToolbarButton title="Deshacer" onClick={() => applyCommand("undo")}>
                        <Undo2 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Rehacer" onClick={() => applyCommand("redo")}>
                        <Redo2 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton title="Limpiar formato" onClick={() => applyCommand("removeFormat")}>
                        <Ban className="h-4 w-4" />
                    </ToolbarButton>

                    <span className="mx-1 h-5 w-px bg-gray-200" />

                    <label className="inline-flex h-7 items-center gap-1 rounded border border-transparent px-1.5 text-xs text-gray-700 hover:border-gray-300 hover:bg-white" title="Color de texto" onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}>
                        A
                        <input
                            type="color"
                            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                            disabled={showSource}
                            onChange={(e) => applyTextColor(e.target.value)}
                        />
                    </label>
                    <label className="inline-flex h-7 items-center gap-1 rounded border border-transparent px-1.5 text-xs text-gray-700 hover:border-gray-300 hover:bg-white" title="Color de fondo" onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}>
                        Bg
                        <input
                            type="color"
                            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                            disabled={showSource}
                            onChange={(e) => applyBackgroundColor(e.target.value)}
                        />
                    </label>

                    <button
                        type="button"
                        className="inline-flex h-7 items-center justify-center rounded border border-transparent px-1.5 text-xs text-gray-700 transition hover:border-gray-300 hover:bg-white"
                        title="Codigo fuente"
                        onClick={() => setShowSource((prev) => !prev)}
                    >
                        {"</>"}
                    </button>
                </div>
            </div>

            {showSource ? (
                <textarea
                    className="min-h-[220px] w-full resize-y border-0 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800 focus:outline-none"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[220px] w-full px-3 py-3 text-sm leading-6 text-gray-800 focus:outline-none"
                    onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
                />
            )}
        </div>
    );
};

export function MarketplaceProductosDetail() {
    const params = useParams();
    const router = useRouter();
    const platform = useEcommercePlatform();
    const BASE_ROUTE = `${platform.basePath}/productos`;
    const marketplaceKey = useMemo(() => resolveMarketplaceKey(platform.name), [platform.name]);

    const itemCode = params?.id as string;

    const {
        product,
        editFields,
        editRef,
        loading,
        error,
        fetchProduct,
        handleFieldChange,
    } = useMarketplaceProductoDetailData(itemCode, marketplaceKey);

    // Header actions
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Recargar",
                variant: "primary",
                icon: <RefreshCw className="h-5 w-5" />,
                onClick: () => {
                    fetchProduct({ force: true });
                },
            },
            {
                label: "Cancelar",
                variant: "secondary",
                icon: <XCircle className="h-5 w-5" />,
                onClick: () => router.push(BASE_ROUTE),
            },
        ],
        [router, fetchProduct, BASE_ROUTE]
    );

    const title = useMemo(() => {
        const raw = editFields.titulo;
        const titulo = typeof raw === "string" ? raw : "";
        return titulo ? `${titulo} (${itemCode})` : `Producto ${itemCode}`;
    }, [editFields.titulo, itemCode]);

    usePageHeader(
        () => ({
            title,
            action: headerActions,
        }),
        [title, headerActions]
    );

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500">
                <RefreshCw className="h-5 w-5 inline animate-spin mr-2" />
                Cargando producto…
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md">
                    <p className="text-sm font-medium">
                        {error || "Producto no encontrado"}
                    </p>
                    <button
                        onClick={() => router.push(BASE_ROUTE)}
                        className="mt-2 text-sm underline"
                    >
                        Volver al listado
                    </button>
                </div>
            </div>
        );
    }

    const imageUrl =
        product.imagenes?.lista?.[0] ||
        "https://tumayorferretero.net/22457-large_default/producto-generico.jpg";

    const basicFields = Object.entries(product.campos_basicos || {});
    const renderBasicField = (key: string, field: CampoBasico) => {
        const value = editRef.current[key];
        const isEditable = !!field.editable;

        if (key === "estado") {
            const statusValue = String(value ?? "").toLowerCase();
            const isActive = statusValue === "active" || statusValue === "activo" || statusValue === "y";
            return (
                <ActiveStatusToggle
                    active={isActive}
                    disabled={false}
                    showStateLabel={false}
                    onActiveChange={(nextActive) => {
                        if (!isEditable) return;
                        handleFieldChange(key, nextActive ? "active" : "inactive");
                    }}
                />
            );
        }

        if (!isEditable || field.tipo === "badge") {
            const text = value === null || value === undefined || value === "" ? "-" : String(value);
            return <span className="text-sm text-gray-700">{text}</span>;
        }

        if (field.tipo === "textarea") {
            return (
                <RichTextField
                    value={String(value ?? "")}
                    onChange={(nextValue) => handleFieldChange(key, nextValue)}
                />
            );
        }

        if (field.tipo === "number") {
            const isCompactNumeric = key === "precio" || key === "stock";
            return (
                <TextField
                    size="small"
                    fullWidth={!isCompactNumeric}
                    type="number"
                    value={value ?? ""}
                    onChange={(e) => handleFieldChange(key, e.target.value === "" ? "" : Number(e.target.value))}
                    sx={isCompactNumeric ? { width: { xs: "100%", sm: 220 } } : undefined}
                />
            );
        }

        if (field.tipo === "boolean") {
            return (
                <select
                    value={String(Boolean(value))}
                    onChange={(e) => handleFieldChange(key, e.target.value === "true")}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                    <option value="true">Si</option>
                    <option value="false">No</option>
                </select>
            );
        }

        return (
            <TextField
                size="small"
                fullWidth
                value={value ?? ""}
                onChange={(e) => handleFieldChange(key, e.target.value)}
            />
        );
    };

    return (
        <div className="space-y-4 p-3 sm:space-y-6 sm:p-6">
            <div className="grid w-full grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <Card title="Imagen" className="order-2 h-fit self-start xl:order-1">
                    <div className="flex min-h-[180px] items-center justify-center rounded-md bg-gradient-to-b from-gray-50 to-gray-100 p-3 sm:min-h-[220px] sm:p-4">
                        <img
                            src={imageUrl}
                            alt={String(editFields.titulo || product.sku || "Producto")}
                            className="max-h-52 w-auto max-w-full object-contain rounded-md sm:max-h-64"
                        />
                    </div>
                </Card>

                <div className="order-1 min-w-0 xl:order-2">
                    <Card title="Información general">
                        <FieldRows label="SKU / ItemCode" className="border-b border-gray-300">
                            <span className="text-sm text-gray-600">{product.sku || itemCode}</span>
                        </FieldRows>
                        <FieldRows label="Marketplace ID" className="border-b border-gray-300">
                            <span className="text-sm text-gray-600">{product.item_id || "-"}</span>
                        </FieldRows>
                        <FieldRows label="URL" className="border-b border-gray-300">
                            {product.url_producto ? (
                                <a
                                    href={product.url_producto}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-600 underline break-all"
                                >
                                    {product.url_producto}
                                </a>
                            ) : (
                                <span className="text-sm text-gray-600">-</span>
                            )}
                        </FieldRows>
                        {basicFields.map(([key, field], index) => (
                            <FieldRows
                                key={key}
                                label={formatFieldLabel(key)}
                                className={
                                    index < basicFields.length - 1 && !["precio", "stock", "estado"].includes(key)
                                        ? "border-b border-gray-200"
                                        : undefined
                                }
                            >
                                <div className="w-full space-y-2">
                                    {key === "precio" || key === "stock" ? (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                            <div className="sm:flex-none">{renderBasicField(key, field)}</div>
                                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                                                {field.editable && (
                                                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                                                        Editable
                                                    </span>
                                                )}
                                                {key === "precio" && field.advertencia && (
                                                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                                                        {field.advertencia}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        renderBasicField(key, field)
                                    )}
                                    {key !== "titulo" && key !== "precio" && field.razon && <p className="text-xs text-amber-600">{field.razon}</p>}
                                    {key !== "titulo" && key !== "precio" && field.advertencia && <p className="text-xs text-amber-600">{field.advertencia}</p>}
                                </div>
                            </FieldRows>
                        ))}
                    </Card>
                </div>
            </div>
        </div>
    );
}

