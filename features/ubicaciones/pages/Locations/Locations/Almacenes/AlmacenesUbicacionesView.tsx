"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Action, PageHeaderProps } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import {
    EyeIcon,
    XCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { DataTable, Column } from "@/components/ui/table";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { useFetchWithAuth } from "@/lib/http/client";
import DetalleAlmacenesUbicacionesModal from "./DetalleAlmacenesUbicacionesModal";

/* ──────────────────────────────
   Tipos
────────────────────────────── */
interface Warehouse {
    id: string;
    locationId: number;
    name: string;
    referenceId: string;
    group: string | null;
    status: string;

    dateCreatedCL: string;
    dateModifiedCL: string | null;

    userCreatedProfile?: {
        nombres: string;
        apellidos: string;
        email: string;
        urlImagenPerfil?: string;
    };

    userModifiedProfile?: {
        nombres: string;
        apellidos: string;
        email: string;
        urlImagenPerfil?: string;
    };

    salesChannels: { referenceId: string; isActive: boolean }[];
    tasks: { code: string; isActive: boolean }[];
    limitedToSellers: { sellerReferenceId: string; isActive: boolean }[];
}

/* ---------- helpers ---------- */
const getStatusColor = (status: string) =>
    status === "active" ? "bg-green-500" : "bg-gray-400";

/* ---------- columnas ---------- */
const getColumns = (
    onViewDetail: (w: Warehouse) => void
): Column<Warehouse>[] => [
        { header: "ID", accessorKey: "id" },
        { header: "Ubicación", accessorKey: "locationId" },
        {
            header: "Nombre",
            accessorKey: "name",
            cell: (r) => <span className="font-medium">{r.name}</span>,
        },
        { header: "Referencia", accessorKey: "referenceId" },
        {
            header: "Grupo",
            accessorKey: "group",
            cell: (r) => <span>{r.group ?? "—"}</span>,
        },
        {
            header: "Creado",
            accessorKey: "dateCreatedCL",
            cell: (r) => <span className="text-sm">{r.dateCreatedCL}</span>,
        },
        {
            header: "Modificado",
            accessorKey: "dateModifiedCL",
            cell: (r) => <span className="text-sm">{r.dateModifiedCL ?? "—"}</span>,
        },
        {
            header: "Usuario creador",
            accessorKey: "userCreatedProfile",
            cell: (r) =>
                r.userCreatedProfile ? (
                    <div className="flex items-center gap-2 text-sm">
                        <Avatar
                            name={`${r.userCreatedProfile.nombres} ${r.userCreatedProfile.apellidos}`}
                        />
                        <span className="truncate max-w-[140px]">
                            {r.userCreatedProfile.nombres}{" "}
                            {r.userCreatedProfile.apellidos}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400">—</span>
                ),
        },
        {
            header: "Usuario modificador",
            accessorKey: "userModifiedProfile",
            cell: (r) =>
                r.userModifiedProfile ? (
                    <div className="flex items-center gap-2 text-sm">
                        <Avatar
                            name={`${r.userModifiedProfile.nombres} ${r.userModifiedProfile.apellidos}`}
                        />
                        <span className="truncate max-w-[140px]">
                            {r.userModifiedProfile.nombres}{" "}
                            {r.userModifiedProfile.apellidos}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400">—</span>
                ),
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => {
                const bg = getStatusColor(r.status);
                return (
                    <div
                        className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${bg}`}
                    >
                        {r.status === "active" ? "Activo" : "Inactivo"}
                    </div>
                );
            },
        },
        {
            header: "",
            accessorKey: "status",
            cell: (r) => (
                <button
                    onClick={() => onViewDetail(r)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Ver detalle"
                >
                    <EyeIcon className="h-5 w-5" />
                </button>
            ),
        },
    ];

/* ──────────────────────────────
   Vista
────────────────────────────── */
export default function AlmacenesUbicacionesView() {
    const router = useRouter();
    const params = useParams();
    const locationId = String(params?.id ?? "");

    const { fetchWithAuth } = useFetchWithAuth();

    const [data, setData] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selected, setSelected] = useState<Warehouse | null>(null);

    /* ---------- Header ---------- */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push(`/ubicaciones/listado-ubicaciones`),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Ubicaciones
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Almacenes
                    </div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    /* ---------- Carga ---------- */
    const load = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await fetchWithAuth<{
                items: Warehouse[];
            }>(`comerce-service/locations/${locationId}/warehouses`);

            setData(res?.items ?? []);
        } catch (e) {
            console.error("Error cargando almacenes:", e);
            setData([]);
            const maybeError = e as { message?: unknown };
            setErrorMessage(
                typeof e === "string"
                    ? e
                    : typeof maybeError.message === "string"
                        ? maybeError.message
                        : "Error al cargar almacenes de la ubicación."
            );
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuth, locationId]);

    useEffect(() => {
        if (locationId) load();
    }, [locationId, load]);

    return (
        <>
            <div className="">
                {loading ? (
                    <div className="overflow-x-auto border rounded-md bg-white">
                        <table className="min-w-full text-sm">
                            <tbody>
                                <tr>
                                    <td colSpan={12} className="px-4 py-6 text-center text-gray-500">
                                        <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                        Cargando almacenes…
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
                                    Error al cargar almacenes
                                </h3>
                                <p className="mt-2 text-sm">{errorMessage}</p>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => load()}
                                        className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div
                        className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-700 rounded-md shadow-sm"
                        role="status"
                    >
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium">
                                    No hay almacenes registrados
                                </h3>
                                <p className="mt-2 text-sm">
                                    Esta ubicación no tiene almacenes asociados actualmente.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <DataTable
                        data={data}
                        columns={getColumns(setSelected)}
                        dataType="General"
                        statusKey="status"
                        rowPaddingY={12}
                        showStatusBorder
                        rowBgClass="bg-white"
                    />
                )}
            </div>

            {selected && (
                <DetalleAlmacenesUbicacionesModal
                    open
                    warehouse={selected}
                    onClose={() => setSelected(null)}
                    onSaved={() => load()}
                />
            )}

        </>
    );
}
