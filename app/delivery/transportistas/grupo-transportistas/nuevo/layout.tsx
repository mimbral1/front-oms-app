"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CalendarDaysIcon } from "lucide-react";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/delivery/transportistas/grupo-transportistas/nuevo"
    >
      {children}
    </TabbedLayout>
  );
}
