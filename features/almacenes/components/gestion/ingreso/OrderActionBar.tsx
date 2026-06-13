import React from "react";
import type { Action } from "@/components/layout/page-header";
import { ActionButton } from "@/components/ui/button/action-button";

interface Props {
  actions: Action[];
}
export const OrderActionBar: React.FC<Props> = ({ actions }) => (
  <div className="bg-page-bg px-6 mt-0 justify-end py-2 flex space-x-3">
    {actions.map((a, i) => (
      <ActionButton
        key={i}
        onClick={a.onClick}
        disabled={a.disabled}
        variant={a.variant || "primary"}
        size="sm"
      >
        {a.icon}
        <span className="ml-2">{a.label}</span>
      </ActionButton>
    ))}
  </div>
);
