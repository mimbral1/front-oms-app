// app/catalogo/plataforma-ecommerce/_shared/EcommerceSubSidebar.tsx
//
// Sub-sidebar contextual para el subárbol de un marketplace (ML/Fala/VTEX).
//
// Diseño: ancho FIJO de 220px, siempre visible.
//   - Top: chip de marketplace + nombre — CLICK abre dropdown switcher
//     para cambiar a otro marketplace sin volver al sidebar global.
//   - Items agrupados en CANAL / OPERACIÓN / INTEGRACIÓN
//   - Active state sutil: bg-gray-100 + text/icon azul-700
//   - Algunas marketplaces deshabilitan secciones (Fala sin Ofertas, etc.)

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import {
    GROUP_LABELS,
    GROUP_ORDER,
    useEcommerceTabs,
    type SectionGroup,
    type SectionTab,
} from "./ecommerce-tabs";
import { useEcommercePlatform } from "./ecommerce-platform-context";

export interface EcommerceSubSidebarProps {
    /**
     * IDs de secciones que deben aparecer grisadas/deshabilitadas para el
     * marketplace actual. Ej: `["ofertas"]` para Falabella.
     */
    disabledSections?: ReadonlyArray<string>;
    /**
     * Map opcional de badge counts por section.id. Si no se pasa, no se
     * muestran badges. Ej: `{ publicar: 12, ofertas: 3 }`.
     */
    badgeCounts?: Readonly<Record<string, number>>;
}

/**
 * Catálogo de marketplaces disponibles. Usado por el switcher para
 * navegar entre ML/Fala/VTEX. Mantener sincronizado con los
 * `PLATFORM_CONFIG` de cada layout marketplace.
 *
 * Los logos se sirven desde `/public/marketplaces/`:
 *   - mercadolibre.png, falabella.png → del set oficial de pim-service
 *   - vtex.png → del set previo del OMS
 */
interface MarketplaceEntry {
    name: "MercadoLibre" | "Falabella" | "VTEX";
    basePath: string;
    logoSrc: string;
}

const ALL_MARKETPLACES: ReadonlyArray<MarketplaceEntry> = [
    {
        name: "MercadoLibre",
        basePath: "/catalogo/plataforma-ecommerce/mercadolibre",
        logoSrc: "/marketplaces/mercadolibre.png",
    },
    {
        name: "Falabella",
        basePath: "/catalogo/plataforma-ecommerce/falabella",
        logoSrc: "/marketplaces/falabella.png",
    },
    {
        name: "VTEX",
        basePath: "/catalogo/plataforma-ecommerce/vtex",
        logoSrc: "/marketplaces/vtex.png",
    },
];

function findMarketplace(name: string): MarketplaceEntry | undefined {
    return ALL_MARKETPLACES.find((m) => m.name === name);
}

