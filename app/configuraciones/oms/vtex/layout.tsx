"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
    Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import MopedOutlinedIcon from "@mui/icons-material/MopedOutlined";

const TABS = [
    { id: "pedidos", label: "PEDIDOS", icon: DocumentTextIcon },
    { id: "vtex", label: "VTEX", icon: Cog6ToothIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/pedidos/configuraciones/perfiles-fulfillment"
      defaultTab="pedidos"
    >
      {children}
    </TabbedLayout>
  );
}
