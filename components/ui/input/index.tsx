import { cn } from "@/lib/utils";
import React from "react";
import {
  inputBase,
  inputFocus,
  inputWithIcon,
  inputWithoutIcon,
  inputPaddingY,
  inputError,
  inputLabel,
  inputErrorText,
  inputIconWrapper,
} from "./input.styles";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  className,
  id,
  icon,
  ...props
}: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className={inputLabel}>
          {label}
        </label>
      )}
      <div className="relative mt-1">
        {icon && (
          <div className={inputIconWrapper}>
            {icon}
          </div>
        )}
        <input
          id={id}
          className={cn(
            inputBase,
            inputFocus,
            icon ? inputWithIcon : inputWithoutIcon,
            inputPaddingY,
            error && inputError,
            className
          )}
          {...props}
        />
      </div>
      {error && <p className={inputErrorText}>{error}</p>}
    </div>
  );
}
