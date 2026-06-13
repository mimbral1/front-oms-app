"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/cuenta/webhooks/nuevo"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
