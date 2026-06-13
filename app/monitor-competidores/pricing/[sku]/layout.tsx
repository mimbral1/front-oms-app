"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

import { TabsNav } from "@/components/ui/tabnav/TabNav";
import React from "react";
import {
    useWarehouseHeader,
    WarehouseHeaderProvider,
} from "@/app/context/warehouse/warehousecontext";


interface DetallePedidoLayoutProps {
    children: React.ReactNode;
    headerComponent?: React.ReactNode;
}
interface TabItem {
    id: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const TABS: TabItem[] = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
];
type TabId = (typeof TABS)[number]["id"];

function InnerResumenPricingMonitorCompetenciaLayout({ children }: { children: React.ReactNode }) {
    const { header } = useWarehouseHeader();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const id = params?.competidor;

    const last = pathname.split("/").filter(Boolean).at(-1)!;
    const current: TabId = TABS.some((t) => t.id === last)
        ? (last as TabId)
        : "resumen";

    const goTo = (tab: TabId) =>
        router.push(
            tab === "resumen"
                ? `/monitor-competidores/pricing/${id}`
                : `/monitor-competidores/pricing/${id}/${tab}`
        );

    return (
        <div className="min-h-screen bg-page-bg">
            {header}
            <div className="">{children}</div>
        </div>
    );
}

export default function ResumenPricingMonitorCompetenciaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WarehouseHeaderProvider>
            <InnerResumenPricingMonitorCompetenciaLayout>{children}</InnerResumenPricingMonitorCompetenciaLayout>
        </WarehouseHeaderProvider>
    );
}
