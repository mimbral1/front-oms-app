// views\Customers\CustomersAddress\Perfiles\PerfilesView.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowDownTrayIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/user-avatar";

/* ========= Tipos según API ========= */
type PersonaApi = {
    correo: string | null;
    nombre: string;
    imagen: string | null;
};

export type RolApi = {
    ID: number;
    NOMBRE: string;
    DESCRIPCION: string;
    FECHA_CREACION: string;       // ISO
    FECHA_ACTUALIZACION: string;  // ISO
    ACTIVO: boolean;
    creador: PersonaApi;
    actualizador: PersonaApi;
};

type RolesResponse = {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    data: RolApi[];
};
/* =================================== */

/* ---------- helpers ---------- */
const getStatusColor = (ACTIVO: boolean) => {
    // La API retorna "Activo", "Inactivo" (asumiendo que viene capitalizado así)
    if (ACTIVO === true) {
        return "bg-green-500"; // Color verde para activo
    } else if (ACTIVO === false) {
        return "bg-gray-400"; // Color gris para inactivo
    }
    return "bg-gray-500"; // Color por defecto si el estado es desconocido
};

// Convierte una fecha (string) en el rango UTC del día completo [00:00:00.000, 23:59:59.999]
function dayRangeUTC(dateStr: string) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)).toISOString();
    const end = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)).toISOString();
    return { start, end };
}


