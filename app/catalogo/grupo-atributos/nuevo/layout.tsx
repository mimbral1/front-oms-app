"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "SUMMARY", icon: DocumentTextIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <TabbedLayout
            tabs={TABS}
            basePath="/catalogo/grupo-atributos/nuevo"
            contentClassName="pt-[150px]"
        >
            {children}
        </TabbedLayout>
    );
}
