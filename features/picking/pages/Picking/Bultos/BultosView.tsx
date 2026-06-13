"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { AdvancedFilterPopover } from "@/components/ui/filters/advanced-filter-popover";

type BultoRow = {
    tipoPaquete: string;
    codigoBarra: string;
    displayId: string;
    inventario: string;
    slot: string | null;
    fecha: string;
};

const initialRows: BultoRow[] = [
    {
        tipoPaquete: "EcoBolsa",
        codigoBarra: "YUF2MX3ZTV943",
        displayId: "1QHW6Y",
        inventario: "Palermo",
        slot: null,
        fecha: "2026-04-21",
    },
    {
        tipoPaquete: "EcoBolsa",
        codigoBarra: "YUF2MX3ZTV944",
        displayId: "1QHW6Z",
        inventario: "Palermo",
        slot: null,
        fecha: "2026-04-21",
    },
];

const PER_PAGE = 20;

const LinkCell = ({ text }: { text: string }) => (
    <a
        href="#"
        className="text-blue-600 hover:underline"
        onClick={(e) => e.preventDefault()}
    >
        {text}
    </a>
);

function getColumns(): Column<BultoRow>[] {
    return [
        { header: "Tipo de paquete", accessorKey: "tipoPaquete" },
        { header: "Código de barras", accessorKey: "codigoBarra" },
        { header: "Ref ID", accessorKey: "displayId" },
        {
            header: "Inventario",
            accessorKey: "inventario",
            cell: (r) => <LinkCell text={r.inventario} />,
        },
        {
            header: "Slot",
            accessorKey: "slot",
            cell: (r) => (r.slot ? <LinkCell text={r.slot} /> : <span>-</span>),
        },
    ];
}

export default function BultosView() {
    const [currentPage, setCurrentPage] = useState(1);

    const [filters, setFilters] = useState({
        displayId: "",
        pickingPoint: "",
        fecha: "",
    });

    const [advancedFilters, setAdvancedFilters] = useState({
        tipoPaquete: "",
        codigoBarra: "",
        slot: "",
    });

    const columns = useMemo(() => getColumns(), []);

    const pickingPointOptions = useMemo(
        () => [
            { label: "Todos", value: "" },
            ...Array.from(new Set(initialRows.map((r) => r.inventario))).map((value) => ({
                label: value,
                value,
            })),
        ],
        []
    );

    const filteredRows = useMemo(() => {
        return initialRows.filter((row) => {
            const byDisplayId = filters.displayId
                ? row.displayId.toLowerCase().includes(filters.displayId.toLowerCase())
                : true;
            const byPickingPoint = filters.pickingPoint
                ? row.inventario === filters.pickingPoint
                : true;
            const byFecha = filters.fecha ? row.fecha === filters.fecha : true;
            const byTipo = advancedFilters.tipoPaquete
                ? row.tipoPaquete.toLowerCase().includes(advancedFilters.tipoPaquete.toLowerCase())
                : true;
            const byCodigo = advancedFilters.codigoBarra
                ? row.codigoBarra.toLowerCase().includes(advancedFilters.codigoBarra.toLowerCase())
                : true;
            const bySlot = advancedFilters.slot
                ? (row.slot ?? "").toLowerCase().includes(advancedFilters.slot.toLowerCase())
                : true;

            return byDisplayId && byPickingPoint && byFecha && byTipo && byCodigo && bySlot;
        });
    }, [
        filters.displayId,
        filters.pickingPoint,
        filters.fecha,
        advancedFilters.tipoPaquete,
        advancedFilters.codigoBarra,
        advancedFilters.slot,
    ]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

    const advancedActiveCount = useMemo(() => {
        return [
            advancedFilters.tipoPaquete.trim() !== "",
            advancedFilters.codigoBarra.trim() !== "",
            advancedFilters.slot.trim() !== "",
        ].filter(Boolean).length;
    }, [advancedFilters.tipoPaquete, advancedFilters.codigoBarra, advancedFilters.slot]);

    const hasAnyActiveAdvanced = advancedActiveCount > 0;

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Bultos"
                filters={[
                    {
                        id: "displayId",
                        label: "Display ID",
                        type: "text",
                        value: filters.displayId,
                    },
                    {
                        id: "pickingPoint",
                        label: "Picking Point",
                        type: "select",
                        value: filters.pickingPoint,
                        options: pickingPointOptions,
                    },
                    {
                        id: "fecha",
                        label: "Fecha",
                        type: "single-date",
                        value: filters.fecha,
                    },
                ]}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filtersRight={
                    <AdvancedFilterPopover
                        activeCount={advancedActiveCount}
                        hasAnyActive={hasAnyActiveAdvanced}
                        onClearAll={() => {
                            setCurrentPage(1);
                            setAdvancedFilters({
                                tipoPaquete: "",
                                codigoBarra: "",
                                slot: "",
                            });
                        }}
                        width="w-[420px]"
                    >
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="mb-1 block text-sm text-gray-600">Tipo de paquete</label>
                                <input
                                    value={advancedFilters.tipoPaquete}
                                    onChange={(e) => {
                                        setCurrentPage(1);
                                        setAdvancedFilters((prev) => ({ ...prev, tipoPaquete: e.target.value }));
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                    placeholder="EcoBolsa"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-gray-600">Código de barras</label>
                                <input
                                    value={advancedFilters.codigoBarra}
                                    onChange={(e) => {
                                        setCurrentPage(1);
                                        setAdvancedFilters((prev) => ({ ...prev, codigoBarra: e.target.value }));
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                    placeholder="YUF2MX3ZTV943"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-gray-600">Slot</label>
                                <input
                                    value={advancedFilters.slot}
                                    onChange={(e) => {
                                        setCurrentPage(1);
                                        setAdvancedFilters((prev) => ({ ...prev, slot: e.target.value }));
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                    placeholder="A1 / B2..."
                                />
                            </div>
                        </div>
                    </AdvancedFilterPopover>
                }
                filtersGridClassName="lg:pr-72"
                filterTitle
            />

            <div className="p-6">
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <DataTable<BultoRow>
                        data={paginatedRows}
                        columns={columns}
                        dataType="General2"
                        rowPaddingY={12}
                        showStatusBorder={false}
                        rowBgClass="bg-white"
                    />
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalRecords={filteredRows.length}
                    pageSize={PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
