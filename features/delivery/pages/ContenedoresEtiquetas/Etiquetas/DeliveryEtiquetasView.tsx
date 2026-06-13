"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

const LABEL_LIST_URL = `${BASE_DELIVERY_SERVICE}/label`;
const ITEMS_PER_PAGE = 10;

type OrigenEtiqueta = "Envío" | "Paquete" | "Contenedor";
type EstadoImpresion = "Pendiente" | "Impreso" | "Reimpresión";

type EtiquetaRow = {
    id: string;
    origenTipo: OrigenEtiqueta;
    origenId: string;
    estado: EstadoImpresion;
    formato: "PDF" | "ZPL";
    createdAt: string;
};

type EtiquetaFilters = {
    origenTipo: string;
    estado: string;
};

const initialFilters: EtiquetaFilters = {
    origenTipo: "",
    estado: "",
};

const filterConfig: FilterConfig<EtiquetaFilters, EtiquetaRow>[] = [
    {
        id: "origenTipo",
        label: "Origen",
        type: "select",
        options: [
            { label: "Envío", value: "Envío" },
            { label: "Paquete", value: "Paquete" },
            { label: "Contenedor", value: "Contenedor" },
        ],
        rowValue: (row) => row.origenTipo,
    },
    {
        id: "estado",
        label: "Estado",
        type: "select",
        options: [
            { label: "Pendiente", value: "Pendiente" },
            { label: "Impreso", value: "Impreso" },
            { label: "Reimpresión", value: "Reimpresión" },
        ],
        rowValue: (row) => row.estado,
    },
];

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const toOrigenTipo = (value: unknown): OrigenEtiqueta => {
    const normalized = normalizeText(value);
    if (normalized.includes("paquete") || normalized.includes("package")) return "Paquete";
    if (normalized.includes("contenedor") || normalized.includes("container")) return "Contenedor";
    return "Envío";
};

const toEstado = (value: unknown): EstadoImpresion => {
    const normalized = normalizeText(value);
    if (normalized.includes("reimp")) return "Reimpresión";
    if (normalized.includes("impreso") || normalized.includes("printed")) return "Impreso";
    return "Pendiente";
};

const toFormato = (value: unknown): "PDF" | "ZPL" => {
    const normalized = normalizeText(value);
    return normalized === "zpl" ? "ZPL" : "PDF";
};

const toDisplayDate = (value: unknown): string => {
    if (!value) return "-";
    const raw = String(value);
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

const mapLabelRows = (payload: unknown): EtiquetaRow[] => {
    const list = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { data?: unknown[] })?.data)
            ? (payload as { data: unknown[] }).data
            : Array.isArray((payload as { items?: unknown[] })?.items)
                ? (payload as { items: unknown[] }).items
                : Array.isArray((payload as { data?: { items?: unknown[] } })?.data?.items)
                    ? (payload as { data: { items: unknown[] } }).data.items
                    : [];

    return list.map((raw, index) => {
        const item = (raw ?? {}) as Record<string, unknown>;
        const idValue = item.id ?? item.codigo ?? item.code ?? item.labelId ?? item._id ?? `ETQ-${index + 1}`;
        const origenTipoValue = item.origenTipo ?? item.originType ?? item.tipoOrigen ?? item.entityType;
        const origenIdValue = item.origenId ?? item.originId ?? item.entidadId ?? item.referenceId ?? item.guia ?? "-";
        const estadoValue = item.estado ?? item.status;
        const formatoValue = item.formato ?? item.format;
        const createdAtValue = item.createdAt ?? item.created_at ?? item.fechaCreacion ?? item.createdOn;

        return {
            id: String(idValue),
            origenTipo: toOrigenTipo(origenTipoValue),
            origenId: String(origenIdValue),
            estado: toEstado(estadoValue),
            formato: toFormato(formatoValue),
            createdAt: toDisplayDate(createdAtValue),
        };
    });
};

const badgeClass = (estado: EstadoImpresion) => {
    if (estado === "Impreso") return "bg-emerald-100 text-emerald-700";
    if (estado === "Reimpresión") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
};

