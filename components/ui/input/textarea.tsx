import { cn } from "@/lib/utils";
import React from "react";
import {
  textareaBase,
  textareaFocus,
  inputError,
  inputLabel,
  inputErrorText,
} from "./input.styles";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className={inputLabel}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          textareaBase,
          textareaFocus,
          error && inputError,
          className
        )}
        {...props}
      />
      {error && <p className={inputErrorText}>{error}</p>}
    </div>
  );
}
