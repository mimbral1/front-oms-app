"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { getEstadoColor } from "@/utils/status";

interface UnidadesMedidaRow {
    id: string;
    modalidad: string;
    creacion: string;
    usuario_creador: { initials: string; name: string; email: string };
    modificado: string;
    usuario: { initials: string; name: string; email: string };
    status: "Activo" | "Inactivo" | "";
}

const mockUnidadesMedidaRow: UnidadesMedidaRow[] = [
    {
        "id": "1",
        "modalidad": "un",
        "creacion": "04/02/2021 17:12",
        "usuario_creador": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "modificado": "23/10/2023 19:01",
        "usuario": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "status": "Activo"
    },
    {
        "id": "2",
        "modalidad": "rom",
        "creacion": "17/11/2022 07:47",
        "usuario_creador": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "modificado": "17/11/2022 07:47",
        "usuario": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "status": "Activo"
    },
    {
        "id": "3",
        "modalidad": "pz",
        "creacion": "17/11/2022 07:46",
        "usuario_creador": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "modificado": "17/11/2022 07:46",
        "usuario": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "status": "Activo"
    },
    {
        "id": "4",
        "modalidad": "pls",
        "creacion": "17/11/2022 07:47",
        "usuario_creador": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "modificado": "17/11/2022 07:47",
        "usuario": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "status": "Activo"
    },
    {
        "id": "5",
        "modalidad": "pce",
        "creacion": "17/11/2022 07:47",
        "usuario_creador": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "modificado": "17/11/2022 07:47",
        "usuario": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "status": "Activo"
    },
    {
        "id": "6",
        "modalidad": "pal",
        "creacion": "17/11/2022 07:47",
        "usuario_creador": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "modificado": "17/11/2022 07:47",
        "usuario": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "status": "Activo"
    },
    {
        "id": "7",
        "modalidad": "pak",
        "creacion": "17/11/2022 07:47",
        "usuario_creador": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "modificado": "17/11/2022 07:47",
        "usuario": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "status": "Activo"
    },
    {
        "id": "8",
        "modalidad": "mp",
        "creacion": "17/11/2022 07:47",
        "usuario_creador": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "modificado": "17/11/2022 07:47",
        "usuario": {
            "initials": "EN",
            "name": "Ezequiel Naveiro",
            "email": "ezequiel.naveiro@example.com"
        },
        "status": "Activo"
    }
];

/* ---------- helpers ---------- */
const getStatusColor = getEstadoColor;

/* mini-componente para “Usuario creador” */
function UserChip({
    initials,
    name,
    email,
}: {
    initials: string;
    name: string;
    email: string;
}) {
    return (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                {initials}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="truncate text-xs text-gray-500">{email}</span>
            </div>
        </div>
    );
}

