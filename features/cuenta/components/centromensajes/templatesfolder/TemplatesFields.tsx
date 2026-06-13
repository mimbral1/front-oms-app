// app/cuenta/centro-mensajes/templates-page/components/TemplatesFields.tsx
"use client";

import React, { useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, CodeBracketIcon, CubeIcon, UserIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

// editor de codigo y revisualizador
import EmailPreview from "./EmailPreview";
import Handlebars from "handlebars";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { indentOnInput } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript"

import { DEFAULT_TEMPLATE, SAMPLE_DATA } from "./DefaultTemplate";

export type TemplateStatus = "Activo" | "Inactivo";

export interface Templates {
    id: string;
    subject: string;              // asunto
    code: string;                 // código interno
    smtp_config_name: string;     // smtp
    status: TemplateStatus;       // estado
    destinatario?: string;        // display only / editable
    responder_a?: string;         // reply-to display
    body: string;                 // HTML (se edita fuera, en Nuevo/Resumen)
    sample_data: string;          // JSON string para preview
    user_created?: {
        initials: string; name: string; email: string; date?: string;
    };
    user_modified?: {
        initials: string; name: string; email: string;
    };
    date_created?: string;
    date_modified?: string;
}

// opciones select code
const TEMPLATE_CODE_OPTIONS: string[] = [
    "shipping-dispatched",
    "shipping-ready-for-pickup",
    "shipping-ready-for-delivery",
    "shipping-arrived-to-receiver",
    "shipping-on-the-way",
    "customer-reschedule-success",
    "shipping-delivered",
    "shipping-picked-up",
    "shipping-not-delivered",
    "shipping-pickup-reminder",
];
const TEMPLATE_CODE_HELP: Record<string, string> = {
    "shipping-dispatched": "Se notifica cuando el pedido fue despachado.",
    "shipping-ready-for-pickup": "Pick Up listo para retirar.",
    "shipping-ready-for-delivery": "Delivery/Express listo para enviar.",
    "shipping-arrived-to-receiver": "3PL informó que recibió el pedido.",
    "shipping-on-the-way": "El envío está en camino al domicilio.",
    "customer-reschedule-success": "El envío fue modificado/reagendado por el cliente.",
    "shipping-delivered": "El pedido fue entregado.",
    "shipping-picked-up": "El cliente retiró un pedido Pick Up.",
    "shipping-not-delivered": "Intento de entrega fallido.",
    "shipping-pickup-reminder": "Recordatorio de retiro de pedido.",
};

export function TemplatesFields({
    readOnly = false,
}: {
    record: Templates;
    readOnly?: boolean;
    onChange?: <K extends keyof Templates>(field: K, value: Templates[K]) => void;
}) {
    const handle =
        <K extends keyof Templates>(field: K) =>
            (value: Templates[K]) =>
                onChange?.(field, value);



    const [record, setRecord] = useState<Templates>({
        id: "new",
        subject: "",
        code: "",
        smtp_config_name: "-",
        status: "Activo",
        destinatario: "",
        responder_a: "",
        body: DEFAULT_TEMPLATE,
        sample_data: SAMPLE_DATA,
    });

    const onChange = <K extends keyof Templates>(k: K, v: Templates[K]) =>
        setRecord((r) => ({ ...r, [k]: v }));

    // render preview
    let previewHtml = "";
    try {
        const data = JSON.parse(record.sample_data || "{}");
        previewHtml = Handlebars.compile(record.body || "")(data);
    } catch (e: any) {
        previewHtml = `<pre style="color:#b91c1c">${e.message}</pre>`;
    }

    return (
        <div className="space-y-6">
            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COL IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="Detalles"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Asunto */}
                            <label className="col-span-1 text-sm font-bold text-gray-700">
                                Asunto
                            </label>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.subject}
                                    onChange={(e) => handle("subject")(e.target.value)}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                            </div>

                            {/* Código */}
                            <label className="col-span-1 text-sm font-bold text-gray-700">Código</label>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.code}
                                    options={TEMPLATE_CODE_OPTIONS}
                                    onChange={(v) => onChange("code", v)}
                                />
                                {record.code && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        {TEMPLATE_CODE_HELP[record.code] || ""}
                                    </p>
                                )}
                            </div>

                            {/* SMTP */}
                            <label className="col-span-1 text-sm font-bold text-gray-700">
                                SMTP (configuración)
                            </label>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.smtp_config_name}
                                    options={["-", "mailgun", "ses", "sendgrid"]}
                                    onChange={(v) => handle("smtp_config_name")(v)}
                                // disabled={readOnly}
                                />
                            </div>

                            {/* Estado */}
                            <label className="col-span-1 text-sm font-bold text-gray-700">
                                Estado
                            </label>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.status}
                                    options={["Activo", "Inactivo"]}
                                    onChange={(v) => handle("status")(v as TemplateStatus)}
                                // disabled={readOnly}
                                />
                            </div>

                            {/* Destinatario / Responder a (texto libre) */}
                            <label className="col-span-1 text-sm font-bold text-gray-700">
                                Destinatario
                            </label>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.destinatario ?? ""}
                                    onChange={(e) => handle("destinatario")(e.target.value)}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                            </div>

                            <label className="col-span-1 text-sm font-bold text-gray-700">
                                Responder a
                            </label>
                            <div className="col-span-5">
                                <input
                                    disabled={readOnly}
                                    value={record.responder_a ?? ""}
                                    onChange={(e) => handle("responder_a")(e.target.value)}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
                {/* COL DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* USUARIO CREADOR */}
                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                                {(record.user_created?.name?.[0] || "U").toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    {record.user_created?.name || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.user_created?.email || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.user_created?.date || "—"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* ÚLTIMA MODIFICACIÓN */}
                    <Card
                        title="ÚLTIMA MODIFICACIÓN"
                        icon={UserIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-medium">
                                {(record.user_created?.name?.[0] || "A").toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    {record.user_created?.name || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.user_created?.email || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.user_created?.date || "—"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Editor + Preview (mismo approach que Etiquetas Packing) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* EDITOR */}
                <div className="lg:col-span-4">
                    <Card
                        title="TEMPLATE"
                        icon={CodeBracketIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="mb-2 text-xs font-semibold text-gray-600">Plantilla editable del email</div>
                        <CodeMirror
                            height="520px"
                            value={record.body}
                            onChange={(v) => onChange("body", v)}
                            theme={dracula}
                            style={{ fontSize: 14, borderRadius: 8, background: "#0f172a" }}
                            extensions={[html(), indentOnInput()]}
                        />
                    </Card>
                </div>

                {/* PREVIEW */}
                <div className="lg:col-span-3">
                    <Card
                        title="PREVISUALIZACIÓN"
                        icon={CubeIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="mb-2 text-xs font-semibold text-gray-600">Previsualización del email</div>
                        <EmailPreview html={previewHtml} />
                    </Card>
                </div>

                {/* Datos de ejemplo (JSON) */}
                <div className="lg:col-span-4">
                    <Card
                        title="DATOS"
                        icon={CodeBracketIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="mb-2 text-xs font-semibold text-gray-600">Datos del correo (JSON)</div>
                        <CodeMirror
                            height="520px"
                            value={record.sample_data || SAMPLE_DATA}
                            theme={dracula}
                            extensions={[javascript({ jsx: true }), indentOnInput()]}
                            editable={false} // solo visualización
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Este <em>JSON</em> muestra las variables del email solo para lectura.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default TemplatesFields;
