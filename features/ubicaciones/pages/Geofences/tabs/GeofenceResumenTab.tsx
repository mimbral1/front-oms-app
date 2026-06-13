"use client";

import GeofenceResumenFields, { type GeofenceRecord } from "@/features/ubicaciones/components/geofences/GeofenceResumenFields";

export default function GeofenceResumenTab({
    record,
    onChange,
}: {
    record: GeofenceRecord;
    onChange: <K extends keyof GeofenceRecord>(field: K, value: GeofenceRecord[K]) => void;
}) {
    return <GeofenceResumenFields record={record} onChange={onChange} />;
}
