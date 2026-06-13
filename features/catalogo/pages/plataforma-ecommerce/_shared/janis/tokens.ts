// features/catalogo/pages/plataforma-ecommerce/_shared/janis/tokens.ts
//
// Design tokens del rediseño Janis (subárbol Plataforma de ecommerce).
//
// Estos valores son la fuente de verdad para colores, tipografía y espaciado
// específicos del subárbol. NO mezclar con la paleta OMS (navy #14365e + rojo
// #c8202d) — ver `components/ui/` global para eso.
//
// Si Tailwind no resuelve algún color custom (ej. el bg sidebar #1d1f23),
// usar `bg-[#1d1f23]` directamente en JSX o agregarlo al `tailwind.config.ts`.

export const JANIS_COLORS = {
    // Marca
    primary: "#1d4ed8", // blue-700 — eyebrows, tab underline, link hover
    primaryButton: "#2563eb", // blue-600 — botones primary (hover sube a #1d4ed8)
    primaryButtonHover: "#1d4ed8",
    accent: "#ec4899", // pink-500 — logo, accent extremo (uso muy limitado)
    accentSidebarActive: "#f472b6", // pink-400 — icono activo en sidebar oscuro

    // Status
    success: "#10b981", // emerald-500
    successDark: "#059669", // emerald-600
    successLight: "#34d399", // emerald-400
    warning: "#f59e0b", // amber-500
    danger: "#f43f5e", // rose-500

    // Neutrales (gray scale)
    bg: "#f3f4f6", // gray-100 — fondo del workspace
    surface: "#ffffff", // cards, modales
    border: "#e5e7eb", // gray-200
    borderHover: "#d1d5db", // gray-300
    sidebar: "#1d1f23", // dark slate — sidebar custom
    sidebarHover: "#2a2d33",
    textPrimary: "#111827", // gray-900
    textSecondary: "#6b7280", // gray-500
    textMuted: "#9ca3af", // gray-400
} as const;

export const JANIS_FONT = {
    family: "Inter, system-ui, sans-serif",
    sizes: {
        base: "13px",
        eyebrow: "11px",
        h1: "26px",
        kpiValue: "24px",
        secLabel: "11.5px",
        fieldLabel: "12.5px",
        fieldValue: "13.5px",
        button: "12.5px",
    },
} as const;

export const JANIS_RADIUS = {
    card: "6px", // rounded-md
    pill: "9999px", // rounded-full
    tag: "4px", // rounded
} as const;

export const JANIS_SHADOW = {
    card: "0 1px 2px rgba(0,0,0,0.04)",
} as const;

/**
 * Mapa de variantes para `<PillBtn/>`. Mantener sincronizado con el componente.
 */
export const PILL_VARIANT_CLASSES = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 shadow-sm",
    success: "text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm",
    "success-outline":
        "text-emerald-700 bg-white ring-1 ring-emerald-500 hover:bg-emerald-50",
    ghost: "text-gray-600 bg-white ring-1 ring-gray-300 hover:bg-gray-50",
    danger: "text-white bg-rose-500 hover:bg-rose-600 shadow-sm",
} as const;

export type PillVariant = keyof typeof PILL_VARIANT_CLASSES;

/**
 * Mapa de tonos para el badge `<StatusBadge/>` (en TopBar y en el sidebar derecho).
 */
export const STATUS_BADGE_CLASSES = {
    live: "text-white bg-emerald-500",
    active: "text-white bg-emerald-500",
    draft: "text-white bg-amber-500",
    paused: "text-white bg-gray-400",
    error: "text-white bg-rose-500",
} as const;

export type StatusBadgeTone = keyof typeof STATUS_BADGE_CLASSES;
