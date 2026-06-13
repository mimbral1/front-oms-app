import { ButtonHTMLAttributes, FC } from "react";
import { cn } from "@/lib/utils";
import { primarySpinner, primaryIcon } from "./button.styles";
import { ActionButton } from "./action-button";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ForwardRefExoticComponent<any>;
  isLoading?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary";
}

const variantMap: Record<NonNullable<PrimaryButtonProps["variant"]>, "primary" | "error" | "secondary"> = {
  default: "primary",
  destructive: "error",
  outline: "secondary",
  secondary: "secondary",
};

export const PrimaryButton: FC<PrimaryButtonProps> = ({
  children,
  className,
  disabled,
  icon: Icon,
  isLoading,
  variant = "default",
  ...props
}) => {
  return (
    <ActionButton
      variant={variantMap[variant]}
      className={cn(className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className={primarySpinner}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className={primaryIcon} />
      ) : null}
      {children}
    </ActionButton>
  );
};
