import { cn } from "@/lib/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  selectLabel,
  selectErrorText,
  selectSizeClasses,
  selectVariantClasses,
} from "./select.styles";

interface SelectProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  options: Array<{ value: string; label: string }>;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  /** callback simple que recibe SOLO el valor */
  onValueChange?: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  size?: keyof typeof selectSizeClasses;
  variant?: keyof typeof selectVariantClasses;
}

export default function Select({
  options,
  onChange,
  value,
  onValueChange,
  placeholder,
  label,
  error,
  size = "md",
  variant = "default",
  className,
  id,
  disabled,
  ...props
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const stringValue = String(value ?? "");
  const selected = useMemo(
    () => options.find((option) => option.value === stringValue),
    [options, stringValue]
  );
  const displayText = selected?.label || "";
  const visibleOptions = options;

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (highlight >= visibleOptions.length) setHighlight(0);
  }, [highlight, visibleOptions.length]);

  const emitChange = (nextValue: string) => {
    const syntheticEvent = {
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange?.(syntheticEvent);
    onValueChange?.(nextValue);
  };

  const selectOption = (nextValue: string) => {
    emitChange(nextValue);
    setOpen(false);
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className={selectLabel}>
          {label}
        </label>
      )}

      <div className="relative" ref={boxRef}>
        <div
          className={cn(
            "w-full rounded-lg border focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500",
            selectSizeClasses[size],
            selectVariantClasses[variant],
            disabled && "cursor-not-allowed bg-gray-100 text-gray-500",
            error && "border-red-500",
            className
          )}
        >
          <input
            id={id}
            type="text"
            readOnly
            disabled={disabled}
            value={displayText}
            placeholder={placeholder || "Seleccionar..."}
            onFocus={() => !disabled && setOpen(true)}
            onClick={() => !disabled && setOpen(true)}
            onKeyDown={(event) => {
              if (disabled) return;
              if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
                setOpen(true);
                return;
              }

              if (!visibleOptions.length) {
                if (event.key === "Escape") setOpen(false);
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlight((h) => (h + 1) % visibleOptions.length);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlight((h) => (h - 1 + visibleOptions.length) % visibleOptions.length);
              } else if (event.key === "Enter") {
                event.preventDefault();
                const option = visibleOptions[highlight];
                if (option) selectOption(option.value);
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            className="block w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
            {...props}
          />
        </div>

        {open && !disabled && visibleOptions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 text-sm shadow-xl">
            {visibleOptions.map((option, index) => (
              <li
                key={option.value}
                className={cn(
                  "cursor-pointer select-none rounded-lg px-3 py-2 transition-colors",
                  index === highlight
                    ? "bg-blue-50 text-gray-900"
                    : "text-gray-900 hover:bg-gray-50"
                )}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option.value);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="h-5 w-5 text-gray-400"
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

      {error && <p className={selectErrorText}>{error}</p>}
    </div>
  );
}
