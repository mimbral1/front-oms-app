"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "SUMMARY", icon: DocumentTextIcon },
    { id: "comentarios", label: "COMMENTS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <TabbedLayout
            tabs={TABS}
            basePath="/catalogo/grupo-atributos"
            contentClassName="pt-[150px]"
        >
            {children}
        </TabbedLayout>
    );
}
