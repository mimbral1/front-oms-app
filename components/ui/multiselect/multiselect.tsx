// components/form/MultiSelect.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  multiSelectSummary,
  multiSelectSummaryReadOnly,
  multiSelectSummaryInteractive,
  multiSelectPlaceholder,
  multiSelectDropdown,
  multiSelectSearchInput,
  multiSelectNoResults,
  multiSelectCheckbox,
  multiSelectCheckboxChecked,
  multiSelectOptionButton,
  multiSelectChevron,
} from "./multiselect.styles";

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange?: (vals: string[]) => void;
  readOnly?: boolean;
  placeholder?: string;
  minWidth?: number;
  /** Nº de opciones a partir del cual aparece input de búsqueda */
  showSearchThreshold?: number;
}

export const MultiSelect = ({
  options,
  value,
  onChange,
  readOnly = false,
  placeholder = "—",
  minWidth = 180,
  showSearchThreshold = 8,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropUp, setDropUp] = useState(false); // abre arriba
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* Cerrar cuando se hace clic fuera ------------------------------------ */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      setOpen(false);
      setSearch("");
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  /* Al abrir calcula si hay espacio suficiente abajo ------------------- */
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const needed = Math.min(240, options.length * 32 + 16); // máx alto + paddings
    setDropUp(spaceBelow < needed && spaceAbove > spaceBelow);
  }, [open, options.length]);

  /* Gestión de selección ------------------------------------------------ */
  const toggle = (opt: string) => {
    if (readOnly) return;
    const exists = value.includes(opt);
    const next = exists ? value.filter((v) => v !== opt) : [...value, opt];
    onChange?.(next);
  };

  const selectedText = value.length ? value.join(", ") : placeholder;
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  type CSSVars = React.CSSProperties & { [key: `--${string}`]: string };

  const dropdownStyle = (): CSSVars => {
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();

    return {
      "--w": `${rect.width}px`,
      "--y": `${dropUp ? window.innerHeight - rect.top : rect.bottom}px`,
      right: `${rect.right}px`,
    };
  };

  /* ---------- Render ---------- */
  return (
    <div ref={ref} className="relative text-sm" style={{ minWidth }}>
      {/* -------- Summary button ---------- */}
      <button
        ref={buttonRef}
        disabled={readOnly}
        onClick={() => !readOnly && setOpen((o) => !o)}
        className={clsx(
          multiSelectSummary,
          readOnly ? multiSelectSummaryReadOnly : multiSelectSummaryInteractive
        )}
      >
        <span
          className={clsx(
            "truncate py-[2px] pr-2",
            !value.length && multiSelectPlaceholder
          )}
        >
          {selectedText}
        </span>
        {!readOnly &&
          (open ? (
            <ChevronUpIcon className={multiSelectChevron} />
          ) : (
            <ChevronDownIcon className={multiSelectChevron} />
          ))}
      </button>

      {/* -------- Dropdown en portal ---------- */}
      {open &&
        !readOnly &&
        createPortal(
          <ul
            className={clsx(
              multiSelectDropdown,
              dropUp ? "bottom-[var(--y)]" : "top-[var(--y)]"
            )}
            style={dropdownStyle()}
          >
            {/* Campo búsqueda opcional */}
            {options.length >= showSearchThreshold && (
              <li className="sticky top-0 bg-white px-3 py-1">
                <input
                  className={multiSelectSearchInput}
                  placeholder="Buscar…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </li>
            )}

            {filtered.length === 0 && (
              <li className={multiSelectNoResults}>
                Sin resultados
              </li>
            )}

            {filtered.map((opt) => {
              const checked = value.includes(opt);
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => toggle(opt)}
                    className={multiSelectOptionButton}
                  >
                    {/* Checkbox cuadrado */}
                    <span
                      className={clsx(
                        multiSelectCheckbox,
                        checked && multiSelectCheckboxChecked
                      )}
                    >
                      {checked && (
                        <svg
                          viewBox="0 0 20 20"
                          className="h-4 w-4 fill-none stroke-[3] stroke-white"
                        >
                          <polyline points="4.5 11 8 14.5 15.5 6" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body // portal al <body> para evitar overflow oculto
        )}
    </div>
  );
};
