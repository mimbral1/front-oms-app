// app/views/Cuenta/Smtp/components/SmtpFields.tsx
"use client";

import React, { useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

/* Tipos */
export type Estado = "Activo" | "Inactivo";
export type Protocolo = "" | "TLS" | "SSL";

export interface SmtpRecord {
    id?: string;
    name: string;
    from_name: string;
    from_email: string;
    host: string;
    username: string;
    password: string;
    port: number | string;
    security_protocol: Protocolo;
    status: Estado;
}

export function SmtpFields({
    record,
    readOnly = false,
    onChange,
}: {
    record: SmtpRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof SmtpRecord>(field: K, value: SmtpRecord[K]) => void;
}) {
    const set =
        <K extends keyof SmtpRecord>(field: K) =>
            (value: SmtpRecord[K]) =>
                onChange?.(field, value);

    // ojo para visibilizar contraseña
    const [showPwd, setShowPwd] = useState(false);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Columna izquierda: DETALLE */}
                <Card
                    title="DETALLE"
                    icon={ClipboardDocumentListIcon}
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl p-6"
                >
                    <div className="grid grid-cols-6 gap-4">
                        {/* Nombre */}
                        <span className="col-span-2 text-sm text-gray-600">Nombre</span>
                        <div className="col-span-4">
                            <input
                                type="text"
                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                value={record.name}
                                onChange={(e) => set("name")(e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Remitente (From name) */}
                        <span className="col-span-2 text-sm text-gray-600">Remitente (From name)</span>
                        <div className="col-span-4">
                            <input
                                type="text"
                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                value={record.from_name}
                                onChange={(e) => set("from_name")(e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Correo remitente */}
                        <span className="col-span-2 text-sm text-gray-600">Correo remitente</span>
                        <div className="col-span-4">
                            <input
                                type="email"
                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                value={record.from_email}
                                onChange={(e) => set("from_email")(e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Host */}
                        <span className="col-span-2 text-sm text-gray-600">Host</span>
                        <div className="col-span-4">
                            <input
                                type="text"
                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                value={record.host}
                                onChange={(e) => set("host")(e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Usuario */}
                        <span className="col-span-2 text-sm text-gray-600">Usuario</span>
                        <div className="col-span-4">
                            <input
                                type="text"
                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                value={record.username}
                                onChange={(e) => set("username")(e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Contraseña con “ojo” */}
                        <span className="col-span-2 text-sm text-gray-600">Contraseña</span>
                        <div className="col-span-4">
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPwd ? "text" : "password"}
                                    value={record.password}
                                    onChange={(e) => set("password")(e.target.value)}
                                    className="w-full border-b border-gray-300 pr-10 text-sm outline-none disabled:bg-transparent"
                                    placeholder="••••••••"
                                    disabled={readOnly}
                                />
                                {!readOnly && (
                                    <IconButton
                                        onClick={() => setShowPwd((s) => !s)}
                                        edge="end"
                                        size="small"
                                        sx={{ position: "absolute", right: 0, top: -10 }}
                                    >
                                        {showPwd ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                )}
                            </div>
                        </div>

                        {/* Puerto */}
                        <span className="col-span-2 text-sm text-gray-600">Puerto</span>
                        <div className="col-span-4">
                            <input
                                type="number"
                                className="w-full border-b border-gray-300 text-sm outline-none disabled:bg-transparent"
                                value={record.port}
                                onChange={(e) => set("port")(e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        {/* Protocolo de seguridad */}
                        <span className="col-span-2 text-sm text-gray-600">Protocolo de seguridad</span>
                        <div className="col-span-4">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.security_protocol || ""}
                                options={["", "TLS", "SSL"]}
                                onChange={(v) => set("security_protocol")(v as Protocolo)}
                            // disabled={readOnly}
                            />
                        </div>
                    </div>
                </Card>

                {/* Columna derecha: OTROS */}
                <Card
                    title="OTROS"
                    icon={ClipboardDocumentListIcon}
                    noDefaultStyles
                    hasTitleDivider
                    className="rounded-xl p-6"
                >
                    <div className="grid grid-cols-6 gap-4">
                        {/* Estado */}
                        <span className="col-span-2 text-sm text-gray-600">Estado</span>
                        <div className="col-span-4">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.status}
                                options={["Activo", "Inactivo"]}
                                onChange={(v) => set("status")(v as Estado)}
                            // disabled={readOnly}
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default SmtpFields;
