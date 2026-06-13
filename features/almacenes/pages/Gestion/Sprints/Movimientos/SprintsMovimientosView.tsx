// app/almacen/gestion/sprints/[id]/movimientos/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { fmtDateTime } from "@/lib/format/date";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
const API_BASE = BASE_WAREHOUSES;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});

/* ─────────────────────────────────────────────────────────────────────────────
   Estilo calcado de IngresoMovimientosView (tabla + paginación)
   ───────────────────────────────────────────────────────────────────────────── */

/* Tipos + mocks (adaptados al contexto Sprint) */
type MoveState = "Pendiente" | "En curso" | "Finalizado";

interface SprintMove {
    movementId: string;
    id: string;                      // displayId
    titulo: string;                  // mismo que id
    origen: string;                  // multiline (almacén / área / pos)
    destino: string;                 // multiline
    contenido: string;               // descripción sku/paquete
    cantidad: number;
    fecha: string;                   // dd/MM/yyyy HH:mm
    asignado: { initials: string; name: string; email: string };
    receptor: { initials: string; name: string; email: string };
    estado: MoveState;
}

type ApiSprintDetail = {
    movementsIds?: string[] | null;
};

type ApiMovementDetail = {
    id?: string | null;
    displayId?: string | null;
    source?: { warehouseName?: string | null; positionKey?: string | null } | null;
    destination?: { warehouseName?: string | null; positionKey?: string | null } | null;
    content?: { skuId?: string | null; quantity?: number | null } | null;
    assigneeId?: string | null;
    receiverId?: string | null;
    status?: string | null;
    dateStarted?: string | null;
    dateCreated?: string | null;
};

/* Chips de usuario (mismo look & feel) */ // :contentReference[oaicite:1]{index=1}
function UserChip({ u }: { u: SprintMove["asignado"] }) {
    return (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                {u.initials}
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{u.name}</span>
                <span className="truncate text-xs text-gray-500">{u.email}</span>
            </div>
        </div>
    );
}

const PER_PAGE = 60;

const toInitials = (name: string) => {
    const n = name.trim();
    if (!n || n === "-") return "--";
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const mapState = (statusRaw?: string | null): MoveState => {
    const s = String(statusRaw || "").trim().toLowerCase();
    if (s === "ended" || s === "posted") return "Finalizado";
    if (s === "started" || s === "picked") return "En curso";
    return "Pendiente";
};

/* Columnas (idéntico patrón de celdas que IngresoMovimientosView) */ // :contentReference[oaicite:3]{index=3}
function getColumns(): Column<SprintMove>[] {
    return [
        { header: "Título", accessorKey: "titulo", cell: (m) => m.titulo },
        { header: "Origen", accessorKey: "origen", cell: (m) => <span className="whitespace-pre-wrap">{m.origen}</span> },
        { header: "Destino", accessorKey: "destino", cell: (m) => <span className="whitespace-pre-wrap">{m.destino}</span> },
        {
            header: "Contenido",
            accessorKey: "contenido",
            cell: (m) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-400">
                            <span className="h-3 w-3 rotate-45 border-2 border-gray-500" />
                        </span>
                        <a
                            href="#"
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-[520px] truncate text-blue-600 hover:underline"
                            title={m.contenido}
                        >
                            {m.contenido}
                        </a>
                    </div>
                    <span className="mt-2 inline-flex h-7 w-min min-w-[36px] items-center justify-center rounded-full bg-blue-500 px-3 text-sm font-semibold text-white">
                        {m.cantidad}
                    </span>
                </div>
            ),
        },
        { header: "Fecha", accessorKey: "fecha", cell: (m) => m.fecha },
        { header: "Asignado", accessorKey: "asignado", cell: (m) => <UserChip u={m.asignado} /> },
        { header: "Receptor", accessorKey: "receptor", cell: (m) => <UserChip u={m.receptor} /> },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (m) => (
                <span className="rounded-full bg-gray-400 px-4 py-1 text-sm font-medium text-white">
                    {m.estado}
                </span>
            ),
        },
    ];
}

