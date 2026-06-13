// components\layout\page-header.tsx

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { BarcodeIcon } from "lucide-react";
import { MultiSelectSearchInline } from "../ui/collapsible/multiSelectSearchInline";
import { StatusBadge, type StatusVariant } from "@/components/ui/badge/status";
import { ActionButton } from "@/components/ui/button/action-button";
import { DateRangeFilter } from "@/components/ui/date-range-picker";
import { SingleDateFilter } from "@/components/ui/single-date-filter/SingleDateFilter";
import Select from "@/components/ui/select";

export interface Action {
  label: string | React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "green" | "text" | "gray" | "error" | "pick";
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

// --- Definición de tipos de filtros mejorada ---

// Ahora incluye 'code' opcional para las opciones.
export interface FilterOptionItem {
  label: string;
  value: string;
  code?: string;
}

// Interfaz base para todas las opciones de filtro
interface BaseFilterOption {
  id: string;
  label: string | React.ReactNode;
  value: string;
  colSpan?: string;
  placeholder?: string;
}

// Filtro de tipo "text"
interface TextFilterOption extends BaseFilterOption {
  type: "text";
  options?: never;
  onSearch?: never;
  searchQuery?: never;
}

interface SelectFilterOption extends BaseFilterOption {
  type: "select";
  options: FilterOptionItem[];
  onSearch?: never;
  searchQuery?: never;
}

// Filtro de tipo "datetime"
interface DatetimeFilterOption extends BaseFilterOption {
  type: "datetime";
  options?: never;
  onSearch?: never;
  searchQuery?: never;
  dateOnly?: boolean;
}

interface SelectSearchFilterOption extends BaseFilterOption {
  type: "select-search";
  options: FilterOptionItem[];
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

// Filtro de tipo multi select search 
interface MultiSelectSearchFilterOption extends BaseFilterOption {
  type: "multi-select-search";
  options: FilterOptionItem[];
  values: string[]; // array
  onSearch?: (query: string) => void;
  searchQuery?: string;
  compact?: boolean;
  size?: "sm" | "md";
}

// Filtro de rango de fechas estilo Google Flights
interface DateRangeFilterOption extends BaseFilterOption {
  type: "date-range";
  options?: never;
  onSearch?: never;
  searchQuery?: never;
}

interface SingleDateFilterOption extends BaseFilterOption {
  type: "single-date";
  options?: never;
  onSearch?: never;
  searchQuery?: never;
}


// Añadido SelectSearchFilterOption a la unión
type FilterOption =
  | TextFilterOption
  | SelectFilterOption
  | DatetimeFilterOption
  | SelectSearchFilterOption
  | MultiSelectSearchFilterOption
  | DateRangeFilterOption
  | SingleDateFilterOption;

// --- Fin de definición de tipos de filtros ---

export interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string | ReactNode;
  action?: ReactNode | Action[];
  status?: {
    text: string;
    variant: StatusVariant;
  };
  // Badge adicional opcional (por ejemplo mensajes de EM)
  messageBadge?: ReactNode;
  tabs?: {
    id: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  filters?: FilterOption[];
  onFilterChange?: (id: string, value: string) => void;
  onMoreOptions?: () => void;
  filterTitle?: boolean;

  /** header siempre fijo */
  sticky?: boolean;           // deja el header “pegado”
  stickyTop?: number | string; // offset desde arriba, por defecto 0
  translucent?: boolean;      // aplica bg semi/transparente + blur
  className?: string;         // opcional: clases extra en el contenedor raíz

  /** renderiza contenido pegado a la derecha del bloque de filtros (ej: botón de filtros avanzados) */
  filtersRight?: ReactNode;

  /** clases extra para personalizar el grid de filtros */
  filtersGridClassName?: string;

  /** estilo visual de filtros */
  filtersAppearance?: "default" | "minimal";
}

export function PageHeader({
  title,
  description,
  action,
  status,
  messageBadge,
  tabs,
  activeTab,
  onTabChange,
  filters,
  onFilterChange,
  onMoreOptions,
  filterTitle = false,

  // header fijo
  sticky = false,
  stickyTop = 0,
  translucent = false,
  className,
  filtersRight,
  filtersGridClassName,
  filtersAppearance = "default",
}: PageHeaderProps) {
  const isMinimalFilters = filtersAppearance === "minimal";
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const getScrollParent = (element: HTMLElement | null): HTMLElement | Window => {
      let current = element?.parentElement ?? null;

      while (current) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
          return current;
        }
        current = current.parentElement;
      }

