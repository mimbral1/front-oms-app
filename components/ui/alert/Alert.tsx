// components/ui/alert/Alert.tsx
// Generic alert banner with variant support (info, success, warning, error).

"use client";

import React from "react";
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

/* ─── Variants ─── */

type AlertVariant = "info" | "success" | "warning" | "error";

const variantStyles: Record<AlertVariant, string> = {
    info: "bg-blue-50 border-blue-400 text-blue-800",
    success: "bg-green-50 border-green-400 text-green-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
    error: "bg-red-50 border-red-400 text-red-700",
};

const variantIcons: Record<AlertVariant, React.ElementType> = {
    info: InformationCircleIcon,
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XCircleIcon,
};

const variantIconColors: Record<AlertVariant, string> = {
    info: "text-blue-400",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
};

/* ─── Props ─── */

export interface AlertProps {
    /** Visual variant */
    variant?: AlertVariant;
    /** Bold title (optional) */
    title?: string;
    /** Body message */
    children: React.ReactNode;
    /** Action element (e.g. a retry button) */
    action?: React.ReactNode;
    /** Extra CSS classes */
    className?: string;
}

/* ─── Component ─── */

export function Alert({
    variant = "info",
    title,
    children,
    action,
    className = "",
}: AlertProps) {
    const Icon = variantIcons[variant];

    return (
        <div
            role="alert"
            className={`border-l-4 rounded-md p-4 shadow-sm ${variantStyles[variant]} ${className}`}
        >
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${variantIconColors[variant]}`} aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1">
                    {title && <h3 className="text-sm font-medium">{title}</h3>}
                    <div className={`text-sm ${title ? "mt-1" : ""}`}>{children}</div>
                    {action && <div className="mt-3">{action}</div>}
                </div>
            </div>
        </div>
    );
}
