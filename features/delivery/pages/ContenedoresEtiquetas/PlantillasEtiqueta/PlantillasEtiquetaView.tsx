"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

type FormatoEtiqueta = "PDF" | "ZPL";

type Plantilla = {
    id: string;
    nombre: string;
    formato: FormatoEtiqueta;
    htmlCss: string;
    asociacion: string;
    activa: boolean;
};

type PlantillaFilters = {
    search: string;
    formato: string;
};

const ASOCIACIONES = [
    "Envío estándar",
    "Envío express",
    "Bluexpress",
    "Chilexpress",
    "Integración propia",
];

const LABEL_TEMPLATE_LIST_URL = `${BASE_DELIVERY_SERVICE}/label-template`;
const ITEMS_PER_PAGE = 10;

const INITIAL_TEMPLATES: Plantilla[] = [
    {
        id: "TPL-001",
        nombre: "Etiqueta envío estándar",
        formato: "PDF",
        htmlCss: "<div class='label'><h1>{{orderId}}</h1></div>",
        asociacion: "Envío estándar",
        activa: true,
    },
    {
        id: "TPL-002",
        nombre: "Etiqueta operador Bluexpress",
        formato: "ZPL",
        htmlCss: "^XA^FO50,50^A0N,30,30^FD{{tracking}}^FS^XZ",
        asociacion: "Bluexpress",
        activa: true,
    },
];

const initialFilters: PlantillaFilters = {
    search: "",
    formato: "",
};

