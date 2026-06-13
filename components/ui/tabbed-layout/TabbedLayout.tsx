// components/ui/tabbed-layout/TabbedLayout.tsx

"use client";

import React from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
    WarehouseHeaderProvider,
    useWarehouseHeader,
} from "@/app/context/warehouse/warehousecontext";
import { TabsNav } from "@/components/ui/tabnav/TabNav";

/* ─── Tipos ─── */

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ElementType;
    disabled?: boolean;
    badgeCount?: number;
}

export interface TabbedLayoutProps {
    /** Array de pestañas que decidirá cada feature */
    tabs: TabItem[];

    /**
     * Ruta base **sin** el segmento dinámico.
     * Ej: "/delivery/transportistas/slots"
     *
     * El componente añade `/{id}` automáticamente a partir de `useParams`.
     */
    basePath: string;

    /** Pestaña por defecto cuando la URL no coincide con ningún tab (default: "resumen") */
    defaultTab?: string;

    /** Nombre del param dinámico en la URL (default: "id") */
    paramKey?: string;

    /**
     * Posición del header: "fixed" o "sticky".
     * - "fixed": se fija al viewport (necesita padding-top en el contenido).
     * - "sticky": se pega al scroll del contenedor.
     * Default: "fixed".
     */
    headerPosition?: "fixed" | "sticky";

    /** Clase CSS extra para el contenedor del contenido */
    contentClassName?: string;

    /** Ocultar las tabs cuando no hay id (ej.: layouts de [id] sin param aún) */
    hideTabsWithoutId?: boolean;

    /** Contenido extra que se renderiza entre el header y las tabs (raro, pero soportado) */
    beforeTabs?: React.ReactNode;

    /** Callback al hacer click en "más opciones" (3 puntitos del PageHeader) */
    onMoreOptions?: () => void;

    /**
     * Si true, el tab por defecto también incluye su id en la URL.
     * Ej: basePath="/control-insumos", defaultTab="solicitudes"
     *   - false (default): navega a "/control-insumos"
     *   - true: navega a "/control-insumos/solicitudes"
     */
    defaultTabInUrl?: boolean;

    children: React.ReactNode;
}

/* ─── Layout interno (usa el context) ─── */

function InnerTabbedLayout({
    tabs,
    basePath,
    defaultTab = "resumen",
    paramKey = "id",
    headerPosition = "fixed",
    contentClassName,
    hideTabsWithoutId = false,
    beforeTabs,
    onMoreOptions,
    defaultTabInUrl = false,
    children,
}: TabbedLayoutProps) {
    const { header } = useWarehouseHeader();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();

    const id = params?.[paramKey] as string | undefined;
    const hasId = Boolean(id);

    // Resolver tab actual desde el último segmento de la URL
    const last = pathname.split("/").filter(Boolean).pop()!;
    const currentTab =
        tabs.some((t) => t.id === last) ? last : defaultTab;

    // Ruta completa base (con id)
    const fullBasePath = id ? `${basePath}/${id}` : basePath;

    // Navegar a un tab
    const handleSelect = (tabId: string) => {
        const tab = tabs.find((t) => t.id === tabId);
        if (tab?.disabled) return;

        const target =
            tabId === defaultTab && !defaultTabInUrl
                ? fullBasePath
                : `${fullBasePath}/${tabId}`;
        if (target !== pathname) router.push(target);
    };

    const showTabs = hideTabsWithoutId ? hasId : true;

    const isFixed = headerPosition === "fixed";

    return (
        <div className="min-h-screen bg-page-bg">
            {/* Header + Tabs */}
            <div
                className={
                    isFixed
                        ? "fixed top-0 left-[70px] right-0 z-20 bg-white shadow-sm"
                        : "sticky top-0 left-[70px] right-0 z-20 bg-white shadow-sm mb-4 lg:mb-6"
                }
            >
                {header}
                {beforeTabs}
                {showTabs && (
                    <TabsNav
                        tabs={tabs}
                        currentTab={currentTab}
                        onSelectTab={handleSelect}
                    />
                )}
            </div>

            {/* Contenido */}
            <div className={contentClassName ?? (isFixed ? "pt-[150px] px-6" : "px-4 md:px-6 min-w-0 overflow-x-hidden")}>
                {children}
            </div>
        </div>
    );
}

/* ─── Layout exportado (envuelve en WarehouseHeaderProvider) ─── */

export function TabbedLayout(props: TabbedLayoutProps) {
    return (
        <WarehouseHeaderProvider>
            <InnerTabbedLayout {...props} />
        </WarehouseHeaderProvider>
    );
}
