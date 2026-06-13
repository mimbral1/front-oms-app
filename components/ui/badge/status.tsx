import React from "react";
import { cn } from "@/lib/utils";
import {
  statusBadgeBase,
  statusBadgeFixed,
  statusBadgeDefault,
  statusVariants,
} from "./badge.styles";

export type StatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending"
  | "processing"
  | "partial"
  | "review"
  | "dispatch"
  | "delivered"
  | "active"
  | "inactive"
  | "default";

interface StatusBadgeProps {
  status: string;
  variant: StatusVariant;
  className?: string;
  fixed?: boolean;
}

export function StatusBadge({ status, variant, className, fixed }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        statusBadgeBase,
        fixed ? statusBadgeFixed : statusBadgeDefault,
        statusVariants[variant],
        className
      )}
    >
      {status}
    </span>
  );
}
