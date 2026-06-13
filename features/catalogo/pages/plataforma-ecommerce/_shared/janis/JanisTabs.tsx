// features/catalogo/pages/plataforma-ecommerce/_shared/janis/JanisTabs.tsx
//
// Barra de tabs horizontal estilo Janis: bg white, underline azul activo.
// Tabs muestran ícono SVG (18px) + label uppercase (11.5px) + tracking 0.08em.
//
// Variante para "steps" (con numeración 1·2·3·4) está en JanisStepsHeader.

"use client";

import type { ReactNode } from "react";

export interface JanisTabsItem<TabId extends string = string> {
    id: TabId;
    /** Label uppercase. Se renderiza tal cual (sin transform CSS) — pasarlo en mayúsculas. */
    label: ReactNode;
    /** Ícono opcional (SVG inline o `<JanisIcon name="..."/>`). */
    icon?: ReactNode;
    /** Si true, el tab se muestra inhabilitado (cursor + opacity). */
    disabled?: boolean;
}

export interface JanisTabsProps<TabId extends string = string> {
    items: JanisTabsItem<TabId>[];
    active: TabId;
    onChange: (id: TabId) => void;
    /** Clases extra al wrapper. */
    className?: string;
}

export function JanisTabs<TabId extends string = string>({
    items,
    active,
    onChange,
    className,
}: JanisTabsProps<TabId>) {
    return (
        <div
            className={[
                "bg-white px-6 border-b border-gray-200",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="flex items-center gap-1 overflow-x-auto">
                {items.map((t) => {
                    const isActive = active === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            disabled={t.disabled}
                            onClick={() => !t.disabled && onChange(t.id)}
                            className={[
                                "relative inline-flex items-center gap-2 px-3 h-11",
                                "text-[11.5px] tracking-[0.08em] uppercase font-semibold whitespace-nowrap",
                                "transition-colors",
                                t.disabled
                                    ? "text-gray-300 cursor-not-allowed"
                                    : isActive
                                      ? "text-blue-700"
                                      : "text-gray-500 hover:text-gray-800",
                            ].join(" ")}
                            aria-current={isActive ? "page" : undefined}
                        >
                            {t.icon && <span className="inline-flex shrink-0">{t.icon}</span>}
                            {t.label}
                            {isActive && (
                                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-blue-700 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
