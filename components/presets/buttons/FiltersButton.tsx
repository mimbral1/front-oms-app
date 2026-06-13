import { ButtonHTMLAttributes, FC } from "react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

interface FiltersButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Texto del botón (por defecto "Filtros"). Pasar "" para modo icon-only. */
    label?: string;
    /** Cantidad de filtros activos. Si > 0 muestra un badge numérico. */
    activeCount?: number;
}

/**
 * Botón "Filtros" pre-configurado con ícono FunnelIcon y badge opcional.
 *
 * @example
 * // Icon-only (sin texto)
 * <FiltersButton label="" onClick={toggleFilters} />
 *
 * // Con texto y badge de filtros activos
 * <FiltersButton activeCount={3} onClick={toggleFilters} />
 */
export const FiltersButton: FC<FiltersButtonProps> = ({
    label = "Filtros",
    activeCount = 0,
    ...props
}) => {
    return (
        <ActionButton variant="secondary" {...props}>
            <FunnelIcon className="h-5 w-5" />
            {label && <span>{label}</span>}
            {activeCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {activeCount}
                </span>
            )}
        </ActionButton>
    );
};
