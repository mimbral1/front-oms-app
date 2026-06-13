"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { Avatar } from "@/components/ui/user-avatar";

interface TemplatesRow {
    id: string;
    subject: string;
    code: string;
    smtp_config_name: string;
    user_created: { initials: string; name: string; email: string };
    date_created: string;
    user_modified: { initials: string; name: string; email: string };
    date_modified: string;
    status: "Activo" | "Inactivo";
}

const mockTemplatesRow: TemplatesRow[] = [
    {
        "id": "1",
        "subject": "[QA] Export files for the entity {{entity}}",
        "code": "export",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "MV",
            "name": "Manuel Vilches",
            "email": "manuel@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "MV",
            "name": "Manuel Vilches",
            "email": "manuel@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "2",
        "subject": "[QA] Recupero de Contraseña",
        "code": "password-recovery",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "MV",
            "name": "Manuel Vilches",
            "email": "manuel@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "MV",
            "name": "Manuel Vilches",
            "email": "manuel@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "3",
        "subject": "[QA] Se ha activado una alarma: {{name}}",
        "code": "alarm-triggered",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "MV",
            "name": "Manuel Vilches",
            "email": "manuel@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "MV",
            "name": "Manuel Vilches",
            "email": "manuel@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "4",
        "subject": "Bienvenido {{userFirstname}} a Janis",
        "code": "invite-to-a-client",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "JH",
            "name": "Juan Hapes",
            "email": "juan@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "JH",
            "name": "Juan Hapes",
            "email": "juan@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "5",
        "subject": "[QA] - Tu pedido {{order.commerceId}} ya está listo para retirar!",
        "code": "shipping-ready-for-pickup",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "JO",
            "name": "Joaquín Ormaechea",
            "email": "joaquin@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "BB",
            "name": "Bruno Bellini",
            "email": "bruno.bellini@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "6",
        "subject": "Tu pedido {{order.commerceId}} esta en camino!",
        "code": "shipping-on-the-way",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "LG",
            "name": "Leonardo Gamas",
            "email": "leonardo@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "LG",
            "name": "Leonardo Gamas",
            "email": "leonardo@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "7",
        "subject": "Tu pedido {{order.commerceId}} ha sido entregado!",
        "code": "shipping-delivered",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "FA",
            "name": "Fede Atanasoff",
            "email": "federico.atanasoff@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "FA",
            "name": "Fede Atanasoff",
            "email": "federico.atanasoff@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "8",
        "subject": "Tu pedido {{order.commerceId}} no sera entregado",
        "code": "shipping-not-delivered",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "FA",
            "name": "Fede Atanasoff",
            "email": "federico.atanasoff@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "BB",
            "name": "Bruno Bellini",
            "email": "bruno.bellini@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "9",
        "subject": "Haz retirado tu pedido {{order.commerceId}}!",
        "code": "shipping-picked-up",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "FA",
            "name": "Fede Atanasoff",
            "email": "federico.atanasoff@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "FA",
            "name": "Fede Atanasoff",
            "email": "federico.atanasoff@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    },
    {
        "id": "10",
        "subject": "[QA] {{userFirstname}} Bienvenido a Janis",
        "code": "welcome-to-janis",
        "smtp_config_name": "-",
        "user_created": {
            "initials": "JH",
            "name": "Juan Hapes",
            "email": "juan@fizzmod.com"
        },
        "date_created": "17/11/2021 08:29",
        "user_modified": {
            "initials": "JH",
            "name": "Juan Hapes",
            "email": "juan@fizzmod.com"
        },
        "date_modified": "17/11/2021 08:29",
        "status": "Activo"
    }
]
    ;

/* ---------- helpers ---------- */
const getStatusColor = (s: string) =>
    s.toLowerCase() === "activo" ? "bg-green-500" : "bg-gray-400";

/* mini-componente para “User created” */
function UserChip({
    name,
    email,
}: {
    name: string;
    email: string;
}) {
    return (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <Avatar
                name={name || email || "-"}
                alt={name || email || "-"}
                className="h-8 w-8"
            />
            <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="truncate text-xs text-gray-500">{email}</span>
            </div>
        </div>
    );
}

function getColumns(router: ReturnType<typeof useRouter>): Column<TemplatesRow>[] {
    return [
        {
            header: "Asunto",
            accessorKey: "subject",
            cell: (r: TemplatesRow) => (
                <div onClick={() => router.push(`/cuenta/centro-mensajes/templates-page/${r.id}`)}>
                    <span className="text-sm text-gray-800">{r.subject}</span>
                </div>
            ),
        },
        {
            header: "Código",
            accessorKey: "code",
            cell: (r) => r.code,
        },
        {
            header: "Smpt (configuración)",
            accessorKey: "smtp_config_name",
            cell: (r) => r.smtp_config_name,
        },
        {
            header: "Usuario creador",
            accessorKey: "user_created",
            cell: (r) => <UserChip {...r.user_created} />,
        },
        {
            header: "Fecha creación",
            accessorKey: "date_created",
            cell: (r) => r.date_created,
        },
        {
            header: "Usuario modificador",
            accessorKey: "user_modified",
            cell: (r) => <UserChip {...r.user_modified} />,
        },
        {
            header: "Fecha de modificación",
            accessorKey: "date_modified",
            cell: (r) => r.date_modified,
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => (
                <span
                    className={`inline-block rounded-full px-4 py-1 text-sm font-medium text-white ${getStatusColor(
                        r.status
                    )}`}
                >
                    {r.status}
                </span>
            ),
        },
    ];
}

interface TemplatesFilters {
    subject: string;
    code: string;
    smtp_config_name: string;
    status: "" | "Activo" | "Inactivo";
}

// Reemplaza esta función por la actual
const getTemplatesFilters = (f: TemplatesFilters) => [
    {
        id: "subject",
        label: "Asunto",
        type: "text" as const,
        value: f.subject,
    },
    {
        id: "code",
        label: "Código",
        type: "text" as const,
        value: f.code,
    },
    {
        id: "smtp_config_name", // <-- id correcto para que aplique al campo del estado
        label: "SMTP (configuración)",
        type: "select" as const,
        value: f.smtp_config_name,
        options: [
            { label: "Todos", value: "" },
            ...Array.from(new Set(mockTemplatesRow.map((r) => r.smtp_config_name))).map(
                (smtp_config_name) => ({
                    label: smtp_config_name,
                    value: smtp_config_name,
                })
            ),
        ],
    },
    {
        id: "status",
        label: "Estado",
        type: "select" as const,
        value: f.status,
        options: [
            { label: "Todos", value: "" },
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
    },
];


/* ---------- página ---------- */
export default function TemplatesView() {
    const router = useRouter();

    // filtros
    const [templates] = useState<TemplatesRow[]>(mockTemplatesRow);
    const [filters, setFilters] = useState<TemplatesFilters>({
        subject: "",
        code: "",
        smtp_config_name: "",
        status: "",
    });

    const handleFilterChange = (id: string, value: string) => {
        setFilters((prev) => ({ ...prev, [id]: value }));
    };

    /* filtrar localmente */
    const filtered = templates.filter((r) => {
        const matchSubject = !filters.subject || r.subject === filters.subject;
        const matchCode = !filters.code || r.code === filters.code;
        const matchSmpt = !filters.smtp_config_name || r.smtp_config_name === filters.smtp_config_name;
        const matchStatus = !filters.status || r.status === filters.status;

        return matchSubject && matchCode && matchSmpt && matchStatus;
    });

    // paginacion
    const PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const startIndex = (currentPage - 1) * PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + PER_PAGE);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    /* export CSV */
    const handleExport = () => {
        const headers = [
            "ID",
            "Subject",
            "Code",
            "Smtp config name",
            "Status",
        ];
        const data = filtered.map((r) => [
            r.id,
            r.subject,
            r.code,
            r.smtp_config_name,
            r.status,
        ]);
        exportToCsv("templates.csv", [headers, ...data]);
    };

    /* acciones header */
    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: () => router.push(`/cuenta/centro-mensajes/templates-page/nuevo`),
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

    const columns = getColumns(router);

    const typeVehicleFilters = getTemplatesFilters(filters);

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Templates"
                filters={typeVehicleFilters}
                onFilterChange={handleFilterChange}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable
                            data={paginated}
                            dataType="General2"
                            statusKey="status"
                            columns={columns}
                            rowBgClass="bg-white"
                            rowPaddingY={12}
                            onRowClick={(row: TemplatesRow) => router.push(`/cuenta/centro-mensajes/templates-page/${encodeURIComponent(row.id)}`)}
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
