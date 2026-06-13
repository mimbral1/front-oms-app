"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    SECTION_TABS,
    EcommerceTabsContext,
} from "../_shared/ecommerce-tabs";
import {
    EcommercePlatformContext,
    type EcommercePlatformConfig,
} from "../_shared/ecommerce-platform-context";
import { EcommerceSubSidebar } from "../_shared/EcommerceSubSidebar";

const PLATFORM_CONFIG: EcommercePlatformConfig = {
    name: "VTEX",
    basePath: "/catalogo/plataforma-ecommerce/vtex",
    channelKeywords: ["vtex"],
    exportPrefix: "vtex",
};

/**
 * VTEX gestiona Publicar, Calculadora de margen y Ofertas desde su propio
 * admin. Esas secciones se muestran grisadas en el sub-sidebar.
 */
const VTEX_DISABLED_SECTIONS: ReadonlyArray<string> = [
    "publicar",
    "calculadora-margen",
    "ofertas",
    "productos-a-publicar",
];

export default function VtexLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const segments = pathname
        .replace(PLATFORM_CONFIG.basePath, "")
        .split("/")
        .filter(Boolean);
    const currentSection = SECTION_TABS.some((t) => t.id === segments[0])
        ? segments[0]
        : "dashboard";

    const handleSelectTab = (tabId: string) => {
        router.push(`${PLATFORM_CONFIG.basePath}/${tabId}`);
    };

    return (
        <EcommercePlatformContext.Provider value={PLATFORM_CONFIG}>
            <EcommerceTabsContext.Provider
                value={{
                    tabs: SECTION_TABS,
                    currentSection,
                    onSelectTab: handleSelectTab,
                }}
            >
                <div className="flex min-h-screen w-full min-w-0 overflow-x-hidden">
                    <EcommerceSubSidebar disabledSections={VTEX_DISABLED_SECTIONS} />
                    <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
                </div>
            </EcommerceTabsContext.Provider>
        </EcommercePlatformContext.Provider>
    );
}
