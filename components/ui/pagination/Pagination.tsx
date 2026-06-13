// components/ui/pagination/Pagination.tsx
// Reusable pagination bar — supports record-based and page-based modes.

"use client";

import type { ReactNode } from "react";

import {
    paginationContainer,
    paginationInfo,
    paginationButtonsWrapper,
    paginationButton,
    paginationButtonActive,
    paginationButtonInactive,
    paginationSpacer,
} from "./pagination.styles";
import { usePaginationRange } from "./usePaginationRange";

interface PaginationBaseProps {
    currentPage: number;
    onPageChange: (page: number) => void;
    infoExtra?: ReactNode;
    infoClassName?: string;
    barClassName?: string;
}

type PaginationByRecords = PaginationBaseProps & {
    totalRecords: number;
    pageSize: number;
    totalPages?: never;
};

type PaginationByPages = PaginationBaseProps & {
    totalPages: number;
    totalRecords?: never;
    pageSize?: never;
};

type PaginationProps = PaginationByRecords | PaginationByPages;

export default function Pagination({
    currentPage,
    onPageChange,
    infoExtra,
    infoClassName,
    barClassName,
    ...props
}: PaginationProps) {
    const isRecordMode = "totalRecords" in props && "pageSize" in props;

    const {
        totalPages,
        pageWindow,
        startItem,
        endItem,
        hasRecordRange,
        clamp,
    } = usePaginationRange({
        currentPage,
        totalPages: isRecordMode ? undefined : (props as PaginationByPages).totalPages,
        totalRecords: isRecordMode ? props.totalRecords : undefined,
        pageSize: isRecordMode ? props.pageSize : undefined,
    });

    // Hide pagination when everything fits on one page
    if (totalPages <= 1) return null;

    return (
        <div className={`sticky bottom-0 z-20 mt-4 w-full border-t border-slate-200 bg-page-bg/70 px-2 py-3 backdrop-blur-[1px] ${barClassName ?? ""}`.trim()}>
            <div className={paginationContainer}>
                <div className={`${paginationInfo} ${infoClassName ?? ""}`.trim()}>
                    {hasRecordRange && isRecordMode
                        ? (
                            <>
                                <span className="font-semibold text-gray-800">{props.totalRecords} resultados</span>
                                <span>{props.pageSize} por pagina</span>
                            </>
                        )
                        : `Pagina ${currentPage} de ${totalPages}`}

                    {infoExtra && (
                        <span className="inline-flex flex-wrap items-center gap-4">
                            {infoExtra}
                        </span>
                    )}
                </div>

                <div className={paginationButtonsWrapper}>
                    {/* Ir a primera página */}
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage <= 1}
                        className={paginationButton}
                        title="Primera página"
                    >
                        &laquo;
                    </button>

                    <button
                        onClick={() =>
                            onPageChange(clamp(currentPage - 1))
                        }
                        disabled={currentPage <= 1}
                        className={paginationButton}
                    >
                        &lt;
                    </button>

                    {pageWindow.map((pageNumber) => (
                        <button
                            key={pageNumber}
                            onClick={() =>
                                onPageChange(clamp(pageNumber))
                            }
                            className={`${currentPage === pageNumber
                                ? paginationButtonActive
                                : paginationButtonInactive
                                }`}
                        >
                            {pageNumber}
                        </button>
                    ))}

                    <button
                        onClick={() =>
                            onPageChange(clamp(currentPage + 1))
                        }
                        disabled={currentPage >= totalPages}
                        className={paginationButton}
                    >
                        &gt;
                    </button>

                    {/* Ir a última página */}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        className={paginationButton}
                        title="Última página"
                    >
                        &raquo;
                    </button>
                </div>

                <div className={paginationSpacer}>
                    {hasRecordRange && isRecordMode
                        ? props.totalRecords === 0
                            ? "0 resultados"
                            : `${startItem}-${endItem} de ${props.totalRecords} resultados`
                        : ""}
                </div>
            </div>
        </div>
    );
}