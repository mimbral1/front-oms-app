// app/views/Logs/Browse/LogsView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import UpdateIcon from "@mui/icons-material/Update";
import { Pagination } from "@/components/ui/pagination";

/* Tipado de fila */
interface LogRow {
    id: string;
    servicio: string;
    entidad: string;
    idEntidad: string;
    motivo: string;
    mensaje: string;
    creacion: string;
    usuario: {
        initials: string;
        name: string;
        email: string;
    };
    expira: string;
}

/* Mock de datos completo (idéntico a la captura) */
const MOCK: LogRow[] = [
    {
        id: "LOG-01",
        servicio: "id",
        entidad: "user",
        idEntidad: "61ae20eb0be00246e1beba0c",
        motivo: "login",
        mensaje: "Login User Succesfull",
        creacion: "16/12/2021 12:41:34",
        usuario: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
        expira: "15/01/2022 12:41:34",
    },
    {
        id: "LOG-02",
        servicio: "commerce",
        entidad: "api",
        idEntidad: "account",
        motivo: "api-request",
        mensaje: "POST /api/account/614e0abccbbd4900083749cb/process (200)",
        creacion: "16/12/2021 11:20:06",
        usuario: { initials: "", name: "", email: "" },
        expira: "15/01/2022 11:20:06",
    },
    {
        id: "LOG-03",
        servicio: "commerce",
        entidad: "api",
        idEntidad: "account",
        motivo: "api-request",
        mensaje: "POST /api/account/614e0abccbbd4900083749cb/process (200)",
        creacion: "16/12/2021 11:20:06",
        usuario: { initials: "", name: "", email: "" },
        expira: "15/01/2022 11:20:06",
    },
    {
        id: "LOG-04",
        servicio: "commerce",
        entidad: "api",
        idEntidad: "account",
        motivo: "api-request",
        mensaje: "POST /api/account/614e0abccbbd4900083749cb/process (200)",
        creacion: "16/12/2021 11:20:05",
        usuario: { initials: "", name: "", email: "" },
        expira: "15/01/2022 11:20:05",
    },
    {
        id: "LOG-05",
        servicio: "id",
        entidad: "api",
        idEntidad: "change-client",
        motivo: "api-request",
        mensaje: "POST /api/change-client (200)",
        creacion: "16/12/2021 11:14:08",
        usuario: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
        expira: "15/01/2022 11:14:08",
    },
    {
        id: "LOG-06",
        servicio: "id",
        entidad: "user",
        idEntidad: "5ec7ef9c22e6b12910913282",
        motivo: "activeClientUnselected",
        mensaje: "-",
        creacion: "16/12/2021 11:14:08",
        usuario: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
        expira: "15/01/2022 11:14:08",
    },
    {
        id: "LOG-07",
        servicio: "id",
        entidad: "user",
        idEntidad: "5ec7ef9c22e6b12910913282",
        motivo: "updated",
        mensaje: "-",
        creacion: "16/12/2021 11:14:08",
        usuario: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
        expira: "15/01/2022 11:14:08",
    },
    {
        id: "LOG-08",
        servicio: "wms",
        entidad: "api",
        idEntidad: "sprint",
        motivo: "api-request",
        mensaje: "POST /api/sprint/61ba4b593d2231000826a10d/assign (200)",
        creacion: "16/12/2021 11:13:55",
        usuario: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
        expira: "15/01/2022 11:13:55",
    },
    {
        id: "LOG-09",
        servicio: "wms",
        entidad: "movement",
        idEntidad: "-",
        motivo: "updated",
        mensaje: "-",
        creacion: "16/12/2021 11:13:55",
        usuario: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
        expira: "15/01/2022 11:13:55",
    },
    {
        id: "LOG-10",
        servicio: "wms",
        entidad: "sprint",
        idEntidad: "61ba4b593d2231000826a10d",
        motivo: "updated",
        mensaje: "-",
        creacion: "16/12/2021 11:13:55",
        usuario: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
        expira: "15/01/2022 11:13:55",
    },
    {
        id: "LOG-11",
        servicio: "document-generator",
        entidad: "document",
        idEntidad: "61bb49d6b67127000885bf5e",
        motivo: "upserted",
        mensaje: "-",
        creacion: "16/12/2021 11:13:02",
        usuario: { initials: "", name: "", email: "" },
        expira: "15/01/2022 11:13:02",
    },
    {
        id: "LOG-12",
        servicio: "delivery",
        entidad: "package",
        idEntidad: "-",
        motivo: "inserted",
        mensaje: "-",
        creacion: "16/12/2021 11:13:01",
        usuario: { initials: "", name: "", email: "" },
        expira: "15/01/2022 11:13:01",
    },
    {
        id: "LOG-13",
        servicio: "document-generator",
        entidad: "api",
        idEntidad: "document",
        motivo: "api-request",
        mensaje: "POST /api/document (200)",
        creacion: "16/12/2021 11:13:01",
        usuario: { initials: "", name: "", email: "" },
        expira: "15/01/2022 11:13:01",
    },
    {
        id: "LOG-14",
        servicio: "document-generator",
        entidad: "document",
        idEntidad: "-",
        motivo: "inserted",
        mensaje: "-",
        creacion: "16/12/2021 11:13:01",
        usuario: { initials: "", name: "", email: "" },
        expira: "15/01/2022 11:13:01",
    },
];

