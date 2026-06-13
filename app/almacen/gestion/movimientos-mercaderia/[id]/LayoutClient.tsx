"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { WAREHOUSE_SUPPLYING_API } from "@/lib/http/endpoints";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ArchiveBoxIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "items", label: "AUDITAR ITEMS", icon: MagnifyingGlassCircleIcon },
  { id: "movimientos", label: "MOVIMIENTOS", icon: ArchiveBoxIcon },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

const SUPPLYING_URL = WAREHOUSE_SUPPLYING_API;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [supplyingStatus, setSupplyingStatus] = useState<string>("pending");

  const recordId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!recordId) return;

        const response = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(recordId)}`, {
          method: "GET",
          headers: withAuthPlatformHeaders(),
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { status?: string };
        if (mounted) {
          setSupplyingStatus(String(payload?.status || "").toLowerCase());
        }
      } catch {
        if (mounted) {
          setSupplyingStatus("pending");
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [recordId]);

  useEffect(() => {
    const onSupplyingStatusChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string; status?: string }>;
      const nextId = String(customEvent.detail?.id || "");
      const nextStatus = String(customEvent.detail?.status || "").toLowerCase();
      if (!nextId || nextId !== String(recordId || "")) return;
      if (!nextStatus) return;
      setSupplyingStatus(nextStatus);
    };

    window.addEventListener("supplying-status-changed", onSupplyingStatusChanged);
    return () => {
      window.removeEventListener("supplying-status-changed", onSupplyingStatusChanged);
    };
  }, [recordId]);

  const canShowItemsTab = useMemo(
    () => ["received", "partiallyreceived"].includes(supplyingStatus),
    [supplyingStatus]
  );

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => tab.id !== "items" || canShowItemsTab),
    [canShowItemsTab]
  );

  return (
    <TabbedLayout
      tabs={visibleTabs}
      basePath="/almacen/gestion/ordenes-compra"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
