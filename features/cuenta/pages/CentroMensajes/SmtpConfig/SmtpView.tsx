// app/views/Cuenta/Smtp/Browse/SmtpView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* Tipados */
type Estado = string;
type Protocolo = "" | "TLS" | "SSL";

export interface SmtpRow {
    id: string;
    name: string;
    from_name: string;
    from_email: string;
    host: string;
    username: string;
    port: number | string;
    security_protocol: Protocolo;
    status: Estado;
}

/* Mock */
const MOCK: SmtpRow[] = [
    {
        id: "smtp-qa",
        name: "QA Default",
        from_name: "Janis QA",
        from_email: "qa@janis.dev",
        host: "smtp.mailtrap.io",
        username: "qa_user",
        port: 587,
        security_protocol: "TLS",
        status: "Activo",
    },
    {
        id: "smtp-prod",
        name: "Production",
        from_name: "Mimbral",
        from_email: "no-reply@mimbral.cl",
        host: "smtp.sendgrid.net",
        username: "apikey",
        port: 465,
        security_protocol: "SSL",
        status: "Inactivo",
    },
];

/* Helpers UI */
const PER_PAGE = 10;
const statusBg = (s: Estado) => (s === "Activo" ? "bg-green-500" : "bg-gray-400");

/* Filtros */
type Filters = {
    search: string; // Nombre, From email o Host
    status: "" | Estado;
    protocol: "" | Protocolo;
};
const initialFilters: Filters = { search: "", status: "", protocol: "" };

const getFilters = (filters: Filters) => [
    {
        id: "search",
        label: "Buscar",
        type: "text" as const,
        placeholder: "Nombre, correo o host",
        value: filters.search,
    },
    {
        id: "status",
        label: "Estado",
        type: "select-search" as const,
        value: filters.status,
        options: [
            { label: "Todos", value: "" },
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
    },
    {
        id: "protocol",
        label: "Seguridad",
        type: "select-search" as const,
        value: filters.protocol,
        options: [
            { label: "Todos", value: "" },
            { label: "TLS", value: "TLS" },
            { label: "SSL", value: "SSL" },
        ],
    },
];

/* Columnas */
function getColumns(): Column<SmtpRow>[] {
    return [
        { header: "Nombre", accessorKey: "name" },
        { header: "Remitente (From name)", accessorKey: "from_name" },
        { header: "Correo remitente", accessorKey: "from_email" },
        { header: "Host", accessorKey: "host" },
        { header: "Usuario", accessorKey: "username" },
        { header: "Puerto", accessorKey: "port", cell: (r) => String(r.port ?? "") },
        { header: "Seguridad", accessorKey: "security_protocol", cell: (r) => r.security_protocol || "—" },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${statusBg(
                        r.status
                    )}`}
                >
                    {r.status}
                </div>
            ),
        },
    ];
}


export default function SmtpView() {
    const router = useRouter();
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => {
        const q = filters.search.toLowerCase();
        return MOCK.filter((r) => {
            const bySearch =
                !q ||
                r.name.toLowerCase().includes(q) ||
                r.from_email.toLowerCase().includes(q) ||
                r.host.toLowerCase().includes(q);
            const byStatus = !filters.status || r.status === filters.status;
            const byProtocol = !filters.protocol || r.security_protocol === filters.protocol;
            return bySearch && byStatus && byProtocol;
        });
    }, [filters]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const startIndex = (currentPage - 1) * PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + PER_PAGE);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // Acciones del header
    const handleExport = () => {
        const headers = ["ID", "NOMBRE", "FROM NAME", "FROM EMAIL", "HOST", "USUARIO", "PUERTO", "SEGURIDAD", "ESTADO"];
        const rows = filtered.map((r) => [
            r.id,
            r.name,
            r.from_name,
            r.from_email,
            r.host,
            r.username,
            r.port,
            r.security_protocol,
            r.status,
        ]);
        exportToCsv("smtp.csv", [headers, ...rows]);
    };

    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: () => router.push(`/cuenta/acciones-masivas/exportaciones/nuevo`),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary" as const,
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
        {
            label: "Actualizar",
            variant: "secondary" as const,
            onClick: () => setFilters((f) => ({ ...f })), // mock refresh, icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    const columns = getColumns();
    const viewFilters = getFilters(filters);
    const handleFilterChange = (id: string, value: string) => {
        setCurrentPage(1);
        setFilters((prev) => ({ ...prev, [id]: value as Filters[keyof Filters] }));
    };

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="SMTP"
                filters={viewFilters}
                onFilterChange={handleFilterChange}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable
                            data={paginated}
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            rowBgClass="bg-white"
                            onRowClick={(row: SmtpRow) => router.push(`/cuenta/acciones-masivas/exportaciones/${encodeURIComponent(row.id)}`)}
                        />
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalRecords={filtered.length}
                        pageSize={PER_PAGE}
                        onPageChange={setCurrentPage}
                      />
                </div>
            </div>
        </div>
    );
}
