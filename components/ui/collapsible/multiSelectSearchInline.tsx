// components\collapsible\multiSelectSearchInline.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
    multiSelectInputWrapper,
    multiSelectInput,
    multiSelectChipsContainer,
    multiSelectChip,
    multiSelectChipButton,
    multiSelectCountButton,
    selectDropdown,
    selectOptionHighlight,
    selectOptionDefault,
} from "./collapsible.styles";

export function MultiSelectSearchInline({
    id,
    label,
    values,
    options,
    searchQuery,
    onSearch,
    onChange,
    compact = false,
    size = "md",
    showCompactSummary = true,
    showSelectedPanel = true,
    compactSelectionStyle = "text",
    showSelectionInControl = true,
    resetSearchOnFocus = false,
}: {
    id: string;
    label: string;
    values: string[];
    options: { label: string; value: string }[];
    searchQuery: string;
    onSearch: (q: string) => void;
    onChange: (values: string[]) => void;
    compact?: boolean;
    size?: "sm" | "md";
    showCompactSummary?: boolean;
    showSelectedPanel?: boolean;
    compactSelectionStyle?: "text" | "badge";
    showSelectionInControl?: boolean;
    resetSearchOnFocus?: boolean;
}) {

    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [input, setInput] = useState("");
    const boxRef = useRef<HTMLDivElement | null>(null);

    // cerrar al click fuera
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    useEffect(() => {
        setInput(searchQuery || "");
    }, [searchQuery]);

    const availableOptions = useMemo(() => {
        const q = input.toLowerCase();
        return options.filter(
            (o) =>
                !values.includes(o.value) &&
                (o.label + " " + o.value).toLowerCase().includes(q)
        );
    }, [options, values, input]);

    useEffect(() => {
        if (highlight >= availableOptions.length) setHighlight(0);
    }, [availableOptions.length, highlight]);

    const addValue = (opt: { label: string; value: string }) => {
        onChange([...values, opt.value]);
        onSearch("");
        setInput("");
        setHighlight(0);
        setOpen(true);
    };

    const removeValue = (val: string) => {
        onChange(values.filter((v) => v !== val));
    };

    const clearValues = () => {
        onChange([]);
        onSearch("");
    };

    const selectedItems = useMemo(
        () =>
            values.map((val) => ({
                value: val,
                label: options.find((o) => o.value === val)?.label || val,
            })),
        [values, options]
    );

    const compactSelectedSummary = useMemo(() => {
        if (!compact || !selectedItems.length) return "";
        const visibleLabels = selectedItems.slice(0, 2).map((item) => item.label);
        const extraCount = selectedItems.length - visibleLabels.length;
        return `${visibleLabels.join(", ")}${extraCount > 0 ? ` +${extraCount}` : ""}`;
    }, [compact, selectedItems]);

    const selectedLabelsText = useMemo(
        () => selectedItems.map((item) => item.label).join(", "),
        [selectedItems]
    );

    const isSmall = size === "sm";
    const showSelectionInInput =
        showSelectionInControl && compact && compactSelectionStyle === "text" && selectedItems.length > 0 && !input;
    const showInlineBadges =
        showSelectionInControl && compact && compactSelectionStyle === "badge" && values.length > 0;

    return (
        <div className="relative" ref={boxRef}>

            {/* INPUT FIJO */}
            <div className={`${multiSelectInputWrapper} ${isSmall ? "h-[34px] px-2.5" : ""}`}>
                {showInlineBadges && (
                    <div className="flex max-w-[55%] flex-wrap gap-1">
                        {selectedItems.slice(0, 2).map((item) => (
                            <Chip
                                key={item.value}
                                label={item.label}
                                value={item.value}
                                onRemove={removeValue}
                            />
                        ))}
                        {selectedItems.length > 2 && (
                            <button
                                type="button"
                                className={multiSelectCountButton}
                                onClick={() => setOpen((prev) => !prev)}
                                title="Ver seleccionados"
                            >
                                +{selectedItems.length - 2}
                            </button>
                        )}
                    </div>
                )}
                <input
                    type="text"
                    className={`${multiSelectInput} ${isSmall ? "text-xs" : ""}`}
                    placeholder={`Buscar ${label.toLowerCase()}…`}
                    value={showSelectionInInput ? selectedLabelsText : input}
                    onFocus={() => {
                        if (resetSearchOnFocus) {
                            setInput("");
                            onSearch("");
                        }
                        if (showSelectionInInput) {
                            setInput("");
                        }
                        setOpen(true);
                    }}
                    onClick={() => {
                        if (resetSearchOnFocus) {
                            setInput("");
                            onSearch("");
                        }
                        setOpen(true);
                    }}
                    onChange={(e) => {
                        setInput(e.target.value);
                        onSearch(e.target.value);
                        setOpen(true);
                    }}
                    onKeyDown={(e) => {

                        if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                            setOpen(true);
                        }

                        if (!availableOptions.length) {
                            if (e.key === "Backspace" && input === "" && values.length) {
                                removeValue(values[values.length - 1]);
                            }
                            return;
                        }

                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHighlight((h) => (h + 1) % availableOptions.length);
                        }
                        else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlight((h) => (h - 1 + availableOptions.length) % availableOptions.length);
                        }
                        else if (e.key === "Enter") {
                            e.preventDefault();
                            const opt = availableOptions[highlight];
                            if (opt) addValue(opt);
                        }
                        else if (e.key === "Backspace" && input === "" && values.length) {
                            removeValue(values[values.length - 1]);
                        }
                        else if (e.key === "Escape") {
                            setOpen(false);
                        }
                    }}
                />

                {values.length > 0 && (
                    <>
                        {compact && showSelectionInControl && (
                            <span className={`rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 ${isSmall ? "text-[10px]" : "text-[11px]"}`}>
                                {values.length}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={clearValues}
                            className={`rounded-md bg-indigo-50 font-medium text-indigo-700 transition hover:bg-indigo-100 ${isSmall ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"}`}
                        >
                            Limpiar
                        </button>
                    </>
                )}
            </div>

            {values.length > 0 && !compact && (
                <div className="mt-2 flex items-center justify-between text-xs text-indigo-700">
                    <span className="font-medium">{values.length} seleccionado(s)</span>
                </div>
            )}

            {values.length > 0 && compact && showCompactSummary && (
                <div className={`mt-1 truncate text-gray-600 ${isSmall ? "text-[10px]" : "text-[11px]"}`} title={selectedItems.map((item) => item.label).join(", ")}>
                    Seleccionado(s): {compactSelectedSummary}
                </div>
            )}

            {/* CHIPS SELECCIONADOS */}
            {values.length > 0 && !compact && (
                <div className={multiSelectChipsContainer}>

                    {selectedItems.slice(0, 4).map((item) => (
                        <Chip
                            key={item.value}
                            label={item.label}
                            value={item.value}
                            onRemove={removeValue}
                        />
                    ))}

                    {selectedItems.length > 4 && <span className={multiSelectCountButton}>+{selectedItems.length - 4}</span>}
                </div>
            )}

            {/* DROPDOWN OPCIONES */}
            {open && (availableOptions.length > 0 || (compact && values.length > 0 && (showSelectedPanel || compactSelectionStyle === "badge"))) && (
                <ul className={selectDropdown}>
                    {compact && values.length > 0 && (showSelectedPanel || compactSelectionStyle === "badge") && (
                        <li className="border-b border-gray-100 px-3 py-2">
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Seleccionados ({values.length})
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedItems.slice(0, 8).map((item) => (
                                    <Chip
                                        key={item.value}
                                        label={item.label}
                                        value={item.value}
                                        onRemove={removeValue}
                                    />
                                ))}
                                {selectedItems.length > 8 && (
                                    <span className={multiSelectCountButton}>+{selectedItems.length - 8}</span>
                                )}
                            </div>
                        </li>
                    )}
                    {availableOptions.map((opt, idx) => (
                        <li
                            key={opt.value}
                            className={`cursor-pointer select-none px-3 py-2 ${idx === highlight
                                ? selectOptionHighlight
                                : selectOptionDefault
                                }`}
                            onMouseEnter={() => setHighlight(idx)}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                addValue(opt);
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Chip({
    label,
    value,
    onRemove,
}: {
    label: string;
    value: string;
    onRemove: (val: string) => void;
}) {
    return (
        <span className={`${multiSelectChip} max-w-[180px]`}>
            <span className="truncate" title={label}>
                {label}
            </span>
            <button
                type="button"
                onClick={() => onRemove(value)}
                className={multiSelectChipButton}
                aria-label={`Quitar ${label}`}
            >
                ×
            </button>
        </span>
    );
}
