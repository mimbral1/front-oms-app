// components/ui/toolbar/Toolbar.tsx
// Generic reusable toolbar — renders a horizontal bar with start and end slots.

"use client";

import React from "react";

export interface ToolbarProps {
    /** Content aligned to the start (left) */
    children: React.ReactNode;
    /** Content aligned to the end (right) */
    actions?: React.ReactNode;
    /** Additional CSS class */
    className?: string;
}

/**
 * Horizontal toolbar bar with two slots: main content (left) and actions (right).
 * Use for page-level or section-level action bars.
 */
export function Toolbar({ children, actions, className }: ToolbarProps) {
    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-3 ${className ?? ""}`}
        >
            <div className="flex flex-wrap items-center gap-2">{children}</div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
        </div>
    );
}
