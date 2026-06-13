import { ButtonHTMLAttributes, FC } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

interface ApplyButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Texto del botón (por defecto "Aplicar") */
    label?: string;
}

/**
 * Botón "Aplicar" pre-configurado con ícono CheckCircleIcon.
 *
 * @example
 * <ApplyButton onClick={handleApply} />
 * <ApplyButton label="Aplicar filtros" onClick={handleApply} />
 */
export const ApplyButton: FC<ApplyButtonProps> = ({
    label = "Aplicar",
    ...props
}) => {
    return (
        <ActionButton variant="success" {...props}>
            <CheckCircleIcon className="h-5 w-5" />
            {label}
        </ActionButton>
    );
};
