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
  { id: "fulfillment", label: "FULFILLMENT", icon: Package },
  { id: "express", label: "EXPRESS", icon: MopedOutlinedIcon },
  { id: "envio", label: "ENVIO", icon: TruckIcon },
  { id: "pickup", label: "PICKUP", icon: BuildingStorefrontIcon },
  { id: "retiro", label: "RETIRO", icon: Car },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/pedidos/configuraciones/dom"
      contentClassName="pt-[80px] px-6"
      defaultTab="fulfillment"
    >
      {children}
    </TabbedLayout>
  );
}
