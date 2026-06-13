import React, { useMemo } from "react";

// Igual al contrato de tu DateRangeField
export type Range = { from?: Date; to?: Date };
export type Slot = { start: Date; end: Date };

type Props = {
    value?: Range;
    onChange: (r: Range) => void;
    slots?: Slot[];                 // si no lo pasas, se generan por defecto (mocks)
    disabled?: boolean;
    placeholder?: string;
};

const dayFmt = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
});
const timeFmt = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Mocks por defecto: próximos 14 días, 08–20, bloques de 2h, sin fines de semana
function generateDefaultSlots(
    days = 14,
    startHour = 8,
    endHour = 20,
    stepHours = 2,
    includeWeekends = false
): Slot[] {
    const out: Slot[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    for (let d = 0; d < days; d++) {
        const day = new Date(base);
        day.setDate(base.getDate() + d);
        const dow = day.getDay(); // 0 dom, 6 sáb
        if (!includeWeekends && (dow === 0 || dow === 6)) continue;

        for (let h = startHour; h < endHour; h += stepHours) {
            const start = new Date(day);
            start.setHours(h, 0, 0, 0);
            const end = new Date(start);
            end.setHours(start.getHours() + stepHours);
            out.push({ start, end });
        }
    }
    return out;
}

function slotLabel(s: Slot) {
    return `${cap(dayFmt.format(s.start))} · De ${timeFmt.format(s.start)} a ${timeFmt.format(s.end)}`;
}

function slotKey(s: Slot) {
    return `${s.start.toISOString()}__${s.end.toISOString()}`;
}

function sameRange(a?: Range, b?: Range) {
    return !!a?.from && !!a?.to && !!b?.from && !!b?.to &&
        a.from.getTime() === b.from.getTime() && a.to.getTime() === b.to.getTime();
}

export default function TimeSlotSelect({
    value,
    onChange,
    slots,
    disabled,
    placeholder = "Seleccione fecha y hora…",
}: Props) {
    const data = useMemo(() => slots ?? generateDefaultSlots(), [slots]);

    // Encuentra el key del rango seleccionado (si coincide con algún slot)
    const selectedKey = useMemo(() => {
        const found = data.find(s => sameRange(value, { from: s.start, to: s.end }));
        return found ? slotKey(found) : "";
    }, [data, value]);

    return (
        <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
            value={selectedKey}
            onChange={(e) => {
                const k = e.target.value;
                const found = data.find(s => slotKey(s) === k);
                onChange(found ? { from: found.start, to: found.end } : { from: undefined, to: undefined });
            }}
        >
            <option value="">{placeholder}</option>
            {data.map((s) => (
                <option key={slotKey(s)} value={slotKey(s)}>
                    {slotLabel(s)}
                </option>
            ))}
        </select>
    );
}

// Export util por si quieres mocks custom desde fuera
export const buildMockSlots = generateDefaultSlots;