const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "--";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "--";
    return d.toLocaleString("es-CL", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

// Normaliza a YYYY-MM-DD para comparar solo por día
const toISODate = (s?: string | null) => {
    if (!s) return "";
    const d = new Date(s);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};
const sameDay = (a?: string | null, b?: string | null) =>
    !!toISODate(a) && !!toISODate(b) && toISODate(a) === toISODate(b);


/* ======= Filtros (-> query de la API) ======= */
// UI: Nombre, Usuario creador (email), Fecha de creación (día), Fecha de modificación (día)
interface ProfileFilters {
    name: string;
    creatorEmail: string;
    createdDate: string;   // un solo campo (día)
    updatedDate: string;   // un solo campo (día)
}
const getProfileFilters = (f: ProfileFilters) => [
    { id: "name", label: "Nombre", type: "text" as const, value: f.name },
    { id: "creatorEmail", label: "Usuario creador (email)", type: "text" as const, value: f.creatorEmail },
    { id: "createdDate", label: "Fecha de creación", type: "datetime" as const, value: f.createdDate },
    { id: "updatedDate", label: "Fecha de modificación", type: "datetime" as const, value: f.updatedDate },
];

// para usuario
const UserPill = ({ person }: { person?: PersonaApi }) => {
    const name = (person?.nombre || "").trim() || "N/A";
    const email = person?.correo || "n/a@example.com";
    const img = person?.imagen || "";

    return (
        <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 px-3 py-1">
            <Avatar
                name={name || email || "N"}
                src={img || undefined}
                alt={name}
                className="h-8 w-8"
            />
            <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-gray-900 leading-4 truncate">{name}</span>
                <span className="text-xs text-gray-500 leading-4 truncate max-w-[220px]">{email}</span>
            </div>
        </div>
    );
};


/* ============ Columnas (claves de la API) ============ */
function getColumns(router: ReturnType<typeof useRouter>): Column<RolApi>[] {
    return [
        {
            header: "NOMBRE",
            accessorKey: "NOMBRE",
            cell: (r) => r.NOMBRE || "--",
        },
        {
            header: "DESCRIPCIÓN",
            accessorKey: "DESCRIPCION",
            cell: (r) => r.DESCRIPCION || "--",
        },
        {
            header: "CREACIÓN",
            accessorKey: "FECHA_CREACION",
            cell: (r) => formatDate(r.FECHA_CREACION),
        },
        {
            header: "USUARIO CREADOR",
            accessorKey: "creador",
            cell: (r) => <UserPill person={r.creador} />,
        },
        {
            header: "MODIFICADO",
            accessorKey: "FECHA_ACTUALIZACION",
            cell: (r) => formatDate(r.FECHA_ACTUALIZACION),
        },
        {
            header: "USUARIO MODIFICADOR",
            accessorKey: "actualizador",
            cell: (r) => <UserPill person={r.actualizador} />,
        },
        {
            header: "Estado",
            accessorKey: "ACTIVO",
            cell: (row: RolApi) => {
                const bgColor = getStatusColor(row.ACTIVO);
                const displayStatusText =
                    row.ACTIVO === true ? "Activo" : row.ACTIVO === false;

                return (
                    <div
                        className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${bgColor}`}
                    >
                        {displayStatusText}
                    </div>
                );
            },
        },
    ];
}

/* =================== Página =================== */
export function PerfilesView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(router), [router]);
    const { fetchWithAuth } = useFetchWithAuth(); // ↍ igual que en precios
    const { token } = useAuth();

    const [rows, setRows] = useState<RolApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    // manejo de errores 
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const PER_PAGE = 10;

    const [filters, setFilters] = useState<ProfileFilters>({
        name: "",
        creatorEmail: "",
        createdDate: "",
        updatedDate: "",
    });

    // Helpers de paginación (evitan salirse de rango)
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // Construcción de query EXACTA al patrón del proyecto
    const buildQuery = () => {
        const p = new URLSearchParams();
        p.append("page", String(currentPage));
        p.append("pageSize", String(PER_PAGE));

        if (filters.name) p.append("name", filters.name);
        if (filters.creatorEmail) p.append("creatorEmail", filters.creatorEmail);

        // Fechas por DÍA (rango completo)
        const cr = filters.createdDate ? dayRangeUTC(filters.createdDate) : null;
        if (cr) {
            p.append("createdFrom", cr.start);
            p.append("createdTo", cr.end);
        }

        const up = filters.updatedDate ? dayRangeUTC(filters.updatedDate) : null;
        if (up) {
            p.append("updatedFrom", up.start);
            p.append("updatedTo", up.end);
        }

        return p.toString();
    };

    // carga los datos desde la api 
    const fetchRoles = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setErrorMessage(null);

        try {
            const qs = buildQuery();

            // La API a veces puede responder { message: "Tu usuario no tiene permiso..." }
            const raw = await fetchWithAuth<any>(`idservice/all-roles?${qs}`);

            if (raw && typeof raw === "object" && "message" in raw && !Array.isArray((raw as any).data)) {
                throw new Error(String(raw.message || "Error al obtener roles."));
            }

            const resp = raw as RolesResponse;

            const serverRows = resp.data ?? [];

            // --- Post-filtro para cubrir casos donde la API no filtre esos campos ---
            let filtered = serverRows;

            if (filters.creatorEmail.trim()) {
                const needle = filters.creatorEmail.trim().toLowerCase();
                filtered = filtered.filter(r => {
                    const name = (r.creador?.nombre ?? "").toLowerCase();
                    const email = (r.creador?.correo ?? "").toLowerCase();
                    return name.includes(needle) || email.includes(needle);
                });
            }

            if (filters.createdDate) {
                filtered = filtered.filter(r => sameDay(r.FECHA_CREACION, filters.createdDate));
            }

            if (filters.updatedDate) {
                filtered = filtered.filter(r => sameDay(r.FECHA_ACTUALIZACION, filters.updatedDate));
            }
            // -----------------------------------------------------------------------

            setRows(filtered);
            setTotalPages(resp.totalPages ?? 1);
            setTotalRecords(resp.totalRecords ?? filtered.length);
        } catch (error: any) {
            console.error("Error al obtener roles:", error);
            setRows([]);
            setTotalPages(1);
            setTotalRecords(0);

            const msg =
                typeof error === "string"
                    ? error
                    : error?.message || "Error al obtener roles.";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    }, [token, currentPage, filters, fetchWithAuth]);


    useEffect(() => {
        if (!token) return;
        fetchRoles();
    }, [token, currentPage, filters, fetchRoles]);

    const handleExport = () => {
        const headers = [
            "ID",
            "NOMBRE",
            "DESCRIPCION",
            "FECHA_CREACION",
            "FECHA_ACTUALIZACION",
            "ACTIVO",
            "creador.correo",
            "creador.nombre",
            "actualizador.correo",
            "actualizador.nombre",
        ];
        const data = rows.map(r => [
            r.ID,
            r.NOMBRE,
            r.DESCRIPCION,
            r.FECHA_CREACION,
            r.FECHA_ACTUALIZACION,
            r.ACTIVO ? "Activo" : "Inactivo",
            r.creador?.correo ?? "",
            r.creador?.nombre ?? "",
            r.actualizador?.correo ?? "",
            r.actualizador?.nombre ?? "",
        ]);
        exportToCsv("roles.csv", [headers, ...data]);
    };

    const handleCreate = () => {
        router.push(`/cuenta/perfiles/nuevo`);
    };

    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: handleCreate,
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary" as const,
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Perfiles"
                action={headerActions}
                filters={getProfileFilters(filters)}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters(prev => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />
            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <div className="mt-0 overflow-x-auto border rounded-md bg-white">
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
                            className="mt-0 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">Error al cargar perfiles</h3>
                                    <p className="mt-2 text-sm">
                                        {errorMessage}
                                    </p>
                                    <div className="mt-4">
                                        <div className="-mx-2 -my-1.5 flex">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setErrorMessage(null);
                                                    fetchRoles();
                                                }}
                                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DataTable<RolApi>
                            data={rows}
                            columns={columns}
                            dataType="General2"
                            statusKey="ACTIVO"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: RolApi) =>
                                router.push(`/cuenta/perfiles/${row.ID}`)
                            }
                        />
                    )}

                    {/* Paginación simple */}
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