      return window;
    };

    const scrollParent = getScrollParent(root);

    const updateScrolledState = () => {
      const hasScroll = scrollParent === window
        ? window.scrollY > 0
        : (scrollParent as HTMLElement).scrollTop > 0;
      setIsScrolled(hasScroll);
    };

    updateScrolledState();
    scrollParent.addEventListener("scroll", updateScrolledState, { passive: true });

    return () => {
      scrollParent.removeEventListener("scroll", updateScrolledState);
    };
  }, []);

  const showTranslucentHeader = translucent || (sticky && isScrolled);

  const renderActions = () => {
    if (!action) return null;
    if (!Array.isArray(action)) return action;

    return (
      <div className="flex items-center gap-3">
        {action.map((act, index) => {
          return (
            <ActionButton
              key={index}
              onClick={act.onClick}
              disabled={act.disabled}
              variant={act.variant || "primary"}
            >
              {act.icon}
              {act.label}
            </ActionButton>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex max-w-full flex-col overflow-x-visible transition-colors duration-200",
        showTranslucentHeader
          ? "bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/65"
          : "bg-white",
        sticky && "sticky z-40", // se pega al top del scroller
        className
      )}
      style={sticky ? { top: typeof stickyTop === "number" ? stickyTop : stickyTop } : undefined}
    >
      {/* Encabezado principal */}
      <div
        className={cn(
          "flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6",
          !filters && "border-b border-gray-200"
        )}
      >
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {status && (
              <StatusBadge status={status.text} variant={status.variant} />
            )}

            {/* Badge extra opcional (por ejemplo mensajes de EM) */}
            {messageBadge}
          </div>

          {description && (
            typeof description === "string" ? (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            ) : (
              <div className="mt-1 text-sm text-gray-500">
                {description}
              </div>
            )
          )}
        </div>
        {/* Acciones y botón de 3 puntos */}
        <div className="flex flex-wrap items-center gap-3">
          {renderActions()}
          {onMoreOptions && (
            <button
              onClick={onMoreOptions}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <EllipsisHorizontalIcon className="h-6 w-6 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs opcionales */}
      {tabs && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab, index) => (
              <button
                // key={tab.id}
                key={tab.id ?? `tab-${index}`} // correccion error id unico
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Filtros + accesorio a la derecha */}
      {filters && (
        <div className="relative">
          {/* grid de filtros */}
          <div
            className={cn(
              "grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:pr-20",
              isMinimalFilters && "gap-3 py-2",
              filtersGridClassName,
            )}
          >
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={cn(
                  "flex flex-col",
                  isMinimalFilters && filter.type === "date-range" && "relative",
                  filter.colSpan ?? "" // si no existe, no agrega nada
                )}
              >
                {!filterTitle && isMinimalFilters && filter.type === "date-range" && !!filter.value && (
                  <label className="pointer-events-none absolute -top-3 left-0 text-[11px] font-medium leading-none text-blue-600">
                    {typeof filter.label === "string" ? filter.label : "Fecha de entrega"}
                  </label>
                )}
                {filterTitle && (
                  <label htmlFor={filter.id} className="mb-1 text-xs font-medium text-gray-700">
                    {filter.label}
                  </label>
                )}
                {filter.type === "select" && filter.options ? (
                  isMinimalFilters ? (
                    <select
                      id={filter.id}
                      value={filter.value}
                      onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                      className="w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-0"
                    >
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Select
                      id={filter.id}
                      options={filter.options.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      value={filter.value}
                      onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                      className="w-full"
                    />
                  )
                ) : filter.type === "datetime" ? (
                  <input
                    type={filter.dateOnly ? "date" : "datetime-local"}
                    className={cn(
                      "w-full text-sm",
                      isMinimalFilters
                        ? "border-0 border-b border-gray-300 bg-transparent px-0 py-1.5 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-0"
                        : "rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    )}
                    value={filter.value}
                    onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                  />
                ) : filter.type === "text" ? (
                  <div className="relative">
                    {filter.id === "barcode" && (
                      <BarcodeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    )}
                    <input
                      type="text"
                      placeholder={filter.placeholder ?? (typeof filter.label === "string" ? filter.label : String(filter.id))}
                      className={cn(
                        "w-full text-sm",
                        isMinimalFilters
                          ? "border-0 border-b border-gray-300 bg-transparent py-1.5 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-0"
                          : "rounded-lg border border-gray-300 py-2 focus:border-indigo-500 focus:ring-indigo-500",
                        filter.id === "barcode"
                          ? isMinimalFilters
                            ? "pl-7 pr-1"
                            : "pl-10 pr-4"
                          : isMinimalFilters
                            ? "px-0"
                            : "px-4"
                      )}
                      value={filter.value}
                      onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                    />
                  </div>
                ) : filter.type === "select-search" && filter.options ? (
                  <SelectSearchWhite
                    filter={filter}
                    onFilterChange={onFilterChange}
                  />
                ) : filter.type === "multi-select-search" ? (
                  <MultiSelectSearchInline
                    id={filter.id}
                    label={typeof filter.label === "string" ? filter.label : String(filter.id)}
                    values={(filter as any).values || []}
                    options={filter.options || []}
                    searchQuery={(filter as any).searchQuery || ""}
                    onSearch={(filter as any).onSearch}
                    compact={Boolean((filter as any).compact)}
                    size={(filter as any).size || "md"}
                    onChange={(vals) => {
                      onFilterChange?.(filter.id, vals.join(","));
                    }}
                  />
                ) : filter.type === "single-date" ? (
                  <SingleDateFilter
                    label={typeof filter.label === "string" ? filter.label : "Fecha"}
                    value={filter.value || null}
                    onChange={(date) => {
                      onFilterChange?.(filter.id, date ?? "");
                    }}
                  />
                ) : filter.type === "date-range" ? (
                  <DateRangeFilter
                    label={typeof filter.label === "string" ? filter.label : "Rango de fechas"}
                    value={filter.value ? (() => { try { return JSON.parse(filter.value); } catch { return null; } })() : null}
                    appearance={isMinimalFilters ? "minimal" : "default"}
                    onChange={(range) => {
                      onFilterChange?.(filter.id, range ? JSON.stringify(range) : "");
                    }}
                  />
                ) : null
                }
              </div>
            ))}
          </div>

          {/* 🔹 accesorio a la derecha del bloque de filtros (visible con sticky) */}
          {filtersRight && (
            <div className="pointer-events-auto absolute right-6 top-4 flex items-start">
              {filtersRight}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectSearchWhite({
  filter,
  onFilterChange,
}: {
  filter: {
    id: string;
    label: string | React.ReactNode;
    value: string;
    options: { label: string; value: string; code?: string }[];
    onSearch?: (q: string) => void;
    searchQuery?: string;
  };
  onFilterChange?: (id: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [input, setInput] = useState("");
  const isNonTypingSelect = filter.id === "pickingPoint";

  const boxRef = useRef<HTMLDivElement | null>(null);

  // Cerrar al click fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Placeholder dinámico:
  // - si hay opción con value === "", usamos su label (p.ej. "Todas las categorías")
  // - si no existe, caemos a "Buscar <label>..."
  const defaultOptionLabel =
    filter.options.find((o) => o.value === "")?.label || "";

  const baseLabel =
    typeof filter.label === "string" ? filter.label.toLowerCase() : "opciones";

  const buildPlaceholder = () => {
    // Si no hay búsqueda y value === "", mostramos el label de la opción por defecto como placeholder
    if (!filter.searchQuery && filter.value === "" && defaultOptionLabel) {
      return defaultOptionLabel;
    }
    // En cualquier otro caso, placeholder de búsqueda estándar
    return `Buscar ${baseLabel}...`;
  };

  // Sincroniza lo visible:
  // 1) Si hay búsqueda activa, muestra lo escrito
  // 2) Si NO hay búsqueda:
  //    - Si hay una selección (value !== ""), muestra el label seleccionado
  //    - Si NO hay selección (value === ""), deja input = "" para que se vea el placeholder
  useEffect(() => {
    const hasSearch =
      typeof filter.searchQuery === "string" && filter.searchQuery.trim() !== "";
    if (hasSearch) {
      setInput(filter.searchQuery as string);
      return;
    }
    if (filter.value !== "") {
      const selectedLabel =
        filter.options.find((o) => o.value === filter.value)?.label || "";
      setInput(selectedLabel);
    } else {
      setInput(""); // deja que el placeholder muestre "Todas las …"
    }
  }, [filter.searchQuery, filter.value, filter.options]);

  // Filtrado local adicional (además del remoto vía onSearch)
  const selectedLabel =
    filter.value !== ""
      ? (filter.options.find((o) => o.value === filter.value)?.label || "")
      : "";

  // If there is a selected value and the input is showing that selected label,
  // keep the full list available so the user can replace it directly.
  const q =
    filter.value !== "" && input === selectedLabel
      ? ""
      : (input || "").trim().toLowerCase();
  const localOptions =
    (filter.options || []).filter((o) =>
      (o.label + " " + o.value).toLowerCase().includes(q)
    );

  useEffect(() => {
    if (highlight >= localOptions.length) setHighlight(0);
  }, [localOptions.length, highlight]);

  const selectOption = (opt: { value: string; label: string }) => {
    onFilterChange?.(filter.id, opt.value);
    filter.onSearch?.(""); // limpia búsqueda
    setInput(opt.value === "" ? "" : opt.label); // si seleccionan "Todas …", dejamos vacío para ver placeholder
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <div className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
        <input
          id={`${filter.id}-search`}
          type="text"
          autoComplete="off"
          value={input}
          readOnly={isNonTypingSelect}
          onFocus={() => {
            if (filter.value !== "") {
              filter.onSearch?.("");
            }
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (isNonTypingSelect) return;
            const v = e.target.value;
            setInput(v);
            filter.onSearch?.(v); // remote fetch con tu debounce
            // Si había selección y ahora escriben, soltamos la selección
            if (filter.value !== "" && v !== "") {
              onFilterChange?.(filter.id, "");
            }
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
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => (h - 1 + localOptions.length) % localOptions.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              const opt = localOptions[highlight];
              if (opt) selectOption(opt);
              else setOpen(false);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="block w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
          placeholder={isNonTypingSelect ? "Seleccionar..." : buildPlaceholder()}
        />
      </div>

      {/* Dropdown blanco */}
      {open && localOptions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 text-sm shadow-xl">
          {localOptions.map((opt, idx) => (
            <li
              key={opt.code || opt.value}
              className={`cursor-pointer select-none rounded-lg px-3 py-2 transition-colors ${idx === highlight
                ? "bg-blue-50 text-gray-900"
                : "text-gray-900 hover:bg-gray-50"
                }`}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => {
                e.preventDefault(); // evita blur
                selectOption(opt);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}

      {/* Flecha decorativa */}
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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

function MultiSelectSearchWhite({
  filter,
  onFilterChange,
}: {
  filter: {
    id: string;
    label: string | React.ReactNode;
    value?: string;               // string serializado
    values: string[];             // array real
    options: { label: string; value: string; code?: string }[];
    onSearch?: (q: string) => void;
    searchQuery?: string;
  };
  onFilterChange?: (id: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const addOption = (opt: { value: string }) => {
    if (filter.values.includes(opt.value)) return;

    const newValues = [...filter.values, opt.value];
    onFilterChange?.(filter.id, newValues.join(","));
    setInput("");
    setOpen(false);
  };

  const removeOption = (value: string) => {
    const newValues = filter.values.filter((v) => v !== value);
    onFilterChange?.(filter.id, newValues.join(","));
  };

  const q = input.trim().toLowerCase();

  const filtered =
    filter.options?.filter((o) =>
      (o.label + " " + o.value).toLowerCase().includes(q)
    ) ?? [];

  return (
    <div className="relative" ref={boxRef}>
      <div className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
        <input
          type="text"
          value={input}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const v = e.target.value;
            setInput(v);
            filter.onSearch?.(v);
            setOpen(true);
          }}
          placeholder="Buscar..."
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {filtered.map((opt) => (
            <li
              key={opt.value}
              className="cursor-pointer px-3 py-2 hover:bg-gray-100"
              onMouseDown={(e) => {
                e.preventDefault();
                addOption(opt);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}

      {/* Burbujas flotantes */}
      {filter.values.length > 0 && (
        <div className="absolute left-0 top-full mt-2 flex flex-wrap gap-2 bg-white p-2 rounded-md shadow-md border border-gray-200 z-40">
          {filter.values.map((v) => (
            <div
              key={v}
              className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full"
            >
              {filter.options.find((o) => o.value === v)?.label || v}
              <button
                onClick={() => removeOption(v)}
                className="text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

