"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout";
import { ChatBubbleLeftRightIcon, DocumentTextIcon, NumberedListIcon } from "@heroicons/react/24/outline";
import { ClockIcon, LinkIcon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "submodulos", label: "SUBMÓDULOS", icon: NumberedListIcon },
    { id: "match", label: "MATCH", icon: LinkIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function AdmModulosEndpointsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TabbedLayout
            tabs={TABS}
            basePath="/monitoreo/adm-modulos-endpoints"
            contentClassName="pt-40 pb-10 px-6"
        >
            {children}
        </TabbedLayout>
    );
}
