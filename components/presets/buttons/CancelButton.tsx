import { ButtonHTMLAttributes, FC } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

interface CancelButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Texto del botón (por defecto "Cancelar") */
    label?: string;
}

/**
 * Botón "Cancelar" pre-configurado con ícono XMarkIcon.
 *
 * @example
 * <CancelButton onClick={handleCancel} />
 * <CancelButton label="Descartar" onClick={handleCancel} />
 */
export const CancelButton: FC<CancelButtonProps> = ({
    label = "Cancelar",
    ...props
}) => {
    return (
        <ActionButton variant="secondary" {...props}>
            <XMarkIcon className="h-5 w-5" />
            {label}
        </ActionButton>
    );
};
