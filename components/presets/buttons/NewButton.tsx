import { ButtonHTMLAttributes, FC } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

interface NewButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Texto del botón (por defecto "Nuevo") */
    label?: string;
}

/**
 * Botón verde "Nuevo" pre-configurado con ícono PlusIcon.
 *
 * @example
 * <NewButton onClick={() => router.push("/ruta/nuevo")} />
 * <NewButton label="Nuevo Pedido" onClick={handleNew} />
 */
export const NewButton: FC<NewButtonProps> = ({
    label = "Nuevo",
    ...props
}) => {
    return (
        <ActionButton variant="success" {...props}>
            <PlusIcon className="h-5 w-5" />
            {label}
        </ActionButton>
    );
};
