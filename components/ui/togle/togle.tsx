/* ----------------------------------------------  
   components/toggle/index.tsx
---------------------------------------------- */
"use client";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import {
  toggleTrack,
  toggleTrackFocus,
  toggleTrackChecked,
  toggleTrackUnchecked,
  toggleTrackDisabled,
  toggleThumb,
  toggleThumbChecked,
  toggleThumbUnchecked,
  toggleIconChecked,
  toggleIconUnchecked,
  toggleIconSize,
} from "./toggle.styles";

export interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** Útil para lectores de pantalla si no hay label visible */
  "aria-label"?: string;
}

export function Toggle({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  id,
  ...rest
}: ToggleProps) {
  /* cambia de estado al click o con barra espaciadora/Enter */
  const toggle = useCallback(() => {
    if (!disabled) onCheckedChange(!checked);
  }, [checked, disabled, onCheckedChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault(); // evita scroll con barra espaciadora
        toggle();
      }
    },
    [toggle]
  );

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={cn(
        toggleTrack,
        toggleTrackFocus,
        checked ? toggleTrackChecked : toggleTrackUnchecked,
        disabled && toggleTrackDisabled,
        className
      )}
      {...rest}
    >
      {/* thumb */}
      <span
        aria-hidden
        className={cn(
          toggleThumb,
          checked ? toggleThumbChecked : toggleThumbUnchecked
        )}
      >
        <CheckIcon
          className={cn(toggleIconSize, checked ? toggleIconChecked : toggleIconUnchecked)}
        />
      </span>
    </button>
  );
}
