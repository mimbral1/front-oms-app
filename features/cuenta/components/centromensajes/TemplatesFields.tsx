"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { CopyIcon, User2Icon } from "lucide-react";
import { Editor } from "@monaco-editor/react";
import { useMonaco } from "@monaco-editor/react";

// Importa el archivo CSS
import "./styles.css";

// Define el tema Monokai
const monokaiTheme = {
    base: "vs-dark" as "vs-dark",
    inherit: true,
    rules: [
        { token: "keyword", foreground: "#f92672" },
        { token: "string", foreground: "#e6db74" },
        { token: "comment", foreground: "#6272a4" },
        { token: "variable", foreground: "#f8f8f2" },
        { token: "constant.numeric", foreground: "#ae81ff" },
        { token: "keyword.operator", foreground: "#f8f8f2" },
        { token: "constant.language", foreground: "#f8f8f2" },
    ],
    colors: {
        "editor.background": "#272822",
        "editor.foreground": "#f8f8f2",
        "editor.lineHighlightBackground": "#3e3d32",
        "editorCursor.foreground": "#f8f8f0",
        "editor.selectionBackground": "#49483e",
        "editor.selectionHighlightBackground": "#49483e",
    }
};

export interface Templates {
    id: string;
    subject: string;
    code: string;
    smtp_config_name: string;
    user_created: { initials: string; name: string; email: string; date: string };
    date_created: string;
    user_modified: { initials: string; name: string; email: string };
    date_modified: string;
    status: string;
    destinatario: string;
    asunto: string;
    responder_a: string;
    body: string;
    sample_data: string;
}

interface Props {
    record: Templates;
    readOnly?: boolean;
    onChange?: (field: keyof Templates, value: string) => void;
}

