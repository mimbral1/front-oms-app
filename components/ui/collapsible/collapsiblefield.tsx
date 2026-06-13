// components\collapsible\collapsiblefield.tsx
import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
  collapsibleInlineWrapper,
  collapsibleValue,
  collapsibleIcon,
  collapsibleDropdown,
  collapsibleOption,
  collapsibleLabel,
  collapsibleIconDefault,
  collapsibleValueBlock,
} from "./collapsible.styles";

type CollapsibleOption = string | { label: string; value: string };

interface CollapsibleFieldProps {
  label: string;
  value: string;
  options: CollapsibleOption[];
  onChange: (newValue: string) => void;
  inline?: boolean;
}

export function CollapsibleField({
  label,
  value,
  options,
  onChange,
  inline = false,
}: CollapsibleFieldProps) {
  const [open, setOpen] = useState(false);

  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option
  );
  const selectedOption =
    normalizedOptions.find((option) => option.value === value) ?? null;
  const displayValue = selectedOption?.label ?? value;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  if (inline) {
    return (
      // utilizar si los elemeentos del select se transparentan 
      <div className={`relative ${open ? "" : "border-b border-gray-400"} pb-[2px]`}>
        {/* <div className="relative border-b border-gray-400 pb-[2px]"> */}
        {/* Fila principal */}
        <div
          className={collapsibleInlineWrapper}
          onClick={() => setOpen((o) => !o)}
        >
          {/* Etiqueta (ancho fijo) */}
          {/* <span className="w-40 shrink-0 text-sm text-gray-600">{label}</span> */}

          {/* Valor (crece y trunca) */}
          <span className={collapsibleValue}>
            {displayValue}
          </span>

          {/* Flecha */}
          {open ? (
            <ChevronUpIcon className={collapsibleIcon} />
          ) : (
            <ChevronDownIcon className={collapsibleIcon} />
          )}
        </div>

        {/* Menú desplegable */}
        {
          open && (
            <div className={collapsibleDropdown}>
              {normalizedOptions.map((option, index) => (
                <button
                  key={`${option.value}-${index}`}
                  onClick={() => handleSelect(option.value)}
                  className={collapsibleOption}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )
        }
      </div >
    );
  }

  return (
    <div className="relative flex flex-col border-b border-gray-300 pb-[2px]">
      <div
        className="flex items-center justify-between w-full cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={collapsibleLabel}>{label}</span>
        {open ? (
          <ChevronUpIcon className={collapsibleIconDefault} />
        ) : (
          <ChevronDownIcon className={collapsibleIconDefault} />
        )}
      </div>

      <div className={collapsibleValueBlock}>
        {displayValue}
      </div>

      {open && (
        <div className={collapsibleDropdown}>
          {normalizedOptions.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              onClick={() => handleSelect(option.value)}
              className={collapsibleOption}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
