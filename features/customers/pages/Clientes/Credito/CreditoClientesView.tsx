"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

/* ──────────────────────────────
   Tipos
────────────────────────────── */
interface CreditoCliente {
    id: string;
    nombreCliente: string;
    rut: string;
    cupoTotal: number;
    cupoVencido: number;
    cupoNoVencido: number;
    cupoUsado: number;
    cupoDisponible: number;
    diasMoraMax: number;
    ultimoPago: string;
    tag: "Sin riesgo" | "En riesgo" | "Riesgoso" | "New tag";
}

/* ──────────────────────────────
   Vista
────────────────────────────── */
export default function CreditoClientesView() {
    const router = useRouter();

    const [data, setData] = useState<CreditoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* ──────────────────────────────
       Paginación (idéntica a ClientesView)
    ────────────────────────────── */
    const PER_PAGE = 10;
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));

    const shown = data.slice(
        (page - 1) * PER_PAGE,
        page * PER_PAGE
    );

    const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(n, max));

    /* ──────────────────────────────
       Columnas
    ────────────────────────────── */
    const columns: Column<CreditoCliente>[] = useMemo(
        () => [
            {
                header: "Cliente y ID",
                accessorKey: "nombreCliente",
                cell: (r) => (
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">
                                {r.nombreCliente}
                            </span>
                            <span className="text-xs text-gray-500">
                                {r.rut}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                header: "Cupo total",
                accessorKey: "cupoTotal",
                cell: (r) => `$ ${r.cupoTotal.toLocaleString("es-CL")}`,
            },
            {
                header: "Cupo vencido",
                accessorKey: "cupoVencido",
                cell: (r) => r.cupoVencido.toLocaleString("es-CL"),
            },
            {
                header: "Cupo no vencido",
                accessorKey: "cupoNoVencido",
                cell: (r) => r.cupoNoVencido.toLocaleString("es-CL"),
            },
            {
                header: "Cupo usado",
                accessorKey: "cupoUsado",
                cell: (r) => r.cupoUsado.toLocaleString("es-CL"),
            },
            {
                header: "Cupo disponible",
                accessorKey: "cupoDisponible",
                cell: (r) => r.cupoDisponible.toLocaleString("es-CL"),
            },
            {
                header: "Días mora máx.",
                accessorKey: "diasMoraMax",
            },
            {
                header: "Último pago",
                accessorKey: "ultimoPago",
            },
            {
                header: "Tag",
                accessorKey: "tag",
                cell: (r) => {
                    const styles =
                        r.tag === "Sin riesgo"
                            ? "bg-green-100 text-green-700"
                            : r.tag === "En riesgo"
                                ? "bg-yellow-100 text-yellow-700"
                                : r.tag === "Riesgoso"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700";

                    return (
                        <span
                            className={[
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                styles,
                            ].join(" ")}
                        >
                            {r.tag}
                        </span>
                    );
                },
            },
        ],
        []
    );

    /* ──────────────────────────────
       Mock load
    ────────────────────────────── */
    const load = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            setData([
                {
                    id: "1",
                    nombreCliente: "Soc Comercial el Mimbral Ltda",
                    rut: "76.004.335-4",
                    cupoTotal: 100000000,
                    cupoVencido: 0,
                    cupoNoVencido: 27558182,
                    cupoUsado: 27558182,
                    cupoDisponible: 72441818,
                    diasMoraMax: 10,
                    ultimoPago: "17-01-2026",
                    tag: "Sin riesgo",
                },
                {
                    id: "2",
                    nombreCliente: "Ferretería San Javier SPA",
                    rut: "12.345.678-9",
                    cupoTotal: 20000000,
                    cupoVencido: 6500000,
                    cupoNoVencido: 4200000,
                    cupoUsado: 10700000,
                    cupoDisponible: 9300000,
                    diasMoraMax: 20,
                    ultimoPago: "05-01-2026",
                    tag: "En riesgo",
                },
                {
                    id: "3",
                    nombreCliente: "Ferretería Talca",
                    rut: "98.765.432-1",
                    cupoTotal: 300000000,
                    cupoVencido: 100000000,
                    cupoNoVencido: 50000000,
                    cupoUsado: 100000000,
                    cupoDisponible: 50000000,
                    diasMoraMax: 16,
                    ultimoPago: "",
                    tag: "Riesgoso",
                },
                {
                    id: "4",
                    nombreCliente: "Ferretería Constitución",
                    rut: "33.444.555-6",
                    cupoTotal: 350000000,
                    cupoVencido: 200000000,
                    cupoNoVencido: 150000000,
                    cupoUsado: 50000000,
                    cupoDisponible: 100000000,
                    diasMoraMax: 33,
                    ultimoPago: "",
                    tag: "New tag",
                },
            ]);
            setPage(1);
        } catch (e: any) {
            setErrorMessage("Error cargando crédito de clientes.");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    /* ──────────────────────────────
       PageHeader (idéntico a ClientesView)
    ────────────────────────────── */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: load,
            },
        ],
        []
    );

    // Filtros 
    const [filters, setFilters] = useState({
        cliente: "",
        tag: "",
        diasMora: "",
        ultimoPago: "",
    });

    const filtersConfig = useMemo(
        () => [
            {
                id: "cliente",
                label: "Cliente o ID",
                type: "text" as const,
                value: filters.cliente,
            },
            {
                id: "diasMora",
                label: "Días mora máx.",
                type: "text" as const,
                value: filters.diasMora,
            },
            {
                id: "ultimoPago",
                label: "Último pago",
                type: "datetime" as const,
                value: filters.ultimoPago,
            },
            {
                id: "tag",
                label: "Tag",
                type: "select" as const,
                value: filters.tag,
                options: [
                    { label: "Todos", value: "" },
                    { label: "Sin riesgo", value: "Sin riesgo" },
                    { label: "En riesgo", value: "En riesgo" },
                    { label: "Riesgoso", value: "Riesgoso" },
                    { label: "New tag", value: "New tag" },
                ],
            },
        ],
        [filters]
    );

    const handleFilter = (id: string, value: string) =>
        setFilters((prev) => ({ ...prev, [id]: value }));

    const filteredData = useMemo(() => {
        return data.filter((r) => {
            if (
                filters.cliente &&
                !`${r.nombreCliente} ${r.rut}`
                    .toLowerCase()
                    .includes(filters.cliente.toLowerCase())
            )
                return false;

            if (filters.tag && r.tag !== filters.tag) return false;

            if (
                filters.diasMora &&
                r.diasMoraMax !== Number(filters.diasMora)
            )
                return false;

            if (filters.ultimoPago && r.ultimoPago !== filters.ultimoPago)
                return false;

            return true;
        });
    }, [data, filters]);

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Crédito clientes"
                filters={filtersConfig}
                onFilterChange={handleFilter}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                {loading ? (
                    <div className="overflow-x-auto border rounded-md bg-white">
                        <table className="min-w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="px-4 py-6 text-center text-gray-500">
                                        <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                        Cargando crédito de clientes…
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : errorMessage ? (
                    <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium">
                                    Error al cargar crédito de clientes
                                </h3>
                                <p className="mt-2 text-sm">
                                    {errorMessage}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <DataTable
                            data={shown}
                            columns={columns}
                            dataType="CreditoClientes"
                            statusKey="tag"
                            rowPaddingY={12}
                            rowBgClass="bg-white"
                        />

                        {/* Paginación */}
                        <Pagination
                            currentPage={page}
                            totalRecords={data.length}
                            pageSize={PER_PAGE}
                            onPageChange={setPage}
                          />
                    </>
                )}
            </div>
        </div>
    );
}
