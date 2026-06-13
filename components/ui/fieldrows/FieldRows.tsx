import clsx from "clsx";
import {
  fieldRowGrid,
  fieldRowWithLabel,
  fieldRowNoLabel,
  fieldRowLabel,
} from "./fieldrows.styles";

export interface FieldRowProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export const FieldRows: React.FC<FieldRowProps> = ({
  label,
  children,
  className = "",
}) => (
  <div
    className={clsx(
      fieldRowGrid,
      label ? fieldRowWithLabel : fieldRowNoLabel
    )}
  >
    {label && <span className={fieldRowLabel}>{label}</span>}
    <div className={clsx("w-full", className)}>{children}</div>
  </div>
);