export const TemplatesFields: React.FC<Props> = ({
    record,
    readOnly = true,
    onChange,
}) => {
    const [body, setBody] = useState(record.body);

    // Función auxiliar para asegurar que la cadena sampleData es un JSON válido
    const getValidSampleData = (data: string): string => {
        if (!data || data.trim() === "") {
            return JSON.stringify({}); // Si está vacío, devuelve un objeto vacío JSON
        }
        try {
            // Intenta parsear para ver si ya es un JSON string
            const parsed = JSON.parse(data);
            // Si es un JSON válido, y es un objeto o array, lo devolvemos stringificado.
            // Si es un primitivo (número, string, booleano), lo encapsulamos.
            if (typeof parsed === 'object' && parsed !== null) {
                return JSON.stringify(parsed, null, 2); // Formatea para mejor lectura en el editor
            } else {
                console.warn("sample_data contiene un primitivo JSON. Encapsulando en un objeto por defecto.");
                // Encapsulamos el primitivo en un objeto JSON con una clave genérica
                return JSON.stringify({ default_value: parsed }, null, 2);
            }
        } catch (e) {
            // Si no es un JSON string válido, lo encapsulamos en un objeto con una clave genérica
            console.warn(`sample_data "${data}" no es un JSON válido. Encapsulando en un objeto por defecto.`);
            return JSON.stringify({ raw_input: data }, null, 2);
        }
    };

    // sampleData del estado se mantendrá como el string original (válido o no)
    const [sampleData, setSampleData] = useState(record.sample_data);

    useEffect(() => {
        setBody(record.body);
        setSampleData(record.sample_data);
    }, [record]);

    // Usar useMemo para procesar sampleData solo cuando cambie
    const processedSampleData = useMemo(() => getValidSampleData(sampleData), [sampleData]);

    const handleBodyChange = (value: string | undefined) => {
        setBody(value || "");
        onChange?.("body", value || "");
    };

    // Nuevo manejador para el campo sample_data del Monaco Editor
    const handleSampleDataChange = (value: string | undefined) => {
        const newValue = value || "";
        setSampleData(newValue); // Actualiza el estado local

        // Intenta parsear y pasa el objeto JSON al onChange si es válido
        try {
            const parsedValue = JSON.parse(newValue);
            onChange?.("sample_data", parsedValue);
        } catch (e) {
            // Si no es JSON válido, puedes decidir cómo manejarlo.
            // Por ahora, pasamos el string sin parsear al onChange si el padre lo maneja
            onChange?.("sample_data", newValue);
            console.error("El sample data introducido no es un JSON válido.", e);
        }
    };

    const renderTemplatePreview = () => {
        let previewBody = body;

        try {
            // console.log("Intentando parsear sampleData para la vista previa:", processedSampleData);
            // Parseamos processedSampleData, que ahora garantizamos que es un JSON válido
            const sampleDataObj = JSON.parse(processedSampleData);

            for (const [key, value] of Object.entries(sampleDataObj)) {
                const placeholder = `{{${key}}}`;
                if (typeof value === "string" || typeof value === "number") {
                    previewBody = previewBody.replace(new RegExp(placeholder, "g"), String(value));
                } else {
                    console.warn(`El valor para el placeholder ${placeholder} no es un string ni número y no será reemplazado. Tipo: ${typeof value}, Valor:`, value);
                }
            }
        } catch (error) {
            console.error("Error al parsear el JSON de sample data para la vista previa:", error);
        }

        return (
            <iframe
                className="preview-iframe"
                srcDoc={previewBody}
                sandbox=""
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    borderRadius: "10px",
                    backgroundColor: "#f8f8f2",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
            />
        );
    };

    const handle =
        (field: keyof Templates) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                onChange?.(field, e.target.value);
            };

    const handleCopyClick = () => {
        navigator.clipboard.writeText(body).then(() => {
            // alert("Texto copiado al portapapeles!"); // Puedes usar un Toast o una notificación más sutil
        }).catch((err) => {
            console.error("Error al copiar al portapapeles", err);
        });
    };

    const monaco = useMonaco();

    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme("monokai", monokaiTheme);
            monaco.editor.setTheme("monokai");
        }
    }, [monaco]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/** DETALLE EMAIL */}
                    <Card
                        title="Detalle del Email"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4">
                            {/* destinatario */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Destinatario
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.destinatario}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.destinatario}
                                        onChange={handle("destinatario")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* asunto */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Asunto
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.asunto}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.asunto}
                                        onChange={handle("asunto")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* responder a */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Responder a
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.responder_a}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.responder_a}
                                        onChange={handle("responder_a")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                            {/* smtp config name */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">
                                Smtp config name
                            </span>
                            <div className="col-span-5">
                                {readOnly ? (
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-blue-600 underline truncate"
                                    >
                                        {record.smtp_config_name}
                                    </a>
                                ) : (
                                    <input
                                        type="text"
                                        value={record.smtp_config_name}
                                        onChange={handle("smtp_config_name")}
                                        className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                                    />
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Editor de Body */}
                    <Card
                        title="Body del Email (HTML)"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                    // className="card rounded-xl p-6"
                    >
                        <div className="editor-container relative">
                            <Editor
                                height="100%"
                                language="html"
                                value={body}
                                onChange={handleBodyChange}
                                theme="monokai"
                                options={{
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    lineNumbers: "on",
                                }}
                            />
                            {/* Botón de Copiar */}
                            <button
                                onClick={handleCopyClick}
                                className="absolute bottom-4 right-4 p-2 bg-gray-200 text-blue-600 rounded-full shadow-md hover:bg-gray-300 focus:outline-none"
                                aria-label="Copiar al portapapeles"
                            >
                                <CopyIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </Card>

                    {/* Campo Sample Data */}
                    <Card
                        title="Sample Data (Variables)"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                    >
                        <div className="editor-container">
                            <Editor
                                height="100%"
                                language="json"
                                value={processedSampleData}
                                onChange={handleSampleDataChange} // Mantén este manejador para permitir la edición
                                theme="monokai"
                                options={{
                                    readOnly: true, // Usa la prop readOnly para controlar si es editable
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    lineNumbers: "on",
                                }}
                            />
                        </div>
                    </Card>
                </div>

                {/* Columna derecha */}
                <div className="space-y-6">
                    <Card
                        title="Template edit"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                    // className="card rounded-xl p-6"
                    >
                        <div className="editor-container">
                            {/* Vista previa del Template */}
                            {renderTemplatePreview()}
                        </div>
                    </Card>

                    {/* Usuario creador */}
                    <Card
                        title="Usuario creador"
                        icon={User2Icon}
                        noDefaultStyles
                        hasTitleDivider
                    // className="card rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                            {/* CHIP del usuario (ocupa 5 columnas) */}
                            <div className="col-span-3">
                                <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                        {record.user_created?.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-semibold text-blue-600">{record.user_created?.name}</div>
                                        <div className="text-gray-500 truncate max-w-[200px]">{record.user_created?.email}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Fecha (columna 6) */}
                            <div className="col-span-3 text-sm text-gray-500 text-right truncate">
                                {record.user_created?.date}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};