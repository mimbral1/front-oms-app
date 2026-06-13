"use client";

import React from "react";

export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Heroicon component reference or JSX element */
    icon: React.ElementType | React.ReactNode;
    /** Accessible label for screen readers */
    label?: string;
    /** Visual size preset */
    size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<string, { button: string; icon: string }> = {
    sm: { button: "p-1", icon: "h-4 w-4" },
    md: { button: "p-2", icon: "h-5 w-5" },
    lg: { button: "p-3", icon: "h-6 w-6" },
};

/**
 * Reusable icon-only button with hover state and size variants.
 */
const IconButton: React.FC<IconButtonProps> = ({
    icon,
    label,
    size = "md",
    className = "",
    ...rest
}) => {
    const { button: btnCls, icon: iconCls } = sizeClasses[size];

    let iconElement: React.ReactNode;
    if (React.isValidElement(icon)) {
        iconElement = icon;
    } else {
        const IconComp = icon as React.ElementType;
        iconElement = <IconComp className={`${iconCls} text-current`} />;
    }

    return (
        <button
            type="button"
            aria-label={label}
            className={`inline-flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-600 ${btnCls} ${className}`}
            {...rest}
        >
            {iconElement}
        </button>
    );
};

export default IconButton;
