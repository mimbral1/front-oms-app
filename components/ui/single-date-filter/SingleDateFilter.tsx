"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

const DAYS_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function parseDate(s: string): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatShort(d: Date | null): string {
    if (!d) return "";
    const day = d.getDate();
    const month = MONTHS_ES[d.getMonth()].slice(0, 3);
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

interface SingleDateFilterProps {
    value: string | null; // yyyy-MM-dd or null
    onChange: (date: string | null) => void;
    label?: string;
    clearable?: boolean;
}

export function SingleDateFilter({
    value,
    onChange,
    label = "Fecha de creación",
    clearable = true,
}: SingleDateFilterProps) {
    const today = useMemo(() => new Date(), []);
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<Date | null>(null);
    const [viewMonth, setViewMonth] = useState(
        () => new Date(today.getFullYear(), today.getMonth(), 1),
    );

    useEffect(() => {
        if (open) {
            const d = value ? parseDate(value) : null;
            setDraft(d);
            if (d) {
                setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
            } else {
                setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            }
        }
    }, [open, value, today]);

    const handleDateClick = useCallback((d: Date) => {
        setDraft(d);
    }, []);

    const handleApply = useCallback(() => {
        if (draft) {
            onChange(toDateStr(draft));
        }
        setOpen(false);
    }, [draft, onChange]);

    const handleCancel = useCallback(() => {
        setOpen(false);
    }, []);

    const handleClear = useCallback(() => {
        onChange(null);
        setDraft(null);
        setOpen(false);
    }, [onChange]);

    const displayText = useMemo(() => {
        if (!value) return label;
        const d = parseDate(value);
        return d ? formatShort(d) : label;
    }, [value, label]);

    const hasValue = !!value;

    // Build the calendar grid
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);

    let dayOfWeek = firstDay.getDay() - 1;
    if (dayOfWeek < 0) dayOfWeek = 6;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < dayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
        cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <div className="relative">
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        className={`
              w-full inline-flex items-center gap-2 overflow-hidden rounded-lg border px-4 py-2 text-sm transition-colors
              ${hasValue
                                ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                            }
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
            `}
                    >
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-left">{displayText}</span>
                        {hasValue && clearable && (
                            <span
                                role="button"
                                tabIndex={0}
                                className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.stopPropagation();
                                        handleClear();
                                    }
                                }}
                            >
                                <XMarkIcon className="h-3.5 w-3.5" />
                            </span>
                        )}
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        sideOffset={8}
                        align="start"
                        className="z-50 animate-in fade-in-0 zoom-in-95 rounded-2xl border border-gray-200 bg-white shadow-xl focus:outline-none"
                    >
                        <div className="flex flex-col">
                            {/* Navigation header */}
                            <div className="flex items-center justify-between px-6 pt-4 pb-2">
                                <button
                                    type="button"
                                    className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                                    onClick={() => setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </button>
                                <span className="text-sm font-semibold text-gray-800">
                                    {MONTHS_ES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                                </span>
                                <button
                                    type="button"
                                    className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                                    onClick={() => setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Single calendar */}
                            <div className="px-6 pb-4">
                                <div className="w-[280px]">
                                    <div className="grid grid-cols-7 gap-0">
                                        {DAYS_ES.map((d) => (
                                            <div
                                                key={d}
                                                className="flex h-8 items-center justify-center text-xs font-medium text-gray-400"
                                            >
                                                {d}
                                            </div>
                                        ))}
                                        {cells.map((date, i) => {
                                            if (!date) {
                                                return <div key={`e-${i}`} className="h-9" />;
                                            }

                                            const isToday = isSameDay(date, today);
                                            const isSelected = draft ? isSameDay(date, draft) : false;

                                            let cellBg = "";
                                            let textCls = "text-gray-700";

                                            if (isSelected) {
                                                cellBg = "bg-blue-600";
                                                textCls = "text-white font-semibold";
                                            }

                                            return (
                                                <button
                                                    key={date.toISOString()}
                                                    type="button"
                                                    className={`relative flex h-9 w-full items-center justify-center rounded-full text-sm transition-colors
                            ${cellBg}
                            ${!isSelected ? "hover:bg-gray-100" : ""}
                            ${textCls}`}
                                                    onClick={() => handleDateClick(date)}
                                                >
                                                    {date.getDate()}
                                                    {isToday && !isSelected && (
                                                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-3">
                                <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-sm text-gray-700">
                                    {draft ? toDateStr(draft) : "yyyy-mm-dd"}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        onClick={handleCancel}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                        disabled={!draft}
                                        onClick={handleApply}
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </div>
        </Popover.Root>
    );
}
