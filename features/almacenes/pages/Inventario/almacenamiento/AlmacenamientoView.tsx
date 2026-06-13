// app/views/Inventario/AlmacenamientoPorPosicion/Browse/AlmacenamientoPorPosicion.tsx
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { Warehouse, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import AdvancedFilters from "@/features/almacenes/components/inventario/almacenamiento/Filtros";
import { Pagination } from "@/components/ui/pagination";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { useFetchWithAuth } from "@/lib/http/client";

type CatalogProductResponse = {
    Name?: string | null;
};

interface FilaPosicion {
    id: string;
    inventario: string;
    slot: string;
    tipoSlot: string;
    tipo: "Order package" | "Order item";
    ordenRef: string;
    skuRef?: string;
    codigoBarras?: string;
    cantidad: number;
    modificado: string;
    status?: "Activo" | "Inactivo";
}

const MOCK: FilaPosicion[] = [
    {
        id: "1",
        inventario: "TND - Pilar Tienda",
        slot: "B-1-05",
        tipoSlot: "Consolidación",
        tipo: "Order package",
        ordenRef: "JNS #ORD-250410-W5R6WP",
        codigoBarras: "ABC-abc-1234",
        cantidad: 1,
        modificado: "11/04/2025 17:25",
        status: "Inactivo",
    },
    {
        id: "2",
        inventario: "TND - Pilar Tienda",
        slot: "B-1-05",
        tipoSlot: "Consolidación",
        tipo: "Order package",
        ordenRef: "JNS #ORD-250410-W5R6WP",
        codigoBarras: "ABC-abc-123",
        cantidad: 1,
        modificado: "11/04/2025 17:24",
        status: "Inactivo",
    },
    {
        id: "3",
        inventario: "TND - Pilar Tienda",
        slot: "B-1-10",
        tipoSlot: "Consolidación",
        tipo: "Order package",
        ordenRef: "JNS #ORD-250410-2GMDS8",
        codigoBarras: "9780201379990",
        cantidad: 1,
        modificado: "11/04/2025 17:23",
        status: "Inactivo",
    },
    {
        id: "4",
        inventario: "TND - Pilar Tienda",
        slot: "B-1-05",
        tipoSlot: "",
        tipo: "Order item",
        ordenRef: "JNS #ORD-250410-2GMDS8",
        skuRef: "68190 - Juego Desarmadores Rotter",
        cantidad: 3,
        modificado: "11/04/2025 17:21",
        status: "Activo",
    },
    {
        id: "5",
        inventario: "TND - Pilar Tienda",
        slot: "B-1-05",
        tipoSlot: "",
        tipo: "Order package",
        ordenRef: "JNS #ORD-250410-W5R6WP",
        codigoBarras: "ABC-abc-1234",
        cantidad: 1,
        modificado: "11/04/2025 17:21",
        status: "Inactivo",
    },
    {
        id: "6",
        inventario: "TND - Pilar Tienda",
        slot: "B-1-05",
        tipoSlot: "",
        tipo: "Order item",
        ordenRef: "JNS #ORD-250410-W5R6WP",
        skuRef: "35665 - Cal",
        cantidad: 20,
        modificado: "11/04/2025 17:21",
        status: "Activo",
    },
    {
        id: "7",
        inventario: "TND - Pilar Tienda",
        slot: "B-1-05",
        tipoSlot: "",
        tipo: "Order item",
        ordenRef: "JNS #ORD-250410-W5R6WP",
        skuRef: "990139910 - Estufa Orbis 4024go Z700 Kcal",
        cantidad: 1,
        modificado: "11/04/2025 17:19",
        status: "Activo",
    },
];

const PER_PAGE = 60;

const downloadCSV = (rows: FilaPosicion[]) => {
    const headers = [
        "Inventario",
        "Slot",
        "Tipo de slot",
        "Tipo",
        "Referencia",
        "Código de barras",
        "SKU",
        "Cantidad",
        "Modificado",
    ];
    const body = rows.map((row) => [
        row.inventario,
        row.slot,
        row.tipoSlot,
        row.tipo,
        row.ordenRef,
        row.codigoBarras ?? "",
        row.skuRef ?? "",
        row.cantidad,
        row.modificado,
    ]);
    const csv = [headers, ...body]
        .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `almacenamiento_por_posicion_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
};

const Pill = ({ value }: { value: string | number }) => (
    <div className="inline-flex items-center rounded-full border border-gray-300 px-4 py-1 text-sm text-gray-800">
        {value}
    </div>
);

function getColumns(): Column<FilaPosicion>[] {
    return [
        {
            header: "Inventario",
            accessorKey: "inventario",
            cell: (row) => (
                <div className="relative pl-2">
                    <div className="ml-2 inline-flex items-center gap-2">
                        <Warehouse className="h-4 w-4" />
                        <span className="cursor-pointer text-blue-600 hover:underline">{row.inventario}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "Slot",
            accessorKey: "slot",
            cell: (row) => (
                <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <div className="flex flex-col">
                        <span className="cursor-pointer text-blue-600 hover:underline">{row.slot}</span>
                        {row.tipoSlot ? <span className="text-xs text-gray-600">{row.tipoSlot}</span> : null}
                    </div>
                </div>
            ),
        },
        {
            header: "Tipo",
            accessorKey: "tipo",
            cell: (row) => (
                <div className="inline-flex items-center gap-2">
                    <span className="rounded-full border border-gray-300 px-3 py-1 text-sm">{row.tipo}</span>
                </div>
            ),
        },
        {
            header: "Bienes almacenados",
            accessorKey: "ordenRef",
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="cursor-pointer text-blue-600 hover:underline">{row.ordenRef}</span>
                    {row.skuRef ? <span className="text-sm text-gray-700">{row.skuRef}</span> : null}
                    {row.codigoBarras ? <span className="text-sm text-gray-700">{row.codigoBarras}</span> : null}
                </div>
            ),
        },
        {
            header: "Cantidad",
            accessorKey: "cantidad",
            cell: (row) => <Pill value={row.cantidad} />,
        },
        {
            header: "Modificado",
            accessorKey: "modificado",
            cell: (row) => <span className="text-sm text-gray-800">{row.modificado}</span>,
        },
    ];
}

interface Filters {
    inventory: string;
    order: string;
    sku: string;
    barcode: string;
}

const initialFilters: Filters = {
    inventory: "",
    order: "",
    sku: "",
    barcode: "",
};

export default function AlmacenamientoPorPosicion() {
    const router = useRouter();
    const { id } = useParams<{ id?: string | string[] }>();
    const stockId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuth } = useFetchWithAuth();
    const [headerName, setHeaderName] = useState("");
    const columns = useMemo(() => getColumns(), []);
    const [rows] = useState<FilaPosicion[]>(MOCK);
    const [currentPage, setCurrentPage] = useState(1);
    const [advFilters, setAdvFilters] = useState({
        slot: "",
        tipo: "",
        esquema: "",
        tipoPosicion: "",
        sourceOrder: "",
        barcode: "",
    });

    useEffect(() => {
        if (!stockId || typeof stockId !== "string") {
            setHeaderName("");
            return;
        }

        let cancelled = false;

        const loadHeader = async () => {
            try {
                const product = await fetchWithAuth<CatalogProductResponse>(
                    `catalog/products/${encodeURIComponent(stockId)}`,
                    { method: "GET" }
                );

                if (!cancelled) {
                    setHeaderName((product?.Name || "").trim());
                }
            } catch {
                if (!cancelled) {
                    setHeaderName("");
                }
            }
        };

        loadHeader();

        return () => {
            cancelled = true;
        };
    }, [stockId, fetchWithAuth]);

    const inventoryOptions = useMemo(
        () =>
            Array.from(new Set(rows.map((row) => row.inventario))).map((value) => ({
                label: value,
                value,
            })),
        [rows]
    );

    const filterConfig = useMemo<FilterConfig<Filters, FilaPosicion>[]>(
        () => [
            {
                id: "inventory",
                label: "Inventario",
                type: "select",
                options: inventoryOptions,
                rowValue: (row) => row.inventario,
            },
            { id: "order", label: "Pedido", type: "text", rowValue: (row) => row.ordenRef },
            { id: "sku", label: "SKU", type: "text", rowValue: (row) => row.skuRef },
            { id: "barcode", label: "Código de barras", type: "text", rowValue: (row) => row.codigoBarras },
        ],
        [inventoryOptions]
    );

    const { filters, headerFilters, handleFilterChange, applyFilters, resetFilters } =
        useStandardFilters<Filters, FilaPosicion>({
            initialFilters,
            configs: filterConfig,
        });

    const onAdvancedChange = useCallback((id: string, value: string) => {
        setCurrentPage(1);
        setAdvFilters((previous) => ({ ...previous, [id]: value }));
    }, []);

    const basicActiveCount = useMemo(
        () => Object.values(filters).reduce((accumulator, value) => accumulator + (value ? 1 : 0), 0),
        [filters]
    );

    const advancedActiveCount = useMemo(
        () => Object.values(advFilters).reduce((accumulator, value) => accumulator + (value ? 1 : 0), 0),
        [advFilters]
    );

    const totalActive = basicActiveCount + advancedActiveCount;
    const hasAnyActive = totalActive > 0;

    const clearAllFilters = useCallback(() => {
        resetFilters();
        setAdvFilters({ slot: "", tipo: "", esquema: "", tipoPosicion: "", sourceOrder: "", barcode: "" });
        setCurrentPage(1);
    }, [resetFilters]);

    const filtered = useMemo(() => {
        return applyFilters(rows).filter((row) => {
            const bySlot = !advFilters.slot || row.slot.toLowerCase().includes(advFilters.slot.toLowerCase());
            const byTipo = !advFilters.tipo || row.tipo === advFilters.tipo;
            const byEsquema = !advFilters.esquema || row.tipoSlot.toLowerCase().includes(advFilters.esquema.toLowerCase());
            const byTipoPos = !advFilters.tipoPosicion || row.tipoSlot.toLowerCase().includes(advFilters.tipoPosicion.toLowerCase());
            const bySourceOrder = !advFilters.sourceOrder || row.ordenRef.toLowerCase().includes(advFilters.sourceOrder.toLowerCase());
            const byBarcodeAdv =
                !advFilters.barcode ||
                (row.codigoBarras ? row.codigoBarras.toLowerCase().includes(advFilters.barcode.toLowerCase()) : false);

            return bySlot && byTipo && byEsquema && byTipoPos && bySourceOrder && byBarcodeAdv;
        });
    }, [advFilters, applyFilters, rows]);

    const totalRecords = filtered.length;
    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filtered.slice(start, start + PER_PAGE);
    }, [currentPage, filtered]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const handleExport = useCallback(() => downloadCSV(filtered), [filtered]);
    const headerActions: Action[] = useMemo(
        () => [
            { label: "Exportar", variant: "primary", onClick: handleExport, icon: <ArrowDownTrayIcon className="h-5 w-5" /> },
            { label: "Importar", variant: "primary", onClick: () => { }, icon: <ArrowUpTrayIcon className="h-5 w-5" /> },
        ],
        [handleExport]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <div className="relative">
                <PageHeader
                    title={
                        <div>
                            <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Stock</div>
                            <div className="text-2xl font-semibold text-gray-900">{headerName || (stockId ? String(stockId) : "Stock")}</div>
                        </div>
                    }
                    action={headerActions}
                    filters={headerFilters}
                    onFilterChange={(id, value) => {
                        setCurrentPage(1);
                        handleFilterChange(id, value);
                    }}
                    filterTitle
                    sticky
                    stickyTop={0}
                    filtersRight={
                        <AdvancedFilters
                            onClearAll={clearAllFilters}
                            advancedFilters={advFilters}
                            onAdvancedChange={onAdvancedChange}
                            activeCount={totalActive}
                            hasAnyActive={hasAnyActive}
                        />
                    }
                />
            </div>

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <DataTable
                        data={pageRows}
                        columns={columns}
                        dataType="AlmacenamientoPosicion"
                        statusKey="status"
                        rowPaddingY={12}
                        rowBgClass="bg-white"
                        showStatusBorder
                        onRowClick={() => {
                            void router;
                        }}
                    />

                    <div className="sticky bottom-0 flex w-full flex-col items-center gap-4 border-t py-4">
                        {totalRecords > 0 ? (
                            <Pagination
                                currentPage={currentPage}
                                totalRecords={totalRecords}
                                pageSize={PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        ) : null}

                        <div className="text-sm text-gray-600">
                            {totalRecords === 0
                                ? "0 resultados"
                                : `${(currentPage - 1) * PER_PAGE + 1}-${Math.min(
                                    currentPage * PER_PAGE,
                                    totalRecords
                                )} de ${totalRecords} resultados`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
