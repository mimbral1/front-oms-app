"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { ChatBubbleLeftRightIcon, DocumentTextIcon, BuildingStorefrontIcon, PhoneArrowUpRightIcon, } from "@heroicons/react/24/outline";
import { Clock, DollarSignIcon } from "lucide-react";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "direcciones", label: "DIRECCIONES", icon: BuildingStorefrontIcon },
  { id: "contactos", label: "CONTACTOS", icon: PhoneArrowUpRightIcon },
  { id: "condiciones-pago", label: "CONDICIONES DE PAGO", icon: DollarSignIcon },
  { id: "comments", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/customers/clientes"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