export default function DeliveryEtiquetasView() {
    const [rows, setRows] = useState<EtiquetaRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<EtiquetaFilters, EtiquetaRow>({
            initialFilters,
            configs: filterConfig,
        });

    const loadLabels = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const response = await fetch(LABEL_LIST_URL, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`No se pudo obtener etiquetas (${response.status})`);
            }

            const payload = (await response.json()) as unknown;
            setRows(mapLabelRows(payload));
            setCurrentPage(1);
        } catch (error) {
            setRows([]);
            setLoadError(error instanceof Error ? error.message : "Error al cargar etiquetas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadLabels();
    }, [loadLabels]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const handlePrint = useCallback((id: string, reprint = false) => {
        setRows((previousRows) =>
            previousRows.map((row) =>
                row.id === id
                    ? { ...row, estado: reprint ? "Reimpresión" : "Impreso" }
                    : row
            )
        );
    }, []);

    const handleDownload = useCallback((row: EtiquetaRow) => {
        const content = [
            `Etiqueta: ${row.id}`,
            `Origen: ${row.origenTipo} ${row.origenId}`,
            `Estado: ${row.estado}`,
            `Formato: ${row.formato}`,
            `Generada: ${row.createdAt}`,
        ].join("\n");

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${row.id}.txt`;
        anchor.click();
        URL.revokeObjectURL(url);
    }, []);

    const columns = useMemo<Column<EtiquetaRow>[]>(
        () => [
            {
                header: "Etiqueta",
                accessorKey: "id",
                cell: (row) => (
                    <div className="min-h-[48px] leading-tight">
                        <div className="text-sm font-semibold text-slate-800">{row.id}</div>
                        <div className="mt-1 text-xs text-slate-500">{row.createdAt}</div>
                    </div>
                ),
            },
            {
                header: "Origen",
                accessorKey: "origenTipo",
                cell: (row) => (
                    <div className="min-h-[48px] leading-tight">
                        <div className="text-sm text-slate-800">{row.origenTipo}</div>
                        <div className="mt-1 text-xs text-slate-500">{row.origenId}</div>
                    </div>
                ),
            },
            {
                header: "Formato",
                accessorKey: "formato",
                cell: (row) => (
                    <div className="min-h-[48px] leading-tight">
                        <div className="text-sm text-slate-800">{row.formato}</div>
                        <div className="mt-1 text-xs text-slate-500">Etiqueta generada</div>
                    </div>
                ),
            },
            {
                header: "Estado",
                accessorKey: "estado",
                cell: (row) => (
                    <div className="flex min-h-[48px] items-center">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(row.estado)}`}>
                            {row.estado}
                        </span>
                    </div>
                ),
            },
            {
                header: "",
                accessorKey: "id",
                cell: (row) => (
                    <div className="flex min-h-[48px] items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                handlePrint(row.id, row.estado !== "Pendiente");
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold text-white ${row.estado === "Pendiente"
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-slate-700 hover:bg-slate-800"
                                }`}
                        >
                            <PrinterIcon className="h-3.5 w-3.5" />
                            {row.estado === "Pendiente" ? "Imprimir" : "Reimprimir"}
                        </button>

                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleDownload(row);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            Descargar
                        </button>
                    </div>
                ),
            },
        ],
        [handleDownload, handlePrint]
    );

    const headerActions: Action[] = [
        {
            label: "Actualizar",
            variant: "secondary",
            onClick: () => {
                void loadLabels();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Etiquetas"
                description="Etiquetas generadas por envío, paquete o contenedor, con estado de impresión y reimpresión."
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
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {loadError}
                    </div>
                ) : null}

                <section className="overflow-x-auto">
                    {loading ? <div className="py-6 text-sm text-slate-600">Cargando etiquetas...</div> : null}

                    {!loading && rows.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                            Aún no hay etiquetas registradas.
                        </div>
                    ) : null}

                    {!loading && rows.length > 0 && filteredRows.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
                            No hay etiquetas que coincidan con los filtros seleccionados.
                        </div>
                    ) : null}

                    {!loading && filteredRows.length > 0 ? (
                        <>
                            <DataTable
                                data={paginatedRows}
                                columns={columns}
                                dataType="Etiquetas"
                                layout="adaptive"
                                rowGap={4}
                                rowPaddingY={16}
                                rowBgClass="bg-white shadow-sm"
                            />

                            <Pagination
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                totalRecords={totalRecords}
                                pageSize={ITEMS_PER_PAGE}
                            />
                        </>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
