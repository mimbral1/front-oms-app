"use client";

import React, { createContext, useContext } from "react";
import { TabsNav } from "@/components/ui/tabnav/TabNav";
import {
    Tag,
    SlidersHorizontal,
    Settings,
    BarChart3,
    Upload,
    BookOpen,
    Megaphone,
    Rocket,
    Calculator,
    Inbox,
    Layers,
} from "lucide-react";

/**
 * Grupos del sub-sidebar de marketplaces. Replica el patrón visual del
 * mockup `ml-nav-explorations.html` (opción A+C):
 *   - canal       → Dashboard, Catálogo, Productos, Atributos, Publicar
 *   - operacion   → Calculadora de margen, Carga masiva, Ofertas
 *   - integracion → Mapeo de categorías, Mapeo de atributos, Configuración
 */
export type SectionGroup = "canal" | "operacion" | "integracion";

export interface SectionTab {
    id: string;
    /** Label en Title Case — el sub-sidebar renderiza tal cual. */
    label: string;
    icon: React.ElementType;
    group: SectionGroup;
    /** Badge count opcional (notificaciones). El sub-sidebar lo renderiza
     *  como pill rojo a la derecha del label. Si 0 o undefined, no se muestra. */
    badgeCount?: number;
}

// Mantener el orden de aparición visual de los tabs. Las features nuevas
// (Fase 2 en adelante del MIGRATION_PLAN) se intercalan ANTES de las
// existentes — p.ej. "Atributos" (nuevo) reemplaza a "Mapeo de atributos"
// (queda activo durante 1 sprint como alias hasta Fase 9).
export const SECTION_TABS: SectionTab[] = [
    // ── CANAL ──────────────────────────────────────────────────────
    { id: "dashboard", label: "Dashboard", icon: BarChart3, group: "canal" },
    // Fase 4: "Catálogo" es la única vista para listar productos. "Productos"
    // (legacy `MarketplaceProductosBrowse`) eliminado — Catálogo lo reemplaza
    // con el mismo dataset + chrome OMS + features ricas (image preview,
    // CopyableText, stock colors, calidad).
    { id: "catalogo", label: "Catálogo", icon: BookOpen, group: "canal" },
    // Fase 6: Publicar wizard (ML+Falabella). En VTEX está deshabilitado.
    {
        id: "publicar",
        label: "Publicar",
        icon: Rocket,
        group: "canal",
    },
    // Nota 2026-05-18: "Atributos" se quitó de CANAL — la única vista útil de
    // atributos por marketplace es el MAPEO (vive en INTEGRACIÓN). Si en el
    // futuro hace falta un explorer de atributos por publicación, el lugar
    // canónico es dentro del Editor del producto (Fase 7), no como tab
    // separada del subárbol.

    // ── OPERACIÓN ──────────────────────────────────────────────────
    {
        id: "calculadora-margen",
        label: "Calculadora de margen",
        icon: Calculator,
        group: "operacion",
    },
    {
        id: "carga-masiva",
        label: "Carga masiva",
        icon: Upload,
        group: "operacion",
    },
    // Bandeja cross-lote del flujo de asignación (encargado sube → publicador
    // toma → rellena → publica). ML-only por ahora (gateada en FALA/VTEX).
    {
        id: "productos-a-publicar",
        label: "Productos a publicar",
        icon: Inbox,
        group: "operacion",
    },
    // Fase 5: Ofertas — ML only. En Falabella/VTEX se muestra deshabilitada.
    {
        id: "ofertas",
        label: "Ofertas",
        icon: Megaphone,
        group: "operacion",
    },
    // Catalog Hub · Pieza A: lista de Flujos de trabajo (CRUD + cupo). ML-first.
    { id: "catalog-hub", label: "Flujos de trabajo", icon: Layers, group: "operacion" },

    // ── INTEGRACIÓN ────────────────────────────────────────────────
    {
        id: "mapeo-categorias",
        label: "Mapeo de categorías",
        icon: Tag,
        group: "integracion",
    },
    {
        id: "mapeo-atributos",
        label: "Mapeo de atributos",
        icon: SlidersHorizontal,
        group: "integracion",
    },
    {
        id: "configuracion",
        label: "Configuración",
        icon: Settings,
        group: "integracion",
    },
];

export const GROUP_LABELS: Record<SectionGroup, string> = {
    canal: "Canal",
    operacion: "Operación",
    integracion: "Integración",
};

/** Orden de los grupos en el sub-sidebar (top → bottom). */
export const GROUP_ORDER: ReadonlyArray<SectionGroup> = [
    "canal",
    "operacion",
    "integracion",
];

interface EcommerceTabsContextValue {
    tabs: typeof SECTION_TABS;
    currentSection: string;
    onSelectTab: (tabId: string) => void;
}

export const EcommerceTabsContext =
    createContext<EcommerceTabsContextValue | null>(null);

export function useEcommerceTabs() {
    return useContext(EcommerceTabsContext);
}

export function useEcommercePageHeaderTabs() {
    const ctx = useContext(EcommerceTabsContext);
    if (!ctx) return null;

    return {
        tabs: ctx.tabs.map((t) => ({
            id: t.id,
            label: t.label,
            icon: React.createElement(t.icon, { className: "h-4 w-4" }),
        })),
        activeTab: ctx.currentSection,
        onTabChange: ctx.onSelectTab,
    };
}

export function EcommerceSectionTabs() {
    const ctx = useContext(EcommerceTabsContext);
    if (!ctx) return null;

    return (
        <div className="bg-white border-b border-gray-200">
            <TabsNav
                tabs={ctx.tabs}
                currentTab={ctx.currentSection}
                onSelectTab={ctx.onSelectTab}
            />
        </div>
    );
}
