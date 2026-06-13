"use client";

/* ==========================================================================
   RUTAS - TAB CARGA (contenedor)
   Mantiene el mismo header de la ruta y carga el plan de carga (load plan).
   Hoy consume el mock local de `fetchRouteLoadPlan`; queda listo para el
   endpoint real GET /routes/:routeId/load-plan sin cambios en la UI.
   ========================================================================== */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { RutasCargaTab } from "@/features/delivery/components/rutas/listadorutas/RutasCargaTab";
import {
  fetchRouteLoadPlan,
  type RouteLoadPlan,
} from "@/features/delivery/components/rutas/listadorutas/loadPlan";

export default function RutasCargaTabView({ routeId }: { routeId: string }) {
  const router = useRouter();
  const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();

  const [plan, setPlan] = useState<RouteLoadPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchRouteLoadPlan(fetchWithAuthDelivery, routeId);
        if (mounted) setPlan(result);
      } catch (err: any) {
        if (mounted) {
          setPlan(null);
          setError(
            err?.message || "No se pudo cargar el plan de carga de la ruta."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [fetchWithAuthDelivery, routeId]);

  /* Mismo set de acciones del header que el resto del detalle de ruta. */
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-5 w-5" />,
        onClick: () => console.info("Aplicar plan de carga", { routeId }),
        disabled: loading,
      },
      {
        label: "Guardar",
        variant: "success",
        icon: loading ? (
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
        ) : (
          <SaveOutlined className="h-5 w-5" />
        ),
        onClick: () => console.info("Guardar plan de carga", { routeId }),
        disabled: loading,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/delivery/rutas/listado-rutas"),
      },
    ],
    [loading, routeId, router]
  );

  usePageHeader(
    () =>
      ({
        title: (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Rutas de transporte
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {routeId || "Ruta"} - Carga
            </div>
          </div>
        ),
        action: headerActions,
      }) as unknown as PageHeaderProps,
    [headerActions, routeId]
  );

  return <RutasCargaTab plan={plan} loading={loading} error={error} />;
}
