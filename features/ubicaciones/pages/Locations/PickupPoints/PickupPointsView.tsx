// app/views/Pickup/Points/Browse/PickupPointsView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/user-avatar";

/* Interfaz del listado */
interface PickupRow {
    id: string;              // ej: "s103"
    name: string;            // Nombre
    refId: string;           // Ref ID
    locationName: string;    // Location (Store XXX)
    scheduleScheme: string;  // Esquema horario
    startDay: string;        // Fecha inicio (día de la semana)
    startTime: string;       // Hora de inicio
    status: string;
    modifiedBy: { user: string; email: string };
}

/* Datos mock */
const MOCK: PickupRow[] = [
    {
        id: "s103",
        name: "Windows default",
        refId: "Windows default",
        locationName: "Store 103",
        scheduleScheme: "Windows default",
        startDay: "lunes",
        startTime: "11:00",
        status: "Activo",
        modifiedBy: { user: "Ana Marin", email: "ana@mimbral.com" },
    },
    {
        id: "s110",
        name: "Horario tienda",
        refId: "REF-110",
        locationName: "Store 101",
        scheduleScheme: "Horario tienda",
        startDay: "martes",
        startTime: "10:30",
        status: "Inactivo",
        modifiedBy: { user: "Juan Perez", email: "juan@mimbral.com" },
    },
];

/* Filtros para PageHeader */
type Filters = { search: string; status: "" | "Activo" | "Inactivo" };
const initialFilters: Filters = { search: "", status: "" };

function getFilters(filters: Filters) {
    return [
        {
            id: "search",
            label: "Buscar",
            type: "text" as const,
            placeholder: "Nombre, Ref ID o Location",
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
    ];
}

/* Columnas (mismo patrón que Ingreso) */
function getColumns(): Column<PickupRow>[] {
    return [
        { header: "ID", accessorKey: "id" },
        { header: "Nombre", accessorKey: "name" },
        { header: "Ref ID", accessorKey: "refId" },
        { header: "Ubicación", accessorKey: "locationName" },
        { header: "Esquema horario", accessorKey: "scheduleScheme" },
        {
            header: "Inicio",
            accessorKey: "startDay",
            cell: (r) => (
                <span className="text-sm text-gray-700">
                    {r.startDay} · {r.startTime}
                </span>
            ),
        },
        {
            header: "Usuario modificador",
            accessorKey: "modifiedBy",
            cell: (r) => <UserChip name={r.modifiedBy.user} email={r.modifiedBy.email} />,
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => {
                const bg = getStatusBg(row.status);
                return (
                    <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${bg}`}>
                        {row.status}
                    </div>
                );
            },
        },
    ];
}


/* ---------- helpers ---------- */
const getStatusBg = (status: string) => {
    if (status === "Activo") return "bg-green-500";
    if (status === "Inactivo") return "bg-gray-400";
    return "bg-gray-500";
};

/* mini-componente para “Modificado por” (UserChip) */
function UserChip({
    name,
    email,
}: {
    name: string;
    email: string;
}) {
    if (!name && !email) return <span>N/A</span>;

    return (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <Avatar
                name={name || email || "-"}
                alt={name || email || "-"}
                className="h-8 w-8"
            />
            <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-sm font-medium">{name || "Usuario desconocido"}</span>
                <span className="truncate text-xs text-gray-500">{email || ""}</span>
            </div>
        </div>
    );
}

/* Componente principal */
export default function PickupPointsView() {
    const router = useRouter();
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [currentPage, setCurrentPage] = useState(1);

    // Filtrado local (mock)
    const filtered = useMemo(() => {
        return MOCK.filter((r) => {
            const q = filters.search.toLowerCase();
            const mSearch =
                !q ||
                r.name.toLowerCase().includes(q) ||
                r.refId.toLowerCase().includes(q) ||
                r.locationName.toLowerCase().includes(q);
            const mStatus = !filters.status || r.status === filters.status;
            return mSearch && mStatus;
        });
    }, [filters]);

    // Paginación (idéntico patrón)
    const PER_PAGE = 10;
    const startIndex = (currentPage - 1) * PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + PER_PAGE);

    // Acciones del header
    const handleExport = () => {
        const headers = ["ID", "NOMBRE", "REF ID", "LOCATION", "ESQUEMA", "DÍA", "HORA", "ESTADO", "MODIFICADO POR", "EMAIL"];
        const rows = filtered.map((r) => [
            r.id,
            r.name,
            r.refId,
            r.locationName,
            r.scheduleScheme,
            r.startDay,
            r.startTime,
            r.status,
            r.modifiedBy.user,
            r.modifiedBy.email,
        ]);
        exportToCsv("puntos-pickup.csv", [headers, ...rows]);
    };

    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: () => router.push(`/ubicaciones/pickup-points/nuevo`),
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

    const pickupFilters = getFilters(filters);
    const columns = getColumns();

    const handleFilterChange = (id: string, value: string) => {
        setCurrentPage(1);
        setFilters((prev) => ({ ...prev, [id]: value as Filters[keyof Filters] }));
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                action={headerActions}
                title="Puntos de pickup"
                filters={pickupFilters}
                onFilterChange={handleFilterChange}
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
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: PickupRow) => router.push(`/ubicaciones/pickup-points/${encodeURIComponent(row.id)}`)}
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
