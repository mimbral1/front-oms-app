// components/ui/Loader.tsx
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { loaderContainer } from "./loader.styles";

interface LoaderProps {
  label?: string;
  /** Altura / anchura del ícono (sin prefijo h- / w-). Ej.: "10", "14" */
  size?: string;
  /** Tamaño del texto Tailwind: "xs" | "sm" | "base" | "lg" | … */
  labelSize?: string;
  className?: string;
}

export function Loader({
  label = "Cargando…",
  size = "12", // 12 -> 3rem (48 px)
  labelSize = "sm", // sm -> text-sm
  className,
}: LoaderProps) {
  return (
    <div
      className={clsx(
        loaderContainer,
        className
      )}
    >
      <ArrowPathIcon className={`h-${size} w-${size} animate-spin `} />
      <span className={`text-${labelSize}`}>{label}</span>
    </div>
  );
}
