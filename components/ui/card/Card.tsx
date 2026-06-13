"use client";

import React from "react";

type IconProp = React.ElementType | React.ReactNode | undefined;

export interface CardProps {
    /** Card heading text */
    title: string;
    /** Heroicon component reference or JSX element */
    icon?: IconProp;
    children?: React.ReactNode;
    className?: string;
    /** Show three-dot options button in the header */
    hasOptions?: boolean;
    /** Render a horizontal divider after the title */
    hasTitleDivider?: boolean;
    /** When true, only `className` is applied (no default styles) */
    noDefaultStyles?: boolean;
    /** Border color class (default: "border-gray-200") */
    borderClass?: string;
    /** Border radius class (default: "rounded-xl") */
    roundedClass?: string;
    /** Title font-size class (default: "text-lg") */
    titleClassName?: string;
    /** Optional custom action rendered in the header right side */
    headerAction?: React.ReactNode;
    /** Optional click handler for the full header row */
    onHeaderClick?: () => void;
    /** Optional expanded state for accessibility when header is clickable */
    headerExpanded?: boolean;
}

/**
 * Generic reusable card container.
 * Renders a titled section with optional icon, divider and options menu.
 */
const Card: React.FC<CardProps> = ({
    title,
    icon,
    children,
    className = "",
    hasOptions = false,
    hasTitleDivider = false,
    noDefaultStyles = false,
    borderClass = "border-gray-200",
    roundedClass = "rounded-xl",
    titleClassName = "text-lg",
    headerAction,
    onHeaderClick,
    headerExpanded,
}) => {
    const base = "bg-white shadow-sm p-6 hover:shadow-md transition-shadow";
    const merged = noDefaultStyles
        ? className
        : `${base} border ${borderClass} ${roundedClass} ${className}`;

    /* Resolve icon — accepts both JSX elements and component references */
    let iconElement: React.ReactNode = null;
    if (icon) {
        if (React.isValidElement(icon)) {
            iconElement = icon;
        } else {
            const IconComp = icon as React.ElementType;
            iconElement = <IconComp className="h-8 w-8 text-gray-500" />;
        }
    }

    return (
        <div className={merged}>
            {/* Header */}
            <div
                className={`flex items-center ${onHeaderClick ? "cursor-pointer select-none" : ""}`}
                onClick={onHeaderClick}
                role={onHeaderClick ? "button" : undefined}
                tabIndex={onHeaderClick ? 0 : undefined}
                aria-expanded={onHeaderClick ? headerExpanded : undefined}
                onKeyDown={
                    onHeaderClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onHeaderClick();
                            }
                        }
                        : undefined
                }
            >
                <div className="flex items-center gap-3">
                    {iconElement}
                    <h2 className={`${titleClassName} font-semibold text-gray-800`}>
                        {title}
                    </h2>
                </div>

                {hasTitleDivider && <div className="flex-1 h-px bg-gray-800 mx-4" />}

                {headerAction}

                {hasOptions && (
                    <button className="p-2 hover:bg-gray-100 rounded-full transition">
                        <svg
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            fill="none"
                            className="w-6 h-6 text-gray-400"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6h.01M12 12h.01M12 18h.01"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="mt-4 space-y-4">{children}</div>
        </div>
    );
};

export default Card;
