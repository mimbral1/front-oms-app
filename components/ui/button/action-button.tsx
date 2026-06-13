import { ButtonHTMLAttributes, useState } from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { actionButtonVariants } from "./button.styles";

/* ── ring color per variant (full class strings for Tailwind JIT) ── */
const ringByVariant: Record<string, string> = {
  primary: "ring-2 ring-offset-1 ring-blue-400/50",
  secondary: "ring-2 ring-offset-1 ring-gray-400/40",
  success: "ring-2 ring-offset-1 ring-green-400/50",
  green: "ring-2 ring-offset-1 ring-green-400/50",
  warning: "ring-2 ring-offset-1 ring-yellow-400/50",
  gray: "ring-2 ring-offset-1 ring-gray-400/40",
  text: "ring-2 ring-offset-1 ring-gray-300/40",
  pick: "ring-2 ring-offset-1 ring-blue-400/50",
  error: "ring-2 ring-offset-1 ring-red-400/50",
  danger: "ring-2 ring-offset-1 ring-red-400/50",
};

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof actionButtonVariants> {
  children: React.ReactNode;
  /** Muestra un spinner y deshabilita el botón mientras loading=true */
  loading?: boolean;
}

const Spinner = () => (
  <svg
    className="h-4 w-4 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export function ActionButton({
  className,
  variant,
  size,
  children,
  loading,
  disabled,
  onClick,
  type,
  ...props
}: ActionButtonProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return;
    setAnimating(true);
    onClick(e);
    setTimeout(() => setAnimating(false), 350);
  };

  const ring = ringByVariant[variant ?? "primary"] ?? ringByVariant.primary;

  return (
    <button
      // Por defecto type="button" para evitar submit accidental cuando el
      // botón vive dentro de un <form>. Si el componente quiere comportarse
      // como submit explícito, pasa type="submit" en props.
      type={type ?? "button"}
      className={cn(
        actionButtonVariants({ variant, size, className }),
        animating && ring,
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
