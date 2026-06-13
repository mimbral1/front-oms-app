// components\logs\LogsBase.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui/table";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "lucide-react";
import DetalleLogModal from "@/components/presets/modal-logs/DetalleLogModal";
import { Pagination } from "@/components/ui/pagination";

/* ──────────────────────────────
   Tipos
────────────────────────────── */
export interface LogItem {
    id: string;
    action: string;
    changedAtCL: string;
    userName: string;
    userEmail: string;
    diff?: any;
    beforeState?: any;
    afterState?: any;
}

interface LogsBaseProps {
    entityId: string;
    loadLogs: () => Promise<any>;
    emptyText: string;
    errorText?: string;
}

/* ──────────────────────────────
   Badge acción
────────────────────────────── */
const ActionBadge = ({ action }: { action: string }) => {
    const a = String(action || "").toUpperCase();

    const styles: Record<string, string> = {
        CREATE: "bg-green-100 text-green-700",
        UPDATE: "bg-blue-100 text-blue-700",
        DELETE: "bg-red-100 text-red-700",
        PATCH: "bg-purple-100 text-purple-700",
    };

    return (
        <span
            className={[
                "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                styles[a] ?? "bg-gray-200 text-gray-600",
            ].join(" ")}
        >
            {a}
        </span>
    );
};

/* ──────────────────────────────
   LogsBase
────────────────────────────── */
export default function LogsBase({
    entityId,
    loadLogs,
    emptyText,
    errorText = "No se pudieron cargar los logs.",
}: LogsBaseProps) {
    const [data, setData] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const PER_PAGE = 10;
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
    const shown = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(n, max));

    const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
    const [activeTab, setActiveTab] =
        useState<"diff" | "before" | "after">("diff");

    /* ──────────────────────────────
       Columnas
    ────────────────────────────── */
    const columns: Column<LogItem>[] = useMemo(
        () => [
            {
                header: "Acción",
                accessorKey: "action",
                cell: (r) => <ActionBadge action={r.action} />,
            },
            {
                header: "Fecha",
                accessorKey: "changedAtCL",
                cell: (r) => (
                    <span className="text-sm">{r.changedAtCL}</span>
                ),
            },
            {
                header: "Usuario",
                accessorKey: "userName",
                cell: (r) => (
                    <span className="text-sm">{r.userName || "—"}</span>
                ),
            },
            {
                header: "Email",
                accessorKey: "userEmail",
                cell: (r) => (
                    <span className="text-sm text-gray-600">
                        {r.userEmail || "—"}
                    </span>
                ),
            },
            {
                header: "Cambios",
                accessorKey: "diff",
                cell: (r: LogItem) => (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedLog(r);
                            setActiveTab("diff");
                        }}
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <span>Ver detalle</span>
                        <ChevronDownIcon className="h-4 w-4" />
                    </button>
                ),
            },
        ],
        []
    );

    /* ──────────────────────────────
       Load
    ────────────────────────────── */
    const load = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await loadLogs();

            const mapped: LogItem[] = (res?.items ?? []).map((l: any) => ({
                id: l.id,
                action: l.action,
                changedAtCL: l.changedAtCL,
                userName: l.changedByUser?.profile
                    ? `${l.changedByUser.profile.nombres} ${l.changedByUser.profile.apellidos}`
                    : "—",
                userEmail: l.changedByUser?.profile?.email ?? "—",
                diff: l.diff ?? {},
                beforeState: l.beforeState ?? null,
                afterState: l.afterState ?? null,
            }));

            setData(mapped);
            setPage(1);
        } catch (e: any) {
            console.error("Error cargando logs:", e);
            setErrorMessage(e?.message || errorText);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (entityId) load();
    }, [entityId]);

    /* ──────────────────────────────
       Estados
    ────────────────────────────── */
    if (loading) {
        return (
            <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="px-4 py-6 text-center text-gray-500">
                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                Cargando logs…
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium">
                            Error al cargar logs
                        </h3>
                        <p className="mt-2 text-sm">{errorMessage}</p>
                        <div className="mt-4">
                            <button
                                onClick={load}
                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <div className="flex-1">
                <div className="bg-[#e8eaf5] rounded-md">
                    {data.length === 0 ? (
                        <div className="p-6 bg-white rounded-md text-center text-gray-500">
                            {emptyText}
                        </div>
                    ) : (
                        <>
                            <DataTable
                                data={shown}
                                columns={columns}
                                dataType="Logs"
                                statusKey="action"
                                rowPaddingY={12}
                                rowBgClass="bg-white"
                            />

                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={page}
                                    totalRecords={data.length}
                                    pageSize={PER_PAGE}
                                    onPageChange={setPage}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {selectedLog && (
                <DetalleLogModal
                    log={selectedLog}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
}