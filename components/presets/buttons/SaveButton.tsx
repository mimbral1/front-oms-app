import { ButtonHTMLAttributes, FC } from "react";
import { ArrowDownOnSquareIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

interface SaveButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Texto del botón (por defecto "Guardar") */
    label?: string;
}

/**
 * Botón "Guardar" pre-configurado con ícono ArrowDownOnSquareIcon.
 *
 * @example
 * <SaveButton onClick={handleSave} />
 * <SaveButton label="Guardar cambios" onClick={handleSave} />
 */
export const SaveButton: FC<SaveButtonProps> = ({
    label = "Guardar",
    ...props
}) => {
    return (
        <ActionButton variant="success" {...props}>
            <ArrowDownOnSquareIcon className="h-5 w-5" />
            {label}
        </ActionButton>
    );
};
