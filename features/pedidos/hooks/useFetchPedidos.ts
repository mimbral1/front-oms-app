import { useCallback, useEffect, useState } from "react";
import { useOmsService, useFetchWithAuth } from "@/lib/http/client";
import { usePedidosStore } from "@/features/pedidos/stores/lista-pedidos";
import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import { buildEndpointUrl, type EndpointConfig } from "@/lib/filters";
import type { ApiFilters } from "@/app/fetchWithAuth/api-filtros-pedidos/filtros-pedidos";

// Si los totales del summary vienen en centavos, pon true.
// Con los ejemplos (90833, 241870) parece CLP "normal" => false.
const OMS_VALUES_IN_CENTS = false;

// Normalizadores estrictos
const S = (v: unknown, fallback: string = "--"): string =>
  (typeof v === "string" && v.trim().length > 0 ? v : fallback);

const N = (v: unknown, fallback: number = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const MONEY = (v: unknown): number => {
  const n = N(v, 0);
  return OMS_VALUES_IN_CENTS ? Math.round(n) / 100 : n;
};

type UseFetchPedidosArgs = {
  page: number;      // 1-based
  pageSize: number;  // ej: 6
};

type UseFetchPedidosResult = {
  pedidos: Pedido[];
  total: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
};

export function useFetchPedidos({ page, pageSize }: UseFetchPedidosArgs): UseFetchPedidosResult {
  const { listOrders } = useOmsService();
  const { setPedidos } = usePedidosStore();

  const [pedidos, setLocalPedidos] = useState<Pedido[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await listOrders({ page, pageSize });
      const rows = Array.isArray(resp?.data) ? resp.data : [];
      const mapped = rows.map((row) => mapSummaryRowToPedido(row));
      setLocalPedidos(mapped);
      setTotal(N(resp?.total, mapped.length));
      setPedidos(mapped); // mantener store sincronizado
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
    // ojo: listOrders está memoizado en el hook del cliente; evitamos loops
  }, [page, pageSize, setPedidos]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { pedidos, total, isLoading, error, refetch: fetchData };
}

// ====== Mapeo SUMMARY -> Pedido ======
function mapTipoEntrega(tipo?: string): string {
  // Ajuste visual para la etiqueta de la UI según tu referencia
  const t = (tipo || "").toLowerCase();
  if (t === "residential") return "Express";
  if (t === "pickup") return "Retiro en sucursal";
  return tipo ?? "--";
}

function mapSummaryRowToPedido(row: any, searchedId?: string): Pedido {
  // Estructura del summary:
  // {
  //   datosPedido{ pedido, orderId, createdAt, seller },
  //   datosCliente{ nombre, correo, celular },
  //   datosEntrega{ tipoEntrega, direccion, fechaEntrega, empresaDelivery },
  //   picking: [{ producto, item, cantidad }],
  //   totales{ total, tipoPago },
  //   estado{ status }
  // }

  const dp = row?.datosPedido ?? {};
  const dc = row?.datosCliente ?? {};
  const de = row?.datosEntrega ?? {};
  const pk = row?.picking ?? {};
  const tt = row?.totales ?? {};
  const st = row?.estado ?? {};
  const pedidoRef = S(dp?.pedido, "--");
  const orderIdText = S(dp?.orderId != null ? String(dp.orderId) : "", "--");
  const searched = String(searchedId ?? "").trim();
  const normalizedSearch = searched.toLowerCase();
  const isSearchingByExternalPackageId =
    normalizedSearch.length > 0 &&
    normalizedSearch !== pedidoRef.trim().toLowerCase() &&
    normalizedSearch !== orderIdText.trim().toLowerCase();

  // Pedido (columna ID): 
  // - Primera línea: "REC #..." → usamos dp.pedido (cadena grande)
  // - Debajo: orderId
  // - Debajo: createdAt
  // - Debajo: seller
  const pedido: Pedido = {
    id: pedidoRef,                   // 1572620561415-01
    salesChannelReferenceId: S(dp?.salesChannelReferenceId, "--"),                   // VTE-001
    folionum: orderIdText, // 1023544 (foto)
    fechaCreacion: S(dp?.createdAt, "--"),     // 27/02/2025 14:07 (foto)
    seller: S(dp?.seller, "--"),               // FizzmodQA01 (foto)

    // Cliente: "déjalo como está" (según tu instrucción)
    cliente: {
      nombre: S(dc?.nombre, "--"),
      email: S(dc?.correo, "--"),
      rut: S(dc?.rut, "--"),                               // summary no trae RUT
      telefono: S(dc?.celular, "--"),
      direccion: "--",
    },

    // Entrega (según tu mapeo)
    entrega: {
      // exxe → empresaDelivery
      transportista: S(de?.empresaDelivery, "--"),
      // Express → tipoEntrega (residential → "Express")
      type: mapTipoEntrega(S(de?.tipoEntrega, "--")),
      direccion: S(de?.direccion, "--"),
      // Palermo → dirección (mostramos completa por ahora)
      almacen: "--",
      distance: "--",
      whscode: S(de?.whscode, "--")
    },

    // Fechas de entrega
    fechaEntrega: S(de?.fechaEntrega, "--"),

    picking: {
      items: N(pk?.items, 0),
      unidades: N(pk?.unidades, 0),
      status: S(pk?.status, ""),
    },

    // Totales
    totales: {
      total: MONEY(tt?.total),
      metodo: tt.tipoPago,
      documento: tt.tipoDocumento
    },

    // Estado (badge)
    estado: st.status || "--",

    // Prioridad
    prioridad: 0,
    canal: "",
    direccion: "",
    docentry: 0,
    docnum: 0,
    u_ref1: null,
    slpname: null,
    externalPackageId: dp?.externalPackageId ? String(dp.externalPackageId) : null,
    showExternalPackageId: isSearchingByExternalPackageId,
    orderStatusID: 0,
    paymentMethodID: null,
    tipoDocumento: "",
    deliveryTypeID: null,
    salesChannelID: null,
    integrationError: null,
    INTEGRATION_STATUS: ""
  }

  return pedido;
}

function mapOmsStatus(code?: string): string {
  if (!code) return "Pedido Recibido";
  const MAP: Record<string, string> = {
    NUEVO: "Pedido Recibido",
    // agrega aquí el resto cuando estén definidos:
    // PICKING: "En picking",
    // PACKING: "En packing",
    // DELIVERED: "Entregado",
    // CANCELLED: "Cancelado",
  };
  return MAP[code] ?? code;
}

export type UseFetchPedidosOmsArgs = {
  page: number;
  pageSize: number;
  filters?: ApiFilters;
};

export function useFetchPedidosOms({
  page,
  pageSize,
  filters,
}: UseFetchPedidosOmsArgs) {
  const { setPedidos } = usePedidosStore();
  const { fetchWithAuth } = useFetchWithAuth();  // 👈 aquí traemos el Bearer
  const [pedidos, setLocalPedidos] = useState<Pedido[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const filterKey = JSON.stringify(filters ?? {});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpointConfig: EndpointConfig<ApiFilters> = {
        path: "oms-service/orders/summary",
        queryMapper: (activeFilters) => activeFilters,
        pagination: {
          page,
          pageSize,
        },
      };

      const url = buildEndpointUrl(endpointConfig, filters ?? ({} as ApiFilters));

      // aquí ya va con Authorization: Bearer <token> y x-plataforma-id
      const resp = await fetchWithAuth<any>(url, { method: "GET" });

      const rows = Array.isArray(resp?.data) ? resp.data : [];
      const mapped = rows.map((row: any) => mapSummaryRowToPedido(row, String(filters?.id ?? "")));

      setLocalPedidos(mapped);
      setTotal(
        Number.isFinite((resp as any)?.total)
          ? (resp as any).total
          : mapped.length
      );
      setPedidos(mapped);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterKey, filters, fetchWithAuth, setPedidos]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { pedidos, total, isLoading, error, refetch: fetchData };
}
