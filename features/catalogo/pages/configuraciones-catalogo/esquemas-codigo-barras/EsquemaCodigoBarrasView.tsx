"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { Pagination } from "@/components/ui/pagination";

/* ---------- tipos ---------- */
export interface EsquemasRow {
    id: string;
    nombre: string;
    refId: string;
    motivo: string;
}

/* ---------- mocks (reemplazar por fetch real) ---------- */
const MOCK_PRICES: EsquemasRow[] = [
    {
        id: "1",
        nombre: "Esquema para pesables",
        refId: "PES0122",
        motivo: "Code128",
    },
];

/* ---------- columnas ---------- */
function getColumns(router: ReturnType<typeof useRouter>): Column<EsquemasRow>[] {
    return [
        {
            header: "Nombre",
            accessorKey: "nombre",
            cell: (r: EsquemasRow) => (
                <div onClick={() => router.push(`/catalogo/configuraciones-catalogo/esquemas-codigos-barra/${r.id}`)}>
                    <span className="text-sm text-gray-800">{r.nombre}</span>
                </div>
            ),
        },
        {
            header: "Ref ID",
            accessorKey: "refId",
            cell: (r) => <CopyableText text={r.refId}>{r.refId}</CopyableText>,
        },
        {
            header: "Motivo",
            accessorKey: "motivo",
            cell: (r) => r.motivo,
        },
    ];
}

/* ---------- filtros para PageHeader ---------- */
interface EsquemasFilters {
    nombre: string;
    refId: string;
    motivo: string;
}

const getEsquemasFilters = (f: EsquemasFilters) => [
    {
        id: "nombre",
        label: "Nombre",
        type: "text" as const,
        value: f.nombre,
    },
    {
        id: "motivo",
        label: "Motivo",
        type: "text" as const,
        value: f.motivo,
    },
    {
        id: "refId",
        label: "RefId",
        type: "select" as const,
        value: f.refId,
        options: [
            { label: "Todos", value: "" },
            ...Array.from(new Set(MOCK_PRICES.map((r) => r.refId))).map(
                (refId) => ({
                    label: refId,
                    value: refId,
                })
            ),
        ],
    },
];

/* ---------- página ---------- */
export function EsquemasCodigosView() {

    const router = useRouter();
    const columns = useMemo(() => getColumns(router), [router]);

    const [rows] = useState<EsquemasRow[]>(MOCK_PRICES);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<EsquemasFilters>({
        nombre: "",
        motivo: "",
        refId: "",
    });

    /* filtrar localmente */
    const filtered = useMemo(
        () =>
            rows.filter(
                (r) =>
                    (!filters.nombre || r.nombre.toLowerCase().includes(filters.nombre.toLowerCase())) &&
                    (!filters.refId || r.refId === filters.refId) &&
                    (!filters.motivo || r.motivo.toLowerCase().includes(filters.motivo.toLowerCase()))
            ),
        [rows, filters]
    );

    /* paginación */
    const PER_PAGE = 60;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    /* acciones header */
    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: () => router.push("/catalogo/configuraciones-catalogo/esquemas-codigos-barra/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                title="Esquemas código de barras"
                action={headerActions}
                filters={getEsquemasFilters(filters)}
                onFilterChange={(id, value) =>
                    setFilters((prev) => ({ ...prev, [id]: value }))
                }
                filterTitle
            />
            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <DataTable
                        data={pageRows}
                        columns={columns}
                        dataType="General"
                        rowPaddingY={28}
                        showStatusBorder
                        rowBgClass="bg-white"
                    />

                    {totalPages > 1 && (
                        <div className="flex flex-col items-center gap-4">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                            <p className="text-sm text-gray-500">
                                {filtered.length} resultados
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}