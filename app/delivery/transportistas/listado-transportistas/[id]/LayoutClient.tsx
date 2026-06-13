"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  AdjustmentsHorizontalIcon,
  CodeBracketSquareIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { ClockIcon, ExpandIcon } from "lucide-react";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  // { id: "codigo-entrega", label: "CODIGO DE ENTREGA", icon: TextSearchIcon },
  { id: "servicios", label: "SERVICIOS", icon: AdjustmentsHorizontalIcon },
  { id: "programacion", label: "PROGRAMACIÓN", icon: CodeBracketSquareIcon },
  { id: "area-cobertura", label: "ÁREA DE COBERTURA", icon: ExpandIcon },
  // { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/delivery/transportistas/listado-transportistas"
    >
      {children}
    </TabbedLayout>
  );
}
