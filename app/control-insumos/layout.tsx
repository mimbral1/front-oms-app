"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import {
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    KeyIcon,
    ComputerDesktopIcon,
    ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { TabsNav } from "@/components/ui/tabnav/TabNav";
import { ArrowLeftRightIcon, ClipboardCheckIcon, Clock, Package2Icon, PackagePlusIcon } from "lucide-react";
import React from "react";
import {
    useWarehouseHeader,
    WarehouseHeaderProvider,
} from "@/app/context/warehouse/warehousecontext";

interface TabItem {
    id: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const TABS: TabItem[] = [
    { id: "solicitudes", label: "SOLICITUDES", icon: PackagePlusIcon },
    { id: "aprobaciones", label: "APROBACIONES", icon: ClipboardCheckIcon },
    { id: "stock-bodega", label: "STOCK POR BODEGA", icon: Package2Icon },
    { id: "traslados", label: "TRASLADOS", icon: ArrowLeftRightIcon },
];
type TabId = (typeof TABS)[number]["id"];

function InnerInsumosLayout({ children }: { children: React.ReactNode }) {
    const { header } = useWarehouseHeader();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const id = params?.id;

    const last = pathname.split("/").filter(Boolean).at(-1)!;
    const current: TabId = TABS.some((t) => t.id === last)
        ? (last as TabId)
        : "solicitudes";

    const goTo = (tab: TabId) =>
        router.push(
            tab === "solicitudes"
                ? `/control-insumos/solicitudes`
                : `/control-insumos/${tab}`
        );

    return (
        <div className="min-h-screen bg-page-bg">
            {/* TopBar */}
            <div className="fixed top-0 left-[70px] right-0 bg-white  z-20">
                {header}
                <TabsNav tabs={TABS} currentTab={current} onSelectTab={goTo} />
            </div>
            <div className="pt-[150px] ">{children}</div>
        </div>
    );
}

export default function UsuariosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WarehouseHeaderProvider>
            <InnerInsumosLayout>{children}</InnerInsumosLayout>
        </WarehouseHeaderProvider>
    );
}
