// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/AttrInput.tsx
//
// Input dinámico que renderiza según `attr.value_type`:
//   - string        → <Input type="text">
//   - number        → <Input type="number"> con tabular-nums
//   - boolean       → 2 radios (Sí/No)
//   - list          → <select> con styling OMS
//   - multi_list    → checkboxes chip-style (RemovableChip)
//   - number_unit   → number + unit select inline
//
// Look OMS: Input bordered del global + RemovableChip OMS-styled.

"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui";
import { FieldRow, RemovableChip } from "../../../../_shared/ui";
import type { PublicarAttribute } from "../types/publicar-types";

export interface AttrInputProps {
    attr: PublicarAttribute;
    value: unknown;
    onChange: (value: unknown) => void;
    /** Si true, renderiza con estilo "advertencia" (obligatorio sin llenar). */
    missingRequired?: boolean;
    /** `stacked` pone el label arriba del control, útil para nombres largos. */
    layout?: "row" | "stacked";
}

const SELECT_CLASSES = [
    "block w-full rounded-md border border-gray-300 px-3 py-2",
    "text-sm text-gray-900 bg-white shadow-sm",
    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
    "cursor-pointer",
].join(" ");

export function AttrInput({
    attr,
    value,
    onChange,
    missingRequired,
    layout = "row",
}: AttrInputProps) {
    const labelText = attr.label || attr.name || attr.id || "";
    const label = (
        <span className="inline-flex items-start gap-1.5 min-w-0 max-w-full">
            <span className="min-w-0 break-words leading-snug">{labelText}</span>
            {attr.required && (
                <span
                    className="text-rose-500 text-[10px] shrink-0"
                    title="Obligatorio"
                    aria-label="Obligatorio"
                >
                    ●
                </span>
            )}
            {attr.score_impact && !attr.required && (
                <span
                    className="text-amber-500 text-[10px]"
                    title="Suma al score"
                    aria-label="Suma al score"
                >
                    ★
                </span>
            )}
        </span>
    );

    if (layout === "stacked") {
        return (
            <div className="py-2 min-w-0">
                <label
                    className="block text-sm font-medium text-gray-700 mb-1.5 min-w-0"
                    title={String(labelText)}
                >
                    {label}
                </label>
                <AttrControl
                    attr={attr}
                    value={value}
                    onChange={onChange}
                    missingRequired={missingRequired}
                />
                {(attr.hint ?? attr.description) && (
                    <div className="text-xs text-gray-500 mt-1.5 leading-snug break-words">
                        {attr.hint ?? attr.description}
                    </div>
                )}
            </div>
        );
    }

    return (
        <FieldRow label={label} hint={attr.hint ?? attr.description ?? undefined}>
            <AttrControl
                attr={attr}
                value={value}
                onChange={onChange}
                missingRequired={missingRequired}
            />
        </FieldRow>
    );
}

function AttrControl({ attr, value, onChange, missingRequired }: AttrInputProps) {
    const t = attr.value_type ?? "string";

    if (t === "boolean") {
        return (
            <div className="flex items-center gap-4 py-2">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="radio"
                        name={`attr-${attr.id}`}
                        checked={value === true || value === "true"}
                        onChange={() => onChange(true)}
                        className="accent-blue-700"
                    />
                    <span className="text-sm">Sí</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="radio"
                        name={`attr-${attr.id}`}
                        checked={value === false || value === "false"}
                        onChange={() => onChange(false)}
                        className="accent-blue-700"
                    />
                    <span className="text-sm text-gray-500">No</span>
                </label>
            </div>
        );
    }

    if (t === "list") {
        return (
            <select
                value={String(value ?? "")}
                onChange={(e) => onChange(e.target.value)}
                className={SELECT_CLASSES}
            >
                <option value="">— seleccionar —</option>
                {(attr.values ?? []).map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.name}
                    </option>
                ))}
            </select>
        );
    }

    if (t === "multi_list") {
        const selectedSet = useMemo(
            () => new Set(Array.isArray(value) ? (value as string[]) : []),
            [value],
        );
        return (
            <div className="flex flex-wrap gap-1.5 py-1.5">
                {(attr.values ?? []).map((opt) => {
                    const checked = selectedSet.has(opt.id);
                    if (checked) {
                        return (
                            <RemovableChip
                                key={opt.id}
                                tone="primary"
                                onRemove={() =>
                                    onChange(
                                        Array.from(selectedSet).filter((s) => s !== opt.id),
                                    )
                                }
                            >
                                {opt.name}
                            </RemovableChip>
                        );
                    }
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                                onChange([...Array.from(selectedSet), opt.id])
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                        >
                            + {opt.name}
                        </button>
                    );
                })}
            </div>
        );
    }

    if (t === "number_unit") {
        // value puede venir como `{ number, unit }` o como string "10 cm"
        const v =
            value && typeof value === "object" && "number" in (value as object)
                ? (value as { number?: number; unit?: string })
                : { number: undefined, unit: attr.default_unit };
        return (
            <div className="flex items-stretch gap-2">
                <Input
                    type="number"
                    value={v.number ?? ""}
                    onChange={(e) =>
                        onChange({
                            number:
                                e.target.value === "" ? null : Number(e.target.value),
                            unit: v.unit ?? attr.default_unit,
                        })
                    }
                    className="flex-1 tabular-nums"
                />
                <select
                    value={v.unit ?? attr.default_unit ?? ""}
                    onChange={(e) =>
                        onChange({ number: v.number, unit: e.target.value })
                    }
                    className="rounded-md border border-gray-300 px-2 text-sm text-gray-700 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer self-end mt-1"
                >
                    {(attr.units ?? []).map((u) => (
                        <option key={u} value={u}>
                            {u}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    if (t === "number") {
        return (
            <Input
                type="number"
                value={(value as number | string | undefined) ?? ""}
                onChange={(e) =>
                    onChange(e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder={attr.exampleValue ?? "0"}
                aria-invalid={missingRequired ? true : undefined}
                className="tabular-nums"
            />
        );
    }

    // string (default)
    return (
        <Input
            value={(value as string | undefined) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attr.exampleValue ?? ""}
            maxLength={
                typeof attr.maxLength === "number"
                    ? attr.maxLength
                    : Number(attr.maxLength) || undefined
            }
            aria-invalid={missingRequired ? true : undefined}
        />
    );
}
