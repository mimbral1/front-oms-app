import React from "react";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/ui/button/action-button";
import { DataFilters } from "@/components/ui/table/filters";
import {
  tableHeaderWrapper,
  tableHeaderTitle,
  tableHeaderDescription,
} from "./table.styles";

interface TableAction {
  label: string;
  variant?: "primary" | "secondary" | "success" | "danger";
  onClick: () => void;
  icon?: React.ReactNode;
}

interface TableHeaderProps {
  title: string;
  description?: string;
  filters?: React.ComponentProps<typeof DataFilters>["filters"];
  onFilterChange?: (id: string, value: string) => void;
  actions?: TableAction[];
  className?: string;
}

export function TableHeader({
  title,
  description,
  filters,
  onFilterChange,
  actions,
  className,
}: TableHeaderProps) {
  return (
    <div className={cn(tableHeaderWrapper, className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={tableHeaderTitle}>{title}</h1>
          {description && (
            <p className={tableHeaderDescription}>{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions.map((action, index) => (
              <ActionButton
                key={index}
                variant={action.variant}
                onClick={action.onClick}
                className="flex items-center gap-2"
              >
                {action.icon}
                {action.label}
              </ActionButton>
            ))}
          </div>
        )}
      </div>

      {filters && onFilterChange && (
        <DataFilters
          filters={filters}
          onChange={onFilterChange}
          className="grid-cols-4"
        />
      )}
    </div>
  );
}
