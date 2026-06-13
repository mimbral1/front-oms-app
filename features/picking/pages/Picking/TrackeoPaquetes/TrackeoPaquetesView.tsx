// views\Picking\TrackeoPaquetes\TrackeoPaquetesView.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* ---------- Tipos UI ---------- */
type Estado = "No retornable" | "En uso";

interface PackageRow {
    id: number;
    type: string;
    referenceId: string;
    barcode: string;
    position: string;
    orderId: string;
    price: string;
    createdAt: string;
    status: Estado;
}

/* ---------- Helpers UI ---------- */
const PER_PAGE = 20;

const getStatusColor = (s: Estado) =>
    s === "En uso" ? "bg-yellow-400" : "bg-red-500";

const Pill = ({ text }: { text: string }) => (
    <span className="inline-flex items-center rounded-full px-4 py-1 text-xs font-medium bg-gray-100 text-gray-700">
        {text}
    </span>
);

/* ---------- Mock ---------- */
const MOCK_DATA: PackageRow[] = [
    {
        id: 1,
        type: "Caja de carton",
        referenceId: "TNXUW7",
        barcode: "VIJL8TYMMPMS",
        position: "Belgrano",
        orderId: "1331110521778-01",
        price: "37,88 ARS",
        createdAt: "10/05/2023 12:21",
        status: "No retornable",
    },
    {
        id: 2,
        type: "Bolsa de papel",
        referenceId: "W1Q18V",
        barcode: "bolsa de papel",
        position: "Belgrano",
        orderId: "1331110521778-01",
        price: "104,51 ARS",
        createdAt: "10/05/2023 12:21",
        status: "No retornable",
    },
    {
        id: 3,
        type: "Palet",
        referenceId: "ZPDAP6",
        barcode: "6ADPZBLSNA5AR",
        position: "Belgrano",
        orderId: "1330900521774-01",
        price: "9,46 ARS",
        createdAt: "09/05/2023 14:40",
        status: "En uso",
    },
    {
        id: 4,
        type: "Bolsa plástica",
        referenceId: "BLZPN0",
        barcode: "V8N5QV7WO2E7P",
        position: "Belgrano",
        orderId: "1330890521772-01",
        price: "793,85 ARS",
        createdAt: "09/05/2023 14:29",
        status: "No retornable",
    },
    {
        id: 5,
        type: "Bolsa de papel",
        referenceId: "LK40CS",
        barcode: "HLLC3MSYW1H66",
        position: "Belgrano",
        orderId: "1330890521772-01",
        price: "1.141,93 ARS",
        createdAt: "09/05/2023 14:29",
        status: "No retornable",
    },
];

/* ---------- Columnas ---------- */
function getColumns(): Column<PackageRow>[] {
    return [
        { header: "Tipo de paquete", accessorKey: "type" },
        { header: "Ref ID", accessorKey: "referenceId" },
        { header: "Código de barras", accessorKey: "barcode" },
        { header: "Posición", accessorKey: "position" },
        { header: "ID Pedido", accessorKey: "orderId" },
        {
            header: "Precio",
            accessorKey: "price",
            cell: (r) => <Pill text={r.price} />,
        },
        { header: "Creación", accessorKey: "createdAt" },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
                        r.status
                    )}`}
                >
                    {r.status}
                </div>
            ),
        },
    ];
}

/* ---------- Filtros Header ---------- */
interface Filters {
    tipo: string;
    refId: string;
    barcode: string;
    orderId: string;
}

const getFiltersConfig = (f: Filters) => [
    {
        id: "tipo",
        label: "Tipo",
        type: "text" as const,
        value: f.tipo,
    },
    {
        id: "refId",
        label: "Ref ID",
        type: "text" as const,
        value: f.refId,
    },
    {
        id: "barcode",
        label: "Código de barras",
        type: "text" as const,
        value: f.barcode,
    },
    {
        id: "orderId",
        label: "ID pedido",
        type: "text" as const,
        value: f.orderId,
    },
];

/* ---------- Página ---------- */
export default function TrackeoPaquetesView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);

    // tabla
    const [rows, setRows] = useState<PackageRow[]>([]);
    const [loading, setLoading] = useState(true);

    // errores
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(n, max));

    // filtros
    const [filters, setFilters] = useState<Filters>({
        tipo: "",
        refId: "",
        barcode: "",
        orderId: "",
    });

    // cargar mock
    const fetchList = useCallback(() => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const filtered = MOCK_DATA.filter((r) => {
                const matchTipo = filters.tipo
                    ? r.type.toLowerCase().includes(filters.tipo.toLowerCase())
                    : true;

                const matchRef = filters.refId
                    ? r.referenceId.toLowerCase().includes(filters.refId.toLowerCase())
                    : true;

                const matchBarcode = filters.barcode
                    ? r.barcode.toLowerCase().includes(filters.barcode.toLowerCase())
                    : true;

                const matchOrderId = filters.orderId
                    ? r.orderId.toLowerCase().includes(filters.orderId.toLowerCase())
                    : true;

                return matchTipo && matchRef && matchBarcode && matchOrderId;
            });

            const start = (currentPage - 1) * PER_PAGE;
            const paginated = filtered.slice(start, start + PER_PAGE);

            setRows(paginated);
            setTotalRecords(filtered.length);
            setTotalPages(Math.max(1, Math.ceil(filtered.length / PER_PAGE)));
        } catch (e) {
            setRows([]);
            setTotalRecords(0);
            setTotalPages(1);
            setErrorMessage("Error al cargar paquetes.");
        } finally {
            setLoading(false);
        }
    }, [filters.tipo, filters.refId, filters.barcode, filters.orderId, currentPage]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* acciones header */
    const handleExport = useCallback(() => {
        const headers = [
            "Tipo",
            "Ref ID",
            "Código de barras",
            "Posición",
            "ID Pedido",
            "Precio",
            "Creación",
            "Estado",
        ];
        const data = rows.map((r) => [
            r.type,
            r.referenceId,
            r.barcode,
            r.position,
            r.orderId,
            r.price,
            r.createdAt,
            r.status,
        ]);
        exportToCsv("trackeo-paquetes.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/picking/packing/trackeo-de-paquetes/nuevo"),
                icon: <PlusIcon className="h-5 w-5" />,
            },
            {
                label: "Exportar",
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Actualizar",
                variant: "secondary",
                onClick: () => fetchList(),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [router, handleExport, fetchList]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Trackeo de paquetes"
                action={headerActions}
                filters={getFiltersConfig(filters)}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : errorMessage ? (
                        <div
                            className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">
                                        Error al cargar paquetes
                                    </h3>
                                    <p className="mt-2 text-sm">{errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="trackeoPacking"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: PackageRow) =>
                                router.push(`/picking/packing/trackeo-de-paquetes/${row.id}`)
                            }
                        />
                    )}

                    {/* Paginación */}
                    <Pagination
                        currentPage={currentPage}
                        totalRecords={totalRecords}
                        pageSize={PER_PAGE}
                        onPageChange={setCurrentPage}
                      />
                </div>
            </div>
        </div>
    );
}
