// components/ui/tabs/Tabs.tsx
// Generic, reusable Tabs component unlinked from routing.

"use client";

import React from "react";
import {
    tabsContainer,
    tabButton,
    tabActive,
    tabInactive,
    tabDisabled,
    tabBadge,
} from "./tabs.styles";

export interface TabItem {
    /** Unique identifier for the tab */
    id: string;
    /** Display label */
    label: string;
    /** Optional icon component */
    icon?: React.ElementType;
    /** Whether the tab is disabled */
    disabled?: boolean;
    /** Optional count badge */
    badgeCount?: number;
}

export interface TabsProps {
    /** Array of tab definitions */
    tabs: TabItem[];
    /** Currently active tab id */
    value: string;
    /** Called when a tab is clicked */
    onChange: (tabId: string) => void;
    /** Additional CSS class for the container */
    className?: string;
}

/**
 * Generic Tabs component — controls only the tab bar.
 * Content rendering is handled by the consumer.
 */
export function Tabs({ tabs, value, onChange, className }: TabsProps) {
    return (
        <div className={`${tabsContainer} ${className ?? ""}`} role="tablist">
            {tabs.map((tab) => {
                const isActive = value === tab.id;
                const isDisabled = !!tab.disabled;

                return (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && onChange(tab.id)}
                        className={`${tabButton} ${isDisabled ? tabDisabled : isActive ? tabActive : tabInactive
                            }`}
                    >
                        {tab.icon && <tab.icon className="mr-1.5 h-4 w-4 inline-block" />}
                        {tab.label}
                        {tab.badgeCount != null && tab.badgeCount > 0 && (
                            <span className={tabBadge}>{tab.badgeCount}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
