import type { Interval } from "@/features/delivery/components/transportistas/grupotransportistas/CarrierGroupFields";

const carrierGroupIntervalsCache = new Map<string, Interval[]>();

const cloneIntervals = (intervals: Interval[]): Interval[] =>
    intervals.map((interval) => ({
        days: [...(interval.days || [])],
        windows: (interval.windows || []).map((window) => ({
            start: window.start || "",
            end: window.end || "",
        })),
        max: Number(interval.max || 0),
        applyQuotaToCarrierWindow: Boolean(interval.applyQuotaToCarrierWindow),
    }));

export const getCarrierGroupIntervalsCache = (groupId: string): Interval[] | undefined => {
    const key = String(groupId || "").trim();
    if (!key) return undefined;

    const cached = carrierGroupIntervalsCache.get(key);
    if (!cached) return undefined;
    return cloneIntervals(cached);
};

export const setCarrierGroupIntervalsCache = (groupId: string, intervals: Interval[]): void => {
    const key = String(groupId || "").trim();
    if (!key) return;

    carrierGroupIntervalsCache.set(key, cloneIntervals(intervals || []));
};
