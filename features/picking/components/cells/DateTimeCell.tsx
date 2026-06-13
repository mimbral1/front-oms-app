// features/picking/components/cells/DateTimeCell.tsx
// Celda reutilizable que muestra fecha + hora con iconos.

import React from "react";
import { CalendarIcon, ClockIcon } from "lucide-react";

export interface DateTimeCellProps {
    date: string;
    time?: string;
}

export function DateTimeCell({ date, time }: DateTimeCellProps) {
    return (
        <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span>{date}</span>
            </div>
            {time && (
                <div className="flex items-center gap-2 text-gray-500">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span>{time}</span>
                </div>
            )}
        </div>
    );
}