const filterConfig: FilterConfig<PlantillaFilters, Plantilla>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.nombre} ${row.asociacion}`
                .toLowerCase()
                .includes(String(value ?? "").trim().toLowerCase()),
    },
    {
        id: "formato",
        label: "Formato",
        type: "select",
        options: [
            { label: "PDF", value: "PDF" },
            { label: "ZPL", value: "ZPL" },
        ],
        rowValue: (row) => row.formato,
    },
];

const getColumns = (onEdit: (template: Plantilla) => void): Column<Plantilla>[] => [
    {
        header: "Nombre",
        accessorKey: "nombre",
        cell: (template) => (
            <div className="min-h-[48px] leading-tight">
                <div className="text-sm font-semibold text-slate-800">{template.nombre}</div>
                <div className="mt-1 text-xs text-slate-500">ID {template.id}</div>
            </div>
        ),
    },
    {
        header: "Formato",
        accessorKey: "formato",
        cell: (template) => (
            <div className="min-h-[48px] leading-tight">
                <div className="text-sm text-slate-800">{template.formato}</div>
                <div className="mt-1 text-xs text-slate-500">Template activo</div>
            </div>
        ),
    },
    {
        header: "Asociación",
        accessorKey: "asociacion",
        cell: (template) => (
            <div className="min-h-[48px] leading-tight">
                <div className="text-sm text-slate-800">{template.asociacion}</div>
                <div className="mt-1 text-xs text-slate-500">Canal/Integración</div>
            </div>
        ),
    },
    {
        header: "Estado",
        accessorKey: "activa",
        cell: (template) => (
            <div className="flex min-h-[48px] items-center">
                <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${template.activa ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}
                >
                    {template.activa ? "Activa" : "Inactiva"}
                </span>
            </div>
        ),
    },
    {
        header: "",
        accessorKey: "id",
        cell: (template) => (
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onEdit(template);
                    }}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                    Editar
                </button>
            </div>
        ),
    },
];

export default function PlantillasEtiquetaView() {
    const [templates, setTemplates] = useState<Plantilla[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [nombre, setNombre] = useState("");
    const [formato, setFormato] = useState<FormatoEtiqueta>("PDF");
    const [htmlCss, setHtmlCss] = useState("<div class='label'></div>");
    const [asociacion, setAsociacion] = useState(ASOCIACIONES[0]);
    const [activa, setActiva] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<PlantillaFilters, Plantilla>({
            initialFilters,
            configs: filterConfig,
        });

    const mapTemplateRow = useCallback((raw: any, index: number): Plantilla => {
        const rawId = raw?.id ?? raw?._id ?? raw?.Id ?? raw?.templateId ?? raw?.template_id;
        const rawNombre = raw?.name ?? raw?.nombre ?? raw?.title ?? raw?.templateName ?? raw?.template_name;
        const rawFormato = String(raw?.format ?? raw?.formato ?? raw?.type ?? "PDF").toUpperCase();
        const rawTemplate = raw?.template ?? raw?.htmlCss ?? raw?.html_css ?? raw?.body ?? "";
        const rawAsociacion = raw?.association ?? raw?.asociacion ?? raw?.integration ?? raw?.shippingType;
        const rawActive = raw?.active ?? raw?.activa ?? raw?.isActive ?? raw?.enabled;

        return {
            id: String(rawId ?? `TPL-${String(index + 1).padStart(3, "0")}`),
            nombre: String(rawNombre ?? `Plantilla ${index + 1}`),
            formato: rawFormato === "ZPL" ? "ZPL" : "PDF",
            htmlCss: String(rawTemplate ?? ""),
            asociacion: String(rawAsociacion ?? "Integración propia"),
            activa: typeof rawActive === "boolean" ? rawActive : true,
        };
    }, []);

    const loadTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError(null);

            const response = await fetch(LABEL_TEMPLATE_LIST_URL, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al obtener plantillas`);
            }

            const payload = await response.json();
            const rows = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.items)
                        ? payload.items
                        : [];

            setTemplates(rows.map((row: any, index: number) => mapTemplateRow(row, index)));
            setCurrentPage(1);
        } catch (error: any) {
            setLoadError(error?.message || "No se pudieron cargar las plantillas.");
            setTemplates(INITIAL_TEMPLATES);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }, [mapTemplateRow]);

    useEffect(() => {
        void loadTemplates();
    }, [loadTemplates]);

    const resetForm = useCallback(() => {
        setSelectedId(null);
        setIsCreating(false);
        setNombre("");
        setFormato("PDF");
        setHtmlCss("<div class='label'></div>");
        setAsociacion(ASOCIACIONES[0]);
        setActiva(true);
    }, []);

    const startCreate = useCallback(() => {
        setSelectedId(null);
        setIsCreating(true);
        setNombre("");
        setFormato("PDF");
        setHtmlCss("<div class='label'></div>");
        setAsociacion(ASOCIACIONES[0]);
        setActiva(true);
    }, []);

    const handleEdit = useCallback((template: Plantilla) => {
        setIsCreating(false);
        setSelectedId(template.id);
        setNombre(template.nombre);
        setFormato(template.formato);
        setHtmlCss(template.htmlCss);
        setAsociacion(template.asociacion);
        setActiva(template.activa);
    }, []);

    const selected = useMemo(
        () => templates.find((template) => template.id === selectedId) ?? null,
        [templates, selectedId]
    );

    const filteredTemplates = useMemo(() => applyFilters(templates), [applyFilters, templates]);
    const totalRecords = filteredTemplates.length;
    const paginatedTemplates = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredTemplates]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const columns = useMemo(() => getColumns(handleEdit), [handleEdit]);

    const handleSave = useCallback(() => {
        const cleanName = nombre.trim();
        if (!cleanName) return;

        if (isCreating) {
            const nextId = `TPL-${String(templates.length + 1).padStart(3, "0")}`;
            setTemplates((previousTemplates) => [
                ...previousTemplates,
                {
                    id: nextId,
                    nombre: cleanName,
                    formato,
                    htmlCss,
                    asociacion,
                    activa,
                },
            ]);
            resetForm();
            return;
        }

        if (!selected) return;

        setTemplates((previousTemplates) =>
            previousTemplates.map((template) =>
                template.id === selected.id
                    ? {
                        ...template,
                        nombre: cleanName,
                        formato,
                        htmlCss,
                        asociacion,
                        activa,
                    }
                    : template
            )
        );
        resetForm();
    }, [activa, asociacion, formato, htmlCss, isCreating, nombre, resetForm, selected, templates.length]);

    const handleExport = useCallback(() => {
        const headers = ["ID", "Nombre", "Formato", "Asociación", "Estado"];
        const data = filteredTemplates.map((template) => [
            template.id,
            template.nombre,
            template.formato,
            template.asociacion,
            template.activa ? "Activa" : "Inactiva",
        ]);

        exportToCsv("plantillas-etiqueta.csv", [headers, ...data]);
    }, [filteredTemplates]);

    const headerActions: Action[] = [
        {
            label: "Actualizar",
            variant: "secondary",
            onClick: () => {
                void loadTemplates();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
        {
            label: "Nuevo",
            variant: "success",
            onClick: startCreate,
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary",
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Plantillas de etiqueta"
                description="Listado de plantillas, creación HTML/CSS, formato PDF/ZPL y asociación por tipo de envío o integración."
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    handleFilterChange(id, value);
                }}
                filterTitle
            />

            <div className="flex-1 px-6 pb-6 pt-2">
                {loadError ? (
                    <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {loadError}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <section className={`${selected || isCreating ? "xl:col-span-2" : "xl:col-span-3"} overflow-x-auto`}>
                        {loading ? (
                            <div className="mb-3 rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                                Cargando plantillas...
                            </div>
                        ) : null}

                        {!loading && templates.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                                Aún no hay plantillas registradas.
                            </div>
                        ) : null}

                        {!loading && templates.length > 0 && filteredTemplates.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                                No hay plantillas que coincidan con los filtros seleccionados.
                            </div>
                        ) : null}

                        {!loading && filteredTemplates.length > 0 ? (
                            <>
                                <DataTable
                                    data={paginatedTemplates}
                                    columns={columns}
                                    dataType="PlantillasEtiqueta"
                                    layout="adaptive"
                                    rowGap={4}
                                    rowPaddingY={16}
                                    rowBgClass="bg-white shadow-sm"
                                    onRowClick={(template: Plantilla) => handleEdit(template)}
                                />

                                <Pagination
                                    currentPage={currentPage}
                                    totalRecords={totalRecords}
                                    pageSize={ITEMS_PER_PAGE}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        ) : null}
                    </section>

                    {selected || isCreating ? (
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-sm font-semibold text-slate-800">
                                {isCreating ? "Crear plantilla" : "Editar plantilla"}
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
                                    <input
                                        value={nombre}
                                        onChange={(event) => setNombre(event.target.value)}
                                        placeholder="Ej: Etiqueta envío express"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Formato</label>
                                    <select
                                        value={formato}
                                        onChange={(event) => setFormato(event.target.value as FormatoEtiqueta)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        <option value="PDF">PDF</option>
                                        <option value="ZPL">ZPL</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Asociación</label>
                                    <select
                                        value={asociacion}
                                        onChange={(event) => setAsociacion(event.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        {ASOCIACIONES.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Plantilla HTML/CSS o ZPL</label>
                                    <textarea
                                        value={htmlCss}
                                        onChange={(event) => setHtmlCss(event.target.value)}
                                        rows={8}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono"
                                    />
                                </div>

                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={activa}
                                        onChange={(event) => setActiva(event.target.checked)}
                                    />
                                    Plantilla activa
                                </label>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        {isCreating ? "Crear plantilla" : "Guardar cambios"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </section>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
