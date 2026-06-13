// features/catalogo/pages/SKUs/shared/sku-core.ts
// Hook READ-only para el "core" de un SKU (catalog-service).
//
// GET catalog/products/:sku vía useFetchWithAuth (prepende URL_BASE y agrega
// headers de auth). Mapea la respuesta cruda del catalog-service a SkuCore.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useFetchWithAuth } from "@/lib/http/client";

interface CatalogProductRaw {
  Image: string | null;
  Name: string | null;
  SKU: string | null;
  Category: string | null;
  CategoryCode: string | null;
  Brand: string | null;
  CreateDate: string | null;
  DateModified: string | null;
  UserId: number | string | null;
  Status: string | null;
  Eans: string | null;
  UpdatedByName: string | null;
  UpdatedByEmail: string | null;
}

export interface SkuCore {
  sku: string;
  nombre: string;
  imagen: string | null;
  categoria: string | null;
  categoriaCodigo: string | null;
  marca: string | null;
  ean: string | null;
  status: "Activo" | "Inactivo";
  createdDate: string | null;
  modifiedDate: string | null;
  modifiedByName: string | null;
  modifiedByEmail: string | null;
}

function mapCore(r: CatalogProductRaw, fallbackSku: string): SkuCore {
  return {
    sku: r.SKU ?? fallbackSku,
    nombre: r.Name ?? "",
    imagen: r.Image ?? null,
    categoria: r.Category ?? null,
    categoriaCodigo: r.CategoryCode ?? null,
    marca: r.Brand ?? null,
    ean: r.Eans ?? null,
    status: (r.Status ?? "").toUpperCase() === "Y" ? "Activo" : "Inactivo",
    createdDate: r.CreateDate ?? null,
    modifiedDate: r.DateModified ?? null,
    modifiedByName: r.UpdatedByName ?? null,
    modifiedByEmail: r.UpdatedByEmail ?? null,
  };
}

export function useSkuCore(sku?: string) {
  // useFetchWithAuth devuelve { fetchWithAuth, token }; fetchWithAuth<T> es
  // genérico, prepende URL_BASE y ya hace response.json(). Replicamos el patrón
  // de ProductosResumenView: esperar a que haya token antes de pedir.
  const { fetchWithAuth, token } = useFetchWithAuth();
  const [core, setCore] = useState<SkuCore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sku) return;
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchWithAuth<CatalogProductRaw>(
        `catalog/products/${encodeURIComponent(sku)}`,
      );
      setCore(mapCore(raw, sku));
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el producto");
      setCore(null);
    } finally {
      setLoading(false);
    }
  }, [sku, token, fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load]);

  return { core, loading, error, reload: load };
}
