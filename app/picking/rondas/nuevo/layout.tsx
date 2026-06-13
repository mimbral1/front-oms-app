"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
];

export default function RondasNuevoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TabbedLayout tabs={TABS} basePath="/picking/rondas">
      {children}
    </TabbedLayout>
  );
}
