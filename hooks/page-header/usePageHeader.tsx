// src/hooks/page-header/usePageHeader.tsx
"use client";

import { useEffect } from "react";
import { useWarehouseHeader } from "@/app/context/warehouse/warehousecontext";
import { PageHeader, PageHeaderProps } from "@/components/layout/page-header";

/**
 *  Hook para registrar un header mientras la página esté montada.
 *  @param builder  Función que devuelve el <PageHeader />
 *  @param deps     Dependencias (igual que useEffect)
 */
export const usePageHeader = (
  builder: () => PageHeaderProps,
  deps: React.DependencyList
) => {
  const { setHeader } = useWarehouseHeader();

  useEffect(() => {
    setHeader(<PageHeader {...builder()} />);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps); // sólo se ejecuta cuando cambian las deps reales

  // Limpiar el header sólo al desmontar la página para evitar ciclos de updates.
  useEffect(() => {
    return () => setHeader(null);
  }, [setHeader]);
};
