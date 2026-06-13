// app/views/Impresion/Etiquetas/Packing/components/EtiquetaPackingFields.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import Handlebars from "handlebars";
import Card from "@/components/ui/card/Card";
import {
    ClipboardDocumentListIcon,
    CubeIcon,
    UserIcon,
    CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { indentOnInput } from "@codemirror/language";
import { CopyIcon, ScanIcon } from "lucide-react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

export interface EtiquetaUserInfo {
    username: string;
    email: string;
    date: string;
}

export interface EtiquetaPacking {
    nombre: string;
    servicio: string;         // Packing
    entidad: string;          // Bulto, Package, etc.
    modalidad: string;        // package-label
    status: "Activo" | "Inactivo";
    formato: "Custom" | "A4" | "A5";
    width: number;            // mm
    height: number;           // mm
    template: string;         // HTML/CSS (handlebars)
    created: EtiquetaUserInfo;
    modified: EtiquetaUserInfo;
    estado: string;
}

/** === TEMPLATE POR DEFECTO (mismo que usabas en el Resumen viejo) === */
const DEFAULT_TEMPLATE = `<!-- Código editable para Etiqueta -->
<div style="width:100%; height:auto; border:2px solid #000; padding:0; background:#fff; font-family:Arial, sans-serif; font-size:15px;">
  <div style="padding:10px;">
    <div style="display:flex; align-items:flex-start;">
      <!-- Código de barras principal -->
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 0;
          margin-right: 18px;
          flex: 1 1 auto;
        "
      >
        <img
          src="{{barcodeImgUrl}}"
          style="display:block; height:45px; object-fit:contain;padding-left:7px"
        />
        <div style="font-size:10px;text-align:center;padding-left:2px; letter-spacing:2px; word-break:break-all;">
          {{barcode}}
        </div>
      </div>

      <!-- Código de barras secundario (derecha) -->
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 0;
          flex: 0 0 auto;
        "
      >
        <img
          src="{{barcode2ImgUrl}}"
          style="display:block; height: 45px; object-fit:contain;"
        />
        <div style="font-size:10px;align-self:center;">
          {{barcode2}}
        </div>
      </div>
    </div>
    <hr style="border: none; border-top: 3px solid #000; margin:5px 0 0px 0;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <div style="font-weight:bold;">ENVÍA</div>
        <div>{{sender}}</div>
      </div>
      <div>
        <div style="font-weight:bold;">RECIBE</div>
        <div>{{recipientName}}</div>
        <div>DNI: {{dni}}</div>
        <div>{{phone}}</div>
      </div>
    </div>
    <hr style="border: none; border-top: 3px solid #000; margin:10px 0 8px 0;">
    <div style="font-weight:bold;">ENTREGA</div>
    <div>{{deliveryDate}}</div>
    <div>{{address}}</div>
    <hr style="border: none; border-top: 3px solid #000; margin:10px 0 8px 0;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-weight:bold;">OPERADOR</div>
        <div>{{operator}}</div>
        <div>{{operator2}}</div>
      </div>
      <div style="display:flex; align-items:center;">
        <div style="border:1.5px solid #000; padding:8px 20px; font-size:24px; margin-right:8px;">
          {{page}}/{{totalPages}}
        </div>
        <img src="{{qrImgUrl}}" style="width:44px; height:44px;" />
      </div>
    </div>
  </div>
</div>
`;

/** === DATOS MOCK PARA RENDER/PRINT (como en tu Resumen viejo) === */
const PREVIEW_DATA = {
    barcode: "1329910521746-01",
    barcodeImgUrl:
        "https://static.vecteezy.com/system/resources/previews/001/199/361/non_2x/barcode-png.png",
    barcode2: "IPWFPJGFVZPCZ",
    barcode2ImgUrl:
        "https://static.vecteezy.com/system/resources/previews/001/199/361/non_2x/barcode-png.png",
    sender: "fizzmodarg-Palermo",
    recipientName: "Alejandro Gonzalez",
    dni: "99999999",
    phone: "+541156454545",
    deliveryDate: "May 9, 2023, 11:00:00 AM",
    address:
        "Costa Rica 4988, 1, San Nicolás, Ciudad Autónoma de Buenos Aires, CIUDAD AUTÓNOMA DE BUENOS AIRES, ARG, C.P.: 1414",
    operator: "Envío a domicilio",
    operator2: "Envío a domicilio",
    page: 1,
    totalPages: 1,
    qrImgUrl:
        "https://static.vecteezy.com/system/resources/previews/013/722/213/non_2x/sample-qr-code-icon-png.png",
};

export default function EtiquetaPackingFields({
    record,
    onChange,
}: {
    record: EtiquetaPacking;
    onChange?: (field: keyof EtiquetaPacking, value: any) => void;
}) {
    const handle =
        (field: keyof EtiquetaPacking) =>
            (value: any) =>
                onChange?.(field, value);

    const previewRef = useRef<HTMLDivElement>(null);

    /** Template efectivo (si viene vacío uso el default) */
    const templateStr =
        record.template && record.template.trim().length > 0
            ? record.template
            : DEFAULT_TEMPLATE;

    /** Compilo el template con Handlebars para el PREVIEW */
    const compiledHtml = useMemo(() => {
        try {
            const tpl = Handlebars.compile(templateStr);
            return tpl(PREVIEW_DATA);
        } catch (err: any) {
            return `<pre style="color:red">${err.message}</pre>`;
        }
    }, [templateStr]);

    /** Generar PDF compila el template con los mismos datos mock */
    const generarPdf = () => {
        try {
            const tpl = Handlebars.compile(templateStr);
            const htmlBody = tpl(PREVIEW_DATA);
            const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { margin: 10mm; }
            body{ font-family: Arial, Helvetica, sans-serif; }
          </style>
        </head>
        <body>
          ${htmlBody}
          <script>window.onload = () => window.print();</script>
        </body>
      </html>`;
            const w = window.open("", "_blank");
            if (!w) return;
            w.document.open();
            w.document.write(html);
            w.document.close();
        } catch (e) {
            console.error(e);
        }
    };

    // para copiar contenido del campo de codigo / template 
    const [copied, setCopied] = useState(false);

    const handleCopyClick = async () => {
        try {
            await navigator.clipboard.writeText(templateStr); // copia TODO el código
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);         // feedback breve
        } catch (e) {
            console.error("No se pudo copiar al portapapeles", e);
        }
    };


    return (
        <div className="space-y-6">
            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COL IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLES */}
                    <Card
                        title="DETALLES"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Nombre */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.nombre}
                                    onChange={(e) => handle("nombre")(e.target.value)}
                                    placeholder=""
                                />
                            </div>

                            {/* Servicio */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Servicio</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.servicio}
                                    options={["Packing"]}
                                    onChange={(v) => handle("servicio")(v)}
                                />
                            </div>

                            {/* Entidad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Entidad</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.entidad}
                                    options={["Bulto", "package", "order"]}
                                    onChange={(v) => handle("entidad")(v)}
                                />
                            </div>

                            {/* Modalidad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Modalidad</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.modalidad}
                                    options={["package-label"]}
                                    onChange={(v) => handle("modalidad")(v)}
                                />
                            </div>

                            {/* Estado */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.status}
                                    options={["Activo", "Inactivo"]}
                                    onChange={(v) =>
                                        handle("status")(v as EtiquetaPacking["status"])
                                    }
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COL DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    {/* FORMATO */}
                    <Card
                        title="FORMATO"
                        icon={ScanIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* Formato */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Formato</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    inline
                                    label=""
                                    value={record.formato}
                                    options={["Custom", "A4", "A5"]}
                                    onChange={(v) => handle("formato")(v as EtiquetaPacking["formato"])}
                                />
                            </div>

                            {/* Ancho (mm) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Ancho (mm)</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.width}
                                    onChange={(e) => handle("width")(Number(e.target.value))}
                                />
                            </div>

                            {/* Alto (mm) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Alto (mm)</span>
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.height}
                                    onChange={(e) => handle("height")(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </Card>

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
                                {(record.created.username?.[0] || "U").toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    {record.created.username || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.created.email || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.created.date || "—"}
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
                                {(record.modified.username?.[0] || "A").toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    {record.modified.username || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.modified.email || "—"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {record.modified.date || "—"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* TEMPLATE / PREVIEW */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* EDITOR */}
                <div className="lg:col-span-4">
                    <Card
                        title="PLANTILLAS"
                        icon={CodeBracketIcon}
                        hasTitleDivider
                        noDefaultStyles
                        className="rounded-xl p-6"
                    >
                        {/* Contenedor del editor */}
                        {/* <div className="relative w-full min-w-0 overflow-x-auto"> */}
                        <div className="relative">
                            <CodeMirror
                                value={templateStr}
                                height="560px"
                                extensions={[html(), indentOnInput()]}
                                onChange={(val) => handle("template")(val)}
                                basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
                                theme={dracula}
                                style={{ fontSize: 14, borderRadius: 8, background: "#0f172a" }}
                            />

                            {/* Botón flotante: esquina inferior derecha */}
                            <ActionButton
                                onClick={handleCopyClick}
                                variant="secondary"
                                size="sm"
                                className="absolute bottom-5 right-5 rounded-full"
                                aria-label="Copiar al portapapeles"
                                title="Copiar todo el código"
                            >
                                {copied ? (
                                    <span className="inline-flex items-center gap-1">
                                        <CheckIcon className="w-3 h-3" />
                                        Copiado
                                    </span>
                                ) : (
                                    <CopyIcon className="w-5 h-5" />
                                )}
                            </ActionButton>
                        </div>

                        {/* Fila inferior con acciones (PDF, leyenda) */}
                        <div className="mt-3 flex items-center gap-3">
                            <ActionButton
                                type="button"
                                variant="primary"
                                onClick={generarPdf}
                            >
                                Generar PDF
                            </ActionButton>
                            <span className="text-xs text-gray-500">
                                El PDF usa el contenido del template actual.
                            </span>
                        </div>
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
                        <div className="text-xs text-gray-500 mb-3">
                            Tamaño estimado: {record.width}cm × {record.height}cm
                        </div>

                        <div
                            ref={previewRef}
                            className="w-full flex justify-center items-start overflow-auto"
                            style={{ minHeight: 300 }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: 460,
                                    minWidth: 200,
                                }}
                                dangerouslySetInnerHTML={{ __html: compiledHtml }}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
