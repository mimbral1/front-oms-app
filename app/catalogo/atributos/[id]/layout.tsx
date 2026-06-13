"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
    GlobeAltIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "plataformas", label: "PLATAFORMAS", icon: GlobeAltIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <TabbedLayout
            tabs={TABS}
            basePath="/catalogo/atributos"
            contentClassName="pt-[150px]"
        >
            {children}
        </TabbedLayout>
    );
}
