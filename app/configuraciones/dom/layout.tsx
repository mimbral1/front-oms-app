"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import MopedOutlinedIcon from "@mui/icons-material/MopedOutlined";
import { Car, Package } from "lucide-react";

const TABS = [
  { id: "express", label: "EXPRESS", icon: MopedOutlinedIcon },
  { id: "envio", label: "ENVIO", icon: TruckIcon },
  { id: "pickup", label: "PICKUP", icon: BuildingStorefrontIcon },
  { id: "retiro", label: "RETIRO", icon: Car },
  { id: "fulfillment", label: "FULFILLMENT", icon: Package },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/configuraciones/dom"
      contentClassName="pt-[80px] px-6"
      defaultTab="express"
    >
      {children}
    </TabbedLayout>
  );
}
