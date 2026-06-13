"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={[]}
      basePath="/delivery/transportistas/slots/nuevo"
      hideTabsWithoutId
      contentClassName="pt-[100px] px-5"
    >
      {children}
    </TabbedLayout>
  );
}
