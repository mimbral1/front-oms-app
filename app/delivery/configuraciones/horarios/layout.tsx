"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    ClockIcon,
    TruckIcon,
} from "@heroicons/react/24/outline";
import MopedIcon from "@mui/icons-material/Moped";
import MopedOutlinedIcon from "@mui/icons-material/MopedOutlined";
import { Car, GridIcon, PackageCheckIcon } from "lucide-react";

const TABS = [
    { id: "horarios", label: "HORARIOS", icon: ClockIcon },
    { id: "enviosimple", label: "ENVÍO SIMPLE", icon: TruckIcon },
    { id: "pickup", label: "PICKUP", icon: PackageCheckIcon },
    { id: "app", label: "APP", icon: GridIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/delivery/configuraciones/horarios"
      contentClassName="pt-[80px] px-6"
      defaultTab="horarios"
    >
      {children}
    </TabbedLayout>
  );
}
