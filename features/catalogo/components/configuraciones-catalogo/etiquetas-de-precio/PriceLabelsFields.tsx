"use client";

import React, { useMemo } from "react";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    CodeBracketIcon,
    UserIcon,
    QrCodeIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

import Handlebars from "handlebars";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { indentOnInput } from "@codemirror/language";

import LabelPreview from "./LabelPreview";
import {
    LABEL_SAMPLE_JSON,
} from "./DefaultLabelTemplate";

export type LabelStatus = "Activo" | "Inactivo";
export interface PriceLabel {
    id: string;
    name: string; // nombre visible
    code: string; // código interno
    size: string; // tamaño
    status: LabelStatus;
    service?: string; // p.ej. "Catalog"
    entity?: string; // p.ej. "Precios Oferta"
    generated_href?: string; // link al archivo generado (mock)
    // PLANTILLAS
    template: string; // HTML/CSS de la etiqueta
    template_barcode?: string; // HTML/CSS del código de barras (opcional, mock)
    // DATOS
    sample_data: string; // JSON como string (se usa para ambos previews)
    // USUARIOS
    user_created?: { initials: string; name: string; email: string; date?: string };
    user_modified?: { initials: string; name: string; email: string; date?: string };
}

export default function PriceLabelsFields({
    record,
    readOnly,
    onChange,
}: {
    record: PriceLabel;
    readOnly?: boolean;
    onChange: <K extends keyof PriceLabel>(k: K, v: PriceLabel[K]) => void;
}) {
    // ------- PREVIEW COMPILADOS (aislados en iframe) -------
    const compiledLabel = useMemo(() => {
        try {
            return Handlebars.compile(record.template || "")(
                JSON.parse(record.sample_data || "{}")
            );
        } catch (e: any) {
            return `<pre style="color:#b91c1c">${e.message}</pre>`;
        }
    }, [record.template, record.sample_data]);

    const serviceOptions = ["Catalog", "WMS", "POS"];
    const statusOptions: LabelStatus[] = ["Activo", "Inactivo"];

    const compiledBarcode = useMemo(() => {
        const tpl =
            record.template_barcode ||
            `<!doctype html><html><head><meta charset="utf-8"><style>
      .wrap{padding:24px;font-family:Arial, sans-serif; text-align:center;}
      .title{font-weight:700;margin-bottom:16px}
      .qr img{width:250px;height:250px;display:block;margin:0 auto 16px auto;}
      .barcode{margin-top:8px;font-size:100px;font-family:'Libre Barcode 39',cursive;}
      .meta{margin-top:8px;color:#6b7280;font-size:12px}
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
    </head><body>
    <div class="wrap">
      <!-- QR centrado arriba -->
      <div class="qr">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={{code}}" alt="QR" />
      </div>
      <!-- Código de barras abajo -->
      <div class="barcode">*{{code}}*</div>
      <div class="meta">SKU: {{sku}} • EAN: {{ean}}</div>
    </div></body></html>`;
        try {
            return Handlebars.compile(tpl)(JSON.parse(record.sample_data || "{}"));
        } catch (e: any) {
            return `<pre style="color:#b91c1c">${e.message}</pre>`;
        }
    }, [record.template_barcode, record.sample_data]);

    return (
        <div className="space-y-6">
            {/* ====== FILA 1: DETALLES / ESTADO (dos columnas iguales) ====== */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card
                    title="DETALLES"
                    icon={ClipboardDocumentListIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="grid grid-cols-6 gap-4">
                        <label className="col-span-1 text-sm font-bold text-gray-700">
                            Servicio
                        </label>
                        <div className="col-span-5">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.service || "Catalog"}
                                options={serviceOptions}
                                onChange={(v) => onChange("service", v)}
                            />
                        </div>

                        <label className="col-span-1 text-sm font-bold text-gray-700">
                            Archivo generado
                        </label>
                        <div className="col-span-5 text-sm">
                            <a
                                className="text-blue-600 hover:underline"
                                href={record.generated_href || "#"}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Archivo disponible
                            </a>
                        </div>

                        <label className="col-span-1 text-sm font-bold text-gray-700">
                            Entidad
                        </label>
                        <div className="col-span-5 text-sm text-gray-700">
                            {record.entity || "Precios Oferta"}
                        </div>
                    </div>
                </Card>

                <Card
                    title="ESTADO"
                    icon={ClipboardDocumentListIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="grid grid-cols-6 gap-4">
                        <label className="col-span-1 text-sm font-bold text-gray-700">
                            Estado
                        </label>
                        <div className="col-span-5">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.status}
                                options={statusOptions}
                                onChange={(v) => onChange("status", v as LabelStatus)}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* ====== FILA 2: BARRAS (Editor izquierda / Preview derecha) ====== */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card
                    title="PLANTILLA DE QR Y CÓDIGO DE BARRAS"
                    icon={CodeBracketIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="mb-2 text-xs font-semibold text-gray-600">
                        Template <span className="ml-2 text-blue-600">barcode</span>
                    </div>

                    <CodeMirror
                        height="520px"
                        value={
                            record.template_barcode ||
                            `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    .wrap { text-align:center; font-family: Arial, sans-serif; padding:16px; }
    .qr img { width:180px; height:180px; display:block; margin:0 auto 16px auto; }
    .barcode { margin-top:8px; font-size:20px; font-family: 'Libre Barcode 39', cursive; }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
</head>
<body>
  <div class="wrap">
    <!-- QR dinámico -->
    <div class="qr">
      <img
        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={{code}}"
        alt="QR"
      />
    </div>
    <!-- Código de barras dinámico -->
    <div class="barcode">*{{code}}*</div>
  </div>
</body>
</html>`
                        }
                        onChange={(v) => onChange("template_barcode", v)}
                        theme={dracula}
                        extensions={[html(), indentOnInput()]}
                    />
                </Card>

                <Card
                    title="VISTA PREVIA QR Y CÓDIGO DE BARRAS"
                    icon={QrCodeIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <LabelPreview html={compiledBarcode} />
                </Card>
            </div>

            {/* ====== FILA 3: ETIQUETA (Editor izquierda / Preview derecha) ====== */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card
                    title="PLANTILLA DE ETIQUETA"
                    icon={CodeBracketIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="mb-2 text-xs font-semibold text-gray-600">
                        Template <span className="ml-2 text-blue-600">labels</span>
                    </div>
                    <CodeMirror
                        height="520px"
                        value={
                            record.template ||
                            `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
    .page { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
    .badge { background:#e11d48; color:#fff; padding:10px 16px; font-weight:700; display:inline-block; }
    .price { font-size: 48px; font-weight:700; color:#374151; margin: 24px 0; }
    .before { border:1px solid #e5e7eb; padding:8px 10px; color:#6b7280; width: 60%; margin: 0 auto; }
    .qr img { width: 160px; height: 160px; display:block; margin:16px auto 8px auto; }
    .barcode { font-size:20px; font-family: 'Libre Barcode 39', cursive; margin: 8px auto 0 auto; text-align:center; }
    .footer { display:flex; justify-content:space-between; align-items:center; margin-top: 28px; color:#6b7280; font-size:12px; }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
</head>
<body>
  <div class="page">
    <div class="badge">{{headline}}</div>
    <div class="price">{{price}}</div>
    <div class="before">Antes {{previous_price}} / Ahorro {{saving}}</div>

    <!-- QR ARRIBA -->
    <div class="qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={{code}}" alt="QR" />
    </div>

    <!-- CÓDIGO DE BARRAS ABAJO -->
    <div class="barcode">*{{code}}*</div>

    <div class="footer">
      <div>SKU: {{sku}} • EAN: {{ean}}</div>
      <div>Válido hasta {{expires_at}}</div>
    </div>
  </div>
</body>
</html>`
                        }
                        onChange={(v) => onChange("template", v)}
                        theme={dracula}
                        style={{ fontSize: 14, borderRadius: 8, background: "#0f172a" }}
                        extensions={[html(), indentOnInput()]}
                    />
                </Card>

                <Card
                    title="VISTA PREVIA ETIQUETA"
                    icon={QrCodeIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <LabelPreview html={compiledLabel} />
                </Card>
            </div>

            {/* ====== FILA 4: DATOS / USUARIOS (dos columnas iguales) ====== */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card
                    title="DATOS"
                    icon={CodeBracketIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="mb-2 text-xs font-semibold text-gray-600">
                        Datos crudos
                    </div>
                    <CodeMirror
                        height="300px"
                        value={record.sample_data || LABEL_SAMPLE_JSON}
                        theme={dracula}
                        extensions={[javascript({ jsx: true }), indentOnInput()]}
                        editable={false}
                    />
                </Card>

                <div className="space-y-6">
                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
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

                    <Card
                        title="ÚLTIMA MODIFICACIÓN"
                        icon={UserIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-medium text-white">
                                {(record.user_modified?.name?.[0] || "A").toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    {record.user_modified?.name || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.user_modified?.email || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.user_modified?.date || "—"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
