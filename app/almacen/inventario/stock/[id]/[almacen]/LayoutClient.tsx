"use client";

import React from "react";

import { useParams } from "next/navigation";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  ShoppingCartIcon,
  TrashIcon,
  CubeIcon,
  ChartBarSquareIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "reservas", label: "RESERVAS", icon: ShoppingCartIcon },
  { id: "almacenamiento", label: "ALMACENAMIENTO", icon: CubeIcon },
  { id: "movimientos", label: "MOVIMIENTOS", icon: ArrowsRightLeftIcon },
  { id: "forecast", label: "FORECAST", icon: ChartBarSquareIcon },
  { id: "merma", label: "MERMA", icon: TrashIcon },
  { id: "plataformas", label: "PLATAFORMAS", icon: ListBulletIcon },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id?: string; almacen?: string }>();
  const id = params?.id ?? "";
  const basePath = id
    ? `/almacen/inventario/stock/${encodeURIComponent(id)}`
    : "/almacen/inventario/stock";

  return (
    <TabbedLayout
      tabs={TABS}
      basePath={basePath}
      paramKey="almacen"
      contentClassName="pt-[150px] px-6"
    >
      {children}
    </TabbedLayout>
  );
}
