// components\table\DataTableExpandable.tsx

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Column } from "@/components/ui/table";
import { resolveTableColor } from "./table-status-registry";
import {
    paddingMapping,
    tableContainer,
    tableBase,
    tableHead,
    tableHeadCell,
    tableRow,
    expandableDetailRow,
    expandableDetailCell,
    expandableCellBase,
} from "./table.styles";

function getCssColorLocal(status: string, dataType: string): string {
    return resolveTableColor(status, dataType);
}

interface DataTableExpandableProps<T extends object> {
    data: T[];
    columns: Column<T>[];
    /** id de fila expandida (controlado desde arriba). null = ninguna */
    expandedId: string | number | null;
    /** función para alternar la fila (pasamos el item completo por compatibilidad con tu onRowClick) */
    onToggle: (item: T) => void;
    /** render del detalle (se coloca en una fila extra debajo de la principal) */
    renderDetail: (item: T) => React.ReactNode;

    onRowClick?: (item: T) => void;
    dataType?: string;
    statusKey?: keyof T | "status";
    className?: string;
    showStatusBorder?: boolean;
    rowPaddingY?: number | string;
    rowGap?: number | string;
    rowBgClass?: string;
    /** obtener id estable de la fila (si no, usamos índice) */
    getRowId?: (item: T, index: number) => string | number;
}

export function DataTableExpandable<T extends object>({
    data,
    columns,
    expandedId,
    onToggle,
    renderDetail,
    onRowClick,
    dataType = "pedido",
    statusKey = "status",
    className,
    showStatusBorder = true,
    rowPaddingY,
    rowGap,
    rowBgClass = "",
    getRowId,
}: DataTableExpandableProps<T>) {
    const paddingClass =
        rowPaddingY !== undefined
            ? typeof rowPaddingY === "number"
                ? paddingMapping[rowPaddingY] || `py-[${rowPaddingY}px]`
                : `py-[${rowPaddingY}]`
            : "py-2";

    const gapTdProps: React.HTMLAttributes<HTMLTableCellElement> =
        rowGap !== undefined
            ? typeof rowGap === "number"
                ? { style: { height: rowGap } }
                : { className: rowGap }
            : { className: "h-1" };

    return (
        <div className={cn(tableContainer, className)}>
            <table className={tableBase}>
                <thead className={tableHead}>
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                className={tableHeadCell}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, rowIndex) => {
                        const rowId = getRowId ? getRowId(item, rowIndex) : rowIndex;
                        const isOpen = expandedId === rowId;

                        const theStatus =
                            statusKey === "status"
                                ? (item as Record<string, unknown>)["status"]
                                : statusKey
                                    ? item[statusKey]
                                    : undefined;
                        const color = showStatusBorder
                            ? getCssColorLocal(String(theStatus ?? ""), dataType)
                            : undefined;

                        return (
                            <React.Fragment key={rowId}>
                                <tr
                                    onClick={() => { onRowClick?.(item); onToggle(item); }}
                                    className={cn(
                                        tableRow,
                                        "align-middle",
                                        rowBgClass
                                    )}
                                    style={color ? { boxShadow: `inset 4px 0 0 0 ${color}` } : undefined}
                                >
                                    {columns.map((column, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className={cn(
                                                "px-2",
                                                paddingClass,
                                                expandableCellBase
                                            )}
                                        >
                                            {column.cell
                                                ? column.cell(item)
                                                : (item[column.accessorKey] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>

                                {/* Fila de detalle (solo si está abierta) */}
                                {isOpen && (
                                    <tr className={expandableDetailRow}>
                                        <td colSpan={columns.length} className={expandableDetailCell}>
                                            {renderDetail(item)}
                                        </td>
                                    </tr>
                                )}

                                {/* Fila de separador (igual que tu DataTable) */}
                                <tr>
                                    <td colSpan={columns.length} {...gapTdProps} />
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default DataTableExpandable;
