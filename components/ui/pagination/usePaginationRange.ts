// components/ui/pagination/usePaginationRange.ts
// Reusable hook that computes pagination metadata: page window, item range, totals.

import { useMemo } from "react";

export interface PaginationRangeInput {
    currentPage: number;
    totalPages?: number;
    totalRecords?: number;
    pageSize?: number;
}

export interface PaginationRange {
    /** Total number of pages */
    totalPages: number;
    /** Visible page numbers (e.g. [3, 4, 5]) */
    pageWindow: number[];
    /** First item index on current page (1-based), 0 if empty */
    startItem: number;
    /** Last item index on current page, 0 if empty */
    endItem: number;
    /** Whether totalRecords/pageSize mode is active */
    hasRecordRange: boolean;
    /** Clamp a page number within valid bounds */
    clamp: (page: number) => number;
}

/** Computes a sliding 3-page window around `current`. */
function getPageWindow(total: number, current: number): number[] {
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(current - 1, total - 2));
    return [start, start + 1, start + 2];
}

/**
 * Calculates all pagination derived values from inputs.
 * Can be used standalone to build custom pagination UIs.
 */
export function usePaginationRange(input: PaginationRangeInput): PaginationRange {
    const { currentPage, totalRecords, pageSize } = input;

    const hasRecordRange =
        totalRecords != null && pageSize != null && pageSize > 0;

    const totalPages = hasRecordRange
        ? Math.max(1, Math.ceil(totalRecords! / pageSize!))
        : Math.max(1, input.totalPages ?? 1);

    const pageWindow = useMemo(
        () => getPageWindow(totalPages, currentPage),
        [totalPages, currentPage],
    );

    const startItem =
        !hasRecordRange || totalRecords === 0
            ? 0
            : (currentPage - 1) * pageSize! + 1;

    const endItem =
        !hasRecordRange || totalRecords === 0
            ? 0
            : Math.min(currentPage * pageSize!, totalRecords!);

    const clamp = (page: number) => Math.max(1, Math.min(page, totalPages));

    return { totalPages, pageWindow, startItem, endItem, hasRecordRange, clamp };
}
