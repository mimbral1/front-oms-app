import { cn } from "@/lib/utils";
import {
  generalBadgeBase,
  generalStatusVariants,
  generalBadgeFallback,
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
  | "Active"
  | "Inactive"
  | "Activo"
  | "Inactivo";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  customVariants?: Partial<Record<string, string>>;
  className?: string;
}

export function GeneralStatusBadge({
  status,
  variant,
  customVariants,
  className,
}: StatusBadgeProps) {
  const key = (variant ?? status) as StatusVariant;
  const variantClasses =
    { ...generalStatusVariants, ...customVariants }[key] ?? generalBadgeFallback;

  return (
    <span
      className={cn(
        generalBadgeBase,
        variantClasses,
        className
      )}
    >
      {status}
    </span>
  );
}