/* Vista principal (tab Movimientos dentro de Resumen de Sprint) */
export default function SprintsMovimientosView() {
    const { id } = useParams(); // sprint id
    const router = useRouter();
    const sprintId = String(id || "");

    const [items, setItems] = useState<SprintMove[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMovement = async (movementId: string): Promise<ApiMovementDetail | null> => {
        const response = await fetch(`${API_BASE}/movement/${encodeURIComponent(movementId)}`, {
            method: "GET",
            headers: JANIS_HEADERS,
        });
        if (!response.ok) {
            return null;
        }
        return (await response.json()) as ApiMovementDetail;
    };

    const fetchItems = useCallback(async () => {
        if (!sprintId) return;
        try {
            setLoading(true);
            setError(null);

            const sprintRes = await fetch(`${API_BASE}/sprint/${encodeURIComponent(sprintId)}`, {
                method: "GET",
                headers: JANIS_HEADERS,
            });
            if (!sprintRes.ok) {
                const text = await sprintRes.text().catch(() => "");
                throw new Error(text || `HTTP ${sprintRes.status}`);
            }

            const sprintData = (await sprintRes.json()) as ApiSprintDetail;
            const movementIds = Array.isArray(sprintData.movementsIds)
                ? sprintData.movementsIds.map((m) => String(m)).filter(Boolean)
                : [];

            if (movementIds.length === 0) {
                setItems([]);
                return;
            }

            const details = await Promise.all(movementIds.map((movementId) => fetchMovement(movementId)));

            const mapped: SprintMove[] = details
                .filter((d): d is ApiMovementDetail => Boolean(d))
                .map((d) => {
                    const assigneeName = String(d.assigneeId || "-");
                    const receiverName = String(d.receiverId || "-");
                    const sourceWarehouse = String(d.source?.warehouseName || "-");
                    const sourcePos = String(d.source?.positionKey || "-");
                    const destinationWarehouse = String(d.destination?.warehouseName || "-");
                    const destinationPos = String(d.destination?.positionKey || "-");

                    return {
                        movementId: String(d.id || ""),
                        id: String(d.displayId || d.id || "-"),
                        titulo: String(d.displayId || d.id || "-"),
                        origen: `${sourceWarehouse}\n${sourcePos}`,
                        destino: `${destinationWarehouse}\n${destinationPos}`,
                        contenido: String(d.content?.skuId || "-"),
                        cantidad: Number(d.content?.quantity ?? 0),
                        fecha: d.dateStarted ? fmtDateTime(d.dateStarted) : d.dateCreated ? fmtDateTime(d.dateCreated) : "-",
                        asignado: { initials: toInitials(assigneeName), name: assigneeName, email: "-" },
                        receptor: { initials: toInitials(receiverName), name: receiverName, email: "-" },
                        estado: mapState(d.status),
                    };
                });

            setItems(mapped);
            setPage(1);
        } catch (err: any) {
            setItems([]);
            setError(err?.message || "No se pudieron cargar los movimientos del sprint");
        } finally {
            setLoading(false);
        }
    }, [sprintId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // acciones del header (deshabilitadas, y Cancelar vuelve al Resumen del sprint)
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => history.back(),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
            {
                label: "Actualizar",
                variant: "primary",
                onClick: fetchItems,
            },
        ],
        [fetchItems]
    );

    usePageHeader(
        () =>
        ({
            title: `Sprint ${String(id)}`,
            action: headerActions,
        } as PageHeaderProps),
        [id, headerActions]
    );

    // paginación
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    const safePage = clamp(page, 1, totalPages);
    const startIdx = (safePage - 1) * PER_PAGE;
    const endIdx = Math.min(startIdx + PER_PAGE, items.length);
    const shown = items.slice(startIdx, endIdx);

    // navegación por fila → detalle de movimiento del sprint
    const columns = getColumns();

    return (
        <div className="flex-1 bg-[#f3f5fb]">
            <div className="rounded-xl shadow-sm overflow-hidden pt-5">
                <DataTable<SprintMove>
                    data={shown}
                    columns={columns}
                    dataType="General2"
                    rowPaddingY={12}
                    rowBgClass="bg-white"
                    onRowClick={(row) =>
                        router.push(
                            `/almacen/gestion/sprints/${encodeURIComponent(String(id))}/movimientos/${encodeURIComponent(row.movementId)}`
                        )
                    }
                />
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <Pagination
                currentPage={page}
                totalRecords={items.length}
                pageSize={PER_PAGE}
                onPageChange={setPage}
            />
        </div>
    );
}