function getColumns(router: ReturnType<typeof useRouter>): Column<UnidadesMedidaRow>[] {
    return [
        {
            header: (
                <div className="flex items-center gap-1">
                    <span>Modalidad</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.25 4.42a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            ),
            accessorKey: "modalidad",
            cell: (r: UnidadesMedidaRow) => (
                <div onClick={() => router.push(`/catalogo/configuraciones-catalogo/unidades-medida/${r.id}`)}>
                    <span className="text-sm text-gray-800">{r.modalidad}</span>
                </div>
            ),
        },
        {
            header: "creación",
            accessorKey: "creacion",
            cell: (r) => r.creacion,
        },
        {
            header: "Usuario creador",
            accessorKey: "usuario_creador",
            cell: (r) => <UserChip {...r.usuario_creador} />,
        },
        {
            accessorKey: "modificado",
            header: "Modificado",
            cell: (r) => r.modificado,
        },
        {
            header: "Usuario",
            accessorKey: "usuario",
            cell: (r) => <UserChip {...r.usuario} />,
        },
        {
            header: "Status",
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

/* ---------- filtros para PageHeader ---------- */
interface UnidadesMedidaFilters {
    modalidad: string;
    usuario_creador: string;
    fecha_desde: string;
    fecha_hasta: string;
    usuario: string;
}

const getUnidadesMedidaFilters = (f: UnidadesMedidaFilters) => [
    {
        id: "modalidad",
        label: "Modalidad",
        type: "text" as const,
        value: f.modalidad,
    },
    {
        id: "usuario_creador",
        label: "Usuario creador",
        type: "select" as const,
        value: f.usuario_creador,
        options: [
            { label: "Seleccionar", value: "" },
            ...Array.from(new Set(mockUnidadesMedidaRow.map((r) => r.usuario_creador.name))).map((usuario_creador) => ({
                label: usuario_creador,
                value: usuario_creador,
            })),
        ],
    },
    {
        id: "usuario",
        label: "Usuario",
        type: "select" as const,
        value: f.usuario,
        options: [
            { label: "Seleccionar", value: "" },
            ...Array.from(new Set(mockUnidadesMedidaRow.map((r) => r.usuario.name))).map(
                (usuario) => ({
                    label: usuario,
                    value: usuario,
                })
            ),
        ],
    },
    {
        id: "fecha_desde",
        label: "Fecha desde",
        type: "datetime" as const,
        value: f.fecha_desde,
    },
    {
        id: "fecha_hasta",
        label: "Fecha hasta",
        type: "datetime" as const,
        value: f.fecha_hasta,
    },

];

/* ---------- página ---------- */
export default function UnidadesMedidaView() {

    const router = useRouter();

    const [unidadesMedida] = useState<UnidadesMedidaRow[]>(mockUnidadesMedidaRow);
    const [filters, setFilters] = useState<UnidadesMedidaFilters>({
        modalidad: "",
        usuario_creador: "",
        fecha_desde: "",
        fecha_hasta: "",
        usuario: "",
    });

    const handleFilterChange = (id: string, value: string) => {
        setFilters((prev) => ({ ...prev, [id]: value }));
    };

    /* filtrar localmente */
    const filteredUnidadesMedida = unidadesMedida.filter((r) => {
        const matchModalidad = !filters.modalidad || r.modalidad === filters.modalidad;
        const matchUsuarioCreador = !filters.usuario_creador || r.usuario_creador.name === filters.usuario_creador;
        const matchUsuario = !filters.usuario || r.usuario.name === filters.usuario;

        // Parse fechas en formato dd/mm/yyyy hh:mm
        const creacionDate = new Date(
            r.creacion.split(" ")[0].split("/").reverse().join("-") + "T" + r.creacion.split(" ")[1]
        );

        const desde = filters.fecha_desde ? new Date(filters.fecha_desde) : null;
        const hasta = filters.fecha_hasta ? new Date(filters.fecha_hasta) : null;

        const matchDesde = !desde || creacionDate >= desde;
        const matchHasta = !hasta || creacionDate <= hasta;

        return matchModalidad && matchUsuarioCreador && matchUsuario && matchDesde && matchHasta;
    });


    /* paginación */
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const totalPages = Math.ceil(filteredUnidadesMedida.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredUnidadesMedida.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );


    const columns = getColumns(router);

    const unidadesMedidaFilters = getUnidadesMedidaFilters(filters);

    /* export CSV */
    const handleExport = () => {
        const headers = [
            "ID",
            "Modalidad",
            "Creación",
            "Usuario creador",
            "Usuario creador",
            "Modificado",
            "Usuario",
            "Status",
        ];
        const data = filteredUnidadesMedida.map((r) => [
            r.id,
            r.modalidad,
            r.creacion,
            r.usuario_creador,
            r.modificado,
            r.usuario,
            r.status,
        ]);
        exportToCsv("unidadesmedida.csv", [headers, ...data]);
    };

    /* acciones header */
    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: () => router.push("/catalogo/configuraciones-catalogo/unidades-medida/nuevo"),
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
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title="Unidades de medida"
                filters={unidadesMedidaFilters}
                onFilterChange={handleFilterChange}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable
                            data={paginatedData}
                            dataType="product"
                            statusKey="status"
                            columns={columns}
                            rowBgClass="bg-white"
                            rowPaddingY={8}
                        />
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        {mockUnidadesMedidaRow.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                        <div className="text-sm text-gray-500">
                            {mockUnidadesMedidaRow.length} resultados
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

