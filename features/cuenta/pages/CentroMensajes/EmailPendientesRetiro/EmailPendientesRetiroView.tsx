// app/views/Configuracion/Entrega/EmailPendienteRetiro/Browse/EmailPendienteRetiroView.tsx
"use client";

/* ---------- Imports (mismo estilo del view original) ---------- */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";

/* ---------- Tipos UI ---------- */
type Estado = "Enviado" | "ErrorTemplate";

interface PendingPickupEmailRow {
    id: number;
    plantilla: string;
    entidad: string;
    entidadId: string;
    notificaciones: {
        email: Estado;
        whatsapp: Estado;
    };
    diasDeEspera: number;
    fechaCreacion: string;
    fechaActualizacion: string;
    estado: Estado;
}

/* ---------- Helpers UI ---------- */
const PER_PAGE = 20;

const StatusPill = ({ state }: { state: Estado }) => {
    const isOk = state === "Enviado";
    const label = isOk ? "Enviado" : "Error de template";
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${isOk ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                }`}
        >
            {label}
        </span>
    );
};

const InlineBadge = ({ text }: { text: string }) => (
    <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-green-100 text-green-700">
        {text}
    </span>
);

const NotificationsCell = ({ n }: { n: PendingPickupEmailRow["notificaciones"] }) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center text-sm text-gray-700">
            <EnvelopeIcon className="mr-2 h-4 w-4" />
            <span>email</span>
            <InlineBadge text={n.email} />
        </div>
        <div className="flex items-center text-sm text-gray-700">
            <PhoneIcon className="mr-2 h-4 w-4" />
            <span>whatsapp</span>
            <InlineBadge text={n.whatsapp} />
        </div>
    </div>
);

/* ---------- Columnas ---------- */
function getColumns(): Column<PendingPickupEmailRow>[] {
    return [
        { header: "ID", accessorKey: "id" },
        { header: "Plantilla", accessorKey: "plantilla" },
        {
            header: "Entidad",
            accessorKey: "entidad",
            cell: (r) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{r.entidad}</span>
                    <span className="text-xs text-gray-500">{r.entidadId}</span>
                </div>
            ),
        },
        {
            header: "Notificaciones",
            accessorKey: "notificaciones",
            cell: (r) => <NotificationsCell n={r.notificaciones} />,
        },
        { header: "Días de espera", accessorKey: "diasDeEspera" },
        { header: "Creación", accessorKey: "fechaCreacion" },
        { header: "Actualización", accessorKey: "fechaActualizacion" },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (r) => <StatusPill state={r.estado} />,
        },
    ];
}

/* ---------- Filtros Header (manteniendo patrón del original) ---------- */
interface Filters {
    search: string;
    status: string; // "", "Enviado", "Error de template"
}

const getFiltersConfig = (f: Filters) => {
    return [
        { id: "search", label: "Buscar", type: "text" as const, value: f.search },
        {
            id: "status",
            label: "Estado",
            type: "select" as const,
            value: f.status,
            options: [
                { label: "Todos", value: "" },
                { label: "Enviado", value: "Enviado" },
                { label: "Error de template", value: "ErrorTemplate" },
            ],
        },
    ];
};

/* ---------- Página ---------- */
export default function EmailPendienteRetiroView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const { fetchWithAuth } = useFetchWithAuth();
    const { token } = useAuth();

    // tabla
    const [rows, setRows] = useState<PendingPickupEmailRow[]>([]);
    const [loading, setLoading] = useState(true);

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // filtros
    const [filters, setFilters] = useState<Filters>({
        search: "",
        status: "",
    });

    // cargar listado principal (MOCK con los datos de la imagen)
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const all: PendingPickupEmailRow[] = [
                {
                    id: 1,
                    plantilla: "pending-candidates",
                    entidad: "order",
                    entidadId: "65c6587537de1fa1ee1663e9",
                    notificaciones: { email: "Enviado", whatsapp: "Enviado" },
                    diasDeEspera: 1,
                    fechaCreacion: "09/02/2024 13:58",
                    fechaActualizacion: "09/02/2024 13:58",
                    estado: "Enviado",
                },
                {
                    id: 2,
                    plantilla: "order-ready-for-picking",
                    entidad: "order",
                    entidadId: "65c6587537de1fa1ee1663e9",
                    notificaciones: { email: "Enviado", whatsapp: "Enviado" },
                    diasDeEspera: 1,
                    fechaCreacion: "09/02/2024 13:54",
                    fechaActualizacion: "09/02/2024 13:54",
                    estado: "ErrorTemplate",
                },
                {
                    id: 3,
                    plantilla: "shipping-delivered",
                    entidad: "shipping",
                    entidadId: "65c3ebb0abd7cc0ba7d370d1",
                    notificaciones: { email: "Enviado", whatsapp: "Enviado" },
                    diasDeEspera: 1,
                    fechaCreacion: "07/02/2024 17:46",
                    fechaActualizacion: "07/02/2024 17:46",
                    estado: "Enviado",
                },
                {
                    id: 4,
                    plantilla: "shipping-arrived-to-receiver",
                    entidad: "shipping",
                    entidadId: "65c3ebb0abd7cc0ba7d370d1",
                    notificaciones: { email: "Enviado", whatsapp: "Enviado" },
                    diasDeEspera: 1,
                    fechaCreacion: "07/02/2024 17:45",
                    fechaActualizacion: "07/02/2024 17:45",
                    estado: "Enviado",
                },
                {
                    id: 5,
                    plantilla: "shipping-on-the-way",
                    entidad: "shipping",
                    entidadId: "65c3ebb0abd7cc0ba7d370d1",
                    notificaciones: { email: "Enviado", whatsapp: "Enviado" },
                    diasDeEspera: 1,
                    fechaCreacion: "07/02/2024 17:44",
                    fechaActualizacion: "07/02/2024 17:44",
                    estado: "Enviado",
                },
            ];

            // Filtros
            const q = (filters.search || "").toLowerCase();
            const status = filters.status;

            let filtered = all.filter((r) => {
                const matchesSearch =
                    !q ||
                    `${r.id} ${r.plantilla} ${r.entidad} ${r.entidadId}`.toLowerCase().includes(q); // incluye Entidad + EntidadId

                const matchesStatus = !status || r.estado === status;

                return matchesSearch && matchesStatus;
            });


            const total = filtered.length;
            const pageSize = PER_PAGE;
            const start = (currentPage - 1) * pageSize;
            const end = Math.min(start + pageSize, total);
            const pageRows = filtered.slice(start, end);

            setRows(pageRows);
            setTotalRecords(total);
            setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
        } catch (err: any) {
            console.error("Error listando Email pendiente de retiro:", err?.payload ?? err);
            setRows([]);
            setTotalRecords(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [filters.search, filters.status, currentPage]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* acciones header (mismo patrón, actualizando export) */
    const handleExport = useCallback(() => {
        const headers = [
            "ID",
            "Plantilla",
            "Entidad",
            "EntidadId",
            "Notificaciones (email/whatsapp)",
            "Días de espera",
            "Fecha creación",
            "Fecha actualización",
            "Estado",
        ];
        const data = rows.map((r) => [
            r.id,
            r.plantilla,
            r.entidad,
            r.entidadId,
            `${r.notificaciones.email} / ${r.notificaciones.whatsapp}`,
            r.diasDeEspera,
            r.fechaCreacion,
            r.fechaActualizacion,
            r.estado,
        ]);
        exportToCsv("email-pendiente-retiro.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/cuenta/centro-mensajes/email-pendientes-retiro/nuevo"),
                icon: <PlusIcon className="h-5 w-5" />,
            },
            { label: "Exportar", variant: "primary", onClick: handleExport, icon: <ArrowDownTrayIcon className="h-5 w-5" /> },
            { label: "Actualizar", variant: "secondary", onClick: () => fetchList(), icon: <ArrowPathIcon className="h-5 w-5" /> },
        ],
        [router, handleExport, fetchList]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Email pendiente de retiro"
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
                        <p>Cargando…</p>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="EmailPendienteRetiro"
                            statusKey="estado"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: PendingPickupEmailRow) =>
                                router.push(`/cuenta/centro-mensajes/email-pendientes-retiro/${row.id}`)
                            }
                        />
                    )}

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
