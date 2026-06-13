"use client";
import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { FileText, MessagesSquare, Clock, SlidersHorizontal } from "lucide-react";

const TABS = [
    { id: "main", label: "RESUMEN", icon: FileText },
    { id: "atributos", label: "ATRIBUTOS", icon: SlidersHorizontal },
    { id: "comments", label: "COMENTARIOS", icon: MessagesSquare },
    { id: "logs", label: "LOGS", icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <TabbedLayout
            tabs={TABS}
            basePath="/catalogo/plataforma-ecommerce/falabella/productos"
            defaultTab="main"
        >
            {children}
        </TabbedLayout>
    );
}
