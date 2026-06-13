"use client";

import type { ComponentType, SVGProps } from "react";
import {
    Beaker,
    Package,
    Scale,
    ShoppingBag,
    Snowflake,
    SwatchBook,
    Wind,
} from "lucide-react";

export type ProductGroupIconKey =
    | "wind"
    | "snowflake"
    | "shopping-bag"
    | "scale"
    | "beaker"
    | "archive-box"
    | "swatch";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface ProductGroupIconOption {
    label: string;
    value: ProductGroupIconKey;
    icon: IconComponent;
}

export const PRODUCT_GROUP_ICON_OPTIONS: ProductGroupIconOption[] = [
    { label: "Viento", value: "wind", icon: Wind },
    { label: "Congelado", value: "snowflake", icon: Snowflake },
    { label: "Bolsa", value: "shopping-bag", icon: ShoppingBag },
    { label: "Pesable", value: "scale", icon: Scale },
    { label: "Preparacion", value: "beaker", icon: Beaker },
    { label: "Caja", value: "archive-box", icon: Package },
    { label: "Frasco", value: "swatch", icon: SwatchBook },
];

const DEFAULT_ICON_OPTION = PRODUCT_GROUP_ICON_OPTIONS[0];
const LEGACY_ICON_KEY_MAP: Record<string, ProductGroupIconKey> = {
    "🌬️": "wind",
    "❄️": "snowflake",
    "🛒": "shopping-bag",
    "⚖️": "scale",
    "🧪": "beaker",
    "📦": "archive-box",
    "🧴": "swatch",
};

export function getProductGroupIconOption(iconKey?: string | null) {
    if (!iconKey) return DEFAULT_ICON_OPTION;

    const normalizedKey = LEGACY_ICON_KEY_MAP[iconKey] ?? iconKey;
    return PRODUCT_GROUP_ICON_OPTIONS.find((option) => option.value === normalizedKey) ?? DEFAULT_ICON_OPTION;
}

export function getProductGroupIconLabel(iconKey?: string | null) {
    if (!iconKey) return "Seleccionar icono";
    return getProductGroupIconOption(iconKey).label;
}

export function ProductGroupIcon({
    iconKey,
    className = "h-5 w-5",
}: {
    iconKey?: string | null;
    className?: string;
}) {
    const { icon: Icon } = getProductGroupIconOption(iconKey);

    return <Icon className={className} aria-hidden="true" />;
}
