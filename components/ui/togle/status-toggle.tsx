"use client";

import { cn } from "@/lib/utils";

interface ActiveStatusToggleProps {
    active: boolean;
    onActiveChange: (active: boolean) => void;
    disabled?: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
    showStateLabel?: boolean;
    className?: string;
}

export function ActiveStatusToggle({
    active,
    onActiveChange,
    disabled = false,
    activeLabel = "Activo",
    inactiveLabel = "Inactivo",
    showStateLabel = true,
    className,
}: ActiveStatusToggleProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label="Estado"
                disabled={disabled}
                onClick={() => !disabled && onActiveChange(!active)}
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2",
                    active ? "bg-blue-600 focus:ring-blue-600" : "bg-gray-300 focus:ring-gray-400",
                    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        active ? "translate-x-5" : "translate-x-0",
                    )}
                />
            </button>

            {showStateLabel && (
                <div className="flex items-center gap-1.5">
                    <span
                        className={cn(
                            "inline-block h-2.5 w-2.5 rounded-full",
                            active ? "bg-blue-600" : "bg-gray-400",
                        )}
                    />
                    <span className={cn("text-sm font-medium", active ? "text-blue-700" : "text-gray-500")}>
                        {active ? activeLabel : inactiveLabel}
                    </span>
                </div>
            )}
        </div>
    );
}
