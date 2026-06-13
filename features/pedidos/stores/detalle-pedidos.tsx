import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Order,
  OrderItemsState,
  ShipmentsState,
  HistoryState,
  DetallePedidoStore,
  Bulto,
  BultosState,
  Shipment,
} from "@/features/pedidos/types/detalle-pedido";

interface IssueSummary {
  datosPedido?: {
    u_ref1?: string | null;
  };
}

interface StoreChange {
  location: string;
  inventory: string;
  transporter: string;
  scheduledDates: {
    start: string;
    end: string;
  };
  schedule: string;
  type: string;
  useLastAddress: boolean;
}

interface OrderState {
  id?: string;
  status?: string;
  store?: {
    location: string;
    inventory: string;
    transporter: string;
    scheduledDates: {
      start: string;
      end: string;
    };
    schedule: string;
    type: string;
  };
}

interface OrderStore {
  order: OrderState;
  updateStore: (changes: StoreChange) => void;
  updateOrderStatus: (status: string) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  order: {},
  updateStore: (changes) =>
    set((state) => ({
      order: {
        ...state.order,
        store: {
          location: changes.location,
          inventory: changes.inventory,
          transporter: changes.transporter,
          scheduledDates: changes.scheduledDates,
          schedule: changes.schedule,
          type: changes.type,
        },
      },
    })),
  updateOrderStatus: (status) =>
    set((state) => ({
      order: {
        ...state.order,
        status,
      },
    })),
}));

// Store para los pedidos
interface OrdersState {
  orders: { [key: string]: Order };
  isLoading: boolean;
  updateOrderStatus: (orderId: string, status: string) => void;
  initializeOrder: (order: Order) => void;
  setLoading: (loading: boolean) => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: {},
      isLoading: false,
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: {
            ...state.orders,
            [orderId]: {
              ...state.orders[orderId],
              status,
            },
          },
        })),
      initializeOrder: (order) =>
        set((state) => {
          // Si ya existe el pedido y tiene un estado, mantenerlo
          const existingOrder = state.orders[order.id];
          return {
            orders: {
              ...state.orders,
              [order.id]: {
                ...order,
                status: existingOrder?.status || order.status,
              },
            },
          };
        }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "orders-storage",
      version: 1,
    }
  )
);

// Store para los items del pedido
export const useOrderItemsStore = create<OrderItemsState>()((set) => ({
  items: [],
  isLoading: false,
  error: null,
  setItems: (items) => set({ items }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export const useShipmentsStore = create<ShipmentsState>()((set) => ({
  /* ---------- state ---------- */
  shipments: [],
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,

  /* ---------- actions ---------- */
  setShipments: (shipments: Shipment[], { page = 1, totalPages = 1 } = {}) =>
    set({ shipments, page, totalPages }),

  setPage: (page) => set({ page }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export const useHistoryStore = create<HistoryState>()((set) => ({
  controls: [],
  events: [],
  isLoading: false,
  error: null,
  setControls: (controls) => set({ controls }),
  setEvents: (events) => set({ events }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export const useDetallePedidoStore = create<
  DetallePedidoStore & {
    issue: IssueSummary | null;
    setIssue: (issue: IssueSummary) => void;
  }
>()(
  persist(
    (set) => ({
      pedido: null, // No iniciamos con `mockPedido`
      issue: null,
      setPedido: (pedido) => set({ pedido }),
      setIssue: (issue) => set({ issue }),
      //clearPedido: () => set({ pedido: null }),
    }),
    {
      name: "detalle-pedido-storage",
      version: 1,
    }
  )
);
export const useBultosStore = create<BultosState>((set) => ({
  bultos: [],
  isLoading: false,
  error: null,
  setBultos: (bultos: Bulto[]) => set({ bultos }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));
