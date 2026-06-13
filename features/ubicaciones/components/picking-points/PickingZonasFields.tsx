"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ActiveStatusToggle } from "@/components/ui/togle";
import { CopyableText } from "@/components/ui/copyable-text";

/** Tipos */
export interface PickingZoneConfig {
    key: string;        // zoneId del backend
    name: string;       // zoneName
    description?: string | null;
    active: boolean;    // enabled
    preparable: boolean; // restricted (invertido: restricted=false → preparable=true?)
}

export default function PickingZonasFields({
    zones,
    readOnly = false,
    onChange,
}: {
    zones: PickingZoneConfig[];
    readOnly?: boolean;
    onChange?: <K extends keyof PickingZoneConfig>(zoneKey: string, field: K, value: PickingZoneConfig[K]) => void;
}) {
    const set =
        <K extends keyof PickingZoneConfig>(zoneKey: string, field: K) =>
            (value: PickingZoneConfig[K]) => onChange?.(zoneKey, field, value);

    return (
        <div className="space-y-4">
            {zones.map((z) => (
                <Card
                    key={z.key}
                    title={z.name.toUpperCase()}
                    hasTitleDivider={false}
                    noDefaultStyles
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <CopyableText
                                text={z.key}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                            >
                                ID: {z.key}
                            </CopyableText>
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${z.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                                {z.active ? "ACTIVA" : "INACTIVA"}
                            </span>
                        </div>

                        {z.description && (
                            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                {z.description}
                            </p>
                        )}

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Estado de la zona
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-slate-700">Habilitada</span>
                                    <ActiveStatusToggle
                                        active={z.active}
                                        onActiveChange={set(z.key, "active")}
                                        showStateLabel={false}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Capacidad operativa
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-slate-700">Es preparable</span>
                                    <ActiveStatusToggle
                                        active={z.preparable}
                                        onActiveChange={set(z.key, "preparable")}
                                        showStateLabel={false}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
