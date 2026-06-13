import { TrashIcon } from "@heroicons/react/24/outline";

export interface ClearFiltersButtonProps {
    /** Callback to clear all filters */
    onClick: () => void;
    /** Whether the button is disabled (no active filters) */
    disabled?: boolean;
    /** Optional custom label (default: "Limpiar") */
    label?: string;
    /** Optional custom class name */
    className?: string;
}

/**
 * Reusable button to clear all active filters.
 * Displays a trash icon with a red "Limpiar" label.
 * Disabled (dimmed) when no filters are active.
 */
export function ClearFiltersButton({
    onClick,
    disabled = false,
    label = "Limpiar",
    className = "",
}: ClearFiltersButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={label}
            className={`
        inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium
        transition-colors
        ${!disabled
                    ? "text-red-600 hover:bg-red-50 cursor-pointer"
                    : "text-gray-300 cursor-default"
                }
        ${className}
      `.trim()}
        >
            <TrashIcon className="h-4 w-4" />
            <span>{label}</span>
        </button>
    );
}

export default ClearFiltersButton;
