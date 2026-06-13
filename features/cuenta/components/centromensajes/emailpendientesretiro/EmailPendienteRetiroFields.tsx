// app/views/Configuracion/Entrega/EmailPendienteRetiro/components/EmailPendienteRetiroFields.tsx
"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { EnvelopeIcon, UserIcon } from "@heroicons/react/24/outline";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";

/* Interfaz del formulario */
export interface PendingPickupEmail {
    id?: string;
    activo: boolean;
    templateId?: number;
    templateName?: string;
    daysToWait: number | string;
    status?: "Activo" | "Inactivo";
    created: { username: string; email: string; date: string };
}

export function EmailPendienteRetiroFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: PendingPickupEmail;
    readOnly?: boolean;
    onChange?: (field: keyof PendingPickupEmail, value: any) => void;
    isCreate?: boolean;
}) {
    const handle = (field: keyof PendingPickupEmail) => (v: any) => onChange?.(field, v);

    /* Templates MOCK (SelectSearchInline con buscador, como compañías) */
    const [tplSearch, setTplSearch] = useState("");
    const tplOptions = useMemo(() => {
        const base = Array.from({ length: 8 }, (_, i) => ({ label: `Template ${i + 1}`, value: String(i + 1) }));
        const q = tplSearch.trim().toLowerCase();
        return q ? base.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q)) : base;
    }, [tplSearch]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* REMINDER EMAIL (mismo patrón de Card/DETALLE) */}
                    <Card
                        title="EMAIL RECORDATORIO"
                        icon={EnvelopeIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Activo (toggle con el mismo estilo de switches) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={record.activo}
                                    onClick={() => {
                                        const next = !record.activo;
                                        handle("activo")(next);
                                        handle("status")(next ? "Activo" : "Inactivo");
                                    }}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.activo ? "bg-blue-500" : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.activo ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Email template (selector + link “Edit template”) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Plantilla de email</span>
                            <div className="col-span-5">
                                <div className="flex items-center justify-between gap-4">
                                    <SelectSearchInline
                                        id="template"
                                        label="Template"
                                        value={record.templateId ? String(record.templateId) : ""}
                                        options={[{ label: "Seleccione…", value: "" }, ...tplOptions]}
                                        searchQuery={tplSearch}
                                        loading={false}
                                        onSearch={setTplSearch}
                                        onChange={(val, label) => {
                                            handle("templateId")(val ? Number(val) : undefined);
                                            handle("templateName")(label || "");
                                        }}
                                        placeholderFromDefault
                                    />
                                    <button
                                        type="button"
                                        className="text-sm text-blue-600 hover:underline"
                                        // Aquí podrás hacer router.push a la vista de Templates cuando exista
                                        onClick={() => void 0}
                                    >
                                        Editar template
                                    </button>
                                </div>
                            </div>

                            {/* Days to wait */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Días de espera</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    type="number"
                                    min={0}
                                    value={record.daysToWait}
                                    onChange={(e) => handle("daysToWait")(e.target.value)}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {!isCreate && (
                        <Card
                            title="USUARIO CREADOR"
                            icon={UserIcon}
                            noDefaultStyles
                            hasTitleDivider
                            className="rounded-xl p-6"
                        >
                            <div className="grid grid-cols-6 gap-4">
                                {/* Completar cuando tengas endpoint de usuarios */}
                                {/* Puedes mostrar record.created.username / email / date */}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
