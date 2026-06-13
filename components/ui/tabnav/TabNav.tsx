"use client";

import React from "react";
import {
  tabNavContainer,
  tabNavInner,
  tabNavButtonBase,
  tabNavActive,
  tabNavInactive,
  tabNavDisabled,
  tabNavHover,
  tabNavIconSm,
  tabNavLabel,
} from "./tabnav.styles";

interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  disabled?: boolean;
  badgeCount?: number;
}

interface TabsNavProps {
  tabs: TabItem[];
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

export function TabsNav({ tabs, currentTab, onSelectTab }: TabsNavProps) {
  return (
    <div className={tabNavContainer}>
      <div className={tabNavInner}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => {
                if (tab.disabled) return;
                onSelectTab(tab.id);
              }}
              className={`${tabNavButtonBase}
    ${isActive ? tabNavActive : tabNavInactive}
    ${tab.disabled ? tabNavDisabled : tabNavHover}
  `}
            >
              {tab.icon && (
                <tab.icon className={tabNavIconSm} />
              )}
              <span className={tabNavLabel}>
                {tab.label}
              </span>
              {tab.badgeCount != null && tab.badgeCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold min-w-[20px] h-5 px-1.5">
                  {tab.badgeCount > 99 ? "99+" : tab.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
