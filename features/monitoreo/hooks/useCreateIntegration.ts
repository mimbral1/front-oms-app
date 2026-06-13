// hooks/useCreateInvoice.ts
import { useState } from "react";
import {
  fetchCreateInvoiceAPI,
  CreateInvoicePayload,
  CreateInvoiceResponse,
} from "@/api/api";

export function useCreateInvoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CreateInvoiceResponse | null>(null);
  //console.log("data que se envia: ", data);
  const sendInvoice = async (invoiceData: CreateInvoicePayload) => {
    setLoading(true);
    setError(null);
    try {
      console.log("➡ï¸‍ Payload REAL que se está enviando:", invoiceData); // ✅ esto sí es correcto
      const result = await fetchCreateInvoiceAPI(invoiceData);
      setData(result);
      console.log("Factura creada:", result);
      return result;
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("Error al crear la factura:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendInvoice, loading, error, data };
}
