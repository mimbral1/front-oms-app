"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
    ShoppingCartIcon,
    GlobeAltIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "PRINCIPAL", icon: DocumentTextIcon },
    { id: "pedidos", label: "PEDIDOS", icon: ShoppingCartIcon },
    { id: "session-browse", label: "SESSION BROWSE", icon: GlobeAltIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function OlaDetailLayout({ children }: { children: React.ReactNode }) {
    return (
        <TabbedLayout tabs={TABS} basePath="/picking/olas">
            {children}
        </TabbedLayout>
    );
}
