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

/* ======================= Defaults (REMITO) ======================= */
const DEFAULT_REMITO_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Remito</title>
  <style>
    :root{--bg:#ffffff;--muted:#6b7280;--line:#e5e7eb;--head:#f3f4f6;--ink:#111827}
    *{box-sizing:border-box} html,body{margin:0;font-size:16px;color:var(--ink);font-family:Roboto, Arial, sans-serif}
    .page{padding:32px;background:var(--bg)}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
    .brand{display:flex;align-items:center;gap:8px;font-size:28px;font-weight:700}
    .dot{width:14px;height:14px;border-radius:50%;background:#2563eb;display:inline-block}
    .title{font-size:32px;font-weight:700}
    .box{border:1px solid var(--line);border-radius:8px;padding:16px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .label{font-weight:700;margin-bottom:6px}
    .kvs{display:grid;grid-template-columns:1fr 1fr;row-gap:10px}
    .thead,.row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr}
    .thead{background:var(--head);color:var(--muted);font-weight:600;padding:12px;margin:16px 0 0 0;border-top-left-radius:8px;border-top-right-radius:8px}
    .row{padding:12px;border:1px solid var(--head);border-top:0}
    .muted{color:var(--muted)}
    .pill{display:inline-flex;align-items:center;justify-content:center;height:24px;padding:0 12px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:12px}
    .right{ text-align:right }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">Mimbral <span class="dot"></span></div>
      <div class="title">Remito</div>
    </div>

    <div class="box">
      <div class="grid">
        <div>
          <div class="label">Datos de Entrega</div>
          <div class="kvs">
            <div class="muted">Nombre transportadora:</div><div>{{carrier.name}}</div>
            <div></div><div>{{carrier.address}}</div>
          </div>
        </div>
        <div class="kvs">
          <div class="muted">N° de Remito</div><div class="right">{{route.displayId}}</div>
          <div class="muted">Fecha</div><div class="right">{{route.date}}</div>
          <div class="muted">Hora</div><div class="right">{{route.time}}</div>
        </div>
      </div>
    </div>

    <div class="thead">
      <div> Nº Pedido </div><div> Num. NF </div><div> Paquetes </div><div> CEP </div>
    </div>
    <div class="row">
      <div>{{order.id}}</div>
      <div>{{order.nf}}</div>
      <div><span class="pill">{{order.packages}}</span></div>
      <div><span class="pill">{{order.cep}}</span></div>
    </div>
  </div>
</body>
</html>`;

const REMITO_SAMPLE_JSON = `{
  "carrier": { "name": "Palermo", "address": "Costa Rica 4988" },
  "route":   { "displayId": "231109-JY7WPC", "date": "11/08/2023", "time": "4:57 PM" },
  "order":   { "id": "1374790506880-01", "nf": 1, "packages": 1, "cep": "1428" },
  "sku": "SKU-987654",
  "ean": "1234567890123",
  "code": "1-A1-01-01-1"
}`;

/* ======================= Tipos ======================= */
export type DocumentStatus = "Subido" | "Pendiente";
export interface Documento {
    id: string;
    servicio?: string;
    entidad?: string;
    generated_href?: string;
    status: DocumentStatus;
    template: string;            // HTML/CSS del REMITO
    template_barcode?: string;   // HTML/CSS de QR + Barras
    sample_data: string;         // JSON
    user_created?: { name: string; email: string; date?: string };
    user_modified?: { name: string; email: string; date?: string };
}

/* ======================= Componente ======================= */
export default function DocumentosFields({
    record,
    onChange,
}: {
    record: Documento;
    onChange: <K extends keyof Documento>(k: K, v: Documento[K]) => void;
}) {
    // Fallback robusto de datos (para que SIEMPRE se renderice algo)
    const data = useMemo(() => {
        try {
            const raw = record.sample_data?.trim() ? record.sample_data : REMITO_SAMPLE_JSON;
            return JSON.parse(raw);
        } catch {
            return JSON.parse(REMITO_SAMPLE_JSON);
        }
    }, [record.sample_data]);

    // PREVIEW etiqueta REMITO
    const compiledLabel = useMemo(() => {
        try {
            return Handlebars.compile(record.template || DEFAULT_REMITO_TEMPLATE)(data);
        } catch (e: any) {
            return `<pre style="color:#b91c1c">${e.message}</pre>`;
        }
    }, [record.template, data]);

    // PREVIEW QR + Barras
    const compiledBarcode = useMemo(() => {
        const tpl =
            record.template_barcode ||
            `<!doctype html><html><head><meta charset="utf-8"><style>
        .wrap{padding:24px;font-family:Arial, sans-serif; text-align:center;}
        .qr img{width:180px;height:180px;display:block;margin:0 auto 16px auto;}
        .barcode{margin:8px auto 0 auto;font-size:100px;font-family:'Libre Barcode 39',cursive;line-height:1;}
        .meta{margin-top:8px;color:#6b7280;font-size:12px}
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      </head><body>
        <div class="wrap">
          <div class="qr">
            {{#if qr_svg}}
              {{{qr_svg}}}
            {{else}}
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={{code}}" alt="QR"/>
            {{/if}}
          </div>
          <div class="barcode">{{code}}</div>
          <div class="meta">SKU: {{sku}} • EAN: {{ean}}</div>
        </div>
      </body></html>`;
        try {
            return Handlebars.compile(tpl)(data);
        } catch (e: any) {
            return `<pre style="color:#b91c1c">${e.message}</pre>`;
        }
    }, [record.template_barcode, data]);

    const serviceOptions = ["WMS", "OMS", "Catalog"];
    const statusOptions: DocumentStatus[] = ["Subido", "Pendiente"];

    return (
        <div className="space-y-6">
            {/* ====== FILA 1: DETALLES / STATUS ====== */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card
                    title="DETALLES"
                    icon={ClipboardDocumentListIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="grid grid-cols-6 gap-4">
                        <label className="col-span-1 text-sm font-bold text-gray-700">Servicio</label>
                        <div className="col-span-5">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.servicio || "WMS"}
                                options={serviceOptions}
                                onChange={(v) => onChange("servicio", v)}
                            />
                        </div>

                        <label className="col-span-1 text-sm font-bold text-gray-700">Archivo generado</label>
                        <div className="col-span-5 text-sm">
                            <a className="text-blue-600 hover:underline" href={record.generated_href || "#"} target="_blank" rel="noreferrer">
                                Archivo disponible
                            </a>
                        </div>

                        <label className="col-span-1 text-sm font-bold text-gray-700">Entidad</label>
                        <div className="col-span-5 text-sm text-gray-700">{record.entidad || "position"}</div>
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
                        <label className="col-span-1 text-sm font-bold text-gray-700">Estado</label>
                        <div className="col-span-5">
                            <CollapsibleField
                                inline
                                label=""
                                value={record.status}
                                options={statusOptions}
                                onChange={(v) => onChange("status", v as DocumentStatus)}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* ====== FILA 2: BARRAS (Editor IZQ / Preview DER) ====== */}
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
    .barcode { margin:8px auto 0 auto; font-size:100px; font-family: 'Libre Barcode 39', cursive; line-height:1; }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
</head>
<body>
  <div class="wrap">
    <div class="qr">
      {{#if qr_svg}}
        {{{qr_svg}}}
      {{else}}
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={{code}}" alt="QR"/>
      {{/if}}
    </div>
    <div class="barcode">{{code}}</div>
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

            {/* ====== FILA 3: ETIQUETA (Editor IZQ / Preview DER) ====== */}
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
                        value={record.template || DEFAULT_REMITO_TEMPLATE}
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

            {/* ====== FILA 4: DATOS / USUARIOS ====== */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card
                    title="DATOS"
                    icon={CodeBracketIcon}
                    hasTitleDivider
                    noDefaultStyles
                    className="rounded-xl p-6"
                >
                    <div className="mb-2 text-xs font-semibold text-gray-600">Datos crudos</div>
                    <CodeMirror
                        height="300px"
                        value={record.sample_data || REMITO_SAMPLE_JSON}
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
                                <span className="text-sm font-medium text-gray-900">{record.user_created?.name || "—"}</span>
                                <span className="text-xs text-gray-500">{record.user_created?.email || "—"}</span>
                                <span className="text-xs text-gray-500">{record.user_created?.date || "—"}</span>
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
                                <span className="text-sm font-medium text-gray-900">{record.user_modified?.name || "—"}</span>
                                <span className="text-xs text-gray-500">{record.user_modified?.email || "—"}</span>
                                <span className="text-xs text-gray-500">{record.user_modified?.date || "—"}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
