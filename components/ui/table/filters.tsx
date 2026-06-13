import React from "react";
import { cn } from "@/lib/utils";
import Select from "@/components/ui/select";
import { filtersContainer, filterInput } from "./table.styles";

type FilterType = "text" | "select" | "date" | "datetime";

interface FilterOption {
  label: string;
  value: string;
}

interface Filter {
  id: string;
  label: string;
  type: FilterType;
  value: string;
  options?: FilterOption[];
  placeholder?: string;
}

interface DataFiltersProps {
  filters: Filter[];
  onChange: (id: string, value: string) => void;
  className?: string;
}

export function DataFilters({
  filters,
  onChange,
  className,
}: DataFiltersProps) {
  const renderFilter = (filter: Filter) => {
    switch (filter.type) {
      case "select":
        return (
          <Select
            value={filter.value}
            onChange={(e) => onChange(filter.id, e.target.value)}
            options={filter.options || []}
            placeholder={filter.placeholder || filter.label}
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={filter.value}
            onChange={(e) => onChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || filter.label}
            className={filterInput}
          />
        );
      case "datetime":
        return (
          <input
            type="datetime-local"
            value={filter.value}
            onChange={(e) => onChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || filter.label}
            className={filterInput}
          />
        );
      default:
        return (
          <input
            type="text"
            value={filter.value}
            onChange={(e) => onChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || filter.label}
            className={filterInput}
          />
        );
    }
  };

  return (
    <div className={cn(filtersContainer, className)}>
      {filters.map((filter) => (
        <div key={filter.id}>{renderFilter(filter)}</div>
      ))}
    </div>
  );
}
