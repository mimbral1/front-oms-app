// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorDescripcionSection.tsx
//
// Card "Descripción" del editor — match al legacy editar.html (sec-desc).
//
// V1: textarea simple. El legacy usa Quill (rich text WYSIWYG) — port pendiente
// para cuando se decida si seguimos con Quill, switch a TipTap, o dejar plain
// text. Por ahora editás como string, se persiste vía PUT igual.

"use client";

import { FileText } from "lucide-react";
import { Card } from "@/components/ui";
import { SectionDivider } from "../../../../_shared/ui";
import type { EditorProduct } from "../types/editor-types";
import type { EditFieldValue } from "../hooks/useEditorState";

export interface EditorDescripcionSectionProps {
    product: EditorProduct;
    editFields: Record<string, EditFieldValue>;
    onUpdateField: (key: string, value: EditFieldValue) => void;
}

export function EditorDescripcionSection({
    product,
    editFields,
    onUpdateField,
}: EditorDescripcionSectionProps) {
    const descField = product.campos_basicos?.descripcion;
    const isEditable = descField?.editable !== false;
    const value = String(editFields.descripcion ?? "");

    if (!descField) {
        // El backend no expone descripción para este SKU/marketplace.
        return (
            <Card title="Descripción">
                <SectionDivider icon={<FileText className="w-4 h-4" />}>
                    Descripción
                </SectionDivider>
                <div className="text-sm text-gray-500 py-4">
                    Este producto no tiene campo de descripción en el shape del
                    marketplace.
                </div>
            </Card>
        );
    }

    return (
        <Card title="Descripción">
            <SectionDivider icon={<FileText className="w-4 h-4" />}>
                Texto del producto
            </SectionDivider>

            {!isEditable ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-md border border-gray-200 px-3 py-2.5 min-h-[120px]">
                    {value || (
                        <span className="text-gray-400 italic">Sin descripción.</span>
                    )}
                </div>
            ) : (
                <>
                    <textarea
                        className="block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[200px] resize-y leading-relaxed"
                        value={value}
                        onChange={(e) => onUpdateField("descripcion", e.target.value)}
                        placeholder="Material, dimensiones, casos de uso, contenido del paquete…"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>
                            Texto plano. Rich text (Quill) pendiente — port del legacy
                            cuando se defina editor.
                        </span>
                        <span className="tabular-nums">{value.length} caracteres</span>
                    </div>
                </>
            )}

            {descField.advertencia && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md">
                    {descField.advertencia}
                </div>
            )}
        </Card>
    );
}
