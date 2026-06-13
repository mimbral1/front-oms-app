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
    name: "Falabella",
    basePath: "/catalogo/plataforma-ecommerce/falabella",
    channelKeywords: ["falabella"],
    exportPrefix: "falabella",
};

/**
 * Falabella no tiene API de campañas como ML, pero implementamos "Ofertas" como
 * campañas propias que aplican precio especial (SpecialPrice + vigencia) por SKU.
 * Por eso la sección está habilitada (ver features/.../falabella/ofertas).
 */
// Bandeja "Productos a publicar" habilitada para Falabella: el backend fcom ya
// tiene pool/claim/release y pim enruta por marketplace.
const FALA_DISABLED_SECTIONS: ReadonlyArray<string> = [];

export default function FalabellaLayout({
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
                    <EcommerceSubSidebar disabledSections={FALA_DISABLED_SECTIONS} />
                    <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
                </div>
            </EcommerceTabsContext.Provider>
        </EcommercePlatformContext.Provider>
    );
}
