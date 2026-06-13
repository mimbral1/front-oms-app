"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DAYS_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** yyyy-MM-dd string ↔ Date (local) */
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

function isBetween(d: Date, start: Date, end: Date) {
    const t = d.getTime();
    return t >= start.getTime() && t <= end.getTime();
}

function startOfWeek(d: Date): Date {
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const r = new Date(d);
    r.setDate(r.getDate() + diff);
    return r;
}

function endOfWeek(d: Date): Date {
    const s = startOfWeek(d);
    s.setDate(s.getDate() + 6);
    return s;
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, n: number): Date {
    const r = new Date(d);
    r.setMonth(r.getMonth() + n);
    return r;
}

function formatShort(d: Date | null): string {
    if (!d) return "";
    const day = d.getDate();
    const month = MONTHS_ES[d.getMonth()].slice(0, 3);
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

/* ------------------------------------------------------------------ */
/*  Calendar grid for one month                                        */
/* ------------------------------------------------------------------ */

interface MonthGridProps {
    year: number;
    month: number; // 0-indexed
    rangeStart: Date | null;
    rangeEnd: Date | null;
    hoverDate: Date | null;
    onDateClick: (d: Date) => void;
    onDateHover: (d: Date | null) => void;
    today: Date;
}

function MonthGrid({
    year,
    month,
    rangeStart,
    rangeEnd,
    hoverDate,
    onDateClick,
    onDateHover,
    today,
}: MonthGridProps) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday=0 based offset
    let dayOfWeek = firstDay.getDay() - 1;
    if (dayOfWeek < 0) dayOfWeek = 6;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < dayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
        cells.push(new Date(year, month, d));
    }

    // effective range end (for hover preview)
    const effectiveEnd = rangeStart && !rangeEnd && hoverDate ? hoverDate : rangeEnd;

    // determine the actual visual start/end (swap if hovered before start)
    let visStart = rangeStart;
    let visEnd = effectiveEnd;
    if (visStart && visEnd && visStart.getTime() > visEnd.getTime()) {
        [visStart, visEnd] = [visEnd, visStart];
    }

    return (
        <div className="w-[280px]">
            <div className="mb-2 text-center text-sm font-semibold text-gray-800">
                {MONTHS_ES[month]} {year}
            </div>
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
                    const isStart = visStart ? isSameDay(date, visStart) : false;
                    const isEnd = visEnd ? isSameDay(date, visEnd) : false;
                    const inRange =
                        visStart && visEnd ? isBetween(date, visStart, visEnd) : false;
                    const isSelected = isStart || isEnd;

                    let cellBg = "";
                    let textCls = "text-gray-700";

                    if (isSelected) {
                        cellBg = "bg-blue-600";
                        textCls = "text-white font-semibold";
                    } else if (inRange) {
                        cellBg = "bg-blue-50";
                        textCls = "text-blue-700";
                    }

                    return (
                        <button
                            key={date.toISOString()}
                            type="button"
                            className={`relative flex h-9 w-full items-center justify-center text-sm transition-colors
                ${cellBg}
                ${isStart ? "rounded-l-full" : ""}
                ${isEnd ? "rounded-r-full" : ""}
                ${!isSelected && !inRange ? "hover:bg-gray-100 rounded-full" : ""}
                ${textCls}`}
                            onClick={() => onDateClick(date)}
                            onMouseEnter={() => onDateHover(date)}
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
    );
}

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

interface Preset {
    label: string;
    range: [Date, Date];
}

