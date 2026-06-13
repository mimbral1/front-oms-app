import { ButtonHTMLAttributes, FC } from "react";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { ActionButton } from "@/components/ui/button/action-button";

interface SaveAndNewButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Texto del botón (por defecto "Guardar & Crear nuevo") */
    label?: string;
}

/**
 * Botón "Guardar & Crear nuevo" pre-configurado con ícono SaveOutlined + FaPlus.
 *
 * @example
 * <SaveAndNewButton onClick={handleSaveAndNew} />
 */
export const SaveAndNewButton: FC<SaveAndNewButtonProps> = ({
    label = "Guardar & Crear nuevo",
    ...props
}) => {
    return (
        <ActionButton variant="success" {...props}>
            <div className="relative flex h-5 w-5 items-center justify-center">
                <SaveOutlined className="h-4 w-4 text-current" />
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                    <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                </div>
            </div>
            {label}
        </ActionButton>
    );
};
