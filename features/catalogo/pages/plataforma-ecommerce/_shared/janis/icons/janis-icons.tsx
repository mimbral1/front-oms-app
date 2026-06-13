// features/catalogo/pages/plataforma-ecommerce/_shared/janis/icons/janis-icons.tsx
//
// Set de iconos SVG inline usados en el rediseño Janis. Todos comparten el
// mismo viewBox 20x20 y el mismo "look" lineal (stroke 1.5, rounded caps).
//
// Convención: cada icono es un componente puro `(props: JanisIconProps) => JSX`.
// El wrapper SVG vive en `<JanisIcon/>` para forzar el viewBox y los stroke
// attributes consistentes; los icon-files solo definen los `<path>` internos.

import type { SVGProps } from "react";

export interface JanisIconProps extends SVGProps<SVGSVGElement> {
    /** Tamaño en pixels (default 18, lo que matchea `w-[18px] h-[18px]` de los mockups) */
    size?: number;
}

interface JanisIconNameToContent {
    home: JSX.Element;
    cart: JSX.Element;
    list: JSX.Element;
    image: JSX.Element;
    pin: JSX.Element;
    clock: JSX.Element;
    flag: JSX.Element;
    sparkle: JSX.Element;
    bolt: JSX.Element;
    grid: JSX.Element;
    upload: JSX.Element;
    refresh: JSX.Element;
    plus: JSX.Element;
    check: JSX.Element;
    checkCircle: JSX.Element;
    close: JSX.Element;
    chevronDown: JSX.Element;
    chevronRight: JSX.Element;
    search: JSX.Element;
    user: JSX.Element;
    trash: JSX.Element;
    save: JSX.Element;
    comment: JSX.Element;
    platforms: JSX.Element;
    table: JSX.Element;
    star: JSX.Element;
    money: JSX.Element;
    box: JSX.Element;
    calendar: JSX.Element;
    chartUp: JSX.Element;
    info: JSX.Element;
}

export type JanisIconName = keyof JanisIconNameToContent;

/**
 * Paths puros (sin wrapper svg) — el `<JanisIcon/>` les pone el `<svg>` afuera.
 * Mantener cada path en `viewBox=0 0 20 20`.
 */
const PATHS: JanisIconNameToContent = {
    home: (
        <>
            <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
            <path d="M8 18v-5h4v5" />
        </>
    ),
    cart: (
        <>
            <path d="M2 5h2l2 9h11l2-7H7" />
            <circle cx="9" cy="18" r="1.2" />
            <circle cx="16" cy="18" r="1.2" />
        </>
    ),
    list: (
        <>
            <rect x="5" y="3" width="10" height="14" rx="1" />
            <path d="M7 8h6M7 11h6M7 14h4" />
        </>
    ),
    image: (
        <>
            <rect x="3" y="4" width="14" height="12" rx="1" />
            <circle cx="8" cy="9" r="2" />
        </>
    ),
    pin: (
        <>
            <path d="M10 18s6-6 6-11a6 6 0 10-12 0c0 5 6 11 6 11z" />
            <circle cx="10" cy="7" r="2" />
        </>
    ),
    clock: (
        <>
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6v4l3 2" />
        </>
    ),
    flag: <path d="M3 11V8l11-4v12L3 12v-1z" />,
    sparkle: <path d="M11 2l-8 9h6l-1 5 8-9h-6l1-5z" />,
    bolt: <path d="M11 2l-7 9h5l-1 7 7-9h-5l1-7z" />,
    grid: (
        <>
            <rect x="3" y="4" width="14" height="12" rx="1" />
            <path d="M3 8h14M7 4v12" />
        </>
    ),
    upload: (
        <>
            <path d="M10 3v10M6 7l4-4 4 4" />
            <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
        </>
    ),
    refresh: (
        <>
            <path d="M16 10a6 6 0 11-6-6" />
            <path d="M16 4v4h-4" />
        </>
    ),
    plus: (
        <>
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6v8M6 10h8" />
        </>
    ),
    check: <path d="M5 10l3 3 7-7" />,
    checkCircle: (
        <>
            <circle cx="10" cy="10" r="7" />
            <path d="M6.5 10l2.5 2.5L14 7.5" />
        </>
    ),
    close: (
        <>
            <circle cx="10" cy="10" r="7" />
            <path d="M7 7l6 6M13 7l-6 6" />
        </>
    ),
    chevronDown: <path d="M5 8l5 5 5-5" />,
    chevronRight: <path d="M8 5l5 5-5 5" />,
    search: (
        <>
            <circle cx="9" cy="9" r="5" />
            <path d="M13 13l4 4" />
        </>
    ),
    user: (
        <>
            <circle cx="10" cy="7" r="3" />
            <path d="M3 17a7 7 0 0114 0" />
        </>
    ),
    trash: (
        <path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M4 4l1 9a1 1 0 001 1h4a1 1 0 001-1l1-9" />
    ),
    save: (
        <>
            <path d="M14 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6l-3-3z" />
            <path d="M14 17v-6H6v6M6 3v4h7" />
        </>
    ),
    comment: (
        <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H8l-4 4v-4H5a2 2 0 01-2-2V5z" />
    ),
    platforms: (
        <path d="M2 9h16M2 9v5a2 2 0 002 2h12a2 2 0 002-2V9M2 9V6a2 2 0 012-2h12a2 2 0 012 2v3" />
    ),
    table: (
        <>
            <rect x="3" y="4" width="14" height="12" rx="1" />
            <path d="M3 8h14M7 4v12" />
        </>
    ),
    star: <path d="M11 2l2.5 5 5.5.8-4 3.9.9 5.5L11 14.7 6.1 17.2 7 11.7 3 7.8 8.5 7z" />,
    money: (
        <>
            <circle cx="10" cy="10" r="7" />
            <path d="M10 5v10M12.5 7C12 6.5 11 6 10 6c-1.5 0-2.5.7-2.5 1.8s1 1.5 2.5 1.7c1.5.2 2.5.7 2.5 1.7 0 1.1-1 1.8-2.5 1.8-1 0-2-.5-2.5-1" />
        </>
    ),
    box: (
        <>
            <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" />
            <path d="M3 6l7 3 7-3M10 9v9" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="4" width="14" height="13" rx="1" />
            <path d="M3 8h14M7 3v3M13 3v3" />
        </>
    ),
    chartUp: (
        <>
            <path d="M3 16l4-4 3 3 7-7" />
            <path d="M14 8h3v3" />
        </>
    ),
    info: (
        <>
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6v6M10 14v.5" />
        </>
    ),
};

export function JanisIcon({ name, size = 18, ...rest }: JanisIconProps & { name: JanisIconName }) {
    return (
        <svg
            viewBox="0 0 20 20"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...rest}
        >
            {PATHS[name]}
        </svg>
    );
}

/**
 * Convenience helpers para los casos donde se quiere el path raw (por ejemplo
 * dentro de un `<svg>` ya creado por otro átomo). Devuelve el `<path>` directamente.
 */
export function getJanisIconPath(name: JanisIconName): JSX.Element {
    return PATHS[name];
}