function getPresets(now: Date): Preset[] {
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    const todayDate = new Date(y, m, d);

    return [
        { label: "Hoy", range: [todayDate, todayDate] },
        {
            label: "Ayer",
            range: [new Date(y, m, d - 1), new Date(y, m, d - 1)],
        },
        {
            label: "Esta semana",
            range: [startOfWeek(todayDate), endOfWeek(todayDate)],
        },
        {
            label: "Semana pasada",
            range: [
                startOfWeek(new Date(y, m, d - 7)),
                endOfWeek(new Date(y, m, d - 7)),
            ],
        },
        {
            label: "Este mes",
            range: [startOfMonth(todayDate), endOfMonth(todayDate)],
        },
        {
            label: "Mes pasado",
            range: [
                startOfMonth(new Date(y, m - 1, 1)),
                endOfMonth(new Date(y, m - 1, 1)),
            ],
        },
        {
            label: "Últimos 7 días",
            range: [new Date(y, m, d - 6), todayDate],
        },
        {
            label: "Últimos 30 días",
            range: [new Date(y, m, d - 29), todayDate],
        },
        {
            label: "Este año",
            range: [new Date(y, 0, 1), new Date(y, 11, 31)],
        },
    ];
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export interface DateRange {
    start: string; // yyyy-MM-dd
    end: string;   // yyyy-MM-dd
}

interface DateRangeFilterProps {
    value: DateRange | null;
    onChange: (range: DateRange | null) => void;
    label?: string;
    appearance?: "default" | "minimal";
}

export function DateRangeFilter({
    value,
    onChange,
    label = "Rango de fechas",
    appearance = "default",
}: DateRangeFilterProps) {
    const today = useMemo(() => new Date(), []);
    const presets = useMemo(() => getPresets(today), [today]);

    const [open, setOpen] = useState(false);

    // Internal draft state (only applied on "Aplicar")
    const [draftStart, setDraftStart] = useState<Date | null>(null);
    const [draftEnd, setDraftEnd] = useState<Date | null>(null);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    // Which month is shown on the LEFT calendar
    const [viewMonth, setViewMonth] = useState(
        () => new Date(today.getFullYear(), today.getMonth(), 1),
    );

    // Sync draft from value when popover opens
    useEffect(() => {
        if (open) {
            const s = value?.start ? parseDate(value.start) : null;
            const e = value?.end ? parseDate(value.end) : null;
            setDraftStart(s);
            setDraftEnd(e);
            if (s) {
                setViewMonth(new Date(s.getFullYear(), s.getMonth(), 1));
            } else {
                setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            }
        }
    }, [open]);

    const handleDateClick = useCallback(
        (d: Date) => {
            if (!draftStart || draftEnd) {
                // Start new selection
                setDraftStart(d);
                setDraftEnd(null);
            } else {
                // Complete range
                if (d.getTime() < draftStart.getTime()) {
                    setDraftEnd(draftStart);
                    setDraftStart(d);
                } else {
                    setDraftEnd(d);
                }
            }
        },
        [draftStart, draftEnd],
    );

    const handlePreset = useCallback((range: [Date, Date]) => {
        setDraftStart(range[0]);
        setDraftEnd(range[1]);
        setViewMonth(new Date(range[0].getFullYear(), range[0].getMonth(), 1));
    }, []);

    const handleApply = useCallback(() => {
        if (draftStart && draftEnd) {
            onChange({ start: toDateStr(draftStart), end: toDateStr(draftEnd) });
        }
        setOpen(false);
    }, [draftStart, draftEnd, onChange]);

    const handleCancel = useCallback(() => {
        setOpen(false);
    }, []);

    const handleClear = useCallback(() => {
        onChange(null);
        setDraftStart(null);
        setDraftEnd(null);
        setOpen(false);
    }, [onChange]);

    const rightMonth = addMonths(viewMonth, 1);

    // Display text for trigger
    const displayText = useMemo(() => {
        if (!value?.start || !value?.end) return label;
        const s = parseDate(value.start);
        const e = parseDate(value.end);
        return `${formatShort(s)}  –  ${formatShort(e)}`;
    }, [value, label]);

    const hasValue = !!(value?.start && value?.end);
    const isMinimal = appearance === "minimal";

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <div className="relative">
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        className={`
              w-full inline-flex items-center gap-2 text-sm transition-colors
              ${isMinimal
                                ? "border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-gray-700 hover:border-blue-400"
                                : hasValue
                                    ? "rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100"
                                    : "rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-500 hover:bg-gray-50"
                            }
              ${isMinimal ? "focus:border-blue-500 focus:outline-none focus:ring-0" : "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"}
            `}
                    >
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{displayText}</span>
                        {hasValue && (
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
                        className="z-[1100] animate-in fade-in-0 zoom-in-95 rounded-2xl border border-gray-200 bg-white shadow-xl focus:outline-none"
                    >
                        <div className="flex">
                            {/* Presets sidebar */}
                            <div className="hidden w-44 flex-col gap-0.5 border-r border-gray-200 p-3 lg:flex">
                                <span className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    Rangos rápidos
                                </span>
                                {presets.map((p) => {
                                    const active =
                                        draftStart &&
                                        draftEnd &&
                                        isSameDay(draftStart, p.range[0]) &&
                                        isSameDay(draftEnd, p.range[1]);
                                    return (
                                        <button
                                            key={p.label}
                                            type="button"
                                            className={`rounded-lg px-3 py-1.5 text-left text-sm transition-colors
                        ${active
                                                    ? "bg-blue-100 font-medium text-blue-700"
                                                    : "text-gray-600 hover:bg-gray-100"
                                                }`}
                                            onClick={() => handlePreset(p.range)}
                                        >
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Calendars + footer */}
                            <div className="flex flex-col">
                                {/* Navigation header */}
                                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                                    <button
                                        type="button"
                                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                                        onClick={() => setViewMonth((v) => addMonths(v, -1))}
                                    >
                                        <ChevronLeftIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                                        onClick={() => setViewMonth((v) => addMonths(v, 1))}
                                    >
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Two month calendars side by side */}
                                <div className="flex gap-6 px-6 pb-4">
                                    <MonthGrid
                                        year={viewMonth.getFullYear()}
                                        month={viewMonth.getMonth()}
                                        rangeStart={draftStart}
                                        rangeEnd={draftEnd}
                                        hoverDate={hoverDate}
                                        onDateClick={handleDateClick}
                                        onDateHover={setHoverDate}
                                        today={today}
                                    />
                                    <MonthGrid
                                        year={rightMonth.getFullYear()}
                                        month={rightMonth.getMonth()}
                                        rangeStart={draftStart}
                                        rangeEnd={draftEnd}
                                        hoverDate={hoverDate}
                                        onDateClick={handleDateClick}
                                        onDateHover={setHoverDate}
                                        today={today}
                                    />
                                </div>

                                {/* Footer with date display + actions */}
                                <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-3">
                                    <div className="hidden items-center gap-2 text-sm md:flex">
                                        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-gray-700">
                                            {draftStart ? toDateStr(draftStart) : "yyyy-mm-dd"}
                                        </span>
                                        <span className="text-gray-400">–</span>
                                        <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-gray-700">
                                            {draftEnd ? toDateStr(draftEnd) : "yyyy-mm-dd"}
                                        </span>
                                    </div>
                                    <div className="flex w-full gap-2 md:w-auto">
                                        <button
                                            type="button"
                                            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 md:flex-none"
                                            onClick={handleCancel}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 md:flex-none"
                                            disabled={!draftStart || !draftEnd}
                                            onClick={handleApply}
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </div>
        </Popover.Root>
    );
}
