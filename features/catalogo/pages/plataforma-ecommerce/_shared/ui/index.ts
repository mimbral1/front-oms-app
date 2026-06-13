// features/catalogo/pages/plataforma-ecommerce/_shared/ui/index.ts
//
// Barrel del set de atoms del subárbol Plataforma_Marketplace.
//
// Estos atoms usan la paleta y conveciones del OMS global (`components/ui/`):
//   - Tailwind defaults (blue-700 primary, gray-* neutrals)
//   - rounded-md / rounded-xl
//   - shadow-sm / hover shadow-md
//   - text-sm font-medium para labels
//
// Para botones, inputs, cards genéricos, modales, tabs, status-pills →
// importar desde `@/components/ui` directamente. Estos atoms son patrones
// específicos del subárbol que no existen en el global.

export { FieldRow } from "./FieldRow";
export type { FieldRowProps } from "./FieldRow";

export { SectionDivider } from "./SectionDivider";
export type { SectionDividerProps } from "./SectionDivider";

export { RemovableChip } from "./RemovableChip";
export type { RemovableChipProps } from "./RemovableChip";

export { StepIndicator } from "./StepIndicator";
export type { StepIndicatorProps } from "./StepIndicator";

export { EcommercePageHeader } from "./EcommercePageHeader";
export type {
    EcommercePageHeaderProps,
    EcommercePageHeaderBadgeTone,
} from "./EcommercePageHeader";

export { MetricCard } from "./MetricCard";
export type { MetricCardProps } from "./MetricCard";

export { Sparkline } from "./Sparkline";
export type { SparklineProps } from "./Sparkline";

export { EmptyTab } from "./EmptyTab";
export type { EmptyTabProps } from "./EmptyTab";
