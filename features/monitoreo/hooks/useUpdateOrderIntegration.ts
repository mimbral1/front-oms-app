// hooks/useUpdateOrderIntegration.ts
"use client";

import { useState } from "react";
import {
  updateOrderAPI,
  UpdateOrderPayload,
  UpdateOrderResponse,
  reprocessOrderAPI,
  ReprocessOrderResponse,
} from "@/api/api";

/** Devuelve ambos resultados: PATCH y luego POST /reprocess */
export function useUpdateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patchData, setPatchData] = useState<UpdateOrderResponse | null>(null);
  const [reprocessData, setReprocessData] =
    useState<ReprocessOrderResponse | null>(null);

  /** Actualiza el pedido y, si todo va bien, lo reprocesa */
  const updateAndReprocess = async (
    orderId: string | number,
    changes: UpdateOrderPayload
  ) => {
    setLoading(true);
    setError(null);
    try {
      /* 1ï¸‍⃣  PATCH de los datos editables */
      console.log("OrderID: ", orderId);
      const patchRes = await updateOrderAPI(orderId, changes);
      setPatchData(patchRes);

      /* 2ï¸‍⃣  Sólo si la API confirma éxito lanzamos el reproceso */
      console.log("patchRes.success: ", patchRes);
      if (patchRes.message == "Orden actualizada") {
        const reproRes = await reprocessOrderAPI(orderId);
        setReprocessData(reproRes);
        return { patch: patchRes, reprocess: reproRes };
      }

      /* Si no hubo éxito, devolvemos sólo la respuesta del PATCH */
      return { patch: patchRes, reprocess: null };
    } catch (err: any) {
      setError(err.message ?? "Error desconocido");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateAndReprocess,
    loading,
    error,
    patchData,
    reprocessData,
  };
}