/* Helpers UI */
const PER_PAGE = 60;

function UserChip({ name, email, initials }: { name: string; email: string; initials: string }) {
    if (!name && !email && !initials) return null;
    return (
        <div className="inline-flex max-w-[260px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-xs font-semibold text-white">
                {initials?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-sm font-medium">{name || "—"}</span>
                <span className="truncate text-xs text-gray-500">{email || "—"}</span>
            </div>
        </div>
    );
}


/* Filtros superiores (como en el screenshot) */
type Filters = {
    servicio: string;
    entidad: string;
    idEntidad: string;
    motivo: string;
    mensaje: string;
};
const initialFilters: Filters = { servicio: "", entidad: "", idEntidad: "", motivo: "", mensaje: "" };

function getFilters(filters: Filters) {
    return [
        { id: "servicio", label: "Servicio", type: "text" as const, value: filters.servicio, placeholder: "id / commerce / wms…" },
        { id: "entidad", label: "Entidad", type: "text" as const, value: filters.entidad, placeholder: "api / user / movement…" },
        { id: "idEntidad", label: "ID Entidad", type: "text" as const, value: filters.idEntidad, placeholder: "61ae20e… / account / -" },
        { id: "motivo", label: "Motivo", type: "text" as const, value: filters.motivo, placeholder: "api-request / login / updated…" },
        { id: "mensaje", label: "Mensaje", type: "text" as const, value: filters.mensaje, placeholder: "POST /api/… (200)" },
    ];
}

/* Columnas (alineadas al header del listado) */
function getColumns(router: ReturnType<typeof useRouter>): Column<LogRow>[] {
    return [
        { header: "Servicio", accessorKey: "servicio" },
        { header: "Entidad", accessorKey: "entidad" },
        { header: "ID Entidad", accessorKey: "idEntidad" },
        { header: "Motivo", accessorKey: "motivo" },
        { header: "Mensaje", accessorKey: "mensaje" },
        { header: "Creación", accessorKey: "creacion" },
        {
            header: "Usuario creador",
            accessorKey: "usuario",
            cell: (r) => {
                const user = r.usuario;
                if (!user?.name && !user?.email && !user?.initials) {
                    return <div className="h-10" />; // mismo truco
                }
                return <UserChip name={user.name} email={user.email} initials={user.initials} />;
            },
        },


        { header: "Expira", accessorKey: "expira" },
    ];
}

/* View principal */
export default function LogsView() {
    const router = useRouter();
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [currentPage, setCurrentPage] = useState(1);

    const viewFilters = getFilters(filters);
    const columns = getColumns(router);

    const filtered = useMemo(() => {
        const f = {
            servicio: filters.servicio.toLowerCase(),
            entidad: filters.entidad.toLowerCase(),
            idEntidad: filters.idEntidad.toLowerCase(),
            motivo: filters.motivo.toLowerCase(),
            mensaje: filters.mensaje.toLowerCase(),
        };
        return MOCK.filter((r) => {
            const byServicio = !f.servicio || r.servicio.toLowerCase().includes(f.servicio);
            const byEntidad = !f.entidad || r.entidad.toLowerCase().includes(f.entidad);
            const byIdEnt = !f.idEntidad || r.idEntidad.toLowerCase().includes(f.idEntidad);
            const byMotivo = !f.motivo || r.motivo.toLowerCase().includes(f.motivo);
            const byMensaje = !f.mensaje || r.mensaje.toLowerCase().includes(f.mensaje);
            return byServicio && byEntidad && byIdEnt && byMotivo && byMensaje;
        });
    }, [filters]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const startIndex = (currentPage - 1) * PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + PER_PAGE);

    // Paginación tipo “1 2 3 …” como en tus otras vistas
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    const headerActions: Action[] = [
        { label: "Nuevo", variant: "success" as const, onClick: () => router.push(`/cuenta/trace/logs/nuevo`), icon: <PlusIcon className="h-5 w-5" /> },
        {
            label: "Exportar",
            variant: "primary" as const,
            onClick: () =>
                exportToCsv(
                    "logs.csv",
                    filtered.map((r) => ({
                        Servicio: r.servicio,
                        Entidad: r.entidad,
                        "ID Entidad": r.idEntidad,
                        Motivo: r.motivo,
                        Mensaje: r.mensaje,
                        Creacion: r.creacion,
                        "Usuario creador": r.usuario.name,
                        Email: r.usuario.email,
                        Expira: r.expira,
                    }))
                ),
            icon: <UpdateIcon fontSize="small" />,
        },
        { label: "Actualizar", variant: "secondary", onClick: () => setFilters((f) => ({ ...f })), icon: <ArrowPathIcon className="h-5 w-5" /> },
    ];

    const handleFilterChange = (id: string, value: string) => {
        setCurrentPage(1);
        setFilters((prev) => ({ ...prev, [id]: value as Filters[keyof Filters] }));
    };

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader title="Logs" filters={viewFilters} onFilterChange={handleFilterChange} action={headerActions} />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable
                            data={paginated}
                            columns={columns}
                            dataType="General2"
                            // statusKey="status"
                            rowPaddingY={12}
                            rowBgClass="bg-white"
                            onRowClick={(row: LogRow) => router.push(`/cuenta/trace/logs/${encodeURIComponent(row.id)}`)}
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
