"use client";

import { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { ClockIcon } from "@heroicons/react/24/outline";
import { Popover } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimeClock } from "@mui/x-date-pickers/TimeClock";

type TimePickerFieldProps = {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    step?: number;
    showNowButton?: boolean;
    compact?: boolean;
};

function normalizeTime(value: string): string {
    if (!value) return "";
    const [hRaw, mRaw] = value.split(":");
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return "";
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getNowRounded(stepSeconds: number): string {
    const now = new Date();
    const stepMinutes = Math.max(1, Math.floor(stepSeconds / 60));
    const total = now.getHours() * 60 + now.getMinutes();
    const rounded = Math.round(total / stepMinutes) * stepMinutes;
    const dayMinutes = 24 * 60;
    const bounded = ((rounded % dayMinutes) + dayMinutes) % dayMinutes;
    const h = Math.floor(bounded / 60);
    const m = bounded % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toClockValue(time: string): Dayjs | null {
    const normalized = normalizeTime(time);
    if (!normalized) return null;
    return dayjs(`2000-01-01T${normalized}:00`);
}

function fromClockValue(value: Dayjs | null): string {
    if (!value) return "";
    return value.format("HH:mm");
}

export default function TimePickerField({
    value,
    onChange,
    disabled = false,
    step = 900,
    showNowButton = true,
    compact = false,
}: TimePickerFieldProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const normalizedValue = normalizeTime(value);
    const clockValue = useMemo(() => toClockValue(normalizedValue), [normalizedValue]);
    const open = Boolean(anchorEl);

    const handleClockChange = (next: Dayjs | null, selectionState?: "partial" | "shallow" | "finish") => {
        onChange(fromClockValue(next));
        if (selectionState === "finish") {
            setAnchorEl(null);
        }
    };

    return (
        <div
            className={`w-full rounded-lg border bg-white px-2 py-2 text-sm shadow-sm transition ${disabled
                ? "border-gray-200 text-gray-400 opacity-60"
                : "border-gray-300 text-gray-700 hover:border-gray-400"
                } ${compact ? "py-1" : "py-2"}`}
        >
            <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <button
                    type="button"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    disabled={disabled}
                    className={`min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 text-left text-sm text-gray-700 transition hover:border-blue-300 disabled:cursor-not-allowed ${compact ? "py-1" : "py-1.5"}`}
                >
                    {normalizedValue || "Seleccionar hora"}
                </button>
                {showNowButton ? (
                    <button
                        type="button"
                        disabled={disabled}
                        className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed"
                        onClick={() => onChange(getNowRounded(step))}
                    >
                        Ahora
                    </button>
                ) : null}
            </div>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <div className="p-3">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimeClock
                            value={clockValue}
                            onChange={handleClockChange}
                            minutesStep={1}
                            ampm={false}
                            disabled={disabled}
                        />
                    </LocalizationProvider>
                    <div className="mt-2 flex justify-end">
                        <button
                            type="button"
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                            onClick={() => setAnchorEl(null)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </Popover>

        </div>
    );
}
