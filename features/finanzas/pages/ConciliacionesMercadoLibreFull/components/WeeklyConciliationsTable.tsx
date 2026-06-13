import { Fragment, useEffect, useRef, useState } from "react";
import { DocumentDuplicateIcon, EllipsisVerticalIcon, EyeIcon } from "@heroicons/react/24/outline";
import {
    ConciliationRow,
    STATUS_LEFT_BORDER,
    STATUS_META,
} from "../conciliation.types";

type WeeklyConciliationsTableProps = {
    rows: ConciliationRow[];
    onOpenWeek: (row: ConciliationRow) => void;
    onUploadExcel: (row: ConciliationRow) => void;
    formatMoney: (value: number | null | undefined) => string;
    formatDateTime: (value: string | null) => string;
};

export function WeeklyConciliationsTable({
    rows,
    onOpenWeek,
    onUploadExcel,
    formatMoney,
    formatDateTime,
}: WeeklyConciliationsTableProps) {
    const [openActionsRowId, setOpenActionsRowId] = useState<string | null>(null);
    const tableRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!tableRef.current) return;
            if (!tableRef.current.contains(event.target as Node)) {
                setOpenActionsRowId(null);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    return (
        <div ref={tableRef} className="rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full table-auto border-collapse">
                <thead className="bg-[#E8EAF7]">
                    <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Semana</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ventas OMS</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Facturacion ML</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Diferencia</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Registros OMS</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Registros ML</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usuario</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha carga</th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                                No hay conciliaciones para mostrar.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => {
                            const statusMeta = STATUS_META[row.status];
                            return (
                                <Fragment key={row.id}>
                                    <tr
                                        className="transition hover:shadow bg-white shadow-sm"
                                        style={{ boxShadow: `inset 4px 0 0 0 ${STATUS_LEFT_BORDER[row.status]}` }}
                                    >
                                        <td className="px-2 py-4 text-sm text-gray-700 font-semibold">{row.weekLabel}</td>
                                        <td className="px-2 py-4 text-sm text-gray-700">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusMeta.classes}`}>
                                                {statusMeta.label}
                                            </span>
                                        </td>
                                        <td className="px-2 py-4 text-sm font-semibold text-gray-800">{formatMoney(row.omsSales)}</td>
                                        <td className="px-2 py-4 text-sm font-semibold text-gray-800">{formatMoney(row.mlBilling)}</td>
                                        <td className="px-2 py-4 text-sm">
                                            {row.difference === null ? (
                                                <span className="text-gray-400">-</span>
                                            ) : (
                                                <span className={`font-semibold ${row.difference > 0 ? "text-red-500" : "text-emerald-600"}`}>
                                                    {formatMoney(row.difference)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-2 py-4 text-sm text-gray-700">{row.omsRecords}</td>
                                        <td className="px-2 py-4 text-sm text-gray-700">
                                            {row.mlRecords === 0 ? <span className="text-gray-400">-</span> : row.mlRecords}
                                        </td>
                                        <td className="px-2 py-4 text-sm text-gray-700">{row.user}</td>
                                        <td className="px-2 py-4 text-sm text-gray-700">{formatDateTime(row.uploadedAt)}</td>
                                        <td className="relative px-2 py-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-transparent p-1 hover:bg-slate-100 hover:text-blue-600"
                                                    aria-label="Ver conciliacion"
                                                    onClick={() => onOpenWeek(row)}
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-transparent p-1 hover:bg-slate-100 hover:text-slate-600"
                                                    aria-label="Duplicar conciliacion"
                                                >
                                                    <DocumentDuplicateIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-transparent p-1 hover:bg-slate-100 hover:text-slate-600"
                                                    aria-label="Mas acciones"
                                                    aria-expanded={openActionsRowId === row.id}
                                                    onClick={() =>
                                                        setOpenActionsRowId((current) => (current === row.id ? null : row.id))
                                                    }
                                                >
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                            {openActionsRowId === row.id && (
                                                <div
                                                    className="absolute right-2 top-12 z-20 min-w-[12rem] rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
                                                    role="menu"
                                                    aria-label="Menu de acciones"
                                                >
                                                    <button
                                                        type="button"
                                                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                        role="menuitem"
                                                        onClick={() => {
                                                            setOpenActionsRowId(null);
                                                            onUploadExcel(row);
                                                        }}
                                                    >
                                                        Cargar Excel
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={10} style={{ height: 4 }} />
                                    </tr>
                                </Fragment>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
