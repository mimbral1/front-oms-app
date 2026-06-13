// features/catalogo/pages/plataforma-ecommerce/_shared/janis/index.ts
//
// Barrel del set de átomos visuales del rediseño Janis.
//
// Import canónico:
//   import { JanisTopBar, JanisTabs, Sec, Field, PillBtn } from "@/features/catalogo/pages/plataforma-ecommerce/_shared/janis";
//
// Si vas a usar muchos en una vista, alias el import:
//   import * as Janis from "@/features/catalogo/pages/plataforma-ecommerce/_shared/janis";
//   <Janis.TopBar ... />
//
// IMPORTANTE: estos átomos NO pertenecen al `components/ui/` global del OMS.
// Su paleta (blue-700 / pink-500 / Inter) es exclusiva del subárbol
// "Plataforma de ecommerce". Ver Decisión #2 en `docs/MIGRATION_PLAN.md`.

// Chrome (cabeceras, tabs, steps)
export { JanisTopBar } from "./JanisTopBar";
export type { JanisTopBarProps } from "./JanisTopBar";

export { JanisTabs } from "./JanisTabs";
export type { JanisTabsItem, JanisTabsProps } from "./JanisTabs";

export { JanisStepsHeader } from "./JanisStepsHeader";
export type { JanisStepItem, JanisStepsHeaderProps } from "./JanisStepsHeader";

// Botones
export { PillBtn } from "./PillBtn";
export type { PillBtnProps } from "./PillBtn";

// Form atoms
export { Sec } from "./Sec";
export type { SecProps } from "./Sec";

export { Field } from "./Field";
export type { FieldProps } from "./Field";

export { UnderlineInput } from "./UnderlineInput";
export type { UnderlineInputProps } from "./UnderlineInput";

export { Sel } from "./Sel";
export type { SelProps } from "./Sel";

export { Chip } from "./Chip";
export type { ChipProps } from "./Chip";

// Data display
export { Card } from "./Card";
export type { CardProps } from "./Card";

export { StatusBadge } from "./StatusBadge";
export type { StatusBadgeProps } from "./StatusBadge";

export { ProgressItem } from "./ProgressItem";
export type { ProgressItemProps } from "./ProgressItem";

export { Kpi } from "./Kpi";
export type { KpiProps } from "./Kpi";

export { TabPlaceholder } from "./TabPlaceholder";
export type { TabPlaceholderProps } from "./TabPlaceholder";

export { Spark } from "./Spark";
export type { SparkProps } from "./Spark";

// Iconos
export { JanisIcon, getJanisIconPath } from "./icons/janis-icons";
export type { JanisIconName, JanisIconProps } from "./icons/janis-icons";

// Tokens
export {
    JANIS_COLORS,
    JANIS_FONT,
    JANIS_RADIUS,
    JANIS_SHADOW,
    PILL_VARIANT_CLASSES,
    STATUS_BADGE_CLASSES,
} from "./tokens";
export type { PillVariant, StatusBadgeTone } from "./tokens";
