// components\collapsible\selectSearchInline.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
    selectInputWrapper,
    selectInput,
    selectDropdown,
    selectOptionHighlight,
    selectOptionDefault,
    selectClearButton,
    selectChevronWrapper,
    selectChevronIcon,
} from "./collapsible.styles";

/* =========================================================================================
   Mini-componente local de "select-search" (mismo UX del header): input con búsqueda,
   placeholder desde la opción por defecto (value === ""), dropdown blanco y selección.
========================================================================================= */
export function SelectSearchInline({
    id,
    label,
    value,
    options,
    searchQuery,
    loading,
    onSearch,
    onChange,
    placeholderFromDefault = true,
}: {
    id: string;
    label: string;
    value: string;
    options: { label: string; value: string; disabled?: boolean; image?: string }[];
    searchQuery: string;
    loading?: boolean;
    onSearch: (q: string) => void;
    onChange: (value: string, label?: string) => void;
    placeholderFromDefault?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [input, setInput] = useState("");
    const boxRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // cerrar al click fuera
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const defaultOptionLabel = useMemo(
        () => options.find((o) => o.value === "")?.label || "",
        [options]
    );

    const placeholder = useMemo(() => {
        if (placeholderFromDefault && !searchQuery && value === "" && defaultOptionLabel) {
            return defaultOptionLabel;
        }
        return `Buscar ${label.toLowerCase()}...`;
    }, [defaultOptionLabel, placeholderFromDefault, label, searchQuery, value]);

    // sincroniza lo visible
    useEffect(() => {
        const hasSearch = typeof searchQuery === "string" && searchQuery.trim() !== "";
        if (hasSearch) {
            setInput(searchQuery);
            return;
        }
        if (value !== "") {
            const selected = options.find((o) => o.value === value)?.label || "";
            setInput(selected);
        } else {
            setInput("");
        }
    }, [searchQuery, value, options]);

    // filtrado local
    const localOptions = useMemo(() => {
        const q = (searchQuery || "").trim().toLowerCase();
        return (options || []).filter((o) =>
            (o.label + " " + o.value).toLowerCase().includes(q)
        );
    }, [options, searchQuery]);

    useEffect(() => {
        if (highlight >= localOptions.length) setHighlight(0);
    }, [localOptions.length, highlight]);

    const selectOption = (opt: { value: string; label: string; disabled?: boolean; image?: string }) => {
        if (opt.disabled) return;
        onChange(opt.value, opt.label);
        onSearch("");
        setInput(opt.value === "" ? "" : opt.label);
        setOpen(false);
    };

    return (
        <div className="relative" ref={boxRef}>

            {/* INPUT FIJO (no estira header) */}
            <div className={selectInputWrapper}>
                <input
                    ref={inputRef}
                    id={`${id}-search`}
                    type="text"
                    autoComplete="off"
                    value={input}
                    onFocus={() => setOpen(true)}
                    onMouseDown={(e) => {
                        const isAlreadyFocused = document.activeElement === inputRef.current;
                        if (open && isAlreadyFocused) {
                            e.preventDefault();
                            setOpen(false);
                            inputRef.current?.blur();
                        }
                    }}
                    onChange={(e) => {
                        const v = e.target.value;
                        setInput(v);
                        onSearch(v);
                        if (value !== "" && v !== "") onChange("");
                        setOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOpen(true);

                        if (!localOptions.length) {
                            if (e.key === "Escape") setOpen(false);
                            return;
                        }

                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHighlight((h) => (h + 1) % localOptions.length);
                        }
                        else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlight((h) => (h - 1 + localOptions.length) % localOptions.length);
                        }
                        else if (e.key === "Enter") {
                            e.preventDefault();
                            const opt = localOptions[highlight];
                            if (opt) selectOption(opt);
                            else setOpen(false);
                        }
                        else if (e.key === "Escape") {
                            setOpen(false);
                        }
                    }}
                    className={selectInput}
                    placeholder={placeholder}
                />

                {loading ? (
                    <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    </span>
                ) : null}
            </div>

            {/* DROPDOWN */}
            {open && (loading || localOptions.length > 0) && (
                <ul className={selectDropdown}>
                    {loading && (
                        <li className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Buscando...
                        </li>
                    )}
                    {localOptions.map((opt, idx) => (
                        <li
                            key={opt.value || String(idx)}
                            className={`select-none px-3 py-2 ${opt.disabled
                                ? "cursor-not-allowed text-gray-300"
                                : idx === highlight
                                    ? `${selectOptionHighlight} cursor-pointer`
                                    : `${selectOptionDefault} cursor-pointer`
                                }`}
                            onMouseEnter={() => {
                                if (!opt.disabled) setHighlight(idx);
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectOption(opt);
                            }}
                        >
                            <div className="flex items-center gap-2">
                                {opt.image ? (
                                    <img
                                        src={opt.image}
                                        alt={opt.label}
                                        className="h-8 w-8 rounded-md object-cover"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).style.display = "none";
                                        }}
                                    />
                                ) : null}
                                <span className="truncate">{opt.label}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {(value || input) && (
                <button
                    type="button"
                    onClick={() => {
                        onChange("");
                        onSearch("");
                        setInput("");
                        setOpen(false);
                    }}
                    className={selectClearButton}
                    aria-label="Limpiar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                </button>
            )}

            <span className={selectChevronWrapper}>
                <svg
                    className={selectChevronIcon}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.25 8.25a.75.75 0 011.1 1.02L10 15.148l2.7-2.909a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.55-1.26z"
                        clipRule="evenodd"
                    />
                </svg>
            </span>
        </div>
    );
}
