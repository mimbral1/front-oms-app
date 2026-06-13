// features/catalogo/pages/plataforma-ecommerce/shared/dashboard/base/index.ts

export { DashboardView } from "./views/DashboardView";

export { useDashboard } from "./hooks/useDashboard";
export type { UseDashboardReturn } from "./hooks/useDashboard";

export { useDashboardApi } from "./api/dashboard-api";
export type { UseDashboardApi } from "./api/dashboard-api";

export type {
    DashboardKpis,
    DashboardBatch,
    DashboardProduct,
    DashboardResponse,
} from "./types/dashboard-types";