export function EcommerceSubSidebar({
    disabledSections = [],
    badgeCounts,
}: EcommerceSubSidebarProps) {
    const router = useRouter();
    const tabs = useEcommerceTabs();
    const platform = useEcommercePlatform();

    // Switcher state
    const [switcherOpen, setSwitcherOpen] = useState(false);
    const switcherRef = useRef<HTMLDivElement | null>(null);

    // Click outside cierra el switcher.
    useEffect(() => {
        if (!switcherOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                switcherRef.current &&
                !switcherRef.current.contains(e.target as Node)
            ) {
                setSwitcherOpen(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSwitcherOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [switcherOpen]);

    const handleSwitchTo = (mp: MarketplaceEntry) => {
        setSwitcherOpen(false);
        if (mp.name !== platform.name) {
            router.push(`${mp.basePath}/dashboard`);
        }
    };

    // Agrupar tabs por `group`.
    const tabsByGroup = useMemo(() => {
        if (!tabs) return null;
        const m = new Map<SectionGroup, SectionTab[]>();
        for (const t of tabs.tabs as SectionTab[]) {
            const arr = m.get(t.group) ?? [];
            arr.push(t);
            m.set(t.group, arr);
        }
        return m;
    }, [tabs]);

    if (!tabs || !tabsByGroup) return null;

    const disabledSet = new Set(disabledSections);

    return (
        <aside className="w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen z-10">
            {/* ── Switcher: chip + nombre marketplace ─────────────────── */}
            <div
                ref={switcherRef}
                className="relative border-b border-gray-200 shrink-0"
            >
                <button
                    type="button"
                    onClick={() => setSwitcherOpen((v) => !v)}
                    aria-expanded={switcherOpen}
                    aria-haspopup="menu"
                    className="w-full px-4 h-14 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                    {/* Logo del marketplace actual */}
                    <div className="w-9 h-9 grid place-items-center shrink-0">
                        {(() => {
                            const mp = findMarketplace(platform.name);
                            return mp ? (
                                <img
                                    src={mp.logoSrc}
                                    alt={mp.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : null;
                        })()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            Plataforma
                        </div>
                        <div className="text-[15px] font-semibold text-gray-900 truncate">
                            {platform.name}
                        </div>
                    </div>
                    <ChevronDown
                        className={[
                            "w-4 h-4 text-gray-400 shrink-0 transition-transform",
                            switcherOpen ? "rotate-180" : "",
                        ].join(" ")}
                    />
                </button>

                {/* Dropdown */}
                {switcherOpen && (
                    <div
                        role="menu"
                        className="absolute top-full left-2 right-2 mt-1 bg-white rounded-lg shadow-lg ring-1 ring-gray-200 z-50 py-1"
                    >
                        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold px-3 py-1.5">
                            Cambiar a
                        </div>
                        {ALL_MARKETPLACES.map((mp) => {
                            const isCurrent = mp.name === platform.name;
                            return (
                                <button
                                    key={mp.name}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleSwitchTo(mp)}
                                    className={[
                                        "w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors",
                                        isCurrent
                                            ? "bg-blue-50 text-blue-700"
                                            : "hover:bg-gray-50 text-gray-700",
                                    ].join(" ")}
                                >
                                    <div className="w-6 h-6 grid place-items-center shrink-0">
                                        <img
                                            src={mp.logoSrc}
                                            alt={mp.name}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-[15px] flex-1 truncate">
                                        {mp.name}
                                    </span>
                                    {isCurrent && (
                                        <Check className="w-4 h-4 text-blue-700 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Grupos + items ────────────────────────────────────── */}
            <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
                {GROUP_ORDER.map((group, gIdx) => {
                    const items = tabsByGroup.get(group);
                    if (!items || items.length === 0) return null;
                    return (
                        <div key={group} className={gIdx > 0 ? "mt-3" : ""}>
                            <div className="px-4 pb-1.5 text-xs font-semibold tracking-wider uppercase text-gray-400">
                                {GROUP_LABELS[group]}
                            </div>
                            {items.map((tab) => {
                                const isActive = tabs.currentSection === tab.id;
                                const isDisabled = disabledSet.has(tab.id);
                                const Icon = tab.icon;
                                const badge =
                                    (badgeCounts?.[tab.id] ?? tab.badgeCount) || 0;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() =>
                                            !isDisabled && tabs.onSelectTab(tab.id)
                                        }
                                        disabled={isDisabled}
                                        title={
                                            isDisabled
                                                ? `${tab.label} (no disponible en ${platform.name})`
                                                : tab.label
                                        }
                                        className={[
                                            "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                                            isActive
                                                ? "bg-gray-100 text-blue-700 font-semibold"
                                                : isDisabled
                                                    ? "text-gray-300 cursor-not-allowed"
                                                    : "text-gray-700 hover:bg-gray-50",
                                        ].join(" ")}
                                    >
                                        <Icon
                                            className={[
                                                "w-[18px] h-[18px] shrink-0",
                                                isActive
                                                    ? "text-blue-700"
                                                    : isDisabled
                                                        ? "text-gray-300"
                                                        : "text-gray-500",
                                            ].join(" ")}
                                        />
                                        <span className="text-[15px] flex-1 truncate">
                                            {tab.label}
                                        </span>
                                        {badge > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold tabular-nums shrink-0">
                                                {badge > 99 ? "99+" : badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
