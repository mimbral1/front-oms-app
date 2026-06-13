import React from "react";
import { cn } from "@/lib/utils";
import { resolveTableColor } from "./table-status-registry";
import {
  paddingMapping,
  tableContainer,
  tableContainerAdaptive,
  tableBase,
  tableHead,
  tableHeadCell,
  tableRow,
  tableCellBase,
  tableCellFirst,
} from "./table.styles";

// Re-export for backward compatibility
export { estadosConfig } from "./table.styles";

export interface Column<T extends object> {
  header: string | React.ReactNode;
  accessorKey: keyof T;
  cell?: (item: T) => React.ReactNode;
  disableRowClick?: boolean;
}

interface DataTableProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  dataType?: string;
  statusKey?: keyof T | "status";
  className?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showStatusBorder?: boolean;
  rowPaddingY?: number | string;
  rowGap?: number | string;
  rowBgClass?: string;
  layout?: "default" | "adaptive";
}

function getCssColor(status: string, dataType: string): string {
  return resolveTableColor(status, dataType);
}

export function DataTable<T extends object>({
  data,
  columns,
  onRowClick,
  dataType = "pedido",
  statusKey = "status",
  showStatusBorder = true,
  rowPaddingY,
  rowGap,
  rowBgClass = "",
  layout = "default",
}: DataTableProps<T>) {
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
    <div
      className={
        layout === "adaptive"
          ? tableContainerAdaptive
          : tableContainer
      }
    >
      <table className={tableBase}>
        <thead className={tableHead}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(tableHeadCell)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item, rowIndex) => {
            const rawStatus =
              statusKey === "status"
                ? (item as Record<string, unknown>)["status"]
                : statusKey
                  ? item[statusKey]
                  : undefined;
            const theStatus =
              typeof rawStatus === "string" ? rawStatus : String(rawStatus ?? "");
            const color = showStatusBorder
              ? getCssColor(theStatus, dataType)
              : undefined;

            return (
              <React.Fragment key={rowIndex}>
                <tr
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("td[data-row-click='ignore']")) {
                      return;
                    }
                    onRowClick?.(item);
                  }}
                  className={cn(
                    tableRow,
                    rowBgClass
                  )}
                  style={
                    color
                      ? { boxShadow: `inset 4px 0 0 0 ${color}` }
                      : undefined
                  }
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      data-row-click={column.disableRowClick ? "ignore" : undefined}
                      className={cn(
                        colIndex === 0
                          ? tableCellFirst
                          : "px-2 align-top",
                        paddingClass,
                        tableCellBase
                      )}
                    >
                      {column.cell
                        ? column.cell(item)
                        : (item[column.accessorKey] as React.ReactNode)}
                    </td>
                  ))}
                </tr>

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
