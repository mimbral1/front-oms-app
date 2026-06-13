"use client";

import { SingleDateFilter } from "@/components/ui/single-date-filter/SingleDateFilter";
import TimePickerField from "@/components/ui/time-picker/TimePickerField";

type DateTimePickerFieldProps = {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    showNowButton?: boolean;
    showClearDateButton?: boolean;
    compactTime?: boolean;
    equalizeDateHeight?: boolean;
};

function splitDateTime(value: string): { date: string; time: string } {
    if (!value) return { date: "", time: "09:00" };
    const [datePart, timePartRaw] = value.split("T");
    const timePart = timePartRaw ? timePartRaw.slice(0, 5) : "09:00";
    return { date: datePart || "", time: timePart || "09:00" };
}

function mergeDateTime(date: string, time: string): string {
    if (!date) return "";
    return `${date}T${time || "00:00"}`;
}

export default function DateTimePickerField({
    value,
    onChange,
    disabled = false,
    showNowButton = true,
    showClearDateButton = true,
    compactTime = false,
    equalizeDateHeight = false,
}: DateTimePickerFieldProps) {
    const { date, time } = splitDateTime(value);

    const handleDateChange = (nextDate: string | null) => {
        if (disabled) return;
        onChange(mergeDateTime(nextDate || "", time));
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`${disabled ? "pointer-events-none opacity-60" : ""} ${equalizeDateHeight ? "[&_button]:h-11" : ""}`}>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Fecha</div>
                    <SingleDateFilter
                        value={date || null}
                        onChange={handleDateChange}
                        label="Seleccionar fecha"
                        clearable={showClearDateButton}
                    />
                </div>
                <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Hora</div>
                    <TimePickerField
                        value={time}
                        onChange={(nextTime) => onChange(mergeDateTime(date, nextTime))}
                        disabled={disabled || !date}
                        showNowButton={showNowButton}
                        compact={compactTime}
                    />
                </div>
            </div>
            {!date && !disabled && (
                <div className="mt-2 text-xs text-gray-500">Selecciona primero una fecha para habilitar la hora.</div>
            )}
        </div>
    );
}
